export function csvCell(input:unknown):string {
  let value=input===undefined||input===null?"":String(input);
  // Quoting alone does not prevent Excel/Sheets from interpreting formulas.
  if(/^[\s\u0000-\u001f]*[=+@-]/.test(value))value="'"+value;
  return `"${value.replace(/"/g,'""')}"`;
}
export function csvLine(values:unknown[]):string{return values.map(csvCell).join(",")+"\r\n";}
