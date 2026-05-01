"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader2, IndianRupee, Tag } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBike } from "@/hooks/useActiveBike";
import toast from "react-hot-toast";

export default function ExpenseInput({ onExpenseAdded }) {
  const { user } = useAuth();
  const { activeBikeId } = useActiveBike();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Fuel");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    
    if (!activeBikeId) {
      toast.error("Select a bike first.");
      return;
    }
    
    setLoading(true);

    try {
      await addDoc(collection(db, "expenses"), {
        userId: user.uid,
        bikeId: activeBikeId,
        amount: parseFloat(amount),
        type,
        date: serverTimestamp(),
      });

      setAmount("");
      toast.success("Expense added successfully!");
      if (onExpenseAdded) onExpenseAdded();
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to add expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
      className="glass rounded-3xl p-7 border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-white/10 transition-colors"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(16,185,129,0.2)]">
          <IndianRupee size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg tracking-tight">Add Expense</h3>
          <p className="text-sm text-slate-400 font-medium">Track fuel, service, etc.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
           <div className="absolute left-4 top-1/2 -translate-y-1/2">
             <IndianRupee size={16} className="text-slate-400" />
           </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="glass-input pl-10"
            min="1"
            required
          />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Tag size={16} className="text-slate-400" />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="glass-input pl-10 appearance-none bg-slate-900 border-white/10"
          >
            <option value="Fuel">Fuel / Petrol</option>
            <option value="Service">Maintenance / Service</option>
            <option value="Parts">Spare Parts</option>
            <option value="Accessories">Accessories</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] border border-emerald-400/20 text-base tracking-wide"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <PlusCircle size={20} />
          )}
          {loading ? "Adding..." : "Add Expense"}
        </motion.button>
      </form>
    </motion.div>
  );
}
