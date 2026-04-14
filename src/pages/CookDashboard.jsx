import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const CookDashboard = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [cookData, setCookData] = useState(null);
  const [stats, setStats] = useState({
    totalDishes: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCookData = async () => {
      if (!userProfile?.cookId) return;

      try {
        // جلب بيانات الطباخة
        const cookDoc = await getDoc(doc(db, 'cooks', userProfile.cookId));
        if (cookDoc.exists()) {
          setCookData({ id: cookDoc.id, ...cookDoc.data() });
        }

        // عدد الأطباق
        const dishesQuery = query(
          collection(db, 'dishes'),
          where('cookId', '==', userProfile.cookId)
        );
        const dishesSnapshot = await getDocs(dishesQuery);

        // عدد الطلبات
        const ordersQuery = query(
          collection(db, 'orders'),
          where('cookId', '==', userProfile.cookId)
        );
        const ordersSnapshot = await getDocs(ordersQuery);

        const pendingCount = ordersSnapshot.docs.filter(
          (d) => d.data().status === 'pending'
        ).length;

        setStats({
          totalDishes: dishesSnapshot.size,
          totalOrders: ordersSnapshot.size,
          pendingOrders: pendingCount,
        });
      } catch (error) {
        console.error('Error fetching cook data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCookData();
  }, [userProfile]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-orange-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* الترويسة */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-orange-600 mb-2">
                مرحباً، {cookData?.name || 'طباخة'} 👩‍🍳
              </h1>
              <p className="text-gray-600">
                لوحة تحكم نَكهة - أدِيري أكلك وطلباتك من هنا
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6 border-r-4 border-orange-500">
            <div className="text-4xl mb-2">🍽️</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalDishes}</div>
            <div className="text-gray-600">عدد الأطباق</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-r-4 border-blue-500">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalOrders}</div>
            <div className="text-gray-600">إجمالي الطلبات</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-r-4 border-green-500">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-3xl font-bold text-gray-800">{stats.pendingOrders}</div>
            <div className="text-gray-600">طلبات جديدة</div>
          </div>
        </div>

        {/* الإجراءات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link
            to="/cook/dishes"
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">🍳</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600">
                  إدارة أطباقي
                </h3>
                <p className="text-gray-600 text-sm">إضافة، تعديل، وحذف الأطباق</p>
              </div>
            </div>
          </Link>

          <Link
            to="/cook/orders"
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">📋</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600">
                  الطلبات الواردة
                </h3>
                <p className="text-gray-600 text-sm">مراجعة وإدارة طلبات الزبائن</p>
              </div>
            </div>
          </Link>
        </div>

        {/* معلومات الحساب */}
        {cookData && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">معلومات حسابك</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">الاسم:</span>
                <p className="font-bold text-gray-800">{cookData.name}</p>
              </div>
              <div>
                <span className="text-gray-500">الهاتف:</span>
                <p className="font-bold text-gray-800" dir="ltr">{cookData.phone}</p>
              </div>
              <div>
                <span className="text-gray-500">الحي:</span>
                <p className="font-bold text-gray-800">{cookData.neighborhood}</p>
              </div>
              <div>
                <span className="text-gray-500">الحالة:</span>
                <p className="font-bold text-green-600">✅ معتمدة</p>
              </div>
              {cookData.bio && (
                <div className="md:col-span-2">
                  <span className="text-gray-500">نبذة:</span>
                  <p className="text-gray-800">{cookData.bio}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookDashboard;