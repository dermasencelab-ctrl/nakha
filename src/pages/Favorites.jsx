import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFavorites } from '../hooks/useFavorites';
import { Heart, ChefHat, ArrowLeft } from 'lucide-react';
import CookCard from '../components/CookCard';

export default function Favorites() {
  const { favorites, toggle } = useFavorites();
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      const ids = [...favorites];
      if (ids.length === 0) {
        setCooks([]);
        setLoading(false);
        return;
      }

      try {
        // Firestore 'in' queries support up to 30 items
        const chunks = [];
        for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));

        const results = await Promise.all(
          chunks.map((chunk) =>
            getDocs(query(collection(db, 'cooks'), where('__name__', 'in', chunk)))
          )
        );

        const dishesSnap = await getDocs(
          query(collection(db, 'dishes'), where('available', '==', true))
        );
        const availableDishes = dishesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const allCooks = results.flatMap((snap) =>
          snap.docs.map((d) => {
            const data = { id: d.id, ...d.data() };
            data.availableDishesCount = availableDishes.filter(
              (dish) => dish.cookId === d.id
            ).length;
            return data;
          })
        );

        // Preserve the saved order
        const ordered = ids.map((id) => allCooks.find((c) => c.id === id)).filter(Boolean);
        setCooks(ordered);
      } catch (e) {
        console.error('Error fetching favorites:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favorites]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-28">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-400/30">
            <Heart className="w-5 h-5 text-white fill-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-800 leading-none">مفضّلاتي</h1>
            <p className="text-xs text-stone-500 mt-0.5">الطباخات اللواتي حفظتِهن</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm">
                <div className="h-36 animate-shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 animate-shimmer rounded-md" />
                  <div className="h-3 w-2/3 animate-shimmer rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : cooks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-300" strokeWidth={2} />
            </div>
            <h3 className="font-extrabold text-stone-800 mb-2">لا توجد مفضّلات بعد</h3>
            <p className="text-sm text-stone-500 mb-6">
              اضغطي على ❤️ على أي طباخة لحفظها هنا
            </p>
            <Link
              to="/cooks"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold active:scale-95 transition shadow-lg shadow-orange-500/30 text-sm"
            >
              <ChefHat className="w-4 h-4" strokeWidth={2.4} />
              تصفح الطباخات
              <ArrowLeft className="w-4 h-4" strokeWidth={2.6} />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-stone-500 font-bold mb-4">
              {cooks.length} {cooks.length === 1 ? 'طباخة محفوظة' : 'طباخات محفوظات'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cooks.map((cook) => (
                <CookCard key={cook.id} cook={cook} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
