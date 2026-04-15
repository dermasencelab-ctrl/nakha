import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ManageTopups = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // جلب طلبات الشحن
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'topup_requests'));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // ترتيب حسب الأحدث
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setRequests(data);
    } catch (error) {
      console.error('Error fetching topup requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // قبول طلب الشحن
  const handleApprove = async (request) => {
    if (!confirm(`هل أنت متأكد من قبول طلب شحن ${request.amount} دج للطباخة ${request.cookName}؟\n\nسيتم إضافة المبلغ لرصيدها فوراً.`)) {
      return;
    }

    setActionLoading(request.id);
    try {
      // جلب الرصيد الحالي للطباخة
      const cookRef = doc(db, 'cooks', request.cookId);
      const cookSnap = await getDoc(cookRef);

      if (!cookSnap.exists()) {
        throw new Error('الطباخة غير موجودة');
      }

      const cookData = cookSnap.data();
      const balanceBefore = cookData.balance || 0;
      const balanceAfter = balanceBefore + request.amount;

      // تحديث الرصيد
      await updateDoc(cookRef, {
        balance: balanceAfter,
      });

      // تحديث طلب الشحن
      await updateDoc(doc(db, 'topup_requests', request.id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: currentUser?.uid || 'admin',
      });

      // تسجيل المعاملة
      await addDoc(collection(db, 'transactions'), {
        cookId: request.cookId,
        type: 'topup',
        amount: request.amount,
        description: `💵 شحن رصيد - تحويل #${request.transactionNumber}`,
        balanceBefore,
        balanceAfter,
        topupRequestId: request.id,
        createdAt: serverTimestamp(),
      });

      alert(`✅ تم قبول طلب الشحن!\n\nأُضيف ${request.amount} دج لرصيد ${request.cookName}\nالرصيد الجديد: ${balanceAfter} دج`);
      await fetchRequests();
    } catch (error) {
      console.error('Error approving topup:', error);
      alert('حدث خطأ أثناء القبول');
    } finally {
      setActionLoading(null);
    }
  };

  // فتح نافذة الرفض
  const openRejectModal = (id) => {
    setRejectingId(id);
    setRejectionReason('');
  };

  // تأكيد الرفض
  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('يرجى كتابة سبب الرفض');
      return;
    }

    setActionLoading(rejectingId);
    try {
      await updateDoc(doc(db, 'topup_requests', rejectingId), {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        reviewedAt: serverTimestamp(),
        reviewedBy: currentUser?.uid || 'admin',
      });

      alert('❌ تم رفض الطلب');
      setRejectingId(null);
      setRejectionReason('');
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting topup:', error);
      alert('حدث خطأ أثناء الرفض');
    } finally {
      setActionLoading(null);
    }
  };

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

  // فلترة حسب التبويب
  const filteredRequests = requests.filter((r) => r.status === activeTab);

  // عدّاد كل تبويب
  const counts = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  // إجمالي المبالغ المقبولة
  const totalApproved = requests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* العنوان */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">شحن الأرصدة 💵</h1>
          <Link
            to="/admin"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            ← لوحة التحكم
          </Link>
        </div>

        {/* بانر الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 border-r-4 border-yellow-500 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">⏳ طلبات معلّقة</p>
            <p className="text-3xl font-bold text-yellow-700">{counts.pending}</p>
          </div>
          <div className="bg-green-50 border-r-4 border-green-500 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">✅ طلبات مقبولة</p>
            <p className="text-3xl font-bold text-green-700">{counts.approved}</p>
          </div>
          <div className="bg-blue-50 border-r-4 border-blue-500 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">💰 إجمالي المشحون</p>
            <p className="text-3xl font-bold text-blue-700">
              {totalApproved.toLocaleString('ar-DZ')} <span className="text-lg">دج</span>
            </p>
          </div>
        </div>

        {/* التبويبات */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              activeTab === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⏳ معلّقة
            {counts.pending > 0 && (
              <span className={`mr-2 px-2 py-0.5 rounded-full text-sm ${
                activeTab === 'pending' ? 'bg-white text-yellow-700' : 'bg-yellow-200 text-yellow-700'
              }`}>
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
            ✅ مقبولة ({counts.approved})
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              activeTab === 'rejected'
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ❌ مرفوضة ({counts.rejected})
          </button>
        </div>

        {/* قائمة الطلبات */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">
              {activeTab === 'pending' && 'لا توجد طلبات شحن معلّقة'}
              {activeTab === 'approved' && 'لا توجد طلبات مقبولة'}
              {activeTab === 'rejected' && 'لا توجد طلبات مرفوضة'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* صورة الإيصال */}
                  {request.receiptImage && (
                    <div className="md:w-40 flex-shrink-0">
                      <button
                        onClick={() => setViewingImage(request.receiptImage)}
                        className="block w-full"
                      >
                        <img
                          src={request.receiptImage}
                          alt="إيصال"
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-500 transition cursor-zoom-in"
                        />
                        <p className="text-xs text-orange-600 text-center mt-1 hover:underline">
                          🔍 اضغط للتكبير
                        </p>
                      </button>
                    </div>
                  )}

                  {/* المعلومات */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <p className="text-xs text-gray-500">المبلغ المطلوب</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {request.amount.toLocaleString('ar-DZ')} دج
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-500">📅 تاريخ الطلب</p>
                        <p className="text-sm font-medium">{formatDate(request.createdAt)}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">👩‍🍳 الطباخة:</span>{' '}
                        <span className="font-bold">{request.cookName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">📧 البريد:</span>{' '}
                        <span dir="ltr">{request.cookEmail || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">🔢 رقم التحويل:</span>{' '}
                        <span className="font-mono font-bold text-blue-600" dir="ltr">
                          {request.transactionNumber}
                        </span>
                      </div>
                      {request.notes && (
                        <div>
                          <span className="text-gray-500">📝 ملاحظات:</span>{' '}
                          <span>{request.notes}</span>
                        </div>
                      )}
                      {request.rejectionReason && (
                        <div className="bg-red-50 p-2 rounded mt-2">
                          <span className="text-red-700 font-bold">❌ سبب الرفض:</span>{' '}
                          <span className="text-red-700">{request.rejectionReason}</span>
                        </div>
                      )}
                      {request.reviewedAt && (
                        <div className="text-xs text-gray-400">
                          راجعه الأدمن في: {formatDate(request.reviewedAt)}
                        </div>
                      )}
                    </div>

                    {/* الأزرار */}
                    {activeTab === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={actionLoading === request.id}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {actionLoading === request.id ? '...' : '✅ تأكيد وإضافة الرصيد'}
                        </button>
                        <button
                          onClick={() => openRejectModal(request.id)}
                          disabled={actionLoading === request.id}
                          className="bg-red-100 text-red-700 py-2 px-4 rounded-lg font-bold hover:bg-red-200 transition disabled:opacity-50"
                        >
                          ❌ رفض
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* نافذة عرض الصورة بحجم كامل */}
        {viewingImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 cursor-zoom-out"
            onClick={() => setViewingImage(null)}
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 left-4 text-white text-3xl font-bold hover:text-orange-400"
            >
              ✕
            </button>
            <img
              src={viewingImage}
              alt="إيصال بحجم كامل"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* نافذة سبب الرفض */}
        {rejectingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">سبب الرفض</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none mb-4"
                placeholder="مثلاً: لم يصل التحويل، رقم التحويل غير صحيح..."
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={confirmReject}
                  disabled={actionLoading === rejectingId}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === rejectingId ? 'جاري...' : 'تأكيد الرفض'}
                </button>
                <button
                  onClick={() => setRejectingId(null)}
                  className="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTopups;