import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  Info,
  ChefHat,
  X,
  Check,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

const getUnitLabel = (unit) => {
  const labels = {
    plate: 'طبق',
    kg: 'كغ',
    box: 'علبة',
    piece: 'حبة',
    liter: 'لتر',
    dozen: 'دزينة',
  };
  return labels[unit] || '';
};

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

  // حوار تأكيد الحذف
  const [confirmDialog, setConfirmDialog] = useState(null);
  // رسم متحرك عند إزالة عنصر
  const [removingItems, setRemovingItems] = useState(new Set());

  const openConfirm = (type, data) => {
    setConfirmDialog({ type, data });
  };
  const closeConfirm = () => setConfirmDialog(null);

  const handleConfirm = () => {
    if (!confirmDialog) return;
    const { type, data } = confirmDialog;

    if (type === 'item') {
      setRemovingItems((prev) => new Set(prev).add(data.dishId));
      setTimeout(() => {
        removeFromCart(data.dishId);
        setRemovingItems((prev) => {
          const next = new Set(prev);
          next.delete(data.dishId);
          return next;
        });
      }, 250);
    } else if (type === 'cook') {
      removeCookItems(data.cookId);
    } else if (type === 'all') {
      clearCart();
    }
    closeConfirm();
  };

  // ============================================
  // السلة فارغة
  // ============================================
  if (cart.length === 0) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#FFF5E6] px-4 pb-24 md:pb-8">
        {/* Header */}
        <header className="pt-4 pb-6 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
          >
            <ArrowLeft className="w-4 h-4 text-stone-700 rotate-180" strokeWidth={2.4} />
          </Link>
          <h1 className="text-xl font-extrabold text-stone-800">السلة</h1>
        </header>

        {/* Empty state */}
        <div className="max-w-md mx-auto mt-12 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag
                className="w-16 h-16 text-orange-500"
                strokeWidth={1.8}
              />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg animate-gentle-bounce">
              🍲
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-stone-800 mb-2">
            سلتك فارغة
          </h2>
          <p className="text-stone-500 text-sm mb-8 max-w-xs mx-auto">
            ابدأ بتصفّح الطباخات وأضف الأطباق التي تعجبك لتحضير وجبتك
          </p>

          <Link
            to="/cooks"
            className="inline-flex items-center gap-2 bg-gradient-to-l from-orange-500 to-orange-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
          >
            <ChefHat className="w-5 h-5" strokeWidth={2.4} />
            تصفّح الطباخات
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // السلة فيها عناصر
  // ============================================
  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6]" style={{ paddingBottom: '200px' }}>
      {/* ============================================ */}
      {/* Sticky Header */}
      {/* ============================================ */}
      <header className="sticky top-16 z-30 bg-[#FFF5E6]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/cooks"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
            aria-label="رجوع"
          >
            <ArrowLeft className="w-4 h-4 text-stone-700 rotate-180" strokeWidth={2.4} />
          </Link>

          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-stone-800 leading-none">
              سلتي
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              {itemsCount} {itemsCount === 1 ? 'طبق' : 'أطباق'} من{' '}
              {cooksCount} {cooksCount === 1 ? 'طباخة' : 'طباخات'}
            </p>
          </div>

          <button
            onClick={() => openConfirm('all', null)}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-bold bg-white hover:bg-red-50 px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.4} />
            تفريغ
          </button>
        </div>
      </header>

      {/* ============================================ */}
      {/* تنبيه عدة طباخات */}
      {/* ============================================ */}
      {cooksCount > 1 && (
        <div className="max-w-4xl mx-auto px-4 pt-3">
          <div className="bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-900 mb-0.5">
                سلتك من {cooksCount} طباخات مختلفة
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                عند تأكيد الطلب، سيتم إنشاء طلب منفصل لكل طباخة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* مجموعات الطباخات */}
      {/* ============================================ */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {cookGroups.map((group, groupIdx) => (
          <section
            key={group.cookId}
            style={{ animationDelay: `${groupIdx * 80}ms` }}
            className="animate-slide-up bg-white rounded-3xl shadow-sm overflow-hidden"
          >
            {/* Header: الطباخة */}
            <div className="bg-gradient-to-l from-orange-50 via-orange-50 to-white p-4 flex items-center justify-between gap-3 border-b border-orange-100">
              <Link
                to={`/cooks/${group.cookId}`}
                className="flex items-center gap-3 flex-1 min-w-0 active:scale-[0.98] transition"
              >
                <div className="relative flex-shrink-0">
                  {group.cookPhoto ? (
                    <img
                      src={group.cookPhoto}
                      alt={group.cookName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-2xl border-2 border-white shadow-md">
                      👩‍🍳
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-black text-orange-600 shadow ring-1 ring-orange-200">
                    {group.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-stone-800 text-sm truncate">
                    {group.cookName}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {group.items.length} {group.items.length === 1 ? 'طبق' : 'أطباق'} •{' '}
                    <span className="text-orange-600 font-bold">
                      {group.subtotal.toLocaleString('ar-DZ')} دج
                    </span>
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 text-stone-400" strokeWidth={2.3} />
              </Link>

              <button
                onClick={() =>
                  openConfirm('cook', {
                    cookId: group.cookId,
                    cookName: group.cookName,
                  })
                }
                className="w-8 h-8 rounded-full bg-white hover:bg-red-50 flex items-center justify-center active:scale-90 transition"
                aria-label="حذف كل أطباق الطباخة"
              >
                <Trash2 className="w-4 h-4 text-red-500" strokeWidth={2.3} />
              </button>
            </div>

            {/* قائمة الأطباق */}
            <div className="divide-y divide-stone-100">
              {group.items.map((item) => {
                const isRemoving = removingItems.has(item.dishId);
                return (
                  <div
                    key={item.dishId}
                    className={`p-3 transition-all duration-200 ${
                      isRemoving
                        ? 'opacity-0 -translate-x-full'
                        : 'opacity-100 translate-x-0'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* صورة الطبق */}
                      <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
                        {item.dishImage ? (
                          <img
                            src={item.dishImage}
                            alt={item.dishName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">🍽️</span>
                        )}
                      </div>

                      {/* المعلومات */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-800 text-sm leading-tight line-clamp-1">
                              {item.dishName}
                            </p>
                            <p className="text-orange-600 font-bold text-xs mt-0.5">
                              {item.price.toLocaleString('ar-DZ')} دج
                              {item.unit && (
                                <span className="text-stone-400 font-semibold">
                                  {' '}/ {getUnitLabel(item.unit)}
                                </span>
                              )}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              openConfirm('item', {
                                dishId: item.dishId,
                                dishName: item.dishName,
                              })
                            }
                            className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center active:scale-90 transition flex-shrink-0"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-stone-400 hover:text-red-500" strokeWidth={2.3} />
                          </button>
                        </div>

                        {/* عدّاد الكمية + الإجمالي */}
                        <div className="flex items-center justify-between gap-2">
                          {/* عدّاد */}
                          <div className="flex items-center gap-0 bg-stone-100 rounded-xl p-0.5">
                            <button
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  openConfirm('item', {
                                    dishId: item.dishId,
                                    dishName: item.dishName,
                                  });
                                } else {
                                  updateQuantity(item.dishId, item.quantity - 1);
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center active:scale-90 transition shadow-sm"
                              aria-label="نقصان"
                            >
                              <Minus className="w-3.5 h-3.5" strokeWidth={2.6} />
                            </button>
                            <span className="font-black text-stone-800 w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.dishId, item.quantity + 1)
                              }
                              className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center active:scale-90 transition shadow-sm"
                              aria-label="زيادة"
                            >
                              <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
                            </button>
                          </div>

                          {/* الإجمالي */}
                          <div className="text-left">
                            <p className="text-[10px] text-stone-500 font-semibold leading-none">
                              الإجمالي
                            </p>
                            <p className="font-extrabold text-stone-800 text-sm mt-0.5">
                              {(item.price * item.quantity).toLocaleString('ar-DZ')} دج
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* فوتر: مجموع الطباخة */}
            <div className="bg-stone-50 px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-stone-600 font-semibold">
                مجموع طلب {group.cookName}
              </span>
              <span className="text-sm font-black text-orange-600">
                {group.subtotal.toLocaleString('ar-DZ')} دج
              </span>
            </div>
          </section>
        ))}

        {/* رابط: متابعة التسوق */}
        <Link
          to="/cooks"
          className="flex items-center justify-center gap-2 bg-white hover:bg-orange-50 text-orange-600 py-3.5 rounded-2xl font-bold text-sm border-2 border-dashed border-orange-300 active:scale-[0.98] transition-all mt-4"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          إضافة أطباق أخرى
        </Link>
      </main>

      {/* ============================================ */}
      {/* الشريط السفلي: الإجمالي + زر الطلب */}
      {/* ============================================ */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 px-3 pb-3 md:px-0 md:pb-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl shadow-stone-900/10 border border-stone-100 p-4">
            {/* السطر الأول: الإجمالي */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] text-stone-500 font-semibold leading-none">
                  المجموع الكلي
                </p>
                <p className="text-2xl font-black text-stone-800 leading-tight mt-1">
                  {totalPrice.toLocaleString('ar-DZ')}
                  <span className="text-sm font-bold text-stone-500 mr-1">دج</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-xl">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" strokeWidth={2.4} />
                <span className="text-[11px] font-black text-orange-700">
                  {itemsCount} {itemsCount === 1 ? 'طبق' : 'أطباق'}
                </span>
              </div>
            </div>

            {/* زر إكمال الطلب */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg shadow-orange-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={2.5} />
              إكمال الطلب
              <ArrowLeft className="w-4 h-4" strokeWidth={2.8} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Confirm Dialog (Bottom Sheet) */}
      {/* ============================================ */}
      {confirmDialog && (
        <ConfirmDialog
          dialog={confirmDialog}
          onCancel={closeConfirm}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};

/* ============================================ */
/* Confirm Dialog - Bottom Sheet Style */
/* ============================================ */
function ConfirmDialog({ dialog, onCancel, onConfirm }) {
  const { type, data } = dialog;

  const texts = {
    item: {
      title: 'حذف الطبق',
      message: `هل تريد حذف "${data?.dishName}" من السلة؟`,
      confirm: 'نعم، احذف',
      icon: Trash2,
    },
    cook: {
      title: 'حذف أطباق الطباخة',
      message: `سيتم حذف كل أطباق ${data?.cookName} من السلة. هل أنت متأكد؟`,
      confirm: 'نعم، احذف الكل',
      icon: AlertTriangle,
    },
    all: {
      title: 'تفريغ السلة',
      message: 'سيتم حذف كل الأطباق من سلتك. هل أنت متأكد؟',
      confirm: 'نعم، فرّغ السلة',
      icon: AlertTriangle,
    },
  };

  const t = texts[type];
  const Icon = t.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm animate-fade-in"
      />

      {/* Sheet */}
      <div
        dir="rtl"
        className="fixed bottom-0 right-0 left-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-in-bottom pb-safe"
      >
        {/* مقبض السحب */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        <div className="p-5 pt-3">
          {/* أيقونة + عنوان */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-red-600" strokeWidth={2.3} />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-extrabold text-stone-800 leading-tight">
                {t.title}
              </h3>
              <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                {t.message}
              </p>
            </div>
          </div>

          {/* أزرار */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3.5 rounded-2xl active:scale-95 transition-all text-sm"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-500/30 text-sm"
            >
              {t.confirm}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Cart;