import { readFileSync, writeFileSync } from "fs";

const raw = readFileSync("races_update.json", "utf8").replace(/^﻿/, "");

let result = "";
let inString = false;
let escape = false;

for (let i = 0; i < raw.length; i++) {
  const ch = raw[i];

  if (escape) {
    result += ch;
    escape = false;
    continue;
  }

  if (ch === "\\") {
    escape = true;
    result += ch;
    continue;
  }

  if (ch === '"') {
    if (!inString) {
      inString = true;
      result += ch;
      continue;
    }

    // Inside a string: look ahead past whitespace to decide if this closes the string
    let j = i + 1;
    while (j < raw.length && (raw[j] === " " || raw[j] === "\t" || raw[j] === "\r" || raw[j] === "\n")) j++;
    const next = raw[j] ?? "";

    if (",}]:\n".includes(next) || j >= raw.length) {
      // Closes the string
      inString = false;
      result += ch;
    } else {
      // Content quote — escape it
      result += '\\"';
    }
    continue;
  }

  result += ch;
}

writeFileSync("races_update.json", result, { encoding: "utf8" });

try {
  JSON.parse(result);
  console.log("JSON valido! Racas:", JSON.parse(result).length);
} catch (e) {
  console.error("Ainda invalido:", e.message);
}
