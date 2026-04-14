import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRight, ShoppingBag, X, Flame } from 'lucide-react';

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
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // جلب الطباخة
      const cookDoc = await getDoc(doc(db, 'cooks', id));
      if (cookDoc.exists()) {
        setCook({ id: cookDoc.id, ...cookDoc.data() });
      }

      // جلب أطباقها (المتوفرة فقط)
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

  // دالة مساعدة للحصول على صورة الطبق (photo أو image)
  const getDishImage = (dish) => {
    return dish?.photo || dish?.image || '';
  };

  // دالة مساعدة لصورة الطباخة
  const getCookImage = (cook) => {
    return cook?.photo || cook?.image || '';
  };

  // Validation: رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 0
  const validatePhone = (phone) => {
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const resetOrderForm = () => {
    setSelectedDish(null);
    setOrderType('instant');
    setQuantity(1);
    setDate('');
    setTime('');
    setNotes('');
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();

    // Validation
    if (!customerName.trim() || customerName.trim().length < 3) {
      alert('الرجاء إدخال اسم صحيح (3 أحرف على الأقل)');
      return;
    }

    if (!validatePhone(customerPhone)) {
      alert('رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 0\nمثال: 0549741892');
      return;
    }

    setSubmitting(true);
    try {
      // بناء كائن الطلب مع تجنّب القيم undefined
      const orderData = {
        customerName: customerName.trim(),
        customerPhone,
        cookId: cook.id,
        cookName: cook.name || '',
        dishId: selectedDish.id,
        dishName: selectedDish.name || '',
        dishImage: getDishImage(selectedDish),
        quantity: Number(quantity),
        orderType,
        scheduledDate: orderType === 'scheduled' ? date : '',
        scheduledTime: orderType === 'scheduled' ? time : '',
        notes: notes || '',
        totalPrice: (selectedDish.price || 0) * Number(quantity),
        price: selectedDish.price || 0,
        status: 'pending',
        // إضافة items للتوافق مع CookOrders
        items: [{
          dishId: selectedDish.id,
          name: selectedDish.name || '',
          price: selectedDish.price || 0,
          quantity: Number(quantity),
        }],
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      const phone = customerPhone;
      resetOrderForm();
      navigate(`/order-success?orderId=${orderRef.id}&phone=${phone}`);
    } catch (err) {
      alert('حدث خطأ، حاول مرة أخرى');
      console.error(err);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!cook) return <div className="min-h-screen flex items-center justify-center">الطباخة غير موجودة</div>;

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header مع صورة الطباخة */}
      <div className="relative h-72 bg-gradient-to-b from-primary to-orange-700">
        {getCookImage(cook) && (
          <img src={getCookImage(cook)} alt={cook.name} className="w-full h-full object-cover opacity-60" />
        )}
        <Link to="/cooks" className="absolute top-4 right-4 bg-white/90 p-2 rounded-full">
          <ArrowRight className="w-5 h-5 text-dark" />
        </Link>
        <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
          <h1 className="text-4xl font-bold mb-2">{cook.name}</h1>
          <p className="text-white/90">{cook.bio || cook.description || ''}</p>
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
                    <ShoppingBag className="w-5 h-5" />
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
                <button onClick={resetOrderForm} className="text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleConfirmOrder} className="space-y-3">
                {/* اسم الزبون */}
                <input
                  required
                  minLength="3"
                  placeholder="اسمك الكامل"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                />

                {/* رقم الهاتف مع validation */}
                <div>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="0[0-9]{9}"
                    maxLength="10"
                    placeholder="رقم الهاتف (0549741892)"
                    value={customerPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 10) {
                        setCustomerPhone(value);
                      }
                    }}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                  />
                  {customerPhone && customerPhone.length > 0 && customerPhone.length < 10 && (
                    <p className="text-xs text-orange-600 mt-1">
                      باقي {10 - customerPhone.length} أرقام
                    </p>
                  )}
                  {customerPhone && customerPhone.length === 10 && !validatePhone(customerPhone) && (
                    <p className="text-xs text-red-600 mt-1">
                      الرقم يجب أن يبدأ بـ 0
                    </p>
                  )}
                </div>

                {/* نوع الطلب */}
                <div>
                  <label className="block font-semibold mb-2">نوع الطلب:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('instant')}
                      className={`py-3 rounded-xl font-semibold ${
                        orderType === 'instant' ? 'bg-primary text-white' : 'bg-gray-100'
                      }`}
                    >
                      فوري
                    </button>
                    <button
                      type="button"
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
                <div>
                  <label className="block font-semibold mb-2">الكمية:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                  />
                </div>

                {/* التاريخ والوقت للطلب المسبق */}
                {orderType === 'scheduled' && (
                  <>
                    <div>
                      <label className="block font-semibold mb-2">التاريخ:</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">الوقت:</label>
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                      />
                    </div>
                  </>
                )}

                {/* ملاحظات */}
                <div>
                  <label className="block font-semibold mb-2">ملاحظات (اختياري):</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                    placeholder="مثال: بدون فلفل حار..."
                  />
                </div>

                {/* المجموع */}
                {selectedDish.price && (
                  <div className="bg-cream p-3 rounded-xl text-center">
                    <span className="text-gray-600">المجموع: </span>
                    <span className="text-2xl font-bold text-primary">
                      {selectedDish.price * quantity} دج
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-6 h-6" />
                  {submitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CookProfile;