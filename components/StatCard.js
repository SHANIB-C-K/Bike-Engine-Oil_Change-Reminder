"use client";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, sub, color = "purple", delay = 0, danger = false }) {
  const colorMap = {
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400",
    cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
    green: "from-green-500/20 to-green-600/5 border-green-500/20 text-green-400",
  };

  const gradClass = colorMap[color] || colorMap.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass rounded-2xl p-6 border bg-gradient-to-br glass-hover transition-all duration-300 ${gradClass} ${
        danger ? "danger-glow" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1 font-medium">{label}</p>
          <p className={`text-3xl font-bold ${danger ? "text-red-400" : "text-white"}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-2">{sub}</p>}
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${
            danger ? "from-red-500/20 to-red-600/5 text-red-400" : gradClass
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}
