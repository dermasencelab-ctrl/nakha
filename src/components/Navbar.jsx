import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Home, ChefHat, Package, Info, Shield } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const Navbar = () => {
  const { itemsCount } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // إخفاء/إظهار Navbar عند التمرير
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // ينزل
        setVisible(false);
      } else {
        // يصعد
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // إغلاق القائمة عند تغيير الصفحة
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // إخفاء Navbar في صفحات معيّنة
  const hideNavbarPaths = ['/login', '/admin', '/cook/dashboard', '/cook/orders', '/cook/dishes', '/cook/wallet', '/cook/topup', '/cook/pending'];
  const shouldHideNavbar = hideNavbarPaths.some(path => location.pathname.startsWith(path));

  if (shouldHideNavbar) return null;

  const navLinks = [
    { to: '/', label: 'الرئيسية', icon: Home },
    { to: '/cooks', label: 'الطباخات', icon: ChefHat },
    { to: '/my-orders', label: 'طلباتي', icon: Package },
    { to: '/about', label: 'من نحن', icon: Info },
    { to: '/privacy', label: 'الخصوصية', icon: Shield },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`bg-white shadow-md sticky top-0 z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* الشعار */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍲</span>
            <span className="text-2xl font-bold text-orange-600">نَكهة</span>
          </Link>

          {/* روابط Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition ${
                    isActive(link.to)
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* أزرار جانبية */}
          <div className="flex items-center gap-2">
            {/* السلة */}
            <Link
              to="/cart"
              className="relative bg-orange-600 text-white p-2.5 rounded-full hover:bg-orange-700 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemsCount}
                </span>
              )}
            </Link>

            {/* زر القائمة للجوال */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* قائمة الجوال */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                    isActive(link.to)
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;