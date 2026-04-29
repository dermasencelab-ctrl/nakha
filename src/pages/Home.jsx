import { memo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ChefHat,
  Star,
  Search,
  MapPin,
  ArrowLeft,
  Heart,
  Shield,
  Award,
  Quote,
  Sparkles,
} from 'lucide-react';

// تصنيفات الاكتشاف السريع — تنقل للفلتر المناسب في صفحة الطباخات
const DISH_CATEGORIES = [
  { id: 'pastry',      emoji: '🍰', label: 'حلويات ومعجنات', path: '/cooks?type=pastry'      },
  { id: 'traditional', emoji: '🍲', label: 'أكل تقليدي',    path: '/cooks?type=traditional' },
  { id: 'home_cook',   emoji: '👩‍🍳', label: 'طباخة حرة',    path: '/cooks?type=home_cook'   },
  { id: 'healthy',     emoji: '🥗', label: 'أكل صحي',       path: '/cooks?type=healthy'     },
];

// Module-level pure helpers — stable references, no re-creation on render
const getCookImage = (cook) => cook?.photo || cook?.image || '';
const getDishImage = (dish) => dish?.photo || dish?.image || '';

// Cloudinary URL optimizer: WebP/AVIF auto-format, quality auto, resize
const optimizeImage = (url, width = 400) => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

function Home() {
  const navigate = useNavigate();
  const [availableCooks, setAvailableCooks] = useState([]);
  const [topCooks, setTopCooks] = useState([]);
  const [featuredCook, setFeaturedCook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel queries — both fire simultaneously instead of sequentially
        const [cooksSnapshot, dishesSnapshot] = await Promise.all([
          getDocs(collection(db, 'cooks')),
          getDocs(query(collection(db, 'dishes'), where('available', '==', true))),
        ]);

        const allCooks = cooksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (c) => c.status === 'approved' || (c.isActive !== false && !c.status)
          );

        const availableDishes = dishesSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const cooksWithDishes = allCooks.map((cook) => {
          const dishes = availableDishes.filter((d) => d.cookId === cook.id);
          return { ...cook, availableDishes: dishes };
        });

        // طباخات متاحات
        const available = cooksWithDishes
          .filter((c) => c.availableDishes.length > 0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

        // الأعلى تقييماً (أكثر من 0 تقييم)
        const top = cooksWithDishes
          .filter((c) => (c.totalRatings || 0) > 0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 6);

        // طباخة مميّزة (لها bio حقيقي)
        const featured = cooksWithDishes
          .filter(
            (c) => c.bio && c.bio.length > 20 && c.availableDishes.length > 0
          )
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))[0];

        setAvailableCooks(available);
        setTopCooks(top);
        setFeaturedCook(featured);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cooks?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/cooks');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-28 md:pb-8">
      {/* ============================================ */}
      {/* Hero مختصر - شريط بحث أولاً */}
      {/* ============================================ */}
      <section className="relative overflow-hidden pt-4 pb-6">
        {/* خلفية كريمية ناعمة */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4">
          {/* شارة صغيرة */}
          <div className="flex items-center justify-center mb-3">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200/60 px-3 py-1.5 rounded-full text-xs font-bold text-orange-800 shadow-sm">
              <Heart className="w-3 h-3 fill-orange-500 text-orange-500" />
              أكل بيت حقيقي من بشار
            </div>
          </div>

          {/* عنوان مختصر */}
          <h1 className="text-center text-2xl md:text-3xl font-black text-stone-800 mb-4 leading-tight">
            ماذا تشتهين
            <span className="text-orange-600 mx-1">اليوم؟</span>
          </h1>

          {/* شريط البحث */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-lg shadow-orange-900/10 border border-orange-100 flex items-center overflow-hidden">
              <Search
                className="absolute right-4 w-5 h-5 text-stone-400"
                strokeWidth={2.2}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحثي عن طباخة، حي، أو طبق..."
                className="w-full py-4 pr-12 pl-24 bg-transparent text-stone-700 placeholder-stone-400 focus:outline-none text-sm font-medium"
              />
              <button
                type="submit"
                className="absolute left-2 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-extrabold active:scale-95 transition-all shadow-md shadow-orange-500/30"
              >
                ابحثي
              </button>
            </div>
          </form>

          {/* شريط التصنيفات الأفقي */}
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 mt-5">
            <div className="flex gap-4 pb-1 w-max mx-auto">
              {DISH_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 group active:scale-90 transition-transform"
                >
                  <div className="w-14 h-14 rounded-full bg-white border border-stone-100 flex items-center justify-center text-2xl shadow-md shadow-orange-900/10 group-hover:border-orange-300 group-hover:bg-orange-50 transition-colors">
                    {cat.emoji}
                  </div>
                  <span className="text-[10px] font-extrabold text-stone-600 group-hover:text-orange-600 transition-colors">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* شارات الثقة - أفقية ومختصرة */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <TrustChip icon={Shield} label="موثوقات" />
            <TrustChip icon={Award} label="جودة" />
            <TrustChip icon={Heart} label="بحب" />
          </div>

          {/* زر CTA كبير */}
          <div className="mt-5">
            <button
              onClick={() => navigate('/cooks')}
              className="w-full max-w-xl mx-auto flex items-center justify-center gap-3 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-8 rounded-2xl text-base font-extrabold shadow-xl shadow-orange-500/40 active:scale-[0.97] transition-all"
            >
              <Sparkles className="w-5 h-5" strokeWidth={2.3} />
              ابدئي طلبك الآن
              <ArrowLeft className="w-5 h-5" strokeWidth={2.8} />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* كيفية الطلب في 3 خطوات */}
      {/* ============================================ */}
      <section className="max-w-5xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">كيفية الطلب في 3 خطوات</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { step: '١', emoji: '👩‍🍳', title: 'اختاري الطباخة', desc: 'تصفّحي الطباخات وانقري على أي طبق يعجبكِ' },
            { step: '٢', emoji: '🛒', title: 'أضيفي للسلة', desc: 'أدخلي رقم هاتفكِ وموعد التسليم وأكّدي الطلب' },
            { step: '٣', emoji: '📱', title: 'تابعي الطلب', desc: 'راقبي حالة طلبكِ في "طلباتي" حتى يصل' },
          ].map(({ step, emoji, title, desc }) => (
            <div key={step} className="bg-white rounded-3xl p-4 shadow-sm flex gap-3 items-start">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md shadow-orange-500/30">
                {step}
              </div>
              <div>
                <p className="text-xl mb-1">{emoji}</p>
                <h3 className="font-extrabold text-stone-800 text-sm mb-0.5">{title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* القسم البطل: طباخات متاحات الآن */}
      {/* ============================================ */}
      <section className="max-w-5xl mx-auto px-4 mb-8">
        <SectionHeader
          title="متاحات الآن"
          subtitle="طباخات يطبخن في هذه اللحظة"
          dotColor="bg-green-500"
          link="/cooks"
        />

        {loading ? (
          <CooksGridSkeleton />
        ) : availableCooks.length === 0 ? (
          <EmptyState
            icon="😴"
            title="لا توجد طباخات متاحات الآن"
            subtitle="عودي قريباً — الطباخات ينضممن طوال اليوم"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableCooks.slice(0, 8).map((cook, idx) => (
              <AvailableCookCard
                key={cook.id}
                cook={cook}
                idx={idx}
              />
            ))}
          </div>
        )}

        {/* زر "شاهدي الكل" إذا في أكثر من 8 */}
        {availableCooks.length > 8 && (
          <Link
            to="/cooks"
            className="flex items-center justify-center gap-2 mt-4 bg-white hover:bg-orange-50 text-orange-600 py-3 rounded-2xl font-bold text-sm border-2 border-dashed border-orange-300 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2.4} />
            شاهدي كل الطباخات ({availableCooks.length})
          </Link>
        )}
      </section>

      {/* ============================================ */}
      {/* طباخة اليوم - حكاية */}
      {/* ============================================ */}
      {featuredCook && (
        <section className="max-w-5xl mx-auto px-4 mb-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
            <h2 className="text-lg font-extrabold text-stone-800">
              طباخة نوصيكِ بها
            </h2>
          </div>

          <Link
            to={`/cooks/${featuredCook.id}`}
            className="relative block bg-white rounded-3xl overflow-hidden shadow-md shadow-orange-200/30 active:scale-[0.99] transition-transform group"
          >
            <div className="flex flex-col sm:flex-row">
              {/* الصورة */}
<div className="relative w-full sm:w-56 h-64 sm:h-auto flex-shrink-0">                {getCookImage(featuredCook) ? (
                  <img
                    src={optimizeImage(getCookImage(featuredCook), 480)}
                    alt={featuredCook.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-6xl">
                    👩‍🍳
                  </div>
                )}
                {/* شارة */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-l from-amber-400 to-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-md">
                    <Award className="w-3 h-3" strokeWidth={2.5} />
                    مميّزة
                  </span>
                </div>
              </div>

              {/* المحتوى */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  {/* الاسم + التقييم */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-xl font-black text-stone-800">
                      {featuredCook.name}
                    </h3>
                    {featuredCook.totalRatings > 0 && (
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {(featuredCook.averageRating || 0).toFixed(1)}
                      </div>
                    )}
                  </div>

                  {featuredCook.neighborhood && (
                    <p className="text-xs text-stone-500 flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3" />
                      {featuredCook.neighborhood}
                    </p>
                  )}

                  {/* Quote Bio */}
                  <div className="relative pr-4">
                    <Quote
                      className="absolute top-0 right-0 w-4 h-4 text-orange-300 scale-x-[-1]"
                      strokeWidth={2.5}
                    />
                    <p className="text-sm text-stone-700 leading-relaxed italic line-clamp-3">
                      {featuredCook.bio}
                    </p>
                  </div>
                </div>

                {/* الأسفل */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                  <span className="text-xs font-bold text-stone-600">
                    🍽️ {featuredCook.availableDishes.length} أطباق متاحة
                  </span>
                  <span className="inline-flex items-center gap-1 text-orange-600 font-extrabold text-xs group-hover:gap-2 transition-all">
                    زيارة الملف
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ============================================ */}
      {/* الأعلى تقييماً - تمرير أفقي */}
      {/* ============================================ */}
      {!loading && topCooks.length > 0 && (
        <section className="mb-8">
          <div className="max-w-5xl mx-auto px-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star
                  className="w-5 h-5 text-amber-500 fill-amber-500"
                  strokeWidth={2.4}
                />
                <h2 className="text-lg font-extrabold text-stone-800">
                  الأعلى تقييماً
                </h2>
              </div>
              <Link
                to="/cooks"
                className="text-xs font-extrabold text-orange-600 flex items-center gap-0.5 active:scale-95 transition"
              >
                الكل
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar snap-x-padded">
            <div className="flex gap-3 px-4 pb-2">
              {topCooks.map((cook, idx) => (
                <Link
                  key={cook.id}
                  to={`/cooks/${cook.id}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="animate-slide-up flex-shrink-0 w-36 active:scale-95 transition-all group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm mb-2">
                    {getCookImage(cook) ? (
                      <img
                        src={optimizeImage(getCookImage(cook), 200)}
                        alt={cook.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-5xl">
                        👩‍🍳
                      </div>
                    )}
                    {/* ترتيب */}
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[11px] font-black text-amber-600 shadow-md">
                      {idx + 1}
                    </div>
                    {/* تدرج سفلي */}
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
                    {/* تقييم */}
                    <div className="absolute bottom-1.5 right-1.5 left-1.5 flex items-center justify-center gap-1 text-white text-xs font-bold">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {(cook.averageRating || 0).toFixed(1)}
                      <span className="text-white/70 text-[10px]">
                        ({cook.totalRatings})
                      </span>
                    </div>
                  </div>
                  <h3 className="font-extrabold text-stone-800 text-sm text-center truncate">
                    {cook.name}
                  </h3>
                  {cook.neighborhood && (
                    <p className="text-[10px] text-stone-500 text-center truncate mt-0.5">
                      {cook.neighborhood}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* CTA - دعوة هادئة للطباخات */}
      {/* ============================================ */}
      <section className="max-w-5xl mx-auto px-4 mb-6">
        <Link
          to="/cook/signup"
          className="relative block bg-gradient-to-bl from-amber-50 via-orange-50 to-amber-100 rounded-3xl overflow-hidden p-5 border border-amber-200/60 shadow-sm active:scale-[0.99] transition-transform group"
        >
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-amber-300/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-orange-300/30 rounded-full blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <ChefHat
                  className="w-6 h-6 text-orange-600"
                  strokeWidth={2.2}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-stone-800 leading-tight mb-0.5">
                هل أنتِ طباخة؟
              </h3>
              <p className="text-[11px] text-stone-600">
                انضمّي إلى نَكهة وشاركي أكلكِ مع الحي
              </p>
            </div>
            <ArrowLeft
              className="w-5 h-5 text-orange-600 group-hover:-translate-x-1 transition-transform flex-shrink-0"
              strokeWidth={2.8}
            />
          </div>
        </Link>
      </section>

      {/* ============================================ */}
      {/* Footer */}
      {/* ============================================ */}
      <footer className="max-w-5xl mx-auto px-4 pt-6 pb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
            <ChefHat className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-stone-800 text-sm">نَكهة</span>
        </div>
        <p className="text-[11px] text-stone-500 mb-2">
          أكل بيتي في بشار 🇩🇿
        </p>
        <div className="flex items-center justify-center gap-3 text-[11px]">
          <Link
            to="/about"
            className="text-stone-600 hover:text-orange-600 font-bold"
          >
            عنّا
          </Link>
          <span className="text-stone-300">•</span>
          <Link
            to="/privacy"
            className="text-stone-600 hover:text-orange-600 font-bold"
          >
            الخصوصية
          </Link>
        </div>
        <p className="text-[10px] text-stone-400 mt-3">
          © 2026 • صُنع بـ{' '}
          <Heart className="w-3 h-3 inline fill-red-400 text-red-400" /> في
          الجزائر
        </p>
      </footer>
    </div>
  );
}

/* ============================================ */
/* مكوّنات مساعدة */
/* ============================================ */

function TrustChip({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white/70 border border-stone-200/80 px-2.5 py-1 rounded-full text-[11px] font-bold text-stone-700 shadow-sm">
      <Icon className="w-3 h-3 text-orange-500" strokeWidth={2.4} />
      {label}
    </div>
  );
}

function SectionHeader({ title, subtitle, dotColor, link }) {
  return (
    <div className="flex items-end justify-between mb-3 px-1">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          {dotColor && (
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}
              />
            </span>
          )}
          <h2 className="text-lg font-extrabold text-stone-800 leading-none">
            {title}
          </h2>
        </div>
        <p className="text-[11px] text-stone-500 mt-1">{subtitle}</p>
      </div>
      {link && (
        <Link
          to={link}
          className="text-xs font-extrabold text-orange-600 flex items-center gap-0.5 active:scale-95 transition"
        >
          الكل
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
        </Link>
      )}
    </div>
  );
}

const AvailableCookCard = memo(function AvailableCookCard({ cook, idx }) {
  const firstDish = cook.availableDishes[0];
  return (
    <Link
      to={`/cooks/${cook.id}`}
      style={{ animationDelay: `${idx * 50}ms` }}
      className="animate-slide-up bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.97] transition-all group"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {getCookImage(cook) ? (
          <img
            src={optimizeImage(getCookImage(cook), 300)}
            alt={cook.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 flex items-center justify-center text-6xl">
            👩‍🍳
          </div>
        )}

        {/* شارة متاحة */}
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md">
          <span className="relative flex h-1 w-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-1 w-1 bg-white" />
          </span>
          متاحة
        </div>

        {/* تقييم */}
        {cook.totalRatings > 0 && (
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur px-1.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
            {(cook.averageRating || 0).toFixed(1)}
          </div>
        )}

        {/* تدرج + معلومات سفلية */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2 right-2 left-2">
          <h3 className="text-white font-extrabold text-sm drop-shadow-md truncate">
            {cook.name}
          </h3>
          {cook.neighborhood && (
            <p className="text-white/85 text-[10px] font-bold truncate mt-0.5">
              📍 {cook.neighborhood}
            </p>
          )}
        </div>
      </div>

      {/* شريط طبق اليوم */}
      {firstDish && (
        <div className="p-2.5 border-t border-stone-100">
          <div className="flex items-center gap-2">
            {getDishImage(firstDish) ? (
              <img
                src={optimizeImage(getDishImage(firstDish), 64)}
                alt={firstDish.name}
                loading="lazy"
                decoding="async"
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                🍽️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold text-stone-800 truncate">
                {firstDish.name}
              </p>
              <p className="text-[10px] font-bold text-orange-600">
                {firstDish.price} دج
              </p>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
});

function CooksGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="aspect-[4/5] animate-shimmer" />
          <div className="p-2.5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg animate-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 animate-shimmer rounded-md" />
              <div className="h-2 w-1/2 animate-shimmer rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
      <div className="text-5xl mb-2">{icon}</div>
      <h3 className="text-sm font-extrabold text-stone-800 mb-1">{title}</h3>
      <p className="text-xs text-stone-500">{subtitle}</p>
    </div>
  );
}

export default Home;