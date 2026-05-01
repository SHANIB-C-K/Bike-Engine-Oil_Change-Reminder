"use client";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, sub, color = "purple", delay = 0, danger = false }) {
  const colorMap = {
    purple: "from-purple-600/20 via-purple-500/10 to-transparent border-purple-500/30 text-purple-400 shadow-[0_4px_20px_rgba(168,85,247,0.1)]",
    blue: "from-blue-600/20 via-blue-500/10 to-transparent border-blue-500/30 text-blue-400 shadow-[0_4px_20px_rgba(59,130,246,0.1)]",
    cyan: "from-cyan-600/20 via-cyan-500/10 to-transparent border-cyan-500/30 text-cyan-400 shadow-[0_4px_20px_rgba(6,182,212,0.1)]",
    green: "from-emerald-600/20 via-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.1)]",
    amber: "from-amber-600/20 via-amber-500/10 to-transparent border-amber-500/30 text-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.1)]",
  };

  const iconBgMap = {
    purple: "bg-purple-500/20 text-purple-300",
    blue: "bg-blue-500/20 text-blue-300",
    cyan: "bg-cyan-500/20 text-cyan-300",
    green: "bg-emerald-500/20 text-emerald-300",
    amber: "bg-amber-500/20 text-amber-300",
  };

  const gradClass = colorMap[color] || colorMap.purple;
  const iconClass = iconBgMap[color] || iconBgMap.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`relative overflow-hidden glass rounded-3xl p-6 border bg-gradient-to-br transition-all duration-300 group ${gradClass} ${
        danger ? "danger-glow !border-red-500/50" : ""
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-30 transition-opacity duration-500 group-hover:opacity-60 ${iconClass.split(' ')[0]}`}></div>
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">{label}</p>
          <p className={`text-3xl font-extrabold tracking-tight ${danger ? "text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "text-white"}`}>{value}</p>
          {sub && <p className="text-sm text-slate-500 mt-2 font-medium truncate pr-2">{sub}</p>}
        </div>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner ${
            danger ? "bg-red-500/20 text-red-400" : iconClass
          }`}
        >
          <Icon size={22} className={danger ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : ""} />
        </div>
      </div>
    </motion.div>
  );
}
