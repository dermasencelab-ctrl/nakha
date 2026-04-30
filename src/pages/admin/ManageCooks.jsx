import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, addDoc,
  serverTimestamp, query, orderBy, where,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FOUNDING_MEMBERS } from '../../config/settings';
import { ExternalLink, X as XIcon, ZoomIn, ArrowRight, ChefHat, CheckCircle, XCircle, Clock, Star, Package, Wallet, Eye } from 'lucide-react';

const S = {
  bg: { background: '#0D0B09', backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2117 1px, transparent 0)', backgroundSize: '28px 28px' },
  card: { background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)', border: '1px solid rgba(234,88,12,0.12)' },
  modal: { background: '#1a1410', border: '1px solid rgba(234,88,12,0.22)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' },
  input: { background: '#100e0c', border: '1px solid rgba(234,88,12,0.20)', color: '#d6d3d1' },
  header: { background: 'rgba(13,11,9,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(234,88,12,0.12)' },
};

const getSocialEmoji = (url) => {
  if (!url) return '🔗';
  if (url.includes('instagram')) return '📷';
  if (url.includes('facebook') || url.includes('fb.com')) return '👥';
  if (url.includes('tiktok')) return '🎵';
  return '🔗';
};
const getSocialLabel = (url) => {
  if (!url) return 'رابط التواصل';
  if (url.includes('instagram')) return 'إنستغرام';
  if (url.includes('facebook') || url.includes('fb.com')) return 'فيسبوك';
  if (url.includes('tiktok')) return 'تيك توك';
  return 'رابط التواصل';
};

const cookTypeLabels = {
  home_cook: '👩‍🍳 طباخة حرة',
  pastry: '🍰 حلويات',
  traditional: '🍲 تقليدي',
  healthy: '🥗 صحي',
};

const ManageCooks = () => {
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedCook, setSelectedCook] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const fetchCooks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'cooks'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setCooks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCooks(); }, []);

  const handleApprove = async (cookId) => {
    setActionLoading(cookId);
    try {
      let foundingData = {};
      if (FOUNDING_MEMBERS.enabled) {
        const fSnap = await getDocs(query(collection(db, 'cooks'), where('isFoundingMember', '==', true)));
        const fCount = fSnap.size;
        if (fCount < FOUNDING_MEMBERS.maxCount) {
          foundingData = {
            isFoundingMember: true,
            foundingMemberNumber: fCount + 1,
            balance: FOUNDING_MEMBERS.welcomeBalance,
            freeOrdersRemaining: FOUNDING_MEMBERS.freeOrders,
            freeOrdersUsed: 0,
            joinedAsFoundingAt: serverTimestamp(),
          };
        }
      }
      await updateDoc(doc(db, 'cooks', cookId), { status: 'approved', approvedAt: serverTimestamp(), ...foundingData });
      if (foundingData.isFoundingMember) {
        await addDoc(collection(db, 'transactions'), {
          cookId, type: 'welcome_bonus', amount: FOUNDING_MEMBERS.welcomeBalance,
          description: `🎁 هدية ترحيبية - عضو مؤسسة #${foundingData.foundingMemberNumber}`,
          balanceBefore: 0, balanceAfter: FOUNDING_MEMBERS.welcomeBalance, createdAt: serverTimestamp(),
        });
        alert(`✅ تم قبول الطباخة كعضو مؤسسة #${foundingData.foundingMemberNumber}!`);
      } else { alert('✅ تم قبول الطباخة بنجاح'); }
      setSelectedCook(null);
      await fetchCooks();
    } catch (e) { console.error(e); alert('حدث خطأ'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (cookId) => {
    const reason = prompt('سبب الرفض (اختياري):');
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), { status: 'rejected', rejectionReason: reason || '' });
      setSelectedCook(null);
      await fetchCooks();
    } catch (e) { console.error(e); alert('حدث خطأ'); }
    finally { setActionLoading(null); }
  };

  const handleReapprove = async (cookId) => {
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), { status: 'approved', approvedAt: serverTimestamp() });
      await fetchCooks();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (cookId) => {
    if (!confirm('هل تريد إيقاف هذه الطباخة؟')) return;
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), { status: 'pending' });
      await fetchCooks();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (cookId) => {
    if (!confirm('⚠️ سيتم حذف الطباخة نهائياً. هل أنت متأكد؟')) return;
    setActionLoading(cookId);
    try {
      await deleteDoc(doc(db, 'cooks', cookId));
      await deleteDoc(doc(db, 'users', cookId));
      setSelectedCook(null);
      await fetchCooks();
    } catch (e) { console.error(e); alert('حدث خطأ'); }
    finally { setActionLoading(null); }
  };

  const foundingCount = cooks.filter((c) => c.isFoundingMember).length;
  const foundingSpotsLeft = FOUNDING_MEMBERS.maxCount - foundingCount;
  const filteredCooks = cooks.filter((c) => c.status === activeTab);
  const counts = {
    pending: cooks.filter((c) => c.status === 'pending').length,
    approved: cooks.filter((c) => c.status === 'approved').length,
    rejected: cooks.filter((c) => c.status === 'rejected').length,
  };

  const TABS = [
    { key: 'pending', label: 'معلّقات', icon: Clock, accent: '#f59e0b', count: counts.pending },
    { key: 'approved', label: 'معتمدات', icon: CheckCircle, accent: '#10b981', count: counts.approved },
    { key: 'rejected', label: 'مرفوضات', icon: XCircle, accent: '#ef4444', count: counts.rejected },
  ];

  return (
    <div dir="rtl" className="min-h-screen pb-12" style={S.bg}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={S.header}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-orange-500/10" style={S.card}>
            <ArrowRight className="w-4 h-4 text-stone-300" strokeWidth={2.4} />
          </Link>
          <h1 className="text-base font-black text-stone-100">إدارة الطباخات</h1>
          <span className="mr-auto text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}>
            {cooks.length} طباخة
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-5">

        {/* Founding members banner */}
        {FOUNDING_MEMBERS.enabled && (
          <div className="rounded-2xl p-4 animate-slide-up" style={{ background: 'linear-gradient(135deg, #1f1508, #251a08)', border: '1px solid rgba(251,191,36,0.25)', boxShadow: '0 0 30px rgba(251,191,36,0.08)' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎁</div>
                <div>
                  <p className="font-black text-amber-300 text-sm">عرض المؤسسين النشط</p>
                  <p className="text-[11px] text-amber-500/70">{foundingCount} من {FOUNDING_MEMBERS.maxCount} طباخة انضمت</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <span className="text-xs text-amber-400/70">المتبقي</span>
                <span className="text-lg font-black text-amber-300">{foundingSpotsLeft > 0 ? `${foundingSpotsLeft} مكان` : 'انتهى'}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(251,191,36,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(foundingCount / FOUNDING_MEMBERS.maxCount) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 p-1.5 rounded-2xl animate-slide-up" style={{ animationDelay: '80ms', background: '#100e0c', border: '1px solid rgba(234,88,12,0.10)' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={isActive ? { background: `${tab.accent}20`, color: tab.accent, border: `1px solid ${tab.accent}35` } : { color: '#78716c', border: '1px solid transparent' }}>
                <Icon className="w-4 h-4" strokeWidth={2.3} />
                {tab.label}
                {tab.count > 0 && (
                  <span className="min-w-[20px] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center"
                    style={{ background: isActive ? `${tab.accent}25` : '#1c1713', color: isActive ? tab.accent : '#6b7280' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />)}
          </div>
        ) : filteredCooks.length === 0 ? (
          <div className="rounded-2xl p-12 text-center animate-slide-up" style={S.card}>
            <div className="text-5xl mb-3">📭</div>
            <p className="text-stone-500 text-sm">
              {activeTab === 'pending' && 'لا توجد طلبات معلّقة حالياً'}
              {activeTab === 'approved' && 'لا توجد طباخات معتمدات بعد'}
              {activeTab === 'rejected' && 'لا توجد طباخات مرفوضات'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCooks.map((cook, i) => (
              <div key={cook.id} className="rounded-2xl p-4 animate-slide-up transition-all duration-200 hover:border-orange-500/25"
                style={{ ...S.card, animationDelay: `${i * 50}ms`, border: cook.isFoundingMember ? '1px solid rgba(251,191,36,0.30)' : S.card.border }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {cook.photo
                      ? <img src={cook.photo} alt={cook.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" style={{ border: '2px solid rgba(234,88,12,0.25)' }} />
                      : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>👩‍🍳</div>
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-black text-stone-100">{cook.name}</h3>
                        {cook.isFoundingMember && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                            ⭐ #{cook.foundingMemberNumber}
                          </span>
                        )}
                        {cook.cookType && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,0.10)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.18)' }}>
                            {cookTypeLabels[cook.cookType] || cook.cookType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">📍 {cook.neighborhood} &nbsp;•&nbsp; 📱 <span dir="ltr">{cook.phone}</span></p>
                      {activeTab === 'approved' && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>💰 {cook.balance || 0} دج</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>📦 {cook.totalOrders || 0} طلب</span>
                          {cook.averageRating > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>⭐ {cook.averageRating?.toFixed(1)}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-col gap-2 md:w-40">
                    <button onClick={() => setSelectedCook(cook)}
                      className="flex-1 md:flex-none py-2 px-3 rounded-xl text-xs font-bold transition hover:border-orange-500/40"
                      style={{ background: 'rgba(234,88,12,0.08)', color: '#fb923c', border: '1px solid rgba(234,88,12,0.18)' }}>
                      🔍 عرض التفاصيل
                    </button>
                    {activeTab === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(cook.id)} disabled={actionLoading === cook.id}
                          className="flex-1 md:flex-none py-2 px-3 rounded-xl text-xs font-bold transition disabled:opacity-40"
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                          {actionLoading === cook.id ? '...' : '✅ قبول'}
                        </button>
                        <button onClick={() => handleReject(cook.id)} disabled={actionLoading === cook.id}
                          className="flex-1 md:flex-none py-2 px-3 rounded-xl text-xs font-bold transition disabled:opacity-40"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                          ❌ رفض
                        </button>
                      </>
                    )}
                    {activeTab === 'approved' && (
                      <button onClick={() => handleSuspend(cook.id)} disabled={actionLoading === cook.id}
                        className="flex-1 md:flex-none py-2 px-3 rounded-xl text-xs font-bold transition disabled:opacity-40"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }}>
                        ⏸️ إيقاف
                      </button>
                    )}
                    {activeTab === 'rejected' && (
                      <button onClick={() => handleReapprove(cook.id)} disabled={actionLoading === cook.id}
                        className="flex-1 md:flex-none py-2 px-3 rounded-xl text-xs font-bold transition disabled:opacity-40"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }}>
                        ↩️ إعادة قبول
                      </button>
                    )}
                    <button onClick={() => handleDelete(cook.id)} disabled={actionLoading === cook.id}
                      className="text-[11px] text-red-500/60 hover:text-red-400 transition text-center py-1">
                      🗑️ حذف نهائي
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCook && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelectedCook(null)}>
          <div className="w-full md:max-w-2xl max-h-[90vh] overflow-y-auto md:rounded-2xl rounded-t-2xl"
            style={S.modal} onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ background: '#1a1410', borderColor: 'rgba(234,88,12,0.12)' }}>
              <h2 className="font-black text-stone-100">ملف الطباخة</h2>
              <button onClick={() => setSelectedCook(null)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-orange-500/10 transition" style={{ border: '1px solid rgba(234,88,12,0.2)' }}>
                <XIcon className="w-4 h-4 text-stone-400" strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Photo + name */}
              <div className="flex items-center gap-4">
                {selectedCook.photo
                  ? <img src={selectedCook.photo} alt={selectedCook.name} className="w-20 h-20 rounded-2xl object-cover" style={{ border: '2px solid rgba(234,88,12,0.3)' }} />
                  : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>👩‍🍳</div>
                }
                <div>
                  <h3 className="text-xl font-black text-stone-100">{selectedCook.name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c' }}>
                    {cookTypeLabels[selectedCook.cookType] || selectedCook.cookType}
                  </span>
                  <p className={`text-xs font-bold mt-1 ${selectedCook.status === 'approved' ? 'text-emerald-400' : selectedCook.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}`}>
                    {selectedCook.status === 'approved' ? '✅ معتمدة' : selectedCook.status === 'rejected' ? '❌ مرفوضة' : '⏳ معلّقة'}
                  </p>
                </div>
              </div>

              {/* Info */}
              <InfoSection title="📋 المعلومات الأساسية">
                <InfoRow label="الحي" value={selectedCook.neighborhood} />
                <InfoRow label="الهاتف" value={selectedCook.phone} ltr />
                {selectedCook.bio && <InfoRow label="النبذة" value={selectedCook.bio} />}
              </InfoSection>

              {/* Specialties */}
              {selectedCook.specialties?.length > 0 && (
                <InfoSection title="🍽️ التخصصات">
                  <div className="flex flex-wrap gap-1.5 p-3">
                    {selectedCook.specialties.map(s => (
                      <span key={s} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.10)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.18)' }}>{s}</span>
                    ))}
                  </div>
                </InfoSection>
              )}

              {/* Social link */}
              {selectedCook.socialLink && (
                <InfoSection title="🔗 التواصل الاجتماعي">
                  <div className="p-3">
                    <a href={selectedCook.socialLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition hover:opacity-80"
                      style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.22)' }}>
                      <span>{getSocialEmoji(selectedCook.socialLink)}</span>
                      {getSocialLabel(selectedCook.socialLink)}
                      <ExternalLink className="w-3 h-3" strokeWidth={2} />
                    </a>
                  </div>
                </InfoSection>
              )}

              {/* Portfolio */}
              {selectedCook.portfolioImages?.length > 0 ? (
                <InfoSection title={`📸 أعمال سابقة (${selectedCook.portfolioImages.length})`}>
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {selectedCook.portfolioImages.map((img, i) => (
                      <button key={i} type="button" onClick={() => setLightboxImg(img)}
                        className="relative aspect-square overflow-hidden rounded-xl group transition hover:scale-105">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" style={{ background: 'rgba(0,0,0,0.5)' }}>
                          <ZoomIn className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                      </button>
                    ))}
                  </div>
                </InfoSection>
              ) : (
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(120,113,108,0.08)', border: '1px solid rgba(120,113,108,0.12)' }}>
                  <p className="text-xs text-stone-600">لم تحمّل صور أعمال بعد</p>
                </div>
              )}

              {/* Warning no portfolio/social */}
              {!selectedCook.socialLink && (!selectedCook.portfolioImages || selectedCook.portfolioImages.length === 0) && (
                <div className="rounded-xl p-3 text-xs font-bold" style={{ background: 'rgba(245,158,11,0.10)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }}>
                  ⚠️ لا توجد صور أعمال ولا رابط تواصل — تأكد من المراجعة قبل القبول
                </div>
              )}

              {/* Stats for approved */}
              {selectedCook.status === 'approved' && (
                <InfoSection title="📊 الإحصائيات">
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {[
                      { label: 'الرصيد', value: `${selectedCook.balance || 0} دج`, color: '#34d399' },
                      { label: 'الطلبات', value: selectedCook.totalOrders || 0, color: '#60a5fa' },
                      { label: 'التقييم', value: selectedCook.averageRating?.toFixed(1) || '-', color: '#fbbf24' },
                      { label: 'العمولات', value: `${selectedCook.totalCommission || 0} دج`, color: '#f87171' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#100e0c' }}>
                        <p className="text-[10px] text-stone-600 mb-1">{s.label}</p>
                        <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}

              {/* Rejection reason */}
              {selectedCook.status === 'rejected' && selectedCook.rejectionReason && (
                <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                  <span className="font-black">سبب الرفض: </span>{selectedCook.rejectionReason}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: 'rgba(234,88,12,0.12)' }}>
                {selectedCook.status === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(selectedCook.id)} disabled={actionLoading === selectedCook.id}
                      className="flex-1 py-3 rounded-xl font-black text-sm transition disabled:opacity-40"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                      {actionLoading === selectedCook.id ? 'جاري القبول...' : '✅ قبول الطباخة'}
                    </button>
                    <button onClick={() => handleReject(selectedCook.id)} disabled={actionLoading === selectedCook.id}
                      className="flex-1 py-3 rounded-xl font-black text-sm transition disabled:opacity-40"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                      ❌ رفض
                    </button>
                  </>
                )}
                {selectedCook.status === 'approved' && (
                  <button onClick={() => handleSuspend(selectedCook.id)} disabled={actionLoading === selectedCook.id}
                    className="flex-1 py-3 rounded-xl font-black text-sm transition"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }}>
                    ⏸️ إيقاف مؤقت
                  </button>
                )}
                {selectedCook.status === 'rejected' && (
                  <button onClick={() => handleReapprove(selectedCook.id)} disabled={actionLoading === selectedCook.id}
                    className="flex-1 py-3 rounded-xl font-black text-sm transition"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }}>
                    ↩️ إعادة قبول
                  </button>
                )}
                <button onClick={() => setSelectedCook(null)}
                  className="px-5 py-3 rounded-xl font-bold text-sm text-stone-500 hover:text-stone-300 transition"
                  style={{ border: '1px solid rgba(120,113,108,0.2)' }}>
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }} onClick={() => setLightboxImg(null)}>
          <button onClick={() => setLightboxImg(null)} className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <XIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
          <img src={lightboxImg} alt="" onClick={e => e.stopPropagation()} className="max-w-full max-h-[90vh] object-contain rounded-2xl" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }} />
        </div>
      )}
    </div>
  );
};

function InfoSection({ title, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(234,88,12,0.10)' }}>
      <div className="px-3 py-2 text-xs font-black text-stone-400" style={{ background: '#100e0c' }}>{title}</div>
      <div style={{ background: '#141110' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, ltr }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-t" style={{ borderColor: 'rgba(234,88,12,0.08)' }}>
      <span className="text-[11px] text-stone-600">{label}</span>
      <span className="text-xs font-bold text-stone-300" dir={ltr ? 'ltr' : undefined}>{value}</span>
    </div>
  );
}

export default ManageCooks;
