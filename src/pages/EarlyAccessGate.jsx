import { useState, useRef, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { DEMO_MODE } from '../config/settings';
import {
  ArrowLeft, Check, AlertCircle, Loader2,
  ChefHat, ShoppingBag, Truck, Shield, Heart,
  MapPin, Sparkles, Lock, Clock, Award, Users,
  Mail, Globe, Play,
} from 'lucide-react';

const ADMIN_BYPASS_CODE = 'NAKHA-ADMIN-2026';

const FOOD_SHOWCASE = [
  {
    emoji: '🥘',
    name: 'كسكس بالخضر',
    note: 'وصفة الجدة',
    gradient: 'linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f59e0b 100%)',
  },
  {
    emoji: '🍲',
    name: 'طاجين الحلو',
    note: 'لحم وبرقوق',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)',
  },
  {
    emoji: '🍜',
    name: 'الرشتة',
    note: 'بالدجاج البلدي',
    gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #fbbf24 100%)',
  },
  {
    emoji: '🥮',
    name: 'حلويات منزلية',
    note: 'مقروط ومخبوزات',
    gradient: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #f59e0b 100%)',
  },
  {
    emoji: '🫓',
    name: 'خبز الدار',
    note: 'مطلوع وخمير',
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
  },
  {
    emoji: '🍵',
    name: 'شاي بالنعناع',
    note: 'مع الحلويات',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #facc15 100%)',
  },
];

export default function EarlyAccessGate({ onBypass }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);

  const [showBypass, setShowBypass] = useState(false);
  const [bypassCode, setBypassCode] = useState('');
  const [bypassError, setBypassError] = useState('');
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Show sticky CTA after user scrolls past the hero form
  useEffect(() => {
    const onScroll = () => {
      if (!formRef.current) return;
      const rect = formRef.current.getBoundingClientRect();
      setShowStickyCta(rect.bottom < 0 && status !== 'success' && status !== 'duplicate');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [status]);

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

  const handleDemoEnter = () => {
    sessionStorage.setItem('nakha_bypass', '1');
    navigate('/');
    onBypass();
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => formRef.current?.querySelector('input')?.focus(), 600);
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

  const r = revealed;

  return (
    <div dir="rtl" className="ea">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@200;300;400;500;600;700;800&display=swap');

        .ea {
          --bg: #0a0705;
          --bg-2: #110b07;
          --bg-card: rgba(255,245,230,0.028);
          --bg-card-hover: rgba(255,245,230,0.045);
          --accent: #ea580c;
          --accent-2: #f59e0b;
          --accent-glow: rgba(234,88,12,0.25);
          --text: #faf6f0;
          --text-mid: #c9bcab;
          --text-muted: #8a7b6b;
          --border: rgba(255,245,230,0.07);
          --border-strong: rgba(255,245,230,0.12);

          font-family: 'Readex Pro', system-ui, sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100dvh;
          overflow-x: hidden;
          position: relative;
          letter-spacing: -0.005em;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Ambient orbs ── */
        .ea::before {
          content: '';
          position: fixed;
          top: -25%;
          left: 50%;
          transform: translateX(-50%);
          width: 900px; height: 900px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234,88,12,0.10) 0%, rgba(234,88,12,0.025) 38%, transparent 70%);
          pointer-events: none;
          animation: ambient-pulse 9s ease-in-out infinite;
        }
        .ea::after {
          content: '';
          position: fixed;
          bottom: -30%;
          right: -10%;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }
        @keyframes ambient-pulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.08); }
        }

        /* ── Grain texture ── */
        .ea-grain {
          position: fixed; inset: 0;
          pointer-events: none;
          opacity: 0.04;
          z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E");
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
          transform: scale(0.94);
          transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .ea-reveal-scale.on { opacity: 1; transform: scale(1); }

        /* ═══ HERO ═══ */
        .ea-hero {
          padding-top: max(env(safe-area-inset-top, 0px), 2rem);
          padding-bottom: 0.75rem;
          text-align: center;
        }
        .ea-logo-row {
          display: flex; align-items: center; justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          user-select: none;
        }
        .ea-logo-img {
          width: 96px;
          height: auto;
          filter: drop-shadow(0 0 32px rgba(234,88,12,0.32));
        }
        .ea-soon-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 14px;
          margin-bottom: 1.1rem;
          background: linear-gradient(135deg, rgba(234,88,12,0.12), rgba(245,158,11,0.06));
          border: 1px solid rgba(234,88,12,0.22);
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #fdba74;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 20px rgba(234,88,12,0.10), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .ea-live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #fb923c;
          box-shadow: 0 0 12px #fb923c, 0 0 4px #fb923c;
          animation: dot-pulse 2.2s ease-in-out infinite;
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.7; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .ea-headline {
          font-size: clamp(1.6rem, 6.4vw, 2.25rem);
          font-weight: 700;
          line-height: 1.32;
          margin-bottom: 0.85rem;
          color: var(--text);
          letter-spacing: -0.015em;
        }
        .ea-headline em {
          font-style: normal;
          background: linear-gradient(135deg, #fbbf24 0%, #fb923c 50%, #ea580c 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 60px rgba(234,88,12,0.35);
        }
        .ea-subline {
          font-size: 0.92rem;
          font-weight: 400;
          color: var(--text-mid);
          line-height: 1.75;
          max-width: 360px;
          margin: 0 auto;
        }

        /* ═══ FORM ═══ */
        .ea-form-wrap {
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .ea-form {
          position: relative;
          background: linear-gradient(180deg, rgba(255,245,230,0.045), rgba(255,245,230,0.015));
          border: 1px solid var(--border-strong);
          border-radius: 22px;
          padding: 1.1rem;
          backdrop-filter: blur(20px);
          box-shadow:
            0 20px 60px -20px rgba(234,88,12,0.18),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .ea-form::before {
          content: '';
          position: absolute;
          top: 0; left: 12%; right: 12%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(234,88,12,0.5), transparent);
        }
        .ea-input-row {
          display: flex;
          gap: 0.5rem;
          align-items: stretch;
        }
        .ea-input-wrap {
          flex: 1;
          position: relative;
        }
        .ea-input-prefix {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          pointer-events: none;
          letter-spacing: 0.05em;
        }
        .ea-input {
          width: 100%;
          padding: 0.95rem 2.4rem 0.95rem 1rem;
          background: rgba(255,245,230,0.05);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text);
          direction: ltr;
          text-align: center;
          letter-spacing: 0.14em;
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
          border-color: rgba(234,88,12,0.5);
          background: rgba(234,88,12,0.04);
          box-shadow: 0 0 0 4px rgba(234,88,12,0.08);
        }
        .ea-submit-btn {
          padding: 0.95rem 1.15rem;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          border: none;
          border-radius: 14px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.86rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow:
            0 8px 24px -4px rgba(234,88,12,0.45),
            inset 0 1px 0 rgba(255,255,255,0.18);
          position: relative;
          overflow: hidden;
        }
        .ea-submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.20) 50%, transparent 60%);
          transform: translateX(-150%);
          transition: transform 0.7s ease;
        }
        .ea-submit-btn:hover:not(:disabled)::after { transform: translateX(150%); }
        .ea-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 12px 30px -4px rgba(234,88,12,0.55),
            inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .ea-submit-btn:active:not(:disabled) { transform: scale(0.97); }
        .ea-submit-btn:disabled { opacity: 0.45; cursor: default; }

        .ea-urgency {
          display: flex; align-items: center; justify-content: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 500;
          color: #fdba74;
          margin-top: 0.85rem;
          letter-spacing: -0.005em;
        }
        .ea-urgency-icon {
          color: #fb923c;
          flex-shrink: 0;
        }
        .ea-form-hint {
          display: flex; align-items: center; justify-content: center;
          gap: 5px;
          font-size: 0.66rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 0.55rem;
          font-weight: 400;
        }
        .ea-error-box {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          background: rgba(220,38,38,0.07);
          border: 1px solid rgba(220,38,38,0.18);
          border-radius: 12px;
          padding: 0.65rem 0.8rem;
          margin-top: 0.7rem;
          font-size: 0.72rem;
          font-weight: 500;
          color: #fca5a5;
        }

        /* ── Success ── */
        .ea-success-card {
          background: linear-gradient(180deg, rgba(74,222,128,0.08), rgba(74,222,128,0.02));
          border: 1px solid rgba(74,222,128,0.18);
          border-radius: 22px;
          padding: 1.85rem 1.25rem;
          text-align: center;
          animation: pop-in 0.45s cubic-bezier(0.16,1,0.3,1);
          position: relative;
          overflow: hidden;
        }
        .ea-success-card::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; right: 15%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(74,222,128,0.6), transparent);
        }
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .ea-success-check {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(74,222,128,0.12);
          border: 1px solid rgba(74,222,128,0.25);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.85rem;
          box-shadow: 0 0 24px rgba(74,222,128,0.18);
        }
        .ea-success-card h3 {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 0.45rem;
          color: var(--text);
        }
        .ea-success-card p {
          font-size: 0.82rem;
          color: var(--text-mid);
          line-height: 1.7;
        }

        /* ── Cook invite button ── */
        .ea-cook-invite {
          display: flex; align-items: center; justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(255,245,230,0.03);
          border: 1.5px solid var(--border-strong);
          border-radius: 16px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-mid);
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 0.9rem;
        }
        .ea-cook-invite:hover {
          background: rgba(234,88,12,0.06);
          border-color: rgba(234,88,12,0.3);
          color: #fdba74;
          box-shadow: 0 0 20px rgba(234,88,12,0.10);
        }
        .ea-cook-invite:active { transform: scale(0.98); }

        /* ── Demo entry (only when DEMO_MODE) ── */
        .ea-demo-enter {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px;
          margin: 0.65rem auto 0;
          padding: 0.5rem 0.9rem;
          background: rgba(255,245,230,0.025);
          border: 1px dashed rgba(234,88,12,0.28);
          border-radius: 999px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(253,186,116,0.85);
          cursor: pointer;
          transition: all 0.25s;
        }
        .ea-demo-enter:hover {
          background: rgba(234,88,12,0.06);
          border-color: rgba(234,88,12,0.5);
          color: #fdba74;
        }
        .ea-demo-enter:active { transform: scale(0.97); }
        .ea-demo-wrap {
          display: flex; justify-content: center;
        }

        /* ═══ FOOD SHOWCASE ═══ */
        .ea-food {
          padding: 2.25rem 0 1.25rem;
        }
        .ea-section-eyebrow {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: var(--accent);
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .ea-section-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text);
          text-align: center;
          margin-bottom: 0.4rem;
          letter-spacing: -0.01em;
        }
        .ea-section-sub {
          font-size: 0.82rem;
          color: var(--text-mid);
          text-align: center;
          margin-bottom: 1.4rem;
          line-height: 1.6;
        }
        .ea-food-scroll {
          margin: 0 -1.25rem;
          padding: 0 1.25rem 0.5rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .ea-food-scroll::-webkit-scrollbar { display: none; }
        .ea-food-track {
          display: flex;
          gap: 0.7rem;
          width: max-content;
        }
        .ea-food-card {
          position: relative;
          width: 168px;
          height: 220px;
          flex-shrink: 0;
          border-radius: 22px;
          overflow: hidden;
          scroll-snap-align: start;
          box-shadow:
            0 12px 32px -6px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.08);
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .ea-food-card:hover { transform: translateY(-4px); }
        .ea-food-bg {
          position: absolute; inset: 0;
        }
        .ea-food-grain {
          position: absolute; inset: 0;
          opacity: 0.15;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .ea-food-glow {
          position: absolute;
          top: -30%; left: -30%;
          width: 160%; height: 160%;
          background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25), transparent 50%);
          pointer-events: none;
        }
        .ea-food-emoji {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -58%);
          font-size: 5rem;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.35));
        }
        .ea-food-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.7) 100%);
        }
        .ea-food-info {
          position: absolute;
          left: 0.85rem; right: 0.85rem; bottom: 0.75rem;
          text-align: right;
        }
        .ea-food-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .ea-food-note {
          font-size: 0.66rem;
          font-weight: 500;
          color: rgba(255,255,255,0.78);
          margin-top: 2px;
          text-shadow: 0 1px 6px rgba(0,0,0,0.4);
        }
        .ea-food-tag {
          position: absolute;
          top: 0.65rem; right: 0.65rem;
          padding: 4px 8px;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 999px;
          font-size: 0.58rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.04em;
        }

        /* ═══ TRUST BLOCKS (replacement for waitlist count) ═══ */
        .ea-pillars {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          padding: 1.5rem 0 0.5rem;
        }
        .ea-pillar {
          position: relative;
          padding: 0.95rem 0.6rem;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,245,230,0.04), rgba(255,245,230,0.01));
          border: 1px solid var(--border);
          text-align: center;
          transition: border-color 0.3s, transform 0.3s, background 0.3s;
        }
        .ea-pillar:hover {
          border-color: rgba(234,88,12,0.22);
          transform: translateY(-2px);
          background: linear-gradient(180deg, rgba(234,88,12,0.05), rgba(234,88,12,0.01));
        }
        .ea-pillar-icon {
          width: 32px; height: 32px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center; justify-content: center;
          margin-bottom: 0.45rem;
          background: rgba(234,88,12,0.10);
          color: var(--accent);
        }
        .ea-pillar-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text);
          display: block;
          line-height: 1.35;
        }
        .ea-pillar-hint {
          font-size: 0.6rem;
          font-weight: 400;
          color: var(--text-muted);
          margin-top: 3px;
          display: block;
        }

        .ea-keepers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .ea-keeper {
          padding: 0.85rem 0.85rem;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(245,158,11,0.06), rgba(234,88,12,0.02));
          border: 1px solid rgba(245,158,11,0.15);
          display: flex; align-items: center; gap: 0.65rem;
        }
        .ea-keeper-icon {
          width: 32px; height: 32px;
          border-radius: 10px;
          background: rgba(245,158,11,0.12);
          color: var(--accent-2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ea-keeper-num {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
        }
        .ea-keeper-label {
          font-size: 0.62rem;
          font-weight: 500;
          color: var(--text-muted);
          display: block;
          margin-top: 2px;
        }

        /* ═══ DIVIDER ═══ */
        .ea-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-strong), transparent);
          margin: 1.25rem 0;
        }

        /* ═══ HOW IT WORKS ═══ */
        .ea-how {
          padding: 1.75rem 0;
        }
        .ea-steps {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .ea-step {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.95rem;
          padding: 1.1rem 1.1rem;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,245,230,0.04), rgba(255,245,230,0.01));
          border: 1px solid var(--border);
          transition: border-color 0.3s, background 0.3s, transform 0.3s;
          overflow: hidden;
        }
        .ea-step:hover {
          border-color: rgba(234,88,12,0.2);
          background: linear-gradient(180deg, rgba(234,88,12,0.04), rgba(234,88,12,0.01));
        }
        .ea-step-num {
          position: absolute;
          left: 0.8rem;
          top: 0.5rem;
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          opacity: 0.6;
        }
        .ea-step-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(234,88,12,0.18), rgba(245,158,11,0.08));
          border: 1px solid rgba(234,88,12,0.18);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: #fdba74;
          box-shadow: 0 4px 16px -4px rgba(234,88,12,0.25);
        }
        .ea-step-body {
          flex: 1;
        }
        .ea-step-text {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text);
          line-height: 1.4;
          margin-bottom: 2px;
        }
        .ea-step-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 400;
        }

        /* ═══ TRUST GRID (why Nakha) ═══ */
        .ea-trust {
          padding: 1.5rem 0;
        }
        .ea-trust-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.55rem;
        }
        .ea-trust-card {
          padding: 1.05rem 0.85rem;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,245,230,0.04), rgba(255,245,230,0.01));
          border: 1px solid var(--border);
          text-align: center;
          transition: border-color 0.3s, background 0.3s, transform 0.3s;
        }
        .ea-trust-card:hover {
          border-color: rgba(234,88,12,0.22);
          transform: translateY(-2px);
        }
        .ea-trust-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.55rem;
        }
        .ea-trust-label {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--text);
          display: block;
          line-height: 1.4;
        }
        .ea-trust-desc {
          font-size: 0.64rem;
          font-weight: 400;
          color: var(--text-muted);
          margin-top: 3px;
          display: block;
          line-height: 1.55;
        }

        /* ═══ FINAL CTA STRIP ═══ */
        .ea-final {
          padding: 1.75rem 0 0.5rem;
          text-align: center;
        }
        .ea-final-card {
          background: linear-gradient(135deg, rgba(234,88,12,0.10), rgba(245,158,11,0.04));
          border: 1px solid rgba(234,88,12,0.22);
          border-radius: 22px;
          padding: 1.4rem 1.1rem;
          position: relative;
          overflow: hidden;
        }
        .ea-final-card::before {
          content: '';
          position: absolute;
          top: -50%; right: -20%;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(245,158,11,0.18), transparent 60%);
          pointer-events: none;
        }
        .ea-final-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.35rem;
        }
        .ea-final-sub {
          font-size: 0.78rem;
          color: var(--text-mid);
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .ea-final-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0.85rem 1.4rem;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          border: none;
          border-radius: 14px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 24px -4px rgba(234,88,12,0.45), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .ea-final-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px -4px rgba(234,88,12,0.55), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .ea-final-btn:active { transform: scale(0.97); }

        /* ═══ FOOTER ═══ */
        .ea-footer {
          position: relative;
          z-index: 2;
          border-top: 1px solid var(--border);
          padding: 2rem 1.25rem 6.5rem;
          text-align: center;
        }
        .ea-footer-brand {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.25rem;
          letter-spacing: -0.01em;
        }
        .ea-footer-tag {
          font-size: 0.68rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }
        .ea-footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        .ea-footer-link {
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--text-mid);
          text-decoration: none;
          transition: color 0.2s;
        }
        .ea-footer-link:hover { color: var(--accent); }
        .ea-footer-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          margin-bottom: 1.25rem;
        }
        .ea-footer-social a {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.25s;
        }
        .ea-footer-social a:hover {
          color: var(--accent);
          border-color: rgba(234,88,12,0.3);
          background: rgba(234,88,12,0.05);
        }
        .ea-footer-made {
          font-size: 0.66rem;
          color: var(--text-muted);
          letter-spacing: 0.02em;
        }

        /* ═══ STICKY MOBILE CTA ═══ */
        .ea-sticky {
          position: fixed;
          left: 0; right: 0;
          bottom: 0;
          z-index: 30;
          padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom, 0px));
          background: linear-gradient(180deg, rgba(10,7,5,0) 0%, rgba(10,7,5,0.85) 30%, rgba(10,7,5,0.98) 100%);
          backdrop-filter: blur(16px);
          transform: translateY(120%);
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
          pointer-events: none;
        }
        .ea-sticky.on {
          transform: translateY(0);
          pointer-events: auto;
        }
        .ea-sticky-btn {
          width: 100%;
          padding: 1rem 1.2rem;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          border: none;
          border-radius: 16px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow:
            0 12px 32px -6px rgba(234,88,12,0.55),
            inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.2s;
        }
        .ea-sticky-btn:active { transform: scale(0.98); }

        /* ═══ TOAST ═══ */
        .ea-toast {
          position: fixed;
          top: max(env(safe-area-inset-top, 0px), 1rem);
          left: 50%;
          transform: translateX(-50%) translateY(-200%);
          z-index: 60;
          padding: 0.85rem 1.1rem;
          background: linear-gradient(135deg, rgba(20,83,45,0.95), rgba(6,78,59,0.95));
          backdrop-filter: blur(12px);
          border: 1px solid rgba(74,222,128,0.3);
          border-radius: 14px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #d1fae5;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 12px 32px -8px rgba(0,0,0,0.5);
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1);
          max-width: 92vw;
        }
        .ea-toast.on { transform: translateX(-50%) translateY(0); }

        /* ═══ BYPASS MODAL ═══ */
        .ea-bypass-overlay {
          position: fixed; inset: 0; z-index: 70;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          padding: 1rem;
          animation: pop-in 0.25s ease;
        }
        .ea-bypass-card {
          background: #14100b;
          border: 1px solid var(--border-strong);
          border-radius: 22px;
          padding: 1.5rem 1.25rem;
          max-width: 320px;
          width: 100%;
        }
        .ea-bypass-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-mid);
          text-align: center;
          margin-bottom: 1rem;
        }
        .ea-bypass-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255,245,230,0.04);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-size: 0.85rem;
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
          padding: 0.75rem;
          background: rgba(234,88,12,0.12);
          border: 1px solid rgba(234,88,12,0.22);
          border-radius: 12px;
          font-family: 'Readex Pro', system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent);
          cursor: pointer;
          transition: background 0.2s;
        }
        .ea-bypass-btn:hover { background: rgba(234,88,12,0.2); }
        .ea-bypass-error {
          font-size: 0.72rem;
          color: #fca5a5;
          font-weight: 600;
          text-align: center;
          margin-bottom: 0.6rem;
        }

        @media (min-width: 640px) {
          .ea-section { max-width: 560px; }
          .ea-headline { font-size: 2.35rem; }
          .ea-pillars { gap: 0.65rem; }
          .ea-trust-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 768px) {
          .ea-sticky { display: none; }
          .ea-footer { padding-bottom: 2.5rem; }
        }
      `}</style>

      <div className="ea-grain" />

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

      {/* ═══ HERO ═══ */}
      <div className="ea-section ea-hero">
        <div
          className={`ea-reveal-scale ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.1s' }}
        >
          <div className="ea-logo-row" onClick={handleLogoTap}>
            <img src="/nakha-logo.png" alt="نَكهة" className="ea-logo-img" draggable={false} />
          </div>
          <div className="ea-soon-badge">
            <span className="ea-live-dot" />
            <span>قريبًا في بشار</span>
          </div>
        </div>

        <h1
          className={`ea-headline ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.25s' }}
        >
          اطلب أكلات منزلية <em>أصلية</em>
          <br />
          من طباخات موثوقات في بشار
        </h1>

        <p
          className={`ea-subline ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.4s' }}
        >
          منصة نكهة تربطك بطباخات منزليات موثوقات لتحصل على أطباق منزلية طازجة تُوصَل إلى بابك.
        </p>

        {/* ── Form ── */}
        <div
          ref={formRef}
          className={`ea-form-wrap ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.55s' }}
        >
          {status === 'success' || status === 'duplicate' ? (
            <div className="ea-success-card">
              <div className="ea-success-check">
                <Check className="w-7 h-7 text-green-400" strokeWidth={2.5} />
              </div>
              <h3>
                {status === 'duplicate'
                  ? 'أنت مسجّل بالفعل'
                  : 'تم التسجيل بنجاح'}
              </h3>
              <p>
                {status === 'duplicate'
                  ? 'رقمك في القائمة. سنبلغك فور إطلاق المنصة.'
                  : 'سنبلغك عند الإطلاق — ستحصل على أولوية الوصول.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="ea-form">
              <div className="ea-input-row">
                <div className="ea-input-wrap">
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length <= 10) { setPhone(val); setError(''); }
                    }}
                    placeholder="0X XX XX XX XX"
                    className="ea-input"
                    aria-label="رقم الهاتف"
                  />
                  <span className="ea-input-prefix">🇩🇿</span>
                </div>
                <button
                  type="submit"
                  disabled={!phone.trim() || status === 'loading'}
                  className="ea-submit-btn"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                  ) : (
                    <>انضم الآن<ArrowLeft className="w-4 h-4" strokeWidth={2.6} /></>
                  )}
                </button>
              </div>

              <p className="ea-urgency">
                <Sparkles className="w-3.5 h-3.5 ea-urgency-icon" strokeWidth={2.4} />
                سجّل الآن لتحصل على أولوية الوصول عند الإطلاق.
              </p>

              <p className="ea-form-hint">
                <Lock className="w-3 h-3" strokeWidth={2.2} />
                لن نرسل رسائل مزعجة
              </p>

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
            <ChefHat className="w-4 h-4" strokeWidth={2.2} />
            أنا طباخة — انضمي للمنصة
          </button>

          {DEMO_MODE && (
            <div className="ea-demo-wrap">
              <button onClick={handleDemoEnter} className="ea-demo-enter" aria-label="عرض المنصة">
                <Play className="w-3 h-3" strokeWidth={2.4} />
                عرض المنصة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ FOOD SHOWCASE ═══ */}
      <div className="ea-section">
        <div
          className={`ea-food ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.7s' }}
        >
          <p className="ea-section-eyebrow">من المطبخ البشاري</p>
          <h2 className="ea-section-title">أطباق تحكي قصة</h2>
          <p className="ea-section-sub">
            وصفات منزلية أصيلة من قلب بشار، يتم تحضيرها عند الطلب.
          </p>
        </div>

        <div className="ea-food-scroll">
          <div className="ea-food-track">
            {FOOD_SHOWCASE.map((food, i) => (
              <div key={i} className="ea-food-card">
                <div className="ea-food-bg" style={{ background: food.gradient }} />
                <div className="ea-food-glow" />
                <div className="ea-food-grain" />
                <div className="ea-food-emoji">{food.emoji}</div>
                <div className="ea-food-overlay" />
                <div className="ea-food-tag">طازج اليوم</div>
                <div className="ea-food-info">
                  <p className="ea-food-name">{food.name}</p>
                  <p className="ea-food-note">{food.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TRUST PILLARS (replaces waitlist number) ═══ */}
      <div className="ea-section">
        <div
          className={`ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.85s' }}
        >
          <div className="ea-pillars">
            <div className="ea-pillar">
              <div className="ea-pillar-icon">
                <Clock className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span className="ea-pillar-label">إطلاق قريب</span>
              <span className="ea-pillar-hint">في بشار قريبًا</span>
            </div>
            <div className="ea-pillar">
              <div className="ea-pillar-icon">
                <Sparkles className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span className="ea-pillar-label">وصول مبكر</span>
              <span className="ea-pillar-hint">للمسجّلين أولاً</span>
            </div>
            <div className="ea-pillar">
              <div className="ea-pillar-icon">
                <Award className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span className="ea-pillar-label">دعوات حصرية</span>
              <span className="ea-pillar-hint">للمرحلة التجريبية</span>
            </div>
          </div>

          <div className="ea-keepers">
            <div className="ea-keeper">
              <div className="ea-keeper-icon">
                <Users className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div>
                <span className="ea-keeper-num">15 طباخة مؤسِّسة</span>
                <span className="ea-keeper-label">أول من ينضممن للمنصة</span>
              </div>
            </div>
            <div className="ea-keeper">
              <div className="ea-keeper-icon">
                <MapPin className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div>
                <span className="ea-keeper-num">بشار</span>
                <span className="ea-keeper-label">أول مدينة إطلاق</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ea-section"><div className="ea-divider" /></div>

      {/* ═══ HOW IT WORKS ═══ */}
      <div className="ea-section">
        <div
          className={`ea-how ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '0.95s' }}
        >
          <p className="ea-section-eyebrow">كيف تعمل نَكهة</p>
          <h2 className="ea-section-title">ثلاث خطوات فقط</h2>
          <p className="ea-section-sub">
            تجربة بسيطة وآمنة من الطلب حتى الاستلام.
          </p>

          <div className="ea-steps">
            <div className="ea-step">
              <span className="ea-step-num">٠١</span>
              <div className="ea-step-icon">
                <ChefHat className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="ea-step-body">
                <p className="ea-step-text">اكتشف طباخات بشار الموثوقات</p>
                <p className="ea-step-desc">تصفّح الملفات الشخصية والتقييمات.</p>
              </div>
            </div>
            <div className="ea-step">
              <span className="ea-step-num">٠٢</span>
              <div className="ea-step-icon">
                <ShoppingBag className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="ea-step-body">
                <p className="ea-step-text">اطلب أطباق منزلية أصلية</p>
                <p className="ea-step-desc">اختر أطباقك وأكّد طلبك بسهولة.</p>
              </div>
            </div>
            <div className="ea-step">
              <span className="ea-step-num">٠٣</span>
              <div className="ea-step-icon">
                <Truck className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="ea-step-body">
                <p className="ea-step-text">استلمها طازجة عند بابك</p>
                <p className="ea-step-desc">يُحضَّر الطبق عند الطلب ويصلك سريعًا.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ea-section"><div className="ea-divider" /></div>

      {/* ═══ WHY NAKHA ═══ */}
      <div className="ea-section">
        <div
          className={`ea-trust ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '1.05s' }}
        >
          <p className="ea-section-eyebrow">لماذا نَكهة؟</p>
          <h2 className="ea-section-title">طعم البيت بثقة</h2>
          <p className="ea-section-sub">
            تجربة مصمَّمة لأهالي بشار، بمعايير منزلية حقيقية.
          </p>

          <div className="ea-trust-grid">
            <div className="ea-trust-card">
              <div className="ea-trust-icon" style={{ background: 'rgba(234,88,12,0.10)', color: 'var(--accent)' }}>
                <ChefHat className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="ea-trust-label">أطباق منزلية حقيقية</span>
              <span className="ea-trust-desc">تُطبخ في بيوت طباخاتنا.</span>
            </div>
            <div className="ea-trust-card">
              <div className="ea-trust-icon" style={{ background: 'rgba(245,158,11,0.10)', color: 'var(--accent-2)' }}>
                <Heart className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="ea-trust-label">جودة الأكل المنزلي</span>
              <span className="ea-trust-desc">مكوّنات طازجة بنكهة الدار.</span>
            </div>
            <div className="ea-trust-card">
              <div className="ea-trust-icon" style={{ background: 'rgba(74,222,128,0.10)', color: '#4ade80' }}>
                <Shield className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="ea-trust-label">تجربة آمنة وبسيطة</span>
              <span className="ea-trust-desc">طلب سهل ودفع موثوق.</span>
            </div>
            <div className="ea-trust-card">
              <div className="ea-trust-icon" style={{ background: 'rgba(96,165,250,0.10)', color: '#60a5fa' }}>
                <MapPin className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="ea-trust-label">مجتمع محلي أصيل</span>
              <span className="ea-trust-desc">من بشار، لأهل بشار.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FINAL CTA ═══ */}
      <div className="ea-section">
        <div
          className={`ea-final ea-reveal ${r ? 'on' : ''}`}
          style={{ transitionDelay: '1.15s' }}
        >
          <div className="ea-final-card">
            <h2 className="ea-final-title">كن أول من يجرّب نَكهة</h2>
            <p className="ea-final-sub">
              سجّل رقمك الآن واحجز مكانك في قائمة الوصول المبكّر.
            </p>
            <button onClick={scrollToForm} className="ea-final-btn">
              سجّل رقمك
              <ArrowLeft className="w-4 h-4" strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="ea-footer">
        <p className="ea-footer-brand">نَكهة</p>
        <p className="ea-footer-tag">منصة الأكل المنزلي في بشار</p>
        <div className="ea-footer-social">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Globe className="w-4 h-4" strokeWidth={2} />
          </a>
          <a href="mailto:contactnaqha@gmail.com" aria-label="Email">
            <Mail className="w-4 h-4" strokeWidth={2} />
          </a>
        </div>
        <div className="ea-footer-links">
          <a href="/about" className="ea-footer-link">عنّا</a>
          <a href="/privacy" className="ea-footer-link">الخصوصية</a>
          <a href="/terms" className="ea-footer-link">الشروط</a>
        </div>
        <p className="ea-footer-made">صُنع بفخر في الجزائر 🇩🇿</p>
      </footer>

      {/* ═══ STICKY MOBILE CTA ═══ */}
      <div className={`ea-sticky ${showStickyCta ? 'on' : ''}`}>
        <button onClick={scrollToForm} className="ea-sticky-btn">
          <Sparkles className="w-4 h-4" strokeWidth={2.4} />
          سجّل الآن
        </button>
      </div>

      {/* ═══ TOAST ON SUCCESS ═══ */}
      <div className={`ea-toast ${status === 'success' ? 'on' : ''}`}>
        <Check className="w-4 h-4 flex-shrink-0" strokeWidth={2.6} />
        تم التسجيل بنجاح — سنبلغك عند الإطلاق
      </div>

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
