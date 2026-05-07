import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  CheckCircle, Circle, Camera, Utensils, DollarSign,
  UserPen, Crown, Sparkles, ArrowLeft, ChefHat, X,
} from 'lucide-react';

const CHECKLIST_ITEMS = [
  {
    key: 'profile_photo',
    label: 'إضافة صورة شخصية',
    desc: 'صورتكِ تبني الثقة مع الزبائن',
    icon: Camera,
    link: '/cook/edit-profile',
    check: (cook) => !!cook.photo,
  },
  {
    key: 'bio',
    label: 'كتابة نبذة عن نشاطكِ',
    desc: 'عرّفي الزبائن بتخصصاتكِ',
    icon: UserPen,
    link: '/cook/edit-profile',
    check: (cook) => !!cook.bio && cook.bio.trim().length >= 10,
  },
  {
    key: 'first_dish',
    label: 'إضافة أول طبق',
    desc: 'أضيفي طبقاً واحداً على الأقل مع صورة وسعر',
    icon: Utensils,
    link: '/cook/dishes',
    check: (_cook, stats) => stats.totalDishes > 0,
  },
  {
    key: 'dish_photo',
    label: 'رفع صور حقيقية للأطباق',
    desc: 'الصور الجذابة تزيد الطلبات',
    icon: Camera,
    link: '/cook/dishes',
    check: (_cook, stats) => stats.dishesWithPhotos > 0,
  },
];

const CookOnboardingChecklist = ({ cookData, onComplete, onDismiss }) => {
  const [stats, setStats] = useState({ totalDishes: 0, dishesWithPhotos: 0 });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!cookData?.userId) return;
    const fetchDishStats = async () => {
      try {
        const q = query(collection(db, 'dishes'), where('cookId', '==', cookData.userId));
        const snap = await getDocs(q);
        const dishes = snap.docs.map((d) => d.data());
        setStats({
          totalDishes: dishes.length,
          dishesWithPhotos: dishes.filter((d) => !!d.photo).length,
        });
      } catch {}
    };
    fetchDishStats();
  }, [cookData?.userId]);

  if (!cookData || dismissed) return null;
  if (cookData.onboardingComplete) return null;

  const completedItems = CHECKLIST_ITEMS.filter((item) => item.check(cookData, stats));
  const completedCount = completedItems.length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  const handleComplete = async () => {
    if (!allDone) return;
    try {
      await updateDoc(doc(db, 'cooks', cookData.userId), { onboardingComplete: true });
      await addDoc(collection(db, 'invite_analytics'), {
        event: 'profile_completed',
        userId: cookData.userId,
        timestamp: serverTimestamp(),
      });
      onComplete?.();
    } catch {}
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-gradient-to-bl from-amber-50 via-orange-50 to-amber-50 border-2 border-orange-200 rounded-3xl p-5 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-300/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {cookData.isFoundingMember && (
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Crown className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-extrabold text-stone-800 flex items-center gap-1.5">
              {cookData.isFoundingMember ? 'أهلاً بالطباخة المؤسِّسة' : 'أكملي ملفكِ'}
              {cookData.isFoundingMember && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            </h3>
            <p className="text-[11px] text-stone-500">
              {allDone ? 'ملفكِ مكتمل وجاهز!' : `${completedCount} من ${totalCount} مكتمل`}
            </p>
          </div>
        </div>
        {!allDone && (
          <button onClick={handleDismiss} className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center hover:bg-white transition">
            <X className="w-3.5 h-3.5 text-stone-400" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Founding Member Badge */}
      {cookData.isFoundingMember && (
        <div className="flex items-center gap-2 bg-gradient-to-l from-orange-100 to-amber-100 border border-orange-200 rounded-2xl px-3 py-2.5 mb-4">
          <Crown className="w-4 h-4 text-orange-600" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-[11px] font-extrabold text-orange-800">
              طباخة مؤسِّسة #{cookData.foundingMemberNumber}
            </p>
            <p className="text-[10px] text-orange-600/80">
              رصيد: {cookData.balance?.toLocaleString('ar-DZ')} دج — {cookData.freeOrdersRemaining} طلبات مجانية
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-stone-600">اكتمال الملف</span>
          <span className={`text-[10px] font-black ${allDone ? 'text-green-600' : 'text-orange-600'}`}>{progress}%</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              allDone ? 'bg-gradient-to-l from-green-400 to-green-500' : 'bg-gradient-to-l from-orange-400 to-amber-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const done = item.check(cookData, stats);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.link}
              className={`flex items-center gap-3 rounded-2xl p-3 transition ${
                done ? 'bg-green-50/70' : 'bg-white/70 hover:bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-green-500 shadow-sm' : 'bg-stone-100'
              }`}>
                {done ? (
                  <CheckCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
                ) : (
                  <Icon className="w-4 h-4 text-stone-400" strokeWidth={2} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-extrabold ${done ? 'text-green-700 line-through' : 'text-stone-800'}`}>
                  {item.label}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">{item.desc}</p>
              </div>
              {!done && <ArrowLeft className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" strokeWidth={2} />}
            </Link>
          );
        })}
      </div>

      {/* Complete Button */}
      {allDone && (
        <button
          onClick={handleComplete}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-l from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-2xl font-extrabold text-sm shadow-lg shadow-green-500/30 active:scale-[0.98] transition-all"
        >
          <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
          ملفي جاهز!
        </button>
      )}

      {/* Pre-launch notice */}
      <p className="text-[10px] text-stone-400 text-center mt-3">
        سيتم تفعيل الطلبات عند الإطلاق الرسمي
      </p>
    </div>
  );
};

export default CookOnboardingChecklist;
