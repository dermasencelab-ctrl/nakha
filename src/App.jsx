import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// صفحات المستخدم
import Home from './pages/Home';
import Cooks from './pages/Cooks';
import CookProfile from './pages/CookProfile';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';

// صفحات المصادقة
import Login from './pages/Login';
import CookSignup from './pages/CookSignup';
import CustomerSignup from './pages/CustomerSignup';
import CookPending from './pages/CookPending';
import CookRejected from './pages/CookRejected';
import CookDashboard from './pages/CookDashboard';
import CookDishes from './pages/CookDishes';
import CookOrders from './pages/CookOrders';
import CookWallet from './pages/CookWallet';
import CookTopup from './pages/CookTopup';
import CookSchedule from './pages/CookSchedule';
import CookEditProfile from './pages/CookEditProfile';
import CookRevenue from './pages/CookRevenue';
import RateOrder from './pages/RateOrder';
import Favorites from './pages/Favorites';

// صفحات الأدمن
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCooks from './pages/admin/ManageCooks';
import ManageDishes from './pages/admin/ManageDishes';
import ManageTopups from './pages/admin/ManageTopups';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReports from './pages/admin/AdminReports';
import AdminRatings from './pages/admin/AdminRatings';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* الصفحات العامة */}
        <Route path="/" element={<Home />} />
        <Route path="/cooks" element={<Cooks />} />
        <Route path="/cooks/:id" element={<CookProfile />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/rate/:orderId" element={<RateOrder />} />
<Route path="/cart" element={<Cart />} />
<Route path="/checkout" element={<Checkout />} />
<Route path="/about" element={<About />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
        <Route path="/favorites" element={<Favorites />} />

        {/* صفحات المصادقة */}
        <Route path="/login" element={<Login />} />
        <Route path="/cook/signup" element={<CookSignup />} />
        <Route path="/cook/pending" element={<CookPending />} />
        <Route path="/cook/rejected" element={<CookRejected />} />
        <Route path="/customer/signup" element={<CustomerSignup />} />

        {/* صفحات الطباخة المحمية */}
        <Route
          path="/cook/dashboard"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook/dishes"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookDishes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook/orders"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook/wallet"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookWallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook/topup"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookTopup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook/schedule"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook/edit-profile"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookEditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook/revenue"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookRevenue />
            </ProtectedRoute>
          }
        />

        {/* صفحات الأدمن المحمية */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cooks"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageCooks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dishes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageDishes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/topups"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageTopups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ratings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRatings />
            </ProtectedRoute>
          }
        />

        {/* صفحة 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center" dir="rtl">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-orange-600 mb-4">404</h1>
                <p className="text-gray-600">الصفحة غير موجودة</p>
              </div>
            </div>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;