import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Home, ShoppingBag } from 'lucide-react';

function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const phone = params.get('phone');

  // دعم عدة أرقام طلبات (من نظام السلة الجديد)
  const orderIds = orderId ? orderId.split(',') : [];
  const multipleOrders = orderIds.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
        {/* أيقونة النجاح */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <div className="absolute -top-2 -right-2 text-4xl animate-bounce">🎉</div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          تم تأكيد طلبك بنجاح!
        </h1>

        <p className="text-gray-600 mb-6">
          {multipleOrders
            ? `تم إنشاء ${orderIds.length} طلبات منفصلة وإرسالها للطباخات. ستتلقى تأكيداً من كل طباخة قريباً.`
            : 'تم إرسال طلبك للطباخة وستتلقى تأكيداً قريباً.'
          }
        </p>

        {/* أرقام الطلبات */}
        {orderIds.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-xl mb-6 text-right">
            <p className="text-sm text-gray-500 mb-2">
              {multipleOrders ? 'أرقام طلباتك:' : 'رقم طلبك:'}
            </p>
            {orderIds.map((id, index) => (
              <p key={id} className="font-mono font-bold text-gray-800 text-sm" dir="ltr">
                {multipleOrders && <span className="text-orange-600">طلب {index + 1}: </span>}
                #{id.slice(0, 8).toUpperCase()}
              </p>
            ))}
          </div>
        )}

        {/* خطوات ما بعد الطلب */}
        <div className="bg-orange-50 rounded-xl p-4 mb-6 text-right">
          <h3 className="font-bold text-orange-800 mb-2">📋 ما الخطوة التالية؟</h3>
          <div className="text-sm text-orange-700 space-y-1">
            <p>1️⃣ الطباخة ستراجع طلبك</p>
            <p>2️⃣ ستبدأ بتحضيره عند القبول</p>
            <p>3️⃣ سيكون جاهزاً للاستلام</p>
            <p>4️⃣ يمكنك متابعة حالة طلبك من صفحة "طلباتي"</p>
          </div>
        </div>

        {/* الأزرار */}
        <div className="space-y-3">
          {phone && (
            <Link
              to={`/my-orders?phone=${phone}`}
              className="flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-md"
            >
              <Package className="w-5 h-5" />
              تتبع طلباتي
            </Link>
          )}

          <Link
            to="/cooks"
            className="flex items-center justify-center gap-2 bg-white border-2 border-orange-600 text-orange-600 px-8 py-3 rounded-xl font-bold hover:bg-orange-50 transition"
          >
            <ShoppingBag className="w-5 h-5" />
            اطلب المزيد
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2"
          >
            <Home className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;