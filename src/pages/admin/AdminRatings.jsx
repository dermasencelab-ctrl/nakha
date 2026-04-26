import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  ArrowRight,
  Star,
  Trash2,
  AlertTriangle,
  ChefHat,
  User,
  Calendar,
  Filter,
  TrendingDown,
  MessageSquare,
} from 'lucide-react';

const formatDate = (timestamp) => {
  if (!timestamp?.seconds) return '-';
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const AdminRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ratingsSnap, cooksSnap] = await Promise.all([
        getDocs(collection(db, 'ratings')),
        getDocs(collection(db, 'cooks')),
      ]);
      const ratingsData = ratingsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      ratingsData.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setRatings(ratingsData);
      setCooks(cooksSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (rating) => {
    if (
      !confirm(
        `هل أنت متأكد من حذف تقييم ${rating.customerName || 'الزبون'} (${rating.rating} نجوم)؟\nسيُعاد حساب متوسط تقييم الطباخة.`
      )
    )
      return;

    setDeletingId(rating.id);
    try {
      await deleteDoc(doc(db, 'ratings', rating.id));

      // Update cook's aggregate rating
      if (rating.cookId) {
        const cook = cooks.find((c) => c.id === rating.cookId);
        if (cook) {
          const newTotal = Math.max(0, (cook.totalRatings || 0) - 1);
          const newSum = Math.max(0, (cook.ratingSum || 0) - (rating.rating || 0));
          const newAvg = newTotal > 0 ? newSum / newTotal : 0;
          await updateDoc(doc(db, 'cooks', rating.cookId), {
            totalRatings: increment(-1),
            ratingSum: increment(-(rating.rating || 0)),
            averageRating: Number(newAvg.toFixed(2)),
          });
        }
      }

      alert('تم حذف التقييم');
      await fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRatings = useMemo(() => {
    if (starFilter === 'all') return ratings;
    return ratings.filter((r) => r.rating === Number(starFilter));
  }, [ratings, starFilter]);

  // أقل الطباخات تقييماً (تحتاج متابعة)
  const lowRatedCooks = useMemo(() => {
    return cooks
      .filter(
        (c) =>
          c.status === 'approved' &&
          (c.totalRatings || 0) >= 3 &&
          (c.averageRating || 0) > 0 &&
          (c.averageRating || 0) < 3.5
      )
      .sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0))
      .slice(0, 10);
  }, [cooks]);

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) c[r.rating] = (c[r.rating] || 0) + 1;
    });
    return c;
  }, [ratings]);

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
            إدارة التقييمات
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-4 space-y-6">
        {loading ? (
          <RatingsSkeleton />
        ) : (
          <>
            {/* توزيع النجوم */}
            <section>
              <SectionTitle icon={Star} title="توزيع التقييمات" />
              <div className="bg-white rounded-3xl shadow-sm p-5">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = counts[star] || 0;
                    const percent = ratings.length
                      ? (count / ratings.length) * 100
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-14">
                          <span className="text-sm font-black text-stone-700">
                            {star}
                          </span>
                          <Star
                            className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                            strokeWidth={2}
                          />
                        </div>
                        <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-l from-orange-400 to-amber-400 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-stone-600 w-12 text-left">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* أقل الطباخات تقييماً */}
            {lowRatedCooks.length > 0 && (
              <section>
                <SectionTitle
                  icon={TrendingDown}
                  title="طباخات تحتاج متابعة"
                  hint="(3 تقييمات أو أكثر، متوسط أقل من 3.5)"
                />
                <div className="bg-gradient-to-bl from-red-50 to-orange-50 border border-red-100 rounded-3xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-red-100/60">
                    {lowRatedCooks.map((cook) => (
                      <div
                        key={cook.id}
                        className="flex items-center gap-3 p-4 hover:bg-white/40 transition"
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                          <ChefHat
                            className="w-5 h-5 text-red-500"
                            strokeWidth={2.3}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-extrabold text-stone-800 truncate">
                            {cook.name}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {cook.totalRatings || 0} تقييم
                          </p>
                        </div>
                        <div className="text-left flex items-center gap-1">
                          <Star
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                            strokeWidth={2}
                          />
                          <span className="text-sm font-black text-red-600">
                            {(cook.averageRating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* فلتر التقييمات */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <SectionTitle icon={MessageSquare} title="جميع التقييمات" />
              </div>
              <div className="bg-white rounded-3xl shadow-sm p-4 mb-3">
                <div className="flex items-center gap-2 text-stone-600 text-sm font-bold mb-3">
                  <Filter className="w-4 h-4" strokeWidth={2.4} />
                  تصفية حسب النجوم
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={starFilter === 'all'}
                    onClick={() => setStarFilter('all')}
                    label={`الكل (${ratings.length})`}
                  />
                  {[5, 4, 3, 2, 1].map((s) => (
                    <FilterChip
                      key={s}
                      active={starFilter === String(s)}
                      onClick={() => setStarFilter(String(s))}
                      label={
                        <span className="inline-flex items-center gap-1">
                          {s}
                          <Star
                            className="w-3 h-3 fill-current"
                            strokeWidth={2}
                          />
                          ({counts[s] || 0})
                        </span>
                      }
                    />
                  ))}
                </div>
              </div>

              {filteredRatings.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
                  <Star
                    className="w-12 h-12 mx-auto text-stone-300 mb-3"
                    strokeWidth={1.8}
                  />
                  <p className="text-stone-500 text-sm">لا توجد تقييمات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRatings.map((rating) => (
                    <RatingCard
                      key={rating.id}
                      rating={rating}
                      onDelete={() => handleDelete(rating)}
                      deleting={deletingId === rating.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

function SectionTitle({ icon: Icon, title, hint }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
      <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
      <Icon className="w-4 h-4 text-stone-600" strokeWidth={2.4} />
      <h2 className="text-sm md:text-base font-extrabold text-stone-800">
        {title}
      </h2>
      {hint && <span className="text-[10px] text-stone-400">{hint}</span>}
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-black transition active:scale-95 ${
        active
          ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {label}
    </button>
  );
}

function RatingCard({ rating, onDelete, deleting }) {
  const isLow = (rating.rating || 0) <= 2;
  return (
    <div
      className={`bg-white rounded-3xl shadow-sm p-4 hover:shadow-md transition ${
        isLow ? 'border-r-4 border-red-400' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= (rating.rating || 0)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-stone-200'
                }`}
                strokeWidth={2}
              />
            ))}
          </div>
          <span className="text-xs font-black text-stone-700">
            {rating.rating || 0}/5
          </span>
        </div>
        <span className="text-[10px] text-stone-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" strokeWidth={2.5} />
          {formatDate(rating.createdAt)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-2 text-xs">
        <span className="inline-flex items-center gap-1 text-stone-700">
          <User className="w-3.5 h-3.5 text-stone-400" strokeWidth={2.4} />
          <span className="font-bold">{rating.customerName || 'زبون'}</span>
        </span>
        <span className="text-stone-300">←</span>
        <span className="inline-flex items-center gap-1 text-stone-700">
          <ChefHat className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.4} />
          <span className="font-bold">{rating.cookName || '-'}</span>
        </span>
      </div>

      {rating.comment && (
        <div className="bg-stone-50 rounded-2xl p-3 mb-3">
          <p className="text-sm text-stone-700 leading-relaxed">
            {rating.comment}
          </p>
        </div>
      )}

      {isLow && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-bold mb-2">
          <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
          تقييم منخفض — قد يحتاج للمتابعة
        </div>
      )}

      <button
        onClick={onDelete}
        disabled={deleting}
        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-2xl text-xs font-bold transition active:scale-[0.98] disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.4} />
        {deleting ? 'جارٍ الحذف...' : 'حذف التقييم'}
      </button>
    </div>
  );
}

function RatingsSkeleton() {
  return (
    <>
      <div className="h-48 bg-white rounded-3xl animate-pulse shadow-sm" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-white rounded-3xl animate-pulse shadow-sm"
          />
        ))}
      </div>
    </>
  );
}

export default AdminRatings;
