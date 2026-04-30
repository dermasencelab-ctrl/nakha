import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, doc, updateDoc, serverTimestamp,
  query, where, addDoc, increment,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowRight, ShoppingBag, Search, Filter, Calendar, X, AlertCircle,
  Phone, User, Clock, Package, CheckCircle, XCircle, ChefHat, Eye, TrendingUp,
} from 'lucide-react';

const ACCENT = '#3b82f6';

const S = {
  bg: {
    background: '#0D0B09',
    backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2117 1px, transparent 0)',
    backgroundSize: '28px 28px',
  },
  card: {
    background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)',
    border: '1px solid rgba(59,130,246,0.10)',
  },
  modal: {
    background: '#1a1410',
    border: '1px solid rgba(59,130,246,0.20)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
  },
  input: {
    background: '#100e0c',
    border: '1px solid rgba(59,130,246,0.18)',
    color: '#d6d3d1',
  },
  header: {
    background: 'rgba(13,11,9,0.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(59,130,246,0.12)',
  },
};

const STATUS_CONFIG = {
  pending:   { label: 'قيد الانتظار', icon: Clock,        accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  preparing: { label: 'قيد التحضير', icon: Package,       accent: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  ready:     { label: 'جاهز',         icon: CheckCircle,   accent: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  completed: { label: 'مكتمل',        icon: CheckCircle,   accent: '#6ee7b7', bg: 'rgba(110,231,183,0.10)', border: 'rgba(110,231,183,0.22)' },
  cancelled: { label: 'ملغى',         icon: XCircle,       accent: '#f43f5e', bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.22)' },
};

const formatDateTime = (ts) => {
  if (!ts?.seconds) return '-';
  return new Date(ts.seconds * 1000).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const calcTotal = (order) => {
  if (Array.isArray(order.items) && order.items.length > 0)
    return order.items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
  return order.totalPrice || 0;
};

const isToday = (ts) => {
  if (!ts?.seconds) return false;
  const d = new Date(ts.seconds * 1000), now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
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
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (order) => {
    const wasCharged = order.status === 'ready' || order.status === 'completed';
    if (!confirm(wasCharged
      ? `هل أنت متأكد من إلغاء طلب ${order.customerName} لدى ${order.cookName}؟\nسيتم إعادة الرسوم تلقائياً.`
      : `هل أنت متأكد من إلغاء طلب ${order.customerName} لدى ${order.cookName}؟`)) return;

    setActionLoading(true);
    try {
      if (wasCharged && order.cookId) {
        const txSnap = await getDocs(query(collection(db, 'transactions'), where('orderId', '==', order.id)));
        const original = txSnap.docs.map(d => ({ id: d.id, ...d.data() })).find(t => t.type === 'commission' || t.type === 'free_order');
        if (original) {
          const cookRef = doc(db, 'cooks', order.cookId);
          if (original.type === 'commission') {
            await updateDoc(cookRef, { balance: increment(original.amount || 0), totalCommission: increment(-(original.amount || 0)), totalOrders: increment(-1) });
            await addDoc(collection(db, 'transactions'), {
              cookId: order.cookId, type: 'cancellation_refund', amount: original.amount || 0,
              orderId: order.id, orderTotal: original.orderTotal || 0,
              description: `استرجاع رسوم طلب ملغى #${order.id.slice(0, 8).toUpperCase()}`,
              originalTransactionId: original.id, createdAt: serverTimestamp(),
            });
          } else {
            await updateDoc(cookRef, { freeOrdersRemaining: increment(1), freeOrdersUsed: increment(-1), totalOrders: increment(-1) });
            await addDoc(collection(db, 'transactions'), {
              cookId: order.cookId, type: 'cancellation_refund', amount: 0,
              orderId: order.id, orderTotal: original.orderTotal || 0,
              description: `استرجاع طلب مجاني ملغى #${order.id.slice(0, 8).toUpperCase()}`,
              originalTransactionId: original.id, createdAt: serverTimestamp(),
            });
          }
        }
      }
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled', cancelledByAdmin: true,
        cancelledAt: serverTimestamp(), cancelledBy: currentUser?.uid || 'admin',
      });
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error('Cancel error:', err);
      alert('حدث خطأ أثناء الإلغاء');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = useMemo(() => orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchCook.trim() && !o.cookName?.toLowerCase().includes(searchCook.toLowerCase())) return false;
    if (dateFilter === 'today' && !isToday(o.createdAt)) return false;
    if (dateFilter === 'week' && (o.createdAt?.seconds || 0) < Date.now() / 1000 - 7 * 86400) return false;
    if (dateFilter === 'month' && (o.createdAt?.seconds || 0) < Date.now() / 1000 - 30 * 86400) return false;
    return true;
  }), [orders, statusFilter, dateFilter, searchCook]);

  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => isToday(o.createdAt));
    return {
      todayCount: todayOrders.length,
      todayRevenue: todayOrders.filter(o => o.status === 'completed' || o.status === 'ready').reduce((s, o) => s + calcTotal(o), 0),
      totalCount: orders.length,
      pendingCount: orders.filter(o => o.status === 'pending').length,
    };
  }, [orders]);

  return (
    <div dir="rtl" className="min-h-screen pb-12" style={S.bg}>
      <header className="sticky top-0 z-30" style={S.header}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
            style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)' }}>
            <ArrowRight className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
          </Link>
          <ShoppingBag className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={2.2} />
          <h1 className="text-base font-extrabold" style={{ color: '#f5f0eb' }}>إدارة الطلبات</h1>
          <span className="mr-auto text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: 'rgba(59,130,246,0.12)', color: ACCENT }}>
            {filteredOrders.length} طلب
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-5">
        {/* إحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { icon: TrendingUp,  label: 'إيرادات اليوم',    value: `${stats.todayRevenue.toLocaleString('ar-DZ')} دج`, accent: '#10b981' },
            { icon: ShoppingBag, label: 'طلبات اليوم',      value: stats.todayCount,                                   accent: '#f97316' },
            { icon: Clock,       label: 'بانتظار الموافقة', value: stats.pendingCount,                                 accent: '#f59e0b' },
            { icon: Package,     label: 'إجمالي الطلبات',   value: stats.totalCount,                                   accent: ACCENT },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-2xl p-4" style={{ ...S.card, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: `${s.accent}1a` }}>
                  <Icon className="w-4 h-4" style={{ color: s.accent }} strokeWidth={2.3} />
                </div>
                <p className="text-lg font-black" style={{ color: s.accent }}>{s.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#78716c' }}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* الفلاتر */}
        <div className="rounded-2xl p-4 mb-5" style={{ ...S.card, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
            <span className="text-xs font-bold" style={{ color: '#a8a29e' }}>تصفية الطلبات</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#78716c' }} />
              <input type="text" value={searchCook} onChange={e => setSearchCook(e.target.value)}
                placeholder="ابحث باسم الطباخة..."
                className="w-full pr-10 pl-3 py-2.5 rounded-xl text-sm outline-none"
                style={S.input} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ ...S.input, color: '#d6d3d1' }}>
              <option value="all">كل الحالات</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ ...S.input, color: '#d6d3d1' }}>
              <option value="all">كل الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">آخر 30 يوماً</option>
            </select>
          </div>
        </div>

        {/* قائمة الطلبات */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <ShoppingBag className="w-12 h-12 mb-3" style={{ color: '#44403c' }} strokeWidth={1.5} />
            <p className="text-sm" style={{ color: '#78716c' }}>لا توجد طلبات تطابق المعايير</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderRow key={order.id} order={order} onView={() => setSelectedOrder(order)} />
            ))}
          </div>
        )}
      </div>

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

function OrderRow({ order, onView }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const total = calcTotal(order);
  return (
    <div className="rounded-2xl p-4 transition hover:scale-[1.005]"
      style={{ ...S.card, boxShadow: '0 3px 16px rgba(0,0,0,0.3)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.border}` }}>
              <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
              {cfg.label}
            </span>
            <span className="text-[10px]" style={{ color: '#57534e' }}>{formatDateTime(order.createdAt)}</span>
          </div>
          <p className="text-sm font-extrabold" style={{ color: '#f5f0eb' }}>{order.customerName || 'زبون'}</p>
          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#78716c' }}>
            <ChefHat className="w-3 h-3" strokeWidth={2.5} />
            {order.cookName || '-'}
          </p>
        </div>
        <div className="text-left">
          <p className="text-lg font-black" style={{ color: ACCENT }}>{total.toLocaleString('ar-DZ')}</p>
          <p className="text-[10px]" style={{ color: '#57534e' }}>دج</p>
        </div>
      </div>
      <button onClick={onView}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition active:scale-[0.98]"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: ACCENT }}>
        <Eye className="w-3.5 h-3.5" strokeWidth={2.4} />
        عرض التفاصيل
      </button>
    </div>
  );
}

function OrderModal({ order, onClose, onCancel, actionLoading }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const total = calcTotal(order);
  const canCancel = order.status !== 'cancelled' && order.status !== 'completed';
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}>
      <div className="w-full md:max-w-lg md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
        style={S.modal} onClick={e => e.stopPropagation()} dir="rtl">
        <div className="sticky top-0 px-5 py-4 flex items-center justify-between"
          style={{ background: '#1a1410', borderBottom: '1px solid rgba(59,130,246,0.12)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.3} />
            <h3 className="text-base font-extrabold" style={{ color: '#f5f0eb' }}>تفاصيل الطلب</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <X className="w-4 h-4" style={{ color: '#a8a29e' }} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* الحالة والمبلغ */}
          <div className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: `${cfg.bg}`, border: `1px solid ${cfg.border}` }}>
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.25)', color: cfg.accent }}>
                {cfg.label}
              </span>
              <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: '#78716c' }}>
                <Calendar className="w-3 h-3" strokeWidth={2.5} />
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="text-left">
              <p className="text-2xl font-black" style={{ color: ACCENT }}>{total.toLocaleString('ar-DZ')}</p>
              <p className="text-[10px]" style={{ color: '#78716c' }}>دج</p>
            </div>
          </div>

          <MSection title="معلومات الزبون" icon={User}>
            <MRow label="الاسم" value={order.customerName || '-'} />
            <MRow label="الهاتف" value={order.customerPhone || '-'} ltr />
            {order.customerAddress && <MRow label="العنوان" value={order.customerAddress} />}
          </MSection>

          <MSection title="الطباخة" icon={ChefHat}>
            <MRow label="الاسم" value={order.cookName || '-'} />
          </MSection>

          <MSection title="الأطباق المطلوبة" icon={Package}>
            {Array.isArray(order.items) && order.items.length > 0 ? (
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#e7e5e4' }}>{item.name || item.dishName || '-'}</p>
                      <p className="text-[11px]" style={{ color: '#78716c' }}>{item.quantity} × {(item.price || 0).toLocaleString('ar-DZ')} دج</p>
                    </div>
                    <p className="text-sm font-black" style={{ color: ACCENT }}>
                      {((item.price || 0) * (item.quantity || 0)).toLocaleString('ar-DZ')} دج
                    </p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm" style={{ color: '#78716c' }}>لا توجد تفاصيل</p>}
          </MSection>

          {order.notes && (
            <MSection title="ملاحظات الزبون" icon={AlertCircle}>
              <p className="text-sm rounded-xl p-3" style={{ color: '#d6d3d1', background: 'rgba(255,255,255,0.03)' }}>{order.notes}</p>
            </MSection>
          )}

          {canCancel && (
            <button onClick={onCancel} disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)', color: '#f43f5e' }}>
              <XCircle className="w-4 h-4" strokeWidth={2.4} />
              {actionLoading ? 'جارٍ الإلغاء...' : 'إلغاء الطلب'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MSection({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: ACCENT }} strokeWidth={2.4} />
        <h4 className="text-xs font-extrabold" style={{ color: '#a8a29e' }}>{title}</h4>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function MRow({ label, value, ltr }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[11px]" style={{ color: '#78716c' }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: '#e7e5e4' }} dir={ltr ? 'ltr' : undefined}>{value}</p>
    </div>
  );
}

export default AdminOrders;
