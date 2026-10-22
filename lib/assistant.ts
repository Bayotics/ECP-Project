export interface AssistantSource {
  id: string;
  title: string;
  url: string;
  text: string;
  kind: "page" | "document" | "event" | "news" | "committee";
}
export type AssistantLink = Pick<AssistantSource, "title" | "url" | "kind">;
export interface AssistantTurn { role: "user" | "assistant"; content: string }
export interface AssistantReply { answer: string; links: AssistantLink[] }
export const ASSISTANT_MESSAGE_LIMIT = 1200;
export const ASSISTANT_HISTORY_LIMIT = 12;
