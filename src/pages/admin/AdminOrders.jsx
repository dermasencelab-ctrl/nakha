import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  addDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowRight,
  ShoppingBag,
  Search,
  Filter,
  Calendar,
  X,
  AlertCircle,
  Phone,
  User,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  ChefHat,
  Eye,
  TrendingUp,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'قيد الانتظار', color: 'amber', icon: Clock },
  preparing: { label: 'قيد التحضير', color: 'blue', icon: Package },
  ready: { label: 'جاهز', color: 'green', icon: CheckCircle },
  completed: { label: 'مكتمل', color: 'emerald', icon: CheckCircle },
  cancelled: { label: 'ملغى', color: 'red', icon: XCircle },
};

const STATUS_BADGE = {
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
};

const formatDateTime = (timestamp) => {
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

const formatDate = (timestamp) => {
  if (!timestamp?.seconds) return '-';
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const calculateTotal = (order) => {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
      0
    );
  }
  return order.totalPrice || 0;
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

const AdminOrders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchCook, setSearchCook] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (order) => {
    // If commission was already deducted (status reached 'ready' or beyond),
    // we must reverse it on the cook's wallet to avoid charging for a
    // cancelled order.
    const wasCharged =
      order.status === 'ready' || order.status === 'completed';

    const confirmMsg = wasCharged
      ? `هل أنت متأكد من إلغاء طلب الزبون ${order.customerName} لدى الطباخة ${order.cookName}؟\nسيتم إعادة الرسوم تلقائياً إلى رصيد الطباخة.`
      : `هل أنت متأكد من إلغاء طلب الزبون ${order.customerName} لدى الطباخة ${order.cookName}؟`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      // Reverse the prior wallet effect, if any
      if (wasCharged && order.cookId) {
        const txSnap = await getDocs(
          query(
            collection(db, 'transactions'),
            where('orderId', '==', order.id)
          )
        );
        // Only reverse the original deduction; ignore previous reversals
        const original = txSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .find(
            (t) => t.type === 'commission' || t.type === 'free_order'
          );

        if (original) {
          const cookRef = doc(db, 'cooks', order.cookId);

          if (original.type === 'commission') {
            await updateDoc(cookRef, {
              balance: increment(original.amount || 0),
              totalCommission: increment(-(original.amount || 0)),
              totalOrders: increment(-1),
            });
            await addDoc(collection(db, 'transactions'), {
              cookId: order.cookId,
              type: 'cancellation_refund',
              amount: original.amount || 0,
              orderId: order.id,
              orderTotal: original.orderTotal || 0,
              description: `استرجاع رسوم طلب ملغى #${order.id.slice(0, 8).toUpperCase()}`,
              originalTransactionId: original.id,
              createdAt: serverTimestamp(),
            });
          } else {
            // Free order: restore the free-order quota
            await updateDoc(cookRef, {
              freeOrdersRemaining: increment(1),
              freeOrdersUsed: increment(-1),
              totalOrders: increment(-1),
            });
            await addDoc(collection(db, 'transactions'), {
              cookId: order.cookId,
              type: 'cancellation_refund',
              amount: 0,
              orderId: order.id,
              orderTotal: original.orderTotal || 0,
              description: `استرجاع طلب مجاني ملغى #${order.id.slice(0, 8).toUpperCase()}`,
              originalTransactionId: original.id,
              createdAt: serverTimestamp(),
            });
          }
        }
      }

      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled',
        cancelledByAdmin: true,
        cancelledAt: serverTimestamp(),
        cancelledBy: currentUser?.uid || 'admin',
      });
      alert('تم إلغاء الطلب');
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error('Cancel error:', err);
      alert('حدث خطأ أثناء الإلغاء');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (
        searchCook.trim() &&
        !o.cookName?.toLowerCase().includes(searchCook.toLowerCase().trim())
      )
        return false;
      if (dateFilter === 'today' && !isToday(o.createdAt)) return false;
      if (dateFilter === 'week') {
        const weekAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;
        if ((o.createdAt?.seconds || 0) < weekAgo) return false;
      }
      if (dateFilter === 'month') {
        const monthAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
        if ((o.createdAt?.seconds || 0) < monthAgo) return false;
      }
      return true;
    });
  }, [orders, statusFilter, dateFilter, searchCook]);

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => isToday(o.createdAt));
    const todayRevenue = todayOrders
      .filter((o) => o.status === 'completed' || o.status === 'ready')
      .reduce((sum, o) => sum + calculateTotal(o), 0);
    return {
      todayCount: todayOrders.length,
      todayRevenue,
      totalCount: orders.length,
      pendingCount: orders.filter((o) => o.status === 'pending').length,
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
            إدارة الطلبات
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-4">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={TrendingUp}
            label="إيرادات اليوم"
            value={`${stats.todayRevenue.toLocaleString('ar-DZ')} دج`}
            color="green"
          />
          <StatCard
            icon={ShoppingBag}
            label="طلبات اليوم"
            value={stats.todayCount}
            color="orange"
          />
          <StatCard
            icon={Clock}
            label="بانتظار الموافقة"
            value={stats.pendingCount}
            color="amber"
          />
          <StatCard
            icon={Package}
            label="إجمالي الطلبات"
            value={stats.totalCount}
            color="blue"
          />
        </div>

        {/* الفلاتر */}
        <div className="bg-white rounded-3xl shadow-sm p-4 mb-5 space-y-3">
          <div className="flex items-center gap-2 text-stone-600 text-sm font-bold">
            <Filter className="w-4 h-4" strokeWidth={2.4} />
            تصفية الطلبات
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* بحث الطباخة */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchCook}
                onChange={(e) => setSearchCook(e.target.value)}
                placeholder="ابحثي باسم الطباخة..."
                className="w-full pr-10 pl-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            {/* فلتر الحالة */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400"
            >
              <option value="all">كل الحالات</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            {/* فلتر التاريخ */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-orange-400"
            >
              <option value="all">كل الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">آخر 30 يوماً</option>
            </select>
          </div>

          <p className="text-xs text-stone-500">
            عُرض <span className="font-black text-orange-600">{filteredOrders.length}</span> من
            أصل {orders.length} طلب
          </p>
        </div>

        {/* قائمة الطلبات */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-3xl animate-pulse shadow-sm"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <ShoppingBag
              className="w-12 h-12 mx-auto text-stone-300 mb-3"
              strokeWidth={1.8}
            />
            <p className="text-stone-500 text-sm">
              لا توجد طلبات تطابق معايير البحث
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onView={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal تفاصيل الطلب */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={() => handleCancel(selectedOrder)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    green: 'from-green-400 to-emerald-500',
    orange: 'from-orange-400 to-red-400',
    amber: 'from-amber-400 to-yellow-500',
    blue: 'from-blue-400 to-indigo-500',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-orange-100">
      <div
        className={`w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center mb-2 shadow-sm`}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
      </div>
      <p className="text-lg md:text-xl font-black text-stone-800 leading-tight">
        {value}
      </p>
      <p className="text-[11px] text-stone-500 mt-0.5">{label}</p>
    </div>
  );
}

function OrderRow({ order, onView }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const total = calculateTotal(order);

  return (
    <div className="bg-white rounded-3xl shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`inline-flex items-center gap-1 ${STATUS_BADGE[cfg.color]} text-[10px] font-black px-2 py-0.5 rounded-full`}
            >
              <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
              {cfg.label}
            </span>
            <span className="text-[10px] text-stone-400">
              {formatDateTime(order.createdAt)}
            </span>
          </div>
          <p className="text-sm font-extrabold text-stone-800">
            {order.customerName || 'زبون'}
          </p>
          <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
            <ChefHat className="w-3 h-3" strokeWidth={2.5} />
            {order.cookName || '-'}
          </p>
        </div>
        <div className="text-left">
          <p className="text-lg font-black text-orange-600">
            {total.toLocaleString('ar-DZ')}
          </p>
          <p className="text-[10px] text-stone-400">دج</p>
        </div>
      </div>

      <button
        onClick={onView}
        className="w-full flex items-center justify-center gap-2 bg-stone-50 hover:bg-orange-50 text-stone-700 hover:text-orange-600 py-2 rounded-2xl text-xs font-bold transition active:scale-[0.98]"
      >
        <Eye className="w-3.5 h-3.5" strokeWidth={2.4} />
        عرض التفاصيل
      </button>
    </div>
  );
}

function OrderModal({ order, onClose, onCancel, actionLoading }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const total = calculateTotal(order);
  const canCancel =
    order.status !== 'cancelled' && order.status !== 'completed';

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 p-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-stone-800">
            تفاصيل الطلب
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center active:scale-90"
          >
            <X className="w-4 h-4 text-stone-600" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* الحالة + المبلغ */}
          <div className="bg-gradient-to-bl from-orange-50 to-amber-50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span
                className={`inline-flex items-center gap-1 ${STATUS_BADGE[cfg.color]} text-xs font-black px-2 py-1 rounded-full`}
              >
                {cfg.label}
              </span>
              <p className="text-[10px] text-stone-500 mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={2.5} />
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="text-left">
              <p className="text-2xl font-black text-orange-600">
                {total.toLocaleString('ar-DZ')}
              </p>
              <p className="text-[10px] text-stone-500">دج</p>
            </div>
          </div>

          {/* الزبون */}
          <Section title="معلومات الزبون" icon={User}>
            <Row label="الاسم" value={order.customerName || '-'} />
            <Row
              label="الهاتف"
              value={order.customerPhone || '-'}
              ltr
              icon={Phone}
            />
            {order.customerAddress && (
              <Row label="العنوان" value={order.customerAddress} />
            )}
          </Section>

          {/* الطباخة */}
          <Section title="معلومات الطباخة" icon={ChefHat}>
            <Row label="الاسم" value={order.cookName || '-'} />
          </Section>

          {/* الأطباق */}
          <Section title="الأطباق المطلوبة" icon={Package}>
            <div className="space-y-2">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-stone-50 rounded-xl p-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-stone-800">
                        {item.name || item.dishName || '-'}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {item.quantity} ×{' '}
                        {(item.price || 0).toLocaleString('ar-DZ')} دج
                      </p>
                    </div>
                    <p className="text-sm font-black text-orange-600">
                      {(
                        (item.price || 0) * (item.quantity || 0)
                      ).toLocaleString('ar-DZ')}{' '}
                      دج
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500">لا توجد تفاصيل</p>
              )}
            </div>
          </Section>

          {/* الملاحظات */}
          {order.notes && (
            <Section title="ملاحظات الزبون" icon={AlertCircle}>
              <p className="text-sm text-stone-700 bg-stone-50 rounded-xl p-3">
                {order.notes}
              </p>
            </Section>
          )}

          {/* الإلغاء */}
          {canCancel && (
            <div className="pt-3">
              <button
                onClick={onCancel}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" strokeWidth={2.4} />
                {actionLoading ? 'جارٍ الإلغاء...' : 'إلغاء الطلب'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon className="w-3.5 h-3.5 text-stone-400" strokeWidth={2.4} />
        <h4 className="text-xs font-extrabold text-stone-600">{title}</h4>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, ltr }) {
  return (
    <div className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2.5">
      <p className="text-[11px] text-stone-500">{label}</p>
      <p
        className="text-sm font-bold text-stone-800"
        dir={ltr ? 'ltr' : undefined}
      >
        {value}
      </p>
    </div>
  );
}

export default AdminOrders;
