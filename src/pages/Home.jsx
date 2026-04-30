import { memo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ChefHat, Star, Search, MapPin, ArrowLeft,
  Heart, Shield, Award, Sparkles, Flame,
} from 'lucide-react';

const DISH_CATEGORIES = [
  { id: 'pastry',      emoji: '🍰', label: 'حلويات',   path: '/cooks?type=pastry'      },
  { id: 'traditional', emoji: '🍲', label: 'تقليدي',   path: '/cooks?type=traditional' },
  { id: 'home_cook',   emoji: '👩‍🍳', label: 'طباخة حرة', path: '/cooks?type=home_cook'   },
  { id: 'healthy',     emoji: '🥗', label: 'صحي',      path: '/cooks?type=healthy'     },
];

const COOK_GRADIENTS = [
  'from-amber-200 to-orange-300',
  'from-rose-200 to-pink-300',
  'from-orange-200 to-amber-300',
  'from-yellow-200 to-orange-200',
  'from-red-200 to-rose-300',
  'from-amber-300 to-yellow-200',
];

const getCookImage  = (c) => c?.photo || c?.image || '';
const getDishImage  = (d) => d?.photo || d?.image || '';
const optimizeImage = (url, w = 400) => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
};

function Home() {
  const navigate = useNavigate();
  const [availableCooks, setAvailableCooks] = useState([]);
  const [topCooks,       setTopCooks]       = useState([]);
  const [featuredCook,   setFeaturedCook]   = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cooksSnap, dishesSnap] = await Promise.all([
          getDocs(collection(db, 'cooks')),
          getDocs(query(collection(db, 'dishes'), where('available', '==', true))),
        ]);

        const allCooks = cooksSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c) => c.status === 'approved' || (c.isActive !== false && !c.status));

        const availableDishes = dishesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const cooksWithDishes = allCooks.map((cook) => ({
          ...cook,
          availableDishes: availableDishes.filter((d) => d.cookId === cook.id),
        }));

        const available = cooksWithDishes
          .filter((c) => c.availableDishes.length > 0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

        const top = cooksWithDishes
          .filter((c) => (c.totalRatings || 0) > 0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 6);

        const featured = cooksWithDishes
          .filter((c) => c.bio && c.bio.length > 20 && c.availableDishes.length > 0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))[0];

        setAvailableCooks(available);
        setTopCooks(top);
        setFeaturedCook(featured);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(searchQuery.trim()
      ? `/cooks?q=${encodeURIComponent(searchQuery.trim())}`
      : '/cooks');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-28 md:pb-8 overflow-x-hidden">

      {/* Custom keyframes injected once */}
      <style>{`
        @keyframes heroFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33%      { transform: translateY(-8px) rotate(1deg); }
          66%      { transform: translateY(4px) rotate(-0.5deg); }
        }
        @keyframes mosaicFadeIn {
          from { opacity: 0; transform: scale(0.85) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-hero-float  { animation: heroFloat 6s ease-in-out infinite; }
        .animate-mosaic-in   { animation: mosaicFadeIn 0.5s ease-out both; }
        .animate-marquee     { animation: marquee 22s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>

      {/* ============================================ */}
      {/* HERO — Dark editorial with live cook mosaic  */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">
        {/* Rich dark background */}
        <div className="absolute inset-0 bg-[#1C0A00]" />

        {/* Warm radial glows */}
        <div
          className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.18) 0%, transparent 65%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(180,60,0,0.14) 0%, transparent 65%)' }}
        />

        {/* SVG grain texture */}
        <div
          className="absolute inset-0 opacity-[0.045] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Subtle horizontal rule accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-700/50 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

            {/* ——— Text column ——— */}
            <div className="flex-1 text-right order-2 md:order-1">

              {/* Live status pill */}
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] font-bold text-amber-200/90 mb-5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-70" />
                  <span className="relative rounded-full h-1.5 w-1.5 bg-green-400 inline-flex" />
                </span>
                بشار — طباخات متاحات الآن
              </div>

              {/* Main headline */}
              <h1 className="text-[42px] md:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-4"
                  style={{ textShadow: '0 4px 32px rgba(0,0,0,0.6)', letterSpacing: '-0.01em' }}>
                أكل بيت<br />
                بـ<span
                  style={{
                    background: 'linear-gradient(135deg, #FBBF24, #F97316)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >نَكهة</span> حقيقية
              </h1>

              <p className="text-sm md:text-base text-white/60 mb-6 leading-relaxed max-w-xs">
                أطباق منزلية طازجة من طباخات موثوقات في حيّك — في بشار
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative mb-5 max-w-md">
                <div className="flex items-center bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                  <Search className="absolute right-4 w-4 h-4 text-stone-400 flex-shrink-0" strokeWidth={2.2} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحثي عن طباخة أو طبق..."
                    className="flex-1 py-3.5 pr-11 pl-4 text-stone-700 placeholder-stone-400 focus:outline-none text-sm font-medium bg-transparent"
                  />
                  <button
                    type="submit"
                    className="m-1.5 bg-gradient-to-l from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 transition-all shadow-md shadow-orange-500/30 flex-shrink-0"
                  >
                    ابحثي
                  </button>
                </div>
              </form>

              {/* Category pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {DISH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate(cat.path)}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-white/12 hover:bg-white/20 border border-white/15 text-white px-3 py-1.5 rounded-full text-[11px] font-bold active:scale-95 transition-all"
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Big CTA */}
              <button
                onClick={() => navigate('/cooks')}
                className="mt-5 flex items-center gap-2.5 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3.5 rounded-2xl text-sm font-extrabold shadow-2xl shadow-orange-700/40 active:scale-[0.97] transition-all"
              >
                <Sparkles className="w-4 h-4" strokeWidth={2.3} />
                ابدئي طلبك الآن
                <ArrowLeft className="w-4 h-4" strokeWidth={2.8} />
              </button>
            </div>

            {/* ——— Mosaic column ——— */}
            <div className="relative flex-shrink-0 w-full md:w-64 lg:w-72 h-56 md:h-72 order-1 md:order-2">
              {loading
                ? <MosaicSkeleton />
                : <CookMosaic cooks={[...availableCooks, ...topCooks].slice(0, 6)} />
              }

              {/* Floating live badge */}
              {!loading && availableCooks.length > 0 && (
                <div className="absolute -bottom-4 right-4 md:right-8 bg-white rounded-2xl px-3.5 py-2 shadow-2xl shadow-black/30 flex items-center gap-2 border border-stone-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inset-0 rounded-full bg-green-500 opacity-70" />
                    <span className="relative rounded-full h-2 w-2 bg-green-500 inline-flex" />
                  </span>
                  <span className="text-xs font-black text-stone-800">
                    {availableCooks.length} طباخة متاحة
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Curved bottom edge into cream background */}
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 right-0 w-full"
          style={{ height: '40px' }}
        >
          <path d="M0,40 Q720,0 1440,40 L1440,40 L0,40 Z" fill="#FFF5E6" />
        </svg>
      </section>

      {/* ============================================ */}
      {/* LIVE TICKER — Scrolling platform activity    */}
      {/* ============================================ */}
      {!loading && (availableCooks.length > 0 || topCooks.length > 0) && (
        <div className="overflow-hidden bg-orange-50 border-y border-orange-100 py-2.5">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...availableCooks, ...topCooks].slice(0, 8).concat([...availableCooks, ...topCooks].slice(0, 8)).map((cook, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 mx-5 text-[11px] font-bold text-orange-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                {cook.name}
                {cook.neighborhood && <span className="text-orange-400/70 font-normal">· {cook.neighborhood}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* HOW IT WORKS — Compact 3-step strip          */}
      {/* ============================================ */}
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-5">
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
          <h2 className="text-base font-black text-stone-800">كيف تطلبين؟</h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { step: '١', emoji: '👩‍🍳', title: 'اختاري',  desc: 'تصفّحي الطباخات' },
            { step: '٢', emoji: '🛒', title: 'أضيفي',   desc: 'وأكّدي الطلب'    },
            { step: '٣', emoji: '📱', title: 'تابعي',   desc: 'حتى يصل إليكِ'  },
          ].map(({ step, emoji, title, desc }, i) => (
            <div
              key={step}
              className="relative bg-white rounded-2xl p-3.5 shadow-sm border border-stone-100 text-center overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute -top-4 -right-2 text-7xl font-black text-orange-50 select-none pointer-events-none leading-none">
                {step}
              </div>
              <div className="relative z-10">
                <p className="text-3xl mb-2">{emoji}</p>
                <p className="font-black text-stone-800 text-sm">{title}</p>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* AVAILABLE NOW — Horizontal editorial scroll  */}
      {/* ============================================ */}
      <section className="mb-6">
        <div className="max-w-5xl mx-auto px-4 mb-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inset-0 rounded-full bg-green-500 opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-green-500 inline-flex" />
                </span>
                <h2 className="text-lg font-black text-stone-800">متاحات الآن</h2>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5 mr-4">
                {loading ? '...' : `${availableCooks.length} طباخة تطبخ في هذه اللحظة`}
              </p>
            </div>
            <Link
              to="/cooks"
              className="text-xs font-extrabold text-orange-600 flex items-center gap-0.5 active:scale-95 transition"
            >
              الكل <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 px-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-44">
                <div className="h-56 rounded-2xl animate-shimmer mb-2.5" />
                <div className="bg-white rounded-xl p-2 space-y-1 shadow-sm">
                  <div className="h-3 animate-shimmer rounded" />
                  <div className="h-2.5 w-1/2 animate-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : availableCooks.length === 0 ? (
          <div className="mx-4 bg-white rounded-3xl p-10 text-center shadow-sm border border-stone-100">
            <p className="text-4xl mb-3">😴</p>
            <p className="font-extrabold text-stone-700 text-sm">لا توجد طباخات متاحات الآن</p>
            <p className="text-xs text-stone-400 mt-1.5">عودي قريباً — ينضممن طوال اليوم</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-3 px-4 pb-1" style={{ width: 'max-content' }}>
              {availableCooks.slice(0, 8).map((cook, idx) => (
                <EditorialCookCard key={cook.id} cook={cook} idx={idx} />
              ))}
              {availableCooks.length > 8 && (
                <Link
                  to="/cooks"
                  className="flex-shrink-0 w-44 h-56 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-dashed border-orange-200 rounded-2xl text-orange-500 font-bold text-sm gap-2 active:scale-95 transition hover:border-orange-400"
                >
                  <Sparkles className="w-6 h-6" strokeWidth={2.2} />
                  شاهدي الكل
                  <span className="text-xs font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                    {availableCooks.length}
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* FEATURED COOK — Drama full-bleed card        */}
      {/* ============================================ */}
      {featuredCook && (
        <section className="max-w-5xl mx-auto px-4 mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-1 h-5 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <h2 className="text-base font-black text-stone-800">ننصحكِ بها اليوم</h2>
          </div>

          <Link
            to={`/cooks/${featuredCook.id}`}
            className="group relative block rounded-3xl overflow-hidden shadow-xl shadow-orange-900/15 active:scale-[0.99] transition-transform"
            style={{ minHeight: '240px' }}
          >
            {getCookImage(featuredCook) ? (
              <img
                src={optimizeImage(getCookImage(featuredCook), 900)}
                alt={featuredCook.name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600" />
            )}

            {/* Multi-layer gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

            {/* Content */}
            <div className="relative p-5 pt-36 md:pt-44 flex flex-col justify-end">
              {/* Badge row */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg">
                  <Award className="w-3 h-3" strokeWidth={2.5} />
                  مميّزة
                </span>
                {featuredCook.isFoundingMember && (
                  <span className="inline-flex items-center gap-1 bg-white/20 border border-white/30 text-white/90 px-2.5 py-1 rounded-full text-[10px] font-bold">
                    👑 عضو مؤسسة
                  </span>
                )}
              </div>

              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-1"
                      style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                    {featuredCook.name}
                  </h3>
                  {featuredCook.neighborhood && (
                    <p className="text-white/65 text-xs flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" strokeWidth={2.2} />
                      {featuredCook.neighborhood}
                    </p>
                  )}
                  {featuredCook.bio && (
                    <p className="text-white/80 text-xs leading-relaxed line-clamp-2 max-w-xs">
                      {featuredCook.bio}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {featuredCook.totalRatings > 0 && (
                    <div className="flex items-center gap-1 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-black shadow-lg">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {(featuredCook.averageRating || 0).toFixed(1)}
                    </div>
                  )}
                  <div className="bg-orange-500 group-hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-colors">
                    زيارة الملف
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ============================================ */}
      {/* TOP RATED — Horizontal scroll strip          */}
      {/* ============================================ */}
      {!loading && topCooks.length > 0 && (
        <section className="mb-6">
          <div className="max-w-5xl mx-auto px-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" strokeWidth={2.4} />
                <h2 className="text-base font-black text-stone-800">الأعلى تقييماً</h2>
              </div>
              <Link
                to="/cooks"
                className="text-xs font-extrabold text-orange-600 flex items-center gap-0.5 active:scale-95 transition"
              >
                الكل <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-3 px-4 pb-1">
              {topCooks.map((cook, idx) => (
                <Link
                  key={cook.id}
                  to={`/cooks/${cook.id}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="flex-shrink-0 w-32 active:scale-95 transition-all group animate-slide-up"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 shadow-sm">
                    {getCookImage(cook) ? (
                      <img
                        src={optimizeImage(getCookImage(cook), 200)}
                        alt={cook.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${COOK_GRADIENTS[idx % COOK_GRADIENTS.length]} flex items-center justify-center text-4xl`}>
                        👩‍🍳
                      </div>
                    )}
                    {/* Rank badge */}
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-black text-amber-600 shadow-md">
                      {idx + 1}
                    </div>
                    {/* Bottom overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-1 inset-x-1 flex items-center justify-center gap-0.5 text-white text-[10px] font-bold">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      {(cook.averageRating || 0).toFixed(1)}
                      <span className="text-white/60">({cook.totalRatings})</span>
                    </div>
                  </div>
                  <h3 className="font-extrabold text-stone-800 text-xs text-center truncate">{cook.name}</h3>
                  {cook.neighborhood && (
                    <p className="text-[10px] text-stone-400 text-center truncate mt-0.5">{cook.neighborhood}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* VALUE PROPS — 3 pillars of trust             */}
      {/* ============================================ */}
      <section className="max-w-5xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { Icon: Heart,  label: 'صُنع بحب',    desc: 'من قلب البيت',      color: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-100'   },
            { Icon: Shield, label: 'موثوقات',      desc: 'طباخات معتمدات',    color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
            { Icon: Flame,  label: 'طازج دائماً',  desc: 'يُحضَّر عند الطلب', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
          ].map(({ Icon, label, desc, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-3 text-center`}>
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Icon className={`w-4 h-4 ${color}`} strokeWidth={2.4} />
              </div>
              <p className="text-xs font-black text-stone-800">{label}</p>
              <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* COOK CTA — Rich amber invitation             */}
      {/* ============================================ */}
      <section className="max-w-5xl mx-auto px-4 mb-6">
        <Link
          to="/cook/signup"
          className="group relative block overflow-hidden rounded-3xl active:scale-[0.99] transition-transform"
        >
          <div className="absolute inset-0 bg-gradient-to-l from-[#7C2800] via-[#B84000] to-[#7C2800]" />
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors animate-hero-float">
              <ChefHat className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-amber-300/80 mb-0.5 uppercase tracking-widest">للطباخات فقط</p>
              <h3 className="text-lg font-black text-white leading-tight">هل أنتِ طباخة؟</h3>
              <p className="text-xs text-white/60 mt-0.5">انضمّي وابدئي البيع من بيتكِ مباشرة</p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
              <ArrowLeft className="w-4 h-4 text-white" strokeWidth={2.8} />
            </div>
          </div>
        </Link>
      </section>

      {/* ============================================ */}
      {/* FOOTER                                       */}
      {/* ============================================ */}
      <footer className="max-w-5xl mx-auto px-4 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-md shadow-orange-500/30">
            <ChefHat className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="font-black text-stone-800">نَكهة</span>
        </div>
        <p className="text-[11px] text-stone-400 mb-3">أكل بيتي في بشار 🇩🇿</p>
        <div className="flex items-center justify-center gap-3 text-[11px]">
          <Link to="/about"   className="text-stone-500 hover:text-orange-600 font-bold transition-colors">عنّا</Link>
          <span className="text-stone-300">·</span>
          <Link to="/privacy" className="text-stone-500 hover:text-orange-600 font-bold transition-colors">الخصوصية</Link>
          <span className="text-stone-300">·</span>
          <Link to="/terms"   className="text-stone-500 hover:text-orange-600 font-bold transition-colors">الشروط</Link>
        </div>
        <p className="text-[10px] text-stone-300 mt-3">
          © 2026 — صُنع بـ{' '}
          <Heart className="w-3 h-3 inline fill-red-400 text-red-400" /> في الجزائر
        </p>
      </footer>

    </div>
  );
}

/* ============================================ */
/* Cook Mosaic — Overlapping circles            */
/* ============================================ */
function CookMosaic({ cooks }) {
  const slots = [
    { top: '0%',   right: '10%', size: 'w-24 h-24', z: 20, delay: 0   },
    { top: '0%',   right: '42%', size: 'w-[72px] h-[72px]', z: 10, delay: 80  },
    { top: '0%',   right: '68%', size: 'w-16 h-16', z: 5,  delay: 160 },
    { top: '48%',  right: '2%',  size: 'w-20 h-20', z: 15, delay: 100 },
    { top: '48%',  right: '32%', size: 'w-24 h-24', z: 30, delay: 50  },
    { top: '52%',  right: '65%', size: 'w-16 h-16', z: 8,  delay: 200 },
  ];

  return (
    <div className="relative w-full h-full">
      {slots.map((slot, i) => {
        const cook  = cooks[i];
        const image = cook ? getCookImage(cook) : '';
        const grad  = COOK_GRADIENTS[i % COOK_GRADIENTS.length];

        return (
          <div
            key={i}
            className={`absolute ${slot.size} rounded-full overflow-hidden border-[2.5px] border-white/25 shadow-2xl animate-mosaic-in`}
            style={{
              top:            slot.top,
              right:          slot.right,
              zIndex:         slot.z,
              animationDelay: `${slot.delay}ms`,
              boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {image ? (
              <img
                src={optimizeImage(image, 160)}
                alt={cook?.name || ''}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center text-2xl`}>
                👩‍🍳
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MosaicSkeleton() {
  return (
    <div className="relative w-full h-full">
      {[
        { top: '0%', right: '10%', size: 'w-24 h-24' },
        { top: '0%', right: '42%', size: 'w-16 h-16' },
        { top: '0%', right: '68%', size: 'w-14 h-14' },
        { top: '48%', right: '2%',  size: 'w-20 h-20' },
        { top: '48%', right: '32%', size: 'w-24 h-24' },
        { top: '52%', right: '65%', size: 'w-14 h-14' },
      ].map((s, i) => (
        <div
          key={i}
          className={`absolute ${s.size} rounded-full bg-white/10 animate-pulse border border-white/10`}
          style={{ top: s.top, right: s.right }}
        />
      ))}
    </div>
  );
}

/* ============================================ */
/* Editorial Cook Card — for horizontal scroll  */
/* ============================================ */
const EditorialCookCard = memo(function EditorialCookCard({ cook, idx }) {
  const firstDish = cook.availableDishes[0];
  const grad      = COOK_GRADIENTS[idx % COOK_GRADIENTS.length];

  return (
    <Link
      to={`/cooks/${cook.id}`}
      className="flex-shrink-0 w-44 group active:scale-[0.97] transition-all animate-slide-up"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      {/* Portrait image */}
      <div className="relative h-56 rounded-2xl overflow-hidden shadow-md mb-2.5">
        {getCookImage(cook) ? (
          <img
            src={optimizeImage(getCookImage(cook), 300)}
            alt={cook.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center text-5xl`}>
            👩‍🍳
          </div>
        )}

        {/* Available dot */}
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow-md">
          <span className="relative flex h-1 w-1">
            <span className="animate-ping absolute inset-0 rounded-full bg-white opacity-70" />
            <span className="relative rounded-full h-1 w-1 bg-white inline-flex" />
          </span>
          متاحة
        </div>

        {/* Rating chip */}
        {cook.totalRatings > 0 && (
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur px-1.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 shadow">
            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
            {(cook.averageRating || 0).toFixed(1)}
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute bottom-2 right-2 left-2">
          <p className="text-white font-extrabold text-sm drop-shadow-md truncate">{cook.name}</p>
          {cook.neighborhood && (
            <p className="text-white/75 text-[10px] font-bold truncate mt-0.5">📍 {cook.neighborhood}</p>
          )}
        </div>
      </div>

      {/* First dish pill */}
      {firstDish && (
        <div className="flex items-center gap-1.5 bg-white rounded-xl px-2 py-1.5 shadow-sm border border-stone-100 group-hover:border-orange-200 transition-colors">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-orange-50 flex items-center justify-center text-sm">
            {getDishImage(firstDish) ? (
              <img
                src={optimizeImage(getDishImage(firstDish), 56)}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : '🍽️'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-extrabold text-stone-800 truncate">{firstDish.name}</p>
            <p className="text-[10px] font-bold text-orange-600">{firstDish.price} دج</p>
          </div>
        </div>
      )}
    </Link>
  );
});

export default Home;
