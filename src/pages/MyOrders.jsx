import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRight, Package, Clock, CheckCircle, XCircle, Utensils } from 'lucide-react';

const statusConfig = {
  pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  accepted: { label: 'تم القبول', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-purple-100 text-purple-700', icon: Utensils },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: XCircle },
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
        where('customerPhone', '==', phoneNum),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
            return (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow flex gap-3">
                <img src={order.dishImage} alt={order.dishName} className="w-20 h-20 object-cover rounded-xl" />
                <div className="flex-1">
                  <h3 className="font-bold text-dark">{order.dishName}</h3>
                  <p className="text-sm text-gray-600">👩‍🍳 {order.cookName}</p>
                  <p className="text-sm text-gray-600">الكمية: {order.quantity}</p>
                  <div className="flex justify-between items-center mt-2">
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
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MyOrders;