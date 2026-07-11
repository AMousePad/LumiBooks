export interface TextInputOpts {
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onChange?: (v: string) => void;
  onBlur?: (v: string) => void;
  className?: string;
}
export function textInput(opts: TextInputOpts): HTMLInputElement {
  const el = document.createElement("input");
  el.type = "text";
  el.className = `lmb-input ${opts.className ?? ""}`.trim();
  el.value = opts.value;
  if (opts.placeholder) el.placeholder = opts.placeholder;
  if (opts.autoFocus) setTimeout(() => el.focus(), 0);
  if (opts.onChange) {
    el.addEventListener("input", () => opts.onChange?.(el.value));
  }
  if (opts.onBlur) {
    el.addEventListener("blur", () => opts.onBlur?.(el.value));
  }
  return el;
}

export interface TextAreaOpts {
  value: string;
  placeholder?: string;
  rows?: number;
  onChange?: (v: string) => void;
  onBlur?: (v: string) => void;
}
export function textArea(opts: TextAreaOpts): HTMLTextAreaElement {
  const el = document.createElement("textarea");
  el.className = "lmb-input lmb-textarea";
  el.value = opts.value;
  if (opts.placeholder) el.placeholder = opts.placeholder;
  if (opts.rows) el.rows = opts.rows;
  if (opts.onChange) el.addEventListener("input", () => opts.onChange?.(el.value));
  if (opts.onBlur) el.addEventListener("blur", () => opts.onBlur?.(el.value));
  return el;
}

export interface NumberInputOpts {
  value: number | null;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
  defaultValue?: number;
  onBlur?: (v: number | null) => void;
}
export function numberInput(opts: NumberInputOpts): HTMLInputElement {
  const el = document.createElement("input");
  el.type = "number";
  el.className = "lmb-input";
  const showAsBlank =
    opts.value === null ||
    (opts.defaultValue !== undefined && opts.value === opts.defaultValue);
  el.value = showAsBlank ? "" : String(opts.value);
  if (typeof opts.min === "number") el.min = String(opts.min);
  if (typeof opts.max === "number") el.max = String(opts.max);
  if (typeof opts.step === "number") el.step = String(opts.step);
  if (opts.disabled) el.disabled = true;
  if (opts.placeholder) el.placeholder = opts.placeholder;
  else if (opts.defaultValue !== undefined) el.placeholder = String(opts.defaultValue);
  if (opts.onBlur) {
    el.addEventListener("blur", () => {
      const raw = el.value.trim();
      if (raw === "") {
        if (opts.defaultValue !== undefined) {
          opts.onBlur?.(opts.defaultValue);
        } else {
          opts.onBlur?.(null);
        }
        return;
      }
      const v = Number(raw);
      if (!Number.isFinite(v)) {
        el.value = showAsBlank || opts.value === null || opts.value === undefined ? "" : String(opts.value);
        return;
      }
      opts.onBlur?.(v);
    });
  }
  return el;
}

export interface SelectOpts {
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange?: (v: string) => void;
  ariaLabel?: string;
}
export function select(opts: SelectOpts): HTMLSelectElement {
  const el = document.createElement("select");
  el.className = "lmb-input lmb-select";
  if (opts.ariaLabel) el.setAttribute("aria-label", opts.ariaLabel);
  for (const o of opts.options) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.disabled) opt.disabled = true;
    if (o.value === opts.value) opt.selected = true;
    el.appendChild(opt);
  }
  el.value = opts.value;
  if (opts.onChange) el.addEventListener("change", () => opts.onChange?.(el.value));
  return el;
}

export interface CheckboxOpts {
  checked: boolean;
  label: string;
  hint?: string;
  onChange?: (checked: boolean) => void;
}
export function checkbox(opts: CheckboxOpts): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "lmb-check";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = opts.checked;
  const body = document.createElement("div");
  body.className = "lmb-check-body";
  const lbl = document.createElement("div");
  lbl.className = "lmb-check-label";
  lbl.textContent = opts.label;
  body.appendChild(lbl);
  if (opts.hint) {
    const hint = document.createElement("div");
    hint.className = "lmb-check-hint";
    hint.textContent = opts.hint;
    body.appendChild(hint);
  }
  label.append(input, body);
  if (opts.onChange) input.addEventListener("change", () => opts.onChange?.(input.checked));
  return label;
}

export interface MultiSelectOpts {
  options: { value: string; label: string }[];
  selected: string[];
  onChange?: (next: string[]) => void;
  emptyText?: string;
}
export function multiSelect(opts: MultiSelectOpts): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "lmb-multiselect";
  if (opts.options.length === 0) {
    const empty = document.createElement("div");
    empty.className = "lmb-empty";
    empty.textContent = opts.emptyText ?? "Nothing to pick";
    wrap.appendChild(empty);
    return wrap;
  }
  const sel = new Set(opts.selected);
  for (const o of opts.options) {
    const row = document.createElement("label");
    row.className = "lmb-multiselect-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = sel.has(o.value);
    const span = document.createElement("span");
    span.textContent = o.label;
    row.append(cb, span);
    cb.addEventListener("change", () => {
      if (cb.checked) sel.add(o.value);
      else sel.delete(o.value);
      opts.onChange?.(Array.from(sel));
    });
    wrap.appendChild(row);
  }
  return wrap;
}

export interface ButtonOptions {
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
  disabled?: boolean;
  title?: string;
}
export function makeButton(label: string, onClick: () => void, opts: ButtonOptions = {}): HTMLButtonElement {
  const btn = document.createElement("button");
  const classes = ["lmb-btn"];
  if (opts.primary) classes.push("primary");
  if (opts.danger) classes.push("danger");
  if (opts.small) classes.push("small");
  btn.className = classes.join(" ");
  btn.textContent = label;
  btn.disabled = !!opts.disabled;
  btn.type = "button";
  if (opts.title) btn.title = opts.title;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    onClick();
  });
  return btn;
}

export function section(title: string): { wrap: HTMLElement; body: HTMLElement; head: HTMLElement } {
  const wrap = document.createElement("div");
  wrap.className = "lmb-section";
  const head = document.createElement("div");
  head.className = "lmb-section-title";
  head.append(document.createTextNode(title));
  wrap.appendChild(head);
  const body = document.createElement("div");
  body.className = "lmb-collapsible-body";
  wrap.appendChild(body);
  return { wrap, body, head };
}

export function field(label: string): { wrap: HTMLElement; body: HTMLElement } {
  const wrap = document.createElement("div");
  wrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = label;
  wrap.appendChild(lbl);
  const body = document.createElement("div");
  body.className = "lmb-field-body";
  wrap.appendChild(body);
  return { wrap, body };
}

export function labelled(label: string, child: HTMLElement): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = label;
  wrap.appendChild(lbl);
  wrap.appendChild(child);
  return wrap;
}

export function pill(text: string, tone?: "ok" | "warn" | "danger"): HTMLElement {
  const el = document.createElement("span");
  el.className = `lmb-pill${tone ? " " + tone : ""}`;
  el.textContent = text;
  return el;
}

export interface SubtabDef<K extends string> {
  key: K;
  label: string;
}

/** Horizontal subtab strip used inside every top-level tab. */
export function makeSubtabs<K extends string>(
  defs: SubtabDef<K>[],
  active: K,
  onPick: (key: K) => void,
): HTMLElement {
  const bar = document.createElement("div");
  bar.className = "lmb-subtabs";
  let activeBtn: HTMLButtonElement | null = null;
  for (const d of defs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `lmb-subtab${d.key === active ? " active" : ""}`;
    btn.textContent = d.label;
    btn.addEventListener("click", () => {
      if (d.key !== active) onPick(d.key);
    });
    bar.appendChild(btn);
    if (d.key === active) activeBtn = btn;
  }
  // After mount: flag overflow (drives the fade mask) and keep the active
  // subtab in view - a hidden active tab with no scroll hint reads as missing.
  requestAnimationFrame(() => {
    if (!bar.isConnected) return;
    bar.classList.toggle("scrollable", bar.scrollWidth > bar.clientWidth + 1);
    if (activeBtn && bar.scrollWidth > bar.clientWidth + 1) {
      activeBtn.scrollIntoView({ inline: "nearest", block: "nearest" });
    }
  });
  return bar;
}

/** Dashboard stat tile: a big display-font value over a tracked label. */
export function statTile(value: string, label: string, sub?: string, tooltip?: string): HTMLElement {
  const tile = document.createElement("div");
  tile.className = "lmb-tile";
  if (tooltip) tile.title = tooltip;
  const v = document.createElement("div");
  v.className = "lmb-tile-value";
  v.textContent = value;
  const l = document.createElement("div");
  l.className = "lmb-tile-label";
  l.textContent = label;
  tile.append(v, l);
  if (sub) {
    const s = document.createElement("div");
    s.className = "lmb-tile-sub";
    s.textContent = sub;
    tile.appendChild(s);
  }
  return tile;
}

export interface SearchFieldOpts {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}

/** Search input with a magnifier glyph and a clear button - a bare underline
 * input reads as floating text, and a lingering filter needs an obvious out. */
export function searchField(opts: SearchFieldOpts): { wrap: HTMLElement; input: HTMLInputElement } {
  const wrap = document.createElement("div");
  wrap.className = "lmb-search-row";
  const glyph = document.createElement("span");
  glyph.className = "lmb-search-glyph";
  glyph.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "lmb-search-input";
  input.value = opts.value;
  if (opts.placeholder) input.placeholder = opts.placeholder;
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "lmb-search-clear";
  clear.textContent = "×";
  clear.title = "Clear search";
  clear.setAttribute("aria-label", "Clear search");
  const syncClear = () => { clear.style.visibility = input.value ? "visible" : "hidden"; };
  syncClear();
  input.addEventListener("input", () => {
    syncClear();
    opts.onChange(input.value);
  });
  clear.addEventListener("click", () => {
    input.value = "";
    syncClear();
    opts.onChange("");
    input.focus();
  });
  wrap.append(glyph, input, clear);
  return { wrap, input };
}

/** Scroll the pane that hosts `el` back to the top (used on tab/subtab switches). */
export function scrollPaneTop(el: HTMLElement): void {
  const sc = findScrollingAncestor(el);
  if (sc) sc.scrollTop = 0;
  else window.scrollTo(0, 0);
}

export function relativeTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function textNode(text: string, className?: string): HTMLElement {
  const el = document.createElement("div");
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

export function span(text: string, className?: string): HTMLSpanElement {
  const el = document.createElement("span");
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

export function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function findScrollingAncestor(el: HTMLElement | null): HTMLElement | null {
  let cur: HTMLElement | null = el?.parentElement ?? null;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const style = getComputedStyle(cur);
    const oy = style.overflowY;
    if (oy === "auto" || oy === "scroll") return cur;
    cur = cur.parentElement;
  }
  return null;
}

function collectScrollableDescendants(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;
  while (node) {
    if (node !== root && node instanceof HTMLElement) {
      const style = getComputedStyle(node);
      const oy = style.overflowY;
      if (oy === "auto" || oy === "scroll") out.push(node);
    }
    node = walker.nextNode();
  }
  return out;
}

export function preserveScroll(anchor: HTMLElement | null, fn: () => void): void {
  if (!anchor) { fn(); return; }
  const ancestor = findScrollingAncestor(anchor);
  const ancestorScroll = ancestor ? ancestor.scrollTop : 0;
  const innerBefore = collectScrollableDescendants(anchor).map((el) => el.scrollTop);
  fn();
  if (ancestor && ancestorScroll > 0) ancestor.scrollTop = ancestorScroll;
  const innerAfter = collectScrollableDescendants(anchor);
  if (innerAfter.length === innerBefore.length) {
    for (let i = 0; i < innerAfter.length; i++) {
      if (innerBefore[i]! > 0) innerAfter[i]!.scrollTop = innerBefore[i]!;
    }
  }
}

export const HIDDEN_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 4.22-5.42"/><path d="M22.54 16.88A10.94 10.94 0 0 0 23 12s-4-8-11-8a10.84 10.84 0 0 0-5.34 1.4"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
