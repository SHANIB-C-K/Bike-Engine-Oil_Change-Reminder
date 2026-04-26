import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { MapPinOff, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20">
        <div className="text-center space-y-6 max-w-md">
          {/* Animated 404 Vehicle SVG */}
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            {/* Pulsing glow background */}
            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full animate-pulse" />
            
            <div className="relative z-10 glass p-6 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <MapPinOff size={64} className="text-purple-400 mb-2 mx-auto" />
              <div className="text-4xl font-black gradient-text">404</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white">Lost Your Way, Rider?</h1>
          <p className="text-slate-400">
            Looks like you've ridden off the map. We can't find the page you're looking for. It might have been moved or deleted.
          </p>

          <Link href="/dashboard" className="inline-flex items-center gap-2 btn-glow px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105 active:scale-95">
            <ArrowLeft size={18} />
            Back to Garage
          </Link>
        </div>
      </div>
    </>
  );
}
