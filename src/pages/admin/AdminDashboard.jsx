import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Utensils, LogOut, Home, Wallet, Package, TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight, Activity } from 'lucide-react';
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
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const pendingCooksQuery = query(collection(db, 'cooks'), where('status', '==', 'pending'));
        const pendingCooksSnap = await getDocs(pendingCooksQuery);

        const pendingTopupsQuery = query(collection(db, 'topup_requests'), where('status', '==', 'pending'));
        const pendingTopupsSnap = await getDocs(pendingTopupsQuery);

        const approvedCooksQuery = query(collection(db, 'cooks'), where('status', '==', 'approved'));
        const approvedCooksSnap = await getDocs(approvedCooksQuery);

        const ordersSnap = await getDocs(collection(db, 'orders'));
        const ordersData = ordersSnap.docs.map(d => d.data());

        const completedOrders = ordersData.filter(o => o.status === 'completed');
        const pendingOrders = ordersData.filter(o => o.status === 'pending');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + Math.round((o.totalPrice || 0) * 0.09), 0);

        setStats({
          pendingCooks: pendingCooksSnap.size,
          pendingTopups: pendingTopupsSnap.size,
          totalCooks: approvedCooksSnap.size,
          totalOrders: ordersSnap.size,
          completedOrders: completedOrders.length,
          pendingOrders: pendingOrders.length,
          totalRevenue,
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

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء النور';
  };

  const formatTime = () => {
    return currentTime.toLocaleDateString('ar-DZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalAlerts = stats.pendingCooks + stats.pendingTopups;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" dir="rtl">

      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-l from-orange-600 via-orange-500 to-amber-500" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                🍲
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{greeting()} 👋</h1>
                <p className="text-orange-100 text-sm mt-0.5">{formatTime()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalAlerts > 0 && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold animate-pulse flex items-center gap-2 shadow-lg">
                  <Activity className="w-4 h-4" />
                  {totalAlerts} {totalAlerts === 1 ? 'إشعار' : 'إشعارات'} بانتظار المراجعة
                </div>
              )}
              <Link to="/" className="bg-white/15 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white/25 transition text-sm font-medium border border-white/20">
                <Home className="w-4 h-4" /> الموقع
              </Link>
              <button onClick={handleLogout} className="bg-white/15 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-red-500/80 transition text-sm font-medium border border-white/20">
                <LogOut className="w-4 h-4" /> خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-12">

        {/* الإحصائيات الرئيسية */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* إيرادات العمولات */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5 border border-orange-100 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">إيرادات</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.totalRevenue.toLocaleString('ar-DZ')}</p>
              <p className="text-xs text-gray-500 mt-1">دينار جزائري</p>
            </div>

            {/* الطباخات المعتمدات */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5 border border-orange-100 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-lg">نشطة</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.totalCooks}</p>
              <p className="text-xs text-gray-500 mt-1">طباخة معتمدة</p>
            </div>

            {/* إجمالي الطلبات */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5 border border-orange-100 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg">{stats.completedOrders} مكتمل</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">إجمالي الطلبات</p>
            </div>

            {/* طلبات جديدة */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5 border border-orange-100 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                {stats.pendingOrders > 0 && (
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg animate-pulse">بانتظار</span>
                )}
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.pendingOrders}</p>
              <p className="text-xs text-gray-500 mt-1">طلبات بانتظار الموافقة</p>
            </div>
          </div>
        )}

        {/* إجراءات عاجلة */}
        {(stats.pendingCooks > 0 || stats.pendingTopups > 0) && (
          <div className="bg-gradient-to-l from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5 mb-8 shadow-sm">
            <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              إجراءات تتطلب الاهتمام
            </h3>
            <div className="flex flex-wrap gap-3">
              {stats.pendingCooks > 0 && (
                <Link to="/admin/cooks"
                  className="bg-white border border-red-200 text-red-700 px-5 py-3 rounded-xl font-bold hover:bg-red-50 hover:shadow-md transition flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{stats.pendingCooks} طباخة بانتظار الموافقة</p>
                    <p className="text-xs text-red-500">اضغط للمراجعة</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition" />
                </Link>
              )}
              {stats.pendingTopups > 0 && (
                <Link to="/admin/topups"
                  className="bg-white border border-amber-200 text-amber-700 px-5 py-3 rounded-xl font-bold hover:bg-amber-50 hover:shadow-md transition flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{stats.pendingTopups} طلب شحن بانتظار المراجعة</p>
                    <p className="text-xs text-amber-500">اضغط للمراجعة</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* أدوات الإدارة */}
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-500" />
          أدوات الإدارة
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* إدارة الطباخات */}
          <Link to="/admin/cooks"
            className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-orange-100 hover:border-orange-300 relative">
            {stats.pendingCooks > 0 && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
                  {stats.pendingCooks} جديد
                </span>
              </div>
            )}
            <div className="h-2 bg-gradient-to-l from-orange-400 to-amber-400 group-hover:h-3 transition-all duration-300" />
            <div className="p-7">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <ChefHat className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition">إدارة الطباخات</h3>
              <p className="text-sm text-gray-500 leading-relaxed">مراجعة طلبات التسجيل وإدارة حسابات الطباخات المعتمدات</p>
              <div className="mt-4 flex items-center gap-1 text-orange-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                <span>فتح الصفحة</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* إدارة الأطباق */}
          <Link to="/admin/dishes"
            className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-orange-100 hover:border-orange-300">
            <div className="h-2 bg-gradient-to-l from-rose-400 to-orange-400 group-hover:h-3 transition-all duration-300" />
            <div className="p-7">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-orange-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Utensils className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-rose-600 transition">إدارة الأطباق</h3>
              <p className="text-sm text-gray-500 leading-relaxed">عرض جميع الأطباق المسجّلة ومراقبة المحتوى والأسعار</p>
              <div className="mt-4 flex items-center gap-1 text-rose-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                <span>فتح الصفحة</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* شحن الأرصدة */}
          <Link to="/admin/topups"
            className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-orange-100 hover:border-orange-300 relative">
            {stats.pendingTopups > 0 && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
                  {stats.pendingTopups} جديد
                </span>
              </div>
            )}
            <div className="h-2 bg-gradient-to-l from-emerald-400 to-teal-400 group-hover:h-3 transition-all duration-300" />
            <div className="p-7">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Wallet className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-emerald-600 transition">إدارة الأرصدة</h3>
              <p className="text-sm text-gray-500 leading-relaxed">مراجعة طلبات شحن الأرصدة والموافقة عليها أو رفضها</p>
              <div className="mt-4 flex items-center gap-1 text-emerald-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                <span>فتح الصفحة</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">نَكهة — لوحة الإدارة © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;