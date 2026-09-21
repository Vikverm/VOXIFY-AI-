// Audio management and Web Audio API playback engine
import { AudioFilterPreset } from "../types";

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

// Convert base64 data to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Extract peaks for static waveform display
export function extractWaveformPeaks(buffer: AudioBuffer, numPoints = 80): number[] {
  const channelData = buffer.getChannelData(0);
  const step = Math.floor(channelData.length / numPoints);
  const peaks: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const start = i * step;
    const end = Math.min(start + step, channelData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > max) max = val;
    }
    peaks.push(Math.max(0.08, Math.min(1, max)));
  }

  return peaks;
}

// Build Audio Filter Chain according to chosen preset
export function createFilterNodes(
  ctx: AudioContext,
  preset: AudioFilterPreset
): { input: AudioNode; output: AudioNode } {
  if (preset === "warm-radio") {
    // Low shelf boost + High shelf soft roll-off for radio broadcast richness
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.value = 180;
    lowShelf.gain.value = 4.5;

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.value = 8500;
    highShelf.gain.value = -2.0;

    lowShelf.connect(highShelf);
    return { input: lowShelf, output: highShelf };
  }

  if (preset === "vocal-clarity") {
    // High-pass filter rumble + Peak presence boost around 3.2kHz
    const highPass = ctx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 90;

    const peak = ctx.createBiquadFilter();
    peak.type = "peaking";
    peak.frequency.value = 3200;
    peak.Q.value = 1.2;
    peak.gain.value = 4.0;

    highPass.connect(peak);
    return { input: highPass, output: peak };
  }

  if (preset === "vintage-phone") {
    // Narrow bandpass filter (lo-fi megaphone / walkie-talkie / telephone)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1600;
    bandpass.Q.value = 1.8;
    return { input: bandpass, output: bandpass };
  }

  if (preset === "cinematic-air") {
    // Airy high shelf + gentle low mid carve
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.value = 7500;
    highShelf.gain.value = 3.5;

    const notch = ctx.createBiquadFilter();
    notch.type = "peaking";
    notch.frequency.value = 300;
    notch.gain.value = -2.0;

    highShelf.connect(notch);
    return { input: highShelf, output: notch };
  }

  // "none" default pass-through gain
  const passThrough = ctx.createGain();
  passThrough.gain.value = 1;
  return { input: passThrough, output: passThrough };
}

// Download WAV helper
export function downloadWavFile(audioUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = audioUrl;
  a.download = filename.endsWith(".wav") ? filename : `${filename}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Helper to format seconds into mm:ss
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Estimate speaking duration (assumes average 145 words per minute at 1.0x pace)
export function estimateReadingTime(wordCount: number, speedMultiplier: number = 1.0): {
  seconds: number;
  formatted: string;
} {
  if (wordCount <= 0) return { seconds: 0, formatted: "0s" };
  const baseWpm = 145 * Math.max(0.5, Math.min(2.0, speedMultiplier));
  const totalSeconds = Math.round((wordCount / baseWpm) * 60);
  if (totalSeconds < 60) {
    return { seconds: totalSeconds, formatted: `~${totalSeconds}s` };
  }
  const mins = Math.floor(totalSeconds / 60);
  const remSecs = totalSeconds % 60;
  return {
    seconds: totalSeconds,
    formatted: `~${mins}m ${remSecs > 0 ? `${remSecs}s` : ""}`,
  };
}

/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV format Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length;
  const dataByteCount = length * blockAlign;
  const headerByteCount = 44;
  const totalByteCount = headerByteCount + dataByteCount;

  const arrayBuffer = new ArrayBuffer(totalByteCount);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataByteCount, true);
  writeString(8, "WAVE");

  // "fmt " sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // "data" sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataByteCount, true);

  // Write interleaved PCM samples
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

/**
 * Ensures the shared AudioContext is in a running state, resuming it if suspended.
 */
export async function ensureAudioContextRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch (e) {
      console.warn("Could not resume AudioContext:", e);
    }
  }
  return ctx;
}

/**
 * Safely decodes any audio format (base64 string, data URL, Blob, or URL) into an AudioBuffer.
 */
export async function decodeAudioDataSafe(
  source: string | ArrayBuffer | Blob,
  customCtx?: AudioContext
): Promise<AudioBuffer> {
  const ctx = customCtx || (await ensureAudioContextRunning());

  let arrayBuffer: ArrayBuffer;

  if (source instanceof ArrayBuffer) {
    arrayBuffer = source;
  } else if (source instanceof Blob) {
    arrayBuffer = await source.arrayBuffer();
  } else if (typeof source === "string") {
    if (source.startsWith("data:audio") || source.includes(";base64,")) {
      const cleanBase64 = source.replace(/^data:[^;]+;base64,/, "");
      arrayBuffer = base64ToArrayBuffer(cleanBase64);
    } else if (source.startsWith("blob:") || source.startsWith("http")) {
      const response = await fetch(source);
      arrayBuffer = await response.arrayBuffer();
    } else {
      // Raw base64 string
      arrayBuffer = base64ToArrayBuffer(source);
    }
  } else {
    throw new Error("Unsupported audio source format");
  }

  // decodeAudioData consumes the arrayBuffer, so we slice a copy if needed
  const copyBuffer = arrayBuffer.slice(0);
  return await ctx.decodeAudioData(copyBuffer);
}

/**
 * Plays a pleasant two-tone chime to test speakers and unlock browser audio.
 */
export async function playSpeakerTestChime(): Promise<void> {
  const ctx = await ensureAudioContextRunning();
  const now = ctx.currentTime;

  // First Tone: C5 (523.25 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523.25, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // Second Tone: G5 (783.99 Hz)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(783.99, now + 0.15);
  gain2.gain.setValueAtTime(0, now + 0.15);
  gain2.gain.linearRampToValueAtTime(0.25, now + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.6);
}

