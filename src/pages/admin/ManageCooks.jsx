import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FOUNDING_MEMBERS } from '../../config/settings';

const ManageCooks = () => {
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  // جلب كل الطباخات
  const fetchCooks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'cooks'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const cooksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCooks(cooksData);
    } catch (error) {
      console.error('Error fetching cooks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCooks();
  }, []);

  // قبول طباخة + إعطاء هدية المؤسسين إذا كانت ضمن أول 15
  const handleApprove = async (cookId) => {
    setActionLoading(cookId);
    try {
      let foundingData = {};

      if (FOUNDING_MEMBERS.enabled) {
        // عدّ المؤسسين الحاليين
        const foundingQuery = query(
          collection(db, 'cooks'),
          where('isFoundingMember', '==', true)
        );
        const foundingSnap = await getDocs(foundingQuery);
        const foundingCount = foundingSnap.size;

        // إذا لسه فيه مكان للمؤسسين
        if (foundingCount < FOUNDING_MEMBERS.maxCount) {
          foundingData = {
            isFoundingMember: true,
            foundingMemberNumber: foundingCount + 1,
            balance: FOUNDING_MEMBERS.welcomeBalance,
            freeOrdersRemaining: FOUNDING_MEMBERS.freeOrders,
            freeOrdersUsed: 0,
            joinedAsFoundingAt: serverTimestamp(),
          };
        }
      }

      // تحديث الطباخة
      await updateDoc(doc(db, 'cooks', cookId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        ...foundingData,
      });

      // إذا حصلت على هدية: نسجّل المعاملة
      if (foundingData.isFoundingMember) {
        await addDoc(collection(db, 'transactions'), {
          cookId,
          type: 'welcome_bonus',
          amount: FOUNDING_MEMBERS.welcomeBalance,
          description: `🎁 هدية ترحيبية - عضو مؤسسة #${foundingData.foundingMemberNumber}`,
          balanceBefore: 0,
          balanceAfter: FOUNDING_MEMBERS.welcomeBalance,
          createdAt: serverTimestamp(),
        });

        alert(
          `✅ تم قبول الطباخة كعضو مؤسسة #${foundingData.foundingMemberNumber}!\n\n` +
          `حصلت على:\n` +
          `💰 ${FOUNDING_MEMBERS.welcomeBalance} دج رصيد\n` +
          `🆓 ${FOUNDING_MEMBERS.freeOrders} طلبات بدون عمولة\n` +
          `⭐ شارة عضو مؤسسة دائمة`
        );
      } else {
        alert('✅ تم قبول الطباخة بنجاح');
      }

      await fetchCooks();
    } catch (error) {
      console.error('Error approving cook:', error);
      alert('حدث خطأ أثناء القبول');
    } finally {
      setActionLoading(null);
    }
  };

  // رفض طباخة
  const handleReject = async (cookId) => {
    if (!confirm('هل أنت متأكد من رفض هذه الطباخة؟')) return;
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), {
        status: 'rejected',
      });
      await fetchCooks();
    } catch (error) {
      console.error('Error rejecting cook:', error);
      alert('حدث خطأ أثناء الرفض');
    } finally {
      setActionLoading(null);
    }
  };

  // إعادة قبول طباخة مرفوضة
  const handleReapprove = async (cookId) => {
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });
      await fetchCooks();
    } catch (error) {
      console.error('Error reapproving cook:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // إيقاف طباخة معتمدة
  const handleSuspend = async (cookId) => {
    if (!confirm('هل تريد إيقاف هذه الطباخة؟')) return;
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), {
        status: 'pending',
      });
      await fetchCooks();
    } catch (error) {
      console.error('Error suspending cook:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // حذف طباخة نهائياً
  const handleDelete = async (cookId) => {
    if (!confirm('⚠️ سيتم حذف الطباخة نهائياً. هل أنت متأكد؟')) return;
    setActionLoading(cookId);
    try {
      await deleteDoc(doc(db, 'cooks', cookId));
      await deleteDoc(doc(db, 'users', cookId));
      await fetchCooks();
    } catch (error) {
      console.error('Error deleting cook:', error);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setActionLoading(null);
    }
  };

  // عدّ المؤسسين الحاليين
  const foundingCount = cooks.filter((c) => c.isFoundingMember).length;
  const foundingSpotsLeft = FOUNDING_MEMBERS.maxCount - foundingCount;

  // فلترة حسب التبويب
  const filteredCooks = cooks.filter((cook) => cook.status === activeTab);

  // عدّاد كل تبويب
  const counts = {
    pending: cooks.filter((c) => c.status === 'pending').length,
    approved: cooks.filter((c) => c.status === 'approved').length,
    rejected: cooks.filter((c) => c.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* العنوان */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">إدارة الطباخات</h1>
          <Link
            to="/admin"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            ← لوحة التحكم
          </Link>
        </div>

        {/* بانر عدّاد المؤسسين */}
        {FOUNDING_MEMBERS.enabled && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-4 mb-6 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎁</div>
                <div>
                  <p className="font-bold text-lg">عرض المؤسسين</p>
                  <p className="text-sm text-white/90">
                    {foundingCount} / {FOUNDING_MEMBERS.maxCount} طباخة انضمت
                  </p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                <p className="text-xs">المتبقي</p>
                <p className="font-bold text-2xl">
                  {foundingSpotsLeft > 0 ? `${foundingSpotsLeft} مكان` : 'انتهى العرض'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* التبويبات */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              activeTab === 'pending'
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⏳ معلّقات
            {counts.pending > 0 && (
              <span className="mr-2 bg-white text-orange-600 px-2 py-0.5 rounded-full text-sm">
                {counts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              activeTab === 'approved'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ✅ معتمدات ({counts.approved})
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              activeTab === 'rejected'
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ❌ مرفوضات ({counts.rejected})
          </button>
        </div>

        {/* قائمة الطباخات */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
        ) : filteredCooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">
              {activeTab === 'pending' && 'لا توجد طلبات معلّقة حالياً'}
              {activeTab === 'approved' && 'لا توجد طباخات معتمدات بعد'}
              {activeTab === 'rejected' && 'لا توجد طباخات مرفوضات'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCooks.map((cook) => (
              <div
                key={cook.id}
                className={`bg-white rounded-xl shadow-sm p-6 border ${
                  cook.isFoundingMember ? 'border-yellow-300 border-2' : 'border-gray-100'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* معلومات الطباخة */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-800">
                        {cook.name}
                      </h3>
                      {cook.isFoundingMember && (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          ⭐ عضو مؤسسة #{cook.foundingMemberNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        📍 <span className="font-medium">الحي:</span> {cook.neighborhood}
                      </p>
                      <p>
                        📱 <span className="font-medium">الهاتف:</span>{' '}
                        <span dir="ltr">{cook.phone}</span>
                      </p>
                      {cook.bio && (
                        <p className="mt-2 text-gray-700">
                          <span className="font-medium">نبذة:</span> {cook.bio}
                        </p>
                      )}

                      {/* معلومات إضافية للمعتمدات */}
                      {activeTab === 'approved' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                          <div className="bg-green-50 px-3 py-2 rounded-lg">
                            <p className="text-xs text-gray-500">الرصيد</p>
                            <p className="font-bold text-green-700">{cook.balance || 0} دج</p>
                          </div>
                          <div className="bg-blue-50 px-3 py-2 rounded-lg">
                            <p className="text-xs text-gray-500">الطلبات المكتملة</p>
                            <p className="font-bold text-blue-700">{cook.totalOrders || 0}</p>
                          </div>
                          {cook.isFoundingMember && (
                            <div className="bg-yellow-50 px-3 py-2 rounded-lg">
                              <p className="text-xs text-gray-500">طلبات مجانية</p>
                              <p className="font-bold text-yellow-700">
                                {cook.freeOrdersRemaining || 0} متبقية
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* الأزرار */}
                  <div className="flex flex-col gap-2 md:w-48">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(cook.id)}
                          disabled={actionLoading === cook.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {actionLoading === cook.id ? '...' : '✅ قبول'}
                        </button>
                        <button
                          onClick={() => handleReject(cook.id)}
                          disabled={actionLoading === cook.id}
                          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition disabled:opacity-50"
                        >
                          ❌ رفض
                        </button>
                      </>
                    )}

                    {activeTab === 'approved' && (
                      <>
                        <Link
                          to={`/cooks/${cook.id}`}
                          className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 transition text-center"
                        >
                          👁️ عرض الملف
                        </Link>
                        <button
                          onClick={() => handleSuspend(cook.id)}
                          disabled={actionLoading === cook.id}
                          className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-bold hover:bg-yellow-200 transition disabled:opacity-50"
                        >
                          ⏸️ إيقاف
                        </button>
                      </>
                    )}

                    {activeTab === 'rejected' && (
                      <button
                        onClick={() => handleReapprove(cook.id)}
                        disabled={actionLoading === cook.id}
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-200 transition disabled:opacity-50"
                      >
                        ↩️ إعادة قبول
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(cook.id)}
                      disabled={actionLoading === cook.id}
                      className="text-red-600 text-sm hover:underline mt-1"
                    >
                      🗑️ حذف نهائي
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCooks;