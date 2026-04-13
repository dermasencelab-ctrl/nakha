import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cooks from './pages/Cooks';
import CookProfile from './pages/CookProfile';
import OrderSuccess from './pages/OrderSuccess';
import Login from './pages/Login';
import CookSignup from './pages/CookSignup';
import CookPending from './pages/CookPending';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCooks from './pages/admin/ManageCooks';
import ManageDishes from './pages/admin/ManageDishes';
import ProtectedRoute from './components/ProtectedRoute';
import MyOrders from './pages/MyOrders';

function App() {
  return (
    <Routes>
      {/* عام */}
      <Route path="/" element={<Home />} />
      <Route path="/cooks" element={<Cooks />} />
      <Route path="/cooks/:id" element={<CookProfile />} />
      <Route path="/order-success" element={<OrderSuccess />} />
<Route path="/my-orders" element={<MyOrders />} />
      {/* مصادقة */}
      <Route path="/login" element={<Login />} />
      <Route path="/cook/signup" element={<CookSignup />} />
      <Route path="/cook/pending" element={<CookPending />} />

      {/* Admin (محمي) */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/cooks" element={<ProtectedRoute requiredRole="admin"><ManageCooks /></ProtectedRoute>} />
      <Route path="/admin/dishes" element={<ProtectedRoute requiredRole="admin"><ManageDishes /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;