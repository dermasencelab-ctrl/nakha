import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { LOW_BALANCE_WARNING } from '../config/settings';

const CookWallet = () => {
  const { userProfile } = useAuth();
  const [cookData, setCookData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topupRequests, setTopupRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    if (!userProfile?.cookId) return;
    setLoading(true);
    try {
      // جلب بيانات الطباخة
      const cookDoc = await getDoc(doc(db, 'cooks', userProfile.cookId));
      if (cookDoc.exists()) {
        setCookData({ id: cookDoc.id, ...cookDoc.data() });
      }

      // جلب المعاملات
      const txQuery = query(
        collection(db, 'transactions'),
        where('cookId', '==', userProfile.cookId)
      );
      const txSnap = await getDocs(txQuery);
      const txData = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      txData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTransactions(txData);

      // جلب طلبات الشحن المعلّقة
      const topupQuery = query(
        collection(db, 'topup_requests'),
        where('cookId', '==', userProfile.cookId)
      );
      const topupSnap = await getDocs(topupQuery);
      const topupData = topupSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      topupData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTopupRequests(topupData);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // فلترة المعاملات
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'income') return tx.type === 'welcome_bonus' || tx.type === 'topup';
    if (activeTab === 'expense') return tx.type === 'commission' || tx.type === 'free_order';
    return true;
  });

  // إعدادات أنواع المعاملات
  const txTypeConfig = {
    welcome_bonus: { label: '🎁 هدية ترحيبية', color: 'text-green-600', sign: '+' },
    topup: { label: '💵 شحن رصيد', color: 'text-green-600', sign: '+' },
    commission: { label: '💰 عمولة', color: 'text-red-600', sign: '-' },
    free_order: { label: '🎁 طلب مجاني', color: 'text-blue-600', sign: '' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-orange-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  const balance = cookData?.balance || 0;
  const isLowBalance = balance <= LOW_BALANCE_WARNING && balance > 0;
  const isEmptyBalance = balance <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* العنوان */}
        <div className="mb-6">
          <Link
            to="/cook/dashboard"
            className="text-orange-600 text-sm hover:underline mb-2 inline-block"
          >
            ← العودة للوحة التحكم
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">محفظتي 💰</h1>
        </div>

        {/* بطاقة الرصيد الرئيسية */}
        <div className={`rounded-2xl shadow-xl p-8 mb-6 text-white ${
          isEmptyBalance
            ? 'bg-gradient-to-br from-red-500 to-red-700'
            : isLowBalance
            ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
            : 'bg-gradient-to-br from-green-500 to-emerald-700'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm mb-1">الرصيد الحالي</p>
              <h2 className="text-5xl font-bold mb-2">
                {balance.toLocaleString('ar-DZ')} <span className="text-2xl">دج</span>
              </h2>
              {isEmptyBalance && (
                <p className="text-white/90 text-sm">
                  ⚠️ رصيدك صفر، يرجى الشحن لمواصلة استقبال الطلبات
                </p>
              )}
              {isLowBalance && (
                <p className="text-white/90 text-sm">
                  ⚠️ رصيدك منخفض، ننصح بالشحن قريباً
                </p>
              )}
            </div>
            <Link
              to="/cook/topup"
              className="bg-white text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg text-center"
            >
              💵 شحن الرصيد
            </Link>
          </div>
        </div>

        {/* شارة المؤسسة + الطلبات المجانية */}
        {cookData?.isFoundingMember && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⭐</div>
              <div className="flex-1">
                <p className="font-bold text-lg">
                  أنتِ عضوة مؤسسة #{cookData.foundingMemberNumber}
                </p>
                <p className="text-sm text-white/90 mt-1">
                  🎁 طلبات مجانية متبقية: <span className="font-bold">{cookData.freeOrdersRemaining || 0}</span>
                  {cookData.freeOrdersUsed > 0 && (
                    <span className="mr-3">| استُخدم: {cookData.freeOrdersUsed}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">إجمالي العمولات المخصومة</p>
            <p className="text-2xl font-bold text-red-600">
              {(cookData?.totalCommission || 0).toLocaleString('ar-DZ')} دج
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">الطلبات المكتملة</p>
            <p className="text-2xl font-bold text-blue-600">
              {cookData?.totalOrders || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500 mb-1">عمولة الموقع</p>
            <p className="text-2xl font-bold text-orange-600">9%</p>
          </div>
        </div>

        {/* طلبات الشحن المعلّقة */}
        {topupRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-r-4 border-yellow-500">
            <h3 className="font-bold text-lg text-gray-800 mb-3">⏳ طلبات شحن قيد المراجعة</h3>
            <div className="space-y-2">
              {topupRequests.filter(r => r.status === 'pending').map((req) => (
                <div key={req.id} className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg">
                  <div>
                    <p className="font-bold">{req.amount} دج</p>
                    <p className="text-xs text-gray-600">
                      رقم التحويل: <span dir="ltr">{req.transactionNumber}</span>
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(req.createdAt)}</p>
                  </div>
                  <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                    قيد المراجعة
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* سجل المعاملات */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 سجل المعاملات</h3>

          {/* تبويبات */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                activeTab === 'all' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              الكل ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                activeTab === 'income' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📥 إيداعات
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                activeTab === 'expense' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📤 خصومات
            </button>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>لا توجد معاملات حالياً</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => {
                const config = txTypeConfig[tx.type] || { label: tx.type, color: 'text-gray-600', sign: '' };
                return (
                  <div
                    key={tx.id}
                    className="flex justify-between items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">{config.label}</p>
                      <p className="text-xs text-gray-600 mt-1">{tx.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-left">
                      <p className={`font-bold text-lg ${config.color}`}>
                        {config.sign}{tx.amount.toLocaleString('ar-DZ')} دج
                      </p>
                      {tx.balanceAfter !== undefined && (
                        <p className="text-xs text-gray-500">
                          الرصيد: {tx.balanceAfter.toLocaleString('ar-DZ')} دج
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookWallet;