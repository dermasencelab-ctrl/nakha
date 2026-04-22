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
        const cookDoc = await getDoc(doc(db, 'cooks', userProfile.cookId));
        if (cookDoc.exists()) {
          setCookData({ id: cookDoc.id, ...cookDoc.data() });
        }

        const dishesQuery = query(
          collection(db, 'dishes'),
          where('cookId', '==', userProfile.cookId)
        );
        const dishesSnapshot = await getDocs(dishesQuery);

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
        <div className="text-orange-600 text-xl">جارٍ التحميل...</div>
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
                لوحة التحكم — إدارة الأطباق والطلبات
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

        {/* بطاقة الرصيد */}
        <Link
          to="/cook/wallet"
          className="block bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-md p-6 mb-6 hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-sm mb-1">💰 الرصيد الحالي</p>
              <p className="text-3xl font-bold">
                {(cookData?.balance || 0).toLocaleString('ar-DZ')} دج
              </p>
              {cookData?.isFoundingMember && cookData?.freeOrdersRemaining > 0 && (
                <p className="text-sm text-white/90 mt-2">
                  🎁 طلبات مجانية متبقية: <span className="font-bold">{cookData.freeOrdersRemaining}</span>
                </p>
              )}
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-center">
              <p className="text-sm">عرض المحفظة →</p>
            </div>
          </div>
        </Link>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6 border-r-4 border-orange-500">
            <div className="text-4xl mb-2">🍽️</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalDishes}</div>
            <div className="text-gray-600">الأطباق المسجّلة</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-r-4 border-blue-500">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalOrders}</div>
            <div className="text-gray-600">إجمالي الطلبات الواردة</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-r-4 border-green-500">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-3xl font-bold text-gray-800">{stats.pendingOrders}</div>
            <div className="text-gray-600">طلبات بانتظار الموافقة</div>
          </div>
        </div>

        {/* الإجراءات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <p className="text-gray-600 text-sm">إضافة وتعديل وإدارة الأطباق</p>
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
                <p className="text-gray-600 text-sm">متابعة الطلبات الواردة وإدارتها</p>
              </div>
            </div>
          </Link>

          <Link
            to="/cook/wallet"
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">💰</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600">
                  محفظتي
                </h3>
                <p className="text-gray-600 text-sm">الرصيد وشحن الحساب وسجل المعاملات</p>
              </div>
            </div>
          </Link>
        </div>

        {/* معلومات الحساب */}
        {cookData && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">معلومات الحساب</h2>
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
                <p className="font-bold text-green-600">✅ حساب مفعّل</p>
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