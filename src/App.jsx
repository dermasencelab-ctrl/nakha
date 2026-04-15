import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// صفحات المستخدم
import Home from './pages/Home';
import Cooks from './pages/Cooks';
import CookProfile from './pages/CookProfile';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';

// صفحات المصادقة
import Login from './pages/Login';
import CookSignup from './pages/CookSignup';
import CookPending from './pages/CookPending';
import CookDashboard from './pages/CookDashboard';
import CookDishes from './pages/CookDishes';
// صفحات الأدمن
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCooks from './pages/admin/ManageCooks';
import ManageDishes from './pages/admin/ManageDishes';
import CookOrders from './pages/CookOrders';
import RateOrder from './pages/RateOrder';
import CookWallet from './pages/CookWallet';
import CookTopup from './pages/CookTopup';
import ManageTopups from './pages/admin/ManageTopups';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* الصفحات العامة */}
        <Route path="/" element={<Home />} />
        <Route path="/cooks" element={<Cooks />} />
        <Route path="/cooks/:id" element={<CookProfile />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/my-orders" element={<MyOrders />} />
<Route path="/rate/:orderId" element={<RateOrder />} />

        {/* صفحات المصادقة */}
        <Route path="/login" element={<Login />} />
<Route path="/cook/signup" element={<CookSignup />} />
<Route path="/cook/pending" element={<CookPending />} />
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