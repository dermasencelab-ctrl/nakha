import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ShoppingBag, ArrowRight, User, Phone, MapPin, MessageSquare, Calendar } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, cookGroups, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderType, setOrderType] = useState('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // التحقق من رقم الهاتف
  const validatePhone = (phone) => /^0[0-9]{9}$/.test(phone);

  // إذا السلة فاضية، رجّعه للسلة
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-gray-600 mb-4">سلتك فارغة</p>
          <Link
            to="/cooks"
            className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 inline-block"
          >
            تصفّح الطباخات
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (customerName.trim().length < 3) {
      setError('يرجى إدخال اسم صحيح (3 أحرف على الأقل)');
      return;
    }

    if (!validatePhone(customerPhone)) {
      setError('رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 0');
      return;
    }

    if (orderType === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      setError('يرجى تحديد التاريخ والوقت للطلب المسبق');
      return;
    }

    setSubmitting(true);
    try {
      // إنشاء طلب منفصل لكل طباخة
      const orderPromises = cookGroups.map((group) => {
        const orderData = {
          // معلومات الزبون
          customerName: customerName.trim(),
          customerPhone,
          customerAddress: customerAddress.trim() || '',

          // معلومات الطباخة
          cookId: group.cookId,
          cookName: group.cookName,

          // الأطباق
          items: group.items.map((item) => ({
            dishId: item.dishId,
            name: item.dishName,
            price: item.price,
            quantity: item.quantity,
            image: item.dishImage || '',
          })),

          // للتوافق مع الطلبات القديمة (طبق واحد رئيسي)
          dishId: group.items[0].dishId,
          dishName: group.items.length === 1
            ? group.items[0].dishName
            : `${group.items[0].dishName} و ${group.items.length - 1} أطباق أخرى`,
          dishImage: group.items[0].dishImage || '',
          quantity: group.items.reduce((sum, item) => sum + item.quantity, 0),

          // المجموع
          totalPrice: group.subtotal,

          // نوع الطلب
          orderType,
          scheduledDate: orderType === 'scheduled' ? scheduledDate : '',
          scheduledTime: orderType === 'scheduled' ? scheduledTime : '',

          // ملاحظات
          notes: notes.trim() || '',

          // الحالة
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        return addDoc(collection(db, 'orders'), orderData);
      });

      const results = await Promise.all(orderPromises);
      const orderIds = results.map((r) => r.id);

      // مسح السلة
      const phone = customerPhone;
      clearCart();

      // التوجيه لصفحة النجاح مع كل أرقام الطلبات
      navigate(`/order-success?orderId=${orderIds.join(',')}&phone=${phone}`);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* ترويسة */}
        <div className="mb-6">
          <Link
            to="/cart"
            className="text-orange-600 text-sm hover:underline mb-2 inline-flex items-center gap-1"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للسلة
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">إكمال الطلب 📦</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* النموذج */}
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">معلومات التوصيل</h2>

              {/* الاسم */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2 font-medium">
                  <User className="w-4 h-4 text-orange-600" />
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  minLength="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="مثلاً: أحمد محمد"
                />
              </div>

              {/* الهاتف */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2 font-medium">
                  <Phone className="w-4 h-4 text-orange-600" />
                  رقم الهاتف (واتساب) *
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 10) setCustomerPhone(val);
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0549741892"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">10 أرقام، يبدأ بـ 0</p>
              </div>

              {/* العنوان */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2 font-medium">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  عنوان التوصيل (اختياري)
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="مثلاً: حي الفرح، شارع 5"
                />
              </div>

              {/* نوع الطلب */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2 font-medium">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  نوع الطلب *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('instant')}
                    className={`py-3 rounded-xl font-bold transition ${
                      orderType === 'instant'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ⚡ فوري
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('scheduled')}
                    className={`py-3 rounded-xl font-bold transition ${
                      orderType === 'scheduled'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📅 مسبق
                  </button>
                </div>
              </div>

              {/* تاريخ ووقت للطلب المسبق */}
              {orderType === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">التاريخ</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">الوقت</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* ملاحظات */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 mb-2 font-medium">
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="أي ملاحظات للطباخات؟ (مثلاً: بدون فلفل حار...)"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  'جاري إرسال الطلبات...'
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    تأكيد الطلب ({totalPrice.toLocaleString('ar-DZ')} دج)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ملخص الطلب */}
          <div>
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">ملخص الطلب 📋</h3>

              {/* مجموعات الطباخات */}
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {cookGroups.map((group) => (
                  <div key={group.cookId} className="border-b border-gray-100 pb-3 last:border-0">
                    <p className="font-bold text-orange-600 text-sm mb-2">
                      👩‍🍳 {group.cookName}
                    </p>
                    {group.items.map((item) => (
                      <div key={item.dishId} className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {item.dishName} × {item.quantity}
                        </span>
                        <span className="font-medium">{item.price * item.quantity} دج</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      <span>مجموع فرعي:</span>
                      <span className="font-bold">{group.subtotal} دج</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* المجموع الكلي */}
              <div className="border-t-2 border-orange-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">المجموع الكلي:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {totalPrice.toLocaleString('ar-DZ')} دج
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  📤 سيتم إرسال {cookGroups.length}{' '}
                  {cookGroups.length === 1 ? 'طلب' : 'طلبات'} منفصلة للطباخات
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;