"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Gauge, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { playSuccessSound } from "@/hooks/useNotifications";

export default function OdometerInput({ onRideAdded, currentStats }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newReading, setNewReading] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);

  const lastOdometerReading = currentStats?.lastOdometerReading || 0;
  const calculatedKm = newReading ? Math.max(0, parseFloat(newReading) - lastOdometerReading) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newReading || parseFloat(newReading) < 0) {
      toast.error("Please enter a valid odometer reading.");
      return;
    }

    const reading = parseFloat(newReading);

    if (reading === lastOdometerReading) {
      toast.error("New reading must be different from the last reading.");
      return;
    }

    if (reading < lastOdometerReading) {
      toast.error("Odometer reading cannot go backward!");
      return;
    }

    if (calculatedKm > 5000) {
      toast.error("That seems too much in one go! Max 5000 km per entry.");
      return;
    }

    setLoading(true);

    try {
      const kmRidden = calculatedKm;

      // Add odometer entry
      await addDoc(collection(db, "odometer_readings"), {
        userId: user.uid,
        reading: reading,
        kmCalculated: kmRidden,
        date: serverTimestamp(),
      });

      // Add corresponding ride entry
      await addDoc(collection(db, "rides"), {
        userId: user.uid,
        km: kmRidden,
        odometerEntry: true,
        date: serverTimestamp(),
      });

      // Update only lastOdometerReading (totalKm is now calculated from ride history)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        lastOdometerReading: reading,
      });

      setNewReading("");
      setShowCalculation(false);
      playSuccessSound();
      toast.success(`Added ${kmRidden.toFixed(1)} km (${lastOdometerReading} → ${reading})`);

      if (onRideAdded) {
        setTimeout(() => onRideAdded(), 500);
      }
    } catch (err) {
      toast.error("Failed to add odometer reading. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="glass rounded-2xl border border-white/8 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl btn-glow flex items-center justify-center">
            <Gauge size={18} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Odometer Reading</h3>
            <p className="text-xs text-slate-500">
              {lastOdometerReading > 0
                ? `Last: ${lastOdometerReading.toLocaleString()} km`
                : "Set your first reading"}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Odometer Reading
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newReading}
                    onChange={(e) => {
                      setNewReading(e.target.value);
                      setShowCalculation(true);
                    }}
                    placeholder={lastOdometerReading > 0 ? `Above ${lastOdometerReading}` : "Enter reading (e.g. 12450)"}
                    className="glass-input pr-12"
                    min="0"
                    step="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                    km
                  </span>
                </div>
              </div>

              {/* Calculation Preview */}
              <AnimatePresence>
                {showCalculation && newReading && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Last Reading</span>
                      <span className="text-white font-mono font-semibold">
                        {lastOdometerReading.toLocaleString()} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                      <span className="text-slate-300 text-sm">New Reading</span>
                      <span className="text-white font-mono font-semibold">
                        {newReading ? parseInt(newReading).toLocaleString() : "0"} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm font-medium">Km Ridden</span>
                      <span className={`font-mono font-bold text-lg ${
                        calculatedKm > 0 ? "text-green-400" : "text-slate-500"
                      }`}>
                        +{calculatedKm.toFixed(1)} km
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading || !newReading || calculatedKm <= 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full btn-glow text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Gauge size={18} />
                )}
                {loading ? "Adding..." : `Add ${calculatedKm.toFixed(1)} km`}
              </motion.button>

              <p className="text-xs text-slate-500 text-center pt-2">
                This will add {calculatedKm.toFixed(1)} km to your total and update your odometer record.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
