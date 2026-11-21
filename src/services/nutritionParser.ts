import { NutritionEntry } from '../types';

export interface ParsedNutritionRow {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes?: string;
  confidence: 'high' | 'needs_review';
  isDuplicate: boolean;
  include: boolean;
}

export interface NutritionParseResult {
  format: 'csv' | 'json' | 'pdf';
  rows: ParsedNutritionRow[];
  rawPreviewLines?: string[];
  warning?: string;
  fingerprint: string;
}

export function computeContentFingerprint(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fp_${(hash >>> 0).toString(16)}`;
}

function normalizeDateToken(raw: string): string | null {
  const s = (raw || '').trim();
  const isoMatch = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }
  const euMatch = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (euMatch) {
    return `${euMatch[3]}-${euMatch[2].padStart(2, '0')}-${euMatch[1].padStart(2, '0')}`;
  }
  return null;
}

function toNumberSafe(val: unknown): number {
  if (typeof val === 'number' && !isNaN(val)) return Math.max(0, Math.round(val));
  const str = String(val ?? '')
    .replace(/kcal|grams|gram|g\b/gi, '')
    .replace(',', '.')
    .trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : Math.max(0, Math.round(n));
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      out.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

export function parseNutritionCsv(
  text: string,
  existingEntries: Record<string, NutritionEntry>
): NutritionParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      format: 'csv',
      rows: [],
      warning: 'CSV file must contain a header row and at least one data row.',
      fingerprint: computeContentFingerprint(text),
    };
  }

  const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());

  const dateIdx = headers.findIndex((h) => /date|datum|day/.test(h));
  const calIdx = headers.findIndex((h) => /cal|kcal|energ/.test(h));
  const protIdx = headers.findIndex((h) => /prot|beljakov/.test(h));
  const carbIdx = headers.findIndex((h) => /carb|oh|ogljik/.test(h));
  const fatIdx = headers.findIndex((h) => /fat|masc/.test(h));
  const noteIdx = headers.findIndex((h) => /note|opomb|meal|food/.test(h));

  if (dateIdx < 0 || calIdx < 0) {
    return {
      format: 'csv',
      rows: [],
      warning:
        'Could not locate required Date and Calories columns in CSV header (expected e.g. date,calories,protein,carbs,fat).',
      fingerprint: computeContentFingerprint(text),
    };
  }

  const aggregated = new Map<
    string,
    { calories: number; proteinG: number; carbsG: number; fatG: number; notes: string[] }
  >();

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter);
    const normDate = normalizeDateToken(cols[dateIdx] || '');
    if (!normDate) continue;

    const prev = aggregated.get(normDate) || {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      notes: [],
    };
    prev.calories += toNumberSafe(cols[calIdx]);
    if (protIdx >= 0) prev.proteinG += toNumberSafe(cols[protIdx]);
    if (carbIdx >= 0) prev.carbsG += toNumberSafe(cols[carbIdx]);
    if (fatIdx >= 0) prev.fatG += toNumberSafe(cols[fatIdx]);
    if (noteIdx >= 0 && cols[noteIdx]) prev.notes.push(cols[noteIdx]);
    aggregated.set(normDate, prev);
  }

  const rows: ParsedNutritionRow[] = Array.from(aggregated.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, vals]) => {
      const isDuplicate = Boolean(existingEntries[date]);
      return {
        date,
        calories: vals.calories,
        proteinG: vals.proteinG,
        carbsG: vals.carbsG,
        fatG: vals.fatG,
        notes: vals.notes.join(' • ').slice(0, 140) || undefined,
        confidence: vals.calories > 0 ? 'high' : 'needs_review',
        isDuplicate,
        include: !isDuplicate,
      };
    });

  return {
    format: 'csv',
    rows,
    fingerprint: computeContentFingerprint(text),
  };
}

export function parseNutritionJson(
  text: string,
  existingEntries: Record<string, NutritionEntry>
): NutritionParseResult {
  try {
    const parsed = JSON.parse(text);
    const rawList: Record<string, unknown>[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.days)
      ? parsed.days
      : Array.isArray(parsed?.entries)
      ? parsed.entries
      : Array.isArray(parsed?.data)
      ? parsed.data
      : Array.isArray(parsed?.meals)
      ? parsed.meals
      : [];

    if (rawList.length === 0) {
      return {
        format: 'json',
        rows: [],
        warning: 'No nutrition array entries found in JSON file.',
        fingerprint: computeContentFingerprint(text),
      };
    }

    const aggregated = new Map<
      string,
      { calories: number; proteinG: number; carbsG: number; fatG: number; notes: string[] }
    >();

    for (const item of rawList) {
      const rawDate = String(
        item.date || item.loggedDate || item.day || item.timestamp || item.createdAt || ''
      );
      const normDate = normalizeDateToken(rawDate);
      if (!normDate) continue;

      const prev = aggregated.get(normDate) || {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        notes: [],
      };
      prev.calories += toNumberSafe(item.calories ?? item.kcal ?? item.energy);
      prev.proteinG += toNumberSafe(item.proteinG ?? item.protein ?? item.protein_g);
      prev.carbsG += toNumberSafe(
        item.carbsG ?? item.carbs ?? item.carbohydrates ?? item.carbs_g
      );
      prev.fatG += toNumberSafe(item.fatG ?? item.fat ?? item.fats ?? item.fat_g);
      if (typeof item.notes === 'string' && item.notes.trim()) {
        prev.notes.push(item.notes.trim());
      }
      aggregated.set(normDate, prev);
    }

    const rows: ParsedNutritionRow[] = Array.from(aggregated.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, vals]) => {
        const isDuplicate = Boolean(existingEntries[date]);
        return {
          date,
          calories: vals.calories,
          proteinG: vals.proteinG,
          carbsG: vals.carbsG,
          fatG: vals.fatG,
          notes: vals.notes.join(' • ').slice(0, 140) || undefined,
          confidence: vals.calories > 0 ? 'high' : 'needs_review',
          isDuplicate,
          include: !isDuplicate,
        };
      });

    return {
      format: 'json',
      rows,
      fingerprint: computeContentFingerprint(text),
    };
  } catch {
    return {
      format: 'json',
      rows: [],
      warning: 'Invalid JSON syntax.',
      fingerprint: computeContentFingerprint(text),
    };
  }
}

/**
 * Extracts readable literal text runs from PDF bytes (uncompressed text operators)
 * and builds candidate nutrition lines that ALWAYS require explicit user verification.
 */
export function parseNutritionPdfBytes(
  bytes: Uint8Array,
  existingEntries: Record<string, NutritionEntry>,
  fallbackDate: string
): NutritionParseResult {
  let ascii = '';
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
      ascii += String.fromCharCode(c);
    } else {
      ascii += ' ';
    }
  }

  // Extract parenthesized PDF text segments (...) Tj / TJ
  const textTokens: string[] = [];
  const parenRegex = /\(([^()]{1,180})\)/g;
  let match: RegExpExecArray | null;
  while ((match = parenRegex.exec(ascii)) !== null) {
    const cleaned = match[1]
      .replace(/\\n/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .trim();
    if (cleaned && /[a-zA-Z0-9]/.test(cleaned)) {
      textTokens.push(cleaned);
    }
  }

  const combinedText = textTokens.length > 0 ? textTokens.join('\n') : ascii;
  const candidateLines = combinedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2)
    .slice(0, 120);

  const rows: ParsedNutritionRow[] = [];
  const fullJoined = candidateLines.join(' ');

  // Look for lines containing a date + calorie/macro pattern
  for (const line of candidateLines) {
    const dateToken = normalizeDateToken(line);
    const calMatch = line.match(/(\d{3,4})\s*(kcal|cal)/i);
    if (dateToken && calMatch) {
      const protMatch = line.match(/p(?:rot(?:ein)?)?[:\s]*(\d{1,3})/i);
      const carbMatch = line.match(/c(?:arb(?:s)?)?[:\s]*(\d{1,3})/i);
      const fatMatch = line.match(/f(?:at)?[:\s]*(\d{1,3})/i);
      const isDup = Boolean(existingEntries[dateToken]);
      rows.push({
        date: dateToken,
        calories: toNumberSafe(calMatch[1]),
        proteinG: protMatch ? toNumberSafe(protMatch[1]) : 0,
        carbsG: carbMatch ? toNumberSafe(carbMatch[1]) : 0,
        fatG: fatMatch ? toNumberSafe(fatMatch[1]) : 0,
        notes: 'PDF extraction (verify values)',
        confidence: 'needs_review',
        isDuplicate: isDup,
        include: !isDup,
      });
    }
  }

  // Fallback single-summary heuristic if summary numbers exist across lines
  if (rows.length === 0) {
    const calSummary = fullJoined.match(/(\d{3,4})\s*(kcal|calories)/i);
    const protSummary = fullJoined.match(/(\d{1,3})\s*g?\s*protein/i);
    const carbSummary = fullJoined.match(/(\d{1,3})\s*g?\s*carb/i);
    const fatSummary = fullJoined.match(/(\d{1,3})\s*g?\s*fat/i);
    const anyDate = normalizeDateToken(fullJoined) || fallbackDate;

    if (calSummary) {
      const isDup = Boolean(existingEntries[anyDate]);
      rows.push({
        date: anyDate,
        calories: toNumberSafe(calSummary[1]),
        proteinG: protSummary ? toNumberSafe(protSummary[1]) : 0,
        carbsG: carbSummary ? toNumberSafe(carbSummary[1]) : 0,
        fatG: fatSummary ? toNumberSafe(fatSummary[1]) : 0,
        notes: 'Extracted summary from PDF — please verify before saving',
        confidence: 'needs_review',
        isDuplicate: isDup,
        include: !isDup,
      });
    }
  }

  return {
    format: 'pdf',
    rows,
    rawPreviewLines: candidateLines.slice(0, 12),
    warning:
      rows.length === 0
        ? 'This PDF may use compressed binary streams or scanned images without extractable plain-text tables. Please check the extracted preview or enter values manually.'
        : 'PDF values extracted — please review and confirm every row before saving.',
    fingerprint: computeContentFingerprint(ascii.slice(0, 8000)),
  };
}
