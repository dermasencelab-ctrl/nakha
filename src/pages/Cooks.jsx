import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ArrowRight,
  Star,
  Search,
  X,
  SlidersHorizontal,
  Zap,
  ChefHat,
  Check,
  Flame,
  Clock,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import CookCard from '../components/CookCard';

// أنواع الطباخات للفلترة — حلويات ثاني خيار بعد الكل
const cookTypeFilters = [
  { value: 'all',        label: 'الكل',       emoji: '👩‍🍳' },
  { value: 'pastry',     label: 'حلويات',     emoji: '🍰' },
  { value: 'traditional',label: 'تقليدي',    emoji: '🍲' },
  { value: 'home_cook',  label: 'طباخة حرة', emoji: '🏠' },
  { value: 'healthy',    label: 'صحي',        emoji: '🥗' },
];

const statusFilters = [
  { value: 'all', label: 'الكل', icon: ChefHat, color: 'orange' },
  { value: 'availableNow', label: 'متاحة الآن', icon: Zap, color: 'green' },
  { value: 'topRated', label: 'الأعلى تقييماً', icon: Star, color: 'amber' },
];

const sortOptions = [
  { value: 'rating', label: 'الأعلى تقييماً', icon: Star },
  { value: 'orders', label: 'الأكثر طلباً', icon: TrendingUp },
  { value: 'newest', label: 'الأحدث', icon: Sparkles },
];

function Cooks() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const fetchCooks = async () => {
      try {
        const cooksSnapshot = await getDocs(collection(db, 'cooks'));
        let cooksData = cooksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((c) => c.status === 'approved' || (c.isActive !== false && !c.status));

        const dishesSnapshot = await getDocs(
          query(collection(db, 'dishes'), where('available', '==', true))
        );
        const availableDishes = dishesSnapshot.docs.map((d) => d.data());

        cooksData = cooksData.map((cook) => {
          const cookDishes = availableDishes.filter((d) => d.cookId === cook.id);
          return {
            ...cook,
            availableDishesCount: cookDishes.length,
            dishNames: cookDishes.map((d) => d.name || ''),
          };
        });

        setCooks(cooksData);
      } catch (error) {
        console.error('Error fetching cooks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCooks();
  }, []);

  // تأثير التمرير على الـ header
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // منع التمرير عندما الـ bottom sheet مفتوح
  useEffect(() => {
    document.body.style.overflow = sortSheetOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sortSheetOpen]);

  // الفلترة والترتيب
  const filteredCooks = useMemo(() => {
    let result = [...cooks];

    // بحث نصي (في اسم الطباخة + الحي + النبذة + أسماء الأطباق)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) => {
        const matchesCook =
          c.name?.toLowerCase().includes(q) ||
          c.neighborhood?.toLowerCase().includes(q) ||
          c.bio?.toLowerCase().includes(q) ||
          c.cookDescription?.toLowerCase().includes(q);

        // البحث في أسماء الأطباق
        const matchesDishes = c.dishNames?.some((name) =>
          name.toLowerCase().includes(q)
        );

        return matchesCook || matchesDishes;
      });
    }

    // فلتر الحالة
    if (statusFilter === 'availableNow') {
      result = result.filter((c) => c.availableDishesCount > 0);
    } else if (statusFilter === 'topRated') {
      result = result.filter((c) => (c.averageRating || 0) >= 4);
    }

    // فلتر النوع (الطباخات بدون نوع تُعتبر طباخة حرة)
    if (typeFilter !== 'all') {
      result = result.filter((c) => (c.cookType || 'home_cook') === typeFilter);
    }

    // الترتيب
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'orders') {
      result.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }

    // المتاحات أولاً
    result.sort((a, b) => {
      if (a.availableDishesCount > 0 && b.availableDishesCount === 0) return -1;
      if (a.availableDishesCount === 0 && b.availableDishesCount > 0) return 1;
      return 0;
    });

    return result;
  }, [searchQuery, statusFilter, typeFilter, sortBy, cooks]);

  // عدد الفلاتر النشطة
  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
  };

  const currentSortLabel =
    sortOptions.find((s) => s.value === sortBy)?.label || 'الترتيب';

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-24 md:pb-8">
      {/* ============================================ */}
      {/* Sticky Header - شريط بحث ثابت */}
      {/* ============================================ */}
      <header
        className={`sticky top-16 md:top-16 z-30 transition-all duration-300 ${
          headerScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-sm'
            : 'bg-[#FFF5E6]'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* العنوان + زر الرجوع */}
          <div className="flex items-center gap-3 mb-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-orange-50 active:scale-90 transition-all"
              aria-label="الرجوع"
            >
              <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-stone-800 leading-none">
                الطباخات
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {!loading && `${filteredCooks.length} طباخة في بشار`}
              </p>
            </div>

            {/* زر الترتيب */}
            <button
              onClick={() => setSortSheetOpen(true)}
              className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl shadow-sm hover:bg-orange-50 active:scale-95 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 text-stone-700" strokeWidth={2.3} />
              <span className="text-xs font-bold text-stone-700">ترتيب</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* شريط البحث */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" strokeWidth={2.3} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن طباخة، حي، أو طبق..."
              className="w-full bg-white rounded-2xl py-3 pr-10 pl-10 text-sm font-medium text-stone-700 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-stone-200 hover:bg-stone-300 rounded-full flex items-center justify-center active:scale-90 transition"
                aria-label="مسح"
              >
                <X className="w-3 h-3 text-stone-600" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* فلاتر الحالة - Chips أفقية */}
        <div className="overflow-x-auto no-scrollbar border-t border-stone-100/60">
          <div className="flex gap-2 px-4 py-2.5 max-w-6xl mx-auto">
            {statusFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = statusFilter === filter.value;
              const activeColors = {
                orange: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30',
                green: 'bg-green-500 text-white shadow-lg shadow-green-500/30',
                amber: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
              };
              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    isActive
                      ? activeColors[filter.color]
                      : 'bg-white text-stone-700 hover:bg-orange-50 shadow-sm'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                  {filter.label}
                </button>
              );
            })}

            {/* فاصل */}
            <div className="w-px bg-stone-200 mx-1 flex-shrink-0" />

            {/* فلاتر النوع */}
            {cookTypeFilters.map((type) => {
              const isActive = typeFilter === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    isActive
                      ? 'bg-stone-800 text-white shadow-lg'
                      : 'bg-white text-stone-700 hover:bg-stone-50 shadow-sm'
                  }`}
                >
                  <span>{type.emoji}</span>
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* شريط الفلاتر النشطة */}
      {/* ============================================ */}
      {(activeFiltersCount > 0 || searchQuery) && (
        <div className="max-w-6xl mx-auto px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-semibold">الفلاتر:</span>
            <span className="font-bold text-orange-600">
              {activeFiltersCount + (searchQuery ? 1 : 0)} نشطة
            </span>
            <button
              onClick={clearAllFilters}
              className="mr-auto text-stone-500 hover:text-red-600 font-bold active:scale-95 transition"
            >
              مسح الكل ×
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* المحتوى */}
      {/* ============================================ */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {loading ? (
          <CooksGridSkeleton />
        ) : filteredCooks.length === 0 ? (
          <EmptyState
            hasFilters={activeFiltersCount > 0 || !!searchQuery}
            onClear={clearAllFilters}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCooks.map((cook, idx) => (
              <div
                key={cook.id}
                style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}
                className="animate-slide-up"
              >
                <CookCard cook={cook} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ============================================ */}
      {/* Bottom Sheet - الترتيب */}
      {/* ============================================ */}
      {/* Backdrop */}
      <div
        onClick={() => setSortSheetOpen(false)}
        className={`fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          sortSheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 right-0 left-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out pb-safe ${
          sortSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh' }}
      >
        {/* مقبض السحب */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* عنوان */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-stone-100">
          <h3 className="text-lg font-extrabold text-stone-800">الترتيب</h3>
          <button
            onClick={() => setSortSheetOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center active:scale-90 transition"
          >
            <X className="w-4 h-4 text-stone-700" strokeWidth={2.5} />
          </button>
        </div>

        {/* خيارات */}
        <div className="p-4 space-y-2">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const isActive = sortBy === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                  setTimeout(() => setSortSheetOpen(false), 150);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-gradient-to-l from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-stone-50 hover:bg-orange-50 text-stone-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-white/20' : 'bg-white'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.3} />
                </div>
                <span className="flex-1 text-right">{option.label}</span>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-orange-600" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* زر التأكيد */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setSortSheetOpen(false)}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all"
          >
            تطبيق
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================ */
/* Skeleton loading جذاب */
/* ============================================ */
function CooksGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm">
          <div className="h-44 animate-shimmer" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-2/3 animate-shimmer rounded-md" />
            <div className="h-3 w-1/2 animate-shimmer rounded-md" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-16 animate-shimmer rounded-full" />
              <div className="h-6 w-20 animate-shimmer rounded-full" />
            </div>
            <div className="h-10 animate-shimmer rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================ */
/* حالة عدم وجود نتائج */
/* ============================================ */
function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="bg-white rounded-3xl p-8 text-center shadow-sm mt-4">
      <div className="w-20 h-20 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl">
          {hasFilters ? '🔍' : '👩‍🍳'}
        </span>
      </div>
      <h3 className="text-lg font-extrabold text-stone-800 mb-2">
        {hasFilters ? 'لا توجد نتائج' : 'لا توجد طباخات حالياً'}
      </h3>
      <p className="text-sm text-stone-500 mb-5 max-w-xs mx-auto">
        {hasFilters
          ?  'يرجى تغيير خيارات التصفية أو البحث بكلمة أخرى'
          : 'ستتم إضافة طباخات جديدات قريباً'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-lg shadow-orange-500/30"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
          مسح الفلاتر
        </button>
      )}
    </div>
  );
}

export default Cooks;