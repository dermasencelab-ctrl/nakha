import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ArrowRight, Plus, Edit, Trash2, X } from 'lucide-react';

function ManageCooks() {
  const [cooks, setCooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCook, setEditingCook] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    cuisineType: '',
    image: '',
    whatsapp: '',
    badges: '',
    isActive: true,
    isReadyToday: false,
  });

  const fetchCooks = async () => {
    const snapshot = await getDocs(collection(db, 'cooks'));
    setCooks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchCooks(); }, []);

  const resetForm = () => {
    setForm({
      name: '', description: '', cuisineType: '', image: '',
      whatsapp: '', badges: '', isActive: true, isReadyToday: false,
    });
    setEditingCook(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      badges: form.badges.split(',').map(b => b.trim()).filter(Boolean),
    };
    if (editingCook) {
      await updateDoc(doc(db, 'cooks', editingCook.id), data);
    } else {
      await addDoc(collection(db, 'cooks'), data);
    }
    resetForm();
    fetchCooks();
  };

  const handleEdit = (cook) => {
    setEditingCook(cook);
    setForm({
      name: cook.name || '',
      description: cook.description || '',
      cuisineType: cook.cuisineType || '',
      image: cook.image || '',
      whatsapp: cook.whatsapp || '',
      badges: (cook.badges || []).join(', '),
      isActive: cook.isActive !== false,
      isReadyToday: cook.isReadyToday || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الطباخة؟')) {
      await deleteDoc(doc(db, 'cooks', id));
      fetchCooks();
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-dark text-white p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" /> رجوع
          </Link>
          <h1 className="text-xl font-bold">إدارة الطباخات</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 mb-6 hover:bg-orange-600"
        >
          <Plus className="w-5 h-5" /> إضافة طباخة
        </button>

        <div className="grid md:grid-cols-2 gap-4">
          {cooks.map(cook => (
            <div key={cook.id} className="bg-white p-4 rounded-xl shadow flex gap-4">
              <img src={cook.image} alt={cook.name} className="w-24 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{cook.name}</h3>
                <p className="text-sm text-gray-600">{cook.cuisineType}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleEdit(cook)} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cook.id)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">
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
                <h3 className="text-2xl font-bold">{editingCook ? 'تعديل' : 'إضافة'} طباخة</h3>
                <button onClick={resetForm}><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="الاسم" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                <textarea required placeholder="الوصف" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 border-2 rounded-xl" rows="2" />
                <input required placeholder="نوع الأكل (تقليدي، حلويات...)" value={form.cuisineType} onChange={e => setForm({...form, cuisineType: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                <input required placeholder="رابط الصورة" value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                <input required placeholder="رقم واتساب (213XXXXXXXXX)" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                <input placeholder="الشارات (موثوقة, الأكثر طلباً)" value={form.badges} onChange={e => setForm({...form, badges: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isReadyToday} onChange={e => setForm({...form, isReadyToday: e.target.checked})} />
                  متوفرة اليوم
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                  مفعّلة
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

export default ManageCooks;