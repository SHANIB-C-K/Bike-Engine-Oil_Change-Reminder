"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Loader2, Bike, Camera } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import MeterOCRUpload from "./MeterOCRUpload";
import { playSuccessSound } from "@/hooks/useNotifications";

export default function DailyRideInput({ onRideAdded, quickAddKm = 0, mechanicPhone = "", currentStats }) {
  const { user } = useAuth();
  const [km, setKm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  
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
        `I just logged a ride of *${kmVal} km*.`,
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
      const triggerUri = pref === "sms" ? smsUri : waUri;
      
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
      } catch (err) {
        console.error("Failed to update message counts");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleAddRide(parseFloat(km));
  };

  const handleAddRide = async (kmVal, imgUrl = null) => {
    if (!kmVal || kmVal <= 0) {
      toast.error("Please enter a valid km value.");
      return;
    }
    if (kmVal > 2000) {
      toast.error("Max 2000 km per entry.");
      return;
    }
    setLoading(true);

    try {
      // Add ride doc
      await addDoc(collection(db, "rides"), {
        userId: user.uid,
        km: kmVal,
        meterImage: imgUrl || null,
        date: serverTimestamp(),
      });

      // Update user totalKm
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { totalKm: increment(kmVal) });

      setKm("");
      playSuccessSound();
      toast.success(`Successfully added ${kmVal} km!`);
      
      if (onRideAdded) {
         // wait for UI to catch up
         setTimeout(() => onRideAdded(), 500);
      }
      
      // Attempt smart message trigger
      await handleMessageTrigger(kmVal);

    } catch (err) {
      toast.error("Failed to add ride. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setShowOCR(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl p-6 border border-white/8"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl btn-glow flex items-center justify-center">
            <Bike size={18} className="text-white" />
            </div>
            <div>
            <h3 className="font-semibold text-white">Add Today&apos;s Ride</h3>
            <p className="text-xs text-slate-500">Log your daily kilometers</p>
            </div>
        </div>
        <button 
           onClick={() => setShowOCR(!showOCR)}
           className="p-2 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700 transition"
           title="Auto-read Meter"
        >
           <Camera size={18} />
        </button>
      </div>

      <AnimatePresence>
        {showOCR && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
             <MeterOCRUpload 
                 onCancel={() => setShowOCR(false)} 
                 onOcrSuccess={(val, imgUrl) => { setKm(val); if(imgUrl) handleAddRide(parseFloat(val), imgUrl); }} 
             />
             <div className="my-4 border-b border-white/5" />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            id="km-input"
            type="number"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder="Enter kilometers (e.g. 45)"
            className="glass-input pr-16"
            min="0.1"
            max="2000"
            step="0.1"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
            km
          </span>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full btn-glow text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <PlusCircle size={18} />
          )}
          {loading ? "Adding..." : "Add Ride"}
        </motion.button>
      </form>

      {quickAddKm > 0 && (
        <div className="mt-5 pt-5 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-3">Quick Add (Daily Commute)</p>
          <motion.button
            type="button"
            onClick={() => handleAddRide(quickAddKm)}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full glass border border-purple-500/20 text-purple-300 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-500/10 transition-all disabled:opacity-60"
          >
            <PlusCircle size={16} />
            Add {quickAddKm} km instantly
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
