import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  ArrowRight,
  TrendingUp,
  Calendar,
  CalendarDays,
  CalendarRange,
  ChefHat,
  Utensils,
  Trophy,
  DollarSign,
  Activity,
  ShoppingBag,
} from 'lucide-react';

const COMMISSION_RATE = 0.09;

const calculateTotal = (order) => {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
      0
    );
  }
  return order.totalPrice || 0;
};

const isWithinDays = (timestamp, days) => {
  if (!timestamp?.seconds) return false;
  const cutoff = Date.now() / 1000 - days * 24 * 60 * 60;
  return timestamp.seconds >= cutoff;
};

const isToday = (timestamp) => {
  if (!timestamp?.seconds) return false;
  const d = new Date(timestamp.seconds * 1000);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};

const AdminReports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const reports = useMemo(() => {
    const completed = orders.filter(
      (o) => o.status === 'completed' || o.status === 'ready'
    );

    const revenueByPeriod = (filterFn) =>
      completed
        .filter((o) => filterFn(o.createdAt))
        .reduce((sum, o) => sum + calculateTotal(o), 0);

    const todayRev = revenueByPeriod(isToday);
    const weekRev = revenueByPeriod((t) => isWithinDays(t, 7));
    const monthRev = revenueByPeriod((t) => isWithinDays(t, 30));

    const totalRevenue = completed.reduce(
      (sum, o) => sum + calculateTotal(o),
      0
    );
    const totalCommission = Math.round(totalRevenue * COMMISSION_RATE);

    // أفضل الطباخات
    const cookMap = new Map();
    completed.forEach((o) => {
      if (!o.cookId) return;
      const entry = cookMap.get(o.cookId) || {
        cookId: o.cookId,
        name: o.cookName || '-',
        count: 0,
        revenue: 0,
      };
      entry.count += 1;
      entry.revenue += calculateTotal(o);
      cookMap.set(o.cookId, entry);
    });
    const topCooks = [...cookMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // أكثر الأطباق
    const dishMap = new Map();
    completed.forEach((o) => {
      if (!Array.isArray(o.items)) return;
      o.items.forEach((item) => {
        const key = item.dishId || item.name || item.dishName;
        if (!key) return;
        const entry = dishMap.get(key) || {
          name: item.name || item.dishName || '-',
          cookName: o.cookName || '-',
          count: 0,
          revenue: 0,
        };
        entry.count += item.quantity || 0;
        entry.revenue += (item.price || 0) * (item.quantity || 0);
        dishMap.set(key, entry);
      });
    });
    const topDishes = [...dishMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      todayRev,
      weekRev,
      monthRev,
      totalRevenue,
      totalCommission,
      totalOrders: completed.length,
      topCooks,
      topDishes,
    };
  }, [orders]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-12">
      {/* Header */}
      <header className="sticky top-16 z-20 bg-[#FFF8F0]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/admin"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
            aria-label="رجوع"
          >
            <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
          </Link>
          <h1 className="text-lg font-extrabold text-stone-800">
            تقارير الأرباح
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-4 space-y-6">
        {loading ? (
          <ReportsSkeleton />
        ) : (
          <>
            {/* بطاقات الإيرادات حسب الفترة */}
            <section>
              <SectionTitle icon={Calendar} title="الإيرادات حسب الفترة" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <RevenueCard
                  icon={Calendar}
                  label="إيرادات اليوم"
                  value={reports.todayRev}
                  color="green"
                />
                <RevenueCard
                  icon={CalendarDays}
                  label="آخر 7 أيام"
                  value={reports.weekRev}
                  color="blue"
                />
                <RevenueCard
                  icon={CalendarRange}
                  label="آخر 30 يوماً"
                  value={reports.monthRev}
                  color="purple"
                />
              </div>
            </section>

            {/* الإجمالي والعمولات */}
            <section>
              <SectionTitle icon={TrendingUp} title="الإحصائيات الإجمالية" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <BigStatCard
                  icon={DollarSign}
                  label="إجمالي الإيرادات"
                  value={`${reports.totalRevenue.toLocaleString('ar-DZ')} دج`}
                  color="emerald"
                />
                <BigStatCard
                  icon={Activity}
                  label="إجمالي العمولات (9%)"
                  value={`${reports.totalCommission.toLocaleString('ar-DZ')} دج`}
                  color="orange"
                />
                <BigStatCard
                  icon={ShoppingBag}
                  label="الطلبات المكتملة"
                  value={reports.totalOrders.toLocaleString('ar-DZ')}
                  color="blue"
                />
              </div>
            </section>

            {/* أفضل 10 طباخات */}
            <section>
              <SectionTitle icon={Trophy} title="أفضل 10 طباخات" />
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                {reports.topCooks.length === 0 ? (
                  <EmptyState text="لا توجد بيانات بعد" />
                ) : (
                  <div className="divide-y divide-stone-100">
                    {reports.topCooks.map((cook, idx) => (
                      <RankRow
                        key={cook.cookId}
                        rank={idx + 1}
                        icon={ChefHat}
                        title={cook.name}
                        subtitle={`${cook.count} طلب`}
                        value={`${cook.revenue.toLocaleString('ar-DZ')} دج`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* أكثر 10 أطباق */}
            <section>
              <SectionTitle icon={Utensils} title="أكثر 10 أطباق طلباً" />
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                {reports.topDishes.length === 0 ? (
                  <EmptyState text="لا توجد بيانات بعد" />
                ) : (
                  <div className="divide-y divide-stone-100">
                    {reports.topDishes.map((dish, idx) => (
                      <RankRow
                        key={`${dish.name}-${idx}`}
                        rank={idx + 1}
                        icon={Utensils}
                        title={dish.name}
                        subtitle={`من ${dish.cookName} • ${dish.count} مرة`}
                        value={`${dish.revenue.toLocaleString('ar-DZ')} دج`}
                      />
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
      <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
      <Icon className="w-4 h-4 text-stone-600" strokeWidth={2.4} />
      <h2 className="text-sm md:text-base font-extrabold text-stone-800">
        {title}
      </h2>
    </div>
  );
}

function RevenueCard({ icon: Icon, label, value, color }) {
  const grad = {
    green: 'from-green-400 to-emerald-500',
    blue: 'from-blue-400 to-indigo-500',
    purple: 'from-purple-400 to-pink-500',
  };
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5 hover:shadow-md transition border border-orange-100">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${grad[color]} rounded-2xl flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-6 h-6 text-white" strokeWidth={2.4} />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-black text-stone-800 leading-tight">
        {value.toLocaleString('ar-DZ')}
      </p>
      <p className="text-xs text-stone-500 mt-1">دينار جزائري</p>
      <p className="text-[11px] text-stone-400 mt-1.5 font-bold">{label}</p>
    </div>
  );
}

function BigStatCard({ icon: Icon, label, value, color }) {
  const grad = {
    emerald: 'from-emerald-400 to-teal-500',
    orange: 'from-orange-400 to-red-400',
    blue: 'from-blue-400 to-indigo-500',
  };
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5 border border-orange-100">
      <div
        className={`w-11 h-11 bg-gradient-to-br ${grad[color]} rounded-xl flex items-center justify-center mb-3 shadow-sm`}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
      </div>
      <p className="text-xl md:text-2xl font-black text-stone-800 leading-tight">
        {value}
      </p>
      <p className="text-xs text-stone-500 mt-1">{label}</p>
    </div>
  );
}

function RankRow({ rank, icon: Icon, title, subtitle, value }) {
  const medalColor =
    rank === 1
      ? 'bg-yellow-100 text-yellow-700'
      : rank === 2
        ? 'bg-stone-200 text-stone-700'
        : rank === 3
          ? 'bg-orange-100 text-orange-700'
          : 'bg-stone-50 text-stone-500';
  return (
    <div className="flex items-center gap-3 p-4 hover:bg-stone-50 transition">
      <div
        className={`w-9 h-9 ${medalColor} rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0`}
      >
        {rank}
      </div>
      <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-orange-600" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-stone-800 truncate">
          {title}
        </p>
        <p className="text-[11px] text-stone-500 mt-0.5 truncate">{subtitle}</p>
      </div>
      <div className="text-left flex-shrink-0">
        <p className="text-sm font-black text-orange-600">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="p-8 text-center text-sm text-stone-400">{text}</div>;
}

function ReportsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-white rounded-3xl animate-pulse shadow-sm"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white rounded-3xl animate-pulse shadow-sm"
          />
        ))}
      </div>
      <div className="h-96 bg-white rounded-3xl animate-pulse shadow-sm" />
    </>
  );
}

export default AdminReports;
