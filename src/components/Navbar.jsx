import { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  Home,
  ChefHat,
  ShoppingBag,
  ClipboardList,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Info,
  Shield,
  LayoutDashboard,
  Utensils,
  Wallet,
  Settings,
  Heart,
  CalendarClock,
  UserPen,
  BarChart2,
  Star,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { currentUser, userProfile, logout } = useAuth() || {};

  // عدد عناصر السلة (من localStorage أو من حيث تحفظها)
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('nakha_cart') || '[]');
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // استمع لتغييرات السلة في نفس الصفحة
    const interval = setInterval(updateCartCount, 1000);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  // تأثير التمرير على الـ header العلوي
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // إغلاق القائمة عند تغيير الصفحة
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // منع التمرير عندما القائمة مفتوحة
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // إخفاء الـ navbar في صفحات المصادقة
  const hideOnRoutes = ['/login', '/cook/signup'];
  if (hideOnRoutes.includes(location.pathname)) {
    return null;
  }

  // التبويبات السفلية (Bottom Tab Bar)
  const bottomTabs = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { to: '/cooks', icon: ChefHat, label: 'الطباخات' },
    { to: '/cart', icon: ShoppingBag, label: 'السلة', badge: cartCount },
    { to: '/my-orders', icon: ClipboardList, label: 'طلباتي' },
  ];

  const isCook = userProfile?.role === 'cook';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <>
      {/* ============================================ */}
      {/* Top Header - يظهر على كل الشاشات */}
      {/* ============================================ */}
      <header
        dir="rtl"
        className={`fixed top-0 right-0 left-0 z-40 transition-all duration-300 pt-safe ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-orange-100/50'
            : 'bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-md'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 active:scale-95 transition-transform">
            <img
              src="/og-image.png"
              alt="نَكهة"
              className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-orange-500/30"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 items-center justify-center shadow-lg shadow-orange-500/30 hidden">
              <ChefHat className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-orange-600 leading-none">نَكهة</span>
              <span className="text-[10px] text-stone-500 font-medium">أكل بيتي في بشار</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {bottomTabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `relative px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-orange-600'
                  }`
                }
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {tab.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* زر "حسابي" للطباخة المسجّلة */}
            {isCook && (
              <Link
                to="/cook/dashboard"
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-black active:scale-95 transition-all shadow-md shadow-orange-500/30"
              >
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">حسابي</span>
              </Link>
            )}

            {/* زر "حسابي" للأدمن */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 bg-stone-700 hover:bg-stone-800 text-white px-3 py-2 rounded-xl text-xs font-black active:scale-95 transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">الإدارة</span>
              </Link>
            )}

            {/* Cart icon (mobile, next to menu) */}
            <Link
              to="/cart"
              className="md:hidden relative w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="السلة"
            >
              <ShoppingBag className="w-5 h-5 text-orange-600" strokeWidth={2.2} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Menu button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center active:scale-90 transition-all"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5 text-stone-700" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* Bottom Tab Bar - يظهر فقط على الجوال */}
      {/* ============================================ */}
      <nav
        dir="rtl"
        className="md:hidden fixed bottom-0 right-0 left-0 z-40 pb-safe"
      >
        {/* تأثير blur في الخلفية */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-orange-100/60" />

        <div className="relative max-w-6xl mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {bottomTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === '/'}
                  className={({ isActive }) =>
                    `group relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all active:scale-90 ${
                      isActive ? 'text-orange-600' : 'text-stone-400'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* المؤشر العلوي للتبويب النشط */}
                      {isActive && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-full" />
                      )}

                      {/* خلفية دائرية للتبويب النشط */}
                      <div
                        className={`relative flex items-center justify-center transition-all duration-300 ${
                          isActive ? 'scale-110' : 'scale-100'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute inset-0 bg-orange-100 rounded-full -m-2 animate-pulse-slow" />
                        )}
                        <Icon
                          className="relative w-6 h-6"
                          strokeWidth={isActive ? 2.5 : 2}
                        />

                        {/* شارة العدد */}
                        {tab.badge > 0 && (
                          <span className="absolute -top-1.5 -left-2 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                            {tab.badge > 99 ? '99+' : tab.badge}
                          </span>
                        )}
                      </div>

                      {/* اسم التبويب */}
                      <span
                        className={`text-[11px] transition-all ${
                          isActive ? 'font-bold' : 'font-medium'
                        }`}
                      >
                        {tab.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* Side Drawer - القائمة المنزلقة */}
      {/* ============================================ */}
      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        dir="rtl"
        className={`fixed top-0 bottom-0 left-0 z-50 w-[85%] max-w-sm bg-gradient-to-b from-orange-50/50 to-white transition-transform duration-300 ease-out shadow-2xl ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 px-6 pt-safe pb-8 text-white overflow-hidden">
            {/* زخرفة خلفية */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-400/30 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-700/20 rounded-full blur-2xl" />

            <div className="relative pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <ChefHat className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold leading-none">نَكهة</h2>
                    <p className="text-xs text-white/80 mt-1">أكل بيتي بشار</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90 transition-all"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              {/* معلومات المستخدم */}
              {currentUser ? (
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-2xl p-3">
                  <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center">
                    <User className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">
                      {userProfile?.name || currentUser.email || 'مستخدم'}
                    </p>
                    <p className="text-xs text-white/80">
                      {isCook ? 'طباخة' : isAdmin ? 'مدير' : 'عميل'}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 bg-white text-orange-600 font-bold py-3 rounded-2xl active:scale-95 transition-transform shadow-lg"
                >
                  <LogIn className="w-5 h-5" strokeWidth={2.5} />
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>

          {/* Drawer Content - قابل للتمرير */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* روابط الطباخة */}
            {isCook && (
              <MenuSection title="لوحة الطباخة">
                <MenuItem to="/cook/dashboard" icon={LayoutDashboard} label="لوحة التحكم" />
                <MenuItem to="/cook/edit-profile" icon={UserPen} label="تعديل الملف الشخصي" />
                <MenuItem to="/cook/dishes" icon={Utensils} label="أطباقي" />
                <MenuItem to="/cook/orders" icon={ClipboardList} label="الطلبات" />
                <MenuItem to="/cook/wallet" icon={Wallet} label="المحفظة" />
                <MenuItem to="/cook/schedule" icon={CalendarClock} label="أوقات العمل" />
              </MenuSection>
            )}

            {/* روابط الأدمن */}
            {isAdmin && (
              <MenuSection title="لوحة الإدارة">
                <MenuItem to="/admin" icon={LayoutDashboard} label="لوحة التحكم" />
                <MenuItem to="/admin/cooks" icon={ChefHat} label="إدارة الطباخات" />
                <MenuItem to="/admin/dishes" icon={Utensils} label="إدارة الأطباق" />
                <MenuItem to="/admin/topups" icon={Wallet} label="عمليات الشحن" />
                <MenuItem to="/admin/orders" icon={ShoppingBag} label="إدارة الطلبات" />
                <MenuItem to="/admin/reports" icon={BarChart2} label="تقارير الأرباح" />
                <MenuItem to="/admin/ratings" icon={Star} label="إدارة التقييمات" />
              </MenuSection>
            )}

            {/* مفضّلاتي */}
            <MenuSection title="قائمتي">
              <MenuItem to="/favorites" icon={Heart} label="مفضّلاتي" />
            </MenuSection>

            {/* روابط عامة */}
            <MenuSection title="المنصة">
              <MenuItem to="/about" icon={Info} label="عن نَكهة" />
              <MenuItem to="/privacy" icon={Shield} label="سياسة الخصوصية" />
              {!currentUser && (
                <MenuItem to="/cook/signup" icon={ChefHat} label="سجّل كطباخة" />
              )}
            </MenuSection>
          </div>

          {/* زر تسجيل الخروج */}
          {currentUser && (
            <div className="px-4 pb-6 pb-safe border-t border-orange-100 pt-4">
              <button
                onClick={() => {
                  if (logout) logout();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-2xl active:scale-95 transition-all"
              >
                <LogOut className="w-5 h-5" strokeWidth={2.3} />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================ */}
      {/* Spacers - مساحات لتعويض الـ fixed headers */}
      {/* ============================================ */}
      <div className="h-16 pt-safe" aria-hidden="true" />
    </>
  );
}

/* ============================================ */
/* مكوّنات داخلية للقائمة الجانبية */
/* ============================================ */

function MenuSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function MenuItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-3 rounded-2xl font-semibold transition-all active:scale-[0.98] ${
          isActive
            ? 'bg-gradient-to-l from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
            : 'text-stone-700 hover:bg-orange-50'
        }`
      }
    >
      <Icon className="w-5 h-5" strokeWidth={2.2} />
      <span>{label}</span>
    </NavLink>
  );
}