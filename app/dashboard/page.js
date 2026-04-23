"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import CircularProgress from "@/components/CircularProgress";
import DailyRideInput from "@/components/DailyRideInput";
import OdometerInput from "@/components/OdometerInput";
import InitialOdometerSetup from "@/components/InitialOdometerSetup";
import ExpenseInput from "@/components/ExpenseInput";
import AlertModal from "@/components/AlertModal";
import { playWarningSound, sendBrowserNotification } from "@/hooks/useNotifications";
import {
  Bike,
  MapPin,
  Droplets,
  CalendarDays,
  Settings2,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [avgDailyKm, setAvgDailyKm] = useState(0);
  const [totalKmFromHistory, setTotalKmFromHistory] = useState(0);


  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        // Create default doc
        const defaults = {
          email: user.email,
          totalKm: 953.3,
          lastOdometerReading: 953.3,
          oilChangeLimit: 2000,
          lastResetKm: 0,
          createdAt: serverTimestamp(),
        };
        await setDoc(ref, defaults);
        setUserData(defaults);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const allRidesQuery = query(
        collection(db, "rides"),
        where("userId", "==", user.uid)
      );
      const allRidesSnap = await getDocs(allRidesQuery);
      let totalSum = 0;
      allRidesSnap.forEach((d) => {
        totalSum += Number(d.data().km || 0);
      });
      setTotalKmFromHistory(totalSum);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const q = query(
        collection(db, "rides"),
        where("userId", "==", user.uid),
        where("date", ">=", twoWeeksAgo)
      );
      const snap = await getDocs(q);
      let sum = 0;
      snap.forEach(d => { sum += d.data().km; });
      setAvgDailyKm(sum / 14);
    } catch(err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchStats();
    }
  }, [user, fetchUserData, fetchStats]);

  // Check reminder
  useEffect(() => {
    if (!userData) return;
    const { oilChangeLimit, lastResetKm } = userData;
    const remaining = oilChangeLimit - (totalKmFromHistory - lastResetKm);
    if (remaining <= 0) {
        setShowAlert(true);
        if (!showAlert) { // To prevent infinite sounds if it re-renders
            sendBrowserNotification("Oil Change Due! ⚠️", "It's time to change your engine oil. Please check your dashboard.");
            playWarningSound();
        }
    }
  }, [userData, showAlert, totalKmFromHistory]);

  const handleOilChanged = async () => {
    setResetLoading(true);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        lastResetKm: totalKmFromHistory,
        lastOilChangeDate: serverTimestamp(),
      });
      await fetchUserData();
      await fetchStats();
      setShowAlert(false);
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setResetLoading(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl btn-glow flex items-center justify-center">
            <Bike size={24} className="text-white" />
          </div>
          <Loader2 size={24} className="text-purple-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) return null;

  // Show initial odometer setup if not configured
  const hasInitialOdometer = userData.hasInitialOdometer || userData.lastOdometerReading > 0;
  if (!hasInitialOdometer) {
    return (
      <>
        <Navbar />
        <InitialOdometerSetup 
          onComplete={fetchUserData} 
          currentOdometerReading={userData.lastOdometerReading || 0}
        />
      </>
    );
  }

  const { oilChangeLimit = 2000, lastResetKm = 0, lastOilChangeDate, quickAddKm = 0, mechanicPhone = "" } = userData;
  const totalKm = totalKmFromHistory;
  const kmSinceReset = totalKm - lastResetKm;
  const remainingKm = oilChangeLimit - kmSinceReset;
  const oilUsedPct = Math.min(100, (kmSinceReset / oilChangeLimit) * 100);
  const isDue = remainingKm <= 0;

  const lastOilStr = lastOilChangeDate
    ? new Date(
        lastOilChangeDate.seconds !== undefined 
          ? lastOilChangeDate.seconds * 1000 
          : lastOilChangeDate instanceof Date 
            ? lastOilChangeDate 
            : typeof lastOilChangeDate.toMillis === "function" 
              ? lastOilChangeDate.toMillis() 
              : lastOilChangeDate
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";

  return (
    <>
      <Navbar />
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        onConfirm={handleOilChanged}
        loading={resetLoading}
      />

      <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Hey, {user.email?.split("@")[0]} 👋
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {isDue ? (
                  <span className="text-red-400 font-medium">⚠️ Oil change is overdue!</span>
                ) : (
                  "Your bike health at a glance."
                )}
              </p>
            </div>
            {isDue && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAlert(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-sm shadow-lg shadow-red-500/30"
              >
                <RefreshCw size={15} /> Reset Oil Change
              </motion.button>
            )}
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={MapPin}
              label="Total KM Ridden"
              value={`${totalKm.toLocaleString()} km`}
              sub="Lifetime distance"
              color="purple"
              delay={0}
            />
            <StatCard
              icon={Droplets}
              label="Remaining KM"
              value={isDue ? "0 km" : `${remainingKm.toFixed(0)} km`}
              sub={isDue ? "Oil change overdue!" : "Until oil change"}
              color={isDue ? "purple" : "blue"}
              delay={0.1}
              danger={isDue}
            />
            <StatCard
              icon={CalendarDays}
              label="Last Oil Change"
              value={lastOilStr}
              sub="Date of last reset"
              color="cyan"
              delay={0.2}
            />
            <StatCard
              icon={Settings2}
              label="Oil Change Limit"
              value={`${oilChangeLimit.toLocaleString()} km`}
              sub="Current interval"
              color="green"
              delay={0.3}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress (large) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`glass rounded-2xl border p-8 flex flex-col items-center justify-center gap-6 h-fit self-start sticky top-28 lg:top-32 ${
                isDue ? "border-red-500/30 danger-glow" : "border-white/8"
              }`}
            >
              <h2 className="text-lg font-semibold text-white self-start">Oil Change Progress</h2>
              <CircularProgress
                percentage={oilUsedPct}
                remainingKm={remainingKm}
                limit={oilChangeLimit}
                danger={isDue}
              />
              
              <div className="w-full mt-2 p-5 rounded-2xl bg-slate-900/50 border border-white/5 flex justify-between items-center">
                 <span className="text-slate-400 text-sm font-medium">Km since last change</span>
                 <span className="text-white font-mono text-lg font-bold">{kmSinceReset.toFixed(1)} km</span>
              </div>
            </motion.div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Action Cards (Add Ride, Odometer & Add Expense) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-6">
                    {/* Odometer Reading */}
                    <OdometerInput 
                      onRideAdded={fetchUserData} 
                      currentStats={{ totalKm, lastResetKm, oilChangeLimit, lastOdometerReading: userData.lastOdometerReading || 0 }}
                    />
                 </div>
                 <div className="space-y-6">
                    {/* Add ride */}
                    <DailyRideInput 
                      onRideAdded={fetchUserData} 
                      quickAddKm={quickAddKm} 
                      mechanicPhone={mechanicPhone} 
                      currentStats={{ totalKm, lastResetKm, oilChangeLimit }}
                    />
                    {/* Add expense */}
                    <ExpenseInput onExpenseAdded={fetchUserData} />
                 </div>
              </div>

              {/* Smart Prediction Engine */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="glass rounded-2xl p-6 border border-white/8 relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CalendarDays size={100} />
                 </div>
                 <h3 className="text-lg font-semibold text-white mb-2 relative z-10 flex items-center gap-2">
                     <CalendarDays className="text-cyan-400" size={18} /> Smart Predictor
                 </h3>
                 <p className="text-sm text-slate-400 mb-6 relative z-10">
                     Based on your 14-day riding average of <span className="text-white font-mono">{avgDailyKm.toFixed(1)} km/day</span>
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                        <p className="text-xs text-slate-500 mb-1">Estimated Days Left</p>
                        <p className="text-2xl font-bold text-white">
                           {avgDailyKm > 0 ? Math.max(0, Math.ceil(remainingKm / avgDailyKm)) : "--"} <span className="text-sm font-normal text-slate-400">days</span>
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                        <p className="text-xs text-slate-500 mb-1">Estimated Date</p>
                        <p className="text-lg font-bold text-cyan-400 mt-1">
                           {avgDailyKm > 0 ? (
                              remainingKm > 0 ? new Date(Date.now() + (remainingKm / avgDailyKm) * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
                                month: "short", day: "numeric", year: "numeric"
                              }) : "Overdue"
                           ) : "Need more data"}
                        </p>
                    </div>
                 </div>
              </motion.div>


            </div>
          </div>
        </div>
      </main>
    </>
  );
}
