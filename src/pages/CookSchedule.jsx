import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Clock, Check, Save } from 'lucide-react';
import { DAYS, DEFAULT_SCHEDULE } from '../utils/schedule';

export default function CookSchedule() {
  const { userProfile } = useAuth();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!userProfile?.cookId) return;
      const snap = await getDoc(doc(db, 'cooks', userProfile.cookId));
      if (snap.exists() && snap.data().schedule) {
        setSchedule({ ...DEFAULT_SCHEDULE, ...snap.data().schedule });
      }
      setLoading(false);
    };
    load();
  }, [userProfile]);

  const toggleDay = (key) =>
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));

  const setTime = (key, field, value) =>
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));

  const handleSave = async () => {
    if (!userProfile?.cookId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'cooks', userProfile.cookId), { schedule });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('Error saving schedule:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-orange-500 font-bold">جارٍ التحميل...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-28">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/cook/dashboard"
              className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ArrowRight className="w-5 h-5 text-stone-700" strokeWidth={2.3} />
            </Link>
            <div>
              <h1 className="text-base font-black text-stone-800 leading-none">أوقات العمل</h1>
              <p className="text-[11px] text-stone-500 mt-0.5">حددي أوقات استقبال الطلبات</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95 ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30'
            } ${saving ? 'opacity-60' : ''}`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" strokeWidth={2.8} />
                تم الحفظ
              </>
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={2.3} />
                {saving ? 'جارٍ...' : 'حفظ'}
              </>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {/* tip */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl px-4 py-3 flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" strokeWidth={2.4} />
          <p className="text-xs text-amber-800 leading-relaxed">
            سيُعرض ملفك كـ"متاح" فقط خلال الأوقات المحددة. خارج هذه الأوقات تظهرين كـ"مغلقة".
          </p>
        </div>

        {/* Days */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm divide-y divide-stone-100">
          {DAYS.map(({ key, label }) => {
            const day = schedule[key];
            const isToday =
              key ===
              ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
                new Date().getDay()
              ];
            return (
              <div
                key={key}
                className={`px-4 py-4 transition-colors ${day.enabled ? '' : 'bg-stone-50/60'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-stone-800">{label}</span>
                    {isToday && (
                      <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        اليوم
                      </span>
                    )}
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleDay(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      day.enabled ? 'bg-green-500' : 'bg-stone-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                        day.enabled ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {day.enabled && (
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-stone-500 block mb-1">من</label>
                      <input
                        type="time"
                        value={day.from}
                        onChange={(e) => setTime(key, 'from', e.target.value)}
                        className="w-full bg-orange-50 border border-orange-200/60 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                    <div className="text-stone-400 font-bold text-sm pt-5">—</div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-stone-500 block mb-1">إلى</label>
                      <input
                        type="time"
                        value={day.to}
                        onChange={(e) => setTime(key, 'to', e.target.value)}
                        className="w-full bg-orange-50 border border-orange-200/60 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                  </div>
                )}

                {!day.enabled && (
                  <p className="text-xs text-stone-400 font-semibold">مغلقة — لا تستقبل طلبات</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Save (bottom) */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-2xl text-base font-black transition-all active:scale-[0.98] ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-l from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
          } ${saving ? 'opacity-60' : ''}`}
        >
          {saved ? '✓ تم حفظ الجدول' : saving ? 'جارٍ الحفظ...' : 'حفظ الجدول'}
        </button>
      </div>
    </div>
  );
}
