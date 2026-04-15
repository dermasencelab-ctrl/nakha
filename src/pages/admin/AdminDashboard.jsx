import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Utensils, LogOut, Home, Wallet, Package } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    pendingCooks: 0,
    pendingTopups: 0,
    totalCooks: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // الطباخات المعلّقات
        const pendingCooksQuery = query(
          collection(db, 'cooks'),
          where('status', '==', 'pending')
        );
        const pendingCooksSnap = await getDocs(pendingCooksQuery);

        // طلبات الشحن المعلّقة
        const pendingTopupsQuery = query(
          collection(db, 'topup_requests'),
          where('status', '==', 'pending')
        );
        const pendingTopupsSnap = await getDocs(pendingTopupsQuery);

        // إجمالي الطباخات المعتمدات
        const approvedCooksQuery = query(
          collection(db, 'cooks'),
          where('status', '==', 'approved')
        );
        const approvedCooksSnap = await getDocs(approvedCooksQuery);

        // إجمالي الطلبات
        const ordersSnap = await getDocs(collection(db, 'orders'));

        setStats({
          pendingCooks: pendingCooksSnap.size,
          pendingTopups: pendingTopupsSnap.size,
          totalCooks: approvedCooksSnap.size,
          totalOrders: ordersSnap.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      sessionStorage.removeItem('isAdmin');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-dark text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">لوحة تحكم نَكهة 🍲</h1>
        <div className="flex gap-2">
          <Link to="/" className="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/20">
            <Home className="w-4 h-4" /> الموقع
          </Link>
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* الإحصائيات */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 border-r-4 border-orange-500">
              <p className="text-xs text-gray-600 mb-1">طلبات طباخات معلّقة</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingCooks}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-r-4 border-yellow-500">
              <p className="text-xs text-gray-600 mb-1">طلبات شحن معلّقة</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingTopups}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-r-4 border-green-500">
              <p className="text-xs text-gray-600 mb-1">طباخات معتمدات</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalCooks}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-r-4 border-blue-500">
              <p className="text-xs text-gray-600 mb-1">إجمالي الطلبات</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalOrders}</p>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-dark mb-6">الإدارة</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* إدارة الطباخات */}
          <Link
            to="/admin/cooks"
            className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition text-center relative"
          >
            {stats.pendingCooks > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                {stats.pendingCooks} جديد
              </span>
            )}
            <ChefHat className="w-20 h-20 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-dark">إدارة الطباخات</h3>
            <p className="text-gray-600 mt-2">قبول، رفض، وإدارة الطباخات</p>
          </Link>

          {/* إدارة الأطباق */}
          <Link
            to="/admin/dishes"
            className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition text-center"
          >
            <Utensils className="w-20 h-20 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-dark">إدارة الأطباق</h3>
            <p className="text-gray-600 mt-2">عرض وتعديل أطباق الطباخات</p>
          </Link>

          {/* شحن الأرصدة */}
          <Link
            to="/admin/topups"
            className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition text-center relative"
          >
            {stats.pendingTopups > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                {stats.pendingTopups} جديد
              </span>
            )}
            <Wallet className="w-20 h-20 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-dark">شحن الأرصدة 💵</h3>
            <p className="text-gray-600 mt-2">مراجعة طلبات شحن أرصدة الطباخات</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;