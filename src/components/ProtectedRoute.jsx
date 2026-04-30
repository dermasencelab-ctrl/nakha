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