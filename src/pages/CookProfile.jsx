import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRight, MessageCircle, X, Flame } from 'lucide-react';
import { generateWhatsAppLink } from '../utils/whatsapp';

function CookProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cook, setCook] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState(null);

  // Order form state
  const [orderType, setOrderType] = useState('instant');
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // جلب الطباخة
      const cookDoc = await getDoc(doc(db, 'cooks', id));
      if (cookDoc.exists()) {
        setCook({ id: cookDoc.id, ...cookDoc.data() });
      }

      // جلب أطباقها
      const q = query(collection(db, 'dishes'), where('cookId', '==', id));
      const snapshot = await getDocs(q);
      const dishesData = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.isActive !== false);
      setDishes(dishesData);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleConfirmOrder = () => {
    const link = generateWhatsAppLink(cook, selectedDish, {
      type: orderType,
      quantity,
      date,
      time,
      notes,
    });
    window.open(link, '_blank');
    navigate('/order-success');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!cook) return <div className="min-h-screen flex items-center justify-center">الطباخة غير موجودة</div>;

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header مع صورة الطباخة */}
      <div className="relative h-72 bg-gradient-to-b from-primary to-orange-700">
        <img src={cook.image} alt={cook.name} className="w-full h-full object-cover opacity-60" />
        <Link to="/cooks" className="absolute top-4 right-4 bg-white/90 p-2 rounded-full">
          <ArrowRight className="w-5 h-5 text-dark" />
        </Link>
        <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
          <h1 className="text-4xl font-bold mb-2">{cook.name}</h1>
          <p className="text-white/90">{cook.description}</p>
        </div>
      </div>

      {/* قائمة الأطباق */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-dark mb-6">الأطباق المتوفرة</h2>

        {dishes.length === 0 ? (
          <p className="text-center text-gray-500 py-10">لا توجد أطباق متاحة حالياً</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {dishes.map(dish => (
              <div key={dish.id} className="bg-white rounded-2xl overflow-hidden shadow-md">
                <div className="relative">
                  <img src={dish.image} alt={dish.name} className="w-full h-56 object-cover" />
                  {dish.isReadyToday && (
                    <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      جاهز اليوم
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-2xl font-bold text-dark mb-2">{dish.name}</h3>
                  <p className="text-gray-600 mb-3">{dish.description}</p>

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
                    onClick={() => setSelectedDish(dish)}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    اطلب الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal الطلب */}
      {selectedDish && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-dark">اطلب: {selectedDish.name}</h3>
                <button onClick={() => setSelectedDish(null)} className="text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* نوع الطلب */}
              <div className="mb-4">
                <label className="block font-semibold mb-2">نوع الطلب:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderType('instant')}
                    className={`py-3 rounded-xl font-semibold ${
                      orderType === 'instant' ? 'bg-primary text-white' : 'bg-gray-100'
                    }`}
                  >
                    فوري
                  </button>
                  <button
                    onClick={() => setOrderType('scheduled')}
                    className={`py-3 rounded-xl font-semibold ${
                      orderType === 'scheduled' ? 'bg-primary text-white' : 'bg-gray-100'
                    }`}
                  >
                    مسبق
                  </button>
                </div>
              </div>

              {/* الكمية */}
              <div className="mb-4">
                <label className="block font-semibold mb-2">الكمية:</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                />
              </div>

              {/* التاريخ والوقت للطلب المسبق */}
              {orderType === 'scheduled' && (
                <>
                  <div className="mb-4">
                    <label className="block font-semibold mb-2">التاريخ:</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block font-semibold mb-2">الوقت:</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                    />
                  </div>
                </>
              )}

              {/* ملاحظات */}
              <div className="mb-6">
                <label className="block font-semibold mb-2">ملاحظات (اختياري):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                  placeholder="مثال: بدون فلفل حار..."
                />
              </div>

              <button
                onClick={handleConfirmOrder}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-6 h-6" />
                تأكيد الطلب عبر واتساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CookProfile;