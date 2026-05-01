import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5E6]" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          {/* Brand icon with pulse ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-orange-400/30 animate-ping" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-2xl">🍳</span>
            </div>
          </div>
          <p className="text-stone-500 font-semibold text-sm animate-pulse">
            جاري التحميل...
          </p>
        </div>
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

  // Cooks must be approved before accessing any cook route
  if (userProfile.role === 'cook') {
    const cookStatus = userProfile.cookStatus;
    if (cookStatus === 'pending') {
      return <Navigate to="/cook/pending" replace />;
    }
    if (cookStatus === 'rejected') {
      return <Navigate to="/cook/rejected" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;