import { majorToMinor } from '@/shared/lib/money';

import { classifyCardType } from './cardType';

import type { Transaction } from '../types/transaction';

export type ParsedRecord = {
  cardholderName: string | null;
  cardNumber: string;
  amountMinor: number;
  occurredAt: string;
};

export type ParseOutcome = {
  accepted: Transaction[];
  rejected: Transaction[];
  errors: string[];
};

const REQUIRED_FIELDS = ['cardNumber', 'amount'] as const;

function normaliseAmount(raw: string | number | undefined): number | null {
  if (raw === undefined) return null;
  const text = String(raw).replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  return majorToMinor(Number(text));
}

function normaliseCardNumber(raw: string | number | undefined): string | null {
  if (raw === undefined) return null;
  const digits = String(raw).replace(/\D+/g, '');
  return /^\d{13,19}$/.test(digits) ? digits : null;
}

function normaliseTimestamp(raw: string | number | undefined): string {
  if (raw === undefined || raw === '') return new Date().toISOString();
  const parsed = new Date(String(raw));
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

/** Minimal CSV parser: assumes the first row is a header. Handles quoted cells. */
function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);
    const next = text.charAt(i + 1);

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      current.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (cell.length > 0 || current.length > 0) {
        current.push(cell);
        rows.push(current);
        current = [];
        cell = '';
      }
      if (ch === '\r' && next === '\n') i += 1;
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }

  if (rows.length === 0) return [];
  const header = rows[0]!.map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((key, index) => {
      obj[key] = (row[index] ?? '').trim();
    });
    return obj;
  });
}

function parseJsonPayload(text: string): Array<Record<string, unknown>> {
  const data: unknown = JSON.parse(text);
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (data && typeof data === 'object' && 'transactions' in data) {
    const list = (data as { transactions?: unknown }).transactions;
    if (Array.isArray(list)) return list as Array<Record<string, unknown>>;
  }
  throw new Error('JSON must be an array or an object with a `transactions` array.');
}

function parseXml(text: string): Array<Record<string, string>> {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const parseError = doc.getElementsByTagName('parsererror')[0];
  if (parseError) throw new Error('Invalid XML document.');

  return Array.from(doc.getElementsByTagName('transaction')).map((node) => {
    const record: Record<string, string> = {};
    Array.from(node.children).forEach((child) => {
      record[child.tagName] = child.textContent?.trim() ?? '';
    });
    return record;
  });
}

function toRecord(raw: Record<string, unknown>): ParsedRecord | { error: string } {
  const cardNumber = normaliseCardNumber(raw['cardNumber'] as string | number | undefined);
  const amountMinor = normaliseAmount(raw['amount'] as string | number | undefined);

  const missing = REQUIRED_FIELDS.filter((field) => {
    if (field === 'cardNumber') return cardNumber === null;
    if (field === 'amount') return amountMinor === null;
    return false;
  });
  if (missing.length > 0) {
    return { error: `Missing or invalid fields: ${missing.join(', ')}` };
  }

  const nameRaw = raw['cardholderName'];
  const cardholderName =
    typeof nameRaw === 'string' && nameRaw.trim().length > 0 ? nameRaw.trim() : null;

  return {
    cardholderName,
    cardNumber: cardNumber!,
    amountMinor: amountMinor!,
    occurredAt: normaliseTimestamp(raw['occurredAt'] as string | number | undefined),
  };
}

function recordToTransaction(record: ParsedRecord, now: Date): Transaction {
  const cardType = classifyCardType(record.cardNumber);
  const rejected = cardType === null;
  return {
    id: crypto.randomUUID(),
    cardholderName: record.cardholderName,
    cardNumber: record.cardNumber,
    cardType,
    amountMinor: record.amountMinor,
    currency: 'USD',
    occurredAt: record.occurredAt || now.toISOString(),
    status: rejected ? 'REJECTED' : 'ACCEPTED',
    rejectionReason: rejected ? 'Unsupported card network (leading digit).' : null,
    source: 'UPLOAD',
  };
}

export async function parseUploadFile(file: File): Promise<ParseOutcome> {
  const text = await file.text();
  const name = file.name.toLowerCase();
  const now = new Date();

  let rawRecords: Array<Record<string, unknown>>;
  try {
    if (name.endsWith('.json')) {
      rawRecords = parseJsonPayload(text);
    } else if (name.endsWith('.xml')) {
      rawRecords = parseXml(text);
    } else if (name.endsWith('.csv')) {
      rawRecords = parseCsv(text);
    } else {
      return { accepted: [], rejected: [], errors: [`Unsupported file type: ${file.name}`] };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parse error.';
    return { accepted: [], rejected: [], errors: [`${file.name}: ${message}`] };
  }

  const accepted: Transaction[] = [];
  const rejected: Transaction[] = [];
  const errors: string[] = [];

  rawRecords.forEach((raw, index) => {
    const parsed = toRecord(raw);
    if ('error' in parsed) {
      errors.push(`${file.name} (row ${index + 1}): ${parsed.error}`);
      return;
    }
    const transaction = recordToTransaction(parsed, now);
    if (transaction.status === 'ACCEPTED') accepted.push(transaction);
    else rejected.push(transaction);
  });

  return { accepted, rejected, errors };
}
