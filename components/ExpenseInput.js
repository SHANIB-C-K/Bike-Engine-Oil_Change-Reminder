"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader2, IndianRupee, Tag, CalendarDays } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function ExpenseInput({ onExpenseAdded }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Fuel");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    
    setLoading(true);

    try {
      await addDoc(collection(db, "expenses"), {
        userId: user.uid,
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
      transition={{ duration: 0.5, delay: 0.35 }}
      className="glass rounded-2xl p-6 border border-white/8"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <IndianRupee size={18} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Add Expense</h3>
          <p className="text-xs text-slate-500">Track fuel, service, etc.</p>
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
          whileTap={{ scale: 0.97 }}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <PlusCircle size={18} />
          )}
          {loading ? "Adding..." : "Add Expense"}
        </motion.button>
      </form>
    </motion.div>
  );
}
