import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // تحميل السلة من localStorage عند بدء التطبيق
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nakha_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // حفظ السلة في localStorage عند أي تغيير
  useEffect(() => {
    try {
      localStorage.setItem('nakha_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cart]);

  // إضافة طبق للسلة
  const addToCart = (dish, cook) => {
    setCart((prev) => {
      // تحقق إذا الطبق موجود مسبقاً
      const existingIndex = prev.findIndex((item) => item.dishId === dish.id);

      if (existingIndex !== -1) {
        // زيادة الكمية
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      // إضافة طبق جديد
      return [
        ...prev,
        {
          dishId: dish.id,
          dishName: dish.name,
          dishImage: dish.photo || dish.image || '',
          price: dish.price || 0,
          unit: dish.unit || 'plate',
          quantity: 1,
          cookId: cook.id,
          cookName: cook.name,
          cookPhoto: cook.photo || cook.image || '',
          addedAt: Date.now(),
        },
      ];
    });
  };

  // تحديث الكمية
  const updateQuantity = (dishId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.dishId === dishId ? { ...item, quantity } : item
      )
    );
  };

  // حذف طبق من السلة
  const removeFromCart = (dishId) => {
    setCart((prev) => prev.filter((item) => item.dishId !== dishId));
  };

  // مسح كل أطباق طباخة معيّنة
  const removeCookItems = (cookId) => {
    setCart((prev) => prev.filter((item) => item.cookId !== cookId));
  };

  // مسح السلة كاملة
  const clearCart = () => {
    setCart([]);
  };

  // عدد العناصر الكلي
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // المجموع الكلي
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // تجميع السلة حسب الطباخة (للعرض والإرسال)
  const cartByCook = cart.reduce((groups, item) => {
    if (!groups[item.cookId]) {
      groups[item.cookId] = {
        cookId: item.cookId,
        cookName: item.cookName,
        cookPhoto: item.cookPhoto,
        items: [],
        subtotal: 0,
      };
    }
    groups[item.cookId].items.push(item);
    groups[item.cookId].subtotal += item.price * item.quantity;
    return groups;
  }, {});

  // تحويلها لـ array
  const cookGroups = Object.values(cartByCook);

  // عدد الطباخات في السلة
  const cooksCount = cookGroups.length;

  const value = {
    cart,
    cookGroups,
    itemsCount,
    cooksCount,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    removeCookItems,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};