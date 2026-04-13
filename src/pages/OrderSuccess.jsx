import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package } from 'lucide-react';

function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const phone = params.get('phone');

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-dark mb-3">تم إرسال طلبك! 🎉</h1>
        <p className="text-gray-600 mb-4">
          سيقوم فريقنا بمراجعة طلبك والتواصل معك قريباً.
        </p>
        {orderId && (
          <div className="bg-cream p-4 rounded-xl mb-6">
            <p className="text-sm text-gray-600">رقم طلبك:</p>
            <p className="font-mono font-bold text-dark text-sm break-all">{orderId}</p>
          </div>
        )}
        <div className="space-y-3">
          {phone && (
            <Link
              to={`/my-orders?phone=${phone}`}
              className="block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600"
            >
              <Package className="w-5 h-5 inline ml-2" />
              تتبع طلباتي
            </Link>
          )}
          <Link to="/" className="block text-gray-600 hover:text-dark">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;