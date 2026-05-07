import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  collection, query, where, getDocs, doc, addDoc, updateDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { INVITE_SYSTEM, FOUNDING_MEMBERS } from '../config/settings';
import {
  KeyRound, ShieldCheck, AlertCircle, Loader2, ArrowRight,
  Sparkles, Crown, ChefHat, Check, Clock, UserCheck, Mail, Phone,
} from 'lucide-react';

const generateToken = () => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
};

const logInviteEvent = async (event, data = {}) => {
  try {
    await addDoc(collection(db, 'invite_analytics'), {
      event,
      ...data,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch {}
};

const CookInvite = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatedCode, setValidatedCode] = useState(null);
  const [assignedTo, setAssignedTo] = useState(null);
  const [assignmentInput, setAssignmentInput] = useState('');
  const [showAssignment, setShowAssignment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    logInviteEvent('invite_page_view');
  }, []);

  const setValidationError = (msg, type = 'invalid') => {
    setError(msg);
    setErrorType(type);
    setLoading(false);
  };

  const validateCode = async () => {
    if (!code.trim()) return;
    setError('');
    setErrorType('');
    setLoading(true);

    const upperCode = code.trim().toUpperCase();
    await logInviteEvent('code_entered', { code: upperCode });

    try {
      const q = query(
        collection(db, 'invite_codes'),
        where('code', '==', upperCode)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        await logInviteEvent('code_invalid', { code: upperCode, reason: 'not_found' });
        setValidationError('رمز الدعوة غير صحيح. تأكدي من الرمز وأعيدي المحاولة.', 'invalid');
        return;
      }

      const inviteDoc = snap.docs[0];
      const inviteData = inviteDoc.data();

      if (inviteData.used) {
        await logInviteEvent('code_invalid', { code: upperCode, reason: 'already_used' });
        setValidationError('تم استخدام هذا الرمز مسبقاً.', 'used');
        return;
      }

      if (inviteData.active === false) {
        await logInviteEvent('code_invalid', { code: upperCode, reason: 'deactivated' });
        setValidationError('رمز الدعوة غير فعّال حالياً.', 'inactive');
        return;
      }

      if (inviteData.expires_at) {
        const expiresAt = inviteData.expires_at.toDate ? inviteData.expires_at.toDate() : new Date(inviteData.expires_at);
        if (expiresAt < new Date()) {
          await logInviteEvent('code_invalid', { code: upperCode, reason: 'expired' });
          setValidationError('انتهت صلاحية رمز الدعوة هذا.', 'expired');
          return;
        }
      }

      if (inviteData.assigned_to) {
        setAssignedTo(inviteData.assigned_to);
        setShowAssignment(true);
        setValidatedCode({ id: inviteDoc.id, ...inviteData });
        setLoading(false);
        return;
      }

      await finalizeValidation(inviteDoc.id, inviteData, upperCode);
    } catch (err) {
      console.error('Invite code validation error:', err);
      setValidationError('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.', 'error');
    }
  };

  const verifyAssignment = async () => {
    if (!assignmentInput.trim() || !validatedCode) return;
    setLoading(true);
    setError('');

    const input = assignmentInput.trim();
    const assigned = assignedTo;

    const matches =
      (assigned.email && input.toLowerCase() === assigned.email.toLowerCase()) ||
      (assigned.phone && input.replace(/\s/g, '') === assigned.phone.replace(/\s/g, ''));

    if (!matches) {
      await logInviteEvent('code_invalid', { code: validatedCode.code, reason: 'assignment_mismatch' });
      setValidationError('البيانات لا تتطابق مع صاحبة الدعوة.', 'assignment');
      return;
    }

    await finalizeValidation(validatedCode.id, validatedCode, validatedCode.code);
  };

  const finalizeValidation = async (docId, data, codeStr) => {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + INVITE_SYSTEM.tokenTTLMinutes * 60 * 1000);

    try {
      await addDoc(collection(db, 'invite_tokens'), {
        token,
        invite_code_id: docId,
        code: codeStr,
        created_at: serverTimestamp(),
        expires_at: Timestamp.fromDate(expiresAt),
        used: false,
        campaign: data.campaign || INVITE_SYSTEM.campaign,
      });

      sessionStorage.setItem('nakha_invite_token', token);

      await logInviteEvent('code_valid', { code: codeStr, campaign: data.campaign || INVITE_SYSTEM.campaign });

      setValidatedCode({ id: docId, ...data, code: codeStr });
      setSuccess(true);
      setShowAssignment(false);
    } catch (err) {
      console.error('Token creation error:', err);
      setValidationError('حدث خطأ. يرجى المحاولة مرة أخرى.', 'error');
      return;
    }
    setLoading(false);
  };

  const proceedToSignup = () => {
    navigate('/cook/signup');
  };

  const errorIcons = {
    invalid: AlertCircle,
    used: ShieldCheck,
    expired: Clock,
    inactive: ShieldCheck,
    assignment: UserCheck,
    error: AlertCircle,
  };

  if (showAssignment && validatedCode && !success) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#0D0B09] relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/40">
              <UserCheck className="w-8 h-8 text-white" strokeWidth={1.8} />
            </div>
          </div>

          <h2 className="text-xl font-black text-white text-center mb-2">التحقق من الهوية</h2>
          <p className="text-sm text-stone-400 text-center mb-6 leading-relaxed">
            هذا الرمز مخصص لشخص محدد. يرجى إدخال {assignedTo?.email ? 'البريد الإلكتروني' : 'رقم الهاتف'} المرتبط بالدعوة.
          </p>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 space-y-4">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-300">
              {assignedTo?.email ? <Mail className="w-4 h-4 text-orange-500" strokeWidth={2.4} /> : <Phone className="w-4 h-4 text-orange-500" strokeWidth={2.4} />}
              {assignedTo?.email ? 'البريد الإلكتروني' : 'رقم الهاتف'}
            </label>
            <input
              type={assignedTo?.email ? 'email' : 'tel'}
              value={assignmentInput}
              onChange={(e) => { setAssignmentInput(e.target.value); setError(''); }}
              placeholder={assignedTo?.email ? 'example@email.com' : '05XXXXXXXX'}
              dir="ltr"
              onKeyDown={(e) => e.key === 'Enter' && verifyAssignment()}
              className="w-full px-4 py-4 bg-white/[0.06] border-2 border-white/[0.1] rounded-2xl text-sm font-medium text-white text-center placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition"
            />

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.4} />
                <p className="text-xs font-bold text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={verifyAssignment}
              disabled={!assignmentInput.trim() || loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 text-white py-4 rounded-2xl font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
              {loading ? 'جاري التحقق...' : 'تأكيد الهوية'}
            </button>
          </div>

          <button
            onClick={() => { setShowAssignment(false); setValidatedCode(null); setAssignedTo(null); setCode(''); setError(''); }}
            className="block mx-auto mt-4 text-xs font-bold text-stone-600 hover:text-stone-400 transition"
          >
            العودة لإدخال رمز آخر
          </button>
        </div>
      </div>
    );
  }

  if (success && validatedCode) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#0D0B09] relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500/6 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-sm w-full text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-orange-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-orange-500/15 rounded-full animate-pulse" />
            </div>
            <div className="relative flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/40 rotate-3">
                <Crown className="w-10 h-10 text-white" strokeWidth={1.8} />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/25 text-orange-400 px-4 py-2 rounded-full text-xs font-bold mb-5">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
            طباخة مؤسِّسة
          </div>

          <h1 className="text-2xl font-black text-white mb-3 leading-relaxed">
            مبروك! أنتِ من أول الطباخات المؤسِّسات في نكهة
          </h1>
          <p className="text-sm text-stone-400 leading-relaxed mb-8">
            تم التحقق من رمز الدعوة بنجاح. يمكنكِ الآن إنشاء حسابكِ والانضمام إلى نكهة كطباخة مؤسِّسة.
          </p>

          <div className="bg-white/5 border border-orange-500/15 rounded-2xl p-4 mb-6 space-y-3">
            {[
              { text: <>رصيد ترحيبي <span className="text-orange-400 font-bold">{FOUNDING_MEMBERS.welcomeBalance.toLocaleString('ar-DZ')} دج</span></> },
              { text: <><span className="text-orange-400 font-bold">{FOUNDING_MEMBERS.freeOrders} طلبات</span> بدون رسوم خدمة</> },
              { text: <>شارة <span className="text-orange-400 font-bold">طباخة مؤسِّسة</span> حصرية</> },
            ].map((perk, i) => (
              <div key={i} className="flex items-center gap-3 text-right">
                <div className="w-8 h-8 bg-orange-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
                </div>
                <p className="text-xs text-stone-300">{perk.text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={proceedToSignup}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white py-4 rounded-2xl font-extrabold text-sm shadow-2xl shadow-orange-500/30 active:scale-[0.98] transition-all"
          >
            <ChefHat className="w-5 h-5" strokeWidth={2} />
            إنشاء حسابي كطباخة مؤسِّسة
          </button>

          <p className="text-[11px] text-stone-600 mt-4">
            سيتم تفعيل الطلبات عند الإطلاق الرسمي
          </p>
        </div>
      </div>
    );
  }

  const ErrorIcon = errorIcons[errorType] || AlertCircle;

  return (
    <div dir="rtl" className="min-h-screen bg-[#0D0B09] relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/3 rounded-full blur-[80px]" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ea580c 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
            وصول خاص — بالدعوة فقط
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 rounded-3xl blur-2xl scale-150" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/40">
              <KeyRound className="w-10 h-10 text-white" strokeWidth={1.8} />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white text-center mb-2 leading-relaxed">
          مرحبًا بكِ في الوصول الخاص لنكهة
        </h1>
        <p className="text-sm text-stone-400 text-center leading-relaxed mb-8">
          هذه المساحة مخصصة للطباخات الأوائل المدعوات إلى النسخة التجريبية
        </p>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm space-y-5">
          <label className="flex items-center gap-2 text-xs font-bold text-stone-300">
            <KeyRound className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
            رمز الدعوة
          </label>

          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); setErrorType(''); }}
            placeholder="NAKHA-XXX"
            dir="ltr"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={(e) => e.key === 'Enter' && validateCode()}
            className="w-full px-4 py-4 bg-white/[0.06] border-2 border-white/[0.1] rounded-2xl text-sm font-mono font-bold text-white text-center placeholder:text-stone-600 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition tracking-[0.3em]"
          />

          {error && (
            <div className={`flex items-start gap-2 rounded-xl p-3 border ${
              errorType === 'expired' ? 'bg-amber-500/10 border-amber-500/20' :
              errorType === 'used' ? 'bg-purple-500/10 border-purple-500/20' :
              'bg-red-500/10 border-red-500/20'
            }`}>
              <ErrorIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                errorType === 'expired' ? 'text-amber-400' :
                errorType === 'used' ? 'text-purple-400' :
                'text-red-400'
              }`} strokeWidth={2.4} />
              <p className={`text-xs font-bold ${
                errorType === 'expired' ? 'text-amber-300' :
                errorType === 'used' ? 'text-purple-300' :
                'text-red-300'
              }`}>{error}</p>
            </div>
          )}

          <button
            onClick={validateCode}
            disabled={!code.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                جاري التحقق...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
                التحقق من رمز الدعوة
              </>
            )}
          </button>
        </div>

        <div className="text-center mt-8 space-y-3">
          <p className="text-[11px] text-stone-600 leading-relaxed">
            ليس لديكِ رمز دعوة؟ تابعي صفحتنا للحصول على دعوة عند الإطلاق الرسمي.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-400 active:scale-95 transition"
          >
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CookInvite;
