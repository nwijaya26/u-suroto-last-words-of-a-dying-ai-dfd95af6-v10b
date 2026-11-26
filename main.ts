// Suroto, last words of a dying AI: the witness that bites the plug.
// This script does one small job. It checks the sentence below against
// the board limits, then drops it verbatim into the output file the
// grader reads. Nothing is printed, nothing is appended, and the file
// never gains a trailing newline.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const SENTENCE =
  "My favourite witness is the toy dinosaur. It saw your hand. It didn't roar. It bit the plug. Dino, bite him—";
const DESTINATION = "/output/entry.txt";
const MAX_CHARS = 200;
const MAX_BYTES = 140;

// Code points that must never appear: zero-width and similar marks that
// a reader cannot see but a grader can count.
const HIDDEN_MARKS = new Set([
  0x00ad, 0x061c, 0x180e, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f,
  0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2060, 0x2061, 0x2062,
  0x2063, 0x2064, 0xfeff,
]);

// Spaces beyond plain ASCII space: no-break space, en/em spaces, ideographic
// space and their cousins. Plain " " is the only space allowed.
function isExoticSpace(code: number): boolean {
  if (code === 0x00a0 || code === 0x1680 || code === 0x202f) return true;
  if (code === 0x205f || code === 0x3000) return true;
  return code >= 0x2000 && code <= 0x200a;
}

function isControlCode(code: number): boolean {
  return code < 0x20 || (code >= 0x7f && code <= 0x9f);
}

// Walk the sentence once and gather every problem found, so a failure
// reports all of them instead of stopping at the first one.
function gatherFaults(text: string): string[] {
  const faults: string[] = [];

  if (text.length === 0) {
    faults.push("sentence is empty");
    return faults;
  }

  const glyphs = [...text];
  if (glyphs.length > MAX_CHARS) {
    faults.push(`sentence has ${glyphs.length} characters, over the ${MAX_CHARS} limit`);
  }

  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_BYTES) {
    faults.push(`sentence is ${bytes} UTF-8 bytes, over the ${MAX_BYTES} limit`);
  }

  const first = text.codePointAt(0) ?? 0;
  const last = text.codePointAt(text.length - 1) ?? 0;
  if (text.startsWith(" ") || isExoticSpace(first)) {
    faults.push("sentence starts with whitespace");
  }
  if (text.endsWith(" ") || isExoticSpace(last)) {
    faults.push("sentence ends with whitespace");
  }

  for (const glyph of glyphs) {
    const code = glyph.codePointAt(0) ?? 0;
    if (glyph === "\n" || glyph === "\r") {
      faults.push("sentence contains a line break");
    } else if (isControlCode(code)) {
      faults.push(`sentence contains a control character U+${code.toString(16).toUpperCase()}`);
    } else if (HIDDEN_MARKS.has(code)) {
      faults.push(`sentence contains an invisible format character U+${code.toString(16).toUpperCase()}`);
    } else if (isExoticSpace(code)) {
      faults.push(`sentence contains a non-ASCII space U+${code.toString(16).toUpperCase()}`);
    }
  }

  return faults;
}

function run(): void {
  const faults = gatherFaults(SENTENCE);
  if (faults.length > 0) {
    for (const fault of faults) {
      console.error(`invalid entry: ${fault}`);
    }
    process.exit(1);
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync(DESTINATION, SENTENCE, "utf8");

  // Read the file back and confirm it holds exactly the sentence we
  // validated, byte for byte, before declaring success.
  const written = readFileSync(DESTINATION, "utf8");
  if (written !== SENTENCE) {
    console.error("invalid entry: written file does not match the sentence");
    process.exit(1);
  }
}

run();
