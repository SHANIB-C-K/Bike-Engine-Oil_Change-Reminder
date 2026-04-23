"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Wrench, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

const SERVICE_COLORS = {
  "Oil Change": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Air Filter": "bg-green-500/15 text-green-400 border-green-500/30",
  "Spark Plug": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Chain Service": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Brake Service": "bg-red-500/15 text-red-400 border-red-500/30",
  "Tire Service": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "Battery": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "General Maintenance": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "Other": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export default function ServiceHistory({ onServiceDeleted }) {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filterType, setFilterType] = useState("All");

  const fetchServices = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "services"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        dateObj: d.data().date?.toDate() || new Date(),
      }));
      data.sort((a, b) => b.dateObj - a.dateObj);
      setServices(data);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchServices();
  }, [user]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "services", id));
      toast.success("Service deleted");
      await fetchServices();
      if (onServiceDeleted) onServiceDeleted();
    } catch (err) {
      toast.error("Failed to delete service");
    } finally {
      setDeleting(null);
    }
  };

  const uniqueTypes = ["All", ...new Set(services.map((s) => s.serviceType))];
  const filteredServices =
    filterType === "All"
      ? services
      : services.filter((s) => s.serviceType === filterType);

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
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-2xl p-6 border border-white/8"
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Wrench size={20} className="text-orange-400" /> Service History
      </h2>

      {services.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {uniqueTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterType === type
                  ? "bg-orange-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredServices.length > 0 ? (
          filteredServices.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-xl border bg-slate-900/40 flex items-start justify-between group ${
                SERVICE_COLORS[service.serviceType] ||
                SERVICE_COLORS["Other"]
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold text-white">
                  {service.serviceType}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {format(service.dateObj, "PPP")}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-mono bg-slate-800/50 px-2 py-1 rounded">
                    ₹{service.cost.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {service.costCategory}
                  </span>
                </div>
                {service.notes && (
                  <p className="text-xs text-slate-400 mt-2 italic">
                    "{service.notes}"
                  </p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDelete(service.id)}
                disabled={deleting === service.id}
                className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
              >
                {deleting === service.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </motion.button>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-slate-400 py-8">
            No services recorded yet
          </p>
        )}
      </div>
    </motion.div>
  );
}
