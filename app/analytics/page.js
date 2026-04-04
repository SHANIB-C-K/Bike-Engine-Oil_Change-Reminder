"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import { Loader2, TrendingUp, IndianRupee, MapPin } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [rides, setRides] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch Rides
        const qRides = query(
          collection(db, "rides"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        );
        const rideSnaps = await getDocs(qRides);
        const rData = rideSnaps.docs.map(d => ({
          id: d.id,
          ...d.data(),
          dateObj: d.data().date?.toDate() || new Date()
        }));
        setRides(rData);

        // Fetch Expenses
        const qExp = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        );
        const expSnaps = await getDocs(qExp);
        const eData = expSnaps.docs.map(d => ({
          id: d.id,
          ...d.data(),
          dateObj: d.data().date?.toDate() || new Date()
        }));
        setExpenses(eData);

      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Process data for charts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: format(d, 'MMM dd'),
      rawDate: d,
      km: 0,
      expense: 0
    };
  });

  rides.forEach(r => {
    const t = last7Days.find(d => isSameDay(d.rawDate, r.dateObj));
    if (t) t.km += r.km;
  });

  expenses.forEach(e => {
    const t = last7Days.find(d => isSameDay(d.rawDate, e.dateObj));
    if (t) t.expense += e.amount;
  });

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalKm7Days = last7Days.reduce((sum, item) => sum + item.km, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-cyan-400" /> Analytics Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Visualize your rides and maintenance costs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="glass rounded-2xl p-6 border border-white/10"
             >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <MapPin className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">7-Day Distance</p>
                    <p className="text-3xl font-bold text-white">{totalKm7Days.toFixed(1)} <span className="text-lg text-slate-500">km</span></p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last7Days}>
                      <defs>
                        <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <RechartsTooltip 
                         contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)' }}
                         itemStyle={{ color: '#a855f7' }}
                      />
                      <Area type="monotone" dataKey="km" stroke="#a855f7" fillOpacity={1} fill="url(#colorKm)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="glass rounded-2xl p-6 border border-white/10"
             >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <IndianRupee className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Expenses</p>
                    <p className="text-3xl font-bold text-white">₹{totalExpense.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <RechartsTooltip 
                         contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)' }}
                         itemStyle={{ color: '#10b981' }}
                         cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      />
                      <Bar dataKey="expense" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
