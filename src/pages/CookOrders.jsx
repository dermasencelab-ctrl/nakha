import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, query, where, onSnapshot, doc, updateDoc, getDoc,
  addDoc, serverTimestamp, increment, runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COMMISSION_RATE, FOUNDING_MEMBERS, MAX_NEGATIVE_BALANCE } from '../config/settings';
import { Phone, PhoneOff, Lock, Bell, BellOff } from 'lucide-react';
import { useOrderNotifications } from '../hooks/useOrderNotifications';

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

  const { newCount, clearNewCount, soundEnabled, toggleSound } =
    useOrderNotifications(userProfile?.cookId);

  // Auto-switch to pending tab and clear badge when new orders arrive
  const prevNewCount = useRef(0);
  useEffect(() => {
    if (newCount > prevNewCount.current) {
      setActiveTab('pending');
    }
    prevNewCount.current = newCount;
  }, [newCount]);

  const tabs = [
    { value: 'pending', label: '🔔 جديدة', color: 'orange' },
    { value: 'preparing', label: '👩‍🍳 قيد التحضير', color: 'blue' },
    { value: 'ready', label: '✅ جاهزة', color: 'green' },
    { value: 'completed', label: '📦 مكتملة', color: 'gray' },
    { value: 'cancelled', label: '❌ ملغاة', color: 'red' },
  ];

  useEffect(() => {
    if (!userProfile?.cookId) return;

    const q = query(
      collection(db, 'orders'),
      where('cookId', '==', userProfile.cookId)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to orders:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userProfile]);

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

      if (newStatus === 'preparing' && userProfile?.cookId) {
        const cookRef = doc(db, 'cooks', userProfile.cookId);
        const cookSnap = await getDoc(cookRef);
        const cookData = cookSnap.data() || {};
        const balance = cookData.balance || 0;
        if (balance <= 0) {
          alert('لا يمكن قبول طلبات جديدة حالياً. يُرجى شحن الرصيد أولاً.');
          setActionLoading(null);
          return;
        }
      }

      if (newStatus === 'ready' && userProfile?.cookId) {
        const totalPrice = order.totalPrice || calculateTotal(order);
        const cookRef = doc(db, 'cooks', userProfile.cookId);

        // Use a transaction to prevent race conditions on balance deduction
        let txLog = null;
        await runTransaction(db, async (transaction) => {
          const cookSnap = await transaction.get(cookRef);
          const cookData = cookSnap.data() || {};

          const balanceBefore = cookData.balance || 0;
          const freeOrdersRemaining = cookData.freeOrdersRemaining || 0;
          const isFoundingMember = cookData.isFoundingMember || false;

          const isEligibleForFreeOrder =
            isFoundingMember &&
            freeOrdersRemaining > 0 &&
            totalPrice <= FOUNDING_MEMBERS.maxFreeOrderAmount;

          if (isEligibleForFreeOrder) {
            transaction.update(cookRef, {
              freeOrdersRemaining: increment(-1),
              freeOrdersUsed: increment(1),
              totalOrders: increment(1),
            });
            txLog = { type: 'free_order', amount: 0, balanceBefore, balanceAfter: balanceBefore };
          } else {
            const commission = Math.round(totalPrice * COMMISSION_RATE);
            const balanceAfter = balanceBefore - commission;

            if (balanceBefore <= 0) {
              throw new Error('INSUFFICIENT_BALANCE');
            }
            if (balanceAfter < MAX_NEGATIVE_BALANCE) {
              throw new Error('INSUFFICIENT_BALANCE');
            }

            transaction.update(cookRef, {
              balance: balanceAfter,
              totalCommission: increment(commission),
              totalOrders: increment(1),
            });
            txLog = { type: 'commission', amount: commission, balanceBefore, balanceAfter };
          }
        });

        if (txLog) {
          await addDoc(collection(db, 'transactions'), {
            cookId: userProfile.cookId,
            orderId,
            orderTotal: totalPrice,
            description: txLog.type === 'free_order'
              ? `طلب مجاني #${orderId.slice(0, 8).toUpperCase()}`
              : `رسوم طلب #${orderId.slice(0, 8).toUpperCase()}`,
            ...txLog,
            createdAt: serverTimestamp(),
          });
        }
      }

      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        ...(newStatus === 'ready' ? { readyAt: serverTimestamp() } : {}),
        ...(newStatus === 'completed' ? { completedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      });
      // onSnapshot handles UI refresh automatically
    } catch (error) {
      console.error('Error updating order:', error);
      if (error.message === 'INSUFFICIENT_BALANCE') {
        alert('لا يمكن إتمام هذه العملية. يُرجى شحن الرصيد أولاً.');
      } else {
        alert('حدث خطأ أثناء تحديث الطلب');
      }
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
    <div className="min-h-screen bg-[#FFF5E6] pb-28" dir="rtl">
      {/* Header */}
      <header className="sticky top-16 z-20 bg-[#FFF5E6]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/cook/dashboard" className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition">
            <Bell className="w-4 h-4 text-stone-700" strokeWidth={2.4} style={{ display: 'none' }} />
            <span className="text-stone-700 font-bold text-lg leading-none">←</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-stone-800 leading-none">الطلبات الواردة</h1>
            <p className="text-xs text-stone-500 mt-0.5">إدارة طلبات زبائنكِ</p>
          </div>
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'إيقاف إشعارات الصوت' : 'تفعيل إشعارات الصوت'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
              soundEnabled ? 'bg-orange-100 text-orange-600' : 'bg-white text-stone-400 shadow-sm'
            }`}
          >
            {soundEnabled ? <Bell className="w-4 h-4" strokeWidth={2.4} /> : <BellOff className="w-4 h-4" strokeWidth={2.4} />}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-2">

        {/* بانر طلب جديد */}
        {newCount > 0 && (
          <button
            onClick={() => { setActiveTab('pending'); clearNewCount(); }}
            className="w-full mb-4 flex items-center justify-between gap-3 bg-gradient-to-l from-orange-500 to-red-500 text-white px-4 py-3 rounded-2xl shadow-lg shadow-orange-500/30 animate-pulse active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <span className="font-black text-sm">
                {newCount === 1 ? 'طلب جديد وصل!' : `${newCount} طلبات جديدة وصلت!`}
              </span>
            </div>
            <span className="text-xs font-bold opacity-90">عرض الطلبات ←</span>
          </button>
        )}

        <div className="overflow-x-auto no-scrollbar mb-4">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button key={tab.value} onClick={() => {
                setActiveTab(tab.value);
                if (tab.value === 'pending') clearNewCount();
              }}
                className={`flex-shrink-0 flex items-center gap-1.5 py-2 px-3.5 rounded-full font-bold text-xs transition whitespace-nowrap active:scale-95 ${
                  activeTab === tab.value
                    ? tab.color === 'orange' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : tab.color === 'blue' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : tab.color === 'green' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : tab.color === 'red' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-stone-600 text-white shadow-lg shadow-stone-500/30'
                    : 'bg-white text-stone-700 shadow-sm hover:bg-orange-50'
                }`}
              >
                <span className="relative">
                  {tab.label}
                  {tab.value === 'pending' && newCount > 0 && (
                    <span className="absolute -top-2 -left-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                      {newCount}
                    </span>
                  )}
                </span>
                {counts[tab.value] > 0 && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${activeTab === tab.value ? 'bg-white/25' : 'bg-orange-100 text-orange-700'}`}>
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-500 font-bold">جارٍ التحميل...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-stone-500 font-semibold text-sm">
              {activeTab === 'pending' && 'لا توجد طلبات جديدة حالياً'}
              {activeTab === 'preparing' && 'لا توجد طلبات قيد التحضير'}
              {activeTab === 'ready' && 'لا توجد طلبات جاهزة'}
              {activeTab === 'completed' && 'لا توجد طلبات مكتملة بعد'}
              {activeTab === 'cancelled' && 'لا توجد طلبات ملغاة'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                {/* رأس البطاقة */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-stone-50 to-white border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-500">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[11px] text-stone-500">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'ready' ? 'bg-green-100 text-green-700' :
                    order.status === 'completed' ? 'bg-stone-100 text-stone-600' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status === 'pending' ? '🔔 جديد' : order.status === 'preparing' ? '👩‍🍳 تحضير' :
                     order.status === 'ready' ? '✅ جاهز' : order.status === 'completed' ? '📦 مكتمل' : '❌ ملغي'}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* معلومات الزبون */}
                  <div className="bg-orange-50 rounded-2xl p-3 space-y-1.5">
                    <p className="text-[11px] font-bold text-stone-500 mb-2">👤 معلومات الزبون</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">الاسم:</span>
                      <span className="font-extrabold text-stone-800">{order.customerName || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">الهاتف:</span>
                      {shouldShowPhone(order.status) ? (
                        <a href={`tel:${order.customerPhone}`} className="font-extrabold text-green-600 flex items-center gap-1" dir="ltr">
                          <Phone className="w-3.5 h-3.5" strokeWidth={2.4} />
                          {order.customerPhone || '-'}
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-stone-400 font-bold" dir="ltr">
                          <Lock className="w-3.5 h-3.5" strokeWidth={2.4} />
                          {maskPhone(order.customerPhone)}
                        </span>
                      )}
                    </div>
                    {order.orderType && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500">نوع الطلب:</span>
                        <span className="font-bold text-stone-700">{order.orderType === 'instant' ? '⚡ فوري' : '📅 مسبق'}</span>
                      </div>
                    )}
                    {order.orderType === 'scheduled' && order.scheduledDate && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500">الموعد:</span>
                        <span className="font-bold text-stone-700">{order.scheduledDate} {order.scheduledTime}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="pt-1 border-t border-orange-100">
                        <p className="text-[11px] text-stone-500 mb-0.5">ملاحظات:</p>
                        <p className="text-xs text-stone-700 font-semibold">{order.notes}</p>
                      </div>
                    )}
                    {!shouldShowPhone(order.status) && order.status !== 'cancelled' && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-center gap-2">
                        <PhoneOff className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" strokeWidth={2.4} />
                        <p className="text-[11px] text-amber-700">
                          {order.status === 'pending' ? 'رقم الهاتف يظهر عند جاهزية الطلب' : 'رقم الهاتف يظهر عند تأكيد الجاهزية'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* الأطباق */}
                  <div>
                    <p className="text-[11px] font-bold text-stone-500 mb-2">🍽️ الأطباق المطلوبة</p>
                    <div className="space-y-1.5">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-stone-50 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-800 text-sm">{item.name}</span>
                              <span className="text-stone-500 text-xs">× {item.quantity}</span>
                              {item.unit && <span className="text-stone-400 text-xs">({unitLabels[item.unit] || item.unit})</span>}
                            </div>
                            <span className="font-extrabold text-orange-600 text-sm">{item.price * item.quantity} دج</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between items-center bg-stone-50 rounded-xl px-3 py-2">
                          <span className="font-bold text-stone-800 text-sm">{order.dishName || 'طبق'} × {order.quantity || 1}</span>
                          <span className="font-extrabold text-orange-600 text-sm">{order.totalPrice || 0} دج</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-stone-100">
                      <span className="text-xs font-bold text-stone-600">المجموع:</span>
                      <span className="text-lg font-black text-orange-600">{calculateTotal(order)} دج</span>
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                    {order.status === 'pending' && (
                      <>
                        <button onClick={() => updateOrderStatus(order.id, 'preparing')}
                          disabled={actionLoading === order.id}
                          className="flex-1 bg-gradient-to-l from-blue-500 to-blue-600 text-white py-3 px-4 rounded-2xl font-extrabold text-sm hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30 disabled:opacity-50">
                          {actionLoading === order.id ? 'جارٍ التحديث...' : '👩‍🍳 قبول وبدء التحضير'}
                        </button>
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          disabled={actionLoading === order.id}
                          className="bg-red-50 text-red-700 py-3 px-4 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all active:scale-[0.98] border border-red-200 disabled:opacity-50">
                          ❌ رفض
                        </button>
                      </>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => { if (confirm('هل تم الانتهاء من تحضير الطلب؟')) updateOrderStatus(order.id, 'ready'); }}
                        disabled={actionLoading === order.id}
                        className="flex-1 bg-gradient-to-l from-green-500 to-green-600 text-white py-3 px-4 rounded-2xl font-extrabold text-sm hover:from-green-600 hover:to-green-700 transition-all active:scale-[0.98] shadow-lg shadow-green-500/30 disabled:opacity-50">
                        {actionLoading === order.id ? 'جارٍ التحديث...' : '✅ الطلب جاهز للتسليم'}
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <div className="w-full space-y-2">
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-3.5 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-green-700 font-bold">📱 رقم هاتف الزبون:</p>
                            <a href={`tel:${order.customerPhone}`} className="text-xl font-black text-green-700 hover:underline" dir="ltr">
                              {order.customerPhone}
                            </a>
                          </div>
                          <a href={`tel:${order.customerPhone}`}
                            className="bg-gradient-to-l from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl font-extrabold text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 flex items-center gap-2">
                            <Phone className="w-4 h-4" strokeWidth={2.4} />
                            اتصال
                          </a>
                        </div>
                        <button onClick={() => updateOrderStatus(order.id, 'completed')}
                          disabled={actionLoading === order.id}
                          className="w-full bg-stone-800 hover:bg-stone-900 text-white py-3 px-4 rounded-2xl font-extrabold text-sm transition-all active:scale-[0.98] disabled:opacity-50">
                          {actionLoading === order.id ? 'جارٍ التحديث...' : '📦 تأكيد التسليم'}
                        </button>
                      </div>
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled') && (
                      <p className="text-stone-500 text-xs font-semibold w-full text-center py-2">
                        {order.status === 'completed' ? '✅ تم تسليم الطلب بنجاح' : '❌ تم إلغاء الطلب'}
                      </p>
                    )}
                  </div>
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