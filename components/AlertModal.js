"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, X, Loader2 } from "lucide-react";

export default function AlertModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="alert-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          key="alert-card"
          initial={{ opacity: 0, scale: 0.85, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 24 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="glass rounded-3xl p-8 max-w-md w-full border border-red-500/30 danger-glow"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className="flex flex-col items-center text-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle size={40} className="text-red-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl pulse-ring" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">⚠️ Oil Change Due!</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your bike has reached the oil change limit. For optimal performance and engine
                longevity, please change the oil as soon as possible.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl glass border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
              >
                Remind Later
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle size={15} />
                )}
                {loading ? "Resetting..." : "Oil Changed ✓"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
