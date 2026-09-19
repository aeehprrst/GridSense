"use client";

/**
 * Hydration-safe reduced-motion preference.
 *
 * THE BUG THIS EXISTS TO FIX
 *
 * framer-motion's useReducedMotion() reads matchMedia. On the server there is no
 * matchMedia, so it is false; on the client's very first render it is already
 * true for anyone who has the preference set. Every component in this folder
 * branches its MARKUP on that value — Reveal returns a plain tag instead of a
 * motion one, ScrollProgress and RouteVeil return null, Magnetic returns a bare
 * span. So for a reduced-motion visitor the server sent one tree and the client
 * produced a different one, React reported a hydration mismatch, and recovered
 * the only way it can: by throwing the whole tree away and re-rendering it on
 * the client. On every page load, on every route.
 *
 * That is both a console error a visitor can see and a genuine performance
 * cost — the exact opposite of what the motion system is for.
 *
 * THE FIX
 *
 * Report "no preference" until the component has mounted. The server and the
 * first client render then agree by construction, and the real preference is
 * applied immediately afterwards.
 *
 * The swap runs in a layout effect rather than useEffect so it lands before the
 * browser paints: a reduced-motion user must never catch a frame of the
 * animated tree. useLayoutEffect warns if it runs during SSR, so it is selected
 * only in the browser — the standard isomorphic-layout-effect shim.
 */

import { useEffect, useLayoutEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useSafeReducedMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Before mount the answer is always "no preference", which is what the server
  // rendered. framer-motion can return null, so coerce rather than pass through.
  return mounted ? reduce === true : false;
}
