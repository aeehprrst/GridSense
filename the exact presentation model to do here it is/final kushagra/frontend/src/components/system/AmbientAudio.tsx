"use client";

/**
 * The control for the ambient bed.
 *
 * Everything awkward about background audio on the web is handled here rather
 * than in the engine, which stays a pure signal graph.
 *
 * AUTOPLAY. No browser will start audio before the visitor has interacted with
 * the page, and there is no flag that changes that. So the first visit always
 * costs one click. After that the preference is remembered, and on the next
 * visit the control arms a one-shot listener for the first real interaction —
 * any click, tap or keypress anywhere — and starts then. That reads as "it just
 * plays", without ever attempting a blocked autoplay or logging a warning.
 *
 * HYDRATION. The stored preference lives in localStorage, which the server
 * cannot see. Rendering the button's label from it directly would produce
 * different markup on the server and the client and React would complain. So
 * the component always renders the OFF state first and reconciles in an effect.
 * That is also why the equaliser is animated in CSS: driving four bars from
 * React state would re-render this subtree several times a second forever.
 */

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ambientAudio } from "@/lib/ambientAudio";

const BARS = [0, 1, 2, 3];

export function AmbientAudioToggle({ className }: { className?: string }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // The engine is a module singleton, so it may already be running from a
    // previous route. Adopt its state rather than assuming it is off.
    setPlaying(ambientAudio.isPlaying());
    return ambientAudio.subscribe(setPlaying);
  }, []);

  useEffect(() => {
    if (ambientAudio.isPlaying() || !ambientAudio.wasEnabled()) return;

    let cancelled = false;
    const arm = () => {
      if (cancelled) return;
      disarm();
      void ambientAudio.start();
    };
    const disarm = () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };

    // `once` is not enough on its own — two listeners are armed and either may
    // fire first, so the handler removes both.
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => {
      cancelled = true;
      disarm();
    };
  }, []);

  const label = playing ? "Mute ambient audio" : "Play ambient audio";

  return (
    <button
      type="button"
      onClick={() => void ambientAudio.toggle()}
      aria-pressed={playing}
      aria-label={label}
      title={
        playing
          ? "Ambient bed on. Synthesised live from the 50 Hz grid fundamental."
          : "Ambient bed off. A generated drone tuned to the 50 Hz mains frequency."
      }
      data-playing={playing ? "true" : "false"}
      className={`gs-ambient-pill${className ? ` ${className}` : ""}`}
    >
      <span className="gs-ambient-eq" aria-hidden="true">
        {BARS.map((bar) => (
          <span key={bar} className="gs-ambient-eq__bar" data-bar={bar} />
        ))}
      </span>
      {/* The glyph is the redundant encoding: the animated bars carry the state
          visually, but motion alone cannot be the only signal. */}
      {playing ? <Volume2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" /> : <VolumeX className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />}
    </button>
  );
}
