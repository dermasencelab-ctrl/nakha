import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  return isAdmin ? children : <Navigate to="/admin" />;
}

export default ProtectedRoute;