import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, query, where, getDocs, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  TrendingUp,
  Package,
  Star,
  BarChart2,
  Calendar,
  ChevronDown,
} from 'lucide-react';

const formatDate = (ts) => {
  if (!ts?.seconds) return '-';
  return new Date(ts.seconds * 1000).toLocaleDateString('ar-DZ', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const statusLabel = {
  pending: 'معلّق',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const PERIODS = [
  { value: '7',  label: 'آخر 7 أيام' },
  { value: '30', label: 'آخر 30 يوم' },
  { value: '90', label: 'آخر 90 يوم' },
  { value: '0',  label: 'مخصص' },
];

function CookRevenue() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    if (!userProfile?.cookId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersSnap, ratingsSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'orders'),
            where('cookId', '==', userProfile.cookId),
            orderBy('createdAt', 'desc'),
          )),
          getDocs(query(
            collection(db, 'ratings'),
            where('cookId', '==', userProfile.cookId),
          )),
        ]);
        setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setRatings(ratingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile]);

  // نطاق التاريخ
  const { fromDate, toDate } = useMemo(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    if (period === '0') {
      return {
        fromDate: customFrom ? new Date(customFrom) : null,
        toDate: customTo ? new Date(customTo + 'T23:59:59') : to,
      };
    }
    const from = new Date();
    from.setDate(from.getDate() - parseInt(period, 10));
    from.setHours(0, 0, 0, 0);
    return { fromDate: from, toDate: to };
  }, [period, customFrom, customTo]);

  // الطلبات المفلترة
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null;
      if (!ts) return false;
      if (fromDate && ts < fromDate) return false;
      if (toDate && ts > toDate) return false;
      return true;
    });
  }, [orders, fromDate, toDate]);

  const completedOrders = filteredOrders.filter((o) => o.status === 'completed');

  // إجمالي الإيرادات (بعد العمولة 9%)
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0) * 0.91, 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // متوسط التقييم
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
    : 0;

  // بيانات الرسم البياني — إيرادات يومياً
  const chartData = useMemo(() => {
    const map = {};
    completedOrders.forEach((o) => {
      if (!o.createdAt?.seconds) return;
      const d = new Date(o.createdAt.seconds * 1000);
      const key = d.toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' });
      map[key] = (map[key] || 0) + (o.totalPrice || 0) * 0.91;
    });
    const entries = Object.entries(map).slice(-14);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([label, value]) => ({ label, value, pct: (value / max) * 100 }));
  }, [completedOrders]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-24">
        <div className="max-w-3xl mx-auto px-4 pt-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-3xl animate-pulse shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-24">
      {/* Header */}
      <header className="sticky top-16 z-20 bg-[#FFF5E6]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/cook/dashboard" className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition">
            <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-stone-800 leading-none">تحليل إيراداتي</h1>
            <p className="text-xs text-stone-500 mt-0.5">إحصائيات طلباتك ومبيعاتك</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-5">

        {/* اختيار الفترة */}
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-3">
            <Calendar className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
            اختر الفترة الزمنية
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition active:scale-95 ${period === p.value ? 'bg-orange-500 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {period === '0' && (
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-stone-500 block mb-1">من</label>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition" />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-bold text-stone-500 block mb-1">إلى</label>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition" />
              </div>
            </div>
          )}
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="💰"
            label="إجمالي الإيرادات"
            value={`${Math.round(totalRevenue).toLocaleString('ar-DZ')} دج`}
            color="orange"
          />
          <StatCard
            icon="✅"
            label="طلبات مكتملة"
            value={completedOrders.length}
            color="green"
          />
          <StatCard
            icon="📊"
            label="متوسط قيمة الطلب"
            value={`${Math.round(avgOrderValue).toLocaleString('ar-DZ')} دج`}
            color="blue"
          />
          <StatCard
            icon="⭐"
            label="متوسط التقييم"
            value={ratings.length > 0 ? `${avgRating.toFixed(1)} / 5` : '—'}
            color="amber"
          />
        </div>

        {/* الرسم البياني */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
              <BarChart2 className="w-4 h-4 text-stone-600" strokeWidth={2.4} />
              <h2 className="text-sm font-extrabold text-stone-800">الإيرادات اليومية</h2>
            </div>
            <div className="flex items-end gap-1.5 h-28">
              {chartData.map(({ label, value, pct }) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full relative flex items-end" style={{ height: '88px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`${Math.round(value).toLocaleString()} دج`}
                    />
                  </div>
                  <span className="text-[9px] text-stone-500 font-bold truncate w-full text-center">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* جدول الطلبات */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-stone-100">
            <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
            <Package className="w-4 h-4 text-stone-600" strokeWidth={2.4} />
            <h2 className="text-sm font-extrabold text-stone-800">تفاصيل الطلبات</h2>
            <span className="mr-auto text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{filteredOrders.length} طلب</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-stone-500 text-sm">لا توجد طلبات في هذه الفترة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 text-xs font-bold">
                    <th className="px-4 py-3 text-right">التاريخ</th>
                    <th className="px-4 py-3 text-right">الطبق</th>
                    <th className="px-4 py-3 text-center">الكمية</th>
                    <th className="px-4 py-3 text-left">المبلغ</th>
                    <th className="px-4 py-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredOrders.map((order) => {
                    const netAmount = order.status === 'completed'
                      ? Math.round((order.totalPrice || 0) * 0.91)
                      : order.totalPrice || 0;
                    const itemsCount = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || order.quantity || 1;
                    const dishName = order.items?.length > 1
                      ? `${order.items[0].name} +${order.items.length - 1}`
                      : order.items?.[0]?.name || order.dishName || '—';
                    return (
                      <tr key={order.id} className="hover:bg-stone-50/60 transition">
                        <td className="px-4 py-3 text-xs text-stone-600 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-800 max-w-[140px] truncate">
                          {dishName}
                        </td>
                        <td className="px-4 py-3 text-center text-stone-600">×{itemsCount}</td>
                        <td className="px-4 py-3 text-left font-extrabold text-orange-600 whitespace-nowrap">
                          {netAmount.toLocaleString('ar-DZ')} دج
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {statusLabel[order.status] || order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    orange: 'from-orange-50 to-amber-50 border-orange-100',
    green:  'from-green-50 to-emerald-50 border-green-100',
    blue:   'from-blue-50 to-sky-50 border-blue-100',
    amber:  'from-amber-50 to-yellow-50 border-amber-100',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-3xl p-4 shadow-sm`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-[11px] text-stone-500 font-bold mb-0.5">{label}</p>
      <p className="text-lg font-extrabold text-stone-800 leading-tight">{value}</p>
    </div>
  );
}

export default CookRevenue;
