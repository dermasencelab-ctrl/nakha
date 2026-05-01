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
import { ArrowRight, Wallet } from 'lucide-react';

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
      const cookDoc = await getDoc(doc(db, 'cooks', userProfile.cookId));
      if (cookDoc.exists()) {
        setCookData({ id: cookDoc.id, ...cookDoc.data() });
      }

      const txQuery = query(
        collection(db, 'transactions'),
        where('cookId', '==', userProfile.cookId)
      );
      const txSnap = await getDocs(txQuery);
      const txData = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      txData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTransactions(txData);

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

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'income') return tx.type === 'welcome_bonus' || tx.type === 'topup';
    if (activeTab === 'expense') return tx.type === 'commission' || tx.type === 'free_order';
    return true;
  });

  const txTypeConfig = {
    welcome_bonus: { label: '🎁 هدية ترحيبية', color: 'text-green-600', sign: '+' },
    topup: { label: '💵 شحن رصيد', color: 'text-green-600', sign: '+' },
    commission: { label: '📋 تسوية طلب', color: 'text-red-500', sign: '-' },
    free_order: { label: '🎁 طلب مجاني', color: 'text-blue-600', sign: '' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5E6]">
        <div className="text-orange-600 font-semibold text-sm">جاري التحميل...</div>
      </div>
    );
  }

  const balance = cookData?.balance || 0;
  const isLowBalance = balance <= LOW_BALANCE_WARNING && balance > 0;
  const isEmptyBalance = balance <= 0;

  const tabs = [
    { key: 'all', label: `الكل (${transactions.length})` },
    { key: 'income', label: '📥 إيداعات' },
    { key: 'expense', label: '📤 تسويات' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF5E6] pb-28" dir="rtl">
      {/* رأس الصفحة */}
      <header className="sticky top-0 z-30 bg-[#FFF5E6]/95 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/cook/dashboard"
            className="flex items-center gap-1.5 text-stone-500 hover:text-orange-600 transition text-sm font-bold"
          >
            <ArrowRight className="w-4 h-4" />
            لوحة التحكم
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
            <h1 className="font-black text-stone-800 text-base">محفظتي</h1>
          </div>
          <Link
            to="/cook/topup"
            className="flex items-center gap-1.5 bg-gradient-to-l from-orange-500 to-orange-600 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-sm shadow-orange-500/20 hover:opacity-90 transition"
          >
            💵 شحن
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* بطاقة الرصيد */}
        <div className={`rounded-3xl shadow-lg p-6 text-white ${
          isEmptyBalance
            ? 'bg-gradient-to-br from-red-500 to-red-700'
            : isLowBalance
            ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
            : 'bg-gradient-to-br from-green-500 to-emerald-700'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-white/80 text-xs font-semibold mb-1">الرصيد الحالي</p>
              <h2 className="text-4xl font-black mb-2">
                {balance.toLocaleString('ar-DZ')} <span className="text-xl font-bold">دج</span>
              </h2>
              {isEmptyBalance && (
                <p className="text-white/90 text-xs font-semibold">
                  ⚠️ رصيدك صفر، يرجى الشحن لمواصلة استقبال الطلبات
                </p>
              )}
              {isLowBalance && (
                <p className="text-white/90 text-xs font-semibold">
                  ⚠️ رصيدك منخفض، ننصح بالشحن قريباً
                </p>
              )}
            </div>
            <Link
              to="/cook/topup"
              className="bg-white/20 backdrop-blur border border-white/30 text-white px-5 py-2.5 rounded-2xl font-black text-sm hover:bg-white/30 transition text-center"
            >
              💵 شحن الرصيد
            </Link>
          </div>
        </div>

        {/* شارة العضو المؤسس */}
        {cookData?.isFoundingMember && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-3xl p-5 shadow-md shadow-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⭐</div>
              <div className="flex-1">
                <p className="font-black text-sm">
                  أنتِ عضوة مؤسسة #{cookData.foundingMemberNumber}
                </p>
                <p className="text-xs text-white/90 mt-1">
                  🎁 طلبات مجانية متبقية: <span className="font-black">{cookData.freeOrdersRemaining || 0}</span>
                  {cookData.freeOrdersUsed > 0 && (
                    <span className="mr-3">| استُخدم: {cookData.freeOrdersUsed}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl shadow-sm p-4 border border-stone-100">
            <p className="text-xs text-stone-400 mb-1 font-semibold">الطلبات المكتملة</p>
            <p className="text-2xl font-black text-blue-600">
              {cookData?.totalOrders || 0}
            </p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-4 border border-stone-100">
            <p className="text-xs text-stone-400 mb-1 font-semibold">إجمالي المعاملات</p>
            <p className="text-2xl font-black text-orange-600">
              {transactions.length}
            </p>
          </div>
        </div>

        {/* طلبات الشحن المعلّقة */}
        {topupRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-5 border-r-4 border-yellow-400">
            <h3 className="font-black text-sm text-stone-800 mb-3">⏳ طلبات شحن قيد المراجعة</h3>
            <div className="space-y-2">
              {topupRequests.filter(r => r.status === 'pending').map((req) => (
                <div key={req.id} className="flex justify-between items-center bg-yellow-50 p-3 rounded-2xl border border-yellow-100">
                  <div>
                    <p className="font-black text-sm">{req.amount} دج</p>
                    <p className="text-xs text-stone-500">
                      رقم التحويل: <span dir="ltr">{req.transactionNumber}</span>
                    </p>
                    <p className="text-xs text-stone-400">{formatDate(req.createdAt)}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-black border border-yellow-200">
                    قيد المراجعة
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* سجل المعاملات */}
        <div className="bg-white rounded-3xl shadow-sm p-5 border border-stone-100">
          <h3 className="text-sm font-black text-stone-800 mb-4">📋 سجل المعاملات</h3>

          {/* تبويبات */}
          <div className="overflow-x-auto no-scrollbar mb-4">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 py-2 px-3.5 rounded-full font-bold text-xs transition ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-l from-orange-500 to-orange-600 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-stone-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-semibold text-sm">لا توجد معاملات حالياً</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => {
                const config = txTypeConfig[tx.type] || { label: tx.type, color: 'text-stone-600', sign: '' };
                return (
                  <div
                    key={tx.id}
                    className="flex justify-between items-start p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition"
                  >
                    <div className="flex-1">
                      <p className="font-black text-stone-800 text-sm">{config.label}</p>
                      <p className="text-xs text-stone-500 mt-1">{tx.description}</p>
                      <p className="text-xs text-stone-400 mt-1">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-left">
                      <p className={`font-black text-base ${config.color}`}>
                        {config.sign}{tx.amount.toLocaleString('ar-DZ')} دج
                      </p>
                      {tx.balanceAfter !== undefined && (
                        <p className="text-xs text-stone-400 mt-0.5">
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
