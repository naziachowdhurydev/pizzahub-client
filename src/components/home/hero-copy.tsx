"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Clock3, Flame, Truck } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroCopy() {
  const prefersReducedMotion = useReducedMotion();

  const rise = (delay: number, y = 16) => ({
    initial: prefersReducedMotion ? false : { opacity: 0, y },
    animate: prefersReducedMotion ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease },
  });

  return (
    <div>
      <motion.p
        {...rise(0.05)}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-400 sm:text-sm"
      >
        <Flame size={16} className="shrink-0" /> HOT, FRESH & MADE WITH LOVE
      </motion.p>

      <motion.h1
        {...rise(0.12, 22)}
        className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
      >
        GOOD TIMES
        <br />
        <span className="text-orange-500">ARE PIZZA</span>
        <br />
        TIMES.
      </motion.h1>

      <motion.p
        {...rise(0.2)}
        className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8"
      >
        Hand-stretched dough, rich sauces and generous toppings. Your next favourite
        slice is just a few clicks away.
      </motion.p>

      <motion.div {...rise(0.28)} className="mt-7 flex flex-wrap gap-3 sm:mt-8">
        <Link
          href="/menu"
          className="group inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-black transition hover:-translate-y-0.5 hover:bg-orange-400"
        >
          Explore menu
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </motion.div>

      <motion.div
        {...rise(0.36)}
        className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs text-muted-foreground sm:mt-12 sm:text-sm"
      >
        <span className="flex items-center gap-2">
          <Clock3 size={17} className="shrink-0 text-orange-500" /> 30 min delivery
        </span>
        <span className="flex items-center gap-2">
          <Truck size={17} className="shrink-0 text-orange-500" /> Fresh to your door
        </span>
      </motion.div>
    </div>
  );
}
