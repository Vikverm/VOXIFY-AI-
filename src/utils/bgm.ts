// Procedural background music generator and mixer for Voxify
export type BgmTrackId = "none" | "lofi" | "podcast" | "ambient" | "corporate" | "piano";

export interface BgmTrackOption {
  id: BgmTrackId;
  name: string;
  genre: string;
  desc: string;
  bpm: number;
}

export const BGM_TRACKS: BgmTrackOption[] = [
  {
    id: "none",
    name: "None (Pure Voice)",
    genre: "Acapella",
    desc: "Clean voiceover without background music",
    bpm: 0,
  },
  {
    id: "lofi",
    name: "Lo-Fi Coffee Chill",
    genre: "Lo-Fi Beats",
    desc: "Mellow warm chords, soft vinyl texture, relaxing cadence",
    bpm: 78,
  },
  {
    id: "podcast",
    name: "Modern Podcast Intro",
    genre: "Acoustic Pop",
    desc: "Bright melodic acoustic pulses, upbeat and friendly",
    bpm: 110,
  },
  {
    id: "ambient",
    name: "Zen Meditation Drone",
    genre: "Ambient 432Hz",
    desc: "Peaceful sustained harmonic pads, calming and introspective",
    bpm: 60,
  },
  {
    id: "corporate",
    name: "Inspiring Corporate",
    genre: "Tech & Explainer",
    desc: "Uplifting clean synth chords, confident and forward-looking",
    bpm: 95,
  },
  {
    id: "piano",
    name: "Cinematic Emotional Piano",
    genre: "Storytelling",
    desc: "Gentle piano swells with warmth and narrative emotional depth",
    bpm: 72,
  },
];

interface ActiveBgmSession {
  stop: () => void;
  setVolume: (v: number) => void;
}

/**
 * Procedurally synthesizes and loops the chosen BGM track using Web Audio API
 */
export function playBgmInContext(
  ctx: AudioContext,
  trackId: BgmTrackId,
  volume = 0.15
): ActiveBgmSession | null {
  if (trackId === "none") return null;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
  masterGain.connect(ctx.destination);

  let isRunning = true;
  const activeNodes: (AudioNode | number)[] = [];

  // Musical chord progressions based on track
  let chords: number[][] = [];
  let intervalSec = 2.0;

  if (trackId === "lofi") {
    // Cmaj7 -> Am7 -> Dm7 -> G7
    chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];
    intervalSec = 2.4;
  } else if (trackId === "podcast") {
    // G -> D -> Em -> C
    chords = [
      [196.0, 246.94, 293.66, 392.0],
      [146.83, 220.0, 293.66, 369.99],
      [164.81, 196.0, 246.94, 329.63],
      [130.81, 164.81, 196.0, 261.63],
    ];
    intervalSec = 1.6;
  } else if (trackId === "ambient") {
    // Dsus2 -> Gsus2
    chords = [
      [146.83, 220.0, 293.66, 440.0],
      [98.0, 146.83, 196.0, 293.66],
    ];
    intervalSec = 4.0;
  } else if (trackId === "corporate") {
    // A -> F#m -> D -> E
    chords = [
      [220.0, 277.18, 329.63, 440.0],
      [185.0, 220.0, 277.18, 369.99],
      [146.83, 185.0, 220.0, 293.66],
      [164.81, 207.65, 246.94, 329.63],
    ];
    intervalSec = 1.8;
  } else {
    // Cinematic Piano: Fmaj7 -> C -> G
    chords = [
      [174.61, 220.0, 261.63, 329.63],
      [130.81, 164.81, 196.0, 261.63],
      [98.0, 146.83, 196.0, 246.94],
    ];
    intervalSec = 3.0;
  }

  // Loop chords gracefully
  let chordIdx = 0;
  const loopChords = () => {
    if (!isRunning) return;

    const chord = chords[chordIdx % chords.length];
    chordIdx++;

    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(trackId === "ambient" ? 600 : 1200, now);
    filter.connect(masterGain);

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = trackId === "ambient" ? "sine" : i % 2 === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, now);

      // Attack - Decay - Sustain - Release envelope
      const attack = 0.4;
      const release = intervalSec * 0.8;
      const voiceGain = 0.08 / chord.length;

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(voiceGain, now + attack);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + release);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(now);
      osc.stop(now + release + 0.1);
    });

    const timerId = window.setTimeout(loopChords, (intervalSec * 1000) * 0.85);
    activeNodes.push(timerId);
  };

  loopChords();

  return {
    stop: () => {
      isRunning = false;
      activeNodes.forEach((t) => {
        if (typeof t === "number") clearTimeout(t);
      });
      masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      setTimeout(() => {
        try {
          masterGain.disconnect();
        } catch {
          // ignore
        }
      }, 600);
    },
    setVolume: (v: number) => {
      masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, v)), ctx.currentTime + 0.1);
    },
  };
}

export const startBgmSession = playBgmInContext;
export type { ActiveBgmSession };
