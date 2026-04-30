import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ArrowRight, Wallet, Clock, CheckCircle, XCircle, X, ZoomIn } from 'lucide-react';

const ACCENT = '#10b981';

const S = {
  bg: {
    background: '#0D0B09',
    backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2117 1px, transparent 0)',
    backgroundSize: '28px 28px',
  },
  card: {
    background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)',
    border: '1px solid rgba(16,185,129,0.12)',
  },
  modal: {
    background: '#1a1410',
    border: '1px solid rgba(16,185,129,0.22)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
  },
  input: {
    background: '#100e0c',
    border: '1px solid rgba(16,185,129,0.20)',
    color: '#d6d3d1',
  },
  header: {
    background: 'rgba(13,11,9,0.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(16,185,129,0.12)',
  },
};

const TABS = [
  { key: 'pending', label: 'معلّقة', icon: Clock, accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)' },
  { key: 'approved', label: 'مقبولة', icon: CheckCircle, accent: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
  { key: 'rejected', label: 'مرفوضة', icon: XCircle, accent: '#f43f5e', bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.28)' },
];

const formatDate = (ts) => {
  if (!ts?.seconds) return '-';
  return new Date(ts.seconds * 1000).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ManageTopups = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'topup_requests'));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(data);
    } catch (err) {
      console.error('Error fetching topup requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (request) => {
    if (!confirm(`هل أنت متأكد من قبول طلب شحن ${request.amount} دج للطباخة ${request.cookName}؟`)) return;
    setActionLoading(request.id);
    try {
      const cookRef = doc(db, 'cooks', request.cookId);
      const cookSnap = await getDoc(cookRef);
      if (!cookSnap.exists()) throw new Error('الطباخة غير موجودة');
      const cookData = cookSnap.data();
      const balanceBefore = cookData.balance || 0;
      const balanceAfter = balanceBefore + request.amount;
      await updateDoc(cookRef, { balance: balanceAfter });
      await updateDoc(doc(db, 'topup_requests', request.id), { status: 'approved', reviewedAt: serverTimestamp(), reviewedBy: currentUser?.uid || 'admin' });
      await addDoc(collection(db, 'transactions'), {
        cookId: request.cookId, type: 'topup', amount: request.amount,
        description: `💵 شحن رصيد - تحويل #${request.transactionNumber}`,
        balanceBefore, balanceAfter, topupRequestId: request.id, createdAt: serverTimestamp(),
      });
      alert(`✅ تم قبول طلب الشحن!\nأُضيف ${request.amount} دج لرصيد ${request.cookName}\nالرصيد الجديد: ${balanceAfter} دج`);
      await fetchRequests();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء القبول');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) { alert('يرجى كتابة سبب الرفض'); return; }
    setActionLoading(rejectingId);
    try {
      await updateDoc(doc(db, 'topup_requests', rejectingId), {
        status: 'rejected', rejectionReason: rejectionReason.trim(),
        reviewedAt: serverTimestamp(), reviewedBy: currentUser?.uid || 'admin',
      });
      setRejectingId(null);
      setRejectionReason('');
      await fetchRequests();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الرفض');
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };
  const totalApproved = requests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0);
  const filteredRequests = requests.filter(r => r.status === activeTab);

  return (
    <div dir="rtl" className="min-h-screen pb-12" style={S.bg}>
      <header className="sticky top-0 z-30" style={S.header}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
            style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
            <ArrowRight className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
          </Link>
          <Wallet className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={2.2} />
          <h1 className="text-base font-extrabold" style={{ color: '#f5f0eb' }}>شحن الأرصدة</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'طلبات معلّقة', count: counts.pending, accent: '#f59e0b' },
            { label: 'طلبات مقبولة', count: counts.approved, accent: ACCENT },
            { label: 'إجمالي المشحون', count: `${totalApproved.toLocaleString('ar-DZ')} دج`, accent: '#3b82f6' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ ...S.card, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <p className="text-[11px] mb-1.5 font-bold" style={{ color: '#78716c' }}>{s.label}</p>
              <p className="text-xl font-black" style={{ color: s.accent }}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* التبويبات */}
        <div className="flex gap-2 mb-6 p-1.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition"
                style={active ? { background: tab.bg, border: `1px solid ${tab.border}`, color: tab.accent } : { color: '#78716c' }}>
                <Icon className="w-3.5 h-3.5" strokeWidth={2.3} />
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                    style={active ? { background: 'rgba(0,0,0,0.25)', color: tab.accent } : { background: 'rgba(255,255,255,0.08)', color: '#a8a29e' }}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <Wallet className="w-12 h-12 mb-3" style={{ color: '#44403c' }} strokeWidth={1.5} />
            <p className="text-sm" style={{ color: '#78716c' }}>
              {activeTab === 'pending' ? 'لا توجد طلبات معلّقة' : activeTab === 'approved' ? 'لا توجد طلبات مقبولة' : 'لا توجد طلبات مرفوضة'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(req => (
              <TopupCard
                key={req.id}
                request={req}
                activeTab={activeTab}
                actionLoading={actionLoading}
                onApprove={() => handleApprove(req)}
                onReject={() => { setRejectingId(req.id); setRejectionReason(''); }}
                onViewImage={() => setViewingImage(req.receiptImage)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* لايت بوكس الصورة */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/92 flex items-center justify-center z-50 p-4 cursor-zoom-out"
          onClick={() => setViewingImage(null)}>
          <button onClick={() => setViewingImage(null)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
          <img src={viewingImage} alt="إيصال" className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* مودال سبب الرفض */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-3xl" style={S.modal}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(244,63,94,0.12)' }}>
              <h3 className="font-extrabold text-base" style={{ color: '#f5f0eb' }}>سبب الرفض</h3>
              <button onClick={() => setRejectingId(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X className="w-4 h-4" style={{ color: '#a8a29e' }} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                rows={4} placeholder="مثلاً: لم يصل التحويل، رقم التحويل غير صحيح..."
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                style={S.input} autoFocus />
              <div className="flex gap-3">
                <button onClick={confirmReject} disabled={actionLoading === rejectingId}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm transition active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)', color: '#fff', boxShadow: '0 4px 16px rgba(244,63,94,0.3)' }}>
                  {actionLoading === rejectingId ? 'جارٍ...' : 'تأكيد الرفض'}
                </button>
                <button onClick={() => setRejectingId(null)}
                  className="px-6 py-3 rounded-2xl font-bold text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#a8a29e' }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TopupCard({ request, activeTab, actionLoading, onApprove, onReject, onViewImage, formatDate }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ ...S.card, boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
      <div className="flex flex-col md:flex-row gap-0">
        {request.receiptImage && (
          <button onClick={onViewImage}
            className="md:w-44 flex-shrink-0 relative group overflow-hidden"
            style={{ minHeight: '140px' }}>
            <img src={request.receiptImage} alt="إيصال" className="w-full h-full object-cover" style={{ minHeight: '140px' }} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <ZoomIn className="w-8 h-8 text-white" strokeWidth={1.8} />
            </div>
          </button>
        )}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-[11px] mb-0.5" style={{ color: '#78716c' }}>المبلغ المطلوب</p>
              <p className="text-2xl font-black" style={{ color: ACCENT }}>
                {(request.amount || 0).toLocaleString('ar-DZ')} <span className="text-base">دج</span>
              </p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: '#78716c' }}>📅 تاريخ الطلب</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#a8a29e' }}>{formatDate(request.createdAt)}</p>
            </div>
          </div>

          <div className="rounded-xl p-3 mb-3 space-y-1.5 text-xs"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <InfoLine label="👩‍🍳 الطباخة" value={request.cookName} />
            {request.cookEmail && <InfoLine label="📧 البريد" value={request.cookEmail} ltr />}
            <InfoLine label="🔢 رقم التحويل" value={request.transactionNumber} ltr mono />
            {request.notes && <InfoLine label="📝 ملاحظات" value={request.notes} />}
            {request.rejectionReason && (
              <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <span className="font-bold" style={{ color: '#f43f5e' }}>❌ سبب الرفض: </span>
                <span style={{ color: '#fca5a5' }}>{request.rejectionReason}</span>
              </div>
            )}
            {request.reviewedAt && (
              <p className="text-[10px] mt-1" style={{ color: '#57534e' }}>راجعه الأدمن: {formatDate(request.reviewedAt)}</p>
            )}
          </div>

          {activeTab === 'pending' && (
            <div className="flex gap-2">
              <button onClick={onApprove} disabled={actionLoading === request.id}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 3px 14px rgba(16,185,129,0.3)' }}>
                {actionLoading === request.id ? '...' : '✅ تأكيد وإضافة الرصيد'}
              </button>
              <button onClick={onReject} disabled={actionLoading === request.id}
                className="px-4 py-2.5 rounded-xl font-bold text-sm transition active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)', color: '#f43f5e' }}>
                رفض
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value, ltr, mono }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: '#78716c' }}>{label}:</span>
      <span dir={ltr ? 'ltr' : undefined}
        style={{ color: '#d6d3d1', fontFamily: mono ? 'monospace' : undefined, fontWeight: mono ? '700' : undefined }}>
        {value || '-'}
      </span>
    </div>
  );
}

export default ManageTopups;
