import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, addDoc,
  serverTimestamp, query, orderBy, where,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FOUNDING_MEMBERS } from '../../config/settings';

const ManageCooks = () => {
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedCook, setSelectedCook] = useState(null); // للـ Modal

  // أنواع الطباخات
  const cookTypeLabels = {
    home_cook: '👩‍🍳 طباخة حرة',
    pastry: '🍰 حلويات ومعجنات',
    traditional: '🍲 أكل تقليدي',
    healthy: '🥗 أكل صحي',
  };

  const fetchCooks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'cooks'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const cooksData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCooks(cooksData);
    } catch (error) {
      console.error('Error fetching cooks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCooks(); }, []);

  const handleApprove = async (cookId) => {
    setActionLoading(cookId);
    try {
      let foundingData = {};
      if (FOUNDING_MEMBERS.enabled) {
        const foundingQuery = query(collection(db, 'cooks'), where('isFoundingMember', '==', true));
        const foundingSnap = await getDocs(foundingQuery);
        const foundingCount = foundingSnap.size;
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

      await updateDoc(doc(db, 'cooks', cookId), {
        status: 'approved', approvedAt: serverTimestamp(), ...foundingData,
      });

      if (foundingData.isFoundingMember) {
        await addDoc(collection(db, 'transactions'), {
          cookId, type: 'welcome_bonus',
          amount: FOUNDING_MEMBERS.welcomeBalance,
          description: `🎁 هدية ترحيبية - عضو مؤسسة #${foundingData.foundingMemberNumber}`,
          balanceBefore: 0, balanceAfter: FOUNDING_MEMBERS.welcomeBalance,
          createdAt: serverTimestamp(),
        });
        alert(`✅ تم قبول الطباخة كعضو مؤسسة #${foundingData.foundingMemberNumber}!\n\n💰 ${FOUNDING_MEMBERS.welcomeBalance} دج رصيد\n🆓 ${FOUNDING_MEMBERS.freeOrders} طلبات بدون عمولة\n⭐ شارة عضو مؤسسة دائمة`);
      } else {
        alert('✅ تم قبول الطباخة بنجاح');
      }

      setSelectedCook(null);
      await fetchCooks();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء القبول');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (cookId) => {
    const reason = prompt('سبب الرفض (اختياري):');
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), {
        status: 'rejected', rejectionReason: reason || '',
      });
      setSelectedCook(null);
      await fetchCooks();
    } catch (error) { console.error(error); alert('حدث خطأ'); }
    finally { setActionLoading(null); }
  };

  const handleReapprove = async (cookId) => {
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), { status: 'approved', approvedAt: serverTimestamp() });
      await fetchCooks();
    } catch (error) { console.error(error); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (cookId) => {
    if (!confirm('هل تريد إيقاف هذه الطباخة؟')) return;
    setActionLoading(cookId);
    try {
      await updateDoc(doc(db, 'cooks', cookId), { status: 'pending' });
      await fetchCooks();
    } catch (error) { console.error(error); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (cookId) => {
    if (!confirm('⚠️ سيتم حذف الطباخة نهائياً. هل أنت متأكد؟')) return;
    setActionLoading(cookId);
    try {
      await deleteDoc(doc(db, 'cooks', cookId));
      await deleteDoc(doc(db, 'users', cookId));
      setSelectedCook(null);
      await fetchCooks();
    } catch (error) { console.error(error); alert('حدث خطأ'); }
    finally { setActionLoading(null); }
  };

  const foundingCount = cooks.filter((c) => c.isFoundingMember).length;
  const foundingSpotsLeft = FOUNDING_MEMBERS.maxCount - foundingCount;
  const filteredCooks = cooks.filter((cook) => cook.status === activeTab);
  const counts = {
    pending: cooks.filter((c) => c.status === 'pending').length,
    approved: cooks.filter((c) => c.status === 'approved').length,
    rejected: cooks.filter((c) => c.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">إدارة الطباخات</h1>
          <Link to="/admin" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
            ← لوحة التحكم
          </Link>
        </div>

        {/* بانر المؤسسين */}
        {FOUNDING_MEMBERS.enabled && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-4 mb-6 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎁</div>
                <div>
                  <p className="font-bold text-lg">عرض المؤسسين</p>
                  <p className="text-sm text-white/90">{foundingCount} / {FOUNDING_MEMBERS.maxCount} طباخة انضمت</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                <p className="text-xs">المتبقي</p>
                <p className="font-bold text-2xl">{foundingSpotsLeft > 0 ? `${foundingSpotsLeft} مكان` : 'انتهى العرض'}</p>
              </div>
            </div>
          </div>
        )}

        {/* التبويبات */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-2 flex gap-2">
          <button onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${activeTab === 'pending' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            ⏳ معلّقات
            {counts.pending > 0 && <span className="mr-2 bg-white text-orange-600 px-2 py-0.5 rounded-full text-sm">{counts.pending}</span>}
          </button>
          <button onClick={() => setActiveTab('approved')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${activeTab === 'approved' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            ✅ معتمدات ({counts.approved})
          </button>
          <button onClick={() => setActiveTab('rejected')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${activeTab === 'rejected' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            ❌ مرفوضات ({counts.rejected})
          </button>
        </div>

        {/* القائمة */}
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
              <div key={cook.id}
                className={`bg-white rounded-xl shadow-sm p-5 border ${cook.isFoundingMember ? 'border-yellow-300 border-2' : 'border-gray-100'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* صورة + معلومات أساسية */}
                  <div className="flex items-start gap-4 flex-1">
                    {cook.photo ? (
                      <img src={cook.photo} alt={cook.name} className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-3xl flex-shrink-0">👩‍🍳</div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-800">{cook.name}</h3>
                        {cook.isFoundingMember && (
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">⭐ #{cook.foundingMemberNumber}</span>
                        )}
                        {cook.cookType && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            {cookTypeLabels[cook.cookType] || cook.cookType}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-0.5">
                        <p>📍 {cook.neighborhood} &nbsp;|&nbsp; 📱 <span dir="ltr">{cook.phone}</span></p>
                        {cook.specialties?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cook.specialties.slice(0, 4).map(s => (
                              <span key={s} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                            {cook.specialties.length > 4 && (
                              <span className="text-xs text-gray-500">+{cook.specialties.length - 4} أخرى</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* إحصائيات للمعتمدات */}
                      {activeTab === 'approved' && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">💰 {cook.balance || 0} دج</span>
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">📦 {cook.totalOrders || 0} طلب</span>
                          {cook.averageRating > 0 && (
                            <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg text-xs font-bold">⭐ {cook.averageRating?.toFixed(1)}</span>
                          )}
                          {cook.isFoundingMember && (
                            <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold">🆓 {cook.freeOrdersRemaining || 0} مجانية</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* الأزرار */}
                  <div className="flex flex-col gap-2 md:w-44">
                    {/* زر عرض التفاصيل — يظهر دائماً */}
                    <button onClick={() => setSelectedCook(cook)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition text-sm">
                      🔍 عرض التفاصيل
                    </button>

                    {activeTab === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(cook.id)} disabled={actionLoading === cook.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50">
                          {actionLoading === cook.id ? '...' : '✅ قبول'}
                        </button>
                        <button onClick={() => handleReject(cook.id)} disabled={actionLoading === cook.id}
                          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition disabled:opacity-50">
                          ❌ رفض
                        </button>
                      </>
                    )}

                    {activeTab === 'approved' && (
                      <>
                        <Link to={`/cooks/${cook.id}`}
                          className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 transition text-center text-sm">
                          👁️ الملف العام
                        </Link>
                        <button onClick={() => handleSuspend(cook.id)} disabled={actionLoading === cook.id}
                          className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-bold hover:bg-yellow-200 transition disabled:opacity-50 text-sm">
                          ⏸️ إيقاف
                        </button>
                      </>
                    )}

                    {activeTab === 'rejected' && (
                      <button onClick={() => handleReapprove(cook.id)} disabled={actionLoading === cook.id}
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-200 transition disabled:opacity-50">
                        ↩️ إعادة قبول
                      </button>
                    )}

                    <button onClick={() => handleDelete(cook.id)} disabled={actionLoading === cook.id}
                      className="text-red-500 text-xs hover:underline mt-1">
                      🗑️ حذف نهائي
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ Modal عرض تفاصيل الطباخة ═══════ */}
        {selectedCook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">ملف الطباخة</h2>
                  <button onClick={() => setSelectedCook(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                {/* الصورة الشخصية + الاسم */}
                <div className="flex items-center gap-4 mb-6">
                  {selectedCook.photo ? (
                    <img src={selectedCook.photo} alt={selectedCook.name} className="w-24 h-24 rounded-full object-cover border-3 border-orange-300" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-5xl">👩‍🍳</div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedCook.name}</h3>
                    {selectedCook.cookType && (
                      <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium mt-1 inline-block">
                        {cookTypeLabels[selectedCook.cookType] || selectedCook.cookType}
                      </span>
                    )}
                    <p className={`text-sm mt-1 font-bold ${
                      selectedCook.status === 'approved' ? 'text-green-600' :
                      selectedCook.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {selectedCook.status === 'approved' ? '✅ معتمدة' :
                       selectedCook.status === 'rejected' ? '❌ مرفوضة' : '⏳ معلّقة'}
                    </p>
                  </div>
                </div>

                {/* المعلومات الأساسية */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                  <h4 className="font-bold text-gray-700 mb-2">📋 المعلومات الأساسية</h4>
                  <p className="text-sm"><span className="font-medium text-gray-600">📍 الحي:</span> {selectedCook.neighborhood}</p>
                  <p className="text-sm"><span className="font-medium text-gray-600">📱 الهاتف:</span> <span dir="ltr">{selectedCook.phone}</span></p>
                  {selectedCook.bio && (
                    <p className="text-sm"><span className="font-medium text-gray-600">📝 نبذة:</span> {selectedCook.bio}</p>
                  )}
                </div>

                {/* التخصصات */}
                {selectedCook.specialties?.length > 0 && (
                  <div className="bg-orange-50 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-gray-700 mb-2">🍽️ التخصصات</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCook.specialties.map(s => (
                        <span key={s} className="bg-white text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* رابط السوشيال ميديا */}
                {selectedCook.socialLink && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-gray-700 mb-2">🔗 صفحة السوشيال ميديا</h4>
                    <a href={selectedCook.socialLink} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all">
                      {selectedCook.socialLink}
                    </a>
                  </div>
                )}

                {/* صور الأعمال السابقة */}
                {selectedCook.portfolioImages?.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-gray-700 mb-3">📸 صور أعمال سابقة ({selectedCook.portfolioImages.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedCook.portfolioImages.map((img, index) => (
                        <a key={index} href={img} target="_blank" rel="noopener noreferrer">
                          <img src={img} alt={`عمل ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-white shadow hover:shadow-lg transition cursor-pointer" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* تحذير: لا صور ولا رابط */}
                {!selectedCook.socialLink && (!selectedCook.portfolioImages || selectedCook.portfolioImages.length === 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ هذه الطباخة لم تقدّم رابط سوشيال ميديا ولا صور أعمال سابقة. تأكد من جودتها قبل القبول.
                    </p>
                  </div>
                )}

                {/* إحصائيات (للمعتمدات) */}
                {selectedCook.status === 'approved' && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-gray-700 mb-2">📊 الإحصائيات</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">الرصيد</p>
                        <p className="font-bold text-green-600">{selectedCook.balance || 0} دج</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">الطلبات</p>
                        <p className="font-bold text-blue-600">{selectedCook.totalOrders || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">التقييم</p>
                        <p className="font-bold text-yellow-600">{selectedCook.averageRating?.toFixed(1) || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">العمولات</p>
                        <p className="font-bold text-red-600">{selectedCook.totalCommission || 0} دج</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* سبب الرفض (للمرفوضات) */}
                {selectedCook.status === 'rejected' && selectedCook.rejectionReason && (
                  <div className="bg-red-50 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-red-700 mb-1">❌ سبب الرفض</h4>
                    <p className="text-sm text-red-600">{selectedCook.rejectionReason}</p>
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {selectedCook.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(selectedCook.id)} disabled={actionLoading === selectedCook.id}
                        className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50">
                        {actionLoading === selectedCook.id ? 'جاري القبول...' : '✅ قبول الطباخة'}
                      </button>
                      <button onClick={() => handleReject(selectedCook.id)} disabled={actionLoading === selectedCook.id}
                        className="flex-1 bg-red-100 text-red-700 px-6 py-3 rounded-lg font-bold hover:bg-red-200 transition disabled:opacity-50">
                        ❌ رفض
                      </button>
                    </>
                  )}
                  {selectedCook.status === 'approved' && (
                    <button onClick={() => handleSuspend(selectedCook.id)} disabled={actionLoading === selectedCook.id}
                      className="flex-1 bg-yellow-100 text-yellow-700 px-6 py-3 rounded-lg font-bold hover:bg-yellow-200 transition">
                      ⏸️ إيقاف مؤقت
                    </button>
                  )}
                  {selectedCook.status === 'rejected' && (
                    <button onClick={() => handleReapprove(selectedCook.id)} disabled={actionLoading === selectedCook.id}
                      className="flex-1 bg-green-100 text-green-700 px-6 py-3 rounded-lg font-bold hover:bg-green-200 transition">
                      ↩️ إعادة قبول
                    </button>
                  )}
                  <button onClick={() => setSelectedCook(null)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition">
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCooks;