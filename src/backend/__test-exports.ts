import type { LMBProfile } from "../shared";

declare const spindle: import("lumiverse-spindle-types").SpindleAPI;
void spindle;

import { SAMPLER_DEFAULTS } from "../shared";

export function buildSamplerParametersForTest(profile: LMBProfile): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const s = profile.samplers;
  out["temperature"] = s.temperature ?? SAMPLER_DEFAULTS.temperature;
  out["max_tokens"] = s.max_tokens ?? SAMPLER_DEFAULTS.max_tokens;
  out["max_context_length"] = s.max_input_tokens ?? SAMPLER_DEFAULTS.max_input_tokens;
  if (s.top_p !== null) out["top_p"] = s.top_p;
  if (s.top_k !== null) out["top_k"] = s.top_k;
  if (s.frequency_penalty !== null) out["frequency_penalty"] = s.frequency_penalty;
  if (s.presence_penalty !== null) out["presence_penalty"] = s.presence_penalty;
  return out;
}

export function applyTemplateForTest(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const v = vars[k as string];
    return v === undefined ? m : String(v);
  });
}

function stripThinkBlocks(raw: string): string {
  let out = raw.replace(/<(?:think(?:ing)?|reasoning)>[\s\S]*?<\/(?:think(?:ing)?|reasoning)>/gi, "");
  out = out.replace(/^[\s\S]*<\/(?:think(?:ing)?|reasoning)>/i, "");
  out = out.replace(/<(?:think(?:ing)?|reasoning)>/gi, "");
  return out;
}

function normalizeText(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/^﻿/, "")
    .replace(/[​-‍⁠]/g, "")
    .trim();
}

function extractFencedBlocks(s: string): string[] {
  const re = /```([\w-]*)\s*([\s\S]*?)```/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    out.push((m[2] || "").trim());
  }
  return out;
}

const MAX_JSON_SCAN_STARTS = 24;

function extractBalancedJsonSpans(s: string): string[] {
  const out: string[] = [];
  let pos = 0;
  let starts = 0;
  while (pos < s.length && starts < MAX_JSON_SCAN_STARTS) {
    const rel = s.slice(pos).search(/[{[]/);
    if (rel === -1) break;
    const startIdx = pos + rel;
    starts++;
    const open = s[startIdx];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (let i = startIdx; i < s.length; i++) {
      const ch = s[i];
      if (inStr) {
        if (esc) { esc = false; }
        else if (ch === "\\") { esc = true; }
        else if (ch === "\"") { inStr = false; }
        continue;
      }
      if (ch === "\"") { inStr = true; continue; }
      if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) {
      pos = startIdx + 1;
      continue;
    }
    out.push(s.slice(startIdx, end + 1).trim());
    pos = end + 1;
  }
  return out;
}

function collectJsonCandidates(s: string): string[] {
  const out: string[] = [];
  for (const block of extractFencedBlocks(s)) out.push(block);
  out.push(s);
  out.push(...extractBalancedJsonSpans(s));
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const c of out) {
    if (!c) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    uniq.push(c);
  }
  return uniq;
}

function repairJson(s: string): string {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (inStr) {
      out += ch;
      if (esc) { esc = false; }
      else if (ch === "\\") { esc = true; }
      else if (ch === "\"") { inStr = false; }
      continue;
    }
    if (ch === "\"") { inStr = true; out += ch; continue; }
    if (ch === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      if (i < s.length) out += s[i];
      continue;
    }
    if (ch === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length - 1 && !(s[i] === "*" && s[i + 1] === "/")) i++;
      i += 1;
      continue;
    }
    if (ch === ",") {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j]!)) j++;
      if (s[j] === "}" || s[j] === "]") continue;
    }
    out += ch;
  }
  return out;
}

function tryJsonParse(cand: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(cand) as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    return v as Record<string, unknown>;
  } catch {
    return null;
  }
}

function tryParseJsonObject(cand: string): Record<string, unknown> | null {
  const strict = tryJsonParse(cand);
  if (strict) return strict;
  return tryJsonParse(repairJson(cand));
}

interface ParsedSummary {
  title: string;
  opener: string;
  content: string;
  keywords: string[];
  shortComment: string;
}

export function parseSummaryJsonForTest(raw: string): ParsedSummary {
  const cleaned = stripThinkBlocks(raw);
  const normalized = normalizeText(cleaned);
  const safeFallback = (title: string): ParsedSummary => {
    const looksDegenerate = normalized === "" || normalized === "null" || normalized === "undefined";
    return { title, opener: "", content: looksDegenerate ? "" : normalized, keywords: [], shortComment: "" };
  };

  const candidates = collectJsonCandidates(normalized);
  for (const cand of candidates) {
    const obj = tryParseJsonObject(cand);
    if (!obj) continue;
    const title = typeof obj["title"] === "string" ? (obj["title"] as string) : "";
    const opener = typeof obj["opener"] === "string" ? (obj["opener"] as string) : "";
    const contentRaw = obj["content"] ?? obj["summary"] ?? obj["memory_content"];
    if (typeof contentRaw !== "string") continue;
    const kw = obj["keywords"];
    const keywords = Array.isArray(kw) ? kw.filter((x): x is string => typeof x === "string") : [];
    const sc = typeof obj["short_comment"] === "string" ? (obj["short_comment"] as string) : "";
    return { title, opener, content: contentRaw, keywords, shortComment: sc };
  }
  return safeFallback("");
}
