import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, doc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  ArrowRight, Users, Phone, Loader2, Search, Download,
  RefreshCw, Trash2, Calendar, TrendingUp, Clock, UserPlus,
  BarChart2, X as XIcon,
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

const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
};

const formatDateKey = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ManageWaitlist = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'waitlist'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setEntries(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, []);

  const deleteEntry = async (entryId) => {
    if (!confirm('هل تريد حذف هذا الرقم من قائمة الانتظار؟')) return;
    try {
      await deleteDoc(doc(db, 'waitlist', entryId));
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (e) { console.error(e); }
  };

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      list = list.filter((e) => e.phone?.includes(q));
    }
    if (sortOrder === 'oldest') {
      list = [...list].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    }
    return list;
  }, [entries, searchQuery, sortOrder]);

  // Daily signup stats for the chart
  const dailyStats = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const key = formatDateKey(e.createdAt);
      if (key) map[key] = (map[key] || 0) + 1;
    });
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return sorted;
  }, [entries]);

  const maxDaily = useMemo(() => Math.max(...dailyStats.map(([, v]) => v), 1), [dailyStats]);

  // Stats
  const totalCount = entries.length;
  const todayKey = formatDateKey(new Date());
  const todayCount = entries.filter((e) => formatDateKey(e.createdAt) === todayKey).length;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);
  const yesterdayCount = entries.filter((e) => formatDateKey(e.createdAt) === yesterdayKey).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = entries.filter((e) => {
    if (!e.createdAt) return false;
    const d = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
    return d >= weekAgo;
  }).length;

  // Carrier prefix analysis
  const carrierStats = useMemo(() => {
    const map = { '05': 0, '06': 0, '07': 0 };
    entries.forEach((e) => {
      const prefix = e.phone?.substring(0, 2);
      if (prefix && map[prefix] !== undefined) map[prefix]++;
    });
    return map;
  }, [entries]);

  const exportCSV = () => {
    const rows = [['Phone', 'Date', 'Time']];
    entries.forEach((e) => {
      rows.push([e.phone || '', formatDate(e.createdAt), formatTime(e.createdAt)]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nakha-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
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
            <h1 className="text-lg font-extrabold text-white">قائمة الانتظار</h1>
            <p className="text-[11px] text-stone-500">{totalCount} مسجّل في الانتظار</p>
          </div>
          <button onClick={fetchEntries} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-stone-400 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'إجمالي المسجّلين', value: totalCount, icon: Users, color: '#f97316' },
            { label: 'اليوم', value: todayCount, icon: UserPlus, color: '#4ade80' },
            { label: 'الأمس', value: yesterdayCount, icon: Calendar, color: '#60a5fa' },
            { label: 'آخر 7 أيام', value: weekCount, icon: TrendingUp, color: '#a78bfa' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 relative overflow-hidden" style={S.card}>
              <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full opacity-10 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${s.color}, transparent 70%)` }} />
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-2xl font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {s.value.toLocaleString('ar-DZ')}
              </p>
              <p className="text-[10px] font-bold text-stone-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Carrier breakdown */}
        <div className="rounded-2xl p-4" style={S.card}>
          <p className="text-xs font-bold text-stone-300 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
            توزيع أرقام الهاتف
          </p>
          <div className="flex gap-2">
            {[
              { prefix: '05', label: 'موبيليس', color: '#4ade80' },
              { prefix: '06', label: 'أوريدو', color: '#f97316' },
              { prefix: '07', label: 'جيزي', color: '#60a5fa' },
            ].map((c) => {
              const count = carrierStats[c.prefix] || 0;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={c.prefix} className="flex-1 rounded-xl p-3 text-center" style={{ background: `${c.color}08`, border: `1px solid ${c.color}15` }}>
                  <p className="text-lg font-black" style={{ color: c.color }}>{count}</p>
                  <p className="text-[10px] font-bold text-stone-500">{c.label}</p>
                  <p className="text-[9px] text-stone-600 mt-0.5">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily chart */}
        {dailyStats.length > 0 && (
          <div className="rounded-2xl p-4" style={S.card}>
            <p className="text-xs font-bold text-stone-300 mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
              التسجيلات اليومية
            </p>
            <div className="flex items-end gap-1.5" style={{ height: '100px' }}>
              {dailyStats.slice(-14).map(([date, count]) => {
                const h = Math.max((count / maxDaily) * 100, 6);
                const isToday = date === todayKey;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      <div className="bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-[9px] font-bold text-white whitespace-nowrap">
                        {count} تسجيل
                      </div>
                    </div>
                    <div
                      className="w-full rounded-t-md transition-all duration-300"
                      style={{
                        height: `${h}%`,
                        background: isToday
                          ? 'linear-gradient(to top, #ea580c, #f97316)'
                          : 'linear-gradient(to top, #ea580c40, #f9731650)',
                        boxShadow: isToday ? '0 0 12px rgba(234,88,12,0.3)' : 'none',
                      }}
                    />
                    <span className="text-[8px] text-stone-600 font-semibold leading-none">
                      {formatDayLabel(date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search + Sort + Export */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الهاتف..."
              className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              dir="ltr"
            />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-stone-400 text-[11px] font-bold hover:text-white transition whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            {sortOrder === 'newest' ? 'الأحدث' : 'الأقدم'}
          </button>
          <button
            onClick={exportCSV}
            className="w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
            title="تصدير CSV"
          >
            <Download className="w-4 h-4 text-stone-400" strokeWidth={2} />
          </button>
        </div>

        {/* Entries list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-stone-700 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-stone-500">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد تسجيلات بعد'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredEntries.map((entry, idx) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-2xl p-3.5 group" style={S.card}>
                {/* Number badge */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.15)' }}>
                  <span className="text-[11px] font-black text-orange-400">
                    {sortOrder === 'newest' ? totalCount - idx : idx + 1}
                  </span>
                </div>

                {/* Phone */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white font-mono tracking-wider" dir="ltr">
                    {entry.phone}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-stone-600">{formatDate(entry.createdAt)}</span>
                    <span className="text-[10px] text-stone-700">•</span>
                    <span className="text-[10px] text-stone-600" dir="ltr">{formatTime(entry.createdAt)}</span>
                  </div>
                </div>

                {/* Carrier tag */}
                <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                  entry.phone?.startsWith('05') ? 'text-green-400 bg-green-500/10' :
                  entry.phone?.startsWith('06') ? 'text-orange-400 bg-orange-500/10' :
                  'text-blue-400 bg-blue-500/10'
                }`}>
                  {entry.phone?.startsWith('05') ? 'موبيليس' :
                   entry.phone?.startsWith('06') ? 'أوريدو' : 'جيزي'}
                </span>

                {/* Delete */}
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-stone-500 hover:text-red-400" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Total footer */}
        {!loading && filteredEntries.length > 0 && (
          <p className="text-center text-[11px] text-stone-600 font-bold">
            عرض {filteredEntries.length} من {totalCount} مسجّل
          </p>
        )}
      </main>
    </div>
  );
};

export default ManageWaitlist;
