import { Link } from 'react-router-dom';
import { CheckCircle, Flame, Zap } from 'lucide-react';

const badgeIcons = {
  'موثوقة': <CheckCircle className="w-4 h-4" />,
  'الأكثر طلباً': <Flame className="w-4 h-4" />,
  'سريعة': <Zap className="w-4 h-4" />,
};

const badgeColors = {
  'موثوقة': 'bg-green-100 text-green-700',
  'الأكثر طلباً': 'bg-red-100 text-red-700',
  'سريعة': 'bg-blue-100 text-blue-700',
};

function CookCard({ cook }) {
  return (
    <Link to={`/cooks/${cook.id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
        <div className="relative">
          <img src={cook.image} alt={cook.name} className="w-full h-56 object-cover" />
          {cook.isReadyToday && (
            <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <Flame className="w-4 h-4" />
              متوفر اليوم
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-2xl font-bold text-dark mb-2">{cook.name}</h3>
          <p className="text-gray-600 mb-3 text-sm">{cook.description}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {cook.badges?.map((badge, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badgeColors[badge] || 'bg-gray-100 text-gray-700'}`}
              >
                {badgeIcons[badge]}
                {badge}
              </span>
            ))}
          </div>

          <span className="inline-block bg-secondary text-dark px-3 py-1 rounded-full text-sm font-semibold">
            {cook.cuisineType}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default CookCard;
