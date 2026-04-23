"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Loader2, TrendingUp, IndianRupee } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";

const COLORS = {
  Fuel: "#a855f7",
  Service: "#f59e0b",
  Parts: "#10b981",
  Accessories: "#06b6d4",
  Other: "#6b7280",
};

export default function ExpenseBreakdown() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("6");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch expenses
        const qExp = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid)
        );
        const expSnaps = await getDocs(qExp);
        const expData = expSnaps.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          dateObj: d.data().date?.toDate() || new Date(),
        }));
        setExpenses(expData);

        // Fetch services
        const qSvc = query(
          collection(db, "services"),
          where("userId", "==", user.uid)
        );
        const svcSnaps = await getDocs(qSvc);
        const svcData = svcSnaps.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          dateObj: d.data().date?.toDate() || new Date(),
        }));
        setServices(svcData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate category breakdown
  const getCategoryBreakdown = () => {
    const breakdown = {};
    expenses.forEach((exp) => {
      const category = exp.type || "Other";
      breakdown[category] = (breakdown[category] || 0) + exp.amount;
    });
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Calculate monthly spending
  const getMonthlySpending = () => {
    const months = parseInt(timeRange);
    const monthlyData = {};

    for (let i = months - 1; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthKey = format(month, "MMM yyyy");
      monthlyData[monthKey] = 0;
    }

    expenses.forEach((exp) => {
      const monthKey = format(exp.dateObj, "MMM yyyy");
      if (monthKey in monthlyData) {
        monthlyData[monthKey] += exp.amount;
      }
    });

    services.forEach((svc) => {
      const monthKey = format(svc.dateObj, "MMM yyyy");
      if (monthKey in monthlyData) {
        monthlyData[monthKey] += svc.cost;
      }
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount,
    }));
  };

  const categoryData = getCategoryBreakdown();
  const monthlyData = getMonthlySpending();

  const totalExpenses = categoryData.reduce((sum, cat) => sum + cat.value, 0);
  const totalServices = services.reduce((sum, svc) => sum + svc.cost, 0);
  const totalSpent = totalExpenses + totalServices;

  const months = parseInt(timeRange);
  const avgMonthly = totalSpent / months;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass rounded-2xl p-6 border border-white/8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <IndianRupee size={20} className="text-emerald-400" /> Expense
              Analytics
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Track your maintenance spending
            </p>
          </div>

          <div className="flex bg-slate-800 rounded-lg p-1 border border-white/10">
            {["3", "6", "12"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timeRange === range
                    ? "bg-emerald-500 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {range} Months
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
            <p className="text-xs text-slate-500 mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-white">
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
            <p className="text-xs text-slate-500 mb-1">Avg Monthly</p>
            <p className="text-2xl font-bold text-emerald-400">
              ₹{avgMonthly.toFixed(0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-500 mb-1">Service Count</p>
            <p className="text-2xl font-bold text-orange-400">
              {services.length}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass rounded-2xl p-6 border border-white/8"
        >
          <h3 className="font-semibold text-white mb-4">Expense Categories</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${((value / totalExpenses) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name] || COLORS.Other}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-8">No expense data</p>
          )}

          {categoryData.length > 0 && (
            <div className="mt-4 space-y-2">
              {categoryData.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          COLORS[cat.name] || COLORS.Other,
                      }}
                    />
                    <span className="text-slate-300">{cat.name}</span>
                  </div>
                  <span className="font-mono text-white">
                    ₹{cat.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Monthly Spending Trend */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass rounded-2xl p-6 border border-white/8"
        >
          <h3 className="font-semibold text-white mb-4">
            Monthly Spending Trend
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                  itemStyle={{ color: "#10b981" }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Bar
                  dataKey="amount"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Amount"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-8">No spending data</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
