import { Link } from 'react-router-dom';
import { CheckCircle, Flame, Zap, Star, Package, Sparkles } from 'lucide-react';

function CookCard({ cook }) {
  // حساب Badges تلقائياً
  const getBadges = () => {
    const badges = [];

    // 🆕 جديدة (أقل من 30 يوم)
    if (cook.createdAt?.seconds) {
      const daysSinceCreated = (Date.now() / 1000 - cook.createdAt.seconds) / (60 * 60 * 24);
      if (daysSinceCreated < 30 && (cook.totalOrders || 0) < 5) {
        badges.push({ label: 'جديدة', icon: Sparkles, color: 'bg-purple-100 text-purple-700' });
      }
    }

    // 🔥 الأكثر طلباً (أكثر من 20 طلب)
    if ((cook.totalOrders || 0) >= 20) {
      badges.push({ label: 'الأكثر طلباً', icon: Flame, color: 'bg-red-100 text-red-700' });
    }

    // ⭐ موثوقة (تقييم 4+)
    if ((cook.averageRating || 0) >= 4 && (cook.totalRatings || 0) >= 3) {
      badges.push({ label: 'موثوقة', icon: CheckCircle, color: 'bg-green-100 text-green-700' });
    }

    // ⚡ متاحة الآن
    if (cook.availableDishesCount > 0) {
      badges.push({ label: 'متاحة الآن', icon: Zap, color: 'bg-orange-100 text-orange-700' });
    }

    return badges;
  };

  const badges = getBadges();
  const rating = cook.averageRating || 0;
  const totalRatings = cook.totalRatings || 0;
  const totalOrders = cook.totalOrders || 0;

  // صورة الطباخة (تدعم photo أو image)
  const cookImage = cook.photo || cook.image || '';

  return (
    <Link to={`/cooks/${cook.id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1 h-full flex flex-col">
        {/* الصورة */}
        <div className="relative">
          {cookImage ? (
            <img
              src={cookImage}
              alt={cook.name}
              className="w-full h-56 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-7xl">
              👩‍🍳
            </div>
          )}

          {/* شارة "متاحة الآن" فوق الصورة */}
          {cook.availableDishesCount > 0 && (
            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              متاحة الآن
            </div>
          )}

          {/* التقييم فوق الصورة */}
          {totalRatings > 0 && (
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-md">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-gray-800">{rating.toFixed(1)}</span>
              <span className="text-gray-500 text-xs">({totalRatings})</span>
            </div>
          )}
        </div>

        {/* المحتوى */}
        <div className="p-5 flex-1 flex flex-col">
          {/* الاسم والحي */}
          <div className="mb-3">
            <h3 className="text-2xl font-bold text-dark mb-1">{cook.name}</h3>
            {cook.neighborhood && (
              <p className="text-sm text-gray-500">📍 {cook.neighborhood}</p>
            )}
          </div>

          {/* الوصف */}
          {(cook.bio || cook.description) && (
            <p className="text-gray-600 mb-3 text-sm line-clamp-2">
              {cook.bio || cook.description}
            </p>
          )}

          {/* الإحصائيات */}
          <div className="flex items-center gap-4 mb-3 text-sm">
            {totalOrders > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <Package className="w-4 h-4 text-orange-500" />
                <span className="font-bold">{totalOrders}+</span>
                <span className="text-gray-500">طلب</span>
              </div>
            )}
            {cook.availableDishesCount > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <span className="font-bold text-green-600">{cook.availableDishesCount}</span>
                <span className="text-gray-500">طبق متاح</span>
              </div>
            )}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {badges.map((badge, i) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {badge.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* نوع الأكل */}
          {cook.cuisineType && (
            <span className="inline-block bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold mt-auto w-fit">
              {cook.cuisineType}
            </span>
          )}

          {/* زر CTA */}
          <button className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition">
            عرض الأطباق
          </button>
        </div>
      </div>
    </Link>
  );
}

export default CookCard;