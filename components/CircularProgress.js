"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Droplets } from "lucide-react";

export default function CircularProgress({ percentage, remainingKm, limit, danger }) {
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;

  useEffect(() => {
    // Animation trigger can go here if needed
  }, [clampedPct]);

  const gradId = danger ? "dangerGrad" : "progressGrad";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "backOut" }}
      className="flex flex-col items-center gap-6"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${
            danger ? "bg-red-500 animate-pulse" : "bg-cyan-500"
          }`}
        />
        
        {/* Background dark circle */}
        <div className="absolute w-[180px] h-[180px] rounded-full bg-slate-900/80 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] border border-white/5 backdrop-blur-sm" />

        <svg width={size} height={size} className="rotate-[-90deg] relative z-10 drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
            filter="url(#glow)"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <motion.div 
            animate={{ y: [0, -4, 0] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Droplets
              size={24}
              className={danger ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"}
            />
          </motion.div>
          <span className={`text-4xl font-extrabold mt-1 tracking-tight ${danger ? "text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400"}`}>
            {Math.round(clampedPct)}%
          </span>
          <span className="text-xs uppercase tracking-widest text-slate-500 text-center leading-tight mt-1 font-semibold">
            {danger ? "Change Now!" : "Oil Used"}
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="text-center bg-slate-900/50 py-3 px-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <p className={`text-xl font-bold tracking-tight ${danger ? "text-red-400 animate-pulse" : "gradient-text-cyan"}`}>
          {danger ? "⚠️ Immediate Action Required" : `${remainingKm >= 0 ? remainingKm.toLocaleString() : 0} km remaining`}
        </p>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          {danger ? "Please reset after oil change" : `until next oil change (${limit?.toLocaleString()} km limit)`}
        </p>
      </div>
    </motion.div>
  );
}
