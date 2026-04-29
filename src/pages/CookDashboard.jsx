import { useState, useEffect } from 'react';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ChefHat,
  Package,
  Wallet,
  Bell,
  BellOff,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowLeft,
  Utensils,
  CheckCircle,
  Sparkles,
  Settings,
  LogOut,
  Power,
  Plus,
  ShoppingBag,
  DollarSign,
  Calendar,
  Activity,
  CalendarClock,
  UserPen,
} from 'lucide-react';

const CookDashboard = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [cookData, setCookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const { soundEnabled, toggleSound } = useOrderNotifications(userProfile?.cookId);

  // إحصائيات ديناميكية
  const [stats, setStats] = useState({
    totalDishes: 0,
    activeDishes: 0,
    pendingOrders: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthRevenue: 0,
    weekRevenue: 0,
  });

  // الطلبات الأخيرة
  const [recentOrders, setRecentOrders] = useState([]);
  // تاريخ آخر نشاط
  const [lastOrderTime, setLastOrderTime] = useState(null);

  // ============================================
  // جلب بيانات الطباخة (مع real-time)
  // ============================================
  useEffect(() => {
    if (!userProfile?.cookId) return;

    // استماع فوري لتغييرات بيانات الطباخة (للرصيد)
    const unsubCook = onSnapshot(
      doc(db, 'cooks', userProfile.cookId),
      (snapshot) => {
        if (snapshot.exists()) {
          setCookData({ id: snapshot.id, ...snapshot.data() });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to cook data:', error);
        setLoading(false);
      }
    );

    return () => unsubCook();
  }, [userProfile]);

  // ============================================
  // جلب الأطباق + إحصائيات
  // ============================================
  useEffect(() => {
    if (!userProfile?.cookId) return;

    const dishesQuery = query(
      collection(db, 'dishes'),
      where('cookId', '==', userProfile.cookId)
    );

    const unsubDishes = onSnapshot(dishesQuery, (snapshot) => {
      const dishes = snapshot.docs.map((d) => d.data());
      setStats((prev) => ({
        ...prev,
        totalDishes: dishes.length,
        activeDishes: dishes.filter((d) => d.available !== false).length,
      }));
    });

    return () => unsubDishes();
  }, [userProfile]);

  // ============================================
  // جلب الطلبات + إحصائيات متقدمة (real-time)
  // ============================================
  useEffect(() => {
    if (!userProfile?.cookId) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('cookId', '==', userProfile.cookId)
    );

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // الوقت الحالي
      const now = Date.now() / 1000;
      const todayStart = new Date().setHours(0, 0, 0, 0) / 1000;
      const weekAgo = now - 7 * 24 * 60 * 60;
      const monthAgo = now - 30 * 24 * 60 * 60;

      const pending = orders.filter((o) => o.status === 'pending').length;
      const today = orders.filter(
        (o) => (o.createdAt?.seconds || 0) >= todayStart
      ).length;
      const week = orders.filter(
        (o) => (o.createdAt?.seconds || 0) >= weekAgo
      ).length;

      // الإيرادات (من الطلبات المكتملة فقط)
      const completedOrders = orders.filter((o) => o.status === 'completed');
      const monthRevenue = completedOrders
        .filter((o) => (o.createdAt?.seconds || 0) >= monthAgo)
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const weekRevenue = completedOrders
        .filter((o) => (o.createdAt?.seconds || 0) >= weekAgo)
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      // آخر طلب
      const sortedOrders = [...orders].sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );

      setStats((prev) => ({
        ...prev,
        pendingOrders: pending,
        todayOrders: today,
        weekOrders: week,
        monthRevenue,
        weekRevenue,
      }));
      setRecentOrders(sortedOrders.slice(0, 3));
      setLastOrderTime(sortedOrders[0]?.createdAt?.seconds || null);
    });

    return () => unsubOrders();
  }, [userProfile]);

  // ============================================
  // تبديل حالة التوفر
  // ============================================
  const toggleAvailability = async () => {
    if (!cookData?.id || togglingStatus) return;
    setTogglingStatus(true);
    try {
      const newStatus = !(cookData.isAcceptingOrders !== false);
      await updateDoc(doc(db, 'cooks', cookData.id), {
        isAcceptingOrders: newStatus,
      });
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // تنسيق الوقت ("منذ ساعتين" مثلاً)
  const formatRelativeTime = (seconds) => {
    if (!seconds) return 'لم يصل بعد';
    const diff = Date.now() / 1000 - seconds;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return new Date(seconds * 1000).toLocaleDateString('ar-DZ');
  };

  // ============================================
  // Loading
  // ============================================
  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 pt-4 space-y-4">
          <div className="h-24 animate-shimmer rounded-3xl" />
          <div className="h-32 animate-shimmer rounded-3xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 animate-shimmer rounded-2xl" />
            <div className="h-24 animate-shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const isAccepting = cookData?.isAcceptingOrders !== false;
  const balance = cookData?.balance || 0;
  const lowBalance = balance < 100 && !cookData?.isFoundingMember;

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-28 md:pb-8">
      {/* ============================================ */}
      {/* Header: ترحيب + حالة التوفر */}
      {/* ============================================ */}
      <header className="bg-white shadow-sm mb-4">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* صورة الطباخة */}
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                {cookData?.photo ? (
                  <img
                    src={cookData.photo}
                    alt={cookData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">👩‍🍳</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-stone-500 font-bold leading-none">
                  مرحباً بكِ
                </p>
                <h1 className="text-base font-black text-stone-800 truncate mt-1">
                  {cookData?.name || 'طباخة'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
            {/* زر الصوت */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'إيقاف إشعارات الصوت' : 'تفعيل إشعارات الصوت'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                soundEnabled
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4" strokeWidth={2.4} />
              ) : (
                <BellOff className="w-4 h-4" strokeWidth={2.4} />
              )}
            </button>

            {/* Toggle حالة التوفر */}
            <button
              onClick={toggleAvailability}
              disabled={togglingStatus}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs transition-all active:scale-95 ${
                isAccepting
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                  : 'bg-stone-200 text-stone-600'
              } ${togglingStatus ? 'opacity-60' : ''}`}
            >
              <span
                className={`relative flex h-2 w-2 ${
                  isAccepting ? '' : 'opacity-50'
                }`}
              >
                {isAccepting && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isAccepting ? 'bg-white' : 'bg-stone-500'
                  }`}
                />
              </span>
              {isAccepting ? 'متاحة' : 'غير متاحة'}
            </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* ============================================ */}
        {/* 🔔 تنبيه الطلبات المعلّقة - الأولوية القصوى */}
        {/* ============================================ */}
        {stats.pendingOrders > 0 && (
          <Link
            to="/cook/orders"
            className="relative block bg-gradient-to-l from-red-500 to-orange-500 text-white rounded-3xl p-4 shadow-xl shadow-red-500/30 active:scale-[0.98] transition-all animate-slide-up overflow-hidden"
          >
            {/* زخرفة */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

            <div className="relative flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Bell className="w-6 h-6" strokeWidth={2.4} />
                </div>
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-black rounded-full w-6 h-6 flex items-center justify-center ring-2 ring-red-500">
                  {stats.pendingOrders}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold opacity-90">
                  طلب{stats.pendingOrders === 1 ? '' : 'ات'} بانتظار موافقتكِ
                </p>
                <p className="font-black text-base mt-0.5">
                  راجعيها الآن
                </p>
              </div>
              <ArrowLeft className="w-5 h-5 flex-shrink-0" strokeWidth={2.8} />
            </div>
          </Link>
        )}

        {/* ============================================ */}
        {/* 💰 بطاقة الرصيد */}
        {/* ============================================ */}
        <Link
          to="/cook/wallet"
          className="relative block bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 text-white rounded-3xl overflow-hidden p-5 shadow-xl shadow-green-500/30 active:scale-[0.99] transition-all group"
        >
          {/* زخارف */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-900/20 rounded-full blur-2xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4" strokeWidth={2.4} />
                <span className="text-xs font-bold opacity-90">
                  الرصيد الحالي
                </span>
              </div>
              <p className="text-4xl font-black leading-none mt-2">
                {balance.toLocaleString('ar-DZ')}
                <span className="text-lg font-bold opacity-90 mr-1">دج</span>
              </p>

              {/* طلبات مجانية (للأعضاء المؤسسين) */}
              {cookData?.isFoundingMember &&
                cookData?.freeOrdersRemaining > 0 && (
                  <div className="inline-flex items-center gap-1.5 mt-3 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-extrabold">
                    <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                    {cookData.freeOrdersRemaining} طلبات مجانية متبقية
                  </div>
                )}

              {/* تحذير رصيد منخفض */}
              {lowBalance && (
                <div className="inline-flex items-center gap-1.5 mt-3 bg-red-500/90 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-extrabold">
                  <AlertCircle className="w-3 h-3" strokeWidth={2.5} />
                  رصيد منخفض — قد لا تستقبلين طلبات جديدة
                </div>
              )}
            </div>

            <ArrowLeft
              className="w-5 h-5 opacity-70 group-hover:-translate-x-1 transition-transform flex-shrink-0 mt-1"
              strokeWidth={2.5}
            />
          </div>
        </Link>

        {/* ============================================ */}
        {/* 📊 الإحصائيات المالية */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 gap-3">
          <RevenueCard
            icon={TrendingUp}
            label="إيرادات الأسبوع"
            value={stats.weekRevenue}
            trend={stats.weekOrders}
            color="blue"
          />
          <RevenueCard
            icon={Calendar}
            label="إيرادات الشهر"
            value={stats.monthRevenue}
            color="purple"
          />
        </div>

        {/* ============================================ */}
        {/* 📈 إحصائيات سريعة */}
        {/* ============================================ */}
        <div className="grid grid-cols-3 gap-2">
          <QuickStat
            icon={Utensils}
            value={stats.activeDishes}
            total={stats.totalDishes}
            label="أطباق متاحة"
            color="orange"
          />
          <QuickStat
            icon={ShoppingBag}
            value={stats.todayOrders}
            label="طلبات اليوم"
            color="amber"
          />
          <QuickStat
            icon={Activity}
            value={stats.weekOrders}
            label="طلبات الأسبوع"
            color="green"
          />
        </div>

        {/* ============================================ */}
        {/* 🚀 الإجراءات السريعة */}
        {/* ============================================ */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
            <h2 className="text-sm font-extrabold text-stone-800">
              إجراءات سريعة
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <ActionCard
              to="/cook/dishes"
              icon={Utensils}
              label="أطباقي"
              badge={stats.totalDishes}
              color="orange"
            />
            <ActionCard
              to="/cook/orders"
              icon={Package}
              label="الطلبات"
              badge={stats.pendingOrders > 0 ? stats.pendingOrders : null}
              badgeColor="red"
              color="blue"
            />
            <ActionCard
              to="/cook/wallet"
              icon={Wallet}
              label="المحفظة"
              color="green"
            />
            <ActionCard
              to={`/cooks/${cookData?.id}`}
              icon={ChefHat}
              label="ملفي العام"
              color="amber"
            />
            <ActionCard
              to="/cook/schedule"
              icon={CalendarClock}
              label="أوقات العمل"
              color="violet"
            />
            <ActionCard
              to="/cook/revenue"
              icon={Activity}
              label="تحليل الإيرادات"
              color="orange"
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* 🕐 الطلبات الأخيرة */}
        {/* ============================================ */}
        {recentOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" strokeWidth={2.4} />
                <h2 className="text-sm font-extrabold text-stone-800">
                  آخر النشاطات
                </h2>
              </div>
              <Link
                to="/cook/orders"
                className="text-[11px] font-extrabold text-orange-600 flex items-center gap-0.5 active:scale-95 transition"
              >
                الكل
                <ArrowLeft className="w-3 h-3" strokeWidth={2.8} />
              </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-stone-100">
              {recentOrders.map((order) => (
                <RecentOrderRow
                  key={order.id}
                  order={order}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* 🧾 معلومات الحساب */}
        {/* ============================================ */}
        {cookData && (
          <div className="bg-white rounded-3xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings
                  className="w-4 h-4 text-stone-500"
                  strokeWidth={2.4}
                />
                <h2 className="text-sm font-extrabold text-stone-800">
                  معلومات الحساب
                </h2>
              </div>
              {cookData.status === 'approved' && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                  <CheckCircle className="w-3 h-3" strokeWidth={2.5} />
                  مفعّل
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              <InfoRow label="الاسم" value={cookData.name} />
              <InfoRow label="الهاتف" value={cookData.phone} ltr />
              <InfoRow label="الحي" value={cookData.neighborhood} />
              {cookData.isFoundingMember && (
                <div className="flex items-center gap-2 bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3">
                  <span className="text-xl">👑</span>
                  <div>
                    <p className="text-xs font-black text-amber-800">
                      عضو مؤسس #{cookData.foundingMemberNumber}
                    </p>
                    <p className="text-[10px] text-amber-700">
                      شكراً لكونكِ من أوائل طباخاتنا
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/cook/edit-profile"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-orange-50 hover:bg-orange-100 text-orange-600 py-2.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
            >
              <UserPen className="w-4 h-4" strokeWidth={2.4} />
              تعديل الملف الشخصي
            </Link>
          </div>
        )}

        {/* ============================================ */}
        {/* زر تسجيل الخروج */}
        {/* ============================================ */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" strokeWidth={2.4} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};

/* ============================================ */
/* بطاقة إيرادات */
/* ============================================ */
function RevenueCard({ icon: Icon, label, value, trend, color }) {
  const colors = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-500',
      text: 'text-blue-700',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50',
      border: 'border-purple-100',
      iconBg: 'bg-purple-500',
      text: 'text-purple-700',
    },
  };
  const c = colors[color];

  return (
    <div
      className={`relative ${c.bg} border ${c.border} rounded-3xl p-4 overflow-hidden`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-7 h-7 ${c.iconBg} rounded-lg flex items-center justify-center`}
        >
          <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[11px] font-bold text-stone-600">{label}</p>
      </div>
      <p className="text-xl font-black text-stone-800 leading-none">
        {value.toLocaleString('ar-DZ')}
        <span className={`text-[11px] font-bold ${c.text} mr-1`}>دج</span>
      </p>
      {trend !== undefined && trend > 0 && (
        <p className={`text-[10px] font-black ${c.text} mt-1.5`}>
          {trend} طلب{trend === 1 ? '' : ''}
        </p>
      )}
    </div>
  );
}

/* ============================================ */
/* إحصائية سريعة */
/* ============================================ */
function QuickStat({ icon: Icon, value, total, label, color }) {
  const colors = {
    orange: 'bg-orange-100 text-orange-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
      <div
        className={`w-9 h-9 rounded-xl ${colors[color]} flex items-center justify-center mx-auto mb-2`}
      >
        <Icon className="w-4 h-4" strokeWidth={2.4} />
      </div>
      <p className="text-lg font-black text-stone-800 leading-none">
        {value}
        {total !== undefined && (
          <span className="text-xs text-stone-400 font-bold">/{total}</span>
        )}
      </p>
      <p className="text-[10px] text-stone-500 font-bold mt-1">{label}</p>
    </div>
  );
}

/* ============================================ */
/* بطاقة إجراء */
/* ============================================ */
function ActionCard({ to, icon: Icon, label, badge, badgeColor = 'orange', color }) {
  const colors = {
    orange: 'from-orange-400 to-orange-500 shadow-orange-500/30',
    blue: 'from-blue-400 to-blue-500 shadow-blue-500/30',
    green: 'from-green-400 to-emerald-500 shadow-green-500/30',
    amber: 'from-amber-400 to-orange-500 shadow-amber-500/30',
    violet: 'from-violet-400 to-purple-500 shadow-violet-500/30',
  };
  const badgeClass =
    badgeColor === 'red'
      ? 'bg-red-500 text-white ring-red-200 animate-pulse'
      : 'bg-orange-500 text-white ring-orange-200';

  return (
    <Link
      to={to}
      className="relative bg-white rounded-3xl p-4 shadow-sm hover:shadow-lg active:scale-95 transition-all group overflow-hidden"
    >
      {badge !== null && badge !== undefined && badge > 0 && (
        <span
          className={`absolute top-2 left-2 min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ring-4 ${badgeClass}`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div
        className={`w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-2xl flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={2.3} />
      </div>
      <p className="text-sm font-extrabold text-stone-800">{label}</p>
    </Link>
  );
}

/* ============================================ */
/* صف طلب حديث */
/* ============================================ */
function RecentOrderRow({ order, formatRelativeTime }) {
  const statusConfig = {
    pending: {
      label: 'جديد',
      color: 'bg-amber-100 text-amber-700',
      dot: 'bg-amber-500',
    },
    accepted: {
      label: 'مقبول',
      color: 'bg-blue-100 text-blue-700',
      dot: 'bg-blue-500',
    },
    preparing: {
      label: 'تحضير',
      color: 'bg-blue-100 text-blue-700',
      dot: 'bg-blue-500',
    },
    ready: {
      label: 'جاهز',
      color: 'bg-green-100 text-green-700',
      dot: 'bg-green-500',
    },
    completed: {
      label: 'مكتمل',
      color: 'bg-stone-100 text-stone-700',
      dot: 'bg-stone-500',
    },
    cancelled: {
      label: 'ملغي',
      color: 'bg-red-100 text-red-700',
      dot: 'bg-red-500',
    },
  };
  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <Link
      to="/cook/orders"
      className="flex items-center gap-3 p-3 hover:bg-stone-50 active:bg-stone-100 transition"
    >
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center flex-shrink-0">
        {order.dishImage ? (
          <img
            src={order.dishImage}
            alt={order.dishName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg">🍽️</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`}
          />
          <p className="text-[11px] font-extrabold text-stone-600">
            {order.customerName || 'زبونة'}
          </p>
        </div>
        <p className="text-xs font-bold text-stone-800 truncate">
          {order.dishName}
        </p>
      </div>
      <div className="text-left flex-shrink-0">
        <span
          className={`inline-block ${status.color} px-2 py-0.5 rounded-full text-[10px] font-black mb-1`}
        >
          {status.label}
        </span>
        <p className="text-[10px] text-stone-500 font-bold">
          {formatRelativeTime(order.createdAt?.seconds)}
        </p>
      </div>
    </Link>
  );
}

/* ============================================ */
/* صف معلومات */
/* ============================================ */
function InfoRow({ label, value, ltr }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-stone-500 font-bold">{label}</span>
      <span
        className="font-extrabold text-stone-800 truncate mr-2 min-w-0"
        dir={ltr ? 'ltr' : 'rtl'}
        style={ltr ? { textAlign: 'right' } : {}}
      >
        {value}
      </span>
    </div>
  );
}

export default CookDashboard;