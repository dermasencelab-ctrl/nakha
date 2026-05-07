import { useState, useRef, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, Check, AlertCircle, Loader2, ChefHat, ShoppingBag, Truck, Shield, Heart, MapPin, Globe, Mail, KeyRound } from 'lucide-react';

const ADMIN_BYPASS_CODE = 'NAKHA-ADMIN-2026';

export default function EarlyAccessGate({ onBypass }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);

  const [showBypass, setShowBypass] = useState(false);
  const [bypassCode, setBypassCode] = useState('');
  const [bypassError, setBypassError] = useState('');
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 80);
    getCountFromServer(collection(db, 'waitlist'))
      .then((snap) => setWaitlistCount(snap.data().count))
      .catch(() => {});
    return () => clearTimeout(t);
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
      setWaitlistCount((c) => c + 1);
    } catch {
      setError('حدث خطأ. تحقق من اتصالك بالإنترنت وحاول مجدداً.');
      setStatus('idle');
    }
  };

  const r = revealed;

  return (
    <div dir="rtl" className="ea">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@200;300;400;500;600;700&display=swap');

        .ea {
          --bg: #0c0906;
          --bg-card: rgba(255,245,230,0.025);
          --accent: #ea580c;
          --accent-glow: rgba(234,88,12,0.15);
          --amber: #f59e0b;
          --text: #faf3eb;
          --text-mid: #c4b5a3;
          --text-muted: #8a7b6b;
          --border: rgba(255,245,230,0.06);

          font-family: 'Readex Pro', system-ui, sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100dvh;
          overflow-x: hidden;
          position: relative;
        }

        /* ── Ambient ── */
        .ea::before {
          content: '';
          position: fixed;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234,88,12,0.08) 0%, rgba(234,88,12,0.02) 40%, transparent 70%);
          pointer-events: none;
          animation: ambient-pulse 8s ease-in-out infinite;
        }

        @keyframes ambient-pulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
        }

        /* ── Floating particles ── */
        @keyframes float-particle {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(var(--end-scale)); opacity: 0; }
        }
        .ea-particle {
          position: fixed;
          font-size: var(--size);
          animation: float-particle var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          filter: blur(0.5px);
        }

        /* ── Section wrapper ── */
        .ea-section {
          position: relative;
          z-index: 2;
          max-width: 480px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        /* ── Reveal animations ── */
        .ea-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .ea-reveal.on { opacity: 1; transform: translateY(0); }
        .ea-reveal-scale {
          opacity: 0;
          transform: scale(0.92);
          transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .ea-reveal-scale.on { opacity: 1; transform: scale(1); }

        /* ── Hero ── */
        .ea-hero {
          padding-top: max(env(safe-area-inset-top, 0px), 2rem);
          padding-bottom: 0.5rem;
          text-align: center;
        }
        .ea-logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          cursor: default;
          user-select: none;
        }
        .ea-logo-img {
          width: 110px;
          height: auto;
          filter: drop-shadow(0 0 30px rgba(234,88,12,0.25));
        }
        .ea-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent), 0 0 4px var(--accent);
          animation: dot-pulse 2.5s ease-in-out infinite;
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .ea-soon-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--accent);
          text-transform: uppercase;
        }
        .ea-headline {
          font-size: clamp(1.75rem, 7vw, 2.5rem);
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 0.65rem;
          color: var(--text);
        }
        .ea-headline em {
          font-style: normal;
          color: var(--accent);
          text-shadow: 0 0 30px rgba(234,88,12,0.3);
        }
        .ea-subline {
          font-size: 0.88rem;
          font-weight: 400;
          color: var(--text-mid);
          line-height: 1.7;
          max-width: 320px;
          margin: 0 auto;
        }

        /* ── Form ── */
        .ea-form-wrap {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .ea-form {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.25rem;
          position: relative;
          overflow: hidden;
        }
        .ea-form::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; right: 15%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(234,88,12,0.25), transparent);
        }
        .ea-input-row {
          display: flex;
          gap: 0.5rem;
          align-items: stretch;
        }
        .ea-input {
          flex: 1;
          padding: 0.85rem 1rem;
          background: rgba(255,245,230,0.04);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text);
          direction: ltr;
          text-align: center;
          letter-spacing: 0.15em;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
          caret-color: var(--accent);
        }
        .ea-input::placeholder {
          color: var(--text-muted);
          font-weight: 300;
          letter-spacing: 0.1em;
        }
        .ea-input:focus {
          border-color: rgba(234,88,12,0.4);
          background: rgba(234,88,12,0.03);
          box-shadow: 0 0 0 3px rgba(234,88,12,0.06);
        }
        .ea-submit-btn {
          padding: 0.85rem 1.25rem;
          background: var(--accent);
          border: none;
          border-radius: 14px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          box-shadow: 0 4px 20px rgba(234,88,12,0.3);
          position: relative;
          overflow: hidden;
        }
        .ea-submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
          transform: translateX(-150%);
          transition: transform 0.6s ease;
        }
        .ea-submit-btn:hover:not(:disabled)::after { transform: translateX(150%); }
        .ea-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(234,88,12,0.4);
        }
        .ea-submit-btn:active:not(:disabled) { transform: scale(0.97); }
        .ea-submit-btn:disabled { opacity: 0.4; cursor: default; }
        .ea-form-hint {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 0.6rem;
        }
        .ea-error-box {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.12);
          border-radius: 12px;
          padding: 0.6rem 0.75rem;
          margin-top: 0.6rem;
          font-size: 0.7rem;
          font-weight: 500;
          color: #fca5a5;
        }

        /* ── Success ── */
        .ea-success-card {
          background: var(--bg-card);
          border: 1px solid rgba(74,222,128,0.1);
          border-radius: 20px;
          padding: 1.75rem 1.25rem;
          text-align: center;
          animation: pop-in 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .ea-success-check {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(74,222,128,0.08);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.75rem;
        }
        .ea-success-card h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.35rem;
        }
        .ea-success-card p {
          font-size: 0.78rem;
          color: var(--text-mid);
          line-height: 1.7;
        }

        /* ── Divider ── */
        .ea-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
          margin: 0.75rem 0;
        }

        /* ── Social proof ── */
        .ea-proof {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          padding: 1.25rem 0;
        }
        .ea-proof-item {
          text-align: center;
          padding: 0.75rem 0.25rem;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
        }
        .ea-proof-num {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--accent);
          display: block;
          line-height: 1.2;
        }
        .ea-proof-label {
          font-size: 0.6rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-top: 0.2rem;
          display: block;
        }

        /* ── How it works ── */
        .ea-how {
          padding: 2rem 0 1.5rem;
        }
        .ea-section-title {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: var(--accent);
          text-align: center;
          margin-bottom: 1.25rem;
        }
        .ea-steps {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .ea-step {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1rem;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          transition: border-color 0.3s, background 0.3s;
        }
        .ea-step:hover {
          border-color: rgba(234,88,12,0.12);
          background: rgba(234,88,12,0.02);
        }
        .ea-step-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(234,88,12,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--accent);
        }
        .ea-step-num {
          font-size: 0.55rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 0.1rem;
        }
        .ea-step-text {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text);
          line-height: 1.4;
        }

        /* ── Trust ── */
        .ea-trust {
          padding: 1rem 0 1.5rem;
        }
        .ea-trust-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .ea-trust-card {
          padding: 1rem 0.75rem;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          text-align: center;
        }
        .ea-trust-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }
        .ea-trust-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-mid);
          display: block;
          line-height: 1.5;
        }

        /* ── Early access perks ── */
        .ea-perks {
          padding: 1rem 0 2rem;
        }
        .ea-perk-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .ea-perk {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
        }
        .ea-perk-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 8px rgba(234,88,12,0.4);
          flex-shrink: 0;
        }
        .ea-perk-text {
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--text-mid);
        }

        /* ── Footer ── */
        .ea-footer {
          position: relative;
          z-index: 2;
          border-top: 1px solid var(--border);
          padding: 1.5rem 1.25rem;
          text-align: center;
        }
        .ea-footer-brand {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }
        .ea-footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ea-footer-link {
          font-size: 0.65rem;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .ea-footer-link:hover { color: var(--text-mid); }
        .ea-footer-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .ea-footer-social a {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .ea-footer-social a:hover {
          color: var(--accent);
          border-color: rgba(234,88,12,0.15);
        }
        .ea-footer-made {
          font-size: 0.6rem;
          color: rgba(138,123,107,0.5);
          letter-spacing: 0.05em;
        }

        /* ── Bypass modal ── */
        .ea-bypass-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          padding: 1rem;
          animation: pop-in 0.25s ease;
        }
        .ea-bypass-card {
          background: #1a1208;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.5rem 1.25rem;
          max-width: 300px;
          width: 100%;
        }
        .ea-bypass-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 1rem;
        }
        .ea-bypass-input {
          width: 100%;
          padding: 0.7rem;
          background: rgba(255,245,230,0.04);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-size: 0.8rem;
          font-family: monospace;
          color: var(--text);
          text-align: center;
          outline: none;
          direction: ltr;
          margin-bottom: 0.75rem;
          transition: border-color 0.2s;
        }
        .ea-bypass-input:focus { border-color: var(--accent); }
        .ea-bypass-btn {
          width: 100%;
          padding: 0.65rem;
          background: rgba(234,88,12,0.1);
          border: 1px solid rgba(234,88,12,0.15);
          border-radius: 12px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--accent);
          cursor: pointer;
          transition: background 0.2s;
        }
        .ea-bypass-btn:hover { background: rgba(234,88,12,0.18); }
        .ea-bypass-error {
          font-size: 0.7rem;
          color: #fca5a5;
          font-weight: 600;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        /* ── Cook invite button ── */
        .ea-cook-invite {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(234,88,12,0.04);
          border: 1.5px solid rgba(234,88,12,0.15);
          border-radius: 16px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--accent);
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 0.75rem;
        }
        .ea-cook-invite:hover {
          background: rgba(234,88,12,0.08);
          border-color: rgba(234,88,12,0.3);
          box-shadow: 0 0 20px rgba(234,88,12,0.1);
        }
        .ea-cook-invite:active { transform: scale(0.98); }

        @media (min-width: 640px) {
          .ea-section { max-width: 520px; }
          .ea-headline { font-size: 2.5rem; }
          .ea-trust-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      {/* Floating food particles */}
      {[
        { emoji: '🍲', top: '8%',  left: '8%',  size: '1.4rem', dx: '30px', dy: '-60px', dur: '12s', delay: '0s', scale: 0.6 },
        { emoji: '🫓', top: '15%', left: '85%', size: '1.1rem', dx: '-20px', dy: '-40px', dur: '15s', delay: '3s', scale: 0.5 },
        { emoji: '🍰', top: '35%', left: '5%',  size: '1.2rem', dx: '25px', dy: '-50px', dur: '14s', delay: '6s', scale: 0.7 },
        { emoji: '🥘', top: '50%', left: '90%', size: '1.3rem', dx: '-35px', dy: '-45px', dur: '13s', delay: '2s', scale: 0.5 },
        { emoji: '🍵', top: '70%', left: '10%', size: '1rem',   dx: '20px', dy: '-55px', dur: '16s', delay: '8s', scale: 0.6 },
        { emoji: '🥗', top: '80%', left: '80%', size: '1.1rem', dx: '-15px', dy: '-35px', dur: '11s', delay: '5s', scale: 0.7 },
      ].map((p, i) => (
        <div
          key={i}
          className="ea-particle"
          style={{
            top: p.top, left: p.left,
            '--size': p.size, fontSize: p.size,
            '--dx': p.dx, '--dy': p.dy, '--dur': p.dur, '--delay': p.delay,
            '--end-scale': p.scale,
            animationDuration: p.dur, animationDelay: p.delay,
          }}
        >{p.emoji}</div>
      ))}

      {/* ═══ Hero ═══ */}
      <div className="ea-section ea-hero">
        <div
          className={`ea-reveal-scale ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.1s' }}
        >
          <div className="ea-logo-row" onClick={handleLogoTap}>
            <img src="/nakha-logo.png" alt="نَكهة" className="ea-logo-img" draggable={false} />
          </div>
          <div className="ea-soon-tag" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <span className="ea-live-dot" />
            <span>قريباً في بشار</span>
          </div>
        </div>

        <h1
          className={`ea-headline ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.25s' }}
        >
          أكل بيت <em>حقيقي</em>
          <br />
          من بشار لبابك
        </h1>

        <p
          className={`ea-subline ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.4s' }}
        >
          منصة تربط طباخات بشار الموثوقات بالزبائن.
          <br />
          أطباق منزلية طازجة توصلك لبابك.
        </p>

        {/* ── Form ── */}
        <div
          className={`ea-form-wrap ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.55s' }}
        >
          {status === 'success' || status === 'duplicate' ? (
            <div className="ea-success-card">
              <div className="ea-success-check">
                <Check className="w-6 h-6 text-green-400" strokeWidth={2.5} />
              </div>
              <h3>{status === 'duplicate' ? 'أنت مسجّل بالفعل!' : 'تم تسجيلك بنجاح!'}</h3>
              <p>{status === 'duplicate'
                ? 'رقمك في قائمة الانتظار. سنُبلغك فور الإطلاق.'
                : 'سنتواصل معك فور إطلاق المنصة.'}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="ea-form">
              <div className="ea-input-row">
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
                <button
                  type="submit"
                  disabled={!phone.trim() || status === 'loading'}
                  className="ea-submit-btn"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                  ) : (
                    <><ArrowLeft className="w-4 h-4" strokeWidth={2.5} />سجّل</>
                  )}
                </button>
              </div>
              <p className="ea-form-hint">سجّل رقمك لنُبلغك فور الإطلاق — 10 أرقام</p>
              {error && (
                <div className="ea-error-box">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.4} />
                  <span>{error}</span>
                </div>
              )}
            </form>
          )}

          <button
            onClick={() => navigate('/cook-invite')}
            className="ea-cook-invite"
          >
            <KeyRound className="w-4 h-4" strokeWidth={2.2} />
            أنا طباخة ولديّ رمز دعوة
          </button>
        </div>
      </div>

      {/* ═══ Social proof ═══ */}
      <div className="ea-section">
        <div
          className={`ea-proof ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.7s' }}
        >
          <div className="ea-proof-item">
            <span className="ea-proof-num">{waitlistCount > 0 ? `+${waitlistCount}` : '—'}</span>
            <span className="ea-proof-label">في قائمة الانتظار</span>
          </div>
          <div className="ea-proof-item">
            <span className="ea-proof-num">بشار</span>
            <span className="ea-proof-label">أول مدينة إطلاق</span>
          </div>
          <div className="ea-proof-item">
            <span className="ea-proof-num">15</span>
            <span className="ea-proof-label">طباخة مؤسّسة</span>
          </div>
        </div>
      </div>

      <div className="ea-section"><div className="ea-divider" /></div>

      {/* ═══ Early access perks ═══ */}
      <div className="ea-section">
        <div
          className={`ea-perks ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.85s' }}
        >
          <p className="ea-section-title">لماذا تسجّل الآن؟</p>
          <div className="ea-perk-list">
            {[
              'أولوية الوصول عند إطلاق المنصة',
              'دعوات حصرية للمرحلة التجريبية',
              'كن من أوائل المستخدمين في بشار',
            ].map((text, i) => (
              <div className="ea-perk" key={i}>
                <div className="ea-perk-dot" />
                <span className="ea-perk-text">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ea-section"><div className="ea-divider" /></div>

      {/* ═══ How it works ═══ */}
      <div className="ea-section">
        <div
          className={`ea-how ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '1s' }}
        >
          <p className="ea-section-title">كيف تعمل نَكهة؟</p>
          <div className="ea-steps">
            <div className="ea-step">
              <div className="ea-step-icon">
                <ChefHat className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="ea-step-num">الخطوة الأولى</p>
                <p className="ea-step-text">اكتشف طباخات بشار الموثوقات</p>
              </div>
            </div>
            <div className="ea-step">
              <div className="ea-step-icon">
                <ShoppingBag className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="ea-step-num">الخطوة الثانية</p>
                <p className="ea-step-text">اطلب أطباق منزلية أصيلة</p>
              </div>
            </div>
            <div className="ea-step">
              <div className="ea-step-icon">
                <Truck className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="ea-step-num">الخطوة الثالثة</p>
                <p className="ea-step-text">استلمها طازجة على بابك</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ea-section"><div className="ea-divider" /></div>

      {/* ═══ Trust ═══ */}
      <div className="ea-section">
        <div
          className={`ea-trust ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '1.15s' }}
        >
          <p className="ea-section-title">لماذا نَكهة؟</p>
          <div className="ea-trust-grid">
            <div className="ea-trust-card">
              <div className="ea-trust-icon" style={{ background: 'rgba(234,88,12,0.06)', color: 'var(--accent)' }}>
                <ChefHat className="w-4 h-4" strokeWidth={2} />
              </div>
              <span className="ea-trust-label">طباخات حقيقيات من بشار</span>
            </div>
            <div className="ea-trust-card">
              <div className="ea-trust-icon" style={{ background: 'rgba(245,158,11,0.06)', color: 'var(--amber)' }}>
                <Heart className="w-4 h-4" strokeWidth={2} />
              </div>
              <span className="ea-trust-label">جودة الأكل المنزلي</span>
            </div>
            <div className="ea-trust-card">
              <div className="ea-trust-icon" style={{ background: 'rgba(74,222,128,0.06)', color: '#4ade80' }}>
                <Shield className="w-4 h-4" strokeWidth={2} />
              </div>
              <span className="ea-trust-label">تجربة آمنة وبسيطة</span>
            </div>
            <div className="ea-trust-card">
              <div className="ea-trust-icon" style={{ background: 'rgba(96,165,250,0.06)', color: '#60a5fa' }}>
                <MapPin className="w-4 h-4" strokeWidth={2} />
              </div>
              <span className="ea-trust-label">مجتمع محلّي أصيل</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <footer className="ea-footer">
        <p className="ea-footer-brand">نَكهة — منصة الأكل المنزلي</p>
        <div className="ea-footer-social">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Globe className="w-4 h-4" strokeWidth={2} />
          </a>
          <a href="mailto:contact@nakha.app" aria-label="Email">
            <Mail className="w-4 h-4" strokeWidth={2} />
          </a>
        </div>
        <div className="ea-footer-links">
          <a href="/privacy" className="ea-footer-link">سياسة الخصوصية</a>
          <a href="/terms" className="ea-footer-link">الشروط والأحكام</a>
          <a href="/about" className="ea-footer-link">حول نَكهة</a>
        </div>
        <p className="ea-footer-made">صُنع بفخر في الجزائر 🇩🇿</p>
      </footer>

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
