import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  ArrowRight, Star, Trash2, AlertTriangle, ChefHat, User, Calendar,
  Filter, TrendingDown, MessageSquare, Edit2, EyeOff, Eye, X, Save,
} from 'lucide-react';

const ACCENT = '#f59e0b';

const S = {
  bg: {
    background: '#0D0B09',
    backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2117 1px, transparent 0)',
    backgroundSize: '28px 28px',
  },
  card: {
    background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)',
    border: '1px solid rgba(245,158,11,0.10)',
  },
  modal: {
    background: '#1a1410',
    border: '1px solid rgba(245,158,11,0.22)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
  },
  input: {
    background: '#100e0c',
    border: '1px solid rgba(245,158,11,0.20)',
    color: '#d6d3d1',
  },
  header: {
    background: 'rgba(13,11,9,0.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(245,158,11,0.12)',
  },
};

const formatDate = (ts) => {
  if (!ts?.seconds) return '-';
  return new Date(ts.seconds * 1000).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
};

const AdminRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [hidingId, setHidingId] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ratingsSnap, cooksSnap] = await Promise.all([
        getDocs(collection(db, 'ratings')),
        getDocs(collection(db, 'cooks')),
      ]);
      const data = ratingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRatings(data);
      setCooks(cooksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (rating) => {
    if (!confirm(`هل أنت متأكد من حذف تقييم ${rating.customerName || 'الزبون'} (${rating.rating} نجوم)؟`)) return;
    setDeletingId(rating.id);
    try {
      await deleteDoc(doc(db, 'ratings', rating.id));
      if (rating.cookId) {
        const cook = cooks.find(c => c.id === rating.cookId);
        if (cook) {
          const newTotal = Math.max(0, (cook.totalRatings || 0) - 1);
          const newSum = Math.max(0, (cook.ratingSum || 0) - (rating.rating || 0));
          await updateDoc(doc(db, 'cooks', rating.cookId), {
            totalRatings: increment(-1),
            ratingSum: increment(-(rating.rating || 0)),
            averageRating: newTotal > 0 ? Number((newSum / newTotal).toFixed(2)) : 0,
          });
        }
      }
      await fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleHide = async (rating) => {
    setHidingId(rating.id);
    try {
      await updateDoc(doc(db, 'ratings', rating.id), { hidden: !rating.hidden });
      await fetchData();
    } catch (err) {
      console.error('Hide error:', err);
    } finally {
      setHidingId(null);
    }
  };

  const openEdit = (rating) => {
    setEditingRating(rating);
    setEditForm({ rating: rating.rating || 5, comment: rating.comment || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingRating) return;
    setSaving(true);
    try {
      const oldRating = editingRating.rating || 0;
      const newRating = Number(editForm.rating);
      await updateDoc(doc(db, 'ratings', editingRating.id), { rating: newRating, comment: editForm.comment });
      if (editingRating.cookId && oldRating !== newRating) {
        const cook = cooks.find(c => c.id === editingRating.cookId);
        if (cook) {
          const newSum = Math.max(0, (cook.ratingSum || 0) - oldRating + newRating);
          const total = cook.totalRatings || 1;
          await updateDoc(doc(db, 'cooks', editingRating.cookId), {
            ratingSum: newSum,
            averageRating: Number((newSum / total).toFixed(2)),
          });
        }
      }
      setEditingRating(null);
      await fetchData();
    } catch (err) {
      console.error('Edit error:', err);
      alert('حدث خطأ أثناء التعديل');
    } finally {
      setSaving(false);
    }
  };

  const filteredRatings = useMemo(() => {
    let r = ratings;
    if (starFilter !== 'all') r = r.filter(x => x.rating === Number(starFilter));
    if (visibilityFilter === 'visible') r = r.filter(x => !x.hidden);
    if (visibilityFilter === 'hidden') r = r.filter(x => x.hidden);
    return r;
  }, [ratings, starFilter, visibilityFilter]);

  const lowRatedCooks = useMemo(() => (
    cooks
      .filter(c => c.status === 'approved' && (c.totalRatings || 0) >= 3 && (c.averageRating || 0) > 0 && (c.averageRating || 0) < 3.5)
      .sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0))
      .slice(0, 10)
  ), [cooks]);

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { if (r.rating >= 1 && r.rating <= 5) c[r.rating]++; });
    return c;
  }, [ratings]);

  return (
    <div dir="rtl" className="min-h-screen pb-12" style={S.bg}>
      <header className="sticky top-0 z-30" style={S.header}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
            style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
            <ArrowRight className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
          </Link>
          <Star className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={2.2} />
          <h1 className="text-base font-extrabold" style={{ color: '#f5f0eb' }}>إدارة التقييمات</h1>
          <span className="mr-auto text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: 'rgba(245,158,11,0.12)', color: ACCENT }}>
            {ratings.length} تقييم
            {ratings.filter(r => r.hidden).length > 0 && ` (${ratings.filter(r => r.hidden).length} مخفي)`}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-5 space-y-6">
        {loading ? (
          <RatingsSkeleton />
        ) : (
          <>
            {/* توزيع النجوم */}
            <section>
              <SectionTitle icon={Star} title="توزيع التقييمات" />
              <div className="rounded-2xl p-5" style={S.card}>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = counts[star] || 0;
                    const pct = ratings.length ? (count / ratings.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-12">
                          <span className="text-sm font-black" style={{ color: '#f5f0eb' }}>{star}</span>
                          <Star className="w-3.5 h-3.5" style={{ fill: ACCENT, color: ACCENT }} strokeWidth={2} />
                        </div>
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: `linear-gradient(to left, ${ACCENT}, #fcd34d)` }} />
                        </div>
                        <span className="text-xs font-bold w-10 text-left" style={{ color: '#a8a29e' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* طباخات تحتاج متابعة */}
            {lowRatedCooks.length > 0 && (
              <section>
                <SectionTitle icon={TrendingDown} title="طباخات تحتاج متابعة"
                  hint="(3 تقييمات أو أكثر، متوسط أقل من 3.5)" />
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'linear-gradient(145deg,#1e1210,#160f0d)', border: '1px solid rgba(244,63,94,0.15)' }}>
                  {lowRatedCooks.map((cook, i) => (
                    <div key={cook.id} className="flex items-center gap-3 p-4 transition"
                      style={{ borderBottom: i < lowRatedCooks.length - 1 ? '1px solid rgba(244,63,94,0.08)' : 'none' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(244,63,94,0.10)' }}>
                        <ChefHat className="w-5 h-5 text-red-400" strokeWidth={2.3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold truncate" style={{ color: '#f5f0eb' }}>{cook.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: '#78716c' }}>{cook.totalRatings || 0} تقييم</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4" style={{ fill: ACCENT, color: ACCENT }} strokeWidth={2} />
                        <span className="text-sm font-black text-red-400">{(cook.averageRating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* الفلاتر والتقييمات */}
            <section>
              <SectionTitle icon={MessageSquare} title="جميع التقييمات" />
              <div className="rounded-2xl p-4 mb-4" style={S.card}>
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold mb-2.5" style={{ color: '#a8a29e' }}>
                    <Filter className="w-3.5 h-3.5" style={{ color: ACCENT }} strokeWidth={2.4} />
                    تصفية حسب النجوم
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip active={starFilter === 'all'} onClick={() => setStarFilter('all')} label={`الكل (${ratings.length})`} />
                    {[5, 4, 3, 2, 1].map(s => (
                      <FilterChip key={s} active={starFilter === String(s)} onClick={() => setStarFilter(String(s))}
                        label={<span className="inline-flex items-center gap-1">{s}<Star className="w-3 h-3" style={{ fill: 'currentColor' }} strokeWidth={2} />({counts[s] || 0})</span>} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold mb-2.5" style={{ color: '#a8a29e' }}>
                    <Eye className="w-3.5 h-3.5" style={{ color: ACCENT }} strokeWidth={2.4} />
                    تصفية حسب الظهور
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip active={visibilityFilter === 'all'} onClick={() => setVisibilityFilter('all')} label="الكل" />
                    <FilterChip active={visibilityFilter === 'visible'} onClick={() => setVisibilityFilter('visible')} label="مرئية فقط" />
                    <FilterChip active={visibilityFilter === 'hidden'} onClick={() => setVisibilityFilter('hidden')} label="مخفية فقط" />
                  </div>
                </div>
              </div>

              {filteredRatings.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <Star className="w-12 h-12 mb-3" style={{ color: '#44403c' }} strokeWidth={1.5} />
                  <p className="text-sm" style={{ color: '#78716c' }}>لا توجد تقييمات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRatings.map(rating => (
                    <RatingCard key={rating.id} rating={rating}
                      onDelete={() => handleDelete(rating)}
                      onToggleHide={() => handleToggleHide(rating)}
                      onEdit={() => openEdit(rating)}
                      deleting={deletingId === rating.id}
                      hiding={hidingId === rating.id} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* مودال تعديل التقييم */}
      {editingRating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setEditingRating(null)}>
          <div className="w-full max-w-md rounded-3xl" style={S.modal}
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.3} />
                <h3 className="font-extrabold text-base" style={{ color: '#f5f0eb' }}>تعديل التقييم</h3>
              </div>
              <button onClick={() => setEditingRating(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X className="w-4 h-4" style={{ color: '#a8a29e' }} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: '#a8a29e' }}>عدد النجوم</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setEditForm({ ...editForm, rating: s })}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm transition active:scale-95"
                      style={editForm.rating === s
                        ? { background: ACCENT, color: '#0D0B09', boxShadow: `0 3px 12px rgba(245,158,11,0.35)` }
                        : { background: 'rgba(255,255,255,0.05)', color: '#78716c', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {s}★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: '#a8a29e' }}>التعليق</label>
                <textarea value={editForm.comment} onChange={e => setEditForm({ ...editForm, comment: e.target.value })}
                  rows={4} placeholder="تعليق الزبون..."
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                  style={S.input} />
              </div>
              <button onClick={handleSaveEdit} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition active:scale-[0.98] disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #d97706)`, color: '#0D0B09', boxShadow: `0 4px 16px rgba(245,158,11,0.3)` }}>
                <Save className="w-4 h-4" strokeWidth={2.4} />
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function SectionTitle({ icon: Icon, title, hint }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
      <div className="w-1.5 h-5 rounded-full" style={{ background: ACCENT }} />
      <Icon className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
      <h2 className="text-sm md:text-base font-extrabold" style={{ color: '#f5f0eb' }}>{title}</h2>
      {hint && <span className="text-[10px]" style={{ color: '#57534e' }}>{hint}</span>}
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-black transition active:scale-95"
      style={active
        ? { background: ACCENT, color: '#0D0B09', boxShadow: `0 2px 10px rgba(245,158,11,0.3)` }
        : { background: 'rgba(255,255,255,0.06)', color: '#78716c', border: '1px solid rgba(255,255,255,0.08)' }}>
      {label}
    </button>
  );
}

function RatingCard({ rating, onDelete, onToggleHide, onEdit, deleting, hiding }) {
  const isLow = (rating.rating || 0) <= 2;
  return (
    <div className="rounded-2xl p-4 transition"
      style={{
        ...S.card,
        borderRight: isLow ? '3px solid #f43f5e' : S.card.border,
        opacity: rating.hidden ? 0.55 : 1,
        boxShadow: '0 3px 16px rgba(0,0,0,0.3)',
      }}>
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className="w-4 h-4"
                style={{ fill: s <= (rating.rating || 0) ? ACCENT : 'transparent', color: s <= (rating.rating || 0) ? ACCENT : '#44403c' }}
                strokeWidth={2} />
            ))}
          </div>
          <span className="text-xs font-black" style={{ color: '#f5f0eb' }}>{rating.rating || 0}/5</span>
          {rating.hidden && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(168,162,158,0.12)', color: '#78716c' }}>مخفي</span>
          )}
        </div>
        <span className="text-[10px] flex items-center gap-1" style={{ color: '#57534e' }}>
          <Calendar className="w-3 h-3" strokeWidth={2.5} />
          {formatDate(rating.createdAt)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-2.5 text-xs">
        <span className="inline-flex items-center gap-1" style={{ color: '#d6d3d1' }}>
          <User className="w-3.5 h-3.5" style={{ color: '#78716c' }} strokeWidth={2.4} />
          <span className="font-bold">{rating.customerName || 'زبون'}</span>
          {rating.customerPhone && <span style={{ color: '#57534e' }} dir="ltr">({rating.customerPhone})</span>}
        </span>
        <span style={{ color: '#44403c' }}>←</span>
        <span className="inline-flex items-center gap-1" style={{ color: '#d6d3d1' }}>
          <ChefHat className="w-3.5 h-3.5" style={{ color: ACCENT }} strokeWidth={2.4} />
          <span className="font-bold">{rating.cookName || '-'}</span>
        </span>
      </div>

      {rating.comment && (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#d6d3d1' }}>{rating.comment}</p>
        </div>
      )}

      {isLow && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold mb-2.5 text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
          تقييم منخفض — قد يحتاج للمتابعة
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition active:scale-[0.98]"
          style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.18)', color: '#60a5fa' }}>
          <Edit2 className="w-3.5 h-3.5" strokeWidth={2.4} />
          تعديل
        </button>
        <button onClick={onToggleHide} disabled={hiding}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition active:scale-[0.98] disabled:opacity-50"
          style={rating.hidden
            ? { background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.18)', color: '#34d399' }
            : { background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.18)', color: ACCENT }}>
          {rating.hidden ? <Eye className="w-3.5 h-3.5" strokeWidth={2.4} /> : <EyeOff className="w-3.5 h-3.5" strokeWidth={2.4} />}
          {hiding ? '...' : rating.hidden ? 'إظهار' : 'إخفاء'}
        </button>
        <button onClick={onDelete} disabled={deleting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.18)', color: '#f43f5e' }}>
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.4} />
          {deleting ? 'جارٍ...' : 'حذف'}
        </button>
      </div>
    </div>
  );
}

function RatingsSkeleton() {
  return (
    <>
      <div className="h-48 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />)}
      </div>
    </>
  );
}

export default AdminRatings;
