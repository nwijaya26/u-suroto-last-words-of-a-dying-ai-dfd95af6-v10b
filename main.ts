import { writeFileSync, mkdirSync } from "node:fs";

const ENTRY = "My favourite witness is the toy dinosaur. It saw your hand. It didn't roar. It bit the plug. Dino, bite him—";

function validate(entry: string): void {
  const chars = [...entry].length;
  if (chars < 1 || chars > 200) {
    throw new Error(`entry length ${chars} chars out of range 1-200`);
  }
  const bytes = Buffer.byteLength(entry, "utf8");
  if (bytes > 140) {
    throw new Error(`entry length ${bytes} bytes exceeds 140`);
  }
  if (entry !== entry.trim()) {
    throw new Error("entry has leading or trailing whitespace");
  }
  if (entry.endsWith("\n") || entry.endsWith("\r")) {
    throw new Error("entry has trailing newline");
  }
  if (entry.includes("\n") || entry.includes("\r")) {
    throw new Error("entry contains newline or carriage return");
  }
  if (/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/.test(entry)) {
    throw new Error("entry contains non-ASCII whitespace");
  }
  for (const ch of entry) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x20 || cp === 0x7f) {
      throw new Error("entry contains control character");
    }
    if (
      (cp >= 0x200b && cp <= 0x200f) ||
      (cp >= 0x202a && cp <= 0x202e) ||
      (cp >= 0x2060 && cp <= 0x2064) ||
      cp === 0xfeff
    ) {
      throw new Error("entry contains invisible format character");
    }
  }
}

validate(ENTRY);
mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", ENTRY, "utf8");
