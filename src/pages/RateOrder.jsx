import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  updateDoc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const RateOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (!orderDoc.exists()) {
          setLoading(false);
          return;
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        setOrder(orderData);

        // تحقق إذا الطلب سبق تقييمه
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('orderId', '==', orderId)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        if (!ratingsSnapshot.empty) {
          setAlreadyRated(true);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('يرجى اختيار عدد النجوم');
      return;
    }

    setSubmitting(true);
    try {
      // حفظ التقييم
      await addDoc(collection(db, 'ratings'), {
        orderId,
        cookId: order.cookId,
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });

      // تحديث إحصائيات الطباخة (transaction لمنع race condition)
      const cookRef = doc(db, 'cooks', order.cookId);
      await runTransaction(db, async (transaction) => {
        const cookSnap = await transaction.get(cookRef);
        if (!cookSnap.exists()) return;
        const data = cookSnap.data();
        const newSum = (data.ratingSum || 0) + rating;
        const newTotal = (data.totalRatings || 0) + 1;
        transaction.update(cookRef, {
          ratingSum: newSum,
          totalRatings: newTotal,
          averageRating: parseFloat((newSum / newTotal).toFixed(2)),
        });
      });

      // تحديث الطلب ليدل على أنه قُيّم
      await updateDoc(doc(db, 'orders', orderId), {
        rated: true,
      });

      navigate('/', { replace: true });
      setTimeout(() => {
        alert('شكراً على تقييمك! 🌟');
      }, 100);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('حدث خطأ، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        جاري التحميل...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">الطلب غير موجود</h2>
          <Link to="/" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (alreadyRated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">تم تقييم هذا الطلب مسبقاً</h2>
          <p className="text-gray-600 mb-6">شكراً على مشاركتك رأيك معنا</p>
          <Link to="/" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold inline-block">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌟</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            كيف كانت تجربتك؟
          </h1>
          <p className="text-gray-600">
            قيّم طلبك من <span className="font-bold text-orange-600">{order.cookName}</span>
          </p>
        </div>

        {/* معلومات الطلب */}
        <div className="bg-orange-50 rounded-lg p-4 mb-6 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">الطبق:</span>
            <span className="font-bold">{order.dishName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">المجموع:</span>
            <span className="font-bold text-orange-600">{order.totalPrice} دج</span>
          </div>
        </div>

        {/* النجوم */}
        <div className="mb-6">
          <label className="block text-center text-gray-700 mb-3 font-medium">
            اختر عدد النجوم
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-5xl transition transform hover:scale-110 focus:outline-none"
              >
                {star <= (hoverRating || rating) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-2 text-gray-600">
              {rating === 1 && 'سيء 😞'}
              {rating === 2 && 'مقبول 😐'}
              {rating === 3 && 'جيد 🙂'}
              {rating === 4 && 'ممتاز 😊'}
              {rating === 5 && 'رائع جداً 🤩'}
            </p>
          )}
        </div>

        {/* التعليق */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">
            تعليقك (اختياري)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="شاركنا رأيك في الأكل والخدمة..."
          />
        </div>

        {/* الأزرار */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
          <Link
            to="/"
            className="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
          >
            تخطي
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RateOrder;