import React from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 text-emerald-500 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Activity className="h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <span className="tracking-tighter text-white font-black text-2xl uppercase leading-none">AFTERLAUNCH</span>
              <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.2em] mt-1">Status Pro</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-neutral-500 text-sm mt-2">{subtitle}</p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
