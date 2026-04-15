import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRight, Package, Clock, CheckCircle, XCircle, Utensils, Star } from 'lucide-react';

const statusConfig = {
  pending: { label: '🔔 قيد المراجعة', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  preparing: { label: '👩‍🍳 قيد التحضير', color: 'bg-blue-100 text-blue-700', icon: Utensils },
  ready: { label: '✅ جاهز للاستلام', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: '📦 مكتمل', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  cancelled: { label: '❌ ملغي', color: 'bg-red-100 text-red-700', icon: XCircle },
  // للتوافق مع الطلبات القديمة
  accepted: { label: 'تم القبول', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-purple-100 text-purple-700', icon: Utensils },
};

function MyOrders() {
  const [params] = useSearchParams();
  const [phone, setPhone] = useState(params.get('phone') || '');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchOrders = async (phoneNum) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('customerPhone', '==', phoneNum)
      );
      const snap = await getDocs(q);
      const ordersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ترتيب حسب الأحدث (بدون index)
      ordersData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setOrders(ordersData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setSearched(true);
  };

  useEffect(() => {
    if (params.get('phone')) fetchOrders(params.get('phone'));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (phone) fetchOrders(phone);
  };

  // تنسيق التاريخ
  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-primary text-white py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <ArrowRight className="w-5 h-5" /> الرئيسية
          </Link>
          <h1 className="text-3xl font-bold">طلباتي 📦</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow mb-4 flex gap-2">
          <input
            type="tel"
            inputMode="numeric"
            maxLength="10"
            required
            placeholder="رقم الهاتف (0549741892)"
            value={phone}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 10) setPhone(value);
            }}
            className="flex-1 p-3 border-2 rounded-xl"
          />
          <button type="submit" className="bg-primary text-white px-6 rounded-xl font-bold">
            بحث
          </button>
        </form>

        {loading && <p className="text-center py-8">جاري التحميل...</p>}

        {searched && !loading && orders.length === 0 && (
          <div className="bg-white p-8 rounded-2xl text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد طلبات بهذا الرقم</p>
          </div>
        )}

        <div className="space-y-3">
          {orders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const canRate = order.status === 'completed' && !order.rated;

            return (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow">
                <div className="flex gap-3">
                  {order.dishImage ? (
                    <img
                      src={order.dishImage}
                      alt={order.dishName}
                      className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                      🍽️
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-dark">{order.dishName || 'طبق'}</h3>
                    <p className="text-sm text-gray-600">👩‍🍳 {order.cookName}</p>
                    <p className="text-sm text-gray-600">الكمية: {order.quantity || 1}</p>
                    {order.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">📅 {formatDate(order.createdAt)}</p>
                    )}

                    <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {order.totalPrice > 0 && (
                        <span className="text-primary font-bold">{order.totalPrice} دج</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* زر التقييم للطلبات المكتملة وغير المقيّمة */}
                {canRate && (
                  <Link
                    to={`/rate/${order.id}`}
                    className="mt-3 w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2 px-4 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Star className="w-5 h-5" />
                    قيّم طلبك الآن
                  </Link>
                )}

                {/* إذا تم التقييم */}
                {order.status === 'completed' && order.rated && (
                  <div className="mt-3 text-center text-sm text-green-600 font-medium">
                    ✅ تم التقييم — شكراً لك!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MyOrders;