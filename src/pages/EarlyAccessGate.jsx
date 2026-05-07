import { useState, useRef, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Phone, ArrowLeft, Check, AlertCircle, Loader2, Users } from 'lucide-react';

const ADMIN_BYPASS_CODE = 'NAKHA-ADMIN-2026';

const FOODS = [
  { emoji: '🍲', size: 44, orbit: 130, speed: 25, startAngle: 0 },
  { emoji: '🍰', size: 36, orbit: 130, speed: 30, startAngle: 72 },
  { emoji: '👩‍🍳', size: 40, orbit: 130, speed: 28, startAngle: 144 },
  { emoji: '🥗', size: 34, orbit: 130, speed: 32, startAngle: 216 },
  { emoji: '🍽️', size: 32, orbit: 130, speed: 26, startAngle: 288 },
];

export default function EarlyAccessGate({ onBypass }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [stage, setStage] = useState(0);

  const [showBypass, setShowBypass] = useState(false);
  const [bypassCode, setBypassCode] = useState('');
  const [bypassError, setBypassError] = useState('');
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 600);
    const t3 = setTimeout(() => setStage(3), 1100);
    const t4 = setTimeout(() => setStage(4), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const handleLogoTap = () => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 800);
    if (tapCount.current >= 5) {
      setShowBypass(true);
      tapCount.current = 0;
    }
  };

  const handleBypass = () => {
    if (bypassCode.trim() === ADMIN_BYPASS_CODE) {
      sessionStorage.setItem('nakha_bypass', '1');
      onBypass();
    } else {
      setBypassError('رمز غير صحيح');
    }
  };

  const validatePhone = (p) => /^0[5-7][0-9]{8}$/.test(p);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validatePhone(phone)) {
      setError('رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 05 أو 06 أو 07');
      return;
    }
    setStatus('loading');
    try {
      const existing = await getDocs(query(collection(db, 'waitlist'), where('phone', '==', phone)));
      if (!existing.empty) { setStatus('duplicate'); return; }
      await addDoc(collection(db, 'waitlist'), { phone, createdAt: serverTimestamp() });
      setStatus('success');
    } catch {
      setError('حدث خطأ. تحقق من اتصالك بالإنترنت وحاول مجدداً.');
      setStatus('idle');
    }
  };

  return (
    <div dir="rtl" className="ea-page">
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes breathe2 {
          0%, 100% { transform: scale(1.1); opacity: 0.3; }
          50% { transform: scale(1.35); opacity: 0.55; }
        }
        @keyframes orbit {
          from { transform: rotate(var(--start)) translateX(var(--radius)) rotate(calc(-1 * var(--start))); }
          to   { transform: rotate(calc(var(--start) + 360deg)) translateX(var(--radius)) rotate(calc(-1 * (var(--start) + 360deg))); }
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-drift {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes shimmer-line {
          0%   { transform: translateX(100%) scaleX(0); opacity: 0; }
          30%  { transform: translateX(0) scaleX(1); opacity: 0.3; }
          70%  { transform: translateX(0) scaleX(1); opacity: 0.3; }
          100% { transform: translateX(-100%) scaleX(0); opacity: 0; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes reveal-scale {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes counter-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        .ea-page {
          min-height: 100dvh;
          background: #0f0a04;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* ── Ambient background ── */
        .ea-bg-mesh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .ea-bg-mesh::before {
          content: '';
          position: absolute;
          top: 8%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234,88,12,0.18) 0%, rgba(234,88,12,0.04) 50%, transparent 70%);
          animation: breathe 6s ease-in-out infinite;
        }
        .ea-bg-mesh::after {
          content: '';
          position: absolute;
          top: 5%;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 60%);
          animation: breathe2 8s ease-in-out infinite;
        }

        /* ── Decorative shimmer lines ── */
        .ea-shimmer-line {
          position: absolute;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(251,146,60,0.3), transparent);
          pointer-events: none;
          z-index: 1;
        }

        /* ── Sparkle dots ── */
        .ea-sparkle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(251,146,60,0.6);
          animation: sparkle var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
          pointer-events: none;
          z-index: 1;
        }

        /* ── Hero section ── */
        .ea-hero {
          position: relative;
          z-index: 2;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem 1rem;
          min-height: 52dvh;
        }

        /* ── Logo area ── */
        .ea-logo-zone {
          position: relative;
          width: 280px;
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
          user-select: none;
        }

        /* Pulse rings */
        .ea-pulse-ring {
          position: absolute;
          inset: 20%;
          border-radius: 50%;
          border: 1px solid rgba(234,88,12,0.25);
          animation: pulse-ring 3s ease-out infinite;
        }

        /* Orange glow disc behind logo */
        .ea-glow-disc {
          position: absolute;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234,88,12,0.35) 0%, rgba(234,88,12,0.08) 60%, transparent 80%);
          animation: breathe 4s ease-in-out infinite;
        }

        .ea-logo-img {
          position: relative;
          z-index: 3;
          width: 180px;
          height: auto;
          filter: drop-shadow(0 0 40px rgba(234,88,12,0.4)) drop-shadow(0 0 80px rgba(234,88,12,0.15));
          opacity: 0;
          transform: scale(0.7);
          transition: opacity 1s cubic-bezier(0.22,1,0.36,1), transform 1s cubic-bezier(0.22,1,0.36,1);
        }
        .ea-logo-img.s1 { opacity: 1; transform: scale(1); }

        /* ── Food orbit ── */
        .ea-food-orbit {
          position: absolute;
          inset: 0;
          z-index: 2;
        }
        .ea-food-item {
          position: absolute;
          top: 50%;
          left: 50%;
          margin-top: calc(var(--size) / -2);
          margin-left: calc(var(--size) / -2);
          width: var(--size);
          height: var(--size);
          animation: orbit var(--speed) linear infinite;
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        .ea-food-item.s2 { opacity: 1; }
        .ea-food-inner {
          font-size: calc(var(--size) * 0.65);
          line-height: 1;
          animation: float-y 3s ease-in-out infinite;
          animation-delay: var(--float-delay);
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }

        /* ── Orbit ring (decorative) ── */
        .ea-orbit-ring {
          position: absolute;
          inset: 15%;
          border-radius: 50%;
          border: 1px dashed rgba(251,146,60,0.08);
          animation: counter-spin 60s linear infinite;
          pointer-events: none;
        }

        /* ── Tagline ── */
        .ea-tagline {
          margin-top: -0.5rem;
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.06em;
          opacity: 0;
          transform: translateY(15px);
          transition: all 0.7s ease;
        }
        .ea-tagline.s2 { opacity: 1; transform: translateY(0); }

        /* ── Bottom section ── */
        .ea-bottom {
          position: relative;
          z-index: 3;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 1.25rem 1rem;
        }

        /* ── Badge ── */
        .ea-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 100px;
          background: rgba(234,88,12,0.08);
          border: 1px solid rgba(234,88,12,0.15);
          margin-bottom: 1rem;
          opacity: 0;
          animation: reveal-up 0.6s ease forwards;
          animation-delay: 1.2s;
        }
        .ea-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #ea580c;
          box-shadow: 0 0 8px rgba(234,88,12,0.6);
          animation: breathe 2s ease-in-out infinite;
        }
        .ea-badge-text {
          font-size: 11px;
          font-weight: 800;
          color: #ea580c;
        }

        /* ── Description ── */
        .ea-desc {
          color: rgba(255,255,255,0.35);
          font-size: 0.8rem;
          font-weight: 600;
          text-align: center;
          line-height: 1.9;
          max-width: 260px;
          margin: 0 auto 1.5rem;
          opacity: 0;
          animation: reveal-up 0.6s ease forwards;
          animation-delay: 1.4s;
        }

        /* ── Form ── */
        .ea-form {
          width: 100%;
          max-width: 380px;
          background: linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 28px;
          padding: 1.75rem 1.5rem;
          backdrop-filter: blur(24px);
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: reveal-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
          animation-delay: 1.6s;
        }
        .ea-form::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 10%, rgba(234,88,12,0.3) 50%, transparent 90%);
        }

        .ea-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
        }

        .ea-input-wrap {
          position: relative;
        }
        .ea-input {
          width: 100%;
          padding: 16px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          letter-spacing: 0.22em;
          font-family: 'Cairo', sans-serif;
          outline: none;
          direction: ltr;
          transition: all 0.3s;
          caret-color: #ea580c;
        }
        .ea-input::placeholder { color: rgba(255,255,255,0.15); font-weight: 400; letter-spacing: 0.15em; }
        .ea-input:focus {
          border-color: rgba(234,88,12,0.5);
          background: rgba(234,88,12,0.05);
          box-shadow: 0 0 0 4px rgba(234,88,12,0.08), 0 0 30px rgba(234,88,12,0.06);
        }

        .ea-hint {
          font-size: 10px;
          color: rgba(255,255,255,0.18);
          text-align: center;
          margin-top: 8px;
        }

        .ea-submit {
          width: 100%;
          margin-top: 16px;
          padding: 15px;
          border: none;
          border-radius: 16px;
          font-family: 'Cairo', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
          box-shadow: 0 8px 32px rgba(234,88,12,0.3), 0 2px 8px rgba(234,88,12,0.2), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }
        .ea-submit::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }
        .ea-submit:hover:not(:disabled)::after { transform: translateX(100%); }
        .ea-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(234,88,12,0.4), 0 4px 12px rgba(234,88,12,0.25), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .ea-submit:active:not(:disabled) { transform: scale(0.97) translateY(0); }
        .ea-submit:disabled { opacity: 0.35; cursor: default; }

        .ea-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(220,38,38,0.08);
          border: 1px solid rgba(220,38,38,0.15);
          border-radius: 14px;
          padding: 10px 12px;
          margin-top: 12px;
        }
        .ea-error-text { font-size: 11px; font-weight: 700; color: #fca5a5; }

        /* ── Success ── */
        .ea-success {
          width: 100%;
          max-width: 380px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(74,222,128,0.12);
          border-radius: 28px;
          padding: 2rem 1.5rem;
          text-align: center;
          backdrop-filter: blur(20px);
          animation: reveal-scale 0.5s ease forwards;
        }
        .ea-success-icon {
          width: 60px; height: 60px;
          border-radius: 50%;
          background: rgba(74,222,128,0.1);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 0 30px rgba(74,222,128,0.1);
        }
        .ea-success h3 { font-size: 1.1rem; font-weight: 900; color: #fff; margin-bottom: 0.5rem; }
        .ea-success p { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.35); line-height: 1.8; }
        .ea-success-badge {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin-top: 1.25rem;
          font-size: 11px; font-weight: 700; color: #ea580c;
        }

        /* ── Footer ── */
        .ea-footer {
          position: relative; z-index: 2;
          text-align: center;
          padding: 1rem;
          font-size: 10px; font-weight: 600;
          color: rgba(255,255,255,0.1);
        }

        /* ── Bypass ── */
        .ea-bypass-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(12px);
          padding: 1rem;
          animation: reveal-scale 0.25s ease;
        }
        .ea-bypass-card {
          background: #1a1008;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 1.75rem 1.5rem;
          max-width: 320px; width: 100%;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
        .ea-bypass-title { font-size: 13px; font-weight: 900; color: rgba(255,255,255,0.6); text-align: center; margin-bottom: 14px; }
        .ea-bypass-input {
          width: 100%; padding: 12px 14px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          font-size: 13px; font-family: monospace; color: #fff;
          text-align: center; outline: none;
          transition: border-color 0.2s; direction: ltr; margin-bottom: 12px;
        }
        .ea-bypass-input:focus { border-color: #ea580c; }
        .ea-bypass-btn {
          width: 100%; padding: 11px;
          background: rgba(234,88,12,0.15);
          border: 1px solid rgba(234,88,12,0.2);
          border-radius: 14px;
          font-family: 'Cairo', sans-serif;
          font-size: 13px; font-weight: 700;
          color: #ea580c; cursor: pointer;
          transition: all 0.2s;
        }
        .ea-bypass-btn:hover { background: rgba(234,88,12,0.25); }
        .ea-bypass-error { font-size: 11px; color: #fca5a5; font-weight: 700; text-align: center; margin-bottom: 8px; }

        @media (min-width: 768px) {
          .ea-hero { min-height: 55dvh; }
          .ea-logo-zone { width: 340px; height: 340px; }
          .ea-logo-img { width: 220px; }
          .ea-food-item { --size: 50px; }
        }
      `}</style>

      {/* ═══ Ambient background ═══ */}
      <div className="ea-bg-mesh" />

      {/* ═══ Shimmer lines ═══ */}
      {[
        { top: '15%', width: '40%', left: '5%', dur: '6s', delay: '0s' },
        { top: '35%', width: '30%', left: '60%', dur: '8s', delay: '2s' },
        { top: '65%', width: '35%', left: '10%', dur: '7s', delay: '4s' },
        { top: '80%', width: '25%', left: '55%', dur: '9s', delay: '1s' },
      ].map((l, i) => (
        <div
          key={i}
          className="ea-shimmer-line"
          style={{ top: l.top, width: l.width, left: l.left, animation: `shimmer-line ${l.dur} ease-in-out infinite`, animationDelay: l.delay }}
        />
      ))}

      {/* ═══ Sparkle dots ═══ */}
      {[
        { top: '10%', left: '20%', dur: '3s', delay: '0s' },
        { top: '22%', left: '75%', dur: '4s', delay: '1.5s' },
        { top: '45%', left: '12%', dur: '3.5s', delay: '0.8s' },
        { top: '55%', left: '85%', dur: '4.5s', delay: '2.2s' },
        { top: '72%', left: '30%', dur: '3s', delay: '1s' },
        { top: '85%', left: '65%', dur: '4s', delay: '0.5s' },
        { top: '30%', left: '50%', dur: '5s', delay: '3s' },
        { top: '60%', left: '40%', dur: '3.5s', delay: '1.8s' },
      ].map((s, i) => (
        <div key={i} className="ea-sparkle" style={{ top: s.top, left: s.left, '--dur': s.dur, '--delay': s.delay }} />
      ))}

      {/* ═══ Hero ═══ */}
      <div className="ea-hero">
        <div className="ea-logo-zone" onClick={handleLogoTap}>
          {/* Decorative orbit ring */}
          <div className="ea-orbit-ring" />

          {/* Pulse rings */}
          <div className="ea-pulse-ring" style={{ animationDelay: '0s' }} />
          <div className="ea-pulse-ring" style={{ animationDelay: '1s' }} />
          <div className="ea-pulse-ring" style={{ animationDelay: '2s' }} />

          {/* Glow */}
          <div className="ea-glow-disc" />

          {/* Orbiting food */}
          <div className="ea-food-orbit">
            {FOODS.map((f, i) => (
              <div
                key={i}
                className={`ea-food-item ${stage >= 2 ? 's2' : ''}`}
                style={{
                  '--size': `${f.size}px`,
                  '--radius': `${f.orbit}px`,
                  '--start': `${f.startAngle}deg`,
                  '--speed': `${f.speed}s`,
                  animation: `orbit ${f.speed}s linear infinite`,
                  transitionDelay: `${i * 0.12}s`,
                }}
              >
                <div className="ea-food-inner" style={{ '--float-delay': `${i * 0.4}s` }}>
                  {f.emoji}
                </div>
              </div>
            ))}
          </div>

          {/* Logo */}
          <img
            src="/nakha-logo.png"
            alt="نَكهة"
            className={`ea-logo-img ${stage >= 1 ? 's1' : ''}`}
            draggable={false}
          />
        </div>

        <p className={`ea-tagline ${stage >= 2 ? 's2' : ''}`}>
          أكل بيت حقيقي — من بشار لبابك
        </p>
      </div>

      {/* ═══ Bottom ═══ */}
      <div className="ea-bottom">
        <div className="ea-badge">
          <div className="ea-badge-dot" />
          <span className="ea-badge-text">قريباً — سجّل مكانك</span>
        </div>

        <p className="ea-desc">
          منصة نَكهة تربط طباخات بشار بالزبائن.
          <br />
          سجّل رقمك لنُبلغك فور الإطلاق.
        </p>

        {status === 'success' || status === 'duplicate' ? (
          <div className="ea-success">
            <div className="ea-success-icon">
              <Check className="w-7 h-7 text-green-400" strokeWidth={2.5} />
            </div>
            <h3>{status === 'duplicate' ? 'أنت مسجّل بالفعل!' : 'تم تسجيلك بنجاح!'}</h3>
            <p>{status === 'duplicate' ? 'رقمك في قائمة الانتظار. سنُبلغك فور الإطلاق.' : 'سنتواصل معك عبر هذا الرقم فور إطلاق المنصة.'}</p>
            <div className="ea-success-badge">
              <Users className="w-3.5 h-3.5" strokeWidth={2.4} />
              أنت من أوائل المسجّلين
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ea-form">
            <label className="ea-label">
              <Phone className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.3} />
              رقم هاتفك
            </label>
            <div className="ea-input-wrap">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 10) { setPhone(val); setError(''); }
                }}
                placeholder="05XXXXXXXX"
                className="ea-input"
              />
            </div>
            <p className="ea-hint">10 أرقام — يبدأ بـ 05 أو 06 أو 07</p>

            {error && (
              <div className="ea-error">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.4} />
                <p className="ea-error-text">{error}</p>
              </div>
            )}

            <button type="submit" disabled={!phone.trim() || status === 'loading'} className="ea-submit">
              {status === 'loading' ? (
                <><Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />جارٍ التسجيل...</>
              ) : (
                <><ArrowLeft className="w-5 h-5" strokeWidth={2.5} />سجّل في قائمة الانتظار</>
              )}
            </button>
          </form>
        )}
      </div>

      <footer className="ea-footer">نَكهة — منصة الأكل المنزلي في بشار 🇩🇿</footer>

      {/* ═══ Admin bypass ═══ */}
      {showBypass && (
        <div className="ea-bypass-overlay" onClick={() => setShowBypass(false)}>
          <div className="ea-bypass-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="ea-bypass-title">دخول الإدارة</h3>
            <input
              type="password"
              value={bypassCode}
              onChange={(e) => { setBypassCode(e.target.value); setBypassError(''); }}
              placeholder="رمز الدخول"
              className="ea-bypass-input"
              onKeyDown={(e) => e.key === 'Enter' && handleBypass()}
              autoFocus
            />
            {bypassError && <p className="ea-bypass-error">{bypassError}</p>}
            <button onClick={handleBypass} className="ea-bypass-btn">دخول</button>
          </div>
        </div>
      )}
    </div>
  );
}
