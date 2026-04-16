import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ShoppingBag, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    cookGroups,
    itemsCount,
    cooksCount,
    totalPrice,
    updateQuantity,
    removeFromCart,
    removeCookItems,
    clearCart,
  } = useCart();

  // سلة فاضية
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-12 px-4" dir="rtl">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-12 text-center">
          <div className="text-7xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">سلتك فارغة</h2>
          <p className="text-gray-600 mb-6">
            ابدئي بتصفّح الطباخات وأضيفي الأطباق التي تعجبك
          </p>
          <Link
            to="/cooks"
            className="inline-flex items-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-md"
          >
            <ShoppingBag className="w-5 h-5" />
            تصفّح الطباخات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* ترويسة */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">سلتي 🛒</h1>
            <p className="text-gray-600 text-sm mt-1">
              {itemsCount} {itemsCount === 1 ? 'طبق' : 'أطباق'} من {cooksCount}{' '}
              {cooksCount === 1 ? 'طباخة' : 'طباخات'}
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من إفراغ السلة؟')) {
                clearCart();
              }
            }}
            className="text-red-600 text-sm font-medium hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            إفراغ السلة
          </button>
        </div>

        {/* تنبيه إذا فيه عدة طباخات */}
        {cooksCount > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 سلتك فيها أطباق من <strong>{cooksCount} طباخات</strong>. عند تأكيد
              الطلب، سيتم إنشاء طلب منفصل لكل طباخة، وستصلهن جميعاً في نفس الوقت.
            </p>
          </div>
        )}

        {/* مجموعات الطباخات */}
        <div className="space-y-4 mb-6">
          {cookGroups.map((group) => (
            <div
              key={group.cookId}
              className="bg-white rounded-2xl shadow-md overflow-hidden"
            >
              {/* ترويسة الطباخة */}
              <div className="bg-orange-50 p-4 flex items-center justify-between flex-wrap gap-2 border-b border-orange-100">
                <Link
                  to={`/cooks/${group.cookId}`}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  {group.cookPhoto ? (
                    <img
                      src={group.cookPhoto}
                      alt={group.cookName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-2xl">
                      👩‍🍳
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800">{group.cookName}</p>
                    <p className="text-xs text-gray-500">
                      {group.items.length} {group.items.length === 1 ? 'طبق' : 'أطباق'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`حذف كل أطباق ${group.cookName} من السلة؟`)) {
                      removeCookItems(group.cookId);
                    }
                  }}
                  className="text-red-500 text-xs hover:underline"
                >
                  حذف الكل
                </button>
              </div>

              {/* الأطباق */}
              <div className="p-4 space-y-3">
                {group.items.map((item) => (
                  <div
                    key={item.dishId}
                    className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    {/* صورة الطبق */}
                    {item.dishImage ? (
                      <img
                        src={item.dishImage}
                        alt={item.dishName}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center text-2xl flex-shrink-0">
                        🍽️
                      </div>
                    )}

                    {/* المعلومات */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800">{item.dishName}</p>
                      <p className="text-orange-600 font-bold text-sm">
                        {item.price} دج
                      </p>
                    </div>

                    {/* الكمية */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                        className="w-8 h-8 rounded-md bg-white text-gray-700 hover:bg-orange-100 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-gray-800 w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                        className="w-8 h-8 rounded-md bg-white text-gray-700 hover:bg-orange-100 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* المجموع الفرعي */}
                    <div className="text-left min-w-[70px]">
                      <p className="font-bold text-gray-800">
                        {item.price * item.quantity} دج
                      </p>
                    </div>

                    {/* حذف */}
                    <button
                      onClick={() => removeFromCart(item.dishId)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* مجموع الطباخة */}
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  مجموع طلب {group.cookName}:
                </span>
                <span className="font-bold text-orange-600">{group.subtotal} دج</span>
              </div>
            </div>
          ))}
        </div>

        {/* المجموع الكلي + زر الإكمال */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium text-gray-700">المجموع الكلي:</span>
            <span className="text-3xl font-bold text-orange-600">
              {totalPrice.toLocaleString('ar-DZ')} دج
            </span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-md flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            إكمال الطلب
          </button>
          <Link
            to="/cooks"
            className="w-full mt-3 flex items-center justify-center gap-2 text-orange-600 py-2 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            متابعة التسوق
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;