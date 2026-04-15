import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChefHat, Utensils, ShoppingBag, Star, Zap, Package } from 'lucide-react';

function Home() {
  const [availableCooks, setAvailableCooks] = useState([]);
  const [topCooks, setTopCooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب كل الطباخات المعتمدات
        const cooksSnapshot = await getDocs(collection(db, 'cooks'));
        const allCooks = cooksSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.status === 'approved' || (c.isActive !== false && !c.status));

        // جلب الأطباق المتاحة
        const dishesSnapshot = await getDocs(
          query(collection(db, 'dishes'), where('available', '==', true))
        );
        const availableDishes = dishesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // ربط كل طباخة بأطباقها المتاحة
        const cooksWithDishes = allCooks.map(cook => {
          const dishes = availableDishes.filter(d => d.cookId === cook.id);
          return { ...cook, availableDishes: dishes };
        });

        // الطباخات المتاحات (عندهن أطباق متاحة)
        const available = cooksWithDishes
          .filter(c => c.availableDishes.length > 0)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 6);

        // أفضل الطباخات (الأعلى تقييماً)
        const top = cooksWithDishes
          .sort((a, b) => {
            const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
            if (ratingDiff !== 0) return ratingDiff;
            return (b.totalOrders || 0) - (a.totalOrders || 0);
          })
          .slice(0, 3);

        setAvailableCooks(available);
        setTopCooks(top);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // دالة مساعدة لصورة الطباخة
  const getCookImage = (cook) => cook?.photo || cook?.image || '';
  const getDishImage = (dish) => dish?.photo || dish?.image || '';

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-orange-600 to-orange-700 text-white py-20 px-4 relative overflow-hidden">
        {/* زخارف خلفية */}
        <div className="absolute top-10 right-10 text-9xl opacity-10">🍲</div>
        <div className="absolute bottom-10 left-10 text-9xl opacity-10">👩‍🍳</div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            نَكهة 🍲
          </h1>
          <p className="text-xl md:text-2xl mb-3 font-medium">
            اطلب أكل منزلي من طباخات موثوقات في بشار
          </p>
          <p className="text-white/90 mb-8 text-lg">
            ⚡ توصيل سريع • ⭐ جودة عالية • 🍽️ خيارات متنوعة
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/cooks"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-full text-lg font-bold hover:bg-cream transition shadow-xl transform hover:scale-105"
            >
              <ShoppingBag className="w-5 h-5" />
              ابدأ الطلب الآن
            </Link>
            <Link
              to="/my-orders"
              className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white/30 transition border-2 border-white/30"
            >
              <Package className="w-5 h-5" />
              طلباتي
            </Link>
          </div>
        </div>
      </section>

      {/* قسم "متاح الآن" 🔥 */}
      {!loading && availableCooks.length > 0 && (
        <section className="py-12 px-4 bg-gradient-to-b from-green-50 to-cream">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-dark">
                    متاح الآن
                  </h2>
                  <Zap className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-gray-600">اطلب أكل جاهز من طباخات يطبخن الآن</p>
              </div>
              <Link
                to="/cooks"
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                عرض الكل ←
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCooks.map(cook => (
                <Link
                  key={cook.id}
                  to={`/cooks/${cook.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition transform hover:-translate-y-1 border-2 border-green-200"
                >
                  {/* صورة الطباخة */}
                  <div className="relative">
                    {getCookImage(cook) ? (
                      <img
                        src={getCookImage(cook)}
                        alt={cook.name}
                        className="w-full h-40 object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-6xl">
                        👩‍🍳
                      </div>
                    )}

                    {/* شارة "متاحة الآن" */}
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      متاحة الآن
                    </div>

                    {/* التقييم */}
                    {cook.totalRatings > 0 && (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {cook.averageRating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* المحتوى */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-dark">{cook.name}</h3>
                      {cook.neighborhood && (
                        <p className="text-xs text-gray-500 mt-1">📍 {cook.neighborhood}</p>
                      )}
                    </div>

                    {/* الأطباق المتاحة */}
                    <div className="mb-4 space-y-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        🍽️ {cook.availableDishes.length} أطباق متاحة
                      </p>
                      {cook.availableDishes.slice(0, 2).map(dish => (
                        <div key={dish.id} className="flex items-center gap-2 bg-orange-50 rounded-lg p-2">
                          {getDishImage(dish) ? (
                            <img
                              src={getDishImage(dish)}
                              alt={dish.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                              🍽️
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{dish.name}</p>
                            <p className="text-xs font-bold text-primary">{dish.price} دج</p>
                          </div>
                        </div>
                      ))}
                      {cook.availableDishes.length > 2 && (
                        <p className="text-xs text-center text-gray-500">
                          + {cook.availableDishes.length - 2} أطباق أخرى
                        </p>
                      )}
                    </div>

                    {/* زر الطلب */}
                    <button className="w-full bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      اطلب الآن
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-dark mb-3">
            كيف يعمل؟
          </h2>
          <p className="text-center text-gray-600 mb-12">بـ 3 خطوات بسيطة تحصل على وجبتك</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-10 h-10 text-primary" />
              </div>
              <div className="inline-block bg-primary text-white w-8 h-8 rounded-full font-bold mb-2 flex items-center justify-center mx-auto">1</div>
              <h3 className="text-2xl font-bold mb-2">اختر الطباخة</h3>
              <p className="text-gray-600">تصفح أفضل الطباخات المنزليات في بشار</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-10 h-10 text-primary" />
              </div>
              <div className="inline-block bg-primary text-white w-8 h-8 rounded-full font-bold mb-2 flex items-center justify-center mx-auto">2</div>
              <h3 className="text-2xl font-bold mb-2">اختر وجبتك</h3>
              <p className="text-gray-600">شاهد الأطباق واختر ما يعجبك</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-10 h-10 text-primary" />
              </div>
              <div className="inline-block bg-primary text-white w-8 h-8 rounded-full font-bold mb-2 flex items-center justify-center mx-auto">3</div>
              <h3 className="text-2xl font-bold mb-2">اطلب مباشرة</h3>
              <p className="text-gray-600">أكّد طلبك واستلمه بسرعة</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Cooks */}
      {!loading && topCooks.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-dark mb-3">
                ⭐ أفضل الطباخات
              </h2>
              <p className="text-gray-600">الأعلى تقييماً من زبائننا</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {topCooks.map(cook => (
                <Link
                  key={cook.id}
                  to={`/cooks/${cook.id}`}
                  className="bg-cream rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <div className="relative">
                    {getCookImage(cook) ? (
                      <img src={getCookImage(cook)} alt={cook.name} className="w-full h-56 object-cover" />
                    ) : (
                      <div className="w-full h-56 bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-7xl">
                        👩‍🍳
                      </div>
                    )}
                    {cook.totalRatings > 0 && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-md">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {cook.averageRating.toFixed(1)}
                        <span className="text-gray-500 text-xs">({cook.totalRatings})</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-dark mb-2">{cook.name}</h3>
                    {cook.neighborhood && (
                      <p className="text-sm text-gray-500 mb-3">📍 {cook.neighborhood}</p>
                    )}
                    {cook.totalOrders > 0 && (
                      <p className="text-sm text-gray-600 mb-3">
                        <Package className="w-4 h-4 inline text-orange-500" /> +{cook.totalOrders} طلب مكتمل
                      </p>
                    )}
                    <span className="inline-block bg-primary text-white px-4 py-1 rounded-full text-sm">
                      عرض الأطباق ←
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-orange-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">هل أنتِ طباخة موهوبة؟ 👩‍🍳</h2>
          <p className="text-xl mb-8 text-white/90">
            انضمّي إلى نَكهة وابدئي بيع أكلك المنزلي اليوم
          </p>
          <Link
            to="/cook/signup"
            className="inline-block bg-white text-primary px-8 py-4 rounded-full text-lg font-bold hover:bg-cream transition shadow-xl transform hover:scale-105"
          >
            سجّلي كطباخة
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-8 text-center">
        <p className="mb-2">© 2026 نَكهة - منصة الأكل المنزلي في بشار</p>
        <p className="text-sm text-white/60">صُنع بـ ❤️ في الجزائر</p>
      </footer>
    </div>
  );
}

export default Home;