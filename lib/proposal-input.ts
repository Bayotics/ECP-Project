export interface ProposalInput { submissionId: string; name: string; email: string; title: string; description: string; proposedDate: string; location: string; estimatedBudgetCents?: number; notes: string }
export function validateProposalInput(input: unknown): { value: ProposalInput } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Complete the proposal form." };
  const body = input as Record<string, unknown>;
  const values: Record<string, string> = {};
  for (const [key, label, limit] of [["name", "Name", 150], ["email", "Email", 254], ["title", "Event title", 200], ["description", "Description", 10000], ["location", "Location", 500]] as const) {
    if (typeof body[key] !== "string" || !body[key].trim() || body[key].trim().length > limit) return { error: `${label} is required and must be at most ${limit} characters.` };
    values[key] = body[key].trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return { error: "Enter a valid email address." };
  const date = body.proposedDate;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return { error: "Choose a valid proposed date." };
  if (typeof body.submissionId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.submissionId)) return { error: "Reload the form and try again." };
  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 3000)) return { error: "Notes must be at most 3,000 characters." };
  let estimatedBudgetCents: number | undefined;
  if (body.budget !== undefined && body.budget !== "") {
    if (typeof body.budget !== "string" || !/^\d{1,8}(\.\d{1,2})?$/.test(body.budget)) return { error: "Enter a non-negative budget in dollars with at most two decimal places." };
    estimatedBudgetCents = Math.round(Number(body.budget) * 100);
  }
  return { value: { submissionId: body.submissionId, name: values.name, email: values.email.toLowerCase(), title: values.title, description: values.description, location: values.location, proposedDate: date, ...(estimatedBudgetCents !== undefined ? { estimatedBudgetCents } : {}), notes: (body.notes as string || "").trim() } };
}

/** Proposals are plain user text; existing event descriptions support HTML. */
export function proposalEventDescription(description: string): string {
  return `<p>${description.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\r?\n/g, "<br>")}</p>`;
}
