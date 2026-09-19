"use client";

/**
 * The observation film.
 *
 * This is the page's one cinematic beat, and it earns its place by saying
 * something the surrounding sections cannot: the other blocks describe the
 * network, this one shows it moving. It sits after StatsSection deliberately —
 * the credibility beat comes first, so the film reads as illustration of a real
 * system rather than as a splash screen.
 *
 * Three things here are load-bearing rather than decorative:
 *
 *   1. The film is never fetched until the section approaches the viewport. The
 *      hero already downloads three videos; a fourth competing for bandwidth
 *      during first paint would cost exactly the smoothness this is meant to
 *      add. preload="none" plus an IntersectionObserver that attaches the
 *      sources once and then disconnects.
 *   2. The aperture opens with clip-path and transform only. Animating the
 *      frame's width or height would relayout the whole section on every
 *      scroll frame.
 *   3. It stops decoding the moment it is off screen or the tab is hidden.
 *      A 1080p decode nobody is watching is pure battery.
 *
 * Under prefers-reduced-motion none of that applies: the poster is shown with a
 * real play control, and the scroll scrubbing is not wired at all.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";
import { Play, Radio, ScanLine } from "lucide-react";
import { Reveal, RevealText } from "@/components/motion/Reveal";

const SPECS = [
  { label: "Coverage", value: "20,000 cities" },
  { label: "Conditions", value: "5,000 modelled" },
  { label: "Telemetry", value: "Synthetic" },
];

export function SignalFilm() {
  const reduceMotion = useSafeReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // `armed` flips once, when the section is within a viewport of being seen.
  // It is what gates the network request; nothing downloads before it.
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  // Springs on the driver, not on each consumer, so the three transforms below
  // stay locked to one another instead of drifting apart at different rates.
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.6 });

  // The aperture: a letterboxed slot that opens to a full frame, then holds.
  const inset = useTransform(progress, [0, 0.42, 0.62, 1], [18, 0, 0, 10]);
  const clip = useTransform(inset, (v) => `inset(${v}% 0% ${v}% 0% round 18px)`);
  const filmY = useTransform(progress, [0, 1], ["-4%", "4%"]);
  // Barely over 1. A larger scale is a bigger crop, and the point of the crop
  // pass was to stop losing picture.
  const filmScale = useTransform(progress, [0, 0.5, 1], [1.05, 1.0, 1.04]);
  const plateY = useTransform(progress, [0, 1], ["34%", "-26%"]);
  const plateOpacity = useTransform(progress, [0.1, 0.28, 0.72, 0.92], [0, 1, 1, 0]);

  // Arm on approach. Disconnected as soon as it fires — this only ever needs to
  // happen once, and a live observer for the rest of the session is a leak.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Play only while visible, and never under reduced motion.
  useEffect(() => {
    if (!armed || reduceMotion) return;
    const node = frameRef.current;
    const video = videoRef.current;
    if (!node || !video) return;

    let visible = false;

    const sync = () => {
      const shouldPlay = visible && !document.hidden;
      if (shouldPlay) {
        // play() rejects freely — a pending pause, a policy block, a detached
        // element. An unhandled rejection here would surface as a console error
        // on a page whose whole point is looking finished.
        void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      } else {
        video.pause();
        setPlaying(false);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [armed, reduceMotion]);

  const motionStyle = reduceMotion ? undefined : { clipPath: clip };
  const filmStyle = reduceMotion ? undefined : { y: filmY, scale: filmScale };
  const plateStyle = reduceMotion ? undefined : { y: plateY, opacity: plateOpacity };

  return (
    <section ref={sectionRef} className="gs-film-section relative overflow-hidden border-y border-gs-border bg-gs-bg-primary/45 py-24">
      <div className="container-official">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Reveal kind="wipe" className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-gs-cyan-400">
            The network, observed
          </Reveal>
          <RevealText as="h2" text="Every asset, every corridor, in motion" className="text-institutional mb-4 text-4xl font-bold text-white md:text-5xl" />
          <Reveal as="p" delay={0.14} className="leading-relaxed text-gs-text-secondary">
            GridSense holds the national network as one connected model. This is that
            model under observation — rendered from the demonstration dataset, not a
            live utility feed.
          </Reveal>
        </div>
      </div>

      {/* Full-bleed on purpose: the surrounding sections are all contained, so
          breaking the measure exactly once is what makes this land. */}
      <motion.div ref={frameRef} className="gs-film-frame" style={motionStyle}>
        <motion.div className="gs-film-media" style={filmStyle}>
          {armed && !reduceMotion ? (
            <video
              ref={videoRef}
              className="gs-film-video"
              poster="/gridsense-signal-poster.jpg"
              preload="none"
              muted
              loop
              playsInline
              aria-hidden="true"
              tabIndex={-1}
            >
              {/* VP9 first: it is half the size and every browser that can play
                  it prefers it. The mp4 is the universal fallback. */}
              <source src="/gridsense-signal.webm" type="video/webm" />
              <source src="/gridsense-signal.mp4" type="video/mp4" />
            </video>
          ) : (
            <img src="/gridsense-signal-poster.jpg" alt="" className="gs-film-video" aria-hidden="true" />
          )}
        </motion.div>

        <div className="gs-film-scrim" aria-hidden="true" />
        <div className="gs-film-scan" aria-hidden="true" />
        <div className="gs-film-grid" aria-hidden="true" />

        {/* Reduced motion gets a real control rather than a still it cannot
            escape — the content stays reachable, the movement stays opt-in. */}
        {reduceMotion && (
          <button
            type="button"
            className="gs-film-play"
            onClick={() => {
              setArmed(true);
              const video = videoRef.current;
              if (video) void video.play().catch(() => undefined);
            }}
          >
            <Play className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Play the observation film
          </button>
        )}

        <motion.div className="gs-film-plate" style={plateStyle}>
          <div className="gs-film-plate__head">
            <Radio className="h-3.5 w-3.5 text-gs-cyan-300" strokeWidth={1.8} aria-hidden="true" />
            <span>Network observation</span>
            <span className="gs-film-plate__state" data-live={playing ? "true" : "false"}>
              {playing ? "Streaming" : "Idle"}
            </span>
          </div>
          <p className="gs-film-plate__body">
            One failing transformer is never one failure. The model carries the whole
            corridor, so the question stops being which asset tripped and becomes how
            far it reaches.
          </p>
          <dl className="gs-film-plate__specs">
            {SPECS.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
          <p className="gs-film-plate__note">
            <ScanLine className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
            Demonstration dataset — synthetic telemetry, not utility SCADA.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
