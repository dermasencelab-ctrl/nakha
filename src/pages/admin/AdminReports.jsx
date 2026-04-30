import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  ArrowRight, TrendingUp, Calendar, CalendarDays, CalendarRange,
  ChefHat, Utensils, Trophy, DollarSign, Activity, ShoppingBag,
} from 'lucide-react';

const ACCENT = '#a855f7';
const COMMISSION_RATE = 0.09;

const S = {
  bg: {
    background: '#0D0B09',
    backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2117 1px, transparent 0)',
    backgroundSize: '28px 28px',
  },
  card: {
    background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)',
    border: '1px solid rgba(168,85,247,0.12)',
  },
  header: {
    background: 'rgba(13,11,9,0.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(168,85,247,0.12)',
  },
  section: {
    background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)',
    border: '1px solid rgba(168,85,247,0.10)',
  },
};

const calcTotal = (order) => {
  if (Array.isArray(order.items) && order.items.length > 0)
    return order.items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
  return order.totalPrice || 0;
};

const isWithinDays = (ts, days) => {
  if (!ts?.seconds) return false;
  return ts.seconds >= Date.now() / 1000 - days * 86400;
};

const isToday = (ts) => {
  if (!ts?.seconds) return false;
  const d = new Date(ts.seconds * 1000), now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

const AdminReports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reports = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed' || o.status === 'ready');
    const rev = (fn) => completed.filter(o => fn(o.createdAt)).reduce((s, o) => s + calcTotal(o), 0);

    const totalRevenue = completed.reduce((s, o) => s + calcTotal(o), 0);

    const cookMap = new Map();
    completed.forEach(o => {
      if (!o.cookId) return;
      const e = cookMap.get(o.cookId) || { cookId: o.cookId, name: o.cookName || '-', count: 0, revenue: 0 };
      e.count++; e.revenue += calcTotal(o);
      cookMap.set(o.cookId, e);
    });

    const dishMap = new Map();
    completed.forEach(o => {
      if (!Array.isArray(o.items)) return;
      o.items.forEach(item => {
        const key = item.dishId || item.name || item.dishName;
        if (!key) return;
        const e = dishMap.get(key) || { name: item.name || item.dishName || '-', cookName: o.cookName || '-', count: 0, revenue: 0 };
        e.count += item.quantity || 0;
        e.revenue += (item.price || 0) * (item.quantity || 0);
        dishMap.set(key, e);
      });
    });

    return {
      todayRev: rev(isToday),
      weekRev: rev(t => isWithinDays(t, 7)),
      monthRev: rev(t => isWithinDays(t, 30)),
      totalRevenue,
      totalCommission: Math.round(totalRevenue * COMMISSION_RATE),
      totalOrders: completed.length,
      topCooks: [...cookMap.values()].sort((a, b) => b.count - a.count).slice(0, 10),
      topDishes: [...dishMap.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    };
  }, [orders]);

  return (
    <div dir="rtl" className="min-h-screen pb-12" style={S.bg}>
      <header className="sticky top-0 z-30" style={S.header}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
            style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.20)' }}>
            <ArrowRight className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
          </Link>
          <TrendingUp className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={2.2} />
          <h1 className="text-base font-extrabold" style={{ color: '#f5f0eb' }}>تقارير الأرباح</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-5 space-y-6">
        {loading ? (
          <ReportsSkeleton />
        ) : (
          <>
            {/* إيرادات حسب الفترة */}
            <section>
              <SectionTitle icon={Calendar} title="الإيرادات حسب الفترة" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: Calendar,      label: 'إيرادات اليوم',  value: reports.todayRev,  accent: '#10b981' },
                  { icon: CalendarDays,  label: 'آخر 7 أيام',     value: reports.weekRev,   accent: ACCENT },
                  { icon: CalendarRange, label: 'آخر 30 يوماً',   value: reports.monthRev,  accent: '#3b82f6' },
                ].map((c, i) => <RevenueCard key={i} {...c} />)}
              </div>
            </section>

            {/* الإجمالي والعمولات */}
            <section>
              <SectionTitle icon={TrendingUp} title="الإحصائيات الإجمالية" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: DollarSign, label: 'إجمالي الإيرادات',       value: `${reports.totalRevenue.toLocaleString('ar-DZ')} دج`,     accent: '#10b981' },
                  { icon: Activity,   label: 'إجمالي العمولات (9%)',    value: `${reports.totalCommission.toLocaleString('ar-DZ')} دج`,  accent: ACCENT },
                  { icon: ShoppingBag,label: 'الطلبات المكتملة',        value: reports.totalOrders.toLocaleString('ar-DZ'),              accent: '#f97316' },
                ].map((c, i) => <BigStatCard key={i} {...c} />)}
              </div>
            </section>

            {/* أفضل الطباخات */}
            <section>
              <SectionTitle icon={Trophy} title="أفضل 10 طباخات" />
              <div className="rounded-2xl overflow-hidden" style={S.section}>
                {reports.topCooks.length === 0 ? (
                  <EmptyState text="لا توجد بيانات بعد" />
                ) : (
                  <div>
                    {reports.topCooks.map((cook, idx) => (
                      <RankRow key={cook.cookId} rank={idx + 1} icon={ChefHat}
                        title={cook.name} subtitle={`${cook.count} طلب`}
                        value={`${cook.revenue.toLocaleString('ar-DZ')} دج`} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* أكثر الأطباق */}
            <section>
              <SectionTitle icon={Utensils} title="أكثر 10 أطباق طلباً" />
              <div className="rounded-2xl overflow-hidden" style={S.section}>
                {reports.topDishes.length === 0 ? (
                  <EmptyState text="لا توجد بيانات بعد" />
                ) : (
                  <div>
                    {reports.topDishes.map((dish, idx) => (
                      <RankRow key={`${dish.name}-${idx}`} rank={idx + 1} icon={Utensils}
                        title={dish.name} subtitle={`من ${dish.cookName} • ${dish.count} مرة`}
                        value={`${dish.revenue.toLocaleString('ar-DZ')} دج`} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <div className="w-1.5 h-5 rounded-full" style={{ background: ACCENT }} />
      <Icon className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
      <h2 className="text-sm md:text-base font-extrabold" style={{ color: '#f5f0eb' }}>{title}</h2>
    </div>
  );
}

function RevenueCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl p-5 transition hover:scale-[1.01]"
      style={{ ...S.card, boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: `${accent}1a` }}>
        <Icon className="w-6 h-6" style={{ color: accent }} strokeWidth={2.4} />
      </div>
      <p className="text-2xl md:text-3xl font-black leading-tight" style={{ color: '#f5f0eb' }}>
        {value.toLocaleString('ar-DZ')}
      </p>
      <p className="text-xs mt-1" style={{ color: '#78716c' }}>دينار جزائري</p>
      <p className="text-[11px] mt-1.5 font-bold" style={{ color: accent }}>{label}</p>
    </div>
  );
}

function BigStatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl p-5" style={S.card}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${accent}1a` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={2.4} />
      </div>
      <p className="text-xl md:text-2xl font-black leading-tight" style={{ color: '#f5f0eb' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#78716c' }}>{label}</p>
    </div>
  );
}

function RankRow({ rank, icon: Icon, title, subtitle, value }) {
  const medalColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#a8a29e' : rank === 3 ? '#f97316' : '#44403c';
  const medalBg   = rank === 1 ? 'rgba(245,158,11,0.12)' : rank === 2 ? 'rgba(168,162,158,0.10)' : rank === 3 ? 'rgba(249,115,22,0.10)' : 'rgba(255,255,255,0.04)';
  return (
    <div className="flex items-center gap-3 p-4 transition"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
        style={{ background: medalBg, color: medalColor }}>
        {rank}
      </div>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(168,85,247,0.10)' }}>
        <Icon className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold truncate" style={{ color: '#f5f0eb' }}>{title}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: '#78716c' }}>{subtitle}</p>
      </div>
      <div className="text-left flex-shrink-0">
        <p className="text-sm font-black" style={{ color: ACCENT }}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="p-10 text-center text-sm" style={{ color: '#44403c' }}>{text}</div>;
}

function ReportsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />)}
      </div>
      <div className="h-96 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />
    </>
  );
}

export default AdminReports;
