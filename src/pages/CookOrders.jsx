import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc,
  addDoc, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COMMISSION_RATE, FOUNDING_MEMBERS } from '../config/settings';
import { Phone, PhoneOff, Lock } from 'lucide-react';

const unitLabels = {
  plate: 'طبق', kg: 'كغ', box: 'علبة',
  piece: 'حبة', liter: 'لتر', dozen: 'دزينة',
};

const CookOrders = () => {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  const tabs = [
    { value: 'pending', label: '🔔 جديدة', color: 'orange' },
    { value: 'preparing', label: '👩‍🍳 قيد التحضير', color: 'blue' },
    { value: 'ready', label: '✅ جاهزة', color: 'green' },
    { value: 'completed', label: '📦 مكتملة', color: 'gray' },
    { value: 'cancelled', label: '❌ ملغاة', color: 'red' },
  ];

  const fetchOrders = async () => {
    if (!userProfile?.cookId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), where('cookId', '==', userProfile.cookId));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      ordersData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [userProfile]);

  const shouldShowPhone = (status) => {
    return status === 'ready' || status === 'completed';
  };

  const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return '**********';
    return phone.slice(0, 2) + '** *** ' + phone.slice(-2);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) throw new Error('الطلب غير موجود');

      if (newStatus === 'ready' && userProfile?.cookId) {
        const totalPrice = order.totalPrice || calculateTotal(order);
        const cookRef = doc(db, 'cooks', userProfile.cookId);
        const cookSnap = await getDoc(cookRef);
        const cookData = cookSnap.data();

        const balanceBefore = cookData?.balance || 0;
        const freeOrdersRemaining = cookData?.freeOrdersRemaining || 0;
        const isFoundingMember = cookData?.isFoundingMember || false;

        const isEligibleForFreeOrder =
          isFoundingMember &&
          freeOrdersRemaining > 0 &&
          totalPrice <= FOUNDING_MEMBERS.maxFreeOrderAmount;

        if (isEligibleForFreeOrder) {
          await updateDoc(cookRef, {
            freeOrdersRemaining: increment(-1),
            freeOrdersUsed: increment(1),
            totalOrders: increment(1),
          });
          await addDoc(collection(db, 'transactions'), {
            cookId: userProfile.cookId, type: 'free_order', amount: 0,
            orderId, orderTotal: totalPrice,
            description: `طلب مجاني #${orderId.slice(0, 8).toUpperCase()}`,
            balanceBefore, balanceAfter: balanceBefore, createdAt: serverTimestamp(),
          });
        } else {
          const commission = Math.round(totalPrice * COMMISSION_RATE);
          const balanceAfter = balanceBefore - commission;
          await updateDoc(cookRef, {
            balance: balanceAfter, totalCommission: increment(commission), totalOrders: increment(1),
          });
          await addDoc(collection(db, 'transactions'), {
            cookId: userProfile.cookId, type: 'commission', amount: commission,
            orderId, orderTotal: totalPrice,
            description: `رسوم طلب #${orderId.slice(0, 8).toUpperCase()}`,
            balanceBefore, balanceAfter, createdAt: serverTimestamp(),
          });
        }
      }

      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        ...(newStatus === 'ready' ? { readyAt: serverTimestamp() } : {}),
        ...(newStatus === 'completed' ? { completedAt: serverTimestamp() } : {}),
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

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ar-DZ', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const calculateTotal = (order) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
    }
    return order.totalPrice || 0;
  };

  const filteredOrders = orders.filter((order) => order.status === activeTab);
  const counts = tabs.reduce((acc, tab) => {
    acc[tab.value] = orders.filter((o) => o.status === tab.value).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link to="/cook/dashboard" className="text-orange-600 text-sm hover:underline mb-2 inline-block">
            ← العودة إلى لوحة التحكم
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">الطلبات الواردة 📋</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-6 p-2 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 py-3 px-4 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === tab.value ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={activeTab === tab.value ? {
                backgroundColor: tab.color === 'orange' ? '#ea580c' : tab.color === 'blue' ? '#2563eb' :
                  tab.color === 'green' ? '#16a34a' : tab.color === 'gray' ? '#4b5563' : '#dc2626',
              } : {}}>
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className={`mr-2 px-2 py-0.5 rounded-full text-sm ${activeTab === tab.value ? 'bg-white text-gray-800' : 'bg-gray-200'}`}>
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">جارٍ التحميل...</div>
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
              <div key={order.id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">رقم الطلب</p>
                    <p className="font-bold text-gray-800" dir="ltr">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-sm text-gray-600">📅 {formatDate(order.createdAt)}</div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-gray-700 mb-2">👤 معلومات الزبون</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">الاسم:</span>{' '}
                      <span className="font-medium">{order.customerName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">الهاتف:</span>{' '}
                      {shouldShowPhone(order.status) ? (
                        <a href={`tel:${order.customerPhone}`}
                          className="font-medium text-green-600 hover:underline inline-flex items-center gap-1" dir="ltr">
                          <Phone className="w-4 h-4" />
                          {order.customerPhone || '-'}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium" dir="ltr">
                          <Lock className="w-4 h-4" />
                          {maskPhone(order.customerPhone)}
                        </span>
                      )}
                    </div>
                    {order.orderType && (
                      <div>
                        <span className="text-gray-500">نوع الطلب:</span>{' '}
                        <span className="font-medium">
                          {order.orderType === 'instant' ? '⚡ فوري' : '📅 مسبق'}
                        </span>
                      </div>
                    )}
                    {order.orderType === 'scheduled' && order.scheduledDate && (
                      <div>
                        <span className="text-gray-500">الموعد:</span>{' '}
                        <span className="font-medium">{order.scheduledDate} {order.scheduledTime}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">ملاحظات:</span>{' '}
                        <span className="font-medium">{order.notes}</span>
                      </div>
                    )}
                  </div>

                  {!shouldShowPhone(order.status) && order.status !== 'cancelled' && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
                      <PhoneOff className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <p className="text-xs text-yellow-700">
                        {order.status === 'pending'
                          ? 'سيتم عرض رقم هاتف الزبون بعد الانتهاء من تحضير الطلب'
                          : 'سيتم عرض رقم هاتف الزبون عند تأكيد جاهزية الطلب'
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-gray-700 mb-2">🍽️ الأطباق المطلوبة</h4>
                  <div className="space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500 text-sm mr-2">
                              × {item.quantity}
                              {item.unit && (
                                <span className="text-gray-400 mr-1">({unitLabels[item.unit] || item.unit})</span>
                              )}
                            </span>
                          </div>
                          <span className="font-bold text-orange-600">{item.price * item.quantity} دج</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2">
                        <div>
                          <span className="font-medium">{order.dishName || 'طبق'}</span>
                          <span className="text-gray-500 text-sm mr-2">× {order.quantity || 1}</span>
                        </div>
                        <span className="font-bold text-orange-600">{order.totalPrice || 0} دج</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-700">المجموع:</span>
                    <span className="text-xl font-bold text-orange-600">{calculateTotal(order)} دج</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => updateOrderStatus(order.id, 'preparing')}
                        disabled={actionLoading === order.id}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
                        {actionLoading === order.id ? 'جارٍ التحديث...' : '👩‍🍳 قبول الطلب وبدء التحضير'}
                      </button>
                      <button onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        disabled={actionLoading === order.id}
                        className="bg-red-100 text-red-700 py-3 px-4 rounded-lg font-bold hover:bg-red-200 transition disabled:opacity-50">
                        ❌ رفض الطلب
                      </button>
                    </>
                  )}

                  {order.status === 'preparing' && (
                    <button onClick={() => {
                      if (confirm('هل تم الانتهاء من تحضير الطلب؟')) {
                        updateOrderStatus(order.id, 'ready');
                      }
                    }}
                      disabled={actionLoading === order.id}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50">
                      {actionLoading === order.id ? 'جارٍ التحديث...' : '✅ الطلب جاهز للتسليم'}
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <div className="w-full space-y-3">
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">📱 رقم هاتف الزبون:</p>
                          <a href={`tel:${order.customerPhone}`}
                            className="text-2xl font-bold text-green-700 hover:underline" dir="ltr">
                            {order.customerPhone}
                          </a>
                        </div>
                        <a href={`tel:${order.customerPhone}`}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2">
                          <Phone className="w-5 h-5" />
                          اتصال
                        </a>
                      </div>
                      <button onClick={() => updateOrderStatus(order.id, 'completed')}
                        disabled={actionLoading === order.id}
                        className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50">
                        {actionLoading === order.id ? 'جارٍ التحديث...' : '📦 تأكيد التسليم'}
                      </button>
                    </div>
                  )}

                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <p className="text-gray-500 text-sm w-full text-center py-2">
                      {order.status === 'completed' ? '✅ تم تسليم الطلب بنجاح' : '❌ تم إلغاء الطلب'}
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