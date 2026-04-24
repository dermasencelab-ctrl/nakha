import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImageUploader from '../components/ImageUploader';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ChefHat,
  Cake,
  Soup,
  Salad,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  X,
  Camera,
} from 'lucide-react';

// أنواع الطباخات
const cookTypes = [
  {
    value: 'home_cook',
    label: 'طباخة حرة',
    desc: 'أطباق يومية متنوعة',
    icon: ChefHat,
    emoji: '👩‍🍳',
    color: 'orange',
  },
  {
    value: 'pastry',
    label: 'حلويات ومعجنات',
    desc: 'حلويات وكيك ومعجنات',
    icon: Cake,
    emoji: '🍰',
    color: 'pink',
  },
  {
    value: 'traditional',
    label: 'أكل تقليدي',
    desc: 'الأكلات الجزائرية التراثية',
    icon: Soup,
    emoji: '🍲',
    color: 'amber',
  },
  {
    value: 'healthy',
    label: 'أكل صحي',
    desc: 'أطباق صحية ودايت',
    icon: Salad,
    emoji: '🥗',
    color: 'green',
  },
];

// التخصصات مصنّفة
const specialtyGroups = [
  {
    title: 'الأطباق الرئيسية',
    items: ['كسكس', 'محاجب', 'حريرة', 'شخشوخة', 'رشتة'],
  },
  {
    title: 'المعجنات',
    items: ['بوراك', 'بريك', 'مسمّن', 'بغرير', 'خبز الدار'],
  },
  {
    title: 'الحلويات',
    items: ['تشاراك', 'مقروط', 'بقلاوة', 'قلب اللوز', 'طمينة', 'رفيس', 'كعك'],
  },
  {
    title: 'أخرى',
    items: ['عصائر طبيعية', 'شوربات', 'سلطات'],
  },
];

const CookSignup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    neighborhood: '',
    bio: '',
    photo: '',
    cookType: 'home_cook',
    specialties: [],
    cookDescription: '',
    socialLink: '',
    portfolioImages: [],
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signupCook } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSpecialty = (specialty) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const validatePhone = (phone) => /^0[5-7][0-9]{8}$/.test(phone);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validation لكل خطوة
  const validateStep = (step) => {
    setError('');
    if (step === 1) {
      if (formData.name.trim().length < 2) {
        setError('الاسم قصير جداً (حرفان على الأقل)');
        return false;
      }
      if (!validateEmail(formData.email)) {
        setError('البريد الإلكتروني غير صحيح');
        return false;
      }
      if (!validatePhone(formData.phone)) {
        setError('رقم الهاتف غير صحيح (10 أرقام، يبدأ بـ 05 أو 06 أو 07)');
        return false;
      }
      if (formData.neighborhood.trim().length < 2) {
        setError('يرجى إدخال الحي');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.cookType) {
        setError('يرجى اختيار نوع النشاط');
        return false;
      }
    }
    if (step === 4) {
      if (formData.password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('كلمتا المرور غير متطابقتين');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      await signupCook(formData.email, formData.password, {
        name: formData.name.trim(),
        phone: formData.phone,
        neighborhood: formData.neighborhood.trim(),
        bio: formData.bio.trim(),
        photo: formData.photo,
        cookType: formData.cookType,
        specialties: [],
        cookDescription: formData.cookDescription.trim(),
        socialLink: formData.socialLink.trim(),
        portfolioImages: formData.portfolioImages,
      });
      navigate('/cook/pending');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجّل مسبقاً');
        setCurrentStep(1);
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صحيح');
        setCurrentStep(1);
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة');
      } else if (err.code === 'auth/phone-already-in-use') {
        setError('رقم الهاتف مسجّل مسبقاً، يرجى استخدام رقم آخر');
        setCurrentStep(1);
      } else if (err.code === 'auth/name-already-in-use') {
        setError('هذا الاسم مسجّل مسبقاً، يرجى استخدام اسم آخر');
        setCurrentStep(1);
      } else {
        setError('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
      setLoading(false);
    }
  };

  const stepLabels = [
    { num: 1, label: 'معلوماتك', icon: User },
    { num: 2, label: 'النشاط', icon: ChefHat },
    { num: 3, label: 'الملف', icon: Sparkles },
    { num: 4, label: 'كلمة المرور', icon: Lock },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
      style={{ paddingBottom: '130px' }}
    >
      {/* زخارف خلفية */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-300/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* ============================================ */}
      {/* Sticky Header مع Stepper */}
      {/* ============================================ */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-orange-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-4">
            <Link
              to="/"
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
            >
              <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-extrabold text-stone-800 leading-none">
                التسجيل كطباخة
              </h1>
              <p className="text-[11px] text-stone-500 mt-1">
                الخطوة {currentStep} من {totalSteps}
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1">
            {stepLabels.map((s, idx) => {
              const isActive = currentStep === s.num;
              const isCompleted = currentStep > s.num;
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : isActive
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-110'
                          : 'bg-white text-stone-400 shadow-sm border border-stone-200'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      ) : (
                        <Icon className="w-4 h-4" strokeWidth={2.4} />
                      )}
                    </div>
                    <p
                      className={`text-[9px] font-bold mt-1 text-center ${
                        isActive
                          ? 'text-orange-600'
                          : isCompleted
                          ? 'text-green-600'
                          : 'text-stone-400'
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 -mt-4 rounded-full transition-all ${
                        currentStep > s.num ? 'bg-green-500' : 'bg-stone-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* المحتوى */}
      {/* ============================================ */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-5">
        {/* رسالة خطأ */}
        {error && (
          <div className="mb-4 bg-red-50 border-r-4 border-red-500 rounded-2xl p-3.5 flex items-start gap-3 animate-slide-up">
            <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-bold text-red-700 flex-1 pt-1">{error}</p>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* الخطوة 1: المعلومات الشخصية */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentStep === 1 && (
          <section className="animate-slide-up space-y-4">
            <StepHeader
              icon={User}
              title="المعلومات الشخصية"
              subtitle="يرجى تعبئة البيانات التالية"
            />

            <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5 space-y-4">
              <InputField
                label="الاسم (سيظهر في صفحتك كطباخة)"
                icon={User}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="الاسم الذي سيراه الزبائن"
                required
              />

              <InputField
                label="البريد الإلكتروني"
                icon={Mail}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                dir="ltr"
                required
                isValid={
                  formData.email.length > 0
                    ? validateEmail(formData.email)
                    : null
                }
              />

              <InputField
                label="رقم الهاتف"
                icon={Phone}
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 10) {
                    setFormData({ ...formData, phone: val });
                  }
                }}
                placeholder="05XXXXXXXX"
                dir="ltr"
                hint="10 أرقام، يبدأ بـ 05 أو 06 أو 07"
                required
                isValid={
                  formData.phone.length === 10
                    ? validatePhone(formData.phone)
                    : null
                }
              />

              <InputField
                label="الحي في بشار"
                icon={MapPin}
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                placeholder="مثلاً: حي البدر"
                required
              />
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* الخطوة 2: نوع النشاط */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentStep === 2 && (
          <section className="animate-slide-up space-y-4">
            <StepHeader
              icon={ChefHat}
              title="نوع النشاط"
              subtitle="اختر ما يناسب نشاطك"
            />

            {/* بطاقات النوع */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cookTypes.map((type) => (
                <CookTypeCard
                  key={type.value}
                  type={type}
                  selected={formData.cookType === type.value}
                  onClick={() =>
                    setFormData({ ...formData, cookType: type.value })
                  }
                />
              ))}
            </div>

            {/* وصف النشاط */}
            <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5">
              <label className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-extrabold text-stone-800">
                  <Sparkles className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                  وصف نشاطك وأنواع الأطباق
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">مطلوب</span>
              </label>
              <textarea
                name="cookDescription"
                value={formData.cookDescription || ''}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition resize-none"
                placeholder="مثلاً: أطبخ الكسكس والشخشوخة والمحاجب، متخصصة في الأكل التقليدي البشاري منذ 10 سنوات..."
              />
              <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                💡 وصف تفصيلي يساعد في قبول طلبك بسرعة أكبر
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5 text-left">
                {(formData.cookDescription || '').length}/500
              </p>
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* الخطوة 3: الملف الشخصي */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentStep === 3 && (
          <section className="animate-slide-up space-y-4">
            <StepHeader
              icon={Sparkles}
              title="الملف الشخصي"
              subtitle="إضافة الصور والأعمال السابقة (اختياري)"
            />

            {/* الصورة الشخصية */}
            <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                <h3 className="text-sm font-extrabold text-stone-800">
                  صورتكِ الشخصية
                </h3>
              </div>
              <ImageUploader
                value={formData.photo}
                onChange={(url) =>
                  setFormData({ ...formData, photo: url })
                }
                folder="cooks"
                label="ارفعي صورة شخصية"
              />
            </div>

            {/* نبذة */}
            <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5">
              <label className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-extrabold text-stone-800">
                  <Sparkles className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                  نبذة عن أكلكِ
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">
                  اختياري
                </span>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                maxLength={300}
                className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition resize-none"
                placeholder="مثلاً: متخصصة في الحلويات التقليدية والمعجنات منذ 10 سنوات..."
              />
              <p className="text-[11px] text-stone-400 mt-1 text-left">
                {formData.bio.length}/300
              </p>
            </div>

            {/* رابط اجتماعي */}
            <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5">
              <label className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-extrabold text-stone-800">
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
                value={formData.socialLink}
                onChange={handleChange}
                dir="ltr"
                className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition"
                placeholder="https://facebook.com/yourpage"
                style={{ textAlign: 'right' }}
              />
              <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                💡 يساعدنا في التأكد من جودة أعمالكِ وتوثيق حسابكِ بسرعة
              </p>
            </div>

            {/* معرض الأعمال */}
            <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-sm font-extrabold text-stone-800">
                  <ImageIcon className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                  أعمالكِ السابقة
                </span>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  {formData.portfolioImages.length}/5
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">
                ارفعي صور من أطباقكِ السابقة ليتعرّف الزبائن على جودة أعمالكِ
              </p>

              {/* صور موجودة */}
              {formData.portfolioImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {formData.portfolioImages.map((img, index) => (
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
                          setFormData((prev) => ({
                            ...prev,
                            portfolioImages: prev.portfolioImages.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                        className="absolute top-1 left-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center active:scale-90 transition shadow-lg"
                      >
                        <X className="w-3 h-3" strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* زر إضافة */}
              {formData.portfolioImages.length < 5 && (
                <ImageUploader
                  value=""
                  onChange={(url) => {
                    if (url) {
                      setFormData((prev) => ({
                        ...prev,
                        portfolioImages: [...prev.portfolioImages, url],
                      }));
                    }
                  }}
                  folder="portfolio"
                  label={`إضافة صورة (${formData.portfolioImages.length}/5)`}
                />
              )}
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* الخطوة 4: كلمة المرور */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentStep === 4 && (
          <section className="animate-slide-up space-y-4">
            <StepHeader
              icon={Lock}
              title="تأمين الحساب"
              subtitle="اختر كلمة مرور قوية"
            />

            <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5 space-y-4">
              {/* كلمة المرور */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5">
                  <Lock className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                  كلمة المرور
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    dir="ltr"
                    className="w-full px-4 py-3 pl-12 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition"
                    placeholder="••••••••"
                    style={{ textAlign: 'right' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl hover:bg-stone-100 flex items-center justify-center active:scale-90 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-stone-500" strokeWidth={2.3} />
                    ) : (
                      <Eye className="w-4 h-4 text-stone-500" strokeWidth={2.3} />
                    )}
                  </button>
                </div>
                {/* مقياس قوة كلمة المرور */}
                <PasswordStrength password={formData.password} />
              </div>

              {/* تأكيد كلمة المرور */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5">
                  <Lock className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                  تأكيد كلمة المرور
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    dir="ltr"
                    className={`w-full px-4 py-3 pl-12 bg-stone-50 border-2 rounded-2xl text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:bg-white transition ${
                      formData.confirmPassword.length === 0
                        ? 'border-stone-200 focus:border-orange-400'
                        : formData.password === formData.confirmPassword
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-red-300 focus:border-red-500'
                    }`}
                    placeholder="••••••••"
                    style={{ textAlign: 'right' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl hover:bg-stone-100 flex items-center justify-center active:scale-90 transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-stone-500" strokeWidth={2.3} />
                    ) : (
                      <Eye className="w-4 h-4 text-stone-500" strokeWidth={2.3} />
                    )}
                  </button>
                </div>
                {formData.confirmPassword.length > 0 && (
                  <p
                    className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${
                      formData.password === formData.confirmPassword
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="w-3 h-3" strokeWidth={3} />
                        كلمتا المرور متطابقتان
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" strokeWidth={3} />
                        كلمتا المرور غير متطابقتين
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* ملخص سريع */}
              <div className="bg-gradient-to-l from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-3.5 mt-4">
                <p className="text-[11px] font-bold text-orange-900 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ملخص طلبكِ
                </p>
                <div className="space-y-1 text-[11px] text-orange-800">
                  <SummaryRow label="الاسم" value={formData.name} />
                  <SummaryRow label="البريد" value={formData.email} />
                  <SummaryRow label="الهاتف" value={formData.phone} ltr />
                  <SummaryRow label="الحي" value={formData.neighborhood} />
                  <SummaryRow
                    label="النشاط"
                    value={
                      cookTypes.find((t) => t.value === formData.cookType)?.label
                    }
                  />
                 {formData.cookDescription && (
                    <SummaryRow
                      label="وصف النشاط"
                      value={formData.cookDescription.length > 30 ? formData.cookDescription.slice(0, 30) + '...' : formData.cookDescription}
                    />
                  )}
                </div>
              </div>

              {/* ملاحظة الموافقة */}
              <div className="text-[11px] text-stone-500 leading-relaxed">
                بتسجيلكِ فإنكِ توافقين على{' '}
                <Link to="/privacy" className="text-orange-600 font-bold">
                  شروط الخدمة
                </Link>{' '}
                وسيتم مراجعة طلبكِ من قبل فريقنا.
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ============================================ */}
      {/* الشريط السفلي الثابت */}
      {/* ============================================ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 md:pb-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl shadow-stone-900/10 border border-stone-100 p-3">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center justify-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 px-4 rounded-2xl text-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" strokeWidth={2.5} />
                  السابق
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-2xl font-extrabold text-sm shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all"
                >
                  التالي
                  <ArrowLeft className="w-4 h-4" strokeWidth={2.8} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-2xl font-extrabold text-sm shadow-lg shadow-green-500/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" strokeWidth={3} />
                       إنشاء الحساب
                    </>
                  )}
                </button>
              )}
            </div>

            {/* رابط تسجيل الدخول */}
            {currentStep === 1 && (
              <div className="text-center mt-2 pt-2 border-t border-stone-100">
                <Link
                  to="/login"
                  className="text-[11px] text-stone-500 hover:text-orange-600 font-semibold active:scale-95 transition inline-flex items-center gap-1"
                >
                    لديك حساب بالفعل؟{' '}
                  <span className="text-orange-600 font-black">تسجيل الدخول</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================ */
/* مكوّنات مساعدة */
/* ============================================ */

function StepHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
        <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
      </div>
      <div>
        <h2 className="text-lg font-extrabold text-stone-800 leading-none">
          {title}
        </h2>
        <p className="text-xs text-stone-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  icon: Icon,
  required,
  hint,
  isValid,
  dir,
  ...props
}) {
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

function CookTypeCard({ type, selected, onClick }) {
  const Icon = type.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-3xl text-right transition-all active:scale-95 overflow-hidden ${
        selected
          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30'
          : 'bg-white border-2 border-stone-200 hover:border-orange-300 text-stone-700 shadow-sm'
      }`}
    >
      {selected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-orange-600" strokeWidth={3} />
        </div>
      )}

      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${
          selected ? 'bg-white/20' : 'bg-orange-50'
        }`}
      >
        <span className="text-2xl">{type.emoji}</span>
      </div>

      <p
        className={`font-extrabold text-sm ${
          selected ? 'text-white' : 'text-stone-800'
        }`}
      >
        {type.label}
      </p>
      <p
        className={`text-[11px] font-semibold mt-0.5 ${
          selected ? 'text-white/90' : 'text-stone-500'
        }`}
      >
        {type.desc}
      </p>
    </button>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    password.length >= 6,
    password.length >= 8,
    /[A-Z]/.test(password) || /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;

  const labels = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'];
  const colors = [
    'bg-red-400',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-green-400',
    'bg-green-500',
  ];
  const textColors = [
    'text-red-600',
    'text-orange-600',
    'text-yellow-600',
    'text-green-600',
    'text-green-700',
  ];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all ${
              i < strength ? colors[strength] : 'bg-stone-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-bold ${textColors[strength]}`}>
        قوة كلمة المرور: {labels[strength]}
      </p>
    </div>
  );
}

function SummaryRow({ label, value, ltr }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold">{label}:</span>
      <span
        className="font-black"
        dir={ltr ? 'ltr' : 'rtl'}
        style={ltr ? { textAlign: 'right' } : {}}
      >
        {value}
      </span>
    </div>
  );
}

export default CookSignup;