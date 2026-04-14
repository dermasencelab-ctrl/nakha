import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-orange-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  // غير مسجّل دخول
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // لا يوجد ملف تعريف
  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  // التحقق من الدور
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  // طباخة لكن لسة pending
  if (userProfile.role === 'cook') {
    // نحتاج جلب status من cooks (سنتعامل معها داخل CookDashboard لاحقاً)
    // هنا فقط نسمح بالوصول، والتحقق من status يتم في الصفحة نفسها
  }

  return children;
};

export default ProtectedRoute;