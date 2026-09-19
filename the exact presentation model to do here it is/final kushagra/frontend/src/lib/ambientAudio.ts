/**
 * The GridSense ambient bed.
 *
 * WHY THIS IS SYNTHESISED AND NOT A FILE
 *
 * A background track shipped as an mp3 costs megabytes, carries a licence, and
 * loops audibly — the ear finds the seam within two passes and never unhears it.
 * This bed is built live in the browser instead: nothing to download, nothing to
 * licence, and because the sparse layer is scheduled from a random walk it never
 * repeats, so there is no seam to find.
 *
 * WHY IT SOUNDS LIKE THIS, AND WHY IT USED TO SOUND WORSE
 *
 * The first version voiced the pad on 50 Hz — the mains frequency of the grid
 * this product models — and stacked its low partials with a bandpassed noise
 * layer. That is a very literal reading of the brief, and the result was
 * exactly what it describes: mains hum. A 50 Hz fundamental turns to buzz on
 * laptop speakers, six partials between 50 and 400 Hz pile into a muddy low
 * cluster, and ±7 cents of detune beats at about 1 Hz, which the ear hears as
 * wobble. It was fatiguing within a minute.
 *
 * This version keeps the idea and fixes the register. Every pitch is still a
 * whole-number multiple of 50 Hz, so nothing can be out of tune with anything
 * else, but the chord now sits where a pad belongs: 200 / 300 / 400 / 600 Hz
 * are the 4th, 6th, 8th and 12th partials, which is root, fifth, octave and
 * octave-plus-fifth — open intervals, no thirds to muddy them. The noise layer
 * is gone. Detune is ±2.5 cents, so voices beat about once every five seconds
 * instead of once a second. Everything above 1.1 kHz is rolled off, everything
 * below 90 Hz is removed, and each voice breathes on its own very slow swell so
 * the chord is never static and never sudden.
 *
 * THE SIGNAL GRAPH
 *
 *   6 x sine voice ──→ bus ─→ highpass 90 ─→ lowpass 1.1k ─┬─→ dry ──────┐
 *     (2 detuned osc,                                       │             │
 *      own slow swell)                                      └─→ reverb ───┼─→ master
 *   sparse bells ────→ bus                                                │
 *                                                                          └─→ comp → out
 *   slow LFO → lowpass cutoff
 *
 * The convolver's impulse response is generated here too — decaying stereo
 * noise — so even the reverb is code rather than an asset.
 *
 * No React in this file. It is a module singleton on purpose: App Router client
 * navigation unmounts components but keeps modules alive, which is exactly the
 * lifetime background audio wants. The toggle component subscribes; the sound
 * does not care whether the toggle is currently mounted.
 */

export const AMBIENT_STORAGE_KEY = "gridsense-ambient";

/** Mains frequency of the grid this product models. Every pitch is a multiple. */
const MAINS_HZ = 50;

/**
 * The sustained chord, as multiples of MAINS_HZ.
 *   2  -> 100 Hz  warmth under the chord, quiet enough not to rumble
 *   4  -> 200 Hz  root
 *   6  -> 300 Hz  fifth
 *   8  -> 400 Hz  octave
 *   12 -> 600 Hz  octave + fifth
 *   16 -> 800 Hz  air
 * `swell` is the period in seconds of that voice's own amplitude drift. They are
 * mutually prime-ish so the chord never returns to the same balance twice.
 */
const VOICES = [
  { mult: 2, gain: 0.10, swell: 71 },
  { mult: 4, gain: 0.26, swell: 53 },
  { mult: 6, gain: 0.19, swell: 43 },
  { mult: 8, gain: 0.13, swell: 61 },
  { mult: 12, gain: 0.07, swell: 37 },
  { mult: 16, gain: 0.035, swell: 47 },
];

/** Bells, higher up and sparse: 400 500 600 800 900 1200 Hz. */
const BELL_MULTS = [8, 10, 12, 16, 18, 24];

const DEFAULT_VOLUME = 0.1;
const FADE_SECONDS = 2.5;

/** Lookahead scheduler constants, the standard Web Audio pattern: a coarse
 *  setInterval wakes up often enough to queue anything due inside the window,
 *  and every event is stamped against the audio clock rather than the timer.
 *  setTimeout-per-note drifts as soon as the main thread is busy; this does not. */
const SCHEDULER_TICK_MS = 250;
const SCHEDULE_AHEAD_S = 1.0;

type Listener = (playing: boolean) => void;

interface Voices {
  oscillators: OscillatorNode[];
  nodes: AudioNode[];
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bus: GainNode | null = null;
let voices: Voices | null = null;
let schedulerId: number | null = null;
let nextBellAt = 0;
let playing = false;
let volume = DEFAULT_VOLUME;
let visibilityBound = false;

const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) listener(playing);
}

function canUseAudio(): boolean {
  return typeof window !== "undefined" && typeof (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) === "function";
}

/**
 * A long decaying-noise impulse response. Real convolution reverb ships a
 * recorded space; a generated one is a fraction of the code and, for a pad this
 * diffuse, indistinguishable. The tail is deliberately long — 4.2s — because a
 * short reverb is what makes a synthesised pad sound synthetic.
 */
function buildImpulse(context: AudioContext, seconds = 4.2, decay = 3): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const impulse = context.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function build(context: AudioContext): void {
  const out = context.createGain();
  out.gain.value = 0;

  // Gentle, slow settings. A fast compressor on a pad audibly pumps; this one
  // is only here so a bell landing on a swell peak can never clip.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.1;
  compressor.release.value = 0.8;

  out.connect(compressor);
  compressor.connect(context.destination);

  const mix = context.createGain();
  mix.gain.value = 1;

  // Nothing below 90 Hz reaches the speakers. This is the single change that
  // removes the "hum" character of the previous version.
  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 90;
  highpass.Q.value = 0.5;

  // And nothing harsh above it. 1.1 kHz keeps the pad soft and the bells round.
  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1100;
  lowpass.Q.value = 0.4;

  mix.connect(highpass);
  highpass.connect(lowpass);

  const dry = context.createGain();
  dry.gain.value = 0.7;
  lowpass.connect(dry);
  dry.connect(out);

  const send = context.createGain();
  send.gain.value = 0.45;
  const convolver = context.createConvolver();
  convolver.buffer = buildImpulse(context);
  lowpass.connect(send);
  send.connect(convolver);
  convolver.connect(out);

  const oscillators: OscillatorNode[] = [];
  const nodes: AudioNode[] = [out, compressor, mix, highpass, lowpass, dry, send, convolver];

  for (const voice of VOICES) {
    const voiceGain = context.createGain();
    voiceGain.gain.value = voice.gain;
    voiceGain.connect(mix);
    nodes.push(voiceGain);

    // Each voice drifts around its own level on its own period, so the chord
    // is always moving without anything ever entering or leaving.
    const swell = context.createOscillator();
    swell.type = "sine";
    swell.frequency.value = 1 / voice.swell;
    const swellDepth = context.createGain();
    swellDepth.gain.value = voice.gain * 0.45;
    swell.connect(swellDepth);
    swellDepth.connect(voiceGain.gain);
    swell.start();
    oscillators.push(swell);
    nodes.push(swellDepth);

    // Two oscillators, ±2.5 cents. That is about one beat every five seconds —
    // width without the wobble that ±7 cents produced.
    for (const detune of [-2.5, 2.5]) {
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.value = MAINS_HZ * voice.mult;
      osc.detune.value = detune;
      osc.connect(voiceGain);
      osc.start();
      oscillators.push(osc);
    }
  }

  // One very slow cutoff drift across the whole bed. 0.018 Hz is a 55-second
  // period: felt, not heard.
  const filterLfo = context.createOscillator();
  filterLfo.type = "sine";
  filterLfo.frequency.value = 0.018;
  const filterDepth = context.createGain();
  filterDepth.gain.value = 180;
  filterLfo.connect(filterDepth);
  filterDepth.connect(lowpass.frequency);
  filterLfo.start();
  oscillators.push(filterLfo);
  nodes.push(filterDepth);

  master = out;
  bus = mix;
  voices = { oscillators, nodes };
}

/**
 * One bell. Created, played and discarded — a node that has ended is garbage,
 * and letting the graph collect them is cheaper than pooling. The attack is
 * slow (0.35s) on purpose: a fast attack is a "ping" that pulls attention, a
 * slow one simply appears.
 */
function scheduleBell(context: AudioContext, at: number): void {
  if (!bus) return;
  const mult = BELL_MULTS[Math.floor(Math.random() * BELL_MULTS.length)];

  const osc = context.createOscillator();
  osc.type = "sine";
  osc.frequency.value = MAINS_HZ * mult;

  const env = context.createGain();
  const peak = 0.025 + Math.random() * 0.015;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(peak, at + 0.35);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 6.5);

  osc.connect(env);
  env.connect(bus);

  osc.start(at);
  osc.stop(at + 6.8);
  osc.addEventListener("ended", () => {
    osc.disconnect();
    env.disconnect();
  }, { once: true });
}

function runScheduler(): void {
  if (!ctx || !playing) return;
  const now = ctx.currentTime;
  while (nextBellAt < now + SCHEDULE_AHEAD_S) {
    if (nextBellAt < now) nextBellAt = now + 0.2;
    scheduleBell(ctx, nextBellAt);
    // A wide, slow random gap. Rare enough to stay in the background, and the
    // reason this never develops a loop the ear can memorise.
    nextBellAt += 14 + Math.random() * 14;
  }
}

function startScheduler(): void {
  if (schedulerId !== null || typeof window === "undefined") return;
  schedulerId = window.setInterval(runScheduler, SCHEDULER_TICK_MS);
}

function stopScheduler(): void {
  if (schedulerId === null) return;
  window.clearInterval(schedulerId);
  schedulerId = null;
}

/**
 * Suspending a context that is not audible is the difference between a tab that
 * costs nothing in the background and one that keeps a DSP graph warm forever.
 */
function handleVisibility(): void {
  if (!ctx || !playing) return;
  if (document.hidden) {
    stopScheduler();
    void ctx.suspend().catch(() => undefined);
  } else {
    void ctx.resume().catch(() => undefined);
    nextBellAt = ctx.currentTime + 6;
    startScheduler();
  }
}

function bindVisibility(): void {
  if (visibilityBound || typeof document === "undefined") return;
  document.addEventListener("visibilitychange", handleVisibility);
  visibilityBound = true;
}

function teardown(): void {
  stopScheduler();
  if (voices) {
    for (const osc of voices.oscillators) {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
    }
    for (const node of voices.nodes) node.disconnect();
  }
  voices = null;
  master = null;
  bus = null;
  const dying = ctx;
  ctx = null;
  if (dying) void dying.close().catch(() => undefined);
}

export const ambientAudio = {
  async start(): Promise<void> {
    if (playing || !canUseAudio()) return;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      // Constructed here and not at module load: a context created outside a
      // user gesture is born suspended and logs an autoplay warning.
      ctx = new Ctor();
      await ctx.resume();
      build(ctx);
      if (!master) return;
      // A long fade in. The bed should arrive without an edge — if you can hear
      // it start, it is too fast.
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.linearRampToValueAtTime(volume, ctx.currentTime + FADE_SECONDS);
      nextBellAt = ctx.currentTime + 10;
      playing = true;
      bindVisibility();
      startScheduler();
      try {
        window.localStorage.setItem(AMBIENT_STORAGE_KEY, "on");
      } catch {
        /* private mode */
      }
      notify();
    } catch {
      // A blocked or unavailable context must not take the page down with it.
      teardown();
      playing = false;
      notify();
    }
  },

  stop(): void {
    if (!playing) return;
    playing = false;
    try {
      window.localStorage.setItem(AMBIENT_STORAGE_KEY, "off");
    } catch {
      /* private mode */
    }
    const closing = ctx;
    if (closing && master) {
      // Fade first, tear down after — stopping a drone dead is a click.
      const end = closing.currentTime + 1.1;
      master.gain.cancelScheduledValues(closing.currentTime);
      master.gain.setValueAtTime(master.gain.value, closing.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, end);
      stopScheduler();
      window.setTimeout(teardown, 1250);
    } else {
      teardown();
    }
    notify();
  },

  async toggle(): Promise<void> {
    if (playing) this.stop();
    else await this.start();
  },

  isPlaying(): boolean {
    return playing;
  },

  setVolume(next: number): void {
    volume = Math.min(1, Math.max(0, next));
    if (ctx && master && playing) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(volume, ctx.currentTime, 0.4);
    }
  },

  getVolume(): number {
    return volume;
  },

  /** Returns its own unsubscribe, so an effect can just return it. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Whether the visitor had it on last time. Safe to call from an effect only —
   *  it touches localStorage. */
  wasEnabled(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(AMBIENT_STORAGE_KEY) === "on";
    } catch {
      return false;
    }
  },
};
