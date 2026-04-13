import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { ChefHat } from 'lucide-react';

function CookSignup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', whatsapp: '',
    description: '', cuisineType: '', image: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'cooks', cred.user.uid), {
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        description: form.description,
        cuisineType: form.cuisineType,
        image: form.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        badges: [],
        isActive: true,
        isVerified: false, // ⏳ ينتظر التوثيق
        isReadyToday: false,
        createdAt: serverTimestamp(),
      });
      navigate('/cook/pending');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'البريد مستخدم بالفعل' : 'حدث خطأ، حاولي مرة أخرى');
    }
    setLoading(false);
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full my-8">
        <div className="text-center mb-6">
          <ChefHat className="w-16 h-16 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-dark">سجّلي كطباخة</h1>
          <p className="text-gray-600 mt-2">انضمي لمنصة نَكهة</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-3">
          <input required placeholder="الاسم الكامل" value={form.name} onChange={update('name')} className="w-full p-3 border-2 rounded-xl" />
          <input type="email" required placeholder="البريد الإلكتروني" value={form.email} onChange={update('email')} className="w-full p-3 border-2 rounded-xl" />
          <input type="password" required placeholder="كلمة السر (6 أحرف على الأقل)" value={form.password} onChange={update('password')} className="w-full p-3 border-2 rounded-xl" />
          <input required placeholder="رقم واتساب (213XXXXXXXXX)" value={form.whatsapp} onChange={update('whatsapp')} className="w-full p-3 border-2 rounded-xl" />
          <input required placeholder="نوع الأكل (تقليدي، حلويات...)" value={form.cuisineType} onChange={update('cuisineType')} className="w-full p-3 border-2 rounded-xl" />
          <textarea required placeholder="وصف مختصر عنك" value={form.description} onChange={update('description')} rows="2" className="w-full p-3 border-2 rounded-xl" />
          <input placeholder="رابط صورة شخصية (اختياري)" value={form.image} onChange={update('image')} className="w-full p-3 border-2 rounded-xl" />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-50">
            {loading ? 'جاري التسجيل...' : 'تسجيل'}
          </button>
        </form>
        <Link to="/login" className="block text-center text-primary mt-4 text-sm font-semibold">
          لدي حساب بالفعل
        </Link>
      </div>
    </div>
  );
}

export default CookSignup;