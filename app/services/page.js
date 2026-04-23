"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import ServiceInput from "@/components/ServiceInput";
import ServiceHistory from "@/components/ServiceHistory";
import ExpenseBreakdown from "@/components/ExpenseBreakdown";
import { useAuth } from "@/hooks/useAuth";
import { Wrench, Loader2 } from "lucide-react";

export default function ServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleServiceAdded = () => {
    // Refresh data
  };

  const handleServiceDeleted = () => {
    // Refresh data
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Wrench className="text-orange-400" /> Service Management
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Track all maintenance activities, costs, and service history
            </p>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Add Service Form */}
            <ServiceInput onServiceAdded={handleServiceAdded} />

            {/* Service History */}
            <div className="lg:col-span-2">
              <ServiceHistory onServiceDeleted={handleServiceDeleted} />
            </div>
          </div>

          {/* Analytics Section */}
          <ExpenseBreakdown />
        </div>
      </main>
    </>
  );
}
