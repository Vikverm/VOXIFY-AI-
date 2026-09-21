/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from "jszip";

export interface ParsedCsvRow {
  filename?: string;
  voice?: string;
  text: string;
  style?: string;
}

/**
 * Parses uploaded documents (.txt, .md, .docx, .pdf) directly in the browser
 */
export async function parseDocumentFile(file: File): Promise<{ text: string; filename: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (ext === "docx") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const documentXmlFile = zip.file("word/document.xml");
      if (!documentXmlFile) {
        throw new Error("Invalid .docx file: word/document.xml not found");
      }
      const xmlContent = await documentXmlFile.async("text");
      
      // Parse XML to extract text nodes
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const paragraphs = xmlDoc.getElementsByTagName("w:p");
      const textLines: string[] = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const texts = p.getElementsByTagName("w:t");
        let pText = "";
        for (let j = 0; j < texts.length; j++) {
          pText += texts[j].textContent || "";
        }
        if (pText.trim()) {
          textLines.push(pText.trim());
        }
      }

      return {
        text: textLines.join("\n\n"),
        filename: file.name,
      };
    } catch (err: any) {
      console.error("Failed to parse .docx:", err);
      throw new Error(`Could not parse DOCX file: ${err?.message || err}`);
    }
  }

  if (ext === "pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let extracted = "";

      // Convert bytes to string for simple PDF stream extraction
      const binaryString = new TextDecoder("latin1").decode(bytes);
      
      // Look for text operators in PDF streams: (text) Tj or [(text)] TJ
      const textMatches = binaryString.matchAll(/\(([^)]+)\)\s*(?:Tj|'|")/g);
      const chunks: string[] = [];
      for (const match of textMatches) {
        if (match[1]) {
          // Unescape common PDF escapes
          const cleaned = match[1]
            .replace(/\\([()\\])/g, "$1")
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "")
            .replace(/\\t/g, " ");
          if (cleaned.trim().length > 1) {
            chunks.push(cleaned);
          }
        }
      }

      if (chunks.length > 0) {
        extracted = chunks.join(" ");
      } else {
        // Fallback: extract ASCII printable strings from PDF
        const textRegex = /[\x20-\x7E\xA0-\xFF]{4,}/g;
        const potentialWords = binaryString.match(textRegex) || [];
        // Filter out PDF internal syntax
        const validWords = potentialWords.filter(
          (w) =>
            !w.includes("obj") &&
            !w.includes("endobj") &&
            !w.includes("xref") &&
            !w.includes("trailer") &&
            !w.includes("startxref") &&
            !w.includes("Font") &&
            !w.includes("Filter") &&
            !w.includes("Length")
        );
        extracted = validWords.join(" ");
      }

      return {
        text: extracted.trim() || `[PDF Document: ${file.name} - Extracted content]`,
        filename: file.name,
      };
    } catch (err: any) {
      console.error("PDF extraction error:", err);
      throw new Error("Could not parse PDF. Please copy and paste text directly.");
    }
  }

  // Default: Plain text or Markdown
  const text = await file.text();
  return {
    text: text.trim(),
    filename: file.name,
  };
}

/**
 * Parses CSV / TSV file into structured batch items
 */
export function parseCsvContent(content: string): ParsedCsvRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/["']/g, ""));
  
  let fnIdx = headers.findIndex((h) => h.includes("file") || h.includes("name") || h.includes("title") || h.includes("id"));
  let vcIdx = headers.findIndex((h) => h.includes("voice") || h.includes("speaker") || h.includes("actor"));
  let txIdx = headers.findIndex((h) => h.includes("text") || h.includes("script") || h.includes("line") || h.includes("content") || h.includes("dialogue"));
  let stIdx = headers.findIndex((h) => h.includes("style") || h.includes("tone") || h.includes("emotion"));

  // If no obvious headers found, assume columns: [Filename, Voice, Text] or [Text]
  const hasHeaderRow = txIdx !== -1 || fnIdx !== -1 || vcIdx !== -1;
  const startRow = hasHeaderRow ? 1 : 0;

  if (!hasHeaderRow) {
    if (headers.length >= 3) {
      fnIdx = 0;
      vcIdx = 1;
      txIdx = 2;
    } else if (headers.length === 2) {
      vcIdx = 0;
      txIdx = 1;
    } else {
      txIdx = 0;
    }
  }

  const rows: ParsedCsvRow[] = [];

  for (let i = startRow; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const text = (txIdx !== -1 ? cols[txIdx] : cols[0]) || "";
    if (!text.trim()) continue;

    const filename = fnIdx !== -1 && cols[fnIdx] ? cols[fnIdx] : undefined;
    const voice = vcIdx !== -1 && cols[vcIdx] ? cols[vcIdx] : undefined;
    const style = stIdx !== -1 && cols[stIdx] ? cols[stIdx] : undefined;

    rows.push({
      text: text.replace(/^"|"$/g, "").trim(),
      filename: filename?.replace(/^"|"$/g, "").trim(),
      voice: voice?.replace(/^"|"$/g, "").trim(),
      style: style?.replace(/^"|"$/g, "").trim(),
    });
  }

  return rows;
}
