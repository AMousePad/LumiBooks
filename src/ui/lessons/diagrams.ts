/** Animated concept diagrams for dialogue steps. JS drives phase changes on a
 * loop, CSS carries the motion, and every timer stops itself once its host
 * leaves the DOM. Reduced motion collapses the transitions to state flips. */

export type DiagramKind = "rot" | "fold" | "unfold" | "fade";

export function renderDiagram(host: HTMLElement, kind: DiagramKind): void {
  host.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "lmb-lesson-diagram";
  host.appendChild(wrap);
  switch (kind) {
    case "rot":
      diagramRot(wrap);
      break;
    case "fold":
      diagramFold(wrap);
      break;
    case "unfold":
      diagramUnfold(wrap);
      break;
    case "fade":
      diagramFade(wrap);
      break;
  }
}

function el(cls: string, text?: string): HTMLElement {
  const d = document.createElement("div");
  d.className = cls;
  if (text !== undefined) d.textContent = text;
  return d;
}

function bar(kind: "msg" | "chapter" | "arc", width: number, label?: string): HTMLElement {
  const b = el(`lmb-dg-bar ${kind}`);
  b.style.width = `${width}%`;
  if (label) {
    const tag = el("lmb-dg-tag", label);
    b.appendChild(tag);
  }
  return b;
}

/** Chain phase callbacks on a loop, dying with the element. */
function loop(anchor: HTMLElement, phases: { at: number; run: () => void }[], total: number): void {
  let timers: ReturnType<typeof setTimeout>[] = [];
  const cycle = (): void => {
    if (!anchor.isConnected) {
      for (const t of timers) clearTimeout(t);
      return;
    }
    timers = phases.map((p) => setTimeout(() => {
      if (anchor.isConnected) p.run();
    }, p.at));
    timers.push(setTimeout(cycle, total));
  };
  cycle();
}

const MSG_WIDTHS = [46, 72, 38, 66, 52, 74, 42, 68, 56, 70, 44, 64];

/* --------------------------------------------------------- context rot */

function diagramRot(wrap: HTMLElement): void {
  wrap.appendChild(el("lmb-dg-label", "the context window"));
  const win = el("lmb-dg-window");
  const col = el("lmb-dg-col bottom");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", "new turns push in, the oldest get clipped out");
  wrap.appendChild(caption);

  const MAX = 9;
  let n = 0;
  for (let i = 0; i < MAX - 2; i++) col.appendChild(bar("msg", MSG_WIDTHS[n++ % MSG_WIDTHS.length]!));
  const timer = setInterval(() => {
    if (!col.isConnected) {
      clearInterval(timer);
      return;
    }
    const fresh = bar("msg", MSG_WIDTHS[n++ % MSG_WIDTHS.length]!);
    fresh.classList.add("in");
    col.appendChild(fresh);
    requestAnimationFrame(() => fresh.classList.remove("in"));
    while (col.childElementCount > MAX) {
      const oldest = col.firstElementChild as HTMLElement | null;
      if (!oldest) break;
      if (oldest.classList.contains("clipped")) {
        oldest.remove();
      } else {
        oldest.classList.add("clipped");
        break;
      }
    }
  }, 1000);
}

/* ------------------------------------------------------------- folding */

interface FoldState {
  rows: { kind: "msg" | "chapter" | "arc"; label?: string }[];
  caption: string;
}

function paintFold(col: HTMLElement, caption: HTMLElement, state: FoldState): void {
  col.replaceChildren();
  for (const [i, r] of state.rows.entries()) {
    const b = bar(r.kind, r.kind === "msg" ? MSG_WIDTHS[i % MSG_WIDTHS.length]! : r.kind === "chapter" ? 82 : 90, r.label);
    b.classList.add("in");
    col.appendChild(b);
    requestAnimationFrame(() => b.classList.remove("in"));
  }
  caption.textContent = state.caption;
}

function diagramFold(wrap: HTMLElement): void {
  wrap.appendChild(el("lmb-dg-label", "your chat history"));
  const win = el("lmb-dg-window tall");
  const col = el("lmb-dg-col");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", "");
  wrap.appendChild(caption);

  const msgs = (k: number): FoldState["rows"] => Array.from({ length: k }, () => ({ kind: "msg" as const }));
  const states: FoldState[] = [
    { rows: [...msgs(9)], caption: "old messages pile up…" },
    { rows: [{ kind: "chapter", label: "CH 1" }, ...msgs(6)], caption: "…the oldest fold into a chapter, in place…" },
    { rows: [{ kind: "chapter", label: "CH 1" }, { kind: "chapter", label: "CH 2" }, ...msgs(3)], caption: "…then the next window folds…" },
    { rows: [{ kind: "arc", label: "ARC 1" }, ...msgs(3)], caption: "…and chapters bind into a single arc." },
  ];
  paintFold(col, caption, states[0]!);
  loop(wrap, [
    { at: 2000, run: () => paintFold(col, caption, states[1]!) },
    { at: 4000, run: () => paintFold(col, caption, states[2]!) },
    { at: 6000, run: () => paintFold(col, caption, states[3]!) },
    { at: 8500, run: () => paintFold(col, caption, states[0]!) },
  ], 10500);
}

/* ------------------------------------------------------------ unfolding */

function diagramUnfold(wrap: HTMLElement): void {
  wrap.appendChild(el("lmb-dg-label", "the shelf"));
  const win = el("lmb-dg-window");
  const col = el("lmb-dg-col");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", "");
  wrap.appendChild(caption);

  const filed: FoldState = {
    rows: [{ kind: "chapter", label: "CH 3" }],
    caption: "a chapter covers messages 37-54, they ride hidden",
  };
  const deleted: FoldState = {
    rows: [{ kind: "msg" }, { kind: "msg" }, { kind: "msg" }, { kind: "msg" }],
    caption: "delete it and the messages come right back",
  };
  paintFold(col, caption, filed);
  loop(wrap, [
    { at: 2400, run: () => paintFold(col, caption, deleted) },
    { at: 5400, run: () => paintFold(col, caption, filed) },
  ], 7800);
}

/* ------------------------------------------------------------ fact fade */

const FADE_CHIPS = [
  "Elias → Mara: loves her, hides it",
  "captain wrongly believes: bandits",
  "day 12: she saw the fall",
  "open thread: the receipt",
];

function diagramFade(wrap: HTMLElement): void {
  wrap.appendChild(el("lmb-dg-label", "one summary, compressed again and again"));
  const tier = el("lmb-dg-tier", "chapter");
  wrap.appendChild(tier);
  const card = el("lmb-dg-card");
  for (const w of [88, 74, 81]) {
    const line = el("lmb-dg-line");
    line.style.width = `${w}%`;
    card.appendChild(line);
  }
  wrap.appendChild(card);
  const chips = el("lmb-dg-chips");
  const chipEls = FADE_CHIPS.map((c) => {
    const chip = el("lmb-dg-chip", `◆ ${c}`);
    chips.appendChild(chip);
    return chip;
  });
  wrap.appendChild(chips);
  const caption = el("lmb-dg-caption", "the plot survives, the structured facts thin out");
  wrap.appendChild(caption);

  const reset = (): void => {
    tier.textContent = "chapter";
    tier.classList.remove("hot");
    chips.classList.remove("kept");
    for (const c of chipEls) c.classList.remove("gone");
    caption.textContent = "the plot survives, the structured facts thin out";
  };
  loop(wrap, [
    { at: 1800, run: () => { tier.textContent = "arc"; chipEls[0]!.classList.add("gone"); } },
    { at: 3400, run: () => { chipEls[2]!.classList.add("gone"); } },
    { at: 5000, run: () => { tier.textContent = "volume"; chipEls[1]!.classList.add("gone"); chipEls[3]!.classList.add("gone"); } },
    {
      at: 6600,
      run: () => {
        tier.textContent = "with a codex";
        tier.classList.add("hot");
        chips.classList.add("kept");
        for (const c of chipEls) c.classList.remove("gone");
        caption.textContent = "the codex tracks them explicitly, outside the summaries";
      },
    },
    { at: 9600, run: reset },
  ], 10400);
}
