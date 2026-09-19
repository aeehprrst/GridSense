"use client";

/**
 * The liquid-glass navigation bar.
 *
 * The material itself lives in styles/liquid-nav.css; this file is only the
 * machinery that drives it, and almost all of that machinery exists to keep
 * React out of the hot paths.
 *
 *   - The pointer sheen writes two custom properties straight onto the sheen
 *     node through a ref, throttled to one rAF. Putting the pointer in state
 *     would re-render this header — which is mounted on every route — sixty
 *     times a second.
 *   - The lit/unlit class is toggled on the DOM node for the same reason.
 *   - The scroll reader only calls setState when a hysteresis-gated boolean
 *     actually flips, so a full page scroll costs two renders, not hundreds.
 *
 * The one thing that IS React state and has to be is the active pill, because
 * it morphs between items with framer-motion's shared-layout animation, and
 * that needs both the old and the new element in the same render pass.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";
import { Activity, BrainCircuit, ChevronDown, Map, Menu, Moon, Sun, X, Settings } from "lucide-react";
import { AmbientAudioToggle } from "@/components/system/AmbientAudio";

type NavItem = { href: string; label: string; description: string; icon: typeof Map };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { label: "Explore", items: [
    { href: "/map-explorer", label: "Map Explorer", description: "Live GIS telemetry and topology", icon: Map },
  ] },
  { label: "Intelligence", items: [
    { href: "/intelligence", label: "AI Intelligence", description: "Forecasting and root-cause analysis", icon: BrainCircuit },
    { href: "/analytics", label: "Analytics", description: "Grid performance and risk signals", icon: Activity },
  ] },
];

const UTILITY_LINKS = [
  { href: "/documentation", label: "Resources" },
  { href: "/about", label: "About" },
];

/** Asymmetric thresholds. A single threshold makes the bar flicker between the
 *  two geometries when the user rests the page right on it. */
const CONDENSE_AT = 48;
const EXPAND_AT = 18;

/** The pill is the only shared-layout element in the header. Spring rather than
 *  a duration so a fast route change interrupts cleanly instead of queueing. */
const PILL_TRANSITION = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 } as const;

export function Navbar({ variant: _variant = "dark" }: { variant?: "light" | "dark" | "transparent" }) {
  void _variant;
  const pathname = usePathname();
  const reduceMotion = useSafeReducedMotion();

  const [condensed, setCondensed] = useState(false);
  const [booted, setBooted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const headerRef = useRef<HTMLElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const condensedRef = useRef(false);
  const frameRef = useRef(0);

  // The theme is read in an effect, never during render: the server cannot see
  // localStorage, and reading it during render would change the markup between
  // the server pass and hydration. The inline bootstrap in layout.tsx has
  // already applied the class, so there is no flash while we catch up.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem("gridsense-theme");
    } catch {
      /* private mode */
    }
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Scroll → condensed, hysteresis-gated.
  useEffect(() => {
    const read = () => {
      const y = window.scrollY;
      const next = condensedRef.current ? y > EXPAND_AT : y > CONDENSE_AT;
      if (next !== condensedRef.current) {
        condensedRef.current = next;
        setCondensed(next);
      }
    };
    read();
    // Suppress the entry transition for one frame, so a page restored at a
    // scrolled position does not play a 580ms contraction as it appears.
    const raf = requestAnimationFrame(() => setBooted(true));
    window.addEventListener("scroll", read, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", read);
    };
  }, []);

  // Pointer sheen. Written to the DOM directly; no state, no re-render.
  useEffect(() => {
    if (reduceMotion) return;
    const header = headerRef.current;
    const sheen = sheenRef.current;
    if (!header || !sheen) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let pending = false;
    let px = 0;
    let py = 0;

    const apply = () => {
      pending = false;
      const rect = header.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      sheen.style.setProperty("--gs-glass-x", `${((px - rect.left) / rect.width) * 100}%`);
      sheen.style.setProperty("--gs-glass-y", `${((py - rect.top) / rect.height) * 100}%`);
    };

    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      if (pending) return;
      pending = true;
      frameRef.current = requestAnimationFrame(apply);
    };
    const onEnter = () => header.classList.add("is-lit");
    const onLeave = () => header.classList.remove("is-lit");

    header.addEventListener("pointermove", onMove);
    header.addEventListener("pointerenter", onEnter);
    header.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frameRef.current);
      header.removeEventListener("pointermove", onMove);
      header.removeEventListener("pointerenter", onEnter);
      header.removeEventListener("pointerleave", onLeave);
      header.classList.remove("is-lit");
    };
  }, [reduceMotion]);

  // A dropdown that can only be dismissed by the control that opened it is a
  // trap on touch and a nuisance with a mouse.
  useEffect(() => {
    if (!openGroup) return;
    const onDown = (event: MouseEvent) => {
      if (!railRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenGroup(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openGroup]);

  // Navigating with a menu still open would leave it hanging over the new page.
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem("gridsense-theme", next);
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  const isDark = theme === "dark";
  const isCurrent = (href: string) => pathname === href;

  // Exactly one rail slot wears the pill. Groups win over utility links because
  // a group can contain the current route while a utility link cannot.
  const activeGroup = NAV_GROUPS.find((group) => group.items.some((item) => isCurrent(item.href)));
  const activeKey = activeGroup ? `group:${activeGroup.label}` : UTILITY_LINKS.find((link) => isCurrent(link.href)) ? `link:${pathname}` : null;

  const pill = (key: string) =>
    activeKey === key ? (
      <motion.span
        layoutId="gs-nav-pill"
        className="gs-liquid-pill"
        transition={reduceMotion ? { duration: 0 } : PILL_TRANSITION}
        aria-hidden="true"
      />
    ) : null;

  return (
    <header
      ref={headerRef}
      className="gs-liquid-nav"
      data-condensed={condensed ? "true" : "false"}
      data-boot={booted ? "false" : "true"}
      data-menu={mobileOpen ? "open" : "closed"}
    >
      {/* The slab. Every expensive paint property lives on this leaf and not on
          <header>, because an element carrying backdrop-filter becomes the
          containing block for its position:fixed descendants. */}
      <div className="gs-liquid-nav__glass" aria-hidden="true">
        <span ref={sheenRef} className="gs-liquid-nav__sheen" />
      </div>

      <div className="gs-liquid-nav__row">
        <Link href="/" className="gs-nav-brand group flex shrink-0 items-center gap-2.5" aria-label="GridSense home">
          <img src="/gridsense-mark.svg" alt="" className="h-9 w-9 rounded-[10px] shadow-[0_0_24px_rgba(34,211,238,.22)] transition-transform duration-300 group-hover:scale-105" />
          <span className="hidden leading-none sm:block"><span className="gs-display block text-[20px] uppercase tracking-[-.06em] text-gs-text-primary">GridSense</span><span className="mt-1 block font-mono text-[8px] font-bold uppercase tracking-[.16em] text-gs-text-muted">Grid intelligence</span></span>
        </Link>

        <nav ref={railRef} className="gs-liquid-nav__rail hidden xl:flex" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => {
            const active = group.items.some((item) => isCurrent(item.href));
            const open = openGroup === group.label;
            return (
              <div key={group.label} className="gs-liquid-nav__item">
                {pill(`group:${group.label}`)}
                <button
                  className={`gs-nav-trigger ${active ? "gs-nav-trigger-active" : ""}`}
                  onClick={() => setOpenGroup(open ? null : group.label)}
                  aria-expanded={open}
                  aria-haspopup="true"
                >
                  {group.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="gs-mega-menu">
                    <span className="gs-mega-kicker">{group.label} workspace</span>
                    {group.items.map(({ href, label, description, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`gs-mega-item ${isCurrent(href) ? "gs-mega-item-active" : ""}`}
                        aria-current={isCurrent(href) ? "page" : undefined}
                        onClick={() => setOpenGroup(null)}
                      >
                        <span className="gs-mega-icon"><Icon className="h-4 w-4" strokeWidth={1.8} /></span>
                        <span>
                          <span className="block text-sm font-semibold text-gs-text-primary">{label}</span>
                          <span className="mt-0.5 block text-xs text-gs-text-secondary">{description}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <span className="gs-liquid-nav__divider" aria-hidden="true" />

          {UTILITY_LINKS.map((item) => (
            <div key={item.href} className="gs-liquid-nav__item">
              {pill(`link:${item.href}`)}
              <Link
                href={item.href}
                className={`gs-nav-link ${isCurrent(item.href) ? "gs-nav-link-active" : ""}`}
                aria-current={isCurrent(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 xl:flex">
          <span className="mr-2 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-gs-text-secondary"><i className="gs-live-dot" />Network live</span>
          <AmbientAudioToggle />
          <button onClick={toggleTheme} className="gs-nav-icon" aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}>{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <Link href="/login" className="gs-nav-login">Operator login</Link>
          <Link href="/admin" className="gs-nav-login inline-flex items-center gap-1"><Settings className="h-3.5 w-3.5" />Admin portal</Link>
        </div>

        <button className="ml-auto grid h-10 w-10 place-items-center text-gs-text-primary xl:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X /> : <Menu />}</button>
      </div>

      {mobileOpen && (
        <div className="gs-mobile-menu xl:hidden">
          <div className="mx-auto grid max-w-[1480px] gap-4 px-4 py-5 sm:px-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="gs-mega-kicker mb-2">{group.label}</p>
                {group.items.map(({ href, label, description, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="gs-mega-item" aria-current={isCurrent(href) ? "page" : undefined}>
                    <span className="gs-mega-icon"><Icon className="h-4 w-4" /></span>
                    <span>
                      <span className="block text-sm font-semibold text-gs-text-primary">{label}</span>
                      <span className="block text-xs text-gs-text-secondary">{description}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 border-t border-gs-border pt-4">
              {UTILITY_LINKS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="gs-nav-login text-center">{item.label}</Link>
              ))}
              <button onClick={toggleTheme} className="gs-nav-login">{isDark ? "Light mode" : "Dark mode"}</button>
              <AmbientAudioToggle className="justify-center" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
