import { useState, useEffect, useRef } from "react";

const COOLDOWN_SECONDS = 30;
const MAX_REQUESTS = 3;
const WINDOW_MS = 10 * 60 * 1000;

export function useOtpCooldown(email) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    clearInterval(timerRef.current);
    setSecondsLeft(0);

    // ✅ Skip sessionStorage lookup if email is empty
    if (!email || !email.includes("@")) return;

    try {
      const raw = sessionStorage.getItem(`otp_cooldown_until_${email}`);
      if (raw) {
        const until = parseInt(raw, 10);
        const remaining = Math.ceil((until - Date.now()) / 1000);
        if (remaining > 0) {
          setSecondsLeft(remaining);
        } else {
          sessionStorage.removeItem(`otp_cooldown_until_${email}`);
        }
      }
    } catch { /* ignore */ }
  }, [email]);

  useEffect(() => {
    if (secondsLeft <= 0) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [secondsLeft]);

  const getRateData = () => {
    if (!email) return null;
    try { return JSON.parse(sessionStorage.getItem(`otp_rate_${email}`) || "null"); }
    catch { return null; }
  };

  const canRequest = () => {
    if (!email) return false; // ✅ block if no email
    const data = getRateData();
    if (!data) return true;
    if (Date.now() - data.windowStart > WINDOW_MS) return true;
    return data.count < MAX_REQUESTS;
  };

  const recordRequest = () => {
    if (!email) return;
    const now = Date.now();
    const data = getRateData();
    if (!data || now - data.windowStart > WINDOW_MS) {
      sessionStorage.setItem(`otp_rate_${email}`, JSON.stringify({ count: 1, windowStart: now }));
    } else {
      sessionStorage.setItem(`otp_rate_${email}`, JSON.stringify({ count: data.count + 1, windowStart: data.windowStart }));
    }
  };

  const startCooldown = () => {
    if (!email) return;
    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    try { sessionStorage.setItem(`otp_cooldown_until_${email}`, until.toString()); }
    catch { /* ignore */ }
    setSecondsLeft(COOLDOWN_SECONDS);
  };

  return {
    secondsLeft,
    isCoolingDown: secondsLeft > 0,
    canRequest,
    recordRequest,
    startCooldown,
  };
}