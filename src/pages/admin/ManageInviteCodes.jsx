import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, doc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { INVITE_SYSTEM } from '../../config/settings';
import {
  ArrowRight, KeyRound, Plus, Loader2, Check, X as XIcon,
  Copy, Trash2, ToggleLeft, ToggleRight, RefreshCw, ChefHat,
  Search, Filter, Download, Clock, Mail, Phone, UserCheck,
  BarChart2, TrendingDown, Users, Zap,
} from 'lucide-react';

const S = {
  bg: { background: '#0D0B09', backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2117 1px, transparent 0)', backgroundSize: '28px 28px' },
  card: { background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)', border: '1px solid rgba(234,88,12,0.12)' },
  header: { background: 'rgba(13,11,9,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(234,88,12,0.12)' },
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
};

const isExpired = (code) => {
  if (!code.expires_at) return false;
  const d = code.expires_at.toDate ? code.expires_at.toDate() : new Date(code.expires_at);
  return d < new Date();
};

const getCodeStatus = (c) => {
  if (c.used) return 'used';
  if (isExpired(c)) return 'expired';
  if (c.active === false) return 'inactive';
  return 'available';
};

const ManageInviteCodes = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [analytics, setAnalytics] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignPhone, setAssignPhone] = useState('');

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'invite_codes'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
      setCodes(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try {
      const snap = await getDocs(collection(db, 'invite_analytics'));
      const list = snap.docs.map((d) => d.data());
      list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setAnalytics(list);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchCodes(); fetchAnalytics(); }, []);

  const generateCodes = async () => {
    setGenerating(true);
    try {
      const existingCodes = new Set(codes.map((c) => c.code));
      const newCodes = [];

      const randomCode = () => {
        const arr = new Uint8Array(4);
        crypto.getRandomValues(arr);
        return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 8);
      };

      for (let i = 0; i < genCount; i++) {
        let code;
        do { code = randomCode(); } while (existingCodes.has(code) || newCodes.includes(code));
        newCodes.push(code);
      }

      const expiresAt = INVITE_SYSTEM.expirationDays
        ? Timestamp.fromDate(new Date(Date.now() + INVITE_SYSTEM.expirationDays * 24 * 60 * 60 * 1000))
        : null;

      for (const code of newCodes) {
        await addDoc(collection(db, 'invite_codes'), {
          code,
          role: 'cook',
          used: false,
          active: true,
          used_by: null,
          used_by_name: null,
          used_by_email: null,
          assigned_to: null,
          campaign: INVITE_SYSTEM.campaign,
          created_at: serverTimestamp(),
          expires_at: expiresAt,
          used_at: null,
        });
      }

      await fetchCodes();
    } catch (e) { console.error(e); alert('حدث خطأ أثناء إنشاء الرموز'); }
    finally { setGenerating(false); }
  };

  const toggleActive = async (codeId, currentActive) => {
    try {
      await updateDoc(doc(db, 'invite_codes', codeId), { active: !currentActive });
      setCodes((prev) => prev.map((c) => c.id === codeId ? { ...c, active: !currentActive } : c));
    } catch (e) { console.error(e); }
  };

  const deleteCode = async (codeId) => {
    if (!confirm('هل تريد حذف هذا الرمز نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'invite_codes', codeId));
      setCodes((prev) => prev.filter((c) => c.id !== codeId));
    } catch (e) { console.error(e); }
  };

  const saveAssignment = async () => {
    if (!assignModal) return;
    const assignment = {};
    if (assignEmail.trim()) assignment.email = assignEmail.trim();
    if (assignPhone.trim()) assignment.phone = assignPhone.trim();

    try {
      await updateDoc(doc(db, 'invite_codes', assignModal), {
        assigned_to: Object.keys(assignment).length > 0 ? assignment : null,
      });
      setCodes((prev) => prev.map((c) =>
        c.id === assignModal ? { ...c, assigned_to: Object.keys(assignment).length > 0 ? assignment : null } : c
      ));
      setAssignModal(null);
      setAssignEmail('');
      setAssignPhone('');
    } catch (e) { console.error(e); }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
    const rows = [['Code', 'Status', 'Used By', 'Email', 'Created', 'Expires', 'Used At']];
    codes.forEach((c) => {
      rows.push([
        c.code,
        getCodeStatus(c),
        c.used_by_name || '',
        c.used_by_email || '',
        formatDate(c.created_at),
        formatDate(c.expires_at),
        formatDate(c.used_at),
      ]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nakha-invite-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = useMemo(() => {
    const all = codes.length;
    const used = codes.filter((c) => c.used).length;
    const expired = codes.filter((c) => !c.used && isExpired(c)).length;
    const available = codes.filter((c) => !c.used && !isExpired(c) && c.active !== false).length;
    const inactive = codes.filter((c) => !c.used && !isExpired(c) && c.active === false).length;
    return { all, used, expired, available, inactive };
  }, [codes]);

  const filteredCodes = useMemo(() => {
    let list = codes;
    if (filterTab !== 'all') {
      list = list.filter((c) => getCodeStatus(c) === filterTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) =>
        c.code.toLowerCase().includes(q) ||
        (c.used_by_name && c.used_by_name.toLowerCase().includes(q)) ||
        (c.used_by_email && c.used_by_email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [codes, filterTab, searchQuery]);

  const funnelStats = useMemo(() => {
    const pageViews = analytics.filter((a) => a.event === 'invite_page_view').length;
    const codesEntered = analytics.filter((a) => a.event === 'code_entered').length;
    const codesValid = analytics.filter((a) => a.event === 'code_valid').length;
    const signupsStarted = analytics.filter((a) => a.event === 'signup_started').length;
    const signupsCompleted = analytics.filter((a) => a.event === 'signup_completed' || a.event === 'account_created').length;
    return { pageViews, codesEntered, codesValid, signupsStarted, signupsCompleted };
  }, [analytics]);

  const conversionRate = funnelStats.pageViews > 0
    ? ((funnelStats.signupsCompleted / funnelStats.pageViews) * 100).toFixed(1)
    : '0.0';

  const filterTabs = [
    { key: 'all', label: 'الكل', count: counts.all },
    { key: 'available', label: 'متاح', count: counts.available },
    { key: 'used', label: 'مستخدم', count: counts.used },
    { key: 'expired', label: 'منتهي', count: counts.expired },
    { key: 'inactive', label: 'معطّل', count: counts.inactive },
  ];

  const statusBadge = (status) => {
    const m = {
      used: { text: 'مُستخدم', cls: 'text-green-400 bg-green-500/10' },
      available: { text: 'متاح', cls: 'text-orange-400 bg-orange-500/10' },
      expired: { text: 'منتهي', cls: 'text-red-400 bg-red-500/10' },
      inactive: { text: 'معطّل', cls: 'text-stone-500 bg-stone-500/10' },
    };
    const s = m[status] || m.inactive;
    return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.text}</span>;
  };

  return (
    <div dir="rtl" className="min-h-screen pb-8" style={S.bg}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-3" style={S.header}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-stone-300" strokeWidth={2.4} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-white">إدارة رموز الدعوة</h1>
            <p className="text-[11px] text-stone-500">{counts.all} رمز — {counts.used} مستخدم — {counts.available} متاح</p>
          </div>
          <button onClick={() => { fetchCodes(); fetchAnalytics(); }} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-stone-400 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'إجمالي', value: counts.all, color: 'text-white' },
            { label: 'مستخدم', value: counts.used, color: 'text-green-400' },
            { label: 'متاح', value: counts.available, color: 'text-orange-400' },
            { label: 'منتهي', value: counts.expired, color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={S.card}>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-stone-500 font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Analytics Toggle */}
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="w-full flex items-center justify-between rounded-2xl p-4" style={S.card}
        >
          <span className="flex items-center gap-2 text-xs font-bold text-stone-300">
            <BarChart2 className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
            تحليلات القمع التسويقي
          </span>
          <span className="text-[10px] font-bold text-orange-400">
            {conversionRate}% تحويل
          </span>
        </button>

        {showAnalytics && (
          <div className="rounded-2xl p-4 space-y-3" style={S.card}>
            <div className="space-y-2">
              {[
                { label: 'زيارات صفحة الدعوة', value: funnelStats.pageViews, icon: Users, color: 'text-blue-400' },
                { label: 'رموز أُدخلت', value: funnelStats.codesEntered, icon: KeyRound, color: 'text-purple-400' },
                { label: 'رموز صالحة', value: funnelStats.codesValid, icon: Check, color: 'text-green-400' },
                { label: 'بدأ التسجيل', value: funnelStats.signupsStarted, icon: Zap, color: 'text-amber-400' },
                { label: 'أكمل التسجيل', value: funnelStats.signupsCompleted, icon: ChefHat, color: 'text-orange-400' },
              ].map((step, idx) => {
                const prev = idx === 0 ? step.value : [funnelStats.pageViews, funnelStats.codesEntered, funnelStats.codesValid, funnelStats.signupsStarted, funnelStats.signupsCompleted][idx - 1];
                const dropOff = prev > 0 && step.value < prev ? ((1 - step.value / prev) * 100).toFixed(0) : null;
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${step.color}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-400">{step.label}</span>
                        <span className={`text-sm font-black ${step.color}`}>{step.value}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: funnelStats.pageViews > 0 ? `${(step.value / funnelStats.pageViews) * 100}%` : '0%',
                            background: step.color.includes('blue') ? '#60a5fa' : step.color.includes('purple') ? '#a78bfa' : step.color.includes('green') ? '#4ade80' : step.color.includes('amber') ? '#fbbf24' : '#f97316',
                          }}
                        />
                      </div>
                    </div>
                    {dropOff && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-400/70">
                        <TrendingDown className="w-3 h-3" strokeWidth={2} />
                        -{dropOff}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Generate */}
        <div className="rounded-2xl p-4" style={S.card}>
          <p className="text-xs font-bold text-stone-300 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
            إنشاء رموز جديدة
            {INVITE_SYSTEM.expirationDays && (
              <span className="text-[9px] text-stone-600 font-normal mr-auto">
                صالحة لـ {INVITE_SYSTEM.expirationDays} يوم
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <select
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            >
              {[1, 3, 5, 10, 15].map((n) => (
                <option key={n} value={n}>{n} رمز</option>
              ))}
            </select>
            <button
              onClick={generateCodes}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-extrabold text-sm active:scale-[0.98] transition-all"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
              {generating ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
            <button
              onClick={exportCSV}
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
              title="تصدير CSV"
            >
              <Download className="w-4 h-4 text-stone-400" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برمز أو اسم أو بريد..."
              className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                  filterTab === tab.key
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-stone-500 border border-white/5 hover:text-stone-300'
                }`}
              >
                {tab.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  filterTab === tab.key ? 'bg-orange-500/20' : 'bg-white/5'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Codes list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-12">
            <KeyRound className="w-12 h-12 text-stone-700 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-stone-500">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد رموز بعد'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCodes.map((c) => {
              const status = getCodeStatus(c);
              return (
                <div key={c.id} className="rounded-2xl p-4" style={S.card}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-white tracking-wider">{c.code}</span>
                      <button
                        onClick={() => copyCode(c.code, c.id)}
                        className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3.5 h-3.5 text-green-400" strokeWidth={2.5} />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-stone-500" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    {statusBadge(status)}
                  </div>

                  {/* Used by info */}
                  {c.used && c.used_by_name && (
                    <div className="flex items-center gap-2 mb-2 bg-green-500/5 rounded-xl px-3 py-2">
                      <ChefHat className="w-3.5 h-3.5 text-green-400" strokeWidth={2} />
                      <span className="text-[11px] text-green-300 font-semibold">{c.used_by_name}</span>
                      {c.used_by_email && (
                        <span className="text-[10px] text-stone-500 mr-auto" dir="ltr">{c.used_by_email}</span>
                      )}
                    </div>
                  )}

                  {/* Assignment info */}
                  {c.assigned_to && !c.used && (
                    <div className="flex items-center gap-2 mb-2 bg-purple-500/5 rounded-xl px-3 py-2">
                      <UserCheck className="w-3.5 h-3.5 text-purple-400" strokeWidth={2} />
                      <span className="text-[10px] text-purple-300 font-semibold" dir="ltr">
                        {c.assigned_to.email || c.assigned_to.phone}
                      </span>
                    </div>
                  )}

                  {/* Expiration info */}
                  {c.expires_at && !c.used && (
                    <div className={`flex items-center gap-1.5 mb-2 text-[10px] font-semibold ${
                      isExpired(c) ? 'text-red-400/70' : 'text-stone-600'
                    }`}>
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      {isExpired(c) ? 'انتهت الصلاحية' : `ينتهي: ${formatDate(c.expires_at)}`}
                    </div>
                  )}

                  {/* Actions for unused codes */}
                  {!c.used && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <button
                        onClick={() => toggleActive(c.id, c.active)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-white transition px-2 py-1.5 rounded-lg bg-white/5"
                      >
                        {c.active ? <ToggleRight className="w-4 h-4 text-orange-400" strokeWidth={2} /> : <ToggleLeft className="w-4 h-4 text-stone-600" strokeWidth={2} />}
                        {c.active ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button
                        onClick={() => { setAssignModal(c.id); setAssignEmail(c.assigned_to?.email || ''); setAssignPhone(c.assigned_to?.phone || ''); }}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-purple-400/70 hover:text-purple-400 transition px-2 py-1.5 rounded-lg bg-white/5"
                      >
                        <UserCheck className="w-3.5 h-3.5" strokeWidth={2} />
                        تخصيص
                      </button>
                      <button
                        onClick={() => deleteCode(c.id)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-red-400/70 hover:text-red-400 transition px-2 py-1.5 rounded-lg bg-white/5"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        حذف
                      </button>
                    </div>
                  )}

                  {c.created_at && (
                    <p className="text-[9px] text-stone-600 mt-2" dir="ltr">{formatDate(c.created_at)}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Assignment Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => setAssignModal(null)}>
          <div
            dir="rtl"
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ background: '#1a1410', border: '1px solid rgba(234,88,12,0.22)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" strokeWidth={2.4} />
                تخصيص الرمز
              </h3>
              <button onClick={() => setAssignModal(null)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                <XIcon className="w-3.5 h-3.5 text-stone-500" strokeWidth={2} />
              </button>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              اختياري: خصّص هذا الرمز لبريد أو رقم هاتف محدد. لن يقبل إلا من المستخدمة المعنية.
            </p>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-500" strokeWidth={2} />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-orange-500" strokeWidth={2} />
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={assignPhone}
                onChange={(e) => setAssignPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveAssignment}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-purple-500 to-purple-600 text-white py-2.5 rounded-xl font-extrabold text-sm active:scale-[0.98] transition-all"
              >
                <Check className="w-4 h-4" strokeWidth={2.5} />
                حفظ
              </button>
              {(assignEmail || assignPhone) && (
                <button
                  onClick={() => { setAssignEmail(''); setAssignPhone(''); }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-stone-400 text-sm font-bold hover:text-white transition"
                >
                  مسح
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInviteCodes;
