export class VolunteerError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
