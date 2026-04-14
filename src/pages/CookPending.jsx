import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CookPending = () => {
  const { logout, userProfile } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>

        <h1 className="text-2xl font-bold text-orange-600 mb-4">
          حسابك قيد المراجعة
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          شكراً لتسجيلك في <span className="font-bold text-orange-600">نَكهة</span>! 🌟
          <br />
          فريقنا يراجع طلبك الآن وسيتم تفعيل حسابك خلال 24-48 ساعة.
          <br /><br />
          سنتواصل معك عبر البريد الإلكتروني عند تفعيل الحساب.
        </p>

        {userProfile && (
          <div className="bg-orange-50 rounded-lg p-4 mb-6 text-sm text-gray-700">
            <p className="font-medium">البريد المسجّل:</p>
            <p className="text-orange-600 font-bold" dir="ltr">{userProfile.email}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition"
          >
            تسجيل الخروج
          </button>

          <Link
            to="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CookPending;