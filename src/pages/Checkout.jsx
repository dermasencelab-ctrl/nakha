import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ShoppingBag, ArrowRight, ArrowLeft, User, Phone, MapPin,
  MessageSquare, Calendar, Zap, Check, AlertCircle, Package,
  ChevronLeft, Clock, Loader2,
} from 'lucide-react';

const getUnitLabel = (unit) => {
  const labels = { plate: 'طبق', kg: 'كغ', box: 'علبة', piece: 'حبة', liter: 'لتر', dozen: 'دزينة' };
  return labels[unit] || '';
};

const PREP_LABELS = {
  30: '30 دقيقة', 60: 'ساعة', 90: 'ساعة ونصف', 120: 'ساعتان',
  180: '3 ساعات', 240: '4 ساعات', 360: '6 ساعات', 480: '8 ساعات',
  720: '12 ساعة', 1440: '24 ساعة', 2880: 'يومان',
};
const formatPrepTime = (mins) =>
  PREP_LABELS[mins] || (mins < 60 ? `${mins} دقيقة` : `${Math.floor(mins / 60)} ساعات`);

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
  const [requestedPickupTime, setRequestedPickupTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Compute the minimum allowed pickup based on the longest prep time in the cart
  const maxPrepMinutes = Math.max(...cart.map((item) => item.prepTime || 0), 30);
  const minPickupDate = new Date(Date.now() + maxPrepMinutes * 60 * 1000);
  const minPickupISO = minPickupDate.toISOString().slice(0, 16);

  const validatePhone = (phone) => /^0[0-9]{9}$/.test(phone);

  if (cart.length === 0) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#FFF5E6] flex items-center justify-center px-4 pb-24 md:pb-8">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-orange-500" strokeWidth={1.8} />
          </div>
          <h2 className="text-xl font-extrabold text-stone-800 mb-2">السلة فارغة</h2>
          <p className="text-sm text-stone-500 mb-6">أضف أطباقاً إلى السلة قبل إكمال الطلب</p>
          <Link to="/cooks" className="inline-flex items-center gap-2 bg-gradient-to-l from-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition">
            تصفّح الطباخات
          </Link>
        </div>
      </div>
    );
  }

  const validateStep = (step) => {
    setError('');
    if (step === 1) {
      if (customerName.trim().length < 3) { setError('يرجى إدخال اسم صحيح (3 أحرف على الأقل)'); return false; }
      if (!validatePhone(customerPhone)) { setError('رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 0'); return false; }
    }
    if (step === 2) {
      if (!requestedPickupTime) { setError('يرجى تحديد وقت الاستلام المطلوب'); return false; }
      const pickupMs = new Date(requestedPickupTime).getTime();
      const minMs = Date.now() + maxPrepMinutes * 60 * 1000 - 60_000;
      if (pickupMs < minMs) {
        setError(`وقت الاستلام يجب أن يكون بعد ${formatPrepTime(maxPrepMinutes)} على الأقل من الآن`);
        return false;
      }
      if (orderType === 'scheduled' && (!scheduledDate || !scheduledTime)) { setError('يرجى تحديد التاريخ والوقت للطلب المسبق'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateStep(1) || !validateStep(2)) return;
    setSubmitting(true);
    try {
      const orderPromises = cookGroups.map((group) => {
        const orderData = {
          customerName: customerName.trim(),
          customerPhone,
          customerAddress: customerAddress.trim() || '',
          cookId: group.cookId,
          cookName: group.cookName,
          items: group.items.map((item) => ({
            dishId: item.dishId, name: item.dishName, price: item.price,
            quantity: item.quantity, unit: item.unit || 'plate', image: item.dishImage || '',
          })),
          dishId: group.items[0].dishId,
          dishName: group.items.length === 1 ? group.items[0].dishName : `${group.items[0].dishName} و ${group.items.length - 1} أطباق أخرى`,
          dishImage: group.items[0].dishImage || '',
          quantity: group.items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: group.subtotal,
          orderType,
          scheduledDate: orderType === 'scheduled' ? scheduledDate : '',
          scheduledTime: orderType === 'scheduled' ? scheduledTime : '',
          requestedPickupTime,
          notes: notes.trim() || '',
          status: 'pending',
          createdAt: serverTimestamp(),
        };
        return addDoc(collection(db, 'orders'), orderData);
      });
      const results = await Promise.all(orderPromises);
      const orderIds = results.map((r) => r.id);

      // WhatsApp notifications to each cook
      for (let i = 0; i < cookGroups.length; i++) {
        const group = cookGroups[i];
        const orderId = orderIds[i];
        try {
          const cookSnap = await getDoc(doc(db, 'cooks', group.cookId));
          if (cookSnap.exists()) {
            const cookPhone = cookSnap.data()?.phone;
            if (cookPhone) {
              const intlPhone = '213' + cookPhone.replace(/^0/, '');
              const code = '#' + orderId.slice(0, 8).toUpperCase();
              const itemsList = group.items
                .map((it) => `  • ${it.dishName} ×${it.quantity}`)
                .join('\n');
              const pickupLabel = requestedPickupTime
                ? new Date(requestedPickupTime).toLocaleString('ar-DZ', {
                    weekday: 'long', hour: '2-digit', minute: '2-digit',
                  })
                : 'أقرب وقت';
              const msg = [
                `🍽️ طلب جديد على نَكهة!`,
                ``,
                `📋 رمز الطلب: ${code}`,
                `👤 الزبون: ${customerName.trim()}`,
                `💰 المجموع: ${group.subtotal.toLocaleString('ar-DZ')} دج`,
                ``,
                `🛒 الأطباق:`,
                itemsList,
                ``,
                `🕐 موعد الاستلام: ${pickupLabel}`,
                notes.trim() ? `📝 ملاحظات: ${notes.trim()}` : '',
              ].filter(Boolean).join('\n');
              window.open(
                `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`,
                '_blank'
              );
            }
          }
        } catch { /* never block order completion on notification failure */ }
      }

      clearCart();
      navigate('/order-success', { state: { orderIds, phone: customerPhone } });
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'معلومات الطلبية', icon: User },
    { num: 2, label: 'موعد الاستلام', icon: Calendar },
    { num: 3, label: 'المراجعة', icon: Check },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6]" style={{ paddingBottom: '180px' }}>
      <header className="sticky top-16 z-30 bg-[#FFF5E6]/95 backdrop-blur-md border-b border-orange-100/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/cart" className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition" aria-label="رجوع">
              <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-stone-800 leading-none">إكمال الطلب</h1>
              <p className="text-xs text-stone-500 mt-1">الخطوة {currentStep} من {totalSteps}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {steps.map((step, idx) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : isActive ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-110' : 'bg-white text-stone-400 shadow-sm'}`}>
                      {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-4 h-4" strokeWidth={2.4} />}
                    </div>
                    <p className={`text-[10px] font-bold mt-1 ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-stone-400'}`}>{step.label}</p>
                  </div>
                  {idx < steps.length - 1 && <div className={`h-0.5 flex-1 -mt-4 rounded-full transition-all ${currentStep > step.num ? 'bg-green-500' : 'bg-stone-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-4 animate-slide-up">
          <div className="bg-red-50 border-r-4 border-red-500 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-bold text-red-700 flex-1 pt-1">{error}</p>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-5">
        {/* الخطوة 1 */}
        {currentStep === 1 && (
          <section className="animate-slide-up space-y-4">
            <SectionTitle icon={User} title="معلومات الطلبية" subtitle="لكي نتمكن من التواصل معك بشأن طلبك" />
            <div className="bg-white rounded-3xl shadow-sm p-5 space-y-4">
              <InputField label="اسم الطلبية" icon={User} required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="الاسم الذي سيظهر في الطلب" minLength={3} />
              <InputField label="رقم الهاتف" icon={Phone} required type="tel" inputMode="numeric" maxLength={10} value={customerPhone} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 10) setCustomerPhone(val); }} placeholder="05XXXXXXXX" dir="ltr" hint="10 أرقام، يبدأ بـ 0" isValid={customerPhone.length === 10 ? validatePhone(customerPhone) : null} />
              <InputField label="عنوان الاستلام" icon={MapPin} optional value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="مثلاً: حي البدر، شارع 5" />
            </div>
          </section>
        )}

        {/* الخطوة 2 */}
        {currentStep === 2 && (
          <section className="animate-slide-up space-y-4">
            <SectionTitle icon={Calendar} title="موعد الاستلام" subtitle="متى تريد الحصول على طلبك؟" />
            <div className="bg-white rounded-3xl shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <OrderTypeCard selected={orderType === 'instant'} onClick={() => setOrderType('instant')} icon={Zap} title="فوري" subtitle="في أقرب وقت" color="orange" />
                <OrderTypeCard selected={orderType === 'scheduled'} onClick={() => setOrderType('scheduled')} icon={Clock} title="مسبق" subtitle="في موعد تختاره" color="blue" />
              </div>
              {orderType === 'scheduled' && (
                <div className="animate-slide-up pt-2 space-y-3 border-t border-stone-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1.5">التاريخ</label>
                      <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm font-medium text-stone-700 focus:outline-none focus:border-orange-400 focus:bg-white transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1.5">الوقت</label>
                      <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full px-3 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm font-medium text-stone-700 focus:outline-none focus:border-orange-400 focus:bg-white transition" />
                    </div>
                  </div>
                </div>
              )}

              {/* وقت الاستلام المطلوب */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
                  <Clock className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                  وقت الاستلام المطلوب *
                </label>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2.5 flex items-start gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.3} />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                    أقل وقت للتحضير: <span className="font-black">{formatPrepTime(maxPrepMinutes)}</span>
                    {' — '}أقرب موعد متاح:{' '}
                    <span className="font-black" dir="ltr">
                      {minPickupDate.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                      {' '}
                      {minPickupDate.toLocaleDateString('ar-DZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </p>
                </div>
                <input
                  type="datetime-local"
                  value={requestedPickupTime}
                  onChange={(e) => setRequestedPickupTime(e.target.value)}
                  min={minPickupISO}
                  required
                  className="w-full px-3 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm font-medium text-stone-700 focus:outline-none focus:border-orange-400 focus:bg-white transition"
                />
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-xs font-bold text-stone-700">
                    <MessageSquare className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                    ملاحظات خاصة
                  </span>
                  <span className="text-[10px] text-stone-400 font-semibold">اختياري</span>
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition resize-none" placeholder="مثلاً: بدون فلفل حار..." />
                <p className="text-[11px] text-stone-500 mt-1">{notes.length}/200 حرف</p>
              </div>
            </div>
          </section>
        )}

        {/* الخطوة 3 */}
        {currentStep === 3 && (
          <section className="animate-slide-up space-y-4">
            <SectionTitle icon={Check} title="مراجعة الطلب" subtitle="تأكد من التفاصيل قبل التأكيد النهائي" />
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-l from-orange-50 to-white px-4 py-3 border-b border-orange-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                <h3 className="text-sm font-extrabold text-stone-800">الأطباق المطلوبة ({cookGroups.length} {cookGroups.length === 1 ? 'طباخة' : 'طباخات'})</h3>
              </div>
              <div className="divide-y divide-stone-100">
                {cookGroups.map((group) => (
                  <div key={group.cookId} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <p className="font-extrabold text-orange-600 text-xs">{group.cookName}</p>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.dishId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-stone-500 font-bold text-xs">×{item.quantity}</span>
                            <span className="text-stone-700 font-semibold truncate">{item.dishName}</span>
                          </div>
                          <span className="font-extrabold text-stone-800 text-xs">{(item.price * item.quantity).toLocaleString('ar-DZ')} دج</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-stone-200">
                      <span className="text-[11px] text-stone-500 font-semibold">مجموع هذه الطباخة</span>
                      <span className="text-sm font-black text-orange-600">{group.subtotal.toLocaleString('ar-DZ')} دج</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-l from-stone-50 to-white px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-500" strokeWidth={2.4} />
                  <h3 className="text-sm font-extrabold text-stone-800">معلومات الطلبية</h3>
                </div>
                <button onClick={() => setCurrentStep(1)} className="text-[11px] font-bold text-orange-600 hover:text-orange-700 active:scale-95 transition">تعديل</button>
              </div>
              <div className="p-4 space-y-2.5">
                <InfoRow icon={User} label="اسم الطلبية" value={customerName} />
                <InfoRow icon={Phone} label="الهاتف" value={customerPhone} ltr />
                {customerAddress && <InfoRow icon={MapPin} label="العنوان" value={customerAddress} />}
                <InfoRow icon={orderType === 'instant' ? Zap : Clock} label="نوع الطلب" value={orderType === 'instant' ? 'فوري' : `مسبق: ${scheduledDate} - ${scheduledTime}`} />
                {requestedPickupTime && (
                  <InfoRow
                    icon={Clock}
                    label="موعد الاستلام"
                    value={new Date(requestedPickupTime).toLocaleString('ar-DZ', {
                      weekday: 'long', year: 'numeric', month: 'short',
                      day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  />
                )}
                {notes && <InfoRow icon={MessageSquare} label="ملاحظات" value={notes} />}
              </div>
            </div>
            {cookGroups.length > 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.3} />
                <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                  سيتم إرسال {cookGroups.length} طلبات منفصلة (طلب لكل طباخة). ستتلقى تأكيداً لكل طلب عبر المنصة.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 px-3 pb-3 md:pb-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl shadow-stone-900/10 border border-stone-100 p-3">
            <div className="flex items-center justify-between px-2 pb-3">
              <div>
                <p className="text-[10px] text-stone-500 font-semibold leading-none">المجموع الكلي</p>
                <p className="text-xl font-black text-stone-800 leading-tight mt-1">{totalPrice.toLocaleString('ar-DZ')}<span className="text-xs font-bold text-stone-500 mr-1">دج</span></p>
              </div>
              <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-xl">
                <Package className="w-3.5 h-3.5 text-orange-600" strokeWidth={2.4} />
                <span className="text-[11px] font-black text-orange-700">{cookGroups.length} {cookGroups.length === 1 ? 'طلب' : 'طلبات'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <button onClick={handleBack} disabled={submitting} className="flex items-center justify-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 px-4 rounded-2xl text-sm active:scale-95 transition-all disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4 rotate-180" strokeWidth={2.5} />
                  السابق
                </button>
              )}
              {currentStep < totalSteps ? (
                <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-2xl font-extrabold text-sm shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all">
                  التالي
                  <ArrowLeft className="w-4 h-4" strokeWidth={2.8} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-2xl font-extrabold text-sm shadow-lg shadow-green-500/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait">
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />جارٍ الإرسال...</>) : (<><Check className="w-4 h-4" strokeWidth={3} />تأكيد الطلب نهائياً</>)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
        <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
      </div>
      <div>
        <h2 className="text-lg font-extrabold text-stone-800 leading-none">{title}</h2>
        <p className="text-xs text-stone-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function InputField({ label, icon: Icon, required, optional, hint, isValid, ...props }) {
  return (
    <div>
      <label className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <Icon className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
        {optional && <span className="text-[10px] text-stone-400 font-semibold">اختياري</span>}
      </label>
      <div className="relative">
        <input {...props} className={`w-full px-4 py-3 bg-stone-50 border-2 rounded-2xl text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:bg-white transition ${isValid === false ? 'border-red-300 focus:border-red-500' : isValid === true ? 'border-green-300 focus:border-green-500' : 'border-stone-200 focus:border-orange-400'}`} />
        {isValid === true && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      {hint && <p className="text-[11px] text-stone-500 mt-1.5 mr-1">{hint}</p>}
    </div>
  );
}

function OrderTypeCard({ selected, onClick, icon: Icon, title, subtitle, color }) {
  const colorMap = {
    orange: { bg: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/30', iconBg: 'bg-white/20' },
    blue: { bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', iconBg: 'bg-white/20' },
  };
  const c = colorMap[color];
  return (
    <button type="button" onClick={onClick} className={`relative p-4 rounded-2xl text-right transition-all active:scale-95 overflow-hidden ${selected ? `bg-gradient-to-br ${c.bg} text-white shadow-lg ${c.shadow}` : 'bg-stone-50 text-stone-700 border-2 border-stone-200 hover:border-stone-300'}`}>
      {selected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
          <Check className="w-3 h-3" strokeWidth={3} style={{ color: color === 'orange' ? '#ea580c' : '#2563eb' }} />
        </div>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${selected ? c.iconBg : 'bg-white'}`}>
        <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-stone-600'}`} strokeWidth={2.3} />
      </div>
      <p className={`font-extrabold text-sm ${selected ? 'text-white' : 'text-stone-800'}`}>{title}</p>
      <p className={`text-[11px] font-semibold mt-0.5 ${selected ? 'text-white/90' : 'text-stone-500'}`}>{subtitle}</p>
    </button>
  );
}

function InfoRow({ icon: Icon, label, value, ltr }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-stone-500 font-semibold leading-none">{label}</p>
        <p className="text-stone-800 font-bold text-xs mt-1 break-words" dir={ltr ? 'ltr' : 'rtl'} style={ltr ? { textAlign: 'right' } : {}}>{value}</p>
      </div>
    </div>
  );
}

export default Checkout;