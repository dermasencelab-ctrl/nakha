import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import ImageUploader from '../components/ImageUploader';

const CookDishes = () => {
  const { userProfile } = useAuth();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'plate',
    category: 'plat_principal',
    photo: '',
    available: true,
    readyNow: false,
    prepTime: '',
  });

  // الفئات — الحلويات ثاني فئة بعد الطبق الرئيسي
  const categories = [
    { value: 'plat_principal', label: '🍲 طبق رئيسي' },
    { value: 'patisserie',     label: '🍰 حلويات تقليدية' },
    { value: 'gateau',         label: '🧁 كيك ومعجنات' },
    { value: 'entree',         label: '🥗 مقبلات وسلطات' },
    { value: 'boulangerie',    label: '🍞 خبز ومعجنات' },
    { value: 'boisson',        label: '🥤 مشروبات وعصائر' },
    { value: 'sauce',          label: '🫙 صلصات ومرافقات' },
    { value: 'autre',          label: '🍽️ أخرى' },
  ];

  // وحدات القياس
  const units = [
    { value: 'plate', label: '🍽️ طبق/حصة', example: 'كسكس، شخشوخة' },
    { value: 'kg', label: '⚖️ كيلوغرام', example: 'محاجب، مسمّن' },
    { value: 'box', label: '📦 علبة', example: 'حلويات، مقروط' },
    { value: 'piece', label: '🧁 حبة/قطعة', example: 'بوراك، بريك' },
    { value: 'liter', label: '🥤 لتر', example: 'حريرة، عصير' },
    { value: 'dozen', label: '🥚 دزينة (12)', example: 'كعك، محاجب' },
  ];

  // دالة عرض الوحدة بالعربي
  const getUnitLabel = (unit) => {
    const labels = {
      plate: 'طبق',
      kg: 'كغ',
      box: 'علبة',
      piece: 'حبة',
      liter: 'لتر',
      dozen: 'دزينة',
    };
    return labels[unit] || 'وحدة';
  };

  // جلب الأطباق
  const fetchDishes = async () => {
    if (!userProfile?.cookId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'dishes'), where('cookId', '==', userProfile.cookId));
      const snapshot = await getDocs(q);
      const dishesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      dishesData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setDishes(dishesData);
    } catch (error) {
      console.error('Error fetching dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDishes(); }, [userProfile]);

  const handleAddNew = () => {
    setEditingDish(null);
    setFormData({
      name: '', description: '', price: '', unit: 'plate',
      category: 'plat_principal', photo: '', available: true,
      readyNow: false, prepTime: '',
    });
    setShowForm(true);
  };

  const handleEdit = (dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name || '',
      description: dish.description || '',
      price: dish.price?.toString() || '',
      unit: dish.unit || 'plate',
      category: dish.category || 'plat_principal',
      photo: dish.photo || '',
      available: dish.available !== false,
      readyNow: dish.readyNow || false,
      prepTime: dish.prepTime?.toString() || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('يرجى إدخال اسم الطبق'); return; }
    if (!formData.price || parseFloat(formData.price) <= 0) { alert('يرجى إدخال سعر صحيح'); return; }

    setSubmitting(true);
    try {
      const dishData = {
        cookId: userProfile.cookId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        unit: formData.unit,
        category: formData.category,
        photo: formData.photo.trim(),
        available: formData.available,
        readyNow: formData.readyNow,
        prepTime: formData.prepTime ? parseInt(formData.prepTime, 10) : null,
      };

      if (editingDish) {
        await updateDoc(doc(db, 'dishes', editingDish.id), { ...dishData, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'dishes'), { ...dishData, createdAt: serverTimestamp() });
      }
      setShowForm(false);
      await fetchDishes();
    } catch (error) {
      console.error('Error saving dish:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (dish) => {
    setActionLoading(dish.id);
    try {
      await updateDoc(doc(db, 'dishes', dish.id), { available: !dish.available });
      await fetchDishes();
    } catch (error) { console.error(error); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (dishId) => {
    if (!confirm('هل أنت متأكدة من حذف هذا الطبق؟')) return;
    setActionLoading(dishId);
    try {
      await deleteDoc(doc(db, 'dishes', dishId));
      await fetchDishes();
    } catch (error) { console.error(error); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link to="/cook/dashboard" className="text-orange-600 text-sm hover:underline mb-2 inline-block">
              ← العودة للوحة التحكم
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">إدارة أطباقي 🍽️</h1>
          </div>
          <button onClick={handleAddNew} className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-md">
            + إضافة طبق جديد
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
        ) : dishes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد أطباق بعد</h3>
            <p className="text-gray-500 mb-6">ابدئي بإضافة أول طبق لكِ</p>
            <button onClick={handleAddNew} className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 transition">
              + إضافة طبق
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dishes.map((dish) => (
              <div key={dish.id} className={`bg-white rounded-2xl shadow-md overflow-hidden border-2 ${dish.available ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                {dish.photo && (
                  <img src={dish.photo} alt={dish.name} className="w-full h-48 object-cover" onError={(e) => (e.target.style.display = 'none')} />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{dish.name}</h3>
                    {/* ═══ السعر مع الوحدة ═══ */}
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                      {dish.price} دج / {getUnitLabel(dish.unit || 'plate')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    {categories.find((c) => c.value === dish.category)?.label || dish.category}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {dish.readyNow && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">⚡ متاح فوراً</span>
                    )}
                    {dish.prepTime > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">⏱️ {dish.prepTime} دقيقة</span>
                    )}
                  </div>

                  {dish.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{dish.description}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAvailability(dish)} disabled={actionLoading === dish.id}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${dish.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {dish.available ? '✅ متوفر' : '⏸️ غير متوفر'}
                    </button>
                    <button onClick={() => handleEdit(dish)} className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition text-sm font-bold">
                      ✏️ تعديل
                    </button>
                    <button onClick={() => handleDelete(dish.id)} disabled={actionLoading === dish.id}
                      className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition text-sm font-bold">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ النموذج المحدّث ═══════ */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingDish ? 'تعديل الطبق' : 'إضافة طبق جديد'}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">اسم الطبق *</label>
                    <input type="text" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="مثلاً: كسكس باللحم" />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">الوصف</label>
                    <textarea value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                      placeholder="مكونات الطبق، طريقة تقديمه..." />
                  </div>

                  {/* ═══ السعر + الوحدة (جنب بعض) ═══ */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">السعر (دج) *</label>
                      <input type="number" value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required min="0" step="10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="500" />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">وحدة القياس *</label>
                      <select value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        {units.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* مثال على الوحدة المختارة */}
                  <p className="text-xs text-gray-500 -mt-2">
                    مثال: {units.find(u => u.value === formData.unit)?.example}
                    {formData.price && ` — ${formData.price} دج / ${getUnitLabel(formData.unit)}`}
                  </p>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">الفئة</label>
                    <select value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <ImageUploader
                    value={formData.photo}
                    onChange={(url) => setFormData({ ...formData, photo: url })}
                    folder="dishes"
                    label="صورة الطبق"
                  />

                  {/* تحضير فوري + مدة التحضير */}
                  <div className="bg-orange-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="readyNow" checked={formData.readyNow}
                        onChange={(e) => setFormData({ ...formData, readyNow: e.target.checked })}
                        className="w-5 h-5 text-orange-600 rounded" />
                      <label htmlFor="readyNow" className="text-gray-700 font-medium text-sm">
                        ⚡ يتوفر تحضير فوري — الطبق جاهز الآن
                      </label>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        ⏱️ مدة التحضير (بالدقائق) — اختياري
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={formData.prepTime}
                        onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                        placeholder="مثال: 30"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="available" checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="w-5 h-5 text-orange-600" />
                    <label htmlFor="available" className="text-gray-700 font-medium">
                      الطبق متوفر للطلب الآن
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={submitting}
                      className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50">
                      {submitting ? 'جاري الحفظ...' : editingDish ? 'حفظ التعديلات' : 'إضافة الطبق'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)}
                      className="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookDishes;