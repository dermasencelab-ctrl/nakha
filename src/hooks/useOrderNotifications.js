import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Major triad arpeggio: C5 → E5 → G5
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const tone = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };

    const t = ctx.currentTime;
    tone(523.25, t, 0.45);
    tone(659.25, t + 0.18, 0.45);
    tone(783.99, t + 0.36, 0.65);
  } catch {
    // Audio not supported or blocked
  }
};

export const useOrderNotifications = (cookId) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('nakha_sound') !== 'false'
  );

  // Refs avoid stale closures without re-subscribing the Firestore listener
  const seenIdsRef = useRef(null); // null = first snapshot not processed yet
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('nakha_sound', String(next));
      return next;
    });
  }, []);

  const clearNewCount = useCallback(() => setNewCount(0), []);

  useEffect(() => {
    if (!cookId) return;

    const q = query(
      collection(db, 'orders'),
      where('cookId', '==', cookId),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const currentIds = new Set(snapshot.docs.map((d) => d.id));
      setPendingCount(currentIds.size);

      // First snapshot: record existing IDs silently, no sound
      if (seenIdsRef.current === null) {
        seenIdsRef.current = currentIds;
        return;
      }

      const arrivedIds = [...currentIds].filter(
        (id) => !seenIdsRef.current.has(id)
      );

      if (arrivedIds.length > 0) {
        setNewCount((prev) => prev + arrivedIds.length);
        if (soundEnabledRef.current) playChime();
      }

      seenIdsRef.current = currentIds;
    });

    return () => {
      unsub();
      seenIdsRef.current = null;
    };
  }, [cookId]);

  return { pendingCount, newCount, clearNewCount, soundEnabled, toggleSound };
};
