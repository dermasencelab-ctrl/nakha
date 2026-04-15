import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRight, Filter, Star, Zap } from 'lucide-react';
import CookCard from '../components/CookCard';

function Cooks() {
  const [cooks, setCooks] = useState([]);
  const [filteredCooks, setFilteredCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | availableNow | topRated
  const [sortBy, setSortBy] = useState('rating'); // rating | orders | newest

  useEffect(() => {
    const fetchCooks = async () => {
      try {
        // جلب الطباخات المعتمدات فقط
        const cooksSnapshot = await getDocs(collection(db, 'cooks'));
        let cooksData = cooksSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c =>
            // فقط المعتمدات (الجديدات) أو القديمات النشطات
            c.status === 'approved' || (c.isActive !== false && !c.status)
          );

        // جلب عدد الأطباق المتاحة لكل طباخة
        const dishesSnapshot = await getDocs(
          query(collection(db, 'dishes'), where('available', '==', true))
        );
        const availableDishes = dishesSnapshot.docs.map(d => d.data());

        // حساب عدد الأطباق المتاحة لكل طباخة
        cooksData = cooksData.map(cook => {
          const count = availableDishes.filter(d => d.cookId === cook.id).length;
          return { ...cook, availableDishesCount: count };
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

  useEffect(() => {
    let result = [...cooks];

    // فلترة
    if (filter === 'availableNow') {
      result = result.filter(c => c.availableDishesCount > 0);
    } else if (filter === 'topRated') {
      result = result.filter(c => (c.averageRating || 0) >= 4);
    }

    // ترتيب
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'orders') {
      result.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }

    // الطباخات المتاحة الآن دائماً في الأعلى
    result.sort((a, b) => {
      if (a.availableDishesCount > 0 && b.availableDishesCount === 0) return -1;
      if (a.availableDishesCount === 0 && b.availableDishesCount > 0) return 1;
      return 0;
    });

    setFilteredCooks(result);
  }, [filter, sortBy, cooks]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-primary text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4">
            <ArrowRight className="w-5 h-5" />
            الرجوع للرئيسية
          </Link>
          <h1 className="text-4xl font-bold">طباخاتنا 👩‍🍳</h1>
          <p className="text-white/90 mt-2">اختر طباخة وتمتع بأشهى الأكلات المنزلية في بشار</p>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-dark">فلترة</h3>
          </div>

          {/* فلتر الحالة */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter('availableNow')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-1 ${
                filter === 'availableNow' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              متاحة الآن
            </button>
            <button
              onClick={() => setFilter('topRated')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-1 ${
                filter === 'topRated' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Star className="w-4 h-4" />
              الأعلى تقييماً
            </button>
          </div>

          {/* الترتيب */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">ترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="rating">الأعلى تقييماً</option>
              <option value="orders">الأكثر طلباً</option>
              <option value="newest">الأحدث</option>
            </select>
          </div>
        </div>

        {/* عدد النتائج */}
        <p className="text-gray-600 mb-4">
          {filteredCooks.length} {filteredCooks.length === 1 ? 'طباخة' : 'طباخات'}
        </p>

        {/* قائمة الطباخات */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">جاري التحميل...</div>
        ) : filteredCooks.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            😔 لا توجد طباخات بهذه الفلترة
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCooks.map(cook => (
              <CookCard key={cook.id} cook={cook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Cooks;