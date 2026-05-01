import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PAYMENT_INFO, QUICK_AMOUNTS, MIN_TOPUP_AMOUNT } from '../config/settings';
import ImageUploader from '../components/ImageUploader';
import { ArrowRight } from 'lucide-react';

const CookTopup = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const copyRip = () => {
    navigator.clipboard.writeText(PAYMENT_INFO.rip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amountNum = parseInt(amount);

    if (!amountNum || amountNum < MIN_TOPUP_AMOUNT) {
      setError(`الحد الأدنى للشحن هو ${MIN_TOPUP_AMOUNT} دج`);
      return;
    }

    if (!transactionNumber.trim() || transactionNumber.trim().length < 4) {
      setError('يرجى إدخال رقم تحويل صحيح');
      return;
    }

    if (!receiptImage) {
      setError('يرجى رفع صورة الإيصال');
      return;
    }

    setSubmitting(true);
    try {
      const cookName = userProfile?.email?.split('@')[0] || 'طباخة';

      await addDoc(collection(db, 'topup_requests'), {
        cookId: userProfile.cookId,
        cookEmail: userProfile.email,
        cookName,
        amount: amountNum,
        transactionNumber: transactionNumber.trim(),
        receiptImage,
        notes: notes.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      alert('✅ تم إرسال طلب الشحن بنجاح!\n\nسيراجعه الأدمن قريباً وستضاف القيمة لرصيدك بعد التأكيد.');
      navigate('/cook/wallet');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E6] pb-28" dir="rtl">
      {/* رأس الصفحة */}
      <header className="sticky top-0 z-30 bg-[#FFF5E6]/95 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/cook/wallet"
            className="flex items-center gap-1.5 text-stone-500 hover:text-orange-600 transition text-sm font-bold"
          >
            <ArrowRight className="w-4 h-4" />
            المحفظة
          </Link>
          <div className="flex items-center gap-2 mr-auto">
            <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
            <h1 className="font-black text-stone-800 text-base">شحن الرصيد</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* تعليمات */}
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
          <h3 className="font-black text-blue-900 mb-3 text-sm">📌 خطوات الشحن:</h3>
          <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>افتحي تطبيق <strong>BaridiMob</strong> في جوالك</li>
            <li>حوّلي المبلغ المطلوب إلى الـ RIP أدناه</li>
            <li>اكتبي رقم التحويل الذي يصلك</li>
            <li>ارفعي صورة إيصال التحويل</li>
            <li>أرسلي الطلب وانتظري التأكيد من الأدمن</li>
          </ol>
        </div>

        {/* بطاقة معلومات الدفع */}
        <div className="bg-white rounded-3xl shadow-sm p-5 border border-orange-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-xl">🏦</div>
            <div>
              <h3 className="font-black text-stone-800 text-sm">معلومات الدفع</h3>
              <p className="text-xs text-stone-400">{PAYMENT_INFO.bankName}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-stone-400 mb-1 font-semibold">اسم الحساب</p>
              <p className="font-black text-stone-800 text-sm">{PAYMENT_INFO.accountName}</p>
            </div>

            <div>
              <p className="text-xs text-stone-400 mb-1 font-semibold">رقم الحساب (RIP)</p>
              <div className="flex items-center gap-2 bg-orange-50 p-3 rounded-2xl border border-orange-100">
                <p className="font-mono font-bold text-base text-stone-800 flex-1" dir="ltr">
                  {PAYMENT_INFO.rip}
                </p>
                <button
                  onClick={copyRip}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-gradient-to-l from-orange-500 to-orange-600 text-white hover:opacity-90'
                  }`}
                >
                  {copied ? '✓ تم النسخ' : '📋 نسخ'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm p-5 border border-stone-100 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-semibold">
              ❌ {error}
            </div>
          )}

          {/* المبلغ */}
          <div>
            <label className="block text-stone-700 mb-3 font-black text-sm">
              المبلغ المراد شحنه *
            </label>

            {/* أزرار سريعة */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleQuickAmount(value)}
                  className={`py-3 px-2 rounded-2xl font-black text-xs transition ${
                    parseInt(amount) === value
                      ? 'bg-gradient-to-l from-orange-500 to-orange-600 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-stone-100 text-stone-700 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  {value} دج
                </button>
              ))}
            </div>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={MIN_TOPUP_AMOUNT}
              step="100"
              className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition text-base font-bold text-center"
              placeholder={`أو اكتب مبلغ مخصص (الحد الأدنى ${MIN_TOPUP_AMOUNT} دج)`}
            />
            <p className="text-xs text-stone-400 mt-1.5 text-center font-semibold">
              الحد الأدنى: {MIN_TOPUP_AMOUNT} دج
            </p>
          </div>

          {/* رقم التحويل */}
          <div>
            <label className="block text-stone-700 mb-2 font-black text-sm">
              رقم التحويل (Transaction Number) *
            </label>
            <input
              type="text"
              value={transactionNumber}
              onChange={(e) => setTransactionNumber(e.target.value)}
              required
              className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition text-sm"
              placeholder="مثلاً: 123456789"
              dir="ltr"
            />
            <p className="text-xs text-stone-400 mt-1.5 font-semibold">
              💡 ستجدين رقم التحويل في رسالة التأكيد من BaridiMob
            </p>
          </div>

          {/* صورة الإيصال */}
          <div>
            <ImageUploader
              value={receiptImage}
              onChange={setReceiptImage}
              folder="receipts"
              label="صورة إيصال التحويل *"
            />
            <p className="text-xs text-stone-400 mt-1.5 font-semibold">
              💡 ارفعي صورة واضحة للإيصال تظهر فيها معلومات التحويل
            </p>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-stone-700 mb-2 font-black text-sm">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition resize-none text-sm"
              placeholder="أي معلومات إضافية تريدين إخبار الأدمن بها..."
            />
          </div>

          {/* أزرار */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-l from-orange-500 to-orange-600 text-white py-3 rounded-2xl font-black text-sm hover:opacity-90 transition disabled:opacity-50 shadow-sm shadow-orange-500/20"
            >
              {submitting ? 'جاري الإرسال...' : '📤 إرسال طلب الشحن'}
            </button>
            <Link
              to="/cook/wallet"
              className="px-6 bg-stone-100 text-stone-700 py-3 rounded-2xl font-black text-sm hover:bg-stone-200 transition"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CookTopup;
