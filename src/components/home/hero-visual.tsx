"use client";

import { motion, useReducedMotion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 24 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.16, ease }}
      className="relative mx-auto w-full max-w-[18rem] sm:max-w-sm lg:max-w-xl"
    >
      <div className="glow-pulse absolute -inset-6 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="ring-spin pointer-events-none absolute -inset-3 hidden rounded-full border border-dashed border-orange-500/25 sm:block" />
      <div className="absolute -right-2 top-8 hidden h-16 w-16 rounded-full border-4 border-orange-500/20 sm:block lg:-right-6" />

      <div className="hero-float">
        <img
          className="relative aspect-square w-full rounded-full border border-orange-500/20 object-cover shadow-2xl shadow-orange-950/40"
          src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1100&q=85"
          alt="Fresh pepperoni pizza"
        />
      </div>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.55, ease }}
        className="absolute -bottom-2 left-0 rounded-2xl border border-border bg-card p-3 shadow-xl sm:bottom-7 sm:-left-2 sm:p-4"
      >
        <p className="text-[10px] text-muted-foreground sm:text-xs">
          CUSTOMER FAVOURITE
        </p>
        <p className="mt-1 text-sm font-bold sm:text-base">Classic Pepperoni</p>
        <p className="text-xs text-orange-400 sm:text-sm">From ৳650</p>
      </motion.div>
    </motion.div>
  );
}
