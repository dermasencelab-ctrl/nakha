import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChefHat, Utensils, LogOut, Home, Wallet,
  TrendingUp, Users, ShoppingBag, Clock,
  ArrowUpLeft, Activity, Star, BarChart2,
  AlertTriangle, Zap, CheckCircle, Bell,
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

// Animated count-up hook
function useCountUp(target, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(target * e));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return count;
}

// Single KPI card
function KpiCard({ value, label, sub, icon: Icon, accent, delay = 0, pulse = false }) {
  const animated = useCountUp(value, 1300, delay);
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 group cursor-default animate-slide-up"
      style={{
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)',
        border: `1px solid ${accent}22`,
        boxShadow: `0 0 0 0 ${accent}00`,
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 28px ${accent}28, 0 4px 24px #00000050`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px #00000040'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Top accent stripe */}
      <div className="absolute top-0 right-0 left-0 h-px" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00)` }} />

      {/* Corner glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={2.2} />
        </div>
        {pulse && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}35` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: accent }} />
            نشط
          </span>
        )}
      </div>

      <p className="text-3xl font-black text-stone-50 leading-none mb-1.5"
        style={{ fontVariantNumeric: 'tabular-nums' }}>
        {animated.toLocaleString('ar-DZ')}
      </p>
      <p className="text-xs font-bold text-stone-400 leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-stone-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// Navigation tool card
function NavCard({ to, icon: Icon, emoji, label, desc, accent, badge, delay = 0 }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl p-5 animate-slide-up flex flex-col"
      style={{
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)',
        border: `1px solid ${accent}20`,
        transition: 'all 0.25s ease',
        minHeight: '160px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${accent}55`;
        e.currentTarget.style.boxShadow = `0 0 32px ${accent}20, 0 8px 32px #00000060`;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = `1px solid ${accent}20`;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Ambient top glow */}
      <div className="absolute top-0 right-0 left-0 h-px transition-all duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}70, transparent)` }} />

      {/* Badge */}
      {badge > 0 && (
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full animate-pulse"
            style={{ background: '#ef444430', color: '#f87171', border: '1px solid #ef444440' }}>
            <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2.5} />
            {badge}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="mb-4 relative">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
          {emoji || <Icon className="w-6 h-6" style={{ color: accent }} strokeWidth={2} />}
        </div>
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="font-black text-stone-100 text-base leading-tight mb-1.5 group-hover:text-white transition">{label}</h3>
        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{desc}</p>
      </div>

      {/* Arrow */}
      <div className="flex items-center gap-1 mt-3 transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
        style={{ color: accent }}>
        <span className="text-xs font-bold">فتح</span>
        <ArrowUpLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
      </div>
    </Link>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    pendingCooks: 0, pendingTopups: 0, totalCooks: 0,
    totalOrders: 0, completedOrders: 0, pendingOrders: 0, totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pcSnap, ptSnap, acSnap, ordSnap] = await Promise.all([
          getDocs(query(collection(db, 'cooks'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'topup_requests'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'cooks'), where('status', '==', 'approved'))),
          getDocs(collection(db, 'orders')),
        ]);
        const orders = ordSnap.docs.map(d => d.data());
        const completed = orders.filter(o => o.status === 'completed');
        const pending = orders.filter(o => o.status === 'pending');
        const revenue = completed.reduce((s, o) => s + Math.round((o.totalPrice || 0) * 0.09), 0);
        setStats({
          pendingCooks: pcSnap.size, pendingTopups: ptSnap.size,
          totalCooks: acSnap.size, totalOrders: ordSnap.size,
          completedOrders: completed.length, pendingOrders: pending.length,
          totalRevenue: revenue,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleLogout = async () => {
    try { await logout(); sessionStorage.removeItem('isAdmin'); navigate('/login'); }
    catch (e) { console.error(e); }
  };

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور';
  const timeStr = currentTime.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' });
  const totalAlerts = stats.pendingCooks + stats.pendingTopups;

  const navTools = [
    {
      to: '/admin/cooks', label: 'إدارة الطباخات', emoji: '👩‍🍳',
      desc: 'مراجعة طلبات التسجيل وإدارة حسابات الطباخات المعتمدات',
      accent: '#f97316', badge: stats.pendingCooks,
    },
    {
      to: '/admin/dishes', label: 'إدارة الأطباق', emoji: '🍲',
      desc: 'عرض جميع الأطباق المسجّلة ومراقبة المحتوى والأسعار',
      accent: '#f43f5e',
    },
    {
      to: '/admin/topups', label: 'طلبات الشحن', emoji: '💳',
      desc: 'مراجعة طلبات شحن الأرصدة والموافقة عليها أو رفضها',
      accent: '#10b981', badge: stats.pendingTopups,
    },
    {
      to: '/admin/orders', label: 'إدارة الطلبات', emoji: '📦',
      desc: 'عرض كل الطلبات وفلترتها وإلغاء أي طلب عند الحاجة',
      accent: '#3b82f6', badge: stats.pendingOrders,
    },
    {
      to: '/admin/reports', label: 'تقارير الأرباح', emoji: '📊',
      desc: 'إيرادات اليوم والأسبوع والشهر، أفضل الطباخات والأطباق',
      accent: '#a855f7',
    },
    {
      to: '/admin/ratings', label: 'إدارة التقييمات', emoji: '⭐',
      desc: 'مراجعة تقييمات الزبائن وحذف أو إخفاء التقييمات المسيئة',
      accent: '#f59e0b',
    },
    {
      to: '/admin/invite-codes', label: 'رموز الدعوة', emoji: '🎟️',
      desc: 'إنشاء رموز دعوة للطباخات ومتابعة حالة الاستخدام',
      accent: '#8b5cf6',
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen"
      style={{
        background: '#0D0B09',
        backgroundImage: `radial-gradient(circle at 1px 1px, #2a2117 1px, transparent 0)`,
        backgroundSize: '28px 28px',
      }}
    >

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(13,11,9,0.85)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(234,88,12,0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
              <img src="/nakha-logo.png" alt="نَكهة" className="w-full h-full object-cover" />
            </div>
            <div className="leading-none">
              <span className="text-sm font-black text-stone-100">نَكهة</span>
              <span className="text-[10px] text-stone-600 block">لوحة الإدارة</span>
            </div>
          </div>

          {/* Live clock — hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 text-stone-500 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            <span dir="ltr">{timeStr}</span>
            <span className="text-stone-700">•</span>
            <span>{dateStr}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {totalAlerts > 0 && (
              <div
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{ background: '#ef444420', color: '#f87171', border: '1px solid #ef444435' }}
              >
                <Bell className="w-3.5 h-3.5 animate-bounce" strokeWidth={2.5} />
                {totalAlerts} تنبيه
              </div>
            )}
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-stone-400 hover:text-stone-200 transition"
              style={{ border: '1px solid #2a2117' }}
            >
              <Home className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span className="hidden sm:inline">الموقع</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-stone-400 hover:text-red-400 transition"
              style={{ border: '1px solid #2a2117' }}
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Hero greeting ── */}
        <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-stone-500 text-sm font-semibold mb-1">{dateStr}</p>
              <h1 className="text-3xl md:text-4xl font-black leading-none"
                style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {greeting} 👋
              </h1>
            </div>
            {!loading && (
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: '#10b98115', color: '#34d399', border: '1px solid #10b98130' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                النظام يعمل
              </div>
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              value={stats.totalRevenue} label="إيرادات العمولات" sub="دينار جزائري"
              icon={TrendingUp} accent="#f97316" delay={80} pulse
            />
            <KpiCard
              value={stats.totalCooks} label="طباخات معتمدات"
              icon={Users} accent="#a855f7" delay={160}
            />
            <KpiCard
              value={stats.totalOrders} label="إجمالي الطلبات" sub={`${stats.completedOrders} مكتمل`}
              icon={ShoppingBag} accent="#3b82f6" delay={240}
            />
            <KpiCard
              value={stats.pendingOrders} label="طلبات معلّقة"
              icon={Clock} accent="#f59e0b" delay={320} pulse={stats.pendingOrders > 0}
            />
          </div>
        )}

        {/* ── Urgent alerts ── */}
        {!loading && totalAlerts > 0 && (
          <div
            className="rounded-2xl p-5 animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, #1f0f0a, #1a0c09)',
              border: '1px solid #ef444440',
              boxShadow: '0 0 40px #ef444418',
              animationDelay: '360ms',
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: '#ef444425', border: '1px solid #ef444440' }}>
                <AlertTriangle className="w-4 h-4 text-red-400" strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-sm font-black text-red-300">إجراءات تتطلب اهتمامك</h3>
                <p className="text-[11px] text-red-500/70">{totalAlerts} {totalAlerts === 1 ? 'إشعار' : 'إشعارات'} بانتظار المراجعة</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {stats.pendingCooks > 0 && (
                <Link to="/admin/cooks"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm group transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: '#ef444418', border: '1px solid #ef444438', color: '#fca5a5' }}>
                  <span className="text-xl">👩‍🍳</span>
                  <div>
                    <p className="font-extrabold text-red-300">{stats.pendingCooks} طباخة بانتظار الموافقة</p>
                    <p className="text-[11px] text-red-400/70">اضغط للمراجعة</p>
                  </div>
                  <ArrowUpLeft className="w-4 h-4 opacity-60 group-hover:opacity-100 mr-auto transition" />
                </Link>
              )}
              {stats.pendingTopups > 0 && (
                <Link to="/admin/topups"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm group transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: '#f59e0b18', border: '1px solid #f59e0b38', color: '#fcd34d' }}>
                  <span className="text-xl">💳</span>
                  <div>
                    <p className="font-extrabold text-amber-300">{stats.pendingTopups} طلب شحن بانتظار المراجعة</p>
                    <p className="text-[11px] text-amber-400/70">اضغط للمراجعة</p>
                  </div>
                  <ArrowUpLeft className="w-4 h-4 opacity-60 group-hover:opacity-100 mr-auto transition" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Nav tools ── */}
        <div>
          <div className="flex items-center gap-3 mb-5 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #ea580c30, transparent)' }} />
            <span className="text-xs font-black tracking-widest text-stone-500 uppercase">أدوات الإدارة</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, #ea580c30, transparent)' }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {navTools.map((tool, i) => (
              <NavCard key={tool.to} {...tool} delay={440 + i * 50} />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center pt-4 pb-8 animate-slide-up" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-center gap-2 text-stone-700 text-xs">
            <Zap className="w-3.5 h-3.5 text-orange-800" strokeWidth={2} />
            <span>نَكهة — لوحة الإدارة © {new Date().getFullYear()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
