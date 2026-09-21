/**
 * Utility functions for generating formatted Subtitle (.SRT and .VTT) files
 * and transcripts from audio takes.
 */

export function formatSrtTimestamp(seconds: number): string {
  const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, "0");
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

export function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(",", ".");
}

export function generateSrtContent(text: string = "", durationSeconds: number): string {
  // Clean SSML tags from text first
  const cleanText = (text || "").replace(/<[^>]+>/g, "").trim();
  const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(Boolean);

  if (sentences.length === 0) return "";

  const totalLength = cleanText.length || 1;
  let currentTime = 0;
  const srtEntries: string[] = [];

  sentences.forEach((sentence, idx) => {
    // Proportional time allocation based on character count
    const sentenceRatio = sentence.length / totalLength;
    const sentenceDuration = Math.max(1.2, sentenceRatio * durationSeconds);
    const startTime = currentTime;
    const endTime = Math.min(durationSeconds, currentTime + sentenceDuration);

    srtEntries.push(
      `${idx + 1}\n${formatSrtTimestamp(startTime)} --> ${formatSrtTimestamp(endTime)}\n${(sentence || "").trim()}\n`
    );

    currentTime = endTime;
  });

  return srtEntries.join("\n");
}

export function generateVttContent(text: string = "", durationSeconds: number): string {
  const srt = generateSrtContent(text, durationSeconds);
  return `WEBVTT\n\n${srt.replace(/,/g, ".")}`;
}

export function generateDialogueSrt(
  lineTimings: Array<{ id: string; speaker: string; text: string; startTime: number; duration: number }>
): string {
  return lineTimings
    .map((item, idx) => {
      const start = formatSrtTimestamp(item.startTime);
      const end = formatSrtTimestamp(item.startTime + item.duration);
      return `${idx + 1}\n${start} --> ${end}\n[${item.speaker}]: ${(item.text || "").trim()}\n`;
    })
    .join("\n");
}

export function generateDialogueVtt(
  lineTimings: Array<{ id: string; speaker: string; text: string; startTime: number; duration: number }>
): string {
  const entries = lineTimings
    .map((item, idx) => {
      const start = formatVttTimestamp(item.startTime);
      const end = formatVttTimestamp(item.startTime + item.duration);
      return `${idx + 1}\n${start} --> ${end}\n<v ${item.speaker}>${(item.text || "").trim()}</v>\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${entries}`;
}

export const generateSrtFromTimings = generateDialogueSrt;
export const generateVttFromTimings = generateDialogueVtt;

export function downloadTextFile(content: string, filename: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
