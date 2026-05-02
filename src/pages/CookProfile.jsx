import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ArrowRight,
  Plus,
  Check,
  Flame,
  ShoppingCart,
  Star,
  Package,
  Share2,
  ExternalLink,
  MapPin,
  Award,
  Sparkles,
  ChefHat,
  Minus,
  AlertCircle,
  Heart,
  Clock,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../hooks/useFavorites';
import { DAYS, isInSchedule } from '../utils/schedule';

const PREP_TIME_LABELS = {
  30: '30 دقيقة', 60: 'ساعة', 90: 'ساعة ونصف', 120: 'ساعتان',
  180: '3 ساعات', 240: '4 ساعات', 360: '6 ساعات', 480: '8 ساعات',
  720: '12 ساعة', 1440: '24 ساعة', 2880: 'يومان',
};
const formatPrepTime = (mins) =>
  PREP_TIME_LABELS[mins] || (mins < 60 ? `${mins} دقيقة` : `${Math.floor(mins / 60)} ساعات`);

const getUnitLabel = (unit) => {
  const labels = {
    plate: 'طبق',
    kg: 'كغ',
    box: 'علبة',
    piece: 'حبة',
    liter: 'لتر',
    dozen: 'دزينة',
  };
  return labels[unit] || 'وحدة';
};

const cookTypeLabels = {
  home_cook: { emoji: '👩‍🍳', label: 'طباخة حرة' },
  pastry: { emoji: '🍰', label: 'حلويات ومعجنات' },
  traditional: { emoji: '🍲', label: 'أكل تقليدي' },
  healthy: { emoji: '🥗', label: 'أكل صحي' },
};

function CookProfile() {
  const { id } = useParams();
  const [cook, setCook] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedDishId, setAddedDishId] = useState(null);
  const [toast, setToast] = useState(null);

  const { addToCart, cart } = useCart();
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

  useEffect(() => {
    const fetchData = async () => {
      const cookDoc = await getDoc(doc(db, 'cooks', id));
      if (cookDoc.exists()) {
        setCook({ id: cookDoc.id, ...cookDoc.data() });
      }
      const q = query(collection(db, 'dishes'), where('cookId', '==', id));
      const snapshot = await getDocs(q);
      const dishesData = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => d.available !== false && d.isActive !== false);
      setDishes(dishesData);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const getDishImage = (dish) => dish?.photo || dish?.image || '';
  const getCookImage = (cook) => cook?.photo || cook?.image || '';

  const getCartQuantity = (dishId) => {
    const item = cart.find((i) => i.dishId === dishId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (dish) => {
    if (isCookClosed) {
      showToast('error', 'الطباخة مغلقة حالياً — لا يمكن الطلب الآن');
      return;
    }
    addToCart(dish, cook);
    setAddedDishId(dish.id);
    showToast('success', `تمت إضافة ${dish.name} للسلة! 🎉`);
    setTimeout(() => setAddedDishId(null), 1500);
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `🍲 شوف أطباق ${cook.name} على نَكهة!\n${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    showToast('success', 'تم فتح واتساب للمشاركة! 📲');
  };

  const cookCartItems = cart.filter((item) => item.cookId === id);
  const cookCartCount = cookCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cookCartTotal = cookCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-24">
        <div className="h-80 animate-shimmer" />
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
          <div className="h-8 w-2/3 animate-shimmer rounded-lg" />
          <div className="h-4 w-1/2 animate-shimmer rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm">
                <div className="h-44 animate-shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-5 animate-shimmer rounded-md" />
                  <div className="h-3 w-2/3 animate-shimmer rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cook) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#FFF5E6] px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-extrabold text-stone-800 mb-2">الطباخة غير موجودة</h2>
          <p className="text-stone-500 mb-5 text-sm">قد تكون محذوفة أو الرابط غير صحيح</p>
          <Link
            to="/cooks"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold active:scale-95 transition shadow-lg shadow-orange-500/30"
          >
            <ArrowRight className="w-4 h-4" />
            تصفح الطباخات
          </Link>
        </div>
      </div>
    );
  }

  const cookType = cookTypeLabels[cook.cookType];
  const hasAvailableDishes = dishes.some((d) => d.isReadyToday || d.available);
  const scheduleStatus = isInSchedule(cook.schedule);
  const isCookClosed = cook.isAcceptingOrders === false || scheduleStatus === false;

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6]" style={{ paddingBottom: cookCartItems.length > 0 ? '160px' : '96px' }}>
      {/* ============================================ */}
      {/* Hero Header - صورة كبيرة مع معلومات */}
      {/* ============================================ */}
      <div className="relative">
        {/* الصورة الخلفية */}
        <div className="relative h-80 md:h-96 overflow-hidden">
          {getCookImage(cook) ? (
            <img
              src={getCookImage(cook)}
              alt={cook.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 flex items-center justify-center">
              <span className="text-9xl">👩‍🍳</span>
            </div>
          )}

          {/* تدرج متراكب */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-stone-900/20" />

          {/* أزرار علوية ثابتة */}
          <div className="absolute top-0 right-0 left-0 p-4 pt-safe flex items-center justify-between z-10">
            <Link
              to="/cooks"
              className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5 text-stone-800" strokeWidth={2.3} />
            </Link>

            <div className="flex items-center gap-2">
              {/* زر المفضّلة */}
              {cook && (
                <button
                  onClick={() => toggleFavorite(cook.id)}
                  aria-label={isFavorite(cook?.id) ? 'إزالة من المفضّلة' : 'إضافة للمفضّلة'}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all ${
                    isFavorite(cook?.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/95 backdrop-blur-md text-stone-500'
                  }`}
                >
                  <Heart
                    className="w-5 h-5"
                    strokeWidth={2.3}
                    fill={isFavorite(cook?.id) ? 'currentColor' : 'none'}
                  />
                </button>
              )}

              {/* زر المشاركة */}
              <button
                onClick={handleShare}
                className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="مشاركة"
              >
                <Share2 className="w-5 h-5 text-green-600" strokeWidth={2.3} />
              </button>
            </div>
          </div>

          {/* معلومات الطباخة على الصورة */}
          <div className="absolute bottom-0 right-0 left-0 p-5 text-white">
            {/* شارة العضو المؤسسة */}
            {cook.isFoundingMember && (
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-[11px] font-black shadow-lg mb-2">
                <Award className="w-3 h-3" strokeWidth={2.5} />
                عضو مؤسس #{cook.foundingMemberNumber}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-black leading-tight drop-shadow-lg">
              {cook.name}
            </h1>

            {cook.neighborhood && (
              <p className="flex items-center gap-1.5 text-white/90 text-sm mt-2 drop-shadow">
                <MapPin className="w-4 h-4" strokeWidth={2.4} />
                <span className="font-semibold">{cook.neighborhood}</span>
              </p>
            )}
          </div>
        </div>

        {/* بطاقة المعلومات (طافية فوق الصورة) */}
        <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl shadow-orange-200/40 p-4 md:p-5 animate-slide-up">
            {/* السطر العلوي: نوع الطباخة + الإحصائيات */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {cookType && (
                <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                  <span>{cookType.emoji}</span>
                  {cookType.label}
                </span>
              )}
              {hasAvailableDishes && (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  تطبخ الآن
                </span>
              )}
            </div>

            {/* الوصف */}
            {(cook.bio || cook.description) && (
              <p className="text-stone-600 text-sm leading-relaxed mb-4">
                {cook.bio || cook.description}
              </p>
            )}

            {/* الإحصائيات - 3 بطاقات */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <StatPill
                icon={Star}
                iconClass="text-amber-500 fill-amber-500"
                value={cook.totalRatings > 0 ? cook.averageRating?.toFixed(1) : '—'}
                label={cook.totalRatings > 0 ? `${cook.totalRatings} تقييم` : 'لا تقييمات'}
                color="amber"
              />
              <StatPill
                icon={Package}
                value={cook.totalOrders > 0 ? `+${cook.totalOrders}` : '—'}
                label="طلب مكتمل"
                color="orange"
              />
              <StatPill
                icon={ChefHat}
                value={dishes.length}
                label="طبق متاح"
                color="green"
              />
            </div>

            {/* التخصصات */}
            {cook.specialties && cook.specialties.length > 0 && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-xs font-bold text-stone-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  التخصصات
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cook.specialties.map((s) => (
                    <span
                      key={s}
                      className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* رابط خارجي */}
            {cook.socialLink && (
              <a
                href={cook.socialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-3 bg-gradient-to-l from-stone-100 to-stone-50 hover:from-orange-100 hover:to-orange-50 text-stone-700 hover:text-orange-700 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4" strokeWidth={2.4} />
                زيارة صفحتها الشخصية
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ساعات العمل */}
      {/* ============================================ */}
      {cook.schedule && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <ScheduleWidget schedule={cook.schedule} />
        </div>
      )}

      {/* ============================================ */}
      {/* عنوان الأطباق */}
      {/* ============================================ */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ChefHat className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-stone-800 leading-none">
                قائمة الأطباق
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {dishes.length} {dishes.length === 1 ? 'طبق' : 'أطباق'} متاحة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* الأطباق */}
      {/* ============================================ */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {isCookClosed && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-2xl">🔴</span>
            <div>
              <p className="text-sm font-extrabold text-red-700">الطباخة مغلقة حالياً</p>
              <p className="text-xs text-red-500 mt-0.5">لا يمكن إضافة أطباق للسلة في الوقت الحالي</p>
            </div>
          </div>
        )}

        {dishes.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">🍽️</div>
            <h3 className="font-extrabold text-stone-800 mb-1">لا توجد أطباق متاحة</h3>
            <p className="text-sm text-stone-500">ستضيف الطباخة أطباقها قريباً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dishes.map((dish, idx) => (
              <DishCard
                key={dish.id}
                dish={dish}
                idx={idx}
                inCartQty={getCartQuantity(dish.id)}
                justAdded={addedDishId === dish.id}
                onAdd={() => handleAddToCart(dish)}
                getDishImage={getDishImage}
                cookClosed={isCookClosed}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* شريط السلة السفلي */}
      {/* ============================================ */}
      {cookCartItems.length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-20 px-3 pb-3 md:pb-4 animate-slide-up">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/cart"
              className="flex items-center justify-between bg-gradient-to-l from-orange-500 to-orange-600 text-white rounded-2xl p-3 shadow-2xl shadow-orange-500/40 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" strokeWidth={2.3} />
                  <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 bg-white text-orange-600 text-[11px] font-black rounded-full flex items-center justify-center ring-2 ring-orange-500">
                    {cookCartCount}
                  </span>
                </div>
                <div>
                  <p className="text-xs opacity-90 font-semibold leading-none">
                    في سلتك من {cook.name}
                  </p>
                  <p className="text-lg font-black leading-tight mt-0.5">
                    {cookCartTotal.toLocaleString('ar-DZ')} دج
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white text-orange-600 px-4 py-2.5 rounded-xl text-sm font-extrabold shadow-lg">
                عرض السلة
                <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={2.8} />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Toast Notification */}
      {/* ============================================ */}
      {toast && (
        <div className="fixed top-20 right-4 left-4 md:left-auto md:max-w-sm z-50 animate-slide-up">
          <div
            className={`flex items-center gap-3 bg-white border-r-4 rounded-2xl shadow-2xl p-4 ${
              toast.type === 'success' ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" strokeWidth={2.5} />
              )}
            </div>
            <p className="text-sm font-bold text-stone-800 flex-1">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================ */
/* بطاقة إحصائية */
/* ============================================ */
function StatPill({ icon: Icon, iconClass, value, label, color }) {
  const colors = {
    amber: 'bg-amber-50',
    orange: 'bg-orange-50',
    green: 'bg-green-50',
  };
  return (
    <div className={`${colors[color]} rounded-2xl p-2.5 text-center`}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <Icon className={`w-4 h-4 ${iconClass || 'text-stone-600'}`} strokeWidth={2.4} />
        <span className="text-base font-black text-stone-800 leading-none">
          {value}
        </span>
      </div>
      <p className="text-[10px] font-semibold text-stone-500">{label}</p>
    </div>
  );
}

/* ============================================ */
/* بطاقة طبق */
/* ============================================ */
function DishCard({ dish, idx, inCartQty, justAdded, onAdd, getDishImage, cookClosed }) {
  const unitLabel = getUnitLabel(dish.unit || 'plate');
  const isLowStock = dish.availableQuantity > 0 && dish.availableQuantity <= 5;

  return (
    <div
      style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
      className="animate-slide-up bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
    >
      {/* الصورة */}
      <div className="relative h-44 overflow-hidden">
        {getDishImage(dish) ? (
          <img
            src={getDishImage(dish)}
            alt={dish.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 via-amber-100 to-orange-200 flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        {/* شارات فوق الصورة */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {dish.readyNow && (
            <div className="bg-green-500 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-lg">
              ⚡ متاح فوراً
            </div>
          )}
          {!dish.readyNow && dish.isReadyToday && (
            <div className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-lg">
              <Flame className="w-3 h-3" strokeWidth={2.5} />
              جاهز اليوم
            </div>
          )}
          {isLowStock && (
            <div className="bg-red-500 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-lg">
              ⏳ باقي {dish.availableQuantity}
            </div>
          )}
        </div>

        {/* شارة مدة التحضير — أسفل الصورة */}
        {dish.prepTime > 0 && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1 bg-stone-900/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg">
              <Clock className="w-3 h-3" strokeWidth={2.5} />
              {formatPrepTime(dish.prepTime)}
            </div>
          </div>
        )}

        {/* شارة الكمية في السلة */}
        {inCartQty > 0 && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg animate-scale-in">
            <Check className="w-3 h-3" strokeWidth={3} />
            {inCartQty} في السلة
          </div>
        )}
      </div>

      {/* محتوى البطاقة */}
      <div className="p-4">
        <h3 className="text-lg font-extrabold text-stone-800 leading-tight mb-1">
          {dish.name}
        </h3>

        {dish.description && (
          <p className="text-stone-500 text-xs leading-relaxed line-clamp-2 mb-2">
            {dish.description}
          </p>
        )}

        {/* شارة مدة التحضير */}
        {dish.prepTime > 0 && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-extrabold">
              <Clock className="w-3 h-3 text-amber-600" strokeWidth={2.5} />
              يجهّز في {formatPrepTime(dish.prepTime)}
            </span>
          </div>
        )}

        {/* السعر + زر الإضافة */}
        <div className="flex items-end justify-between gap-3 pt-2 border-t border-stone-100">
          <div>
            <p className="text-[10px] text-stone-500 font-semibold leading-none mb-1">
              السعر
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-orange-600 leading-none">
                {dish.price}
              </span>
              <span className="text-xs text-stone-500 font-semibold">
                دج / {unitLabel}
              </span>
            </div>
          </div>

          <button
            onClick={onAdd}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-90 shadow-lg ${
              cookClosed
                ? 'bg-stone-200 text-stone-400 shadow-none cursor-not-allowed'
                : justAdded
                ? 'bg-green-500 text-white shadow-green-500/40 scale-95'
                : inCartQty > 0
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                : 'bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/30'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" strokeWidth={3} />
                تمت!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" strokeWidth={3} />
                {inCartQty > 0 ? `+1 (${inCartQty})` : 'أضف'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================ */
/* جدول ساعات العمل */
/* ============================================ */
function ScheduleWidget({ schedule }) {
  const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = DAY_KEYS[new Date().getDay()];
  const scheduleStatus = isInSchedule(schedule);

  return (
    <div className="bg-white rounded-3xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
          <h3 className="text-sm font-extrabold text-stone-800">ساعات العمل</h3>
        </div>
        <span
          className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
            scheduleStatus === true
              ? 'bg-green-100 text-green-700'
              : scheduleStatus === false
              ? 'bg-red-100 text-red-700'
              : 'bg-stone-100 text-stone-600'
          }`}
        >
          {scheduleStatus === true ? '🟢 مفتوحة الآن' : scheduleStatus === false ? '🔴 مغلقة الآن' : ''}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(({ key, label }) => {
          const day = schedule[key];
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`flex flex-col items-center rounded-xl py-2 px-1 text-center ${
                isToday
                  ? 'bg-orange-500 text-white'
                  : day?.enabled
                  ? 'bg-orange-50 text-orange-800'
                  : 'bg-stone-50 text-stone-400'
              }`}
            >
              <span className="text-[10px] font-extrabold truncate w-full text-center">
                {label.slice(0, 3)}
              </span>
              {day?.enabled ? (
                <div className="mt-1 space-y-0.5">
                  <p className={`text-[9px] font-bold leading-none ${isToday ? 'text-white/90' : 'text-orange-700'}`}>
                    {day.from}
                  </p>
                  <p className={`text-[9px] font-bold leading-none ${isToday ? 'text-white/90' : 'text-orange-700'}`}>
                    {day.to}
                  </p>
                </div>
              ) : (
                <span className="text-[9px] mt-1 font-bold">مغلق</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CookProfile;