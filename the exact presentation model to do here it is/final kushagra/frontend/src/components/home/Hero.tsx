"use client";

import Link from "next/link";
import { ArrowUpRight, Crosshair, Radio, Sparkles } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const heroTransition = { duration: 0.9, ease: [0.16, 1, 0.3, 1] } as const;

export function Hero() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const lensX = useSpring(pointerX, { stiffness: 52, damping: 24, mass: 0.8 });
  const lensY = useSpring(pointerY, { stiffness: 52, damping: 24, mass: 0.8 });

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion) return;
    pointerX.set((event.clientX / window.innerWidth - 0.5) * 14);
    pointerY.set((event.clientY / window.innerHeight - 0.5) * 10);
  };

  return (
    <section className="gs-landing gs-orbit-hero relative isolate min-h-[100dvh] overflow-hidden bg-gs-bg-primary text-gs-text-primary" onPointerMove={handlePointerMove}>
      <motion.video className="gs-galaxy-video absolute inset-0 h-full w-full object-cover" src="/galaxy.webm" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
      <motion.video className="gs-landing-video absolute inset-0 h-full w-full object-cover" src="/gridsense-hero.mp4" autoPlay muted loop playsInline preload="auto" aria-label="Animated GridSense globe and national grid network" style={reduceMotion ? undefined : { x: lensX, y: lensY }} />
      <video className="gs-lightning-video absolute right-0 top-0 h-[42%] w-[42%] object-cover" src="/lightning.webm" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
      <div className="gs-landing-scrim absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="gs-orbit-lines absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="gs-landing-grain fixed inset-0 z-0 pointer-events-none" aria-hidden="true" />

      <div className="gs-globe-brand pointer-events-none absolute left-1/2 top-[37%] z-20 w-fit -translate-x-1/2 -translate-y-1/2 text-center" aria-label="GridSense">
        <img src="/gridsense-mark.svg" alt="" className="mx-auto mb-3 h-12 w-12 rounded-xl shadow-[0_0_28px_rgba(91,157,255,.42)] sm:h-14 sm:w-14" />
        <span className="gs-globe-brand-kicker">National grid intelligence</span>
        <span className="gs-globe-brand-title">GridSense</span>
        <span className="gs-globe-brand-rule" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[100dvh] max-w-[1440px] items-end gap-8 px-5 pb-8 pt-28 sm:px-8 sm:pb-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:px-12 lg:pb-12">
        <motion.div className="max-w-2xl" initial={reduceMotion ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...heroTransition, delay: 0.1 }}>
          <p className="mb-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-gs-cyan-300"><Radio className="h-3.5 w-3.5" strokeWidth={1.8} /> Live grid command surface</p>
          <h1 className="gs-landing-title gs-display max-w-[720px] text-balance text-[clamp(3.3rem,5.2vw,5.7rem)] font-bold uppercase leading-[0.9] tracking-[-0.065em]">Read risk.<br />Route resilience.</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-gs-text-secondary sm:text-lg">A connected view of grid health, cascading risk and the next operational decision.</p>
          <div className="mt-7 flex flex-wrap gap-3 sm:mt-8"><Link href="/map-explorer" className="gs-landing-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]">Enter GridSense <ArrowUpRight className="h-4 w-4" strokeWidth={2} /></Link><Link href="/intelligence" className="gs-landing-secondary inline-flex items-center rounded-full border px-5 py-3 text-sm font-semibold backdrop-blur-md transition-colors active:scale-[0.98]">View ML intelligence</Link></div>
        </motion.div>
        <motion.aside className="gs-hero-instrument hidden lg:block" initial={reduceMotion ? false : { opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ ...heroTransition, delay: 0.35 }} aria-label="GridSense system capabilities">
          <div className="flex items-center justify-between border-b border-white/10 pb-3"><span className="font-mono text-[10px] font-bold uppercase tracking-[.13em] text-gs-text-secondary">System layer</span><Crosshair className="h-4 w-4 text-gs-cyan-300" strokeWidth={1.5} /></div>
          <div className="space-y-4 py-4"><InstrumentRow label="Topology" value="Mapped" /><InstrumentRow label="Risk model" value="Active" /><InstrumentRow label="Cascades" value="Simulated" /></div>
          <div className="flex items-center gap-2 border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-[.12em] text-gs-cyan-300"><Sparkles className="h-3.5 w-3.5" strokeWidth={1.6} /> Decision support online</div>
        </motion.aside>
      </div>
    </section>
  );
}

function InstrumentRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-baseline justify-between gap-4"><span className="text-xs text-gs-text-secondary">{label}</span><span className="font-mono text-[10px] font-bold uppercase tracking-[.08em] text-gs-text-primary">{value}</span></div>;
}
