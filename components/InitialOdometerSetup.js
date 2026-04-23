"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Gauge, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { playSuccessSound } from "@/hooks/useNotifications";

export default function InitialOdometerSetup({ onComplete, currentOdometerReading = 0 }) {
  const { user } = useAuth();
  const [reading, setReading] = useState(currentOdometerReading.toString());
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSetInitialReading = async (e) => {
    e.preventDefault();

    if (!reading || parseFloat(reading) < 0) {
      toast.error("Please enter a valid odometer reading.");
      return;
    }

    const odometerValue = parseFloat(reading);

    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const currentData = snap.data() || {};

      // Only update if not already set
      if (!currentData.hasInitialOdometer || currentData.lastOdometerReading === 0) {
        await updateDoc(userRef, {
          lastOdometerReading: odometerValue,
          totalKm: odometerValue,
          hasInitialOdometer: true,
        });
      }

      playSuccessSound();
      toast.success(`✅ Initial odometer set to ${odometerValue} km!`);
      setIsComplete(true);

      // Call parent callback after a short delay
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
    } catch (err) {
      toast.error("Failed to set initial odometer. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="glass rounded-3xl p-8 border border-green-500/30 max-w-sm mx-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle size={32} className="text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Setup Complete!</h2>
          <p className="text-slate-400 mb-6">
            Your initial odometer reading of <span className="text-green-400 font-mono font-bold">{reading} km</span> has been set.
          </p>
          <p className="text-sm text-slate-500">Redirecting...</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring" }}
        className="glass rounded-3xl p-8 border border-white/8 max-w-sm mx-4"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl btn-glow flex items-center justify-center">
            <Gauge size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Set Initial Odometer</h2>
            <p className="text-sm text-slate-400">Enter your bike's current reading</p>
          </div>
        </div>

        <form onSubmit={handleSetInitialReading} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Odometer Reading
            </label>
            <div className="relative">
              <input
                type="number"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="Enter your bike's odometer (e.g. 953.3)"
                className="glass-input pr-12 text-lg"
                min="0"
                step="0.1"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                km
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This will be your starting point for tracking km ridden.
            </p>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full btn-glow text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Setting...
              </>
            ) : (
              <>
                <Gauge size={18} />
                Set Initial Reading
              </>
            )}
          </motion.button>

          <p className="text-xs text-slate-500 text-center">
            You can always update this later from the odometer reading card.
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
