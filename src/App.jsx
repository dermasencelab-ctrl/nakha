import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cooks from './pages/Cooks';
import CookProfile from './pages/CookProfile';
import OrderSuccess from './pages/OrderSuccess';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCooks from './pages/admin/ManageCooks';
import ManageDishes from './pages/admin/ManageDishes';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cooks" element={<Cooks />} />
      <Route path="/cooks/:id" element={<CookProfile />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/cooks" element={<ProtectedRoute><ManageCooks /></ProtectedRoute>} />
      <Route path="/admin/dishes" element={<ProtectedRoute><ManageDishes /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
