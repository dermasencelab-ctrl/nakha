import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import ImageUploader from '../components/ImageUploader';
import { ArrowRight, Plus, ChefHat, Clock } from 'lucide-react';

const PREP_TIME_OPTIONS = [
  { value: '30',   label: '30 دقيقة' },
  { value: '60',   label: 'ساعة واحدة' },
  { value: '90',   label: 'ساعة ونصف' },
  { value: '120',  label: 'ساعتان' },
  { value: '180',  label: '3 ساعات' },
  { value: '240',  label: '4 ساعات' },
  { value: '360',  label: '6 ساعات' },
  { value: '480',  label: '8 ساعات' },
  { value: '720',  label: '12 ساعة' },
  { value: '1440', label: 'يوم كامل (24 ساعة)' },
  { value: '2880', label: 'يومان (48 ساعة)' },
];

const PREP_TIME_LABELS = {
  30: '30 دقيقة', 60: 'ساعة', 90: 'ساعة ونصف', 120: 'ساعتان',
  180: '3 ساعات', 240: '4 ساعات', 360: '6 ساعات', 480: '8 ساعات',
  720: '12 ساعة', 1440: '24 ساعة', 2880: 'يومان',
};
const formatPrepTime = (mins) =>
  PREP_TIME_LABELS[mins] || (mins < 60 ? `${mins} دقيقة` : `${Math.floor(mins / 60)} ساعات`);

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

  const units = [
    { value: 'plate', label: '🍽️ طبق/حصة', example: 'كسكس، شخشوخة' },
    { value: 'kg', label: '⚖️ كيلوغرام', example: 'محاجب، مسمّن' },
    { value: 'box', label: '📦 علبة', example: 'حلويات، مقروط' },
    { value: 'piece', label: '🧁 حبة/قطعة', example: 'بوراك، بريك' },
    { value: 'liter', label: '🥤 لتر', example: 'حريرة، عصير' },
    { value: 'dozen', label: '🥚 دزينة (12)', example: 'كعك، محاجب' },
  ];

  const getUnitLabel = (unit) => {
    const labels = {
      plate: 'طبق', kg: 'كغ', box: 'علبة',
      piece: 'حبة', liter: 'لتر', dozen: 'دزينة',
    };
    return labels[unit] || 'وحدة';
  };

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
    if (!formData.prepTime) { alert('يرجى تحديد مدة التحضير — هذا الحقل إلزامي'); return; }

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
    <div className="min-h-screen bg-[#FFF5E6] pb-28" dir="rtl">
      {/* رأس الصفحة الثابت */}
      <header className="sticky top-0 z-30 bg-[#FFF5E6]/95 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/cook/dashboard"
            className="flex items-center gap-1.5 text-stone-500 hover:text-orange-600 transition text-sm font-bold"
          >
            <ArrowRight className="w-4 h-4" />
            لوحة التحكم
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
            <h1 className="font-black text-stone-800 text-base">أطباقي</h1>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 bg-gradient-to-l from-orange-500 to-orange-600 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-sm shadow-orange-500/20 hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة طبق
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="text-center py-16 text-stone-400 font-semibold text-sm">جاري التحميل...</div>
        ) : dishes.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center mt-4">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-black text-stone-800 mb-2">لا توجد أطباق بعد</h3>
            <p className="text-stone-500 text-sm mb-6">ابدئي بإضافة أول طبق لكِ</p>
            <button
              onClick={handleAddNew}
              className="bg-gradient-to-l from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-sm shadow-orange-500/20"
            >
              + إضافة طبق
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {dishes.map((dish) => (
              <div
                key={dish.id}
                className={`bg-white rounded-3xl shadow-sm overflow-hidden transition ${!dish.available ? 'opacity-60' : ''}`}
              >
                {dish.photo && (
                  <img src={dish.photo} alt={dish.name} className="w-full h-44 object-cover" onError={(e) => (e.target.style.display = 'none')} />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="text-base font-black text-stone-800 leading-tight">{dish.name}</h3>
                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap border border-orange-100">
                      {dish.price} دج / {getUnitLabel(dish.unit || 'plate')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-400 mb-2 font-semibold">
                    {categories.find((c) => c.value === dish.category)?.label || dish.category}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {dish.readyNow && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-100">⚡ متاح فوراً</span>
                    )}
                    {dish.prepTime > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                        <Clock className="w-3 h-3" strokeWidth={2.5} />
                        {formatPrepTime(dish.prepTime)}
                      </span>
                    )}
                  </div>

                  {dish.description && (
                    <p className="text-stone-500 text-xs mb-4 line-clamp-2 leading-relaxed">{dish.description}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAvailability(dish)}
                      disabled={actionLoading === dish.id}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
                        dish.available
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {dish.available ? '✅ متوفر' : '⏸️ غير متوفر'}
                    </button>
                    <button
                      onClick={() => handleEdit(dish)}
                      className="bg-blue-50 text-blue-700 px-3 py-2 rounded-xl hover:bg-blue-100 transition text-xs font-bold border border-blue-100"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id)}
                      disabled={actionLoading === dish.id}
                      className="bg-red-50 text-red-600 px-3 py-2 rounded-xl hover:bg-red-100 transition text-xs font-bold border border-red-100"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نموذج الإضافة / التعديل */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-stone-800">
                  {editingDish ? 'تعديل الطبق' : 'إضافة طبق جديد'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center text-stone-500 transition font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-stone-700 mb-2 font-bold text-sm">اسم الطبق *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition text-sm"
                    placeholder="مثلاً: كسكس باللحم"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-2 font-bold text-sm">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition resize-none text-sm"
                    placeholder="مكونات الطبق، طريقة تقديمه..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-700 mb-2 font-bold text-sm">السعر (دج) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      step="10"
                      className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition text-sm"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 mb-2 font-bold text-sm">وحدة القياس *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition text-sm"
                    >
                      {units.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-stone-400 -mt-2">
                  مثال: {units.find(u => u.value === formData.unit)?.example}
                  {formData.price && ` — ${formData.price} دج / ${getUnitLabel(formData.unit)}`}
                </p>

                <div>
                  <label className="block text-stone-700 mb-2 font-bold text-sm">الفئة</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition text-sm"
                  >
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

                <div className="bg-amber-50 rounded-2xl p-4 space-y-3 border border-amber-200">
                  <div>
                    <label className="flex items-center gap-1.5 text-stone-800 mb-2 font-black text-sm">
                      <Clock className="w-4 h-4 text-amber-600" strokeWidth={2.5} />
                      مدة التحضير *
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">إلزامي</span>
                    </label>
                    <select
                      value={formData.prepTime}
                      onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-400 outline-none transition text-sm font-bold text-stone-800"
                    >
                      <option value="">— اختر مدة التحضير —</option>
                      {PREP_TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-amber-700 mt-1.5 leading-relaxed">
                      سيُعرض هذا للزبائن كشارة واضحة على بطاقة طبقك لإدارة توقعاتهم
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-1 border-t border-amber-200">
                    <input
                      type="checkbox"
                      id="readyNow"
                      checked={formData.readyNow}
                      onChange={(e) => setFormData({ ...formData, readyNow: e.target.checked })}
                      className="w-5 h-5 text-orange-600 rounded"
                    />
                    <label htmlFor="readyNow" className="text-stone-700 font-bold text-sm">
                      ⚡ الطبق جاهز الآن — يتوفر تحضير فوري
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-5 h-5 text-orange-600"
                  />
                  <label htmlFor="available" className="text-stone-700 font-bold text-sm">
                    الطبق متوفر للطلب الآن
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-l from-orange-500 to-orange-600 text-white py-3 rounded-2xl font-black text-sm hover:opacity-90 transition disabled:opacity-50 shadow-sm shadow-orange-500/20"
                  >
                    {submitting ? 'جاري الحفظ...' : editingDish ? 'حفظ التعديلات' : 'إضافة الطبق'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 bg-stone-100 text-stone-700 py-3 rounded-2xl font-black text-sm hover:bg-stone-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookDishes;
