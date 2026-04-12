import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRight, Filter } from 'lucide-react';
import CookCard from '../components/CookCard';

function Cooks() {
  const [cooks, setCooks] = useState([]);
  const [filteredCooks, setFilteredCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, readyToday
  const [cuisineFilter, setCuisineFilter] = useState('all');

  useEffect(() => {
    const fetchCooks = async () => {
      const snapshot = await getDocs(collection(db, 'cooks'));
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.isActive !== false);
      setCooks(data);
      setFilteredCooks(data);
      setLoading(false);
    };
    fetchCooks();
  }, []);

  useEffect(() => {
    let result = [...cooks];
    if (filter === 'readyToday') {
      result = result.filter(c => c.isReadyToday);
    }
    if (cuisineFilter !== 'all') {
      result = result.filter(c => c.cuisineType === cuisineFilter);
    }
    setFilteredCooks(result);
  }, [filter, cuisineFilter, cooks]);

  // استخراج أنواع الأكل الفريدة
  const cuisineTypes = ['all', ...new Set(cooks.map(c => c.cuisineType).filter(Boolean))];

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
          <p className="text-white/90 mt-2">اختر طباخة وتمتع بأشهى الأكلات المنزلية</p>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-dark">فلترة</h3>
          </div>

          {/* فلتر التوفر */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter('readyToday')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === 'readyToday' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              🔥 متوفر اليوم
            </button>
          </div>

          {/* فلتر نوع الأكل */}
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map(type => (
              <button
                key={type}
                onClick={() => setCuisineFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  cuisineFilter === type ? 'bg-dark text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type === 'all' ? 'كل الأنواع' : type}
              </button>
            ))}
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
