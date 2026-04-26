"use client";
import { motion } from "framer-motion";
import { Bike } from "lucide-react";

export default function VehicleLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-sm mx-auto">
      {/* Container for the animation */}
      <div className="relative w-56 h-36 flex items-center justify-center overflow-hidden rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm shadow-2xl">
        
        {/* Background Speed Lines */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[2px] bg-gradient-to-r from-transparent via-purple-300 to-transparent rounded-full"
              style={{
                top: `${15 + i * 10}%`,
                width: `${Math.random() * 40 + 20}%`,
              }}
              initial={{ left: "100%" }}
              animate={{ left: "-50%" }}
              transition={{
                duration: Math.random() * 0.6 + 0.4,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 0.5,
              }}
            />
          ))}
        </div>

        {/* The Bike */}
        <motion.div
          animate={{
            y: [-3, 3, -3],
            rotate: [-1, 2, -1]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 p-4 rounded-2xl bg-gradient-to-br from-purple-500/80 to-blue-500/80 shadow-[0_0_30px_rgba(168,85,247,0.5)] backdrop-blur-md border border-white/20"
        >
          <Bike size={36} className="text-white" strokeWidth={2.5} />
        </motion.div>

        {/* Road line */}
        <div className="absolute bottom-6 w-full flex justify-center">
          <div className="w-4/5 h-[3px] bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-60" />
        </div>
      </div>

      {/* Text block */}
      <div className="mt-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-1">
          <span className="text-white font-bold tracking-widest text-sm">REVVING UP</span>
          <motion.div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-purple-400"
              />
            ))}
          </motion.div>
        </div>
        <p className="text-xs text-slate-400">Preparing your garage...</p>
      </div>
    </div>
  );
}
