import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, documentId } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Utensils,
  Star,
  Phone,
  ChefHat,
  RefreshCw,
  MessageCircle,
  TrendingUp,
  Inbox,
  Calendar,
  Search,
  Hash,
} from 'lucide-react';

// إعدادات الحالات
const statusConfig = {
  pending: {
    label: 'قيد المراجعة',
    shortLabel: 'مراجعة',
    emoji: '🔔',
    icon: Clock,
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  accepted: {
    label: 'تم القبول',
    shortLabel: 'مقبول',
    emoji: '✔️',
    icon: CheckCircle,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  preparing: {
    label: 'قيد التحضير',
    shortLabel: 'تحضير',
    emoji: '👩‍🍳',
    icon: Utensils,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  in_progress: {
    label: 'قيد التنفيذ',
    shortLabel: 'تنفيذ',
    emoji: '🔥',
    icon: Utensils,
    color: 'violet',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    dotColor: 'bg-violet-500',
  },
  ready: {
    label: 'جاهز للاستلام',
    shortLabel: 'جاهز',
    emoji: '🎉',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    dotColor: 'bg-green-500',
  },
  completed: {
    label: 'مكتمل',
    shortLabel: 'مكتمل',
    emoji: '📦',
    icon: CheckCircle,
    color: 'stone',
    bgColor: 'bg-stone-100',
    textColor: 'text-stone-700',
    borderColor: 'border-stone-200',
    dotColor: 'bg-stone-500',
  },
  cancelled: {
    label: 'ملغي',
    shortLabel: 'ملغي',
    emoji: '❌',
    icon: XCircle,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
  },
};

// التبويبات الرئيسية
const tabs = [
  { value: 'all', label: 'الكل', icon: Inbox },
  { value: 'active', label: 'نشطة', icon: TrendingUp },
  { value: 'completed', label: 'مكتملة', icon: CheckCircle },
  { value: 'cancelled', label: 'ملغية', icon: XCircle },
];

const activeStatuses = ['pending', 'accepted', 'preparing', 'in_progress', 'ready'];

function MyOrders() {
  const { userProfile, userRole } = useAuth();
  const isLoggedInCustomer = userRole === 'customer';
  const customerPhone = userProfile?.phone || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (phoneNum, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const q = query(collection(db, 'orders'), where('customerPhone', '==', phoneNum));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setRefreshing(false);
    setFetched(true);
  };

  useEffect(() => {
    if (isLoggedInCustomer && customerPhone) {
      fetchOrders(customerPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedInCustomer, customerPhone]);

  const handleRefresh = () => {
    if (customerPhone) fetchOrders(customerPhone, true);
  };

  // تصفية الطلبات حسب التبويب
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'active') {
      return orders.filter((o) => activeStatuses.includes(o.status));
    }
    if (activeTab === 'completed') {
      return orders.filter((o) => o.status === 'completed');
    }
    if (activeTab === 'cancelled') {
      return orders.filter((o) => o.status === 'cancelled');
    }
    return orders;
  }, [orders, activeTab]);

  // حساب عدد الطلبات في كل تبويب
  const tabCounts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((o) => activeStatuses.includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }),
    [orders]
  );

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString('ar-DZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============================================
  // غير مسجّل دخول — بحث برمز الطلب
  // ============================================
  if (!isLoggedInCustomer) {
    return <GuestOrderSearch formatDate={formatDate} formatTime={formatTime} />;
  }

  // ============================================
  // النتائج
  // ============================================
  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-24 md:pb-8">
      {/* ============================================ */}
      {/* Sticky Header */}
      {/* ============================================ */}
      <header className="sticky top-16 z-30 bg-[#FFF5E6]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
            >
              <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-stone-800 leading-none">طلباتي</h1>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" strokeWidth={2.3} />
                <span dir="ltr">{customerPhone}</span>
                <span className="text-stone-300 mx-1">•</span>
                {orders.length} {orders.length === 1 ? 'طلب' : 'طلبات'}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition disabled:opacity-50"
              aria-label="تحديث"
            >
              <RefreshCw
                className={`w-4 h-4 text-stone-700 ${refreshing ? 'animate-spin' : ''}`}
                strokeWidth={2.3}
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 px-4 py-2.5 max-w-3xl mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const count = tabCounts[tab.value];
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    isActive
                      ? 'bg-stone-800 text-white shadow-lg'
                      : 'bg-white text-stone-700 hover:bg-stone-50 shadow-sm'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                        isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* المحتوى */}
      {/* ============================================ */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <OrdersSkeleton />
        ) : !fetched || orders.length === 0 ? (
          <EmptyState type="no-orders" phone={customerPhone} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState type="empty-tab" activeTab={activeTab} />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, idx) => (
              <OrderCard
                key={order.id}
                order={order}
                idx={idx}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ============================================ */
/* بطاقة الطلب */
/* ============================================ */
function OrderCard({ order, idx, formatDate, formatTime }) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const canRate = order.status === 'completed' && !order.rated;
  const isActive = activeStatuses.includes(order.status);

  // رقم الطلب المختصر
  const shortId = order.id.slice(0, 8).toUpperCase();

  // عدد الأطباق
  const itemsCount = order.items?.length || 1;

 // التواصل مع خدمة العملاء (الأدمن)
  const handleContact = () => {
    const text = `السلام عليكم، بخصوص طلبي رقم #${shortId} من الطباخة "${order.cookName}".\n\nاسم الطبق: ${order.dishName || 'غير محدد'}\nالحالة: ${status.label}\n\nملاحظتي:\n`;
    const adminPhone = '213549741892'; // ← غيّر هذا لرقمك أنت كأدمن
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div
      style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
      className="animate-slide-up bg-white rounded-3xl shadow-sm overflow-hidden"
    >
      {/* Header: رقم الطلب + الحالة */}
      <div className="px-4 py-3 bg-gradient-to-l from-stone-50 to-white border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.dotColor} ${isActive ? 'animate-pulse' : ''}`} />
          <span className="text-[11px] font-bold text-stone-500">
            #{shortId}
          </span>
          {order.createdAt && (
            <>
              <span className="text-stone-300">•</span>
              <span className="text-[11px] text-stone-500 font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={2.3} />
                {formatDate(order.createdAt)} {formatTime(order.createdAt)}
              </span>
            </>
          )}
        </div>

        {/* شارة الحالة */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${status.bgColor} ${status.textColor} ${status.borderColor}`}
        >
          <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
          {status.label}
        </span>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* الصورة */}
          <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
            {order.dishImage ? (
              <img
                src={order.dishImage}
                alt={order.dishName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>

          {/* المعلومات */}
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-stone-800 text-sm leading-tight line-clamp-2 mb-1">
              {order.dishName || 'طبق'}
            </h3>
            <p className="text-xs text-stone-500 flex items-center gap-1 mb-2">
              <ChefHat className="w-3 h-3" strokeWidth={2.4} />
              <span className="font-bold text-stone-700">{order.cookName}</span>
            </p>

            {/* شريط الكمية والسعر */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="bg-stone-100 px-2 py-0.5 rounded-full font-bold text-stone-700">
                  {itemsCount > 1 ? `${itemsCount} أطباق` : `×${order.quantity || 1}`}
                </span>
              </div>
              {order.totalPrice > 0 && (
                <span className="text-base font-black text-orange-600">
                  {order.totalPrice.toLocaleString('ar-DZ')}
                  <span className="text-[10px] font-bold text-stone-400 mr-1">دج</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* قائمة الأطباق الفرعية إذا كانت موجودة */}
        {order.items && order.items.length > 1 && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <p className="text-[10px] font-bold text-stone-500 mb-1.5">تفاصيل الطلب:</p>
            <div className="space-y-1">
              {order.items.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="text-stone-600 font-semibold truncate flex-1">
                    ×{item.quantity} {item.name}
                  </span>
                  <span className="font-bold text-stone-700">
                    {(item.price * item.quantity).toLocaleString('ar-DZ')} دج
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-[10px] text-stone-400 text-center pt-1">
                  + {order.items.length - 3} أطباق أخرى
                </p>
              )}
            </div>
          </div>
        )}

        {/* Progress Timeline (للطلبات النشطة فقط) */}
        {isActive && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <OrderProgress status={order.status} />
          </div>
        )}

        {/* ملاحظات */}
        {order.notes && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <p className="text-[10px] font-bold text-stone-500 mb-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" strokeWidth={2.3} />
              ملاحظات
            </p>
            <p className="text-xs text-stone-700 bg-stone-50 rounded-xl p-2.5 leading-relaxed">
              {order.notes}
            </p>
          </div>
        )}

        {/* الأزرار السفلية */}
        <div className="mt-3 flex gap-2">
          {/* زر التقييم */}
          {canRate && (
            <Link
              to={`/rate/${order.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white py-2.5 px-3 rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
            >
              <Star className="w-4 h-4 fill-white" strokeWidth={2.4} />
              قيّم طلبك الآن
            </Link>
          )}

          {/* تم التقييم */}
          {order.status === 'completed' && order.rated && (
            <div className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 py-2.5 px-3 rounded-2xl font-bold text-xs border border-green-200">
              <CheckCircle className="w-4 h-4" strokeWidth={2.4} />
              تم التقييم — شكراً لك!
            </div>
          )}

          {/* زر التواصل مع خدمة العملاء */}
          {isActive && (
            <button
              onClick={handleContact}
              className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2.5 px-3 rounded-2xl font-bold text-xs active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2.4} />
              خدمة العملاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================ */
/* Progress Timeline - للطلبات النشطة */
/* ============================================ */
function OrderProgress({ status }) {
  const steps = [
    { key: 'pending', label: 'مراجعة' },
    { key: 'preparing', label: 'تحضير' },
    { key: 'ready', label: 'جاهز' },
  ];

  // تحديد الخطوة الحالية
  const statusOrder = {
    pending: 0,
    accepted: 1,
    preparing: 1,
    in_progress: 1,
    ready: 2,
    completed: 3,
  };
  const currentStep = statusOrder[status] ?? 0;

  return (
    <div className="flex items-center">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-orange-500 text-white animate-pulse shadow-lg shadow-orange-500/40'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3" strokeWidth={3} />
                ) : (
                  <span className="text-[10px] font-black">{idx + 1}</span>
                )}
              </div>
              <p
                className={`text-[9px] font-bold mt-1 ${
                  isCompleted
                    ? 'text-green-600'
                    : isCurrent
                    ? 'text-orange-600'
                    : 'text-stone-400'
                }`}
              >
                {step.label}
              </p>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 -mt-4 rounded-full transition-all ${
                  idx < currentStep ? 'bg-green-500' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================ */
/* Skeleton Loading */
/* ============================================ */
function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm">
          <div className="h-10 animate-shimmer" />
          <div className="p-4 flex gap-3">
            <div className="w-20 h-20 rounded-2xl animate-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-shimmer rounded-md" />
              <div className="h-3 w-1/2 animate-shimmer rounded-md" />
              <div className="h-3 w-1/3 animate-shimmer rounded-md mt-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================ */
/* حالات الفراغ */
/* ============================================ */
function EmptyState({ type, phone, activeTab }) {
  if (type === 'no-orders') {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-sm mt-4">
        <div className="w-20 h-20 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4">
          <Inbox className="w-10 h-10 text-stone-400" strokeWidth={1.8} />
        </div>
        <h3 className="text-lg font-extrabold text-stone-800 mb-2">
          لا توجد طلبات
        </h3>
        <p className="text-sm text-stone-500 mb-5 max-w-xs mx-auto">
          لم نجد طلبات مرتبطة بالرقم <span dir="ltr" className="font-bold text-stone-700">{phone}</span>
        </p>
        <Link
          to="/cooks"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition shadow-lg shadow-orange-500/30"
        >
          <ChefHat className="w-4 h-4" strokeWidth={2.4} />
          تصفّح الطباخات
        </Link>
      </div>
    );
  }

  const tabMessages = {
    active: { emoji: '🍲', title: 'لا توجد طلبات نشطة', desc: 'كل طلباتك مكتملة!' },
    completed: { emoji: '📦', title: 'لا توجد طلبات مكتملة بعد', desc: 'ستظهر هنا بعد اكتمال أول طلب' },
    cancelled: { emoji: '✨', title: 'لا توجد طلبات ملغية', desc: 'كل طلباتك سارت بسلام!' },
  };
  const msg = tabMessages[activeTab] || tabMessages.active;

  return (
    <div className="bg-white rounded-3xl p-8 text-center shadow-sm mt-4">
      <div className="text-5xl mb-3">{msg.emoji}</div>
      <h3 className="font-extrabold text-stone-800 mb-1">{msg.title}</h3>
      <p className="text-sm text-stone-500">{msg.desc}</p>
    </div>
  );
}

/* ============================================ */
/* بحث الزوار برمز الطلب */
/* ============================================ */
function GuestOrderSearch({ formatDate, formatTime }) {
  const [inputValue, setInputValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundOrder, setFoundOrder] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const rawId = inputValue.trim().replace(/^#/, '');
    if (!rawId) return;

    setSearchLoading(true);
    setFoundOrder(null);
    setSearchError('');
    setHasSearched(false);

    try {
      // Try exact document ID match first (full ID)
      const orderRef = doc(db, 'orders', rawId);
      const snap = await getDoc(orderRef);
      if (snap.exists()) {
        setFoundOrder({ id: snap.id, ...snap.data() });
      } else {
        // Short code: IDs are displayed as first 8 chars uppercased,
        // but actual Firestore IDs use mixed case. Scan all orders
        // and match the prefix case-insensitively.
        const prefix = rawId.toLowerCase();
        const allSnap = await getDocs(collection(db, 'orders'));
        const match = allSnap.docs.find(
          (d) => d.id.slice(0, prefix.length).toLowerCase() === prefix
        );
        if (match) {
          setFoundOrder({ id: match.id, ...match.data() });
        } else {
          setSearchError('لم يُعثر على طلب بهذا الرمز. تأكد من صحة الرمز وأعد المحاولة.');
        }
      }
    } catch {
      setSearchError('حدث خطأ أثناء البحث. تحقق من اتصالك بالإنترنت وحاول مجدداً.');
    }

    setSearchLoading(false);
    setHasSearched(true);
  };

  const handleRefreshOrder = async () => {
    if (!foundOrder) return;
    setSearchLoading(true);
    try {
      const snap = await getDoc(doc(db, 'orders', foundOrder.id));
      if (snap.exists()) setFoundOrder({ id: snap.id, ...snap.data() });
    } catch {
      // silent refresh failure
    }
    setSearchLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-16 z-30 bg-[#FFF8F0]/95 backdrop-blur-md border-b border-orange-100/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
          >
            <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
          </Link>
          <h1 className="text-xl font-extrabold text-stone-800">تتبّع طلبك</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-orange-400/20 rounded-3xl blur-2xl scale-150" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/30 mx-auto">
              <Package className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-stone-800 mb-2">تتبّع حالة طلبك</h2>
          <p className="text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
            أدخل رمز طلبك للاطلاع على حالته الآنية دون الحاجة لتسجيل دخول
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
            <label className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.5} />
              رمز الطلب
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="مثال: #NR4RYERD"
                dir="ltr"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm font-mono font-bold text-stone-800 placeholder:text-stone-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={searchLoading || !inputValue.trim()}
                className="flex items-center gap-1.5 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
              >
                {searchLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Search className="w-4 h-4" strokeWidth={2.5} />
                )}
                بحث
              </button>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              رمز الطلب مذكور في رسالة تأكيد الطلب. يبدأ عادةً بـ #
            </p>
          </div>
        </form>

        {/* Loading skeleton */}
        {searchLoading && !foundOrder && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="h-10 animate-shimmer" />
            <div className="p-4 flex gap-3">
              <div className="w-20 h-20 rounded-2xl animate-shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-shimmer rounded-md" />
                <div className="h-3 w-1/2 animate-shimmer rounded-md" />
                <div className="h-3 w-1/3 animate-shimmer rounded-md mt-3" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasSearched && searchError && (
          <div className="bg-white rounded-2xl border border-red-100 p-5 text-center shadow-sm">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-extrabold text-stone-800 mb-1">لم يُعثر على الطلب</h3>
            <p className="text-sm text-stone-500 leading-relaxed">{searchError}</p>
          </div>
        )}

        {/* Found order */}
        {foundOrder && !searchLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-xs font-bold text-stone-500">نتيجة البحث</p>
              <button
                onClick={handleRefreshOrder}
                className="flex items-center gap-1 text-xs font-bold text-orange-600 active:scale-95 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.5} />
                تحديث
              </button>
            </div>
            <OrderCard
              order={foundOrder}
              idx={0}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          </div>
        )}

        {/* Divider & signup prompt */}
        {!foundOrder && (
          <div className="mt-8 pt-6 border-t border-stone-200 text-center space-y-3">
            <p className="text-xs text-stone-400">تريد عرض كل طلباتك دفعة واحدة؟</p>
            <Link
              to="/cooks"
              className="flex items-center justify-center gap-2 bg-white border-2 border-stone-200 text-stone-600 hover:border-orange-300 hover:text-orange-600 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
            >
              <ChefHat className="w-4 h-4" strokeWidth={2.3} />
              تصفّح الطباخات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;