import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ChefHat,
  ShoppingBag,
  Star,
  Search,
  MapPin,
  Flame,
  Clock,
  Sparkles,
  ArrowLeft,
  Heart,
  Utensils,
  TrendingUp,
} from 'lucide-react';

function Home() {
  const [availableCooks, setAvailableCooks] = useState([]);
  const [topCooks, setTopCooks] = useState([]);
  const [popularDishes, setPopularDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cooksSnapshot = await getDocs(collection(db, 'cooks'));
        const allCooks = cooksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((c) => c.status === 'approved' || (c.isActive !== false && !c.status));

        const dishesSnapshot = await getDocs(
          query(collection(db, 'dishes'), where('available', '==', true))
        );
        const availableDishes = dishesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const cooksWithDishes = allCooks.map((cook) => {
          const dishes = availableDishes.filter((d) => d.cookId === cook.id);
          return { ...cook, availableDishes: dishes };
        });

        const available = cooksWithDishes
          .filter((c) => c.availableDishes.length > 0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 8);

        const top = cooksWithDishes
          .sort((a, b) => {
            const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
            if (ratingDiff !== 0) return ratingDiff;
            return (b.totalOrders || 0) - (a.totalOrders || 0);
          })
          .slice(0, 4);

        // الأطباق الشعبية (متاحة + أعلى سعر أو عشوائية)
        const popular = availableDishes
          .map((dish) => {
            const cook = allCooks.find((c) => c.id === dish.cookId);
            return { ...dish, cook };
          })
          .filter((d) => d.cook)
          .slice(0, 6);

        setAvailableCooks(available);
        setTopCooks(top);
        setPopularDishes(popular);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCookImage = (cook) => cook?.photo || cook?.image || '';
  const getDishImage = (dish) => dish?.photo || dish?.image || '';

  const handleSearch = (e) => {
    e.preventDefault();
    // يمكن توجيهه لصفحة الطباخات مع query
    if (searchQuery.trim()) {
      window.location.href = `/cooks?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-24 md:pb-8">
      {/* ============================================ */}
      {/* Hero Section - مدمج ومختصر */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">
        {/* الخلفية المتدرجة */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500 via-orange-600 to-orange-500" />

        {/* زخارف خلفية */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-orange-700/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />

        <div className="relative max-w-6xl mx-auto px-4 pt-6 pb-24 text-white">
          {/* شارة ترحيبية */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            طباخات في مطابخهن الآن
          </div>

          <h1 className="text-3xl md:text-5xl font-black mb-2 leading-tight">
            أكل بيت من قلب
            <br />
            <span className="relative inline-block">
              بشار
              <span className="absolute bottom-1 right-0 w-full h-1.5 bg-yellow-300/70 rounded-full -z-10" />
            </span>
            {' '}
            <span className="inline-block animate-gentle-bounce">🍲</span>
          </h1>
          <p className="text-white/90 text-sm md:text-base mb-6 max-w-md">
            طباخات موثوقات، وجبات دافئة، وصلاتك بسرعة
          </p>

          {/* شريط البحث */}
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <div className="relative bg-white rounded-2xl shadow-xl shadow-orange-900/20 flex items-center overflow-hidden">
              <Search className="absolute right-4 w-5 h-5 text-stone-400" strokeWidth={2.2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن طباخة أو طبق..."
                className="w-full py-4 pr-12 pl-28 text-stone-700 placeholder-stone-400 focus:outline-none text-sm font-medium"
              />
              <button
                type="submit"
                className="absolute left-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
              >
                بحث
              </button>
            </div>
          </form>
        </div>

        {/* منحنى سفلي للـ hero */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#FFF8F0] rounded-t-[2rem]" />
      </section>

      {/* ============================================ */}
      {/* شريط الإحصائيات السريعة */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 -mt-16 relative z-10 mb-8">
        <div className="bg-white rounded-3xl shadow-lg shadow-orange-200/40 p-4 grid grid-cols-3 gap-2">
          <StatBox
            icon={ChefHat}
            value={availableCooks.length || '...'}
            label="طباخة متاحة"
            color="orange"
          />
          <div className="border-r border-l border-stone-100" />
          <StatBox
            icon={Utensils}
            value={popularDishes.length || '...'}
            label="طبق جاهز"
            color="amber"
          />
          <div className="border-r border-stone-100" />
          <StatBox
            icon={Clock}
            value="30د"
            label="متوسط التوصيل"
            color="green"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* التصنيفات السريعة - دائرية */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-4 gap-3">
          <CategoryChip emoji="🍲" label="أطباق" to="/cooks" />
          <CategoryChip emoji="👩‍🍳" label="طباخات" to="/cooks" />
          <CategoryChip emoji="🥘" label="تقليدي" to="/cooks" />
          <CategoryChip emoji="🍰" label="حلويات" to="/cooks" />
        </div>
      </section>

      {/* ============================================ */}
      {/* قسم "متاح الآن" - تمرير أفقي */}
      {/* ============================================ */}
      <section className="mb-8">
        <SectionHeader
          icon={Flame}
          title="متاح الآن"
          subtitle="طباخات يطبخن في هذه اللحظة"
          link="/cooks"
          iconColor="text-red-500"
          badge
        />

        {loading ? (
          <HorizontalSkeleton />
        ) : availableCooks.length === 0 ? (
          <EmptyState message="لا توجد طباخات متاحات حالياً" />
        ) : (
          <div className="overflow-x-auto no-scrollbar snap-x-padded">
            <div className="flex gap-4 px-4 pb-2">
              {availableCooks.map((cook, idx) => (
                <Link
                  key={cook.id}
                  to={`/cooks/${cook.id}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="animate-slide-up flex-shrink-0 w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.98] transition-all group"
                >
                  {/* الصورة */}
                  <div className="relative h-40 overflow-hidden">
                    {getCookImage(cook) ? (
                      <img
                        src={getCookImage(cook)}
                        alt={cook.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-200 via-amber-200 to-orange-300 flex items-center justify-center text-6xl">
                        👩‍🍳
                      </div>
                    )}

                    {/* تدرج علوي لقراءة النص */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                    {/* شارة متاحة الآن */}
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                      متاحة
                    </div>

                    {/* التقييم */}
                    {cook.totalRatings > 0 && (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {cook.averageRating.toFixed(1)}
                      </div>
                    )}

                    {/* الاسم على الصورة */}
                    <div className="absolute bottom-3 right-3 left-3">
                      <h3 className="text-white font-extrabold text-lg drop-shadow-md truncate">
                        {cook.name}
                      </h3>
                      {cook.neighborhood && (
                        <p className="text-white/90 text-xs flex items-center gap-1 drop-shadow">
                          <MapPin className="w-3 h-3" />
                          {cook.neighborhood}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* معلومات الأطباق */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-500">
                        🍽️ {cook.availableDishes.length} أطباق
                      </span>
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-0.5">
                        اطلب
                        <ArrowLeft className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                    </div>

                    {/* معاينة طبق */}
                    {cook.availableDishes[0] && (
                      <div className="flex items-center gap-2 bg-orange-50 rounded-xl p-2">
                        {getDishImage(cook.availableDishes[0]) ? (
                          <img
                            src={getDishImage(cook.availableDishes[0])}
                            alt={cook.availableDishes[0].name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center text-base">
                            🍽️
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-700 truncate">
                            {cook.availableDishes[0].name}
                          </p>
                          <p className="text-xs font-bold text-orange-600">
                            {cook.availableDishes[0].price} دج
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* أفضل الطباخات - شبكة عمودية */}
      {/* ============================================ */}
      {!loading && topCooks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-8">
          <SectionHeader
            icon={TrendingUp}
            title="الأكثر طلباً"
            subtitle="الأعلى تقييماً من الزبائن"
            link="/cooks"
            iconColor="text-orange-500"
            inline
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {topCooks.map((cook, idx) => (
              <Link
                key={cook.id}
                to={`/cooks/${cook.id}`}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="animate-slide-up bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.97] transition-all group"
              >
                <div className="relative aspect-square overflow-hidden">
                  {getCookImage(cook) ? (
                    <img
                      src={getCookImage(cook)}
                      alt={cook.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-200 via-amber-200 to-orange-300 flex items-center justify-center text-6xl">
                      👩‍🍳
                    </div>
                  )}

                  {/* ترتيب */}
                  <div className="absolute top-2 right-2 w-7 h-7 bg-white/95 backdrop-blur rounded-full flex items-center justify-center text-xs font-black text-orange-600 shadow-md">
                    #{idx + 1}
                  </div>

                  {cook.totalRatings > 0 && (
                    <div className="absolute bottom-2 right-2 left-2 bg-black/60 backdrop-blur text-white px-2 py-1 rounded-lg flex items-center justify-center gap-1 text-xs font-bold">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {cook.averageRating.toFixed(1)}
                      <span className="text-white/70">({cook.totalRatings})</span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-extrabold text-stone-800 truncate text-sm">
                    {cook.name}
                  </h3>
                  {cook.neighborhood && (
                    <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{cook.neighborhood}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* كيف يعمل - بطاقات أفقية */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-extrabold text-stone-800">كيف يعمل؟</h2>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="space-y-4">
            <Step num="1" icon={ChefHat} title="اختر الطباخة" desc="تصفح الطباخات في بشار" />
            <div className="border-b border-dashed border-stone-200" />
            <Step num="2" icon={Utensils} title="اختر وجبتك" desc="شاهد الأطباق المتاحة" />
            <div className="border-b border-dashed border-stone-200" />
            <Step num="3" icon={ShoppingBag} title="اطلب مباشرة" desc="أكّد الطلب واستلمه بسرعة" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA - انضمي كطباخة */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 mb-4">
        <Link
          to="/cook/signup"
          className="relative block bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-3xl overflow-hidden p-6 text-white shadow-xl shadow-orange-500/30 active:scale-[0.98] transition-transform"
        >
          {/* زخارف */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-yellow-400/20 rounded-full blur-2xl" />
          <div className="absolute top-4 left-4 text-6xl opacity-20">👩‍🍳</div>

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-bold mb-3">
              <Heart className="w-3 h-3 fill-white" />
              انضمي لعائلتنا
            </div>
            <h3 className="text-2xl font-black mb-1">هل أنتِ طباخة موهوبة؟</h3>
            <p className="text-white/90 text-sm mb-4 max-w-xs">
              ابدئي ببيع أكلك المنزلي اليوم واربحي من شغفك
            </p>
            <span className="inline-flex items-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-lg">
              سجّلي الآن
              <ArrowLeft className="w-4 h-4" strokeWidth={2.8} />
            </span>
          </div>
        </Link>
      </section>

      {/* ============================================ */}
      {/* Footer بسيط */}
      {/* ============================================ */}
      <footer className="max-w-6xl mx-auto px-4 pt-6 pb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-stone-700">نَكهة</span>
        </div>
        <p className="text-xs text-stone-500">© 2026 • أكل بيتي في بشار 🇩🇿</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <Link to="/about" className="text-stone-600 hover:text-orange-600 font-semibold">
            عنّا
          </Link>
          <span className="text-stone-300">•</span>
          <Link to="/privacy" className="text-stone-600 hover:text-orange-600 font-semibold">
            الخصوصية
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ============================================ */
/* مكوّنات مساعدة */
/* ============================================ */

function StatBox({ icon: Icon, value, label, color }) {
  const colors = {
    orange: 'bg-orange-100 text-orange-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
  };
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${colors[color]}`}>
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <p className="text-base font-black text-stone-800 leading-none">{value}</p>
      <p className="text-[10px] text-stone-500 font-semibold mt-1 text-center">{label}</p>
    </div>
  );
}

function CategoryChip({ emoji, label, to }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center text-3xl border border-orange-100">
        {emoji}
      </div>
      <span className="text-xs font-bold text-stone-700">{label}</span>
    </Link>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, link, iconColor, badge, inline }) {
  return (
    <div className={`${inline ? '' : 'max-w-6xl mx-auto px-4'} flex items-end justify-between mb-4`}>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="relative">
            <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.4} />
            {badge && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <h2 className="text-xl font-extrabold text-stone-800">{title}</h2>
        </div>
        <p className="text-xs text-stone-500 pr-7">{subtitle}</p>
      </div>
      {link && (
        <Link
          to={link}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 active:scale-95 transition"
        >
          الكل
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}

function Step({ num, icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-orange-600" strokeWidth={2.3} />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md">
          {num}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-stone-800 text-sm">{title}</h3>
        <p className="text-xs text-stone-500">{desc}</p>
      </div>
    </div>
  );
}

function HorizontalSkeleton() {
  return (
    <div className="flex gap-4 px-4 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="h-40 animate-shimmer" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-2/3 animate-shimmer rounded-md" />
            <div className="h-10 animate-shimmer rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="mx-4 bg-white rounded-3xl p-8 text-center shadow-sm">
      <div className="text-5xl mb-2">😴</div>
      <p className="text-sm text-stone-500 font-semibold">{message}</p>
    </div>
  );
}

export default Home;