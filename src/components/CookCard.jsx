import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Flame,
  Zap,
  Star,
  Package,
  Sparkles,
  MapPin,
  ArrowLeft,
  Utensils,
  Heart,
} from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { isInSchedule } from '../utils/schedule';

function CookCard({ cook }) {
  const { isFavorite, toggle } = useFavorites();
  // حساب Badges تلقائياً
  const getBadges = () => {
    const badges = [];

    // 🆕 جديدة (أقل من 30 يوم وأقل من 5 طلبات)
    if (cook.createdAt?.seconds) {
      const daysSinceCreated =
        (Date.now() / 1000 - cook.createdAt.seconds) / (60 * 60 * 24);
      if (daysSinceCreated < 30 && (cook.totalOrders || 0) < 5) {
        badges.push({
          label: 'جديدة',
          icon: Sparkles,
          color: 'bg-violet-50 text-violet-700 border-violet-200',
        });
      }
    }

    // 🔥 الأكثر طلباً
    if ((cook.totalOrders || 0) >= 20) {
      badges.push({
        label: 'الأكثر طلباً',
        icon: Flame,
        color: 'bg-red-50 text-red-700 border-red-200',
      });
    }

    // ⭐ موثوقة
    if ((cook.averageRating || 0) >= 4 && (cook.totalRatings || 0) >= 3) {
      badges.push({
        label: 'موثوقة',
        icon: CheckCircle,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      });
    }

    return badges;
  };

  const badges = getBadges();
  const rating = cook.averageRating || 0;
  const totalRatings = cook.totalRatings || 0;
  const totalOrders = cook.totalOrders || 0;
  const isAvailable = cook.availableDishesCount > 0;
  const cookImage = cook.photo || cook.image || '';
  const favorited = isFavorite(cook.id);
  const scheduleStatus = isInSchedule(cook.schedule); // true=open, false=closed, null=no schedule
  const closedBySchedule = scheduleStatus === false;

  return (
    <div className="relative group h-full">
      <Link
        to={`/cooks/${cook.id}`}
        className="block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98] transition-all duration-300 h-full"
      >
      {/* ============================================ */}
      {/* قسم الصورة */}
      {/* ============================================ */}
      <div className="relative h-36 overflow-hidden">
        {cookImage ? (
          <img
            src={cookImage}
            alt={cook.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-200 via-amber-200 to-orange-300 flex items-center justify-center">
            <span className="text-7xl drop-shadow-sm">👩‍🍳</span>
          </div>
        )}

        {/* تدرج سفلي لقراءة النص */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* شارة متاحة / مغلقة — أسفل زر القلب */}
        {closedBySchedule ? (
          <div className="absolute top-12 right-3 flex items-center gap-1 bg-stone-700/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
            🕐 مغلقة الآن
          </div>
        ) : isAvailable ? (
          <div className="absolute top-12 right-3 flex items-center gap-1.5 bg-green-500 text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg shadow-green-500/40">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            متاحة
          </div>
        ) : null}

        {/* التقييم (أعلى يسار) */}
        {totalRatings > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full text-xs font-black shadow-md">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-stone-800">{rating.toFixed(1)}</span>
            {totalRatings > 0 && (
              <span className="text-stone-400 font-semibold text-[10px]">
                ({totalRatings})
              </span>
            )}
          </div>
        )}

        {/* الاسم والموقع (أسفل الصورة) */}
        <div className="absolute bottom-3 right-3 left-3">
          <h3 className="text-white font-extrabold text-lg leading-tight drop-shadow-md line-clamp-1">
            {cook.name}
          </h3>
          {cook.neighborhood && (
            <p className="text-white/90 text-xs font-medium flex items-center gap-1 mt-0.5 drop-shadow">
              <MapPin className="w-3 h-3" strokeWidth={2.5} />
              <span className="line-clamp-1">{cook.neighborhood}</span>
            </p>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* قسم المحتوى */}
      {/* ============================================ */}
      <div className="p-4 flex flex-col gap-3">
        {/* الوصف */}
        {(cook.bio || cook.description) && (
          <p className="text-stone-600 text-xs leading-relaxed line-clamp-2">
            {cook.bio || cook.description}
          </p>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                >
                  <Icon className="w-2.5 h-2.5" strokeWidth={2.5} />
                  {badge.label}
                </span>
              );
            })}
          </div>
        )}

        {/* نوع الأكل */}
        {cook.cuisineType && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <Utensils className="w-3 h-3 text-orange-500" strokeWidth={2.4} />
            <span className="font-semibold text-stone-600">
              {cook.cuisineType}
            </span>
          </div>
        )}

        {/* شريط الإحصائيات */}
        <div className="flex items-center gap-2 pt-1">
          {isAvailable && (
            <div className="flex-1 flex items-center gap-1.5 bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-green-600 fill-green-600" strokeWidth={2.3} />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-green-700 font-semibold">متاح</span>
                <span className="text-xs font-black text-green-700">
                  {cook.availableDishesCount} طبق
                </span>
              </div>
            </div>
          )}

          {totalOrders > 0 && (
            <div className="flex-1 flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-2.5 py-1.5 rounded-xl">
              <Package className="w-3.5 h-3.5 text-orange-600" strokeWidth={2.4} />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-orange-700 font-semibold">طلبات</span>
                <span className="text-xs font-black text-orange-700">
                  +{totalOrders}
                </span>
              </div>
            </div>
          )}

          {/* إذا لم يكن هناك طلبات ولا متاح — اعرض دعوة للاكتشاف */}
          {!isAvailable && totalOrders === 0 && (
            <div className="flex-1 flex items-center gap-1.5 bg-stone-50 border border-stone-100 px-2.5 py-1.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-stone-500" strokeWidth={2.4} />
              <span className="text-[11px] font-bold text-stone-600">
                طباخة جديدة
              </span>
            </div>
          )}
        </div>

        {/* زر CTA */}
        <div
          className={`flex items-center justify-between gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
            isAvailable && !closedBySchedule
              ? 'bg-gradient-to-l from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 group-hover:shadow-xl group-hover:shadow-orange-500/40'
              : 'bg-stone-100 text-stone-700 group-hover:bg-orange-50 group-hover:text-orange-700'
          }`}
        >
          <span>{isAvailable && !closedBySchedule ? 'اطلب الآن' : 'عرض الملف'}</span>
          <ArrowLeft
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            strokeWidth={2.6}
          />
        </div>
      </div>
      </Link>

      {/* زر القلب — أعلى يمين، خارج الـLink لتجنب التنقل عند الضغط */}
      <button
        onClick={() => toggle(cook.id)}
        aria-label={favorited ? 'إزالة من المفضّلة' : 'إضافة للمفضّلة'}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
          favorited
            ? 'bg-red-500 text-white shadow-red-400/50'
            : 'bg-white/90 backdrop-blur-sm text-stone-400 hover:text-red-400'
        }`}
      >
        <Heart
          className="w-4 h-4"
          strokeWidth={2.3}
          fill={favorited ? 'currentColor' : 'none'}
        />
      </button>
    </div>
  );
}

export default CookCard;