import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const CookOrders = () => {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  // تبويبات الحالات
  const tabs = [
    { value: 'pending', label: '🔔 جديدة', color: 'orange' },
    { value: 'preparing', label: '👩‍🍳 قيد التحضير', color: 'blue' },
    { value: 'ready', label: '✅ جاهزة', color: 'green' },
    { value: 'completed', label: '📦 مكتملة', color: 'gray' },
    { value: 'cancelled', label: '❌ ملغاة', color: 'red' },
  ];

  // جلب الطلبات
  const fetchOrders = async () => {
    if (!userProfile?.cookId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('cookId', '==', userProfile.cookId)
      );
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // ترتيب حسب الأحدث
      ordersData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userProfile]);

  // تغيير حالة الطلب
  const updateOrderStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('حدث خطأ أثناء تحديث الطلب');
    } finally {
      setActionLoading(null);
    }
  };

  // تنسيق التاريخ
  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // حساب المجموع
  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
  };

  // فلترة الطلبات حسب التبويب
  const filteredOrders = orders.filter((order) => order.status === activeTab);

  // عدّاد كل حالة
  const counts = tabs.reduce((acc, tab) => {
    acc[tab.value] = orders.filter((o) => o.status === tab.value).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* الترويسة */}
        <div className="mb-6">
          <Link
            to="/cook/dashboard"
            className="text-orange-600 text-sm hover:underline mb-2 inline-block"
          >
            ← العودة للوحة التحكم
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">الطلبات الواردة 📋</h1>
        </div>

        {/* التبويبات */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-2 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 py-3 px-4 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === tab.value
                  ? `bg-${tab.color}-600 text-white`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={
                activeTab === tab.value
                  ? {
                      backgroundColor:
                        tab.color === 'orange' ? '#ea580c' :
                        tab.color === 'blue' ? '#2563eb' :
                        tab.color === 'green' ? '#16a34a' :
                        tab.color === 'gray' ? '#4b5563' :
                        '#dc2626',
                      color: 'white',
                    }
                  : {}
              }
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className={`mr-2 px-2 py-0.5 rounded-full text-sm ${
                  activeTab === tab.value ? 'bg-white text-gray-800' : 'bg-gray-200'
                }`}>
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* قائمة الطلبات */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500">
              {activeTab === 'pending' && 'لا توجد طلبات جديدة حالياً'}
              {activeTab === 'preparing' && 'لا توجد طلبات قيد التحضير'}
              {activeTab === 'ready' && 'لا توجد طلبات جاهزة'}
              {activeTab === 'completed' && 'لا توجد طلبات مكتملة بعد'}
              {activeTab === 'cancelled' && 'لا توجد طلبات ملغاة'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
              >
                {/* ترويسة الطلب */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">رقم الطلب</p>
                    <p className="font-bold text-gray-800" dir="ltr">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    📅 {formatDate(order.createdAt)}
                  </div>
                </div>

                {/* معلومات الزبون */}
                <div className="bg-orange-50 rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-gray-700 mb-2">👤 معلومات الزبون</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">الاسم:</span>{' '}
                      <span className="font-medium">{order.customerName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">الهاتف:</span>{' '}
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="font-medium text-orange-600 hover:underline"
                        dir="ltr"
                      >
                        {order.customerPhone || '-'}
                      </a>
                    </div>
                    {order.customerAddress && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">العنوان:</span>{' '}
                        <span className="font-medium">{order.customerAddress}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">ملاحظات:</span>{' '}
                        <span className="font-medium">{order.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* الأطباق المطلوبة */}
                <div className="mb-4">
                  <h4 className="font-bold text-gray-700 mb-2">🍽️ الأطباق المطلوبة</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2"
                      >
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-500 text-sm mr-2">× {item.quantity}</span>
                        </div>
                        <span className="font-bold text-orange-600">
                          {item.price * item.quantity} دج
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-700">المجموع:</span>
                    <span className="text-xl font-bold text-orange-600">
                      {calculateTotal(order.items)} دج
                    </span>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        disabled={actionLoading === order.id}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        👩‍🍳 ابدئي التحضير
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        disabled={actionLoading === order.id}
                        className="bg-red-100 text-red-700 py-2 px-4 rounded-lg font-bold hover:bg-red-200 transition disabled:opacity-50"
                      >
                        ❌ رفض
                      </button>
                    </>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      disabled={actionLoading === order.id}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      ✅ الطلب جاهز
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      disabled={actionLoading === order.id}
                      className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      📦 تم التسليم
                    </button>
                  )}

                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <p className="text-gray-500 text-sm w-full text-center py-2">
                      ✓ الطلب أُغلق
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CookOrders;