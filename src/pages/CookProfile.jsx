import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRight, Plus, Check, Flame, ShoppingCart, Star, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

function CookProfile() {
  const { id } = useParams();
  const [cook, setCook] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedDishId, setAddedDishId] = useState(null);

  const { addToCart, cart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      const cookDoc = await getDoc(doc(db, 'cooks', id));
      if (cookDoc.exists()) {
        setCook({ id: cookDoc.id, ...cookDoc.data() });
      }

      const q = query(collection(db, 'dishes'), where('cookId', '==', id));
      const snapshot = await getDocs(q);
      const dishesData = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.available !== false && d.isActive !== false);
      setDishes(dishesData);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const getDishImage = (dish) => dish?.photo || dish?.image || '';
  const getCookImage = (cook) => cook?.photo || cook?.image || '';

  // تحقق إذا الطبق موجود في السلة
  const getCartQuantity = (dishId) => {
    const item = cart.find(i => i.dishId === dishId);
    return item ? item.quantity : 0;
  };

  // إضافة للسلة مع تأثير بصري
  const handleAddToCart = (dish) => {
    addToCart(dish, cook);
    setAddedDishId(dish.id);
    setTimeout(() => setAddedDishId(null), 1500);
  };

  // عدد العناصر من هذي الطباخة في السلة
  const cookCartItems = cart.filter(item => item.cookId === id);
  const cookCartTotal = cookCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!cook) return <div className="min-h-screen flex items-center justify-center">الطباخة غير موجودة</div>;

  return (
    <div className="min-h-screen bg-cream pb-28">
      {/* Header مع صورة الطباخة */}
      <div className="relative h-72 bg-gradient-to-b from-primary to-orange-700">
        {getCookImage(cook) ? (
          <img src={getCookImage(cook)} alt={cook.name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-primary to-orange-700" />
        )}
        <Link to="/cooks" className="absolute top-4 right-4 bg-white/90 p-2 rounded-full">
          <ArrowRight className="w-5 h-5 text-dark" />
        </Link>
        <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h1 className="text-4xl font-bold">{cook.name}</h1>
            {cook.isFoundingMember && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                ⭐ عضو مؤسسة #{cook.foundingMemberNumber}
              </span>
            )}
          </div>
          {cook.neighborhood && (
            <p className="text-white/80 text-sm mb-1">📍 {cook.neighborhood}</p>
          )}
          <p className="text-white/90">{cook.bio || cook.description || ''}</p>

          {/* التقييم والإحصائيات */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {cook.totalRatings > 0 && (
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold">{cook.averageRating?.toFixed(1)}</span>
                <span className="text-xs text-white/80">({cook.totalRatings})</span>
              </div>
            )}
            {cook.totalOrders > 0 && (
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <Package className="w-4 h-4" />
                <span className="text-sm">+{cook.totalOrders} طلب</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* قائمة الأطباق */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-dark mb-6">الأطباق المتوفرة</h2>

        {dishes.length === 0 ? (
          <p className="text-center text-gray-500 py-10">لا توجد أطباق متاحة حالياً</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {dishes.map(dish => {
              const inCartQty = getCartQuantity(dish.id);
              const justAdded = addedDishId === dish.id;

              return (
                <div key={dish.id} className="bg-white rounded-2xl overflow-hidden shadow-md">
                  <div className="relative">
                    {getDishImage(dish) ? (
                      <img
                        src={getDishImage(dish)}
                        alt={dish.name}
                        className="w-full h-56 object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-56 bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center text-6xl">
                        🍽️
                      </div>
                    )}
                    {dish.isReadyToday && (
                      <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        جاهز اليوم
                      </div>
                    )}
                    {/* عدّاد السلة فوق الصورة */}
                    {inCartQty > 0 && (
                      <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {inCartQty} في السلة
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-2xl font-bold text-dark mb-2">{dish.name}</h3>
                    {dish.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{dish.description}</p>
                    )}

                    <div className="flex justify-between items-center mb-4">
                      {dish.price && (
                        <span className="text-2xl font-bold text-primary">{dish.price} دج</span>
                      )}
                      {dish.availableQuantity > 0 && dish.availableQuantity <= 5 && (
                        <span className="text-sm text-red-600 font-semibold">
                          ⏳ باقي {dish.availableQuantity} فقط
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(dish)}
                      className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                        justAdded
                          ? 'bg-green-600 text-white scale-95'
                          : inCartQty > 0
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-primary text-white hover:bg-orange-600'
                      }`}
                    >
                      {justAdded ? (
                        <>
                          <Check className="w-5 h-5" />
                          تمت الإضافة!
                        </>
                      ) : inCartQty > 0 ? (
                        <>
                          <Plus className="w-5 h-5" />
                          أضف المزيد ({inCartQty})
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          أضف للسلة
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* شريط السلة الثابت في الأسفل */}
      {cookCartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-200 shadow-2xl z-30">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                {cookCartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div>
                <p className="font-bold text-gray-800">
                  {cookCartItems.reduce((sum, item) => sum + item.quantity, 0)} أطباق في السلة
                </p>
                <p className="text-sm text-orange-600 font-bold">
                  {cookCartTotal.toLocaleString('ar-DZ')} دج
                </p>
              </div>
            </div>
            <Link
              to="/cart"
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition flex items-center gap-2 shadow-md"
            >
              <ShoppingCart className="w-5 h-5" />
              عرض السلة
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default CookProfile;