import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ArrowRight, Plus, Edit, Trash2, X } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';

function ManageDishes() {
  const [dishes, setDishes] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [filterCook, setFilterCook] = useState('all');
  const [form, setForm] = useState({
    cookId: '',
    name: '',
    description: '',
    image: '',
    price: '',
    availableQuantity: '',
    isReadyToday: false,
    isActive: true,
  });

  const fetchData = async () => {
    const [dishesSnap, cooksSnap] = await Promise.all([
      getDocs(collection(db, 'dishes')),
      getDocs(collection(db, 'cooks')),
    ]);
    setDishes(dishesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCooks(cooksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({
      cookId: '', name: '', description: '', image: '',
      price: '', availableQuantity: '', isReadyToday: false, isActive: true,
    });
    setEditingDish(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: form.price ? Number(form.price) : 0,
      availableQuantity: form.availableQuantity ? Number(form.availableQuantity) : 0,
    };
    if (editingDish) {
      await updateDoc(doc(db, 'dishes', editingDish.id), data);
    } else {
      await addDoc(collection(db, 'dishes'), data);
    }
    resetForm();
    fetchData();
  };

  const handleEdit = (dish) => {
    setEditingDish(dish);
    setForm({
      cookId: dish.cookId || '',
      name: dish.name || '',
      description: dish.description || '',
      image: dish.image || '',
      price: dish.price || '',
      availableQuantity: dish.availableQuantity || '',
      isReadyToday: dish.isReadyToday || false,
      isActive: dish.isActive !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطبق؟')) {
      await deleteDoc(doc(db, 'dishes', id));
      fetchData();
    }
  };

  const getCookName = (cookId) => {
    const cook = cooks.find(c => c.id === cookId);
    return cook ? cook.name : 'غير معروف';
  };

  const filteredDishes = filterCook === 'all'
    ? dishes
    : dishes.filter(d => d.cookId === filterCook);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-dark text-white p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/admin/" className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" /> رجوع
          </Link>
          <h1 className="text-xl font-bold">إدارة الأطباق</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600"
          >
            <Plus className="w-5 h-5" /> إضافة طبق
          </button>

          <select
            value={filterCook}
            onChange={(e) => setFilterCook(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white"
          >
            <option value="all">كل الطباخات</option>
            {cooks.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <p className="text-gray-600 mb-4">{filteredDishes.length} طبق</p>

        <div className="grid md:grid-cols-2 gap-4">
          {filteredDishes.map(dish => (
            <div key={dish.id} className="bg-white p-4 rounded-xl shadow flex gap-4">
              <img src={dish.image} alt={dish.name} className="w-24 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{dish.name}</h3>
                <p className="text-sm text-gray-500">👩‍🍳 {getCookName(dish.cookId)}</p>
                <p className="text-primary font-bold mt-1">{dish.price} دج</p>
                {dish.isReadyToday && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">🔥 جاهز اليوم</span>
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleEdit(dish)} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(dish.id)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal النموذج */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{editingDish ? 'تعديل' : 'إضافة'} طبق</h3>
                <button onClick={resetForm}><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <select
                  required
                  value={form.cookId}
                  onChange={e => setForm({...form, cookId: e.target.value})}
                  className="w-full p-3 border-2 rounded-xl bg-white"
                >
                  <option value="">اختر الطباخة</option>
                  {cooks.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input required placeholder="اسم الطبق" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                <textarea required placeholder="الوصف" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 border-2 rounded-xl" rows="2" />
                <ImageUploader
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                  folder="dishes"
                  label="صورة الطبق"
                />
                <input type="number" required placeholder="السعر (دج)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                <input type="number" placeholder="الكمية المتاحة" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isReadyToday} onChange={e => setForm({...form, isReadyToday: e.target.checked})} />
                  جاهز اليوم
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                  مفعّل
                </label>
                <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold">حفظ</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageDishes;
