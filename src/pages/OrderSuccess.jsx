import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

function OrderSuccess() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-dark mb-3">تم إرسال طلبك! 🎉</h1>
        <p className="text-gray-600 mb-6">
          راقب واتساب، الطباخة ستتواصل معك قريباً لتأكيد الطلب.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;