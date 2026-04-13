import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

function CookPending() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <Clock className="w-20 h-20 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-dark mb-3">في انتظار التوثيق ⏳</h1>
        <p className="text-gray-600 mb-6">
          شكراً على التسجيل! سيقوم فريق نَكهة بمراجعة حسابك خلال 24 ساعة. ستتمكنين من الدخول بعد التوثيق.
        </p>
        <Link to="/" className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

export default CookPending;