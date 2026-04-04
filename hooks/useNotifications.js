"use client";

// Play a futuristic success beep using Web Audio API
export const playSuccessSound = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    // Start at A4
    oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
    // Slide up
    oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio playback issue", e);
  }
};

// Play a warning/error tone
export const playWarningSound = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.3);
  
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
  
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio playback issue", e);
    }
};

export const sendBrowserNotification = (title, body) => {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  const notify = () => new Notification(title, { body, icon: "/favicon.ico" });
  
  if (Notification.permission === "granted") {
     notify();
  } else if (Notification.permission !== "denied") {
     Notification.requestPermission().then(permission => {
       if (permission === "granted") notify();
     });
  }
};
