import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ArrowRight, Plus, Edit2, Trash2, X, Utensils, Search, ChefHat } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';

const ACCENT = '#f43f5e';

const S = {
  bg: {
    background: '#0D0B09',
    backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2117 1px, transparent 0)',
    backgroundSize: '28px 28px',
  },
  card: {
    background: 'linear-gradient(145deg, #1c1713 0%, #141110 100%)',
    border: '1px solid rgba(244,63,94,0.12)',
  },
  modal: {
    background: '#1a1410',
    border: '1px solid rgba(244,63,94,0.22)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
  },
  input: {
    background: '#100e0c',
    border: '1px solid rgba(244,63,94,0.20)',
    color: '#d6d3d1',
  },
  header: {
    background: 'rgba(13,11,9,0.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(244,63,94,0.12)',
  },
};

function ManageDishes() {
  const [dishes, setDishes] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [filterCook, setFilterCook] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    cookId: '', name: '', description: '', image: '',
    price: '', availableQuantity: '', isReadyToday: false, isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    const [dishesSnap, cooksSnap] = await Promise.all([
      getDocs(collection(db, 'dishes')),
      getDocs(collection(db, 'cooks')),
    ]);
    setDishes(dishesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCooks(cooksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ cookId: '', name: '', description: '', image: '', price: '', availableQuantity: '', isReadyToday: false, isActive: true });
    setEditingDish(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, price: form.price ? Number(form.price) : 0, availableQuantity: form.availableQuantity ? Number(form.availableQuantity) : 0 };
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
      cookId: dish.cookId || '', name: dish.name || '', description: dish.description || '',
      image: dish.image || '', price: dish.price || '', availableQuantity: dish.availableQuantity || '',
      isReadyToday: dish.isReadyToday || false, isActive: dish.isActive !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطبق؟')) {
      await deleteDoc(doc(db, 'dishes', id));
      fetchData();
    }
  };

  const getCookName = (cookId) => cooks.find(c => c.id === cookId)?.name || 'غير معروف';

  const filteredDishes = dishes.filter(d => {
    if (filterCook !== 'all' && d.cookId !== filterCook) return false;
    if (search.trim() && !d.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div dir="rtl" className="min-h-screen pb-12" style={S.bg}>
      <header className="sticky top-0 z-30" style={S.header}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
            style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)' }}>
            <ArrowRight className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.4} />
          </Link>
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5" style={{ color: ACCENT }} strokeWidth={2.2} />
            <h1 className="text-base font-extrabold" style={{ color: '#f5f0eb' }}>إدارة الأطباق</h1>
          </div>
          <span className="mr-auto text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: 'rgba(244,63,94,0.12)', color: ACCENT }}>
            {filteredDishes.length} طبق
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-5">
        {/* شريط الأدوات */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition active:scale-95"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #e11d48)`, color: '#fff', boxShadow: `0 4px 20px rgba(244,63,94,0.35)` }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            إضافة طبق
          </button>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#78716c' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن طبق..."
              className="w-full pr-10 pl-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ ...S.input, color: '#d6d3d1' }}
            />
          </div>

          <select
            value={filterCook} onChange={e => setFilterCook(e.target.value)}
            className="px-4 py-2.5 rounded-2xl text-sm outline-none"
            style={{ ...S.input, color: '#d6d3d1', minWidth: '160px' }}
          >
            <option value="all">كل الطباخات</option>
            {cooks.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: '#1c1713' }} />
            ))}
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Utensils className="w-12 h-12 mb-3" style={{ color: '#44403c' }} strokeWidth={1.5} />
            <p className="text-sm" style={{ color: '#78716c' }}>لا توجد أطباق</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDishes.map(dish => (
              <DishCard
                key={dish.id}
                dish={dish}
                cookName={getCookName(dish.cookId)}
                onEdit={() => handleEdit(dish)}
                onDelete={() => handleDelete(dish.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={resetForm}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl"
            style={S.modal}
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 px-6 py-4 flex items-center justify-between"
              style={{ background: '#1a1410', borderBottom: '1px solid rgba(244,63,94,0.12)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(244,63,94,0.15)' }}>
                  <Utensils className="w-4 h-4" style={{ color: ACCENT }} strokeWidth={2.2} />
                </div>
                <h3 className="font-extrabold text-base" style={{ color: '#f5f0eb' }}>
                  {editingDish ? 'تعديل الطبق' : 'إضافة طبق جديد'}
                </h3>
              </div>
              <button onClick={resetForm} className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X className="w-4 h-4" style={{ color: '#a8a29e' }} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#a8a29e' }}>الطباخة</label>
                <select required value={form.cookId} onChange={e => setForm({ ...form, cookId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ ...S.input, color: form.cookId ? '#d6d3d1' : '#78716c' }}>
                  <option value="">اختر الطباخة</option>
                  {cooks.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#a8a29e' }}>اسم الطبق</label>
                <input required placeholder="مثال: كسكس بالدجاج" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                  style={S.input} />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#a8a29e' }}>الوصف</label>
                <textarea required placeholder="وصف الطبق..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                  style={S.input} />
              </div>

              <ImageUploader
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
                folder="dishes"
                label="صورة الطبق"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#a8a29e' }}>السعر (دج)</label>
                  <input type="number" required placeholder="0" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                    style={S.input} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#a8a29e' }}>الكمية المتاحة</label>
                  <input type="number" placeholder="0" value={form.availableQuantity}
                    onChange={e => setForm({ ...form, availableQuantity: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                    style={S.input} />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isReadyToday}
                    onChange={e => setForm({ ...form, isReadyToday: e.target.checked })}
                    className="w-4 h-4 accent-rose-500" />
                  <span className="text-sm" style={{ color: '#d6d3d1' }}>جاهز اليوم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-rose-500" />
                  <span className="text-sm" style={{ color: '#d6d3d1' }}>مفعّل</span>
                </label>
              </div>

              <button type="submit"
                className="w-full py-3 rounded-2xl font-bold text-sm transition active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #e11d48)`, color: '#fff', boxShadow: `0 4px 20px rgba(244,63,94,0.35)` }}>
                {editingDish ? 'حفظ التعديلات' : 'إضافة الطبق'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DishCard({ dish, cookName, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl overflow-hidden transition hover:scale-[1.01]"
      style={{ ...S.card, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
      <div className="relative">
        {dish.image ? (
          <img src={dish.image} alt={dish.name} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.05)' }}>
            <Utensils className="w-10 h-10" style={{ color: '#44403c' }} strokeWidth={1.5} />
          </div>
        )}
        {dish.isReadyToday && (
          <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-1 rounded-full"
            style={{ background: 'rgba(244,63,94,0.9)', color: '#fff' }}>
            🔥 جاهز اليوم
          </span>
        )}
        {!dish.isActive && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(120,113,108,0.9)', color: '#e7e5e4' }}>
              غير مفعّل
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-extrabold text-sm mb-1" style={{ color: '#f5f0eb' }}>{dish.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <ChefHat className="w-3 h-3" style={{ color: '#a8a29e' }} strokeWidth={2.2} />
          <span className="text-xs" style={{ color: '#a8a29e' }}>{cookName}</span>
        </div>
        {dish.description && (
          <p className="text-[11px] mb-2 line-clamp-2" style={{ color: '#78716c' }}>{dish.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-black text-base" style={{ color: ACCENT }}>
            {(dish.price || 0).toLocaleString('ar-DZ')} دج
          </span>
          <div className="flex gap-2">
            <button onClick={onEdit}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-90"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.20)' }}>
              <Edit2 className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.3} />
            </button>
            <button onClick={onDelete}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-90"
              style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.18)' }}>
              <Trash2 className="w-3.5 h-3.5" style={{ color: ACCENT }} strokeWidth={2.3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageDishes;
