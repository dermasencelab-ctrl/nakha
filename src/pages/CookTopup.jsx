import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PAYMENT_INFO, QUICK_AMOUNTS, MIN_TOPUP_AMOUNT } from '../config/settings';
import ImageUploader from '../components/ImageUploader';

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

  // نسخ RIP
  const copyRip = () => {
    navigator.clipboard.writeText(PAYMENT_INFO.rip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // اختيار مبلغ سريع
  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  // إرسال طلب الشحن
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amountNum = parseInt(amount);

    // Validation
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
      // جلب اسم الطباخة من بياناتها
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* العنوان */}
        <div className="mb-6">
          <Link
            to="/cook/wallet"
            className="text-orange-600 text-sm hover:underline mb-2 inline-block"
          >
            ← العودة للمحفظة
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">شحن الرصيد 💵</h1>
        </div>

        {/* تعليمات */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-blue-900 mb-2">📌 خطوات الشحن:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>افتحي تطبيق <strong>BaridiMob</strong> في جوالك</li>
            <li>حوّلي المبلغ المطلوب إلى الـ RIP أدناه</li>
            <li>اكتبي رقم التحويل الذي يصلك</li>
            <li>ارفعي صورة إيصال التحويل</li>
            <li>أرسلي الطلب وانتظري التأكيد من الأدمن</li>
          </ol>
        </div>

        {/* بطاقة معلومات الدفع */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🏦</div>
            <div>
              <h3 className="font-bold text-gray-800">معلومات الدفع</h3>
              <p className="text-sm text-gray-500">{PAYMENT_INFO.bankName}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">اسم الحساب</p>
              <p className="font-bold text-gray-800">{PAYMENT_INFO.accountName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">رقم الحساب (RIP)</p>
              <div className="flex items-center gap-2 bg-orange-50 p-3 rounded-lg">
                <p className="font-mono font-bold text-lg text-gray-800 flex-1" dir="ltr">
                  {PAYMENT_INFO.rip}
                </p>
                <button
                  onClick={copyRip}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {copied ? '✓ تم النسخ' : '📋 نسخ'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ❌ {error}
            </div>
          )}

          {/* المبلغ */}
          <div className="mb-5">
            <label className="block text-gray-700 mb-3 font-bold">
              المبلغ المراد شحنه *
            </label>

            {/* أزرار سريعة */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleQuickAmount(value)}
                  className={`py-3 px-2 rounded-lg font-bold text-sm transition ${
                    parseInt(amount) === value
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                  }`}
                >
                  {value} دج
                </button>
              ))}
            </div>

            {/* حقل مبلغ مخصص */}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={MIN_TOPUP_AMOUNT}
              step="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-bold text-center"
              placeholder={`أو اكتب مبلغ مخصص (الحد الأدنى ${MIN_TOPUP_AMOUNT} دج)`}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              الحد الأدنى: {MIN_TOPUP_AMOUNT} دج
            </p>
          </div>

          {/* رقم التحويل */}
          <div className="mb-5">
            <label className="block text-gray-700 mb-2 font-bold">
              رقم التحويل (Transaction Number) *
            </label>
            <input
              type="text"
              value={transactionNumber}
              onChange={(e) => setTransactionNumber(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="مثلاً: 123456789"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 ستجدين رقم التحويل في رسالة التأكيد من BaridiMob
            </p>
          </div>

          {/* صورة الإيصال */}
          <div className="mb-5">
            <ImageUploader
              value={receiptImage}
              onChange={setReceiptImage}
              folder="receipts"
              label="صورة إيصال التحويل *"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 ارفعي صورة واضحة للإيصال تظهر فيها معلومات التحويل
            </p>
          </div>

          {/* ملاحظات */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-bold">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="أي معلومات إضافية تريدين إخبار الأدمن بها..."
            />
          </div>

          {/* أزرار */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50"
            >
              {submitting ? 'جاري الإرسال...' : '📤 إرسال طلب الشحن'}
            </button>
            <Link
              to="/cook/wallet"
              className="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
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