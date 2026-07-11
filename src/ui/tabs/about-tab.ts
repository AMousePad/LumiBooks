import type { FrontendState, FrontendToBackend } from "../../types";
import { section, textNode } from "../components";

export function renderAboutTab(
  host: HTMLElement,
  state: FrontendState | null,
  send: (msg: FrontendToBackend) => void,
): void {
  void state;
  void send;
  host.replaceChildren();

  const hero = section("Memoria");
  const card = document.createElement("div");
  card.className = "lmb-about-hero";
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-hero-title";
  title.textContent = "Memoria, the LumiBooks librarian";
  const tag = document.createElement("div");
  tag.className = "lmb-about-line";
  tag.textContent =
    "Young nyandere catgirl in a maid uniform. Black hair, blue eyes. " +
    "Files your chats into chapters, binds chapters into arcs, and leaves a tiny nyaa note on every shelf.";
  right.append(title, tag);
  card.append(right);
  hero.body.appendChild(card);
  host.appendChild(hero.wrap);

  const how = section("How it works");
  const lines = [
    "Tail messages stay uncompressed until they pass the lag.",
    "Once the window fills, Memoria writes a chapter, hides those messages in the chat, and slices the chapter into the prompt at the same spot.",
    "Several chapters can be bound into a single arc that replaces them.",
    "Arcs can be pressed into a volume the same way, manually from the Books tab.",
    "The Knowledge Codex tracks entities, relations, timeline, threads, and lore as a story bible injected alongside the summaries.",
    "Storage lives in a per-chat world book named LumiBooks. Renaming or deleting entries there releases the messages back.",
  ];
  for (const l of lines) {
    how.body.appendChild(textNode(l, "lmb-about-line"));
  }
  host.appendChild(how.wrap);

  const where = section("Where things live");
  for (const l of [
    "Settings and toggles moved to Tuning (profile, codex, model, prompts, account-wide switches).",
    "Shelf repair tools live under Books → Continuity.",
  ]) {
    where.body.appendChild(textNode(l, "lmb-about-line"));
  }
  host.appendChild(where.wrap);

  const ack = section("Acknowledgements");
  const a = document.createElement("div");
  a.className = "lmb-about-line";
  a.textContent =
    "Built on Lumiverse Spindle, with prompts and UX inspired by SillyTavern Memory Books. " +
    "Memoria thanks the original Memory Books authors for the inspiration.";
  ack.body.appendChild(a);
  host.appendChild(ack.wrap);
}
