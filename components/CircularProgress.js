"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Droplets } from "lucide-react";

export default function CircularProgress({ percentage, remainingKm, limit, danger }) {
  const [progress, setProgress] = useState(0);
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(clampedPct), 200);
    return () => clearTimeout(timer);
  }, [clampedPct]);

  const gradId = danger ? "dangerGrad" : "progressGrad";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "backOut" }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${
            danger ? "bg-red-500" : "bg-purple-500"
          }`}
        />
        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
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
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Droplets
            size={22}
            className={danger ? "text-red-400" : "text-purple-400"}
          />
          <span className={`text-3xl font-bold mt-1 ${danger ? "text-red-400" : "text-white"}`}>
            {Math.round(clampedPct)}%
          </span>
          <span className="text-xs text-slate-500 text-center leading-tight px-4 mt-1">
            {danger ? "Change Now!" : "oil used"}
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="text-center">
        <p className={`text-lg font-semibold ${danger ? "text-red-400" : "gradient-text"}`}>
          {danger ? "⚠️ Oil Change Due!" : `${remainingKm >= 0 ? remainingKm : 0} km remaining`}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {danger ? "Please reset after oil change" : `until next oil change (${limit?.toLocaleString()} km limit)`}
        </p>
      </div>
    </motion.div>
  );
}
