"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader2, Wrench, Tag, CalendarDays } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const SERVICE_TYPES = [
  "Oil Change",
  "Air Filter",
  "Spark Plug",
  "Chain Service",
  "Brake Service",
  "Tire Service",
  "Battery",
  "General Maintenance",
  "Other",
];

const COST_CATEGORIES = [
  "Labor",
  "Parts",
  "Oil",
  "Accessories",
];

export default function ServiceInput({ onServiceAdded }) {
  const { user } = useAuth();
  const [serviceType, setServiceType] = useState("Oil Change");
  const [cost, setCost] = useState("");
  const [costCategory, setCostCategory] = useState("Parts");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceType || !cost || cost <= 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "services"), {
        userId: user.uid,
        serviceType,
        cost: parseFloat(cost),
        costCategory,
        notes,
        date: serverTimestamp(),
      });

      setServiceType("Oil Change");
      setCost("");
      setCostCategory("Parts");
      setNotes("");
      toast.success("Service recorded successfully!");
      if (onServiceAdded) onServiceAdded();
    } catch (err) {
      console.error(err);
      toast.error("Failed to record service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl p-6 border border-white/8"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <Wrench size={18} className="text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Record Service</h3>
          <p className="text-xs text-slate-500">Log maintenance activities</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Wrench size={16} className="text-slate-400" />
          </div>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="glass-input pl-10 appearance-none bg-slate-900 border-white/10 w-full"
          >
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Cost"
              className="glass-input"
              min="1"
              step="0.01"
              required
            />
          </div>

          <div className="relative">
            <select
              value={costCategory}
              onChange={(e) => setCostCategory(e.target.value)}
              className="glass-input appearance-none bg-slate-900 border-white/10 w-full"
            >
              {COST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes (optional)"
          className="glass-input resize-none h-20"
        />

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <PlusCircle size={18} />
          )}
          {loading ? "Recording..." : "Record Service"}
        </motion.button>
      </form>
    </motion.div>
  );
}
