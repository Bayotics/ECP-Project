import { validateVolunteerInput, type VolunteerInput } from "@/lib/volunteer-input";

export interface CsvMapping { name?: string; firstName?: string; lastName?: string; email: string; phone?: string; interests?: string; notes?: string; externalId?: string }
export interface VolunteerCsvRow { row: number; value?: VolunteerInput; externalId?: string; error?: string; duplicate?: boolean }

/** RFC 4180 quoting, escaped quotes, CRLF, BOM and quoted newlines. No evaluation. */
export function parseVolunteerCsv(csv: string): { headers: string[]; rows: string[][] } {
  if (typeof csv !== "string" || csv.length > 2_000_000) throw Error("Choose a CSV file smaller than 2 MB.");
  const source = csv.replace(/^\uFEFF/, "");
  const table: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  function endCell() { row.push(cell); cell = ""; closed = false; }
  function endRow() { endCell(); if (row.some(value => value.trim())) table.push(row); row = []; if (table.length > 1001) throw Error("Import up to 1,000 rows at a time."); }
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"') { if (source[index + 1] === '"') { cell += '"'; index++; } else { quoted = false; closed = true; } }
      else cell += char;
    } else if (char === '"' && !cell && !closed) quoted = true;
    else if (char === '"') throw Error("Invalid CSV: quotes must surround the entire value.");
    else if (char === ',') endCell();
    else if (char === '\r' || char === '\n') { if (char === '\r' && source[index + 1] === '\n') index++; endRow(); }
    else if (closed && !/\s/.test(char)) throw Error("Invalid CSV: unexpected text after a quoted value.");
    else if (!closed) cell += char;
  }
  if (quoted) throw Error("Invalid CSV: a quoted value was not closed.");
  if (cell || row.length || closed) endRow();
  const headers = (table.shift() || []).map(value => value.trim());
  if (!headers.length || headers.some(value => !value) || new Set(headers.map(value => value.toLowerCase())).size !== headers.length) throw Error("CSV headers must be present, non-empty and unique.");
  if (!table.length) throw Error("This CSV contains no volunteer rows.");
  if (table.some(row => row.length !== headers.length)) throw Error("Each CSV row must have the same number of columns as the header.");
  return { headers, rows: table };
}

export function suggestCsvMapping(headers: string[]): CsvMapping {
  const find = (...names: string[]) => headers.find(header => names.includes(header.toLowerCase().replace(/[^a-z0-9]/g, "")));
  return { name: find("name", "fullname", "attendeename"), firstName: find("firstname", "first"), lastName: find("lastname", "last", "surname"), email: find("email", "emailaddress", "attendeeemail") || "", phone: find("phone", "phonenumber", "mobile"), interests: find("interests", "skills"), notes: find("notes", "comments"), externalId: find("externalid", "attendeeid", "registrationid") };
}

export function previewVolunteerCsv(csv: string, mapping: CsvMapping, eventId?: string): VolunteerCsvRow[] {
  const { headers, rows } = parseVolunteerCsv(csv);
  if (!mapping || !headers.includes(mapping.email) || !(mapping.name && headers.includes(mapping.name)) && !(mapping.firstName && headers.includes(mapping.firstName))) throw Error("Map an email column and a name (or first-name) column before importing.");
  for (const column of Object.values(mapping)) if (column && !headers.includes(column)) throw Error("A mapped column does not exist in this CSV.");
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const value = (key: keyof CsvMapping) => mapping[key] ? row[headers.indexOf(mapping[key]!)]?.trim() || "" : "";
    const result = validateVolunteerInput({ name: value("name") || [value("firstName"), value("lastName")].filter(Boolean).join(" "), email: value("email"), phone: value("phone"), interests: value("interests"), notes: value("notes"), eventId });
    if ("error" in result) return { row: index + 2, error: result.error };
    if (seen.has(result.value.email)) return { row: index + 2, duplicate: true, error: "Duplicate email in this file; the first row will be used." };
    seen.add(result.value.email);
    const externalId = value("externalId");
    if (externalId.length > 200) return { row: index + 2, error: "External registration ID is too long." };
    return { row: index + 2, value: result.value, externalId: externalId || undefined };
  });
}
