"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBike } from "@/hooks/useActiveBike";
import { CheckSquare, Plus, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const PRESET_CHECKLISTS = {
  "Oil Change": [
    "Prepare bike and warm up engine",
    "Drain old oil",
    "Replace oil filter",
    "Add new oil",
    "Check oil level",
    "Inspect for leaks",
    "Document service date and mileage",
  ],
  "Pre-Ride Inspection": [
    "Check tire pressure and condition",
    "Inspect brake pads and fluid",
    "Test headlight and taillight",
    "Verify fuel level",
    "Check mirrors and reflectors",
    "Test all gears and clutch",
    "Inspect for visible damage",
  ],
  "Monthly Checkup": [
    "Clean air filter",
    "Check chain tension and lubrication",
    "Inspect brake cables",
    "Check battery condition",
    "Verify all lights working",
    "Check tire wear patterns",
    "Clean bike exterior",
  ],
};

export default function MaintenanceChecklist() {
  const { user } = useAuth();
  const { activeBikeId } = useActiveBike();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState("");
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [newItem, setNewItem] = useState("");

  const fetchChecklists = useCallback(async () => {
    if (!user || !activeBikeId) return;
    try {
      const q = query(
        collection(db, "checklists"),
        where("userId", "==", user.uid),
        where("bikeId", "==", activeBikeId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setChecklists(data.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)));
    } catch (err) {
      console.error("Error fetching checklists:", err);
    } finally {
      setLoading(false);
    }
  }, [user, activeBikeId]);

  useEffect(() => {
    if (user) fetchChecklists();
  }, [user, fetchChecklists]);

  const handleCreateFromPreset = async (presetName) => {
    try {
      const items = PRESET_CHECKLISTS[presetName].map((text) => ({
        text,
        completed: false,
      }));

      await addDoc(collection(db, "checklists"), {
        userId: user.uid,
        bikeId: activeBikeId,
        name: presetName,
        items,
        createdAt: serverTimestamp(),
      });

      toast.success(`${presetName} checklist created!`);
      await fetchChecklists();
    } catch {
      toast.error("Failed to create checklist");
    }
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) {
      toast.error("Please enter a checklist name");
      return;
    }

    try {
      await addDoc(collection(db, "checklists"), {
        userId: user.uid,
        bikeId: activeBikeId,
        name: customName,
        items: [],
        createdAt: serverTimestamp(),
      });

      toast.success("Custom checklist created!");
      setCustomName("");
      setShowNewChecklist(false);
      await fetchChecklists();
    } catch {
      toast.error("Failed to create checklist");
    }
  };

  const handleToggleItem = async (checklistId, itemIndex) => {
    try {
      const checklist = checklists.find((c) => c.id === checklistId);
      if (!checklist) return;

      const updatedItems = [...checklist.items];
      updatedItems[itemIndex].completed = !updatedItems[itemIndex].completed;

      await updateDoc(doc(db, "checklists", checklistId), {
        items: updatedItems,
      });

      await fetchChecklists();
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleAddItem = async (checklistId) => {
    if (!newItem.trim()) {
      toast.error("Please enter an item");
      return;
    }

    try {
      const checklist = checklists.find((c) => c.id === checklistId);
      if (!checklist) return;

      const updatedItems = [
        ...checklist.items,
        { text: newItem, completed: false },
      ];

      await updateDoc(doc(db, "checklists", checklistId), {
        items: updatedItems,
      });

      setNewItem("");
      await fetchChecklists();
      toast.success("Item added!");
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleDeleteChecklist = async (id) => {
    try {
      await deleteDoc(doc(db, "checklists", id));
      toast.success("Checklist deleted");
      await fetchChecklists();
    } catch {
      toast.error("Failed to delete checklist");
    }
  };

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
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass rounded-3xl p-7 border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] mb-6 hover:border-white/10 transition-colors">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(59,130,246,0.2)]">
              <CheckSquare size={20} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Maintenance Checklists
              </h2>
              <p className="text-sm text-slate-400 font-medium mt-1">
                Stay organized with task checklists
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewChecklist(!showNewChecklist)}
            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
          >
            <Plus size={20} />
          </motion.button>
        </div>

        {showNewChecklist && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Custom checklist name"
              className="glass-input"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreateCustom}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Create Custom Checklist
            </motion.button>

            <div className="pt-3">
              <p className="text-sm text-slate-400 mb-3">Or use a template:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.keys(PRESET_CHECKLISTS).map((preset) => (
                  <motion.button
                    key={preset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCreateFromPreset(preset)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm transition-all"
                  >
                    {preset}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checklists List */}
      <div className="space-y-4">
        {checklists.length > 0 ? (
          checklists.map((checklist, idx) => {
            const completedCount = checklist.items.filter(
              (item) => item.completed
            ).length;
            const progress =
              checklist.items.length > 0
                ? (completedCount / checklist.items.length) * 100
                : 0;

            return (
              <motion.div
                key={checklist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-3xl p-7 border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {checklist.name}
                    </h3>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                      {completedCount} of {checklist.items.length} completed
                    </p>

                    {/* Progress bar */}
                    <div className="mt-4 w-full bg-slate-900/50 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {checklist.items.map((item, itemIdx) => (
                    <motion.label
                      key={itemIdx}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 cursor-pointer transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() =>
                          handleToggleItem(checklist.id, itemIdx)
                        }
                        className="w-5 h-5 rounded cursor-pointer accent-blue-500"
                      />
                      <span
                        className={`flex-1 ${
                          item.completed
                            ? "line-through text-slate-500"
                            : "text-slate-300"
                        }`}
                      >
                        {item.text}
                      </span>
                    </motion.label>
                  ))}
                </div>

                {/* Add new item */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddItem(checklist.id);
                      }
                    }}
                    placeholder="Add new item..."
                    className="glass-input flex-1 text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddItem(checklist.id)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Add
                  </motion.button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="glass rounded-2xl p-8 border border-white/8 text-center">
            <CheckSquare size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No checklists yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Create one using the button above
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
