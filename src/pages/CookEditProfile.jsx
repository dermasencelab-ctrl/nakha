import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImageUploader from '../components/ImageUploader';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ArrowRight,
  User,
  Phone,
  MapPin,
  ChefHat,
  Cake,
  Soup,
  Salad,
  Sparkles,
  Camera,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';

const cookTypes = [
  {
    value: 'home_cook',
    label: 'طباخة حرة',
    desc: 'أطباق يومية متنوعة',
    icon: ChefHat,
    emoji: '👩‍🍳',
  },
  {
    value: 'pastry',
    label: 'حلويات ومعجنات',
    desc: 'حلويات وكيك ومعجنات',
    icon: Cake,
    emoji: '🍰',
  },
  {
    value: 'traditional',
    label: 'أكل تقليدي',
    desc: 'الأكلات الجزائرية التراثية',
    icon: Soup,
    emoji: '🍲',
  },
  {
    value: 'healthy',
    label: 'أكل صحي',
    desc: 'أطباق صحية ودايت',
    icon: Salad,
    emoji: '🥗',
  },
];

const validatePhone = (phone) => /^0[5-7][0-9]{8}$/.test(phone);

const CookEditProfile = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    neighborhood: '',
    bio: '',
    photo: '',
    cookType: 'home_cook',
    cookDescription: '',
    socialLink: '',
    portfolioImages: [],
  });

  // حفظ البيانات الأصلية للمقارنة عند التحقق من التكرار
  const [originalName, setOriginalName] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');

  // جلب البيانات الحالية من Firestore
  useEffect(() => {
    if (!userProfile?.cookId) return;

    const fetchCookData = async () => {
      try {
        const snap = await getDoc(doc(db, 'cooks', userProfile.cookId));
        if (snap.exists()) {
          const data = snap.data();
          const loaded = {
            name: data.name || '',
            phone: data.phone || '',
            neighborhood: data.neighborhood || '',
            bio: data.bio || '',
            photo: data.photo || '',
            cookType: data.cookType || 'home_cook',
            cookDescription: data.cookDescription || '',
            socialLink: data.socialLink || '',
            portfolioImages: data.portfolioImages || [],
          };
          setForm(loaded);
          setOriginalName(data.name || '');
          setOriginalPhone(data.phone || '');
        }
      } catch (err) {
        console.error('Error loading cook data:', err);
        setError('تعذّر تحميل البيانات، يرجى إعادة المحاولة');
      } finally {
        setLoading(false);
      }
    };

    fetchCookData();
  }, [userProfile]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSaved(false);
  };

  const validate = async () => {
    if (form.name.trim().length < 2) {
      setError('الاسم قصير جداً (حرفان على الأقل)');
      return false;
    }
    if (!validatePhone(form.phone)) {
      setError('رقم الهاتف غير صحيح (10 أرقام، يبدأ بـ 05 أو 06 أو 07)');
      return false;
    }
    if (form.neighborhood.trim().length < 2) {
      setError('يرجى إدخال الحي');
      return false;
    }

    // التحقق من تكرار الهاتف (مع استبعاد وثيقة الطباخة الحالية)
    if (form.phone !== originalPhone) {
      const phoneSnap = await getDocs(
        query(collection(db, 'cooks'), where('phone', '==', form.phone))
      );
      const phoneTaken = phoneSnap.docs.some(
        (d) => d.id !== userProfile.cookId
      );
      if (phoneTaken) {
        setError('رقم الهاتف مسجّل مسبقاً لدى طباخة أخرى');
        return false;
      }
    }

    // التحقق من تكرار الاسم (مع استبعاد وثيقة الطباخة الحالية)
    if (form.name.trim() !== originalName) {
      const nameSnap = await getDocs(
        query(
          collection(db, 'cooks'),
          where('name', '==', form.name.trim())
        )
      );
      const nameTaken = nameSnap.docs.some(
        (d) => d.id !== userProfile.cookId
      );
      if (nameTaken) {
        setError('هذا الاسم مسجّل مسبقاً، يرجى اختيار اسم آخر');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);

    try {
      const isValid = await validate();
      if (!isValid) {
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, 'cooks', userProfile.cookId), {
        name: form.name.trim(),
        phone: form.phone,
        neighborhood: form.neighborhood.trim(),
        bio: form.bio.trim(),
        photo: form.photo,
        cookType: form.cookType,
        cookDescription: form.cookDescription.trim(),
        socialLink: form.socialLink.trim(),
        portfolioImages: form.portfolioImages,
      });

      setOriginalName(form.name.trim());
      setOriginalPhone(form.phone);
      setSaved(true);

      // العودة للوحة التحكم بعد ثانية
      setTimeout(() => navigate('/cook/dashboard'), 1200);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#FFF5E6] flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-500 font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FFF5E6] pb-44 md:pb-24"
    >
      {/* Header */}
      <header className="sticky top-16 z-20 bg-[#FFF5E6]/95 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/cook/dashboard"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
            aria-label="رجوع"
          >
            <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-stone-800 leading-none">
              تعديل الملف الشخصي
            </h1>
            <p className="text-[11px] text-stone-500 mt-0.5">
              التغييرات تنعكس فوراً على صفحتكِ العامة
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* رسالة خطأ */}
        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-bold text-red-700 flex-1 pt-1">{error}</p>
          </div>
        )}

        {/* رسالة نجاح */}
        {saved && (
          <div className="bg-green-50 border-r-4 border-green-500 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-bold text-green-700 flex-1 pt-1">
              تم حفظ التغييرات بنجاح ✓
            </p>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* القسم 1: المعلومات الأساسية */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section icon={User} title="المعلومات الأساسية">
          <div className="space-y-4">
            <InputField
              label="الاسم (يظهر للزبائن)"
              icon={User}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="الاسم الذي سيراه الزبائن"
              required
            />
            <InputField
              label="رقم الهاتف"
              icon={Phone}
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length <= 10) {
                  setForm((prev) => ({ ...prev, phone: val }));
                  setError('');
                  setSaved(false);
                }
              }}
              placeholder="05XXXXXXXX"
              dir="ltr"
              hint="10 أرقام، يبدأ بـ 05 أو 06 أو 07"
              required
              isValid={
                form.phone.length === 10 ? validatePhone(form.phone) : null
              }
            />
            <InputField
              label="الحي في بشار"
              icon={MapPin}
              name="neighborhood"
              value={form.neighborhood}
              onChange={handleChange}
              placeholder="مثلاً: حي البدر"
              required
            />
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* القسم 2: نوع النشاط */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section icon={ChefHat} title="نوع النشاط">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {cookTypes.map((type) => (
              <CookTypeCard
                key={type.value}
                type={type}
                selected={form.cookType === type.value}
                onClick={() => {
                  setForm((prev) => ({ ...prev, cookType: type.value }));
                  setSaved(false);
                }}
              />
            ))}
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5">
              <Sparkles className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
              وصف نشاطكِ وأنواع الأطباق
            </label>
            <textarea
              name="cookDescription"
              value={form.cookDescription}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition resize-none"
              placeholder="مثلاً: أحضّر الحلويات التقليدية والمعجنات، أو أطبخ الكسكس والأطباق المنزلية..."
            />
            <p className="text-[11px] text-stone-400 mt-1 text-left">
              {form.cookDescription.length}/500
            </p>
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* القسم 3: الصورة والنبذة */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section icon={Camera} title="الصورة الشخصية والنبذة">
          {/* الصورة الشخصية */}
          <div className="mb-4">
            <p className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-2">
              <Camera className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
              صورتكِ الشخصية
            </p>
            <ImageUploader
              value={form.photo}
              onChange={(url) => {
                setForm((prev) => ({ ...prev, photo: url }));
                setSaved(false);
              }}
              folder="cooks"
              label=""
            />
          </div>

          {/* النبذة */}
          <div className="mb-4">
            <label className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <Sparkles className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                نبذة عن أكلكِ
              </span>
              <span className="text-[10px] text-stone-400 font-semibold">
                اختياري
              </span>
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition resize-none"
              placeholder="مثلاً: متخصصة في الحلويات التقليدية منذ 10 سنوات..."
            />
            <p className="text-[11px] text-stone-400 mt-1 text-left">
              {form.bio.length}/300
            </p>
          </div>

          {/* رابط اجتماعي */}
          <div>
            <label className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <LinkIcon className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                صفحة فيسبوك / إنستغرام
              </span>
              <span className="text-[10px] text-stone-400 font-semibold">
                اختياري
              </span>
            </label>
            <input
              type="url"
              name="socialLink"
              value={form.socialLink}
              onChange={handleChange}
              dir="ltr"
              className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition"
              placeholder="https://facebook.com/yourpage"
              style={{ textAlign: 'right' }}
            />
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* القسم 4: معرض الأعمال */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section icon={ImageIcon} title="معرض الأعمال">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-stone-500 leading-relaxed">
              أضيفي صور من أطباقكِ لتُبرزي جودة عملكِ للزبائن
            </p>
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              {form.portfolioImages.length}/5
            </span>
          </div>

          {form.portfolioImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {form.portfolioImages.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-2xl overflow-hidden group"
                >
                  <img
                    src={img}
                    alt={`عمل ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        portfolioImages: prev.portfolioImages.filter(
                          (_, i) => i !== index
                        ),
                      }));
                      setSaved(false);
                    }}
                    className="absolute top-1 left-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center active:scale-90 transition shadow-lg"
                  >
                    <X className="w-3 h-3" strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {form.portfolioImages.length < 5 && (
            <ImageUploader
              value=""
              onChange={(url) => {
                if (url) {
                  setForm((prev) => ({
                    ...prev,
                    portfolioImages: [...prev.portfolioImages, url],
                  }));
                  setSaved(false);
                }
              }}
              folder="portfolio"
              label={`إضافة صورة (${form.portfolioImages.length}/5)`}
            />
          )}
        </Section>
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* شريط الحفظ السفلي الثابت */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 px-3 pb-3 md:pb-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl shadow-stone-900/10 border border-stone-100 p-3">
            <div className="flex gap-2">
              <Link
                to="/cook/dashboard"
                className="flex items-center justify-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 px-5 rounded-2xl text-sm active:scale-95 transition-all"
              >
                إلغاء
              </Link>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm active:scale-[0.98] transition-all shadow-lg ${
                  saved
                    ? 'bg-green-500 shadow-green-500/30 text-white'
                    : 'bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/30'
                } disabled:opacity-70 disabled:cursor-wait`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                    جاري الحفظ...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4" strokeWidth={3} />
                    تم الحفظ ✓
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" strokeWidth={2.5} />
                    حفظ التغييرات
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* بطاقة قسم */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-orange-600" strokeWidth={2.4} />
        </div>
        <h2 className="text-sm font-extrabold text-stone-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* حقل إدخال */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function InputField({ label, icon: Icon, required, hint, isValid, dir, ...props }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5">
        <Icon className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          {...props}
          dir={dir}
          style={dir === 'ltr' ? { textAlign: 'right' } : {}}
          className={`w-full px-4 py-3 bg-stone-50 border-2 rounded-2xl text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:bg-white transition ${
            isValid === false
              ? 'border-red-300 focus:border-red-500'
              : isValid === true
              ? 'border-green-300 focus:border-green-500'
              : 'border-stone-200 focus:border-orange-400'
          }`}
        />
        {isValid === true && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      {hint && <p className="text-[11px] text-stone-500 mt-1.5">{hint}</p>}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* بطاقة نوع الطباخة */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CookTypeCard({ type, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-3xl text-right transition-all active:scale-95 overflow-hidden ${
        selected
          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30'
          : 'bg-stone-50 border-2 border-stone-200 hover:border-orange-300 text-stone-700'
      }`}
    >
      {selected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-orange-600" strokeWidth={3} />
        </div>
      )}
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${
          selected ? 'bg-white/20' : 'bg-orange-50'
        }`}
      >
        <span className="text-xl">{type.emoji}</span>
      </div>
      <p className={`font-extrabold text-sm ${selected ? 'text-white' : 'text-stone-800'}`}>
        {type.label}
      </p>
      <p className={`text-[11px] font-semibold mt-0.5 ${selected ? 'text-white/90' : 'text-stone-500'}`}>
        {type.desc}
      </p>
    </button>
  );
}

export default CookEditProfile;
