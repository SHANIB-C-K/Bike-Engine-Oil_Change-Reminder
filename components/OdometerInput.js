"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Gauge, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBike } from "@/hooks/useActiveBike";
import toast from "react-hot-toast";
import { playSuccessSound } from "@/hooks/useNotifications";

export default function OdometerInput({ onRideAdded, currentStats, mechanicPhone }) {
  const { user } = useAuth();
  const { activeBikeId } = useActiveBike();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newReading, setNewReading] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const lastOdometerReading = currentStats?.lastOdometerReading || 0;
  const calculatedKm = newReading ? Math.max(0, parseFloat(newReading) - lastOdometerReading) : 0;

  // To handle the daily automated message gatekeeper
  const handleMessageTrigger = async (kmVal) => {
    if (!mechanicPhone || !currentStats) return;

    // We get limits straight from currentStats which should include them
    const newTotal = currentStats.totalKm + kmVal;
    const newSinceReset = newTotal - currentStats.lastResetKm;
    const newRemaining = currentStats.oilChangeLimit - newSinceReset;
    
    // Evaluate daily limit
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lastDate = currentStats.lastMessageDate || "";
    let count = currentStats.dailyMessageCount || 0;

    if (lastDate !== todayStr) {
      // New day, reset count
      count = 0;
    }

    if (count >= 5) {
      toast("Daily auto-message limit (5) reached.", { icon: "🚦" });
      return;
    }

    const appUrl = typeof window !== "undefined" ? `${window.location.origin}/history` : "";
    const details = [
        `🏍️ *BikeCare Tracker Update*`,
        `I just logged an odometer reading, adding *${kmVal.toFixed(1)} km*.`,
        ``,
        `📊 *Current Stats:*`,
        `• Total KM Ridden: *${newTotal.toFixed(1)} km*`,
        `• Oil Change Limit: *${currentStats.oilChangeLimit.toLocaleString()} km*`,
        `• KM Since Last Change: *${(currentStats.totalKm - currentStats.lastResetKm + kmVal).toFixed(1)} km*`,
        `• Oil Change Due In: *${newRemaining > 0 ? newRemaining.toFixed(1) + " km" : "OVERDUE ⚠️"}*`,
        ``,
        `📄 *Full Rides Report:*`,
        appUrl ? `View & download report:\n${appUrl}` : `Open the BikeCare Tracker app > History tab.`,
    ].join('\n');

    const cleanPhone = mechanicPhone.replace(/\D/g, "");
    if (cleanPhone) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || "");
      const waUri = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(details)}`;
      const smsUri = `sms:${cleanPhone}${isIOS ? '&' : '?'}body=${encodeURIComponent(details)}`;

      const pref = currentStats.preferredMethod || "wa"; // 'wa' or 'sms'
      try {
        if (pref === "sms") {
            const smsLink = document.createElement("a");
            smsLink.href = smsUri;
            smsLink.click();
        } else {
            window.open(waUri, "_blank");
        }
        
        toast.success(`Auto-opened ${pref.toUpperCase()}!`);
      } catch(e) { 
        console.warn("App open failed", e); 
        toast.error("Failed to open messaging app automatically.");
      }

      // Update counters in DB
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { 
           dailyMessageCount: count + 1,
           lastMessageDate: todayStr
        });
      } catch {
        console.error("Failed to update message counts");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBikeId) {
      toast.error("Select a bike first.");
      return;
    }

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
        bikeId: activeBikeId,
        reading: reading,
        kmCalculated: kmRidden,
        date: serverTimestamp(),
      });

      // Add corresponding ride entry
      await addDoc(collection(db, "rides"), {
        userId: user.uid,
        bikeId: activeBikeId,
        km: kmRidden,
        odometerEntry: true,
        date: serverTimestamp(),
      });

      // Update only lastOdometerReading (totalKm is now calculated from ride history)
      const bikeRef = doc(db, "users", user.uid, "bikes", activeBikeId);
      await updateDoc(bikeRef, {
        lastOdometerReading: reading,
      });

      setNewReading("");
      setShowCalculation(false);
      playSuccessSound();
      toast.success(`Added ${kmRidden.toFixed(1)} km (${lastOdometerReading} → ${reading})`);

      if (onRideAdded) {
        setTimeout(() => onRideAdded(), 500);
      }

      // Attempt smart message trigger
      await handleMessageTrigger(kmRidden);
    } catch (err) {
      toast.error("Failed to add odometer reading. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!activeBikeId) {
      toast.error("Select a bike first.");
      return;
    }
    if (!newReading || parseFloat(newReading) < 0) {
      toast.error("Please enter a valid odometer reading.");
      return;
    }

    setLoading(true);
    try {
      const reading = parseFloat(newReading);
      const bikeRef = doc(db, "users", user.uid, "bikes", activeBikeId);
      await updateDoc(bikeRef, {
        lastOdometerReading: reading,
      });

      setNewReading("");
      setShowCalculation(false);
      setIsEditMode(false);
      playSuccessSound();
      toast.success(`Odometer updated to ${reading} km`);

      if (onRideAdded) {
        setTimeout(() => onRideAdded(), 500);
      }
    } catch (err) {
      toast.error("Failed to update odometer reading.");
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
            <form onSubmit={isEditMode ? handleUpdate : handleSubmit} className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  {isEditMode ? "Correct Odometer Reading" : "Current Odometer Reading"}
                </label>
                <button 
                  type="button" 
                  onClick={() => setIsEditMode(!isEditMode)} 
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {isEditMode ? "Switch to Add Log Mode" : "Correct / Update Reading"}
                </button>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="number"
                    value={newReading}
                    onChange={(e) => {
                      setNewReading(e.target.value);
                      setShowCalculation(true);
                    }}
                    placeholder={!isEditMode && lastOdometerReading > 0 ? `Above ${lastOdometerReading}` : "Enter reading (e.g. 12450)"}
                    className="glass-input pr-12"
                    min="0"
                    step="0.1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                    km
                  </span>
                </div>
              </div>

              {/* Calculation Preview */}
              <AnimatePresence>
                {showCalculation && newReading && !isEditMode && (
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
                disabled={loading || !newReading || (!isEditMode && calculatedKm <= 0)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full btn-glow text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Gauge size={18} />
                )}
                {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Reading" : `Add ${calculatedKm.toFixed(1)} km`)}
              </motion.button>

              <p className="text-xs text-slate-500 text-center pt-2">
                {isEditMode 
                  ? "This will correct your odometer reading without adding a new log." 
                  : `This will add ${calculatedKm.toFixed(1)} km to your total and update your odometer record.`}
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
