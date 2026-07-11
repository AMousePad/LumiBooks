// src/ui/styles.ts
var STYLES = `
/* ---------------------------------------------------------------- tokens */
/* Toasts, modal overlays, and Lumiverse-hosted modal forms mount on
   document.body, outside .lmb-root - tokens are declared on each mount root. */
.lmb-root, .lmb-toast-stack, .lmb-preview-overlay, .lmb-modal-form {
  --lmb-display-font: "Marcellus", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  --lmb-body-font: "Josefin Sans", var(--lumiverse-font-family, -apple-system, "Segoe UI", sans-serif);
  --lmb-mono-font: var(--lumiverse-font-mono, ui-monospace, "Cascadia Mono", "Consolas", monospace);

  --lmb-ink: var(--lumiverse-text, rgba(255, 255, 255, 0.9));
  --lmb-ink-muted: var(--lumiverse-text-muted, rgba(255, 255, 255, 0.65));
  /* Dim/hint carry real content (meta, labels, empty states), so they must
     clear readable contrast; derived from the host ink so themes still flow
     through. The host's own text-dim (0.4a) fails WCAG for body-size text. */
  --lmb-ink-dim: rgba(255, 255, 255, 0.55);
  --lmb-ink-dim: color-mix(in srgb, var(--lumiverse-text, rgba(255, 255, 255, 0.9)) 62%, transparent);
  --lmb-ink-hint: rgba(255, 255, 255, 0.45);
  --lmb-ink-hint: color-mix(in srgb, var(--lumiverse-text, rgba(255, 255, 255, 0.9)) 50%, transparent);

  /* "Gold" of this deco theme: the host's luminous accent. */
  --lmb-gold: var(--lumiverse-primary-text, rgba(186, 135, 255, 0.95));
  --lmb-metal: var(--lumiverse-primary, rgba(147, 112, 219, 0.9));
  --lmb-metal-soft: var(--lumiverse-primary-muted, rgba(147, 112, 219, 0.6));
  --lmb-frame: var(--lumiverse-primary-020, rgba(147, 112, 219, 0.2));
  --lmb-frame-strong: var(--lumiverse-primary-050, rgba(147, 112, 219, 0.5));
  --lmb-frame-faint: var(--lumiverse-primary-010, rgba(147, 112, 219, 0.1));
  --lmb-wash: var(--lumiverse-primary-015, rgba(147, 112, 219, 0.15));
  --lmb-edge: var(--lumiverse-border-hover, rgba(147, 112, 219, 0.25));

  --lmb-void: var(--lumiverse-bg-deep, rgba(10, 8, 18, 1));
  --lmb-panel: var(--lumiverse-card-bg, linear-gradient(165deg, rgba(28, 24, 38, 1) 0%, rgba(24, 20, 34, 1) 50%, rgba(20, 17, 30, 1) 100%));
  --lmb-panel-solid: var(--lumiverse-card-bg-solid, rgb(24, 20, 34));
  --lmb-fill: var(--lumiverse-fill, rgba(0, 0, 0, 0.15));
  --lmb-fill-hover: var(--lumiverse-fill-hover, rgba(0, 0, 0, 0.2));
  --lmb-fill-strong: var(--lumiverse-fill-strong, rgba(0, 0, 0, 0.3));
  --lmb-hairline: var(--lumiverse-border-light, rgba(128, 128, 128, 0.12));
  --lmb-hairline-neutral: var(--lumiverse-border-neutral, rgba(128, 128, 128, 0.15));

  --lmb-danger: var(--lumiverse-danger, #ef4444);
  --lmb-danger-frame: var(--lumiverse-danger-050, rgba(239, 68, 68, 0.5));
  --lmb-danger-wash: var(--lumiverse-danger-015, rgba(239, 68, 68, 0.15));
  --lmb-success: var(--lumiverse-success, #22c55e);
  --lmb-success-frame: var(--lumiverse-success-050, rgba(34, 197, 94, 0.5));
  --lmb-success-wash: var(--lumiverse-success-015, rgba(34, 197, 94, 0.15));
  --lmb-warning: var(--lumiverse-warning, #f59e0b);
  --lmb-warning-frame: var(--lumiverse-warning-050, rgba(245, 158, 11, 0.5));
  --lmb-warning-wash: var(--lumiverse-warning-015, rgba(245, 158, 11, 0.15));
  /* Volumes get their own antique gold so amber stays exclusively "warning"
     - a shelf of volumes must not read as a shelf of problems. */
  --lmb-volume: #c9a86a;
  --lmb-volume-frame: rgba(201, 168, 106, 0.55);
  --lmb-volume-wash: rgba(201, 168, 106, 0.14);

  /* Rounding scale: softened deco. Large frames, controls, chips. */
  --lmb-r-lg: var(--lumiverse-radius, 8px);
  --lmb-r: var(--lumiverse-radius-sm, 5px);
  --lmb-r-sm: 3px;

  --lmb-glow: 0 0 16px var(--lumiverse-primary-015, rgba(147, 112, 219, 0.15));
  --lmb-glow-strong: 0 0 22px var(--lumiverse-primary-020, rgba(147, 112, 219, 0.2));
  --lmb-lift: var(--lumiverse-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.2));
  --lmb-sheen: var(--lumiverse-highlight-inset, inset 0 1px 0 rgba(255, 255, 255, 0.1));
  --lmb-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* ------------------------------------------------------------------ root */
.lmb-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 12px 30px;
  color: var(--lmb-ink);
  font-family: var(--lmb-body-font);
  font-size: 13px;
  line-height: 1.45;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  /* Marquee halo up top, diagonal crosshatch "etched glass" texture behind
     everything. Transparent base so the host drawer's own backdrop remains. */
  background-image:
    radial-gradient(130% 200px at 50% -30px, var(--lmb-wash), transparent 70%),
    repeating-linear-gradient(45deg, var(--lmb-frame-faint) 0 1px, transparent 1px 17px),
    repeating-linear-gradient(-45deg, var(--lmb-frame-faint) 0 1px, transparent 1px 17px);
  background-repeat: no-repeat, repeat, repeat;
}
.lmb-root *, .lmb-root *::before, .lmb-root *::after { box-sizing: border-box; }
.lmb-root ::selection { background: var(--lmb-frame-strong); color: #fff; }

/* ------------------------------------------------------------- tab strip */
.lmb-tabstrip {
  display: flex;
  gap: 0;
  padding: 3px;
  background: var(--lumiverse-bg-deep-080, rgba(20, 17, 28, 0.8));
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-lg);
  overflow-x: auto;
  scrollbar-width: none;
  box-shadow: var(--lmb-sheen);
}
.lmb-tabstrip::-webkit-scrollbar { display: none; }
.lmb-tab {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  color: var(--lmb-ink-dim);
  border: none;
  border-left: 1px solid var(--lmb-frame-faint);
  border-radius: calc(var(--lmb-r-lg) - 3px);
  padding: 9px 4px 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 300ms var(--lmb-ease), background 300ms var(--lmb-ease), text-shadow 300ms var(--lmb-ease);
}
.lmb-tab:first-child { border-left: none; }
.lmb-tab-icon {
  width: 17px;
  height: 17px;
  display: block;
  transition: transform 300ms var(--lmb-ease), filter 300ms var(--lmb-ease);
}
.lmb-tab-icon svg { width: 100%; height: 100%; display: block; }
.lmb-tab-label {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lmb-tab:hover { color: var(--lmb-ink); background: var(--lmb-frame-faint); }
.lmb-tab:hover .lmb-tab-icon {
  transform: translateY(-1px);
  filter: drop-shadow(0 0 6px var(--lmb-frame-strong));
}
.lmb-tab.active {
  color: var(--lmb-gold);
  background: linear-gradient(180deg, var(--lmb-wash), transparent 85%);
  text-shadow: 0 0 12px var(--lmb-frame-strong);
}
.lmb-tab.active .lmb-tab-icon { filter: drop-shadow(0 0 8px var(--lmb-frame-strong)); }
.lmb-tab.active::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 0;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, transparent, var(--lmb-metal) 30%, var(--lmb-metal) 70%, transparent);
  box-shadow: 0 0 8px var(--lmb-frame-strong);
}

.lmb-tab-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  counter-reset: lmb-section;
}

/* --------------------------------------------------------------- subtabs */
.lmb-subtabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  overflow-x: auto;
  scrollbar-width: none;
  flex: 0 0 auto;
}
.lmb-subtabs::-webkit-scrollbar { display: none; }
.lmb-subtab {
  flex: 1;
  background: transparent;
  border: none;
  border-radius: calc(var(--lmb-r) - 2px);
  color: var(--lmb-ink-dim);
  font-family: var(--lmb-body-font);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 9px 5px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 250ms var(--lmb-ease), background 250ms var(--lmb-ease), box-shadow 250ms var(--lmb-ease);
}
/* Right-edge fade when the strip actually overflows (class set from JS),
   so hidden subtabs announce themselves. */
.lmb-subtabs.scrollable {
  -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 26px), transparent);
  mask-image: linear-gradient(90deg, #000 calc(100% - 26px), transparent);
}
.lmb-subtab:hover { color: var(--lmb-ink); background: var(--lmb-frame-faint); }
.lmb-subtab.active {
  color: var(--lmb-gold);
  background: var(--lmb-wash);
  box-shadow: inset 0 -1px 0 var(--lmb-metal), 0 0 10px var(--lmb-frame-faint);
}

.lmb-pane { display: flex; flex-direction: column; gap: 14px; }

/* Compact profile context strip shown on Tuning subtabs that aren't Profile:
   the full picker block would otherwise repeat above every pane. */
.lmb-profile-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  font-size: 11px;
  color: var(--lmb-ink-dim);
}
.lmb-profile-strip b {
  color: var(--lmb-ink);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------------------------------------------------------- section card */
.lmb-section {
  position: relative;
  background: var(--lmb-panel);
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-lg);
  padding: 15px 14px 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--lmb-sheen);
  transition: border-color 300ms var(--lmb-ease), box-shadow 500ms var(--lmb-ease);
}
.lmb-section:hover { border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-sheen), var(--lmb-glow); }
/* Corner brackets: top-left and bottom-right L-frames, drawn as four
   background hairlines on one pseudo-element. */
.lmb-section::before {
  content: "";
  position: absolute;
  inset: 4px;
  pointer-events: none;
  border-radius: calc(var(--lmb-r-lg) - 3px);
  background-image:
    linear-gradient(var(--lmb-metal-soft), var(--lmb-metal-soft)),
    linear-gradient(var(--lmb-metal-soft), var(--lmb-metal-soft)),
    linear-gradient(var(--lmb-metal-soft), var(--lmb-metal-soft)),
    linear-gradient(var(--lmb-metal-soft), var(--lmb-metal-soft));
  background-position: left top, left top, right bottom, right bottom;
  background-size: 16px 1px, 1px 16px, 16px 1px, 1px 16px;
  background-repeat: no-repeat;
  opacity: 0.5;
  transition: opacity 300ms var(--lmb-ease);
}
.lmb-section:hover::before { opacity: 1; }
/* Roman-numeral plaque seated on the top frame line. */
.lmb-tab-content .lmb-section { counter-increment: lmb-section; }
.lmb-tab-content .lmb-section::after {
  content: counter(lmb-section, upper-roman);
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -55%);
  padding: 2px 7px 1px 10px;
  background: var(--lmb-void);
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-gold);
  font-family: var(--lmb-display-font);
  font-size: 9.5px;
  line-height: 13px;
  letter-spacing: 0.24em;
  pointer-events: none;
}

/* Section heading: centered, tracked caps, flanked by fading rules. */
.lmb-section > .lmb-section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: var(--lmb-display-font);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  text-align: center;
  color: var(--lmb-gold);
}
.lmb-section > .lmb-section-title::before,
.lmb-section > .lmb-section-title::after {
  content: "";
  flex: 1 1 12px;
  min-width: 8px;
  height: 1px;
}
.lmb-section > .lmb-section-title::before { background: linear-gradient(90deg, transparent, var(--lmb-frame-strong)); }
.lmb-section > .lmb-section-title::after { background: linear-gradient(90deg, var(--lmb-frame-strong), transparent); }

/* Sub-headings inside a section body (entry group labels etc.). */
.lmb-collapsible-body .lmb-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--lmb-display-font);
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
}
.lmb-collapsible-body .lmb-section-title::before {
  content: "◆";
  font-size: 6px;
  color: var(--lmb-metal-soft);
}
.lmb-collapsible-body .lmb-section-title::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--lmb-frame), transparent);
}

.lmb-collapsible-body { display: flex; flex-direction: column; gap: 10px; }

.lmb-subgroup {
  position: relative;
  border-left: 1px solid var(--lmb-frame);
  padding-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 4px;
}
.lmb-subgroup::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 0;
  width: 1px;
  height: 16px;
  background: var(--lmb-metal);
}
.lmb-subgroup-title {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
}

/* ------------------------------------------------------------ status text */
.lmb-status-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 5px 14px;
  font-size: 12px;
}
.lmb-status-grid > .lmb-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
  padding-top: 3px;
}
.lmb-status-grid > .lmb-value { font-weight: 500; color: var(--lmb-ink); overflow-wrap: anywhere; }

.lmb-help { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.55; }
.lmb-field-hint { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.5; }
.lmb-empty { font-size: 11.5px; font-style: italic; color: var(--lmb-ink-hint); padding: 4px 0; }
.lmb-empty::before { content: "◇"; font-style: normal; margin-right: 7px; color: var(--lmb-frame-strong); }
.lmb-about-hero { display: flex; gap: 12px; align-items: center; }
.lmb-about-hero img { width: 64px; height: 64px; object-fit: cover; border: 1px solid var(--lmb-frame-strong); border-radius: var(--lmb-r); padding: 3px; background: var(--lmb-fill-strong); }
.lmb-about-line { font-size: 12px; color: var(--lmb-ink-muted); line-height: 1.6; }
.lmb-hero-title {
  font-family: var(--lmb-display-font);
  font-size: 14px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lmb-gold);
  text-shadow: 0 0 12px var(--lmb-frame-strong);
  margin-bottom: 3px;
}

/* ------------------------------------------------------------ stat tiles */
.lmb-tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.lmb-tile {
  position: relative;
  overflow: hidden;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 10px 11px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: border-color 300ms var(--lmb-ease), box-shadow 400ms var(--lmb-ease);
}
.lmb-tile::before {
  content: "";
  position: absolute;
  top: 0;
  left: 8%;
  width: 34%;
  height: 1px;
  background: linear-gradient(90deg, var(--lmb-metal-soft), transparent);
}
.lmb-tile:hover { border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-glow); }
.lmb-tile-value {
  font-family: var(--lmb-display-font);
  font-size: 17px;
  line-height: 1.15;
  letter-spacing: 0.04em;
  color: var(--lmb-gold);
}
.lmb-tile-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
.lmb-tile-sub { font-size: 10.5px; color: var(--lmb-ink-dim); }

/* Story Bible tiles: clickable record cards that cycle inject/freeze state. */
.lmb-bible-tile { cursor: pointer; user-select: none; }
.lmb-bible-tile:hover { border-color: var(--lmb-frame-strong); }
.lmb-tile-state {
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: var(--lmb-ink-dim);
  margin-top: 1px;
}
.lmb-bible-tile.noInject .lmb-tile-value { color: var(--lmb-ink-dim); }
.lmb-bible-tile.noInject { border-style: dashed; }
.lmb-bible-tile.frozen {
  border-style: dashed;
  opacity: 0.7;
  background:
    repeating-linear-gradient(45deg, rgba(128, 128, 128, 0.06) 0 4px, transparent 4px 9px),
    var(--lmb-fill);
}
.lmb-bible-tile.frozen .lmb-tile-value { color: var(--lmb-ink-dim); }
.lmb-bible-tile.stale { border-color: var(--lmb-warning-frame); }
.lmb-bible-tile.stale .lmb-tile-state { color: var(--lmb-warning); }
.lmb-tile-tools { margin-top: 5px; display: flex; gap: 5px; }

/* --------------------------------------------------------- coverage spine */
.lmb-spine {
  display: flex;
  height: 16px;
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r-sm);
  overflow: hidden;
  background: var(--lmb-fill-strong);
}
.lmb-spine-seg { min-width: 2px; transition: filter 200ms var(--lmb-ease); }
.lmb-spine-seg:hover { filter: brightness(1.5); }
/* Champagne cream: the codex block, distinct from every tier color. */
.lmb-spine-seg.codex { background: rgba(242, 240, 228, 0.45); }
.lmb-spine-seg.volume { background: var(--lmb-volume-frame); }
.lmb-spine-seg.arc { background: var(--lmb-frame-strong); }
.lmb-spine-seg.volume, .lmb-spine-seg.arc, .lmb-spine-seg.chapter, .lmb-spine-seg.ghost { cursor: pointer; }
.lmb-spine-seg.chapter { background: var(--lmb-frame); }
.lmb-spine-seg.ghost {
  background: repeating-linear-gradient(45deg, var(--lmb-frame-strong) 0 3px, transparent 3px 6px);
}
.lmb-spine-seg.excluded {
  background: repeating-linear-gradient(-45deg, rgba(128, 128, 128, 0.35) 0 2px, transparent 2px 5px);
}
.lmb-spine-seg.free { background: transparent; }
.lmb-spine-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
.lmb-spine-key { display: inline-flex; align-items: center; gap: 5px; }
.lmb-spine-swatch {
  width: 11px;
  height: 11px;
  border: 1px solid var(--lmb-hairline);
  border-radius: 2px;
  background: var(--lmb-fill-strong);
  display: inline-block;
}
.lmb-spine-swatch.codex { background: rgba(242, 240, 228, 0.45); }
.lmb-spine-swatch.volume { background: var(--lmb-volume-frame); }
.lmb-spine-swatch.arc { background: var(--lmb-frame-strong); }
.lmb-spine-swatch.chapter { background: var(--lmb-frame); }
.lmb-spine-swatch.ghost { background: repeating-linear-gradient(45deg, var(--lmb-frame-strong) 0 2px, transparent 2px 4px); }
.lmb-spine-swatch.excluded { background: repeating-linear-gradient(-45deg, rgba(128, 128, 128, 0.35) 0 2px, transparent 2px 4px); }

/* Prompt itemization under the spine: what Memoria's story context costs. */
.lmb-breakdown { display: flex; flex-direction: column; gap: 3px; }
.lmb-breakdown-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--lmb-ink-muted);
}
.lmb-breakdown-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lmb-breakdown-tokens {
  font-weight: 600;
  color: var(--lmb-ink);
  font-variant-numeric: tabular-nums;
}
.lmb-breakdown-row.total {
  margin-top: 3px;
  padding-top: 5px;
  border-top: 1px solid var(--lmb-hairline);
  color: var(--lmb-ink);
}
.lmb-breakdown-row.total .lmb-breakdown-tokens { color: var(--lmb-gold); }
.lmb-breakdown-row.total .lmb-spine-swatch { visibility: hidden; }
.lmb-breakdown-click {
  background: transparent;
  border: none;
  padding: 2px 0;
  font: inherit;
  cursor: pointer;
  text-align: left;
  width: 100%;
  border-radius: var(--lmb-r-sm);
  transition: background 200ms var(--lmb-ease);
}
.lmb-breakdown-click:hover { background: var(--lmb-frame-faint); color: var(--lmb-ink); }
.lmb-breakdown-row.sub {
  font-size: 10.5px;
  color: var(--lmb-ink-dim);
  padding-left: 10px;
}

/* --------------------------------------------------------------- buttons */
.lmb-actions { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
.lmb-spacer { flex: 1; }

.lmb-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  overflow: hidden;
  background: transparent;
  color: var(--lmb-ink-muted);
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r);
  padding: 8px 14px 6px;
  font-family: var(--lmb-body-font);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 300ms var(--lmb-ease), background 300ms var(--lmb-ease),
    border-color 300ms var(--lmb-ease), box-shadow 450ms var(--lmb-ease), transform 200ms var(--lmb-ease);
}
/* Metallic sheen sweep on hover. */
.lmb-btn::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -130%;
  width: 60%;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.22), transparent);
  transform: skewX(-20deg);
  pointer-events: none;
}
.lmb-btn:hover:not(:disabled)::before { left: 170%; transition: left 550ms var(--lmb-ease); }
.lmb-btn:hover:not(:disabled) {
  color: var(--lmb-gold);
  border-color: var(--lmb-frame-strong);
  background: var(--lmb-frame-faint);
  box-shadow: var(--lmb-glow);
}
.lmb-btn:active:not(:disabled) { transform: translateY(1px); }
/* Disabled must stay readable: desaturate and dim, but keep the label legible
   so the user can still see WHAT is unavailable. */
.lmb-btn:disabled { opacity: 0.55; filter: saturate(0.4); cursor: not-allowed; }
.lmb-btn.primary {
  color: var(--lmb-gold);
  border-color: var(--lmb-frame-strong);
  background: linear-gradient(180deg, var(--lmb-wash), transparent);
}
.lmb-btn.primary:hover:not(:disabled) {
  background: var(--lmb-metal);
  border-color: var(--lmb-metal);
  color: var(--lmb-void);
  box-shadow: var(--lmb-glow-strong);
}
.lmb-btn.danger { color: var(--lmb-danger); border-color: var(--lmb-danger-frame); }
.lmb-btn.danger:hover:not(:disabled) {
  color: var(--lmb-danger);
  background: var(--lmb-danger-wash);
  border-color: var(--lmb-danger);
  box-shadow: 0 0 14px var(--lumiverse-danger-020, rgba(239, 68, 68, 0.2));
}
.lmb-btn.small { padding: 5px 9px 4px; font-size: 10px; letter-spacing: 0.1em; }
.lmb-btn.active {
  background: var(--lmb-metal);
  border-color: var(--lmb-metal);
  color: var(--lmb-void);
  box-shadow: var(--lmb-glow-strong);
}
.lmb-btn.active:hover:not(:disabled) { background: var(--lmb-metal); color: var(--lmb-void); filter: brightness(1.1); }

/* ---------------------------------------------------------------- fields */
.lmb-field { display: flex; flex-direction: column; gap: 4px; }
.lmb-field-row { display: flex; align-items: center; gap: 8px; }
.lmb-grow { flex: 1; min-width: 0; }
.lmb-field-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}

/* Search field: a visible container so an active filter can't masquerade as
   floating text, with a magnifier and a clear affordance. */
.lmb-search-row {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  min-width: 0;
  background-color: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline-neutral);
  border-radius: var(--lmb-r);
  padding: 0 2px 0 10px;
  transition: border-color 300ms var(--lmb-ease), box-shadow 300ms var(--lmb-ease);
}
.lmb-search-row:focus-within {
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow);
}
.lmb-search-glyph { color: var(--lmb-ink-dim); display: inline-flex; flex: 0 0 auto; }
.lmb-search-glyph svg { display: block; }
.lmb-search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--lmb-ink);
  font-family: var(--lmb-body-font);
  font-size: 12.5px;
  padding: 7px 0 6px;
}
.lmb-search-input::placeholder { color: var(--lmb-ink-hint); }
.lmb-search-clear {
  background: transparent;
  border: none;
  color: var(--lmb-ink-dim);
  font-size: 15px;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
  transition: color 200ms var(--lmb-ease);
}
.lmb-search-clear:hover { color: var(--lmb-gold); }
.lmb-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.lmb-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; }

/* Inputs: underline elegance - transparent field, luminous baseline. */
.lmb-input {
  width: 100%;
  background-color: var(--lmb-fill);
  color: var(--lmb-ink);
  border: 1px solid transparent;
  border-bottom-color: var(--lmb-edge);
  border-radius: var(--lmb-r) var(--lmb-r) var(--lmb-r-sm) var(--lmb-r-sm);
  padding: 7px 9px 6px;
  font-family: var(--lmb-body-font);
  font-size: 12.5px;
  outline: none;
  transition: border-color 300ms var(--lmb-ease), background-color 300ms var(--lmb-ease), box-shadow 300ms var(--lmb-ease);
}
.lmb-input:hover:not(:disabled):not(:focus) { border-bottom-color: var(--lmb-frame-strong); }
.lmb-input:focus {
  border-bottom-color: var(--lmb-gold);
  background-color: var(--lmb-fill-hover);
  box-shadow: 0 8px 16px -10px var(--lmb-frame-strong);
}
.lmb-input::placeholder { color: var(--lmb-ink-hint); }
.lmb-input:disabled { opacity: 0.45; cursor: not-allowed; }
input.lmb-input[type="number"]::-webkit-inner-spin-button { opacity: 0.6; }

.lmb-textarea {
  resize: vertical;
  min-height: 84px;
  line-height: 1.5;
  font-family: var(--lmb-mono-font);
  font-size: 11.5px;
  background-color: var(--lmb-fill-strong);
  border-color: var(--lmb-hairline);
  border-bottom-color: var(--lmb-edge);
}

.lmb-select {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  padding-right: 26px;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--lmb-gold) 50%),
    linear-gradient(135deg, var(--lmb-gold) 50%, transparent 50%);
  background-position: calc(100% - 14px) 55%, calc(100% - 9px) 55%;
  background-size: 5px 5px;
  background-repeat: no-repeat;
  text-overflow: ellipsis;
}
.lmb-select option { background: var(--lmb-panel-solid); color: var(--lmb-ink); }

/* Checkboxes: engraved square, gem-cut diamond fill when checked. */
.lmb-root input[type="checkbox"],
.lmb-preview-overlay input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  margin: 0;
  flex: 0 0 auto;
  position: relative;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-sm);
  cursor: pointer;
  transition: border-color 300ms var(--lmb-ease), box-shadow 300ms var(--lmb-ease);
}
.lmb-root input[type="checkbox"]::after,
.lmb-preview-overlay input[type="checkbox"]::after {
  content: "";
  position: absolute;
  inset: 3px;
  background: linear-gradient(135deg, var(--lmb-gold), var(--lmb-metal));
  transform: rotate(45deg) scale(0);
  transition: transform 300ms var(--lmb-ease);
}
.lmb-root input[type="checkbox"]:hover:not(:disabled),
.lmb-preview-overlay input[type="checkbox"]:hover:not(:disabled) { border-color: var(--lmb-gold); }
.lmb-root input[type="checkbox"]:checked,
.lmb-preview-overlay input[type="checkbox"]:checked {
  border-color: var(--lmb-gold);
  box-shadow: 0 0 10px var(--lmb-frame);
}
.lmb-root input[type="checkbox"]:checked::after,
.lmb-preview-overlay input[type="checkbox"]:checked::after { transform: rotate(45deg) scale(1); }
.lmb-root input[type="checkbox"]:disabled { opacity: 0.3; cursor: default; }

.lmb-check { display: flex; gap: 9px; align-items: flex-start; cursor: pointer; font-size: 12px; user-select: none; }
.lmb-check input { margin-top: 2px; }
.lmb-check-body { display: flex; flex-direction: column; gap: 3px; }
.lmb-check-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink);
  padding-top: 2px;
}
.lmb-check-hint { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.45; }

.lmb-multiselect {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 170px;
  overflow-y: auto;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 5px 7px;
}
.lmb-multiselect-row {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  padding: 3px 4px;
  border-radius: var(--lmb-r-sm);
  transition: background 200ms var(--lmb-ease);
}
.lmb-multiselect-row:hover { background: var(--lmb-frame-faint); }

/* ------------------------------------------------------------------ pills */
/* Pills are STATUS, not controls: no border-box (that's the button costume),
   a status diamond instead, and sentence case so they read at a glance. */
.lmb-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 3px 8px;
  background: var(--lmb-fill);
  border: none;
  border-radius: var(--lmb-r-sm);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--lmb-ink-muted);
}
.lmb-pill::before {
  content: "◆";
  font-size: 6.5px;
  flex: 0 0 auto;
  color: var(--lmb-metal-soft);
}
.lmb-pill.ok { color: var(--lmb-success); background: var(--lmb-success-wash); }
.lmb-pill.ok::before { color: var(--lmb-success); }
.lmb-pill.warn { color: var(--lmb-warning); background: var(--lmb-warning-wash); }
.lmb-pill.warn::before { color: var(--lmb-warning); }
.lmb-pill.danger { color: var(--lmb-danger); background: var(--lmb-danger-wash); }
.lmb-pill.danger::before { color: var(--lmb-danger); }

/* ------------------------------------------------------- busy + failures */
.lmb-busy {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--lmb-gold);
  font-size: 11.5px;
  padding: 3px 0;
}
.lmb-busy-dot {
  width: 8px;
  height: 8px;
  border-radius: 0;
  border: 1px solid var(--lmb-gold);
  background: var(--lmb-frame);
  flex: 0 0 auto;
  animation: lmb-facet 1.6s var(--lmb-ease) infinite;
}
@keyframes lmb-facet {
  0% { transform: rotate(45deg) scale(0.7); box-shadow: 0 0 3px var(--lmb-frame); opacity: 0.6; }
  50% { transform: rotate(135deg) scale(1); box-shadow: 0 0 12px var(--lmb-frame-strong); opacity: 1; }
  100% { transform: rotate(225deg) scale(0.7); box-shadow: 0 0 3px var(--lmb-frame); opacity: 0.6; }
}

/* Live stream viewer: Memoria's raw output as it arrives. */
.lmb-stream-panel {
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-gold);
  border-radius: var(--lmb-r);
  background: var(--lmb-frame-faint);
  margin: 2px 0 6px;
  overflow: hidden;
}
.lmb-stream-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--lmb-hairline);
}
.lmb-stream-title {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
.lmb-stream-status {
  margin-left: auto;
  font-size: 10px;
  color: var(--lmb-ink-hint);
  letter-spacing: 0.06em;
}
.lmb-stream-panel.done .lmb-busy-dot { animation: none; opacity: 0.4; }
.lmb-stream-close {
  background: transparent;
  border: none;
  color: var(--lmb-ink-dim);
  font-size: 13px;
  line-height: 1;
  padding: 2px 4px;
  cursor: pointer;
  border-radius: var(--lmb-r-sm);
}
.lmb-stream-close:hover { color: var(--lmb-ink); background: var(--lmb-frame); }
.lmb-stream-body {
  max-height: 280px;
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lmb-stream-think {
  font-size: 11px;
  font-style: italic;
  color: var(--lmb-ink-hint);
  white-space: pre-wrap;
  word-break: break-word;
  border-left: 2px solid var(--lmb-hairline);
  padding-left: 8px;
}
.lmb-stream-text {
  font-family: var(--lmb-mono-font);
  font-size: 11px;
  line-height: 1.55;
  color: var(--lmb-ink);
  white-space: pre-wrap;
  word-break: break-word;
}
.lmb-stream-empty { font-size: 11px; color: var(--lmb-ink-hint); font-style: italic; }

.lmb-failure {
  background: var(--lmb-danger-wash);
  border: 1px solid var(--lmb-danger-frame);
  border-left: 2px solid var(--lmb-danger);
  border-radius: var(--lmb-r);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  box-shadow: 0 0 14px var(--lumiverse-danger-015, rgba(239, 68, 68, 0.15));
}

.lmb-preview-card {
  position: relative;
  background: linear-gradient(180deg, var(--lmb-frame-faint), transparent 60%);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: var(--lmb-glow);
}

/* ----------------------------------------------------------- entry cards */
.lmb-entry-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.lmb-entry {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 11px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-hairline-neutral);
  border-radius: var(--lmb-r);
  transition: background 300ms var(--lmb-ease), border-color 300ms var(--lmb-ease),
    box-shadow 400ms var(--lmb-ease), opacity 300ms var(--lmb-ease);
}
.lmb-entry:hover { background: var(--lmb-fill-hover); box-shadow: var(--lmb-glow); }
.lmb-entry.arc { border-left-color: var(--lmb-metal); }
.lmb-entry.volume { border-left-color: var(--lmb-volume); }
.lmb-entry.root { border-left-color: var(--lmb-metal-soft); opacity: 0.75; }
.lmb-entry.superseded { opacity: 0.5; filter: saturate(0.6); }
.lmb-entry.compact { padding: 0; overflow: hidden; }
.lmb-entry.expanded { border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-glow); }
.lmb-entry-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 200ms var(--lmb-ease);
}
.lmb-entry-row:hover { background: var(--lmb-frame-faint); }
.lmb-entry-right {
  font-size: 10.5px;
  color: var(--lmb-ink-dim);
  white-space: nowrap;
  flex: 0 0 auto;
}
.lmb-chevron {
  width: 7px;
  height: 7px;
  border-right: 1px solid var(--lmb-ink-dim);
  border-bottom: 1px solid var(--lmb-ink-dim);
  transform: rotate(-45deg);
  transition: transform 300ms var(--lmb-ease);
  flex: 0 0 auto;
  margin: 0 2px 2px 2px;
}
.lmb-chevron.open { transform: rotate(45deg); margin-bottom: 4px; }
.lmb-entry-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 10px;
  border-top: 1px solid var(--lmb-hairline);
}
.lmb-entry-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lmb-entry-title {
  flex: 1 1 120px;
  min-width: 0;
  font-weight: 600;
  font-size: 12px;
  color: var(--lmb-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lmb-entry-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; }
.lmb-entry-tag {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 6px 2px;
  border: 1px solid var(--lmb-hairline-neutral);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-ink-dim);
  background: transparent;
  flex: 0 0 auto;
}
.lmb-entry-tag.arc { color: var(--lmb-gold); border-color: var(--lmb-frame-strong); background: var(--lmb-frame-faint); }
.lmb-entry-tag.volume { color: var(--lmb-volume); border-color: var(--lmb-volume-frame); background: var(--lmb-volume-wash); }
.lmb-entry-tag.ghost { border-style: dashed; color: var(--lmb-metal-soft); border-color: var(--lmb-frame-strong); }
.lmb-entry-meta {
  font-size: 11px;
  color: var(--lmb-ink-dim);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.lmb-entry-preview {
  font-size: 11.5px;
  color: var(--lmb-ink-muted);
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  white-space: pre-wrap;
}
.lmb-entry-comment { font-size: 11px; font-style: italic; color: var(--lmb-metal-soft); }

/* --------------------------------------------------------- message picker */
.lmb-message-filter-row { display: flex; gap: 6px; align-items: center; margin-bottom: 4px; }
.lmb-message-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 360px;
  overflow-y: auto;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 4px;
}
.lmb-message-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 5px 6px;
  border-radius: var(--lmb-r-sm);
  cursor: pointer;
  font-size: 12px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  transition: background 200ms var(--lmb-ease), box-shadow 200ms var(--lmb-ease);
}
.lmb-message-row:hover { background: var(--lmb-frame-faint); }
.lmb-message-row.selected { background: var(--lmb-wash); box-shadow: inset 2px 0 0 var(--lmb-metal); }
/* Covered = already filed, which is information, not disablement: keep it
   readable and let the check glyph carry the meaning. */
.lmb-message-row.covered { opacity: 0.55; }
.lmb-message-row.excluded .lmb-msg-preview { text-decoration: line-through; opacity: 0.6; }
.lmb-message-row input { margin-top: 2px; }
.lmb-msg-excluded-badge { opacity: 0.85; font-weight: 600; color: var(--lmb-warning); }
.lmb-msg-filed { color: var(--lmb-success); font-size: 10px; font-weight: 600; }
.lmb-msg-role {
  font-family: var(--lmb-mono-font);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--lmb-ink-dim);
  min-width: 36px;
  padding-top: 3px;
}
.lmb-msg-preview { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-top: 1px; }
.lmb-msg-icons { display: flex; gap: 4px; align-items: center; opacity: 0.7; padding-top: 2px; }
.lmb-picker-more { justify-content: center; padding: 3px 0; }

/* ----------------------------------------------------------- codex: chips */
.lmb-chipgrid { display: flex; flex-wrap: wrap; gap: 6px; }
.lmb-chip {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r);
  color: var(--lmb-ink-muted);
  font-family: var(--lmb-body-font);
  font-size: 11px;
  padding: 5px 10px 4px;
  cursor: pointer;
  transition: color 250ms var(--lmb-ease), border-color 250ms var(--lmb-ease),
    background 250ms var(--lmb-ease), box-shadow 350ms var(--lmb-ease);
}
.lmb-chip:hover { color: var(--lmb-gold); border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-glow); }
.lmb-chip.active {
  color: var(--lmb-gold);
  background: var(--lmb-wash);
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow);
}
.lmb-chip.add { border-style: dashed; background: transparent; color: var(--lmb-ink-dim); }
.lmb-chip.add:hover { color: var(--lmb-gold); }
.lmb-add-form { display: flex; gap: 6px; align-items: center; }
.lmb-add-form input { flex: 1; min-width: 0; }

/* ---------------------------------------------------- codex: entity cards */
.lmb-entity-card {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  padding: 11px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: var(--lmb-glow);
}
.lmb-entity-card.editing { border-style: dashed; }
.lmb-entity-name {
  font-family: var(--lmb-display-font);
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--lmb-gold);
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.lmb-entity-id {
  font-family: var(--lmb-mono-font);
  font-size: 9.5px;
  letter-spacing: 0.03em;
  color: var(--lmb-ink-dim);
}
.lmb-kv {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  font-size: 11.5px;
}
.lmb-kv-key {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
  padding-top: 2px;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lmb-kv-value { color: var(--lmb-ink-muted); line-height: 1.45; overflow-wrap: anywhere; }
.lmb-entity-form { display: flex; flex-direction: column; gap: 8px; }

/* Shared record-row affordances: heads toggle expansion like Threads. */
.lmb-record-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}
.lmb-record-click {
  cursor: pointer;
  border-radius: var(--lmb-r-sm);
  transition: background 200ms var(--lmb-ease);
}
.lmb-record-click:hover { background: var(--lmb-frame-faint); }

/* ------------------------------------------------------- codex: relations */
.lmb-relation-list { display: flex; flex-direction: column; gap: 6px; }
.lmb-relation {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.lmb-relation-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%; }
.lmb-relation-names {
  font-weight: 600;
  font-size: 12px;
  color: var(--lmb-ink);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.lmb-relation-arrow { color: var(--lmb-gold); font-size: 11px; }
.lmb-relation-state { font-size: 11.5px; color: var(--lmb-ink-muted); line-height: 1.45; }
.lmb-history {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: var(--lmb-ink-dim);
  line-height: 1.55;
}

/* --------------------------------------------------- codex: relation graph */
.lmb-graph-wrap { position: relative; }
.lmb-graph {
  width: 100%;
  height: auto;
  display: block;
  background:
    radial-gradient(90% 70% at 50% 40%, var(--lmb-frame-faint), transparent 75%),
    var(--lmb-fill-strong);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  touch-action: none;
}
.lmb-graph-edge {
  stroke: var(--lmb-frame-strong);
  stroke-width: 1;
  fill: none;
  pointer-events: none;
  transition: stroke 200ms var(--lmb-ease), stroke-width 200ms var(--lmb-ease);
}
/* Fat invisible twin path carries the pointer events: 1px lines are not
   clickable targets, especially on touch. */
.lmb-graph-hit {
  stroke: transparent;
  stroke-width: 12;
  fill: none;
  cursor: pointer;
}
.lmb-graph-edgeg:hover .lmb-graph-edge,
.lmb-graph-edgeg.selected .lmb-graph-edge { stroke: var(--lmb-gold); stroke-width: 1.6; }
.lmb-graph-edge.group { stroke: var(--lmb-frame); stroke-dasharray: 3 3; }
.lmb-graph-detail {
  min-height: 18px;
  font-size: 11.5px;
  color: var(--lmb-ink-muted);
  line-height: 1.45;
}
.lmb-graph-detail b { color: var(--lmb-gold); font-weight: 600; }
.lmb-graph-arrow { fill: var(--lmb-metal-soft); }
.lmb-graph-node { cursor: pointer; }
.lmb-graph-node rect {
  stroke-width: 1;
  transition: filter 200ms var(--lmb-ease);
}
.lmb-graph-node:hover rect { filter: drop-shadow(0 0 7px var(--lmb-frame-strong)); }
.lmb-graph-node text {
  fill: var(--lmb-ink-muted);
  font-family: var(--lmb-body-font);
  font-size: 9.5px;
  letter-spacing: 0.04em;
  pointer-events: none;
  user-select: none;
}
.lmb-graph-node.char rect { fill: var(--lumiverse-primary-020, rgba(147, 112, 219, 0.2)); stroke: var(--lmb-metal); }
.lmb-graph-node.loc rect { fill: var(--lmb-volume-wash); stroke: var(--lmb-volume); }
.lmb-graph-node.thing rect { fill: rgba(128, 128, 128, 0.15); stroke: var(--lumiverse-border-neutral-hover, rgba(128, 128, 128, 0.25)); }
.lmb-graph-node.other rect { fill: var(--lmb-fill); stroke: var(--lmb-hairline-neutral); }
.lmb-graph-swatch {
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  border-radius: 1.5px;
  display: inline-block;
  border: 1px solid var(--lmb-hairline);
}
.lmb-graph-swatch.char { background: var(--lumiverse-primary-020, rgba(147, 112, 219, 0.2)); border-color: var(--lmb-metal); }
.lmb-graph-swatch.loc { background: var(--lmb-volume-wash); border-color: var(--lmb-volume); }
.lmb-graph-swatch.thing { background: rgba(128, 128, 128, 0.15); border-color: var(--lumiverse-border-neutral-hover, rgba(128, 128, 128, 0.25)); }

/* -------------------------------------------------------- codex: timeline */
.lmb-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding-left: 17px;
}
.lmb-timeline::before {
  content: "";
  position: absolute;
  left: 3px;
  top: 5px;
  bottom: 5px;
  width: 1px;
  background: linear-gradient(180deg, var(--lmb-frame-strong), var(--lmb-frame));
}
.lmb-timeline-item { position: relative; display: flex; flex-direction: column; gap: 2px; }
.lmb-timeline-item::before {
  content: "";
  position: absolute;
  left: -17px;
  top: 4px;
  width: 6px;
  height: 6px;
  background: var(--lmb-metal);
  transform: rotate(45deg);
  box-shadow: 0 0 6px var(--lmb-frame-strong);
}
.lmb-timeline-when {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-timeline-event { font-size: 12px; color: var(--lmb-ink); line-height: 1.45; }
.lmb-timeline-detail { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.45; }

/* --------------------------------------------------------- codex: threads */
.lmb-thread-list { display: flex; flex-direction: column; gap: 6px; }
.lmb-thread {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lmb-thread-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}
.lmb-thread-name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 12px;
  color: var(--lmb-ink);
}
.lmb-thread-summary { font-size: 11.5px; color: var(--lmb-ink-muted); line-height: 1.45; }
.lmb-thread-detail { font-size: 11px; color: var(--lmb-ink-dim); line-height: 1.5; }

/* ------------------------------------------------------------ codex: lore */
.lmb-lore-topic {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-left: 2px solid var(--lmb-frame-strong);
  padding-left: 10px;
}
.lmb-lore-title {
  font-family: var(--lmb-display-font);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-lore-facts {
  margin: 0;
  padding-left: 16px;
  font-size: 11.5px;
  color: var(--lmb-ink-muted);
  line-height: 1.55;
}
.lmb-secret {
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lmb-secret-fact { font-size: 12px; font-weight: 600; color: var(--lmb-ink); line-height: 1.45; }

/* -------------------------------------------------------------- preset text */
.lmb-preset-text {
  background: var(--lmb-fill-strong);
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r);
  padding: 9px 10px;
  font-family: var(--lmb-mono-font);
  font-size: 11px;
  white-space: pre-wrap;
  max-height: 280px;
  overflow-y: auto;
  line-height: 1.5;
  color: var(--lmb-ink-muted);
}

.lmb-greyed { opacity: 0.35; pointer-events: none; filter: saturate(0.5); }

/* ---------------------------------------------------------------- toasts */
.lmb-toast-stack {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  z-index: 10010;
  pointer-events: none;
  font-family: var(--lmb-body-font);
}
.lmb-toast {
  position: relative;
  background: var(--lcs-glass-bg, rgba(18, 16, 28, 0.55));
  backdrop-filter: blur(var(--lcs-glass-blur, 8px));
  -webkit-backdrop-filter: blur(var(--lcs-glass-blur, 8px));
  color: var(--lmb-ink);
  border: 1px solid var(--lmb-frame);
  border-left: 3px solid var(--lmb-metal);
  border-radius: var(--lmb-r);
  padding: 9px 13px 8px;
  font-size: 12px;
  line-height: 1.45;
  max-width: 340px;
  box-shadow: var(--lumiverse-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.4)), var(--lmb-glow);
  pointer-events: auto;
  animation: lmb-toast-in 350ms var(--lmb-ease);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
@keyframes lmb-toast-in {
  from { opacity: 0; transform: translateX(14px); }
  to { opacity: 1; transform: translateX(0); }
}
.lmb-toast-leaving { opacity: 0; transform: translateY(4px); }
.lmb-toast-success { border-left-color: var(--lmb-success); box-shadow: var(--lumiverse-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.4)), 0 0 14px var(--lmb-success-wash); }
.lmb-toast-info { border-left-color: var(--lmb-metal); }
.lmb-toast-warn { border-left-color: var(--lmb-warning); box-shadow: var(--lumiverse-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.4)), 0 0 14px var(--lmb-warning-wash); }
.lmb-toast-error { border-left-color: var(--lmb-danger); box-shadow: var(--lumiverse-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.4)), 0 0 14px var(--lmb-danger-wash); }

/* ------------------------------------------------- host-modal form pieces */
.lmb-modal-form {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 10px 14px 14px;
  font-family: var(--lmb-body-font);
}
.lmb-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--lmb-frame);
}

/* ------------------------------------------------------ fullscreen modals */
.lmb-preview-overlay {
  position: fixed;
  inset: 0;
  background: var(--lumiverse-modal-backdrop, rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 22px;
  font-family: var(--lmb-body-font);
  animation: lmb-fade-in 250ms ease-out;
}
@keyframes lmb-fade-in { from { opacity: 0; } to { opacity: 1; } }
.lmb-preview-modal {
  position: relative;
  background: var(--lumiverse-gradient-modal, linear-gradient(135deg, rgba(35, 30, 48, 0.98), rgba(20, 17, 28, 0.98)));
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  width: min(960px, 100%);
  max-height: calc(100vh - 44px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--lumiverse-shadow-lg, 0 24px 80px rgba(0, 0, 0, 0.5)), var(--lmb-glow-strong);
  color: var(--lmb-ink);
  font-size: 12px;
  animation: lmb-rise 300ms var(--lmb-ease);
}
@keyframes lmb-rise {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
/* Frame within frame. */
.lmb-preview-modal::before {
  content: "";
  position: absolute;
  inset: 5px;
  border: 1px solid var(--lmb-frame-faint);
  border-radius: calc(var(--lmb-r-lg) - 4px);
  pointer-events: none;
  z-index: 1;
}
.lmb-preview-modal__header,
.lmb-preview-modal__footer { flex: 0 0 auto; }
.lmb-preview-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 18px 11px;
  border-bottom: 1px solid var(--lmb-frame);
}
.lmb-preview-modal__header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-family: var(--lmb-display-font);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--lmb-gold);
  text-shadow: 0 0 12px var(--lmb-frame-strong);
}
.lmb-preview-modal__header h3::before {
  content: "◆";
  font-size: 7px;
  color: var(--lmb-metal-soft);
  flex: 0 0 auto;
}
.lmb-preview-modal__close {
  background: transparent;
  color: inherit;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 8px;
  opacity: 0.6;
  transition: opacity 300ms var(--lmb-ease), transform 300ms var(--lmb-ease), color 300ms var(--lmb-ease);
}
.lmb-preview-modal__close:hover { opacity: 1; color: var(--lmb-gold); transform: rotate(90deg); }
.lmb-preview-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lmb-preview-modal__diagnostics {
  flex: 0 0 auto;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-left: 2px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r);
  padding: 9px 12px;
}
.lmb-preview-modal__diagnostics h4 {
  margin: 0 0 5px 0;
  font-family: var(--lmb-display-font);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-preview-modal__diagnostics ul {
  margin: 0;
  padding-left: 18px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--lmb-ink-muted);
}
.lmb-preview-msg {
  flex: 0 0 auto;
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  overflow: hidden;
}
.lmb-preview-msg__role {
  background: linear-gradient(90deg, var(--lmb-wash), transparent);
  padding: 6px 10px 5px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
  border-bottom: 1px solid var(--lmb-hairline);
}
.lmb-preview-msg__content {
  margin: 0;
  padding: 10px 12px;
  background: var(--lmb-fill-strong);
  font-family: var(--lmb-mono-font);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--lmb-ink-muted);
}
.lmb-preview-modal__footer {
  padding: 11px 18px;
  border-top: 1px solid var(--lmb-frame);
  background: var(--lmb-fill);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ------------------------------------------------------------ scrollbars */
.lmb-root ::-webkit-scrollbar,
.lmb-preview-overlay ::-webkit-scrollbar { width: 9px; height: 9px; }
.lmb-root ::-webkit-scrollbar-track,
.lmb-preview-overlay ::-webkit-scrollbar-track { background: transparent; }
.lmb-root ::-webkit-scrollbar-thumb,
.lmb-preview-overlay ::-webkit-scrollbar-thumb {
  background: var(--lmb-frame);
  border: 3px solid transparent;
  background-clip: padding-box;
  border-radius: var(--lmb-r-sm);
}
.lmb-root ::-webkit-scrollbar-thumb:hover,
.lmb-preview-overlay ::-webkit-scrollbar-thumb:hover { background: var(--lmb-frame-strong); background-clip: padding-box; }

/* ----------------------------------------------------------------- focus */
.lmb-root :focus-visible,
.lmb-preview-overlay :focus-visible,
.lmb-toast-stack :focus-visible,
.lmb-modal-form :focus-visible {
  outline: 2px solid var(--lmb-gold);
  outline-offset: 2px;
}

/* ------------------------------------------------------------- responsive */
@media (max-width: 600px) {
  .lmb-root { padding: 11px 9px 26px; gap: 12px; }
  .lmb-tab { padding: 11px 3px 9px; }
  .lmb-tab-label { font-size: 9px; letter-spacing: 0.12em; }
  .lmb-btn { min-height: 40px; padding: 10px 14px 8px; font-size: 11px; }
  .lmb-btn.small { min-height: 34px; padding: 7px 10px 5px; font-size: 10px; }
  .lmb-subtab { padding: 9px 8px 8px; }
  .lmb-input { padding: 9px 10px 8px; font-size: 13px; }
  .lmb-chip { padding: 8px 12px 7px; font-size: 12px; }
  .lmb-root input[type="checkbox"],
  .lmb-preview-overlay input[type="checkbox"] { width: 18px; height: 18px; }
  .lmb-root input[type="checkbox"]::after,
  .lmb-preview-overlay input[type="checkbox"]::after { inset: 4px; }
  .lmb-message-row { padding: 7px 6px; }
  .lmb-multiselect-row { padding: 6px 4px; }
  .lmb-entry-row { padding: 10px; }
  .lmb-preview-overlay { padding: 10px; }
  .lmb-toast { max-width: min(340px, calc(100vw - 32px)); }
}
@media (max-width: 380px) {
  .lmb-grid-3 { grid-template-columns: 1fr 1fr; }
  .lmb-grid-2 { grid-template-columns: 1fr; }
  .lmb-section { padding: 13px 11px 11px; }
  .lmb-kv { grid-template-columns: 1fr; gap: 1px 0; }
  .lmb-kv-key { padding-top: 6px; }
}

/* -------------------------------------------------------- reduced motion */
@media (prefers-reduced-motion: reduce) {
  .lmb-root *, .lmb-root *::before, .lmb-root *::after,
  .lmb-toast-stack *, .lmb-toast,
  .lmb-preview-overlay, .lmb-preview-overlay *, .lmb-preview-modal {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
  .lmb-busy-dot { transform: rotate(45deg); }
}
`;
var ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 1.5v2"/>
  <path d="M7.6 2.4l1 1.7"/>
  <path d="M16.4 2.4l-1 1.7"/>
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
  <path d="M6.5 6H20v16H6.5A2.5 2.5 0 0 1 4 19.5V8.5A2.5 2.5 0 0 1 6.5 6z"/>
  <path d="M8 11h8"/>
  <path d="M8 15h6"/>
</svg>
`;

// src/ui/components.ts
function textInput(opts) {
  const el = document.createElement("input");
  el.type = "text";
  el.className = `lmb-input ${opts.className ?? ""}`.trim();
  el.value = opts.value;
  if (opts.placeholder)
    el.placeholder = opts.placeholder;
  if (opts.autoFocus)
    setTimeout(() => el.focus(), 0);
  if (opts.onChange) {
    el.addEventListener("input", () => opts.onChange?.(el.value));
  }
  if (opts.onBlur) {
    el.addEventListener("blur", () => opts.onBlur?.(el.value));
  }
  return el;
}
function textArea(opts) {
  const el = document.createElement("textarea");
  el.className = "lmb-input lmb-textarea";
  el.value = opts.value;
  if (opts.placeholder)
    el.placeholder = opts.placeholder;
  if (opts.rows)
    el.rows = opts.rows;
  if (opts.onChange)
    el.addEventListener("input", () => opts.onChange?.(el.value));
  if (opts.onBlur)
    el.addEventListener("blur", () => opts.onBlur?.(el.value));
  return el;
}
function numberInput(opts) {
  const el = document.createElement("input");
  el.type = "number";
  el.className = "lmb-input";
  const showAsBlank = opts.value === null || opts.defaultValue !== undefined && opts.value === opts.defaultValue;
  el.value = showAsBlank ? "" : String(opts.value);
  if (typeof opts.min === "number")
    el.min = String(opts.min);
  if (typeof opts.max === "number")
    el.max = String(opts.max);
  if (typeof opts.step === "number")
    el.step = String(opts.step);
  if (opts.disabled)
    el.disabled = true;
  if (opts.placeholder)
    el.placeholder = opts.placeholder;
  else if (opts.defaultValue !== undefined)
    el.placeholder = String(opts.defaultValue);
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
function select(opts) {
  const el = document.createElement("select");
  el.className = "lmb-input lmb-select";
  if (opts.ariaLabel)
    el.setAttribute("aria-label", opts.ariaLabel);
  for (const o of opts.options) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.disabled)
      opt.disabled = true;
    if (o.value === opts.value)
      opt.selected = true;
    el.appendChild(opt);
  }
  el.value = opts.value;
  if (opts.onChange)
    el.addEventListener("change", () => opts.onChange?.(el.value));
  return el;
}
function checkbox(opts) {
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
  if (opts.onChange)
    input.addEventListener("change", () => opts.onChange?.(input.checked));
  return label;
}
function multiSelect(opts) {
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
      if (cb.checked)
        sel.add(o.value);
      else
        sel.delete(o.value);
      opts.onChange?.(Array.from(sel));
    });
    wrap.appendChild(row);
  }
  return wrap;
}
function makeButton(label, onClick, opts = {}) {
  const btn = document.createElement("button");
  const classes = ["lmb-btn"];
  if (opts.primary)
    classes.push("primary");
  if (opts.danger)
    classes.push("danger");
  if (opts.small)
    classes.push("small");
  btn.className = classes.join(" ");
  btn.textContent = label;
  btn.disabled = !!opts.disabled;
  btn.type = "button";
  if (opts.title)
    btn.title = opts.title;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (btn.disabled)
      return;
    onClick();
  });
  return btn;
}
function section(title) {
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
function field(label) {
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
function labelled(label, child) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = label;
  wrap.appendChild(lbl);
  wrap.appendChild(child);
  return wrap;
}
function pill(text, tone) {
  const el = document.createElement("span");
  el.className = `lmb-pill${tone ? " " + tone : ""}`;
  el.textContent = text;
  return el;
}
function makeSubtabs(defs, active, onPick) {
  const bar = document.createElement("div");
  bar.className = "lmb-subtabs";
  let activeBtn = null;
  for (const d of defs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `lmb-subtab${d.key === active ? " active" : ""}`;
    btn.textContent = d.label;
    btn.addEventListener("click", () => {
      if (d.key !== active)
        onPick(d.key);
    });
    bar.appendChild(btn);
    if (d.key === active)
      activeBtn = btn;
  }
  requestAnimationFrame(() => {
    if (!bar.isConnected)
      return;
    bar.classList.toggle("scrollable", bar.scrollWidth > bar.clientWidth + 1);
    if (activeBtn && bar.scrollWidth > bar.clientWidth + 1) {
      activeBtn.scrollIntoView({ inline: "nearest", block: "nearest" });
    }
  });
  return bar;
}
function statTile(value, label, sub, tooltip) {
  const tile = document.createElement("div");
  tile.className = "lmb-tile";
  if (tooltip)
    tile.title = tooltip;
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
function searchField(opts) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-search-row";
  const glyph = document.createElement("span");
  glyph.className = "lmb-search-glyph";
  glyph.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "lmb-search-input";
  input.value = opts.value;
  if (opts.placeholder)
    input.placeholder = opts.placeholder;
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "lmb-search-clear";
  clear.textContent = "×";
  clear.title = "Clear search";
  clear.setAttribute("aria-label", "Clear search");
  const syncClear = () => {
    clear.style.visibility = input.value ? "visible" : "hidden";
  };
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
function scrollPaneTop(el) {
  const sc = findScrollingAncestor(el);
  if (sc)
    sc.scrollTop = 0;
  else
    window.scrollTo(0, 0);
}
function relativeTime(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60)
    return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)
    return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48)
    return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function textNode(text, className) {
  const el = document.createElement("div");
  if (className)
    el.className = className;
  el.textContent = text;
  return el;
}
function span(text, className) {
  const el = document.createElement("span");
  if (className)
    el.className = className;
  el.textContent = text;
  return el;
}
function formatTokens(n) {
  if (n >= 1000)
    return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
function findScrollingAncestor(el) {
  let cur = el?.parentElement ?? null;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const style = getComputedStyle(cur);
    const oy = style.overflowY;
    if (oy === "auto" || oy === "scroll")
      return cur;
    cur = cur.parentElement;
  }
  return null;
}
function collectScrollableDescendants(root) {
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;
  while (node) {
    if (node !== root && node instanceof HTMLElement) {
      const style = getComputedStyle(node);
      const oy = style.overflowY;
      if (oy === "auto" || oy === "scroll")
        out.push(node);
    }
    node = walker.nextNode();
  }
  return out;
}
function preserveScroll(anchor, fn) {
  if (!anchor) {
    fn();
    return;
  }
  const ancestor = findScrollingAncestor(anchor);
  const ancestorScroll = ancestor ? ancestor.scrollTop : 0;
  const innerBefore = collectScrollableDescendants(anchor).map((el) => el.scrollTop);
  fn();
  if (ancestor && ancestorScroll > 0)
    ancestor.scrollTop = ancestorScroll;
  const innerAfter = collectScrollableDescendants(anchor);
  if (innerAfter.length === innerBefore.length) {
    for (let i = 0;i < innerAfter.length; i++) {
      if (innerBefore[i] > 0)
        innerAfter[i].scrollTop = innerBefore[i];
    }
  }
}
var HIDDEN_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 4.22-5.42"/><path d="M22.54 16.88A10.94 10.94 0 0 0 23 12s-4-8-11-8a10.84 10.84 0 0 0-5.34 1.4"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

// src/ui/modals.ts
function openEditModal(ctx, title, fields, onSave) {
  const handle = ctx.ui.showModal({ title, width: 640, maxHeight: 720 });
  const form = document.createElement("div");
  form.className = "lmb-modal-form";
  handle.root.appendChild(form);
  const labelWrap = document.createElement("div");
  labelWrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = "Label";
  const labelInput = textInput({ value: fields.comment, placeholder: "Label" });
  labelWrap.append(lbl, labelInput);
  form.appendChild(labelWrap);
  const contentWrap = document.createElement("div");
  contentWrap.className = "lmb-field";
  const cLbl = document.createElement("div");
  cLbl.className = "lmb-field-label";
  cLbl.textContent = "Content";
  const contentInput = textArea({ value: fields.content, rows: 16 });
  contentWrap.append(cLbl, contentInput);
  form.appendChild(contentWrap);
  const actions = document.createElement("div");
  actions.className = "lmb-modal-actions";
  actions.append(makeButton("Cancel", () => handle.dismiss()), makeButton("Save", () => {
    onSave({ comment: labelInput.value, content: contentInput.value });
    handle.dismiss();
  }, { primary: true }));
  form.appendChild(actions);
}
async function confirmDelete(ctx, title, message) {
  try {
    const r = await ctx.ui.showConfirm({
      title,
      message,
      variant: "danger",
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
    return !!r.confirmed;
  } catch {
    return window.confirm(message);
  }
}
function showDryRunModal(kind, messages, diagnostics) {
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  const close = () => {
    document.removeEventListener("keydown", onKey);
    overlay.remove();
  };
  const onKey = (e) => {
    if (e.key === "Escape")
      close();
  };
  document.addEventListener("keydown", onKey);
  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = `Dry run: ${kind === "arc" ? "Arc" : kind === "volume" ? "Volume" : "Chapter"}`;
  header.appendChild(title);
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Close dry run");
  closeBtn.addEventListener("click", close);
  header.appendChild(closeBtn);
  modal.appendChild(header);
  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  if (diagnostics.length > 0) {
    const diag = document.createElement("div");
    diag.className = "lmb-preview-modal__diagnostics";
    const diagTitle = document.createElement("h4");
    diagTitle.textContent = "Diagnostics";
    diag.appendChild(diagTitle);
    const ul = document.createElement("ul");
    for (const d of diagnostics) {
      const li = document.createElement("li");
      li.textContent = d.message;
      ul.appendChild(li);
    }
    diag.appendChild(ul);
    body.appendChild(diag);
  }
  for (const m of messages) {
    const msgCard = document.createElement("div");
    msgCard.className = "lmb-preview-msg";
    const roleLabel = document.createElement("div");
    roleLabel.className = "lmb-preview-msg__role";
    roleLabel.textContent = m.role;
    const contentPre = document.createElement("pre");
    contentPre.className = "lmb-preview-msg__content";
    contentPre.textContent = m.content;
    msgCard.appendChild(roleLabel);
    msgCard.appendChild(contentPre);
    body.appendChild(msgCard);
  }
  modal.appendChild(body);
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "lmb-btn small";
  copyBtn.textContent = "Copy JSON";
  copyBtn.addEventListener("click", async () => {
    const json = JSON.stringify({ kind, messages, diagnostics }, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      copyBtn.textContent = "Copied";
      setTimeout(() => copyBtn.textContent = "Copy JSON", 1500);
    } catch {
      copyBtn.textContent = "Copy failed";
    }
  });
  footer.appendChild(copyBtn);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay)
      close();
  });
  document.body.appendChild(overlay);
}
function promptForString(ctx, title, initial) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled)
        return;
      settled = true;
      resolve(value);
    };
    const handle = ctx.ui.showModal({ title, width: 420 });
    const form = document.createElement("div");
    form.className = "lmb-modal-form";
    handle.root.appendChild(form);
    const input = textInput({ value: initial, autoFocus: true });
    form.appendChild(input);
    const actions = document.createElement("div");
    actions.className = "lmb-modal-actions";
    actions.append(makeButton("Cancel", () => {
      settle(null);
      handle.dismiss();
    }), makeButton("OK", () => {
      const v = input.value.trim();
      settle(v || null);
      handle.dismiss();
    }, { primary: true }));
    form.appendChild(actions);
    try {
      handle.onDismiss?.(() => settle(null));
    } catch (_) {}
  });
}

// src/ui/tabs/home-tab.ts
var inflightBusyLabels = new Map;
function busyTrackKey(kind, chatId) {
  return `${kind}::${chatId}`;
}
var streamWatch = null;
var streamData = { content: "", thinking: "", running: false };
var streamEls = null;
function deliverStreamText(msg) {
  if (!streamWatch || streamWatch.chatId !== msg.chatId || streamWatch.kind !== msg.kind)
    return;
  streamData = { content: msg.content, thinking: msg.thinking, running: msg.running };
  patchStreamPanel();
}
function patchStreamPanel() {
  const els = streamEls;
  if (!els || !els.panel.isConnected)
    return;
  const pinned = els.body.scrollHeight - els.body.scrollTop - els.body.clientHeight < 48;
  els.think.textContent = streamData.thinking;
  els.think.style.display = streamData.thinking ? "" : "none";
  els.text.textContent = streamData.content;
  els.text.style.display = streamData.content ? "" : "none";
  els.empty.style.display = streamData.content || streamData.thinking ? "none" : "";
  els.status.textContent = streamData.running ? "streaming" : "finished";
  els.panel.classList.toggle("done", !streamData.running);
  if (pinned)
    els.body.scrollTop = els.body.scrollHeight;
}
function closeStreamWatch(send) {
  if (streamWatch) {
    send({ type: "watch_stream", chatId: streamWatch.chatId, kind: streamWatch.kind, on: false });
  }
  streamWatch = null;
  streamEls?.panel.remove();
  streamEls = null;
}
function buildStreamPanel(send) {
  const panel = document.createElement("div");
  panel.className = "lmb-stream-panel";
  const head = document.createElement("div");
  head.className = "lmb-stream-head";
  const dot = document.createElement("div");
  dot.className = "lmb-busy-dot";
  const title = document.createElement("span");
  title.className = "lmb-stream-title";
  title.textContent = "Live from Memoria's desk";
  const status = document.createElement("span");
  status.className = "lmb-stream-status";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "lmb-stream-close";
  close.textContent = "✕";
  close.title = "Close the live view";
  close.addEventListener("click", () => closeStreamWatch(send));
  head.append(dot, title, status, close);
  const body = document.createElement("div");
  body.className = "lmb-stream-body";
  const think = document.createElement("div");
  think.className = "lmb-stream-think";
  const text = document.createElement("div");
  text.className = "lmb-stream-text";
  const empty = document.createElement("div");
  empty.className = "lmb-stream-empty";
  empty.textContent = "Waiting for the first tokens from the model...";
  body.append(think, text, empty);
  panel.append(head, body);
  streamEls = { panel, body, think, text, empty, status };
  patchStreamPanel();
  return panel;
}
function tryUpdateBusyLabelsInPlace(entries) {
  const keys = new Set(entries.map((b) => busyTrackKey(b.kind, b.chatId)));
  if (keys.size !== inflightBusyLabels.size)
    return false;
  for (const k of keys) {
    const el = inflightBusyLabels.get(k);
    if (!el || !el.isConnected)
      return false;
  }
  for (const b of entries) {
    const el = inflightBusyLabels.get(busyTrackKey(b.kind, b.chatId));
    if (el)
      el.textContent = b.label;
  }
  return true;
}
function renderHomeTab(host, state, ctx, send) {
  host.replaceChildren();
  if (!state.activeChatId) {
    const empty = section("Overview");
    empty.body.appendChild(textNode("Open a chat and Memoria will set up her desk", "lmb-empty"));
    host.appendChild(empty.wrap);
    return;
  }
  renderOverview(host, state, send);
  renderPromptPanel(host, state);
  renderFailure(host, state, send);
  renderPreviews(host, state, send);
  renderActions(host, state, send);
}
var HOST_GROUPS = [
  { id: "lumiverse", label: "Prompt blocks", color: "#8a7fb0" },
  { id: "chatHistory", label: "Chat history", color: "#d4a842" },
  { id: "longTermMemory", label: "Long-term memory", color: "#e89b5f" },
  { id: "worldInfo", label: "World info", color: "#68b87a" },
  { id: "sidecar", label: "Sidecar", color: "#e05daa" },
  { id: "extensions", label: "Extensions", color: "#5bc0c0" },
  { id: "system", label: "System", color: "#5b8ca8" }
];
var HOST_TYPE_TO_GROUP = {
  block: "lumiverse",
  chat_history: "chatHistory",
  long_term_memory: "longTermMemory",
  world_info: "worldInfo",
  sidecar: "sidecar",
  extension: "extensions",
  authors_note: "extensions",
  separator: "system",
  utility: "system",
  append: "lumiverse"
};
var promptCache = {
  chatId: null,
  newestMsgId: null,
  data: null,
  source: null,
  at: 0,
  loading: false,
  error: null,
  expanded: new Set
};
function normalizeBreakdown(raw, chatHistoryTokens = 0) {
  const entries = Array.isArray(raw["entries"]) ? raw["entries"] : null;
  if (!entries)
    return null;
  const clean = [];
  for (const e of entries) {
    if (!e || typeof e !== "object")
      continue;
    const tokens = typeof e["tokens"] === "number" ? e["tokens"] : 0;
    clean.push({
      name: typeof e["name"] === "string" ? e["name"] : "?",
      type: typeof e["type"] === "string" ? e["type"] : "utility",
      tokens,
      extensionName: typeof e["extensionName"] === "string" ? e["extensionName"] : undefined
    });
  }
  if (chatHistoryTokens > 0 && !clean.some((e) => e.type === "chat_history")) {
    clean.unshift({ name: "Assembled transcript", type: "chat_history", tokens: chatHistoryTokens, synthetic: true });
  }
  const summed = clean.reduce((a, e) => a + e.tokens, 0);
  return {
    entries: clean,
    totalTokens: typeof raw["totalTokens"] === "number" ? raw["totalTokens"] : summed,
    maxContext: typeof raw["maxContext"] === "number" ? raw["maxContext"] : 0,
    model: typeof raw["model"] === "string" ? raw["model"] : undefined,
    presetName: typeof raw["presetName"] === "string" ? raw["presetName"] : undefined
  };
}
async function fetchStoredBreakdown(messages) {
  const recent = messages.slice(-15).reverse();
  for (const m of recent) {
    const res = await fetch(`/api/v1/generate/breakdown/${encodeURIComponent(m.id)}`, { credentials: "same-origin" });
    if (res.status === 404)
      continue;
    if (!res.ok)
      throw new Error(`breakdown fetch failed (${res.status})`);
    const j = await res.json();
    const historyTokens = typeof j["chatHistoryTokens"] === "number" ? j["chatHistoryTokens"] : 0;
    const data = normalizeBreakdown(j, historyTokens);
    if (data)
      return data;
  }
  return null;
}
async function fetchDryRun(chatId) {
  const res = await fetch(`/api/v1/generate/dry-run`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId })
  });
  if (!res.ok)
    throw new Error(`dry run failed (${res.status})`);
  const j = await res.json();
  const tc = j["tokenCount"];
  const clip = j["contextClipStats"];
  const params = j["parameters"];
  const maxContext = clip && typeof clip["maxContext"] === "number" && clip["maxContext"] > 0 ? clip["maxContext"] : params && typeof params["max_context_length"] === "number" ? params["max_context_length"] : 0;
  const historyTokens = typeof j["chatHistoryTokens"] === "number" ? j["chatHistoryTokens"] : 0;
  const data = normalizeBreakdown({
    entries: tc?.["breakdown"] ?? [],
    totalTokens: tc?.["total_tokens"],
    maxContext,
    model: j["model"]
  }, historyTokens);
  if (!data || data.entries.length === 0)
    throw new Error("dry run returned no breakdown");
  return data;
}
function renderPromptPanel(host, state) {
  const chatId = state.activeChatId;
  if (!chatId)
    return;
  const sec = section("The Prompt");
  const body = document.createElement("div");
  body.className = "lmb-pane";
  sec.body.appendChild(body);
  host.appendChild(sec.wrap);
  const newestMsgId = state.messages.length ? state.messages[state.messages.length - 1].id : null;
  const chatChanged = promptCache.chatId !== chatId;
  const newFire = !chatChanged && promptCache.newestMsgId !== newestMsgId;
  if (chatChanged) {
    promptCache.chatId = chatId;
    promptCache.data = null;
    promptCache.source = null;
    promptCache.error = null;
    promptCache.loading = false;
    promptCache.expanded.clear();
  }
  promptCache.newestMsgId = newestMsgId;
  const redraw = () => {
    if (!body.isConnected)
      return;
    body.replaceChildren();
    drawPromptContent(body, state, load);
  };
  const load = (mode) => {
    if (promptCache.loading)
      return;
    promptCache.loading = true;
    promptCache.error = null;
    redraw();
    (async () => {
      if (mode === "dry")
        return fetchDryRun(chatId).then((d) => ({ d, source: "dry" }));
      const stored = await fetchStoredBreakdown(state.messages);
      if (stored)
        return { d: stored, source: "fire" };
      const dry = await fetchDryRun(chatId);
      return { d: dry, source: "dry" };
    })().then(({ d, source }) => {
      promptCache.data = d;
      promptCache.source = source;
      promptCache.at = Date.now();
    }).catch((err) => {
      promptCache.error = err instanceof Error ? err.message : String(err);
    }).finally(() => {
      promptCache.loading = false;
      redraw();
    });
  };
  drawPromptContent(body, state, load);
  if (!promptCache.loading && (chatChanged || newFire || !promptCache.data && !promptCache.error)) {
    load("auto");
  }
}
function drawPromptContent(body, state, load) {
  const head = document.createElement("div");
  head.className = "lmb-actions";
  const status = document.createElement("span");
  status.className = "lmb-help lmb-grow";
  const simulate = makeButton("Simulate", () => load("dry"), {
    small: true,
    disabled: promptCache.loading,
    title: "Assemble the next prompt through the host pipeline without generating (dry run)"
  });
  head.append(status, simulate);
  body.appendChild(head);
  if (promptCache.loading) {
    status.textContent = "Reading the last fire...";
    body.appendChild(textNode("Memoria is asking the host for the prompt breakdown", "lmb-empty"));
    return;
  }
  if (promptCache.error) {
    status.textContent = "Couldn't read the host prompt";
    const err = textNode(promptCache.error, "lmb-help");
    const retry = makeButton("Retry", () => load("auto"), { small: true, primary: true });
    const row = document.createElement("div");
    row.className = "lmb-actions";
    row.append(err, retry);
    body.appendChild(row);
    return;
  }
  const data = promptCache.data;
  if (!data) {
    status.textContent = "No prompt data yet";
    return;
  }
  const srcLabel = promptCache.source === "fire" ? "last fire" : "simulated next fire";
  const bits = [srcLabel, relativeTime(promptCache.at)];
  if (data.model)
    bits.push(data.model);
  if (data.presetName)
    bits.push(data.presetName);
  status.textContent = bits.join(" · ");
  const groups = HOST_GROUPS.map((g) => ({
    ...g,
    entries: data.entries.filter((e) => (HOST_TYPE_TO_GROUP[e.type] ?? "system") === g.id)
  })).map((g) => ({ ...g, tokens: g.entries.reduce((a, e) => a + e.tokens, 0) })).filter((g) => g.tokens > 0);
  const freeTokens = data.maxContext > 0 ? Math.max(0, data.maxContext - data.totalTokens) : 0;
  const pctDenom = data.maxContext > 0 ? data.maxContext : data.totalTokens;
  const bar = document.createElement("div");
  bar.className = "lmb-spine";
  for (const g of groups) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg";
    seg.style.flexGrow = String(Math.max(1, g.tokens));
    seg.style.background = g.color;
    seg.style.opacity = "0.75";
    seg.title = `${g.label} · ${formatTokens(g.tokens)} tokens`;
    bar.appendChild(seg);
  }
  if (freeTokens > 0) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg free";
    seg.style.flexGrow = String(freeTokens);
    seg.title = `Free space · ${formatTokens(freeTokens)} tokens`;
    bar.appendChild(seg);
  }
  body.appendChild(bar);
  const fullness = document.createElement("div");
  fullness.className = "lmb-breakdown-row total";
  const spacer = document.createElement("span");
  spacer.className = "lmb-spine-swatch";
  spacer.style.visibility = "hidden";
  const fl = document.createElement("span");
  fl.className = "lmb-breakdown-label";
  fl.textContent = data.maxContext > 0 ? "Prompt vs context window" : "Prompt total";
  const ft = document.createElement("span");
  ft.className = "lmb-breakdown-tokens";
  ft.textContent = data.maxContext > 0 ? `${formatTokens(data.totalTokens)} / ${formatTokens(data.maxContext)} (${Math.round(data.totalTokens / data.maxContext * 100)}%)` : `${formatTokens(data.totalTokens)} tokens`;
  fullness.append(spacer, fl, ft);
  body.appendChild(fullness);
  if (data.maxContext > 0 && data.totalTokens / data.maxContext > 0.9) {
    body.appendChild(pill("context nearly full", "warn"));
  }
  const list = document.createElement("div");
  list.className = "lmb-breakdown";
  for (const g of groups) {
    const isSynthetic = g.entries.every((e) => e.synthetic);
    const row = document.createElement(isSynthetic ? "div" : "button");
    if (!isSynthetic)
      row.type = "button";
    row.className = `lmb-breakdown-row${isSynthetic ? "" : " lmb-breakdown-click"}`;
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    swatch.style.background = g.color;
    swatch.style.opacity = "0.85";
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = isSynthetic ? g.label : `${g.label} (${g.entries.length})`;
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    const pct = pctDenom > 0 ? Math.round(g.tokens / pctDenom * 100) : 0;
    t.textContent = `${formatTokens(g.tokens)} · ${pct}%`;
    row.append(swatch, l, t);
    if (!isSynthetic) {
      const chev = document.createElement("span");
      chev.className = `lmb-chevron${promptCache.expanded.has(g.id) ? " open" : ""}`;
      row.appendChild(chev);
      row.addEventListener("click", () => {
        if (promptCache.expanded.has(g.id))
          promptCache.expanded.delete(g.id);
        else
          promptCache.expanded.add(g.id);
        if (body.isConnected) {
          body.replaceChildren();
          drawPromptContent(body, state, load);
        }
      });
    }
    list.appendChild(row);
    if (!isSynthetic && promptCache.expanded.has(g.id)) {
      for (const e of g.entries) {
        const sub = document.createElement("div");
        sub.className = "lmb-breakdown-row sub";
        const pad = document.createElement("span");
        pad.className = "lmb-spine-swatch";
        pad.style.visibility = "hidden";
        const sl = document.createElement("span");
        sl.className = "lmb-breakdown-label";
        sl.textContent = e.extensionName ? `${e.name} (${e.extensionName})` : e.name;
        const st = document.createElement("span");
        st.className = "lmb-breakdown-tokens";
        st.textContent = formatTokens(e.tokens);
        sub.append(pad, sl, st);
        list.appendChild(sub);
      }
    }
  }
  if (data.maxContext > 0) {
    const row = document.createElement("div");
    row.className = "lmb-breakdown-row";
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = "Free space";
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    const pct = pctDenom > 0 ? Math.round(freeTokens / pctDenom * 100) : 0;
    t.textContent = `${formatTokens(freeTokens)} · ${pct}%`;
    row.append(swatch, l, t);
    list.appendChild(row);
  }
  body.appendChild(list);
}
var SPINE_LABEL = {
  codex: "Knowledge Codex",
  volume: "in a volume",
  arc: "in an arc",
  chapter: "in a chapter",
  ghost: "staged as ghost",
  excluded: "excluded",
  free: "uncompressed"
};
function injectedTokens(v) {
  return v.meta.tokenCountOutput > 0 ? v.meta.tokenCountOutput : v.contentTokens;
}
function collectEntryInfo(state) {
  const info = new Map;
  const put = (v, kind) => {
    info.set(v.entryId, {
      kind,
      tokens: injectedTokens(v),
      msgCount: Math.max(1, v.meta.msgIds.length),
      label: v.comment || v.meta.title || ""
    });
  };
  for (const v of state.volumes)
    put(v, "volume");
  for (const a of state.arcs)
    put(a, "arc");
  for (const c of state.chapters)
    put(c, c.isGhost ? "ghost" : "chapter");
  return info;
}
function buildSpine(state, info) {
  const segs = [];
  state.messages.forEach((m, i) => {
    const entryId = m.covered && !m.excluded ? m.coveredByEntryId : null;
    const kind = m.excluded ? "excluded" : entryId ? info.get(entryId)?.kind ?? "chapter" : "free";
    const last = segs[segs.length - 1];
    if (last && last.kind === kind && last.entryId === entryId) {
      last.count++;
      last.to = i;
      if (!entryId)
        last.tokens += m.approxTokens;
    } else {
      segs.push({ kind, count: 1, from: i, to: i, entryId, tokens: entryId ? 0 : m.approxTokens });
    }
  });
  for (const s of segs) {
    if (!s.entryId)
      continue;
    const e = info.get(s.entryId);
    if (!e)
      continue;
    s.tokens = Math.max(1, Math.round(e.tokens * (s.count / e.msgCount)));
  }
  return segs;
}
function renderSpine(body, state) {
  const codexTokens = state.codexInjectedTokens ?? 0;
  if (state.messages.length === 0 && codexTokens === 0)
    return;
  const info = collectEntryInfo(state);
  const segs = buildSpine(state, info);
  if (codexTokens > 0) {
    segs.unshift({ kind: "codex", count: 0, from: -1, to: -1, entryId: null, tokens: codexTokens });
  }
  if (segs.length === 0)
    return;
  const spine = document.createElement("div");
  spine.className = "lmb-spine";
  for (const s of segs) {
    const seg = document.createElement("div");
    seg.className = `lmb-spine-seg ${s.kind}`;
    seg.style.flexGrow = String(Math.max(1, s.tokens));
    const name = s.entryId ? info.get(s.entryId)?.label : "";
    const where = s.kind === "codex" ? "" : `msgs ${s.from + 1}–${s.to + 1} · `;
    seg.title = `${where}${name || SPINE_LABEL[s.kind]} · ~${formatTokens(s.tokens)} tokens${s.entryId ? " (click to open)" : ""}`;
    if (s.entryId) {
      const entryId = s.entryId;
      seg.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("lmb-reveal-entry", { detail: { entryId } }));
      });
    }
    spine.appendChild(seg);
  }
  body.appendChild(spine);
  body.appendChild(renderBreakdown(state));
}
function renderBreakdown(state) {
  const codexTokens = state.codexInjectedTokens ?? 0;
  const wrap = document.createElement("div");
  wrap.className = "lmb-breakdown";
  const row = (kind, label, tokens, approx) => {
    const r = document.createElement("div");
    r.className = `lmb-breakdown-row${kind === "total" ? " total" : ""}`;
    const swatch = document.createElement("span");
    swatch.className = `lmb-spine-swatch ${kind === "total" ? "" : kind}`;
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = label;
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    t.textContent = `${approx ? "~" : ""}${formatTokens(tokens)}`;
    r.append(swatch, l, t);
    return r;
  };
  const activeVolumes = state.volumes.filter((v) => v.active);
  const activeArcs = state.arcs.filter((a) => a.active);
  const activeChapters = state.chapters.filter((c) => c.active && !c.isGhost);
  const sum = (list) => list.reduce((acc, v) => acc + injectedTokens(v), 0);
  const volTokens = sum(activeVolumes);
  const arcTokens = sum(activeArcs);
  const chapTokens = sum(activeChapters);
  let tailTokens = 0;
  let tailCount = 0;
  let excludedTokens = 0;
  let excludedCount = 0;
  for (const m of state.messages) {
    if (m.excluded) {
      excludedTokens += m.approxTokens;
      excludedCount++;
    } else if (!m.covered) {
      tailTokens += m.approxTokens;
      tailCount++;
    }
  }
  if (codexTokens > 0)
    wrap.appendChild(row("codex", "Knowledge Codex", codexTokens, true));
  if (activeVolumes.length)
    wrap.appendChild(row("volume", `Volumes (${activeVolumes.length})`, volTokens, false));
  if (activeArcs.length)
    wrap.appendChild(row("arc", `Arcs (${activeArcs.length})`, arcTokens, false));
  if (activeChapters.length)
    wrap.appendChild(row("chapter", `Chapters (${activeChapters.length})`, chapTokens, false));
  if (tailCount > 0)
    wrap.appendChild(row("free", `Uncompressed tail (${tailCount} msgs)`, tailTokens, true));
  if (excludedCount > 0)
    wrap.appendChild(row("excluded", `Excluded (${excludedCount} msgs)`, excludedTokens, true));
  const total = codexTokens + volTokens + arcTokens + chapTokens + tailTokens + excludedTokens;
  wrap.appendChild(row("total", "Story context in the prompt", total, true));
  return wrap;
}
function renderOverview(host, state, send) {
  const sec = section("Overview");
  const who = document.createElement("div");
  who.className = "lmb-status-grid";
  addRow(who, "Chat", state.activeChatName || state.activeChatId.slice(0, 8));
  if (state.activeCharacterName)
    addRow(who, "Character", state.activeCharacterName);
  sec.body.appendChild(who);
  renderSpine(sec.body, state);
  const cov = state.coverage;
  const pct = cov.totalMessages > 0 ? Math.round(cov.coveredMessages / cov.totalMessages * 100) : 0;
  const tiles = document.createElement("div");
  tiles.className = "lmb-tiles";
  tiles.appendChild(statTile(`${pct}%`, "Filed", `${cov.coveredMessages} of ${cov.totalMessages} msgs`, "Share of this chat's messages already compressed into the shelf"));
  tiles.appendChild(statTile(`~${formatTokens(cov.approxUncoveredTokens)}`, "Tail", `${cov.uncoveredMessages} msgs uncompressed`, "Recent messages still in the prompt at full size, waiting to pass the lag"));
  const own = {
    vol: state.volumes.filter((v) => !v.isRoot).length,
    arc: state.arcs.filter((a) => !a.isRoot).length,
    chap: state.chapters.filter((c) => !c.isRoot && !c.isGhost).length
  };
  tiles.appendChild(statTile(`${own.vol} · ${own.arc} · ${own.chap}`, "Shelf", "vol · arc · chap", "Volumes, arcs, and chapters Memoria has filed for this chat"));
  if (state.activeProfile.codexEnabled || state.codexExists) {
    const value = state.codexBacklog > 0 ? String(state.codexBacklog) : "✓";
    const subText = state.codexBacklog > 0 ? "msgs unindexed" : state.codexLastRunAt ? `updated ${relativeTime(state.codexLastRunAt)}` : "no codex yet";
    tiles.appendChild(statTile(value, "Codex", subText, "Messages the story bible has not read yet"));
  } else {
    tiles.appendChild(statTile("—", "Codex", "off, enable in Tuning"));
  }
  sec.body.appendChild(tiles);
  inflightBusyLabels.clear();
  if (streamWatch && streamWatch.chatId !== state.activeChatId) {
    streamWatch = null;
    streamEls = null;
  }
  for (const b of state.busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    const labelSpan = document.createElement("span");
    labelSpan.className = "lmb-grow";
    labelSpan.textContent = b.label;
    row.append(dot, labelSpan);
    const watching = !!streamWatch && streamWatch.chatId === b.chatId && streamWatch.kind === b.kind;
    const watchBtn = makeButton(watching ? "Hide" : "Watch", () => {
      const active = !!streamWatch && streamWatch.chatId === b.chatId && streamWatch.kind === b.kind;
      if (active) {
        closeStreamWatch(send);
        watchBtn.textContent = "Watch";
        return;
      }
      closeStreamWatch(send);
      streamWatch = { chatId: b.chatId, kind: b.kind };
      streamData = { content: "", thinking: "", running: true };
      send({ type: "watch_stream", chatId: b.chatId, kind: b.kind, on: true });
      row.insertAdjacentElement("afterend", buildStreamPanel(send));
      watchBtn.textContent = "Hide";
    }, { small: true, title: "See Memoria's raw output stream in real time" });
    const abortBtn = makeButton("Abort", () => {
      abortBtn.disabled = true;
      send({ type: "abort_busy", chatId: b.chatId, kind: b.kind });
    }, { danger: true, small: true, title: "Cancel the in-flight generation" });
    row.append(watchBtn, abortBtn);
    sec.body.appendChild(row);
    if (watching)
      sec.body.appendChild(buildStreamPanel(send));
    inflightBusyLabels.set(busyTrackKey(b.kind, b.chatId), labelSpan);
  }
  if (streamWatch && !state.busy.some((b) => b.chatId === streamWatch.chatId && b.kind === streamWatch.kind)) {
    streamData.running = false;
    sec.body.appendChild(buildStreamPanel(send));
  }
  if (!state.connections.length) {
    sec.body.appendChild(textNode("Memoria has no connection to write with. Set one up in Lumiverse.", "lmb-empty"));
  } else if (!state.resolvedSidecarConnectionId) {
    sec.body.appendChild(textNode("Pick a connection in the Tuning tab so Memoria can write.", "lmb-empty"));
  }
  host.appendChild(sec.wrap);
}
function renderFailure(host, state, send) {
  if (!state.lastFailure || !state.activeChatId)
    return;
  const f = state.lastFailure;
  const sec = document.createElement("div");
  sec.className = "lmb-failure";
  const head = document.createElement("div");
  head.style.fontWeight = "600";
  head.textContent = f.kind === "arc" ? "Last arc attempt failed" : f.kind === "volume" ? "Last volume attempt failed" : "Last chapter attempt failed";
  const detail = document.createElement("div");
  detail.style.opacity = "0.85";
  detail.textContent = `${f.message} (tried ${f.retriedTimes}x)`;
  const row = document.createElement("div");
  row.className = "lmb-actions";
  const chatId = state.activeChatId;
  row.append(makeButton("Retry", () => send({ type: "retry_last_failure", chatId }), { primary: true, small: true }));
  sec.append(head, detail, row);
  host.appendChild(sec);
}
function renderPreviews(host, state, send) {
  if (state.pendingPreviews.length === 0 || !state.activeChatId)
    return;
  const sec = section(`Pending previews (${state.pendingPreviews.length})`);
  for (const p of state.pendingPreviews) {
    sec.body.appendChild(renderPreviewCard(p, state.activeChatId, send));
  }
  host.appendChild(sec.wrap);
}
function renderPreviewCard(preview, chatId, send) {
  const card = document.createElement("div");
  card.className = "lmb-preview-card";
  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "8px";
  const tag = document.createElement("span");
  tag.className = `lmb-entry-tag ${preview.kind !== "chapter" ? preview.kind : ""}`.trim();
  tag.textContent = preview.kind.toUpperCase();
  head.append(tag, span(preview.title, "lmb-entry-title"));
  card.appendChild(head);
  let lastSentTitle = preview.title;
  let lastSentContent = preview.content;
  const syncEdit = () => {
    const liveTitle = titleInput.value;
    const liveContent = contentInput.value;
    const patch = {};
    if (liveTitle !== lastSentTitle)
      patch.title = liveTitle;
    if (liveContent !== lastSentContent)
      patch.content = liveContent;
    if (Object.keys(patch).length === 0)
      return;
    lastSentTitle = liveTitle;
    lastSentContent = liveContent;
    send({ type: "edit_preview", chatId, draftId: preview.draftId, patch });
  };
  const titleField = field("Title");
  const titleInput = textInput({ value: preview.title, onChange: syncEdit });
  titleField.body.appendChild(titleInput);
  card.appendChild(titleField.wrap);
  const contentField = field("Content");
  const contentInput = textArea({ value: preview.content, rows: 10, onChange: syncEdit });
  contentField.body.appendChild(contentInput);
  card.appendChild(contentField.wrap);
  if (preview.shortComment) {
    const cm = document.createElement("div");
    cm.className = "lmb-entry-comment";
    cm.textContent = `Memoria: ${preview.shortComment}`;
    card.appendChild(cm);
  }
  const meta = document.createElement("div");
  meta.className = "lmb-entry-meta";
  meta.append(span(`${preview.sourceMessageIds.length} msgs`), span(`${formatTokens(preview.tokenCountOutput)} tokens`), span(preview.model || ""));
  card.appendChild(meta);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton("Save", () => {
    send({
      type: "edit_preview",
      chatId,
      draftId: preview.draftId,
      patch: { title: titleInput.value, content: contentInput.value }
    });
    send({ type: "accept_preview", chatId, draftId: preview.draftId });
  }, { primary: true, small: true }), makeButton("Discard", () => send({ type: "discard_preview", chatId, draftId: preview.draftId }), { danger: true, small: true }));
  card.appendChild(actions);
  return card;
}
function renderActions(host, state, send) {
  if (!state.activeChatId)
    return;
  const sec = section("Actions");
  const chatId = state.activeChatId;
  const disabled = state.busy.length > 0 || !state.settings.enabled;
  const readiness = document.createElement("div");
  readiness.className = "lmb-actions";
  readiness.append(pill(state.coverage.lagSatisfied ? "lag ready" : "lag building", state.coverage.lagSatisfied ? "ok" : "warn"), pill(state.coverage.windowAvailable ? "window ready" : "window building", state.coverage.windowAvailable ? "ok" : "warn"));
  if (state.backlogChapters > 0)
    readiness.appendChild(pill(`${state.backlogChapters} chapter${state.backlogChapters === 1 ? "" : "s"} ready`));
  if (state.backlogArcs > 0)
    readiness.appendChild(pill(`${state.backlogArcs} arc${state.backlogArcs === 1 ? "" : "s"} ready`));
  sec.body.appendChild(readiness);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(makeButton("File chapter", () => send({ type: "create_chapter", chatId }), {
    primary: true,
    disabled,
    title: "Compress the oldest uncovered window into a new chapter using the current profile"
  }));
  if (state.backlogChapters > 1) {
    row.append(makeButton(`File all (${state.backlogChapters})`, () => send({ type: "create_all_chapters", chatId }), {
      disabled,
      title: "Drain the chapter backlog - keeps filing chapters until the lag or window threshold blocks further compression"
    }));
  }
  row.append(makeButton("Bind arc", () => send({ type: "create_arc", chatId }), {
    disabled,
    title: "Roll the oldest unsuperseded chapters into a single arc"
  }));
  if (state.backlogArcs > 1) {
    row.append(makeButton(`Bind all (${state.backlogArcs})`, () => send({ type: "create_all_arcs", chatId }), {
      disabled,
      title: "Drain the arc backlog - keeps binding arcs until the configured arc trigger no longer fires"
    }));
  }
  if (state.activeProfile.codexEnabled) {
    row.append(makeButton("Update codex", () => send({ type: "codex_update_now", chatId }), {
      disabled: disabled || state.busy.some((b) => b.kind === "codex" && b.chatId === chatId),
      title: "Consume everything up to the newest message now, ignoring lag and window"
    }));
  }
  sec.body.appendChild(row);
  if (state.busy.length > 0 && state.settings.enabled) {
    sec.body.appendChild(textNode("Actions unlock when Memoria finishes her current task", "lmb-help"));
  } else if (!state.settings.enabled) {
    sec.body.appendChild(textNode("The extension is off, flip it on in Tuning", "lmb-help"));
  }
  const shelfRow = document.createElement("div");
  shelfRow.className = "lmb-actions";
  if (!state.bookId) {
    const empty = pill("No book yet", "warn");
    empty.title = "Memoria will create this chat's world book the first time a chapter is filed";
    shelfRow.appendChild(empty);
  } else {
    const tag = pill(state.bookName ? state.bookName : "Book ready", "ok");
    tag.title = "World book where chapters and arcs are stored for this chat";
    shelfRow.appendChild(tag);
  }
  sec.body.appendChild(shelfRow);
  host.appendChild(sec.wrap);
}
function addRow(grid, label, value) {
  const l = document.createElement("div");
  l.className = "lmb-label";
  l.textContent = label;
  const v = document.createElement("div");
  v.className = "lmb-value";
  v.textContent = value;
  grid.append(l, v);
}

// src/ui/tabs/books-tab.ts
var SUBTABS = [
  { key: "shelf", label: "Shelf" },
  { key: "compose", label: "Compose" },
  { key: "continuity", label: "Continuity" }
];
var localState = {
  subtab: "shelf",
  shelfQuery: "",
  expandedEntries: new Set,
  showAllGroups: new Set,
  selectedMessages: new Set,
  selectedChapters: new Set,
  selectedArcs: new Set,
  messageFilter: "uncovered",
  messageQuery: "",
  pickerShown: 80,
  anchorMessageId: null,
  suppressNextClick: false,
  rebaseSourceId: "",
  lastChatId: null
};
var SHELF_RECENT = 6;
var PICKER_PAGE = 80;
var LONG_PRESS_MS = 500;
var LONG_PRESS_MOVE_PX = 10;
var pendingFocusEntry = null;
function focusShelfEntry(entryId) {
  localState.subtab = "shelf";
  localState.shelfQuery = "";
  localState.expandedEntries.add(entryId);
  pendingFocusEntry = entryId;
}
function renderBooksTab(host, state, ctx, send) {
  if (localState.lastChatId !== state.activeChatId) {
    localState.shelfQuery = "";
    localState.expandedEntries.clear();
    localState.showAllGroups.clear();
    localState.selectedMessages.clear();
    localState.selectedChapters.clear();
    localState.selectedArcs.clear();
    localState.anchorMessageId = null;
    localState.rebaseSourceId = "";
    localState.pickerShown = PICKER_PAGE;
    localState.lastChatId = state.activeChatId;
  }
  if (pendingFocusEntry) {
    localState.expandedEntries.add(pendingFocusEntry);
    pendingFocusEntry = null;
  }
  const draw = () => {
    preserveScroll(host, () => {
      host.replaceChildren();
      host.appendChild(makeSubtabs(SUBTABS, localState.subtab, (key) => {
        localState.subtab = key;
        draw();
        scrollPaneTop(host);
      }));
      if (!state.activeChatId) {
        host.appendChild(textNode("Open a chat to browse Memoria's shelf", "lmb-empty"));
        return;
      }
      if (localState.subtab === "shelf") {
        renderShelf(host, state, ctx, send, draw);
      } else if (localState.subtab === "compose") {
        renderChapterPicker(host, state, send, draw);
        renderArcPicker(host, state, send, draw);
        renderVolumePicker(host, state, send, draw);
      } else {
        renderContinuity(host, state, ctx, send);
        renderMaintenance(host, state, ctx, send);
      }
    });
  };
  draw();
}
function renderShelf(host, state, ctx, send, redraw) {
  const sec = section("The Shelf");
  const chapters = state.chapters.filter((c) => !c.isRoot);
  const arcs = state.arcs.filter((a) => !a.isRoot);
  const volumes = state.volumes.filter((v) => !v.isRoot);
  if (chapters.length + arcs.length + volumes.length === 0) {
    sec.body.appendChild(textNode("Empty shelf for now. Memoria will start filing once the lag fills.", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const search = searchField({
    value: localState.shelfQuery,
    placeholder: "Search titles and summaries...",
    onChange: (v) => {
      localState.shelfQuery = v.toLowerCase();
      buildGroups();
    }
  });
  sec.body.appendChild(search.wrap);
  const listHost = document.createElement("div");
  listHost.className = "lmb-pane";
  sec.body.appendChild(listHost);
  const groups = [
    { key: "volumes", title: "Volumes", kind: "volume", items: volumes },
    { key: "arcs", title: "Arcs", kind: "arc", items: arcs },
    { key: "chapters", title: "Chapters", kind: "chapter", items: chapters }
  ];
  const matchesShelf = (v) => {
    const q = localState.shelfQuery;
    if (!q)
      return true;
    return (v.comment || "").toLowerCase().includes(q) || (v.meta.title || "").toLowerCase().includes(q) || (v.meta.shortComment || "").toLowerCase().includes(q) || (v.content || "").toLowerCase().includes(q);
  };
  const buildGroups = () => {
    listHost.replaceChildren();
    const searching = localState.shelfQuery !== "";
    for (const g of groups) {
      if (g.items.length === 0)
        continue;
      const filtered = searching ? g.items.filter(matchesShelf) : g.items;
      const showAll = searching || localState.showAllGroups.has(g.key);
      const recent = filtered.slice(-SHELF_RECENT);
      const pinned = filtered.filter((v) => localState.expandedEntries.has(v.entryId) && !recent.includes(v));
      const items = showAll ? filtered : [...pinned, ...recent];
      const sub = document.createElement("div");
      sub.className = "lmb-section-title";
      sub.textContent = searching ? `${g.title} (${filtered.length} of ${g.items.length})` : `${g.title} (${g.items.length})`;
      listHost.appendChild(sub);
      if (searching && filtered.length === 0) {
        listHost.appendChild(textNode("No match", "lmb-empty"));
        continue;
      }
      if (!searching && g.items.length > SHELF_RECENT) {
        const expanded = localState.showAllGroups.has(g.key);
        const toggle = makeButton(expanded ? "Show recent only" : `Show all ${g.items.length} (${items.length} shown)`, () => {
          if (expanded)
            localState.showAllGroups.delete(g.key);
          else
            localState.showAllGroups.add(g.key);
          buildGroups();
        }, { small: true });
        const row = document.createElement("div");
        row.className = "lmb-actions";
        row.appendChild(toggle);
        listHost.appendChild(row);
      }
      const list = document.createElement("ul");
      list.className = "lmb-entry-list";
      for (const view of items) {
        list.appendChild(renderEntryRow(view, g.kind, state, ctx, send, redraw));
      }
      listHost.appendChild(list);
    }
  };
  buildGroups();
  host.appendChild(sec.wrap);
}
function renderEntryRow(view, kind, state, ctx, send, redraw) {
  const li = document.createElement("li");
  const expanded = localState.expandedEntries.has(view.entryId);
  li.className = `lmb-entry compact ${kind}${view.active ? "" : " superseded"}${expanded ? " expanded" : ""}`;
  const head = document.createElement("button");
  head.type = "button";
  head.className = "lmb-entry-row";
  const tag = document.createElement("span");
  tag.className = `lmb-entry-tag ${kind}${view.isGhost ? " ghost" : ""}`;
  tag.textContent = view.isGhost ? "GHOST" : kind.toUpperCase();
  const title = document.createElement("span");
  title.className = "lmb-entry-title";
  title.textContent = view.comment || view.meta.title || `${kind} ${view.entryId.slice(0, 6)}`;
  const right = document.createElement("span");
  right.className = "lmb-entry-right";
  const range = view.meta.firstMsgIdx !== undefined && view.meta.lastMsgIdx !== undefined ? `${view.meta.firstMsgIdx + 1}–${view.meta.lastMsgIdx + 1}` : `${view.meta.msgIds.length} msgs`;
  right.textContent = `${range} · ${formatTokens(view.contentTokens)}t`;
  const chevron = document.createElement("span");
  chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
  head.append(tag, title, right, chevron);
  head.addEventListener("click", () => {
    if (expanded)
      localState.expandedEntries.delete(view.entryId);
    else
      localState.expandedEntries.add(view.entryId);
    redraw();
  });
  li.appendChild(head);
  if (expanded) {
    li.appendChild(renderEntryDetail(view, kind, state, ctx, send));
  }
  return li;
}
function renderEntryDetail(view, kind, state, ctx, send) {
  const detail = document.createElement("div");
  detail.className = "lmb-entry-detail";
  const meta = document.createElement("div");
  meta.className = "lmb-entry-meta";
  const before = view.sourceTokensInput || 0;
  const tokenStr = before > 0 ? `${formatTokens(before)}→${formatTokens(view.contentTokens)} tokens` : `${formatTokens(view.contentTokens)} tokens`;
  meta.append(span(tokenStr));
  if (view.meta.model)
    meta.append(span(view.meta.model));
  if (view.isGhost)
    meta.append(span("ghost, not yet injected"));
  else if (!view.active)
    meta.append(span("superseded"));
  detail.appendChild(meta);
  if (view.meta.shortComment) {
    const cm = document.createElement("div");
    cm.className = "lmb-entry-comment";
    cm.textContent = `Memoria: ${view.meta.shortComment}`;
    detail.appendChild(cm);
  }
  const preview = document.createElement("div");
  preview.className = "lmb-entry-preview";
  preview.textContent = view.content;
  detail.appendChild(preview);
  const chatId = state.activeChatId;
  const actions = document.createElement("div");
  actions.className = "lmb-entry-actions";
  actions.append(makeButton("Edit", () => {
    openEditModal(ctx, kind === "arc" ? "Edit arc" : kind === "volume" ? "Edit volume" : "Edit chapter", {
      comment: view.comment,
      content: view.content
    }, (next) => {
      if (!chatId)
        return;
      const patch = {};
      if (typeof next.comment === "string" && next.comment !== view.comment) {
        patch.comment = next.comment;
      }
      if (typeof next.content === "string" && next.content !== view.content) {
        patch.content = next.content;
      }
      if (Object.keys(patch).length === 0)
        return;
      send({ type: "update_entry", chatId, entryId: view.entryId, patch });
    });
  }, { small: true, title: "Edit this entry's label and content" }));
  if (!view.isGhost) {
    actions.append(makeButton("Regenerate", async () => {
      const ok = await confirmDelete(ctx, "Regenerate?", "Memoria will delete this entry and resummarize the same range. The old summary text will be lost.");
      if (!ok || !chatId)
        return;
      send({ type: "regenerate_entry", chatId, entryId: view.entryId });
    }, { small: true, title: "Delete and resummarize the same range" }), makeButton("Release", async () => {
      const ok = await confirmDelete(ctx, "Release to lorebook?", "Memoria will hand this entry to your regular lorebook (prefixed with [orphaned]) and stop managing it. Those messages will become uncovered.");
      if (!ok || !chatId)
        return;
      send({ type: "release_entry", chatId, entryId: view.entryId });
    }, { small: true, title: "Strip the LumiBooks marker so the entry becomes a regular lorebook entry" }));
  }
  actions.append(makeButton("Delete", async () => {
    const ok = await confirmDelete(ctx, "Delete?", view.isGhost ? "Memoria will drop this ghost chapter. She will re-summarize the span on her next pass." : "Memoria will let those messages back into the prompt.");
    if (!ok || !chatId)
      return;
    send({ type: "delete_entry", chatId, entryId: view.entryId });
  }, { small: true, danger: true }));
  detail.appendChild(actions);
  return detail;
}
function filterMessages(state) {
  return state.messages.filter((m) => {
    if (localState.messageFilter === "uncovered" && m.covered)
      return false;
    if (localState.messageFilter === "covered" && !m.covered)
      return false;
    if (localState.messageQuery && !(m.preview ?? "").toLowerCase().includes(localState.messageQuery))
      return false;
    return true;
  });
}
function sumSelectedTokens(state) {
  let total = 0;
  const byId = new Map(state.messages.map((m) => [m.id, m]));
  for (const id of localState.selectedMessages) {
    const m = byId.get(id);
    if (m)
      total += m.approxTokens;
  }
  return total;
}
function renderChapterPicker(host, state, send, redraw) {
  const sec = section("Pick messages for a chapter");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Pick uncompressed messages and file them into a chapter yourself. ✓ marks messages already filed.";
  sec.body.appendChild(help);
  const filterRow = document.createElement("div");
  filterRow.className = "lmb-message-filter-row";
  const filterSel = select({
    value: localState.messageFilter,
    options: [
      { value: "uncovered", label: "Uncompressed only" },
      { value: "all", label: "All messages" },
      { value: "covered", label: "Already filed" }
    ],
    onChange: (v) => {
      localState.messageFilter = v ?? "uncovered";
      localState.pickerShown = PICKER_PAGE;
      redraw();
    }
  });
  const query = searchField({
    value: localState.messageQuery,
    placeholder: "Search...",
    onChange: (v) => {
      localState.messageQuery = v.toLowerCase();
      localState.pickerShown = PICKER_PAGE;
      listEl.replaceChildren(...buildRows(state, syncControls, redraw));
      listEl.scrollTop = listEl.scrollHeight;
      syncControls();
    }
  });
  filterRow.append(filterSel, query.wrap);
  sec.body.appendChild(filterRow);
  const counts = document.createElement("div");
  counts.className = "lmb-help";
  const chatId = state.activeChatId;
  const messageById = new Map(state.messages.map((m) => [m.id, m]));
  const allSelectedExcluded = () => {
    if (localState.selectedMessages.size === 0)
      return false;
    for (const id of localState.selectedMessages) {
      const m = messageById.get(id);
      if (!m || !m.excluded)
        return false;
    }
    return true;
  };
  const compressBtn = makeButton("Compress", () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0)
      return;
    send({ type: "create_chapter_range", chatId, messageIds: ids });
    localState.selectedMessages.clear();
    localState.anchorMessageId = null;
    redraw();
  }, { primary: true, disabled: localState.selectedMessages.size === 0 });
  const excludeBtn = makeButton("Exclude", () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0)
      return;
    send({ type: "set_message_excluded", chatId, messageIds: ids, excluded: !allSelectedExcluded() });
  }, { title: "Toggle exclusion for the selected messages. Excluded messages are never hidden, replaced, or summarized, and they split compression. Click again to allow compression." });
  const syncControls = () => {
    const tokens = sumSelectedTokens(state);
    counts.textContent = `${localState.selectedMessages.size} selected (~${formatTokens(tokens)} tokens before)`;
    const empty = localState.selectedMessages.size === 0;
    compressBtn.disabled = empty;
    excludeBtn.disabled = empty;
    excludeBtn.classList.toggle("active", allSelectedExcluded());
  };
  const listEl = document.createElement("div");
  listEl.className = "lmb-message-list";
  listEl.replaceChildren(...buildRows(state, syncControls, redraw));
  sec.body.appendChild(listEl);
  syncControls();
  const hintRow = document.createElement("div");
  hintRow.className = "lmb-help";
  hintRow.style.display = "flex";
  hintRow.style.justifyContent = "space-between";
  hintRow.style.gap = "10px";
  const hint = document.createElement("span");
  hint.textContent = "Shift-click or long-press selects a range";
  hintRow.append(counts, hint);
  sec.body.appendChild(hintRow);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(compressBtn, makeButton("Pick uncompressed", () => {
    const visible = filterMessages(state).filter((m) => !m.covered && !m.excluded);
    localState.selectedMessages = new Set(visible.map((m) => m.id));
    redraw();
  }), excludeBtn, makeButton("Clear", () => {
    localState.selectedMessages.clear();
    localState.anchorMessageId = null;
    redraw();
  }));
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
  listEl.scrollTop = listEl.scrollHeight;
}
function buildRows(state, onToggle, redraw) {
  const filtered = filterMessages(state);
  if (filtered.length === 0) {
    return [textNode("No messages match", "lmb-empty")];
  }
  const visible = filtered.slice(-localState.pickerShown);
  const rows = [];
  if (filtered.length > visible.length) {
    const older = filtered.length - visible.length;
    const more = makeButton(`Show older (${older})`, () => {
      localState.pickerShown += PICKER_PAGE;
      redraw();
    }, { small: true });
    const wrap = document.createElement("div");
    wrap.className = "lmb-actions lmb-picker-more";
    wrap.appendChild(more);
    rows.push(wrap);
  }
  for (const m of visible)
    rows.push(buildMessageRow(m, state, onToggle, redraw));
  return rows;
}
function buildMessageRow(m, state, onToggle, redraw) {
  const row = document.createElement("label");
  row.className = `lmb-message-row${m.covered ? " covered" : ""}${m.excluded ? " excluded" : ""}${localState.selectedMessages.has(m.id) ? " selected" : ""}`;
  row.title = "Shift+click (or long-press on touch) to select a range";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = localState.selectedMessages.has(m.id);
  cb.disabled = m.covered && !m.excluded;
  const triggerRangeFromAnchor = () => {
    const anchorId = localState.anchorMessageId;
    if (!anchorId || anchorId === m.id)
      return false;
    const newState = !localState.selectedMessages.has(m.id);
    applyRangeSelection(state, anchorId, m.id, newState);
    localState.anchorMessageId = m.id;
    redraw();
    return true;
  };
  row.addEventListener("click", (e) => {
    if (localState.suppressNextClick) {
      localState.suppressNextClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const mouseEvent = e;
    if (!mouseEvent.shiftKey || m.covered)
      return;
    if (!triggerRangeFromAnchor())
      return;
    e.preventDefault();
  });
  row.addEventListener("pointerdown", (e) => {
    const pe = e;
    if (pe.pointerType !== "touch" || m.covered)
      return;
    const startX = pe.clientX;
    const startY = pe.clientY;
    let timer = null;
    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerup", cleanup);
      row.removeEventListener("pointercancel", cleanup);
      row.removeEventListener("pointerleave", cleanup);
    };
    const onMove = (mv) => {
      const m2 = mv;
      if (Math.abs(m2.clientX - startX) > LONG_PRESS_MOVE_PX || Math.abs(m2.clientY - startY) > LONG_PRESS_MOVE_PX)
        cleanup();
    };
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerup", cleanup);
    row.addEventListener("pointercancel", cleanup);
    row.addEventListener("pointerleave", cleanup);
    timer = setTimeout(() => {
      timer = null;
      cleanup();
      if (!triggerRangeFromAnchor())
        return;
      localState.suppressNextClick = true;
      setTimeout(() => {
        localState.suppressNextClick = false;
      }, 150);
      try {
        navigator.vibrate?.(30);
      } catch {}
    }, LONG_PRESS_MS);
  });
  cb.addEventListener("change", () => {
    if (cb.checked)
      localState.selectedMessages.add(m.id);
    else
      localState.selectedMessages.delete(m.id);
    localState.anchorMessageId = m.id;
    row.classList.toggle("selected", cb.checked);
    onToggle();
  });
  const idxSpan = document.createElement("span");
  idxSpan.className = "lmb-msg-role";
  idxSpan.textContent = `#${m.indexInChat + 1}`;
  const roleSpan = document.createElement("span");
  roleSpan.className = "lmb-msg-role";
  roleSpan.style.opacity = "0.5";
  roleSpan.textContent = m.role.slice(0, 4).toUpperCase();
  const preview = document.createElement("span");
  preview.className = "lmb-msg-preview";
  preview.textContent = m.preview || "(empty)";
  const icons = document.createElement("span");
  icons.className = "lmb-msg-icons";
  if (m.covered && !m.excluded) {
    const filed = document.createElement("span");
    filed.title = "Already filed into a chapter, arc, or volume";
    filed.className = "lmb-msg-filed";
    filed.textContent = "✓";
    icons.appendChild(filed);
  }
  if (m.excluded) {
    const ex = document.createElement("span");
    ex.title = "Excluded - never hidden, replaced, or summarized";
    ex.className = "lmb-msg-excluded-badge";
    ex.textContent = "⊘";
    icons.appendChild(ex);
  }
  if (m.hidden) {
    const icon = document.createElement("span");
    icon.title = "Hidden in chat";
    icon.innerHTML = HIDDEN_ICON;
    icons.appendChild(icon);
  }
  row.append(cb, idxSpan, roleSpan, preview, icons);
  return row;
}
function applyRangeSelection(state, anchorId, targetId, newState) {
  const visible = filterMessages(state);
  const anchorIdx = visible.findIndex((m) => m.id === anchorId);
  const targetIdx = visible.findIndex((m) => m.id === targetId);
  if (anchorIdx === -1 || targetIdx === -1)
    return;
  const [from, to] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
  for (let i = from;i <= to; i++) {
    const m = visible[i];
    if (!m || m.covered || m.excluded)
      continue;
    if (newState)
      localState.selectedMessages.add(m.id);
    else
      localState.selectedMessages.delete(m.id);
  }
}
function renderArcPicker(host, state, send, redraw) {
  const sec = section("Bind chapters into an arc");
  const bindable = state.chapters.filter((ch) => ch.active);
  if (bindable.length === 0) {
    sec.body.appendChild(textNode("Memoria has not filed any chapters yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const list = document.createElement("div");
  list.className = "lmb-multiselect";
  const arcCounts = document.createElement("div");
  arcCounts.className = "lmb-help";
  const updateArcCounts = () => {
    let before = 0;
    for (const ch of state.chapters) {
      if (!localState.selectedChapters.has(ch.entryId))
        continue;
      before += ch.sourceTokensInput > 0 ? ch.sourceTokensInput : ch.contentTokens;
    }
    arcCounts.textContent = `${localState.selectedChapters.size} selected (~${formatTokens(before)} tokens before)`;
  };
  for (const ch of bindable) {
    const row = document.createElement("label");
    row.className = "lmb-multiselect-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = localState.selectedChapters.has(ch.entryId);
    cb.addEventListener("change", () => {
      if (cb.checked)
        localState.selectedChapters.add(ch.entryId);
      else
        localState.selectedChapters.delete(ch.entryId);
      updateArcCounts();
    });
    const text = document.createElement("span");
    const range = ch.meta.firstMsgIdx !== undefined && ch.meta.lastMsgIdx !== undefined ? ` (msgs ${ch.meta.firstMsgIdx + 1}-${ch.meta.lastMsgIdx + 1})` : "";
    const tokenStr = ch.sourceTokensInput > 0 ? `${formatTokens(ch.sourceTokensInput)}t→${formatTokens(ch.contentTokens)}t` : `${formatTokens(ch.contentTokens)}t`;
    text.textContent = `${ch.comment || ch.meta.title || ch.entryId.slice(0, 6)}${range} - ${tokenStr}`;
    row.append(cb, text);
    list.appendChild(row);
  }
  sec.body.appendChild(list);
  updateArcCounts();
  sec.body.appendChild(arcCounts);
  const chatId = state.activeChatId;
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton("Bind selected", () => {
    const ids = Array.from(localState.selectedChapters);
    if (ids.length === 0)
      return;
    send({ type: "create_arc_from", chatId, chapterEntryIds: ids });
    localState.selectedChapters.clear();
    redraw();
  }, { primary: true }), makeButton("Select all active", () => {
    localState.selectedChapters = new Set(state.chapters.filter((ch) => ch.active).map((ch) => ch.entryId));
    redraw();
  }), makeButton("Clear", () => {
    localState.selectedChapters.clear();
    redraw();
  }));
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
}
function renderVolumePicker(host, state, send, redraw) {
  const sec = section("Press arcs into a volume");
  const activeArcs = state.arcs.filter((a) => a.active && !a.isRoot);
  if (activeArcs.length === 0) {
    sec.body.appendChild(textNode("Memoria has no unbound arcs to press yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "A volume replaces its source arcs in the prompt, the highest compression tier. Volumes are manual only.";
  sec.body.appendChild(help);
  const list = document.createElement("div");
  list.className = "lmb-multiselect";
  const counts = document.createElement("div");
  counts.className = "lmb-help";
  const updateCounts = () => {
    let before = 0;
    for (const a of activeArcs) {
      if (!localState.selectedArcs.has(a.entryId))
        continue;
      before += a.sourceTokensInput > 0 ? a.sourceTokensInput : a.contentTokens;
    }
    counts.textContent = `${localState.selectedArcs.size} selected (~${formatTokens(before)} tokens before)`;
  };
  for (const arc of activeArcs) {
    const row = document.createElement("label");
    row.className = "lmb-multiselect-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = localState.selectedArcs.has(arc.entryId);
    cb.addEventListener("change", () => {
      if (cb.checked)
        localState.selectedArcs.add(arc.entryId);
      else
        localState.selectedArcs.delete(arc.entryId);
      updateCounts();
    });
    const text = document.createElement("span");
    const range = arc.meta.firstMsgIdx !== undefined && arc.meta.lastMsgIdx !== undefined ? ` (msgs ${arc.meta.firstMsgIdx + 1}-${arc.meta.lastMsgIdx + 1})` : "";
    const tokenStr = arc.sourceTokensInput > 0 ? `${formatTokens(arc.sourceTokensInput)}t→${formatTokens(arc.contentTokens)}t` : `${formatTokens(arc.contentTokens)}t`;
    text.textContent = `${arc.comment || arc.meta.title || arc.entryId.slice(0, 6)}${range} - ${tokenStr}`;
    row.append(cb, text);
    list.appendChild(row);
  }
  sec.body.appendChild(list);
  updateCounts();
  sec.body.appendChild(counts);
  const chatId = state.activeChatId;
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton("Press selected", () => {
    const ids = Array.from(localState.selectedArcs);
    if (ids.length === 0)
      return;
    send({ type: "create_volume_from", chatId, arcEntryIds: ids });
    localState.selectedArcs.clear();
    redraw();
  }, { primary: true }), makeButton("Select all active", () => {
    localState.selectedArcs = new Set(activeArcs.map((a) => a.entryId));
    redraw();
  }), makeButton("Clear", () => {
    localState.selectedArcs.clear();
    redraw();
  }));
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
}
function renderContinuity(host, state, ctx, send) {
  const chatId = state.activeChatId;
  const hasOwn = state.chapters.some((ch) => !ch.isRoot && !ch.isGhost) || state.arcs.some((a) => !a.isRoot) || state.volumes.some((v) => !v.isRoot);
  const hasRoot = state.rootEntryCount > 0;
  const candidates = state.availableRoots;
  if (!hasRoot && candidates.length === 0) {
    const sec2 = section("Continuity (root)");
    sec2.body.appendChild(textNode("No other chat has memories to inherit from yet", "lmb-empty"));
    host.appendChild(sec2.wrap);
    return;
  }
  const sec = section("Continuity (root)");
  if (hasRoot) {
    const status = document.createElement("div");
    status.className = "lmb-help";
    const originName = state.rootOriginName || state.rootOrigin?.slice(0, 8) || "another chat";
    status.textContent = `Inherited from ${originName}: ${state.rootEntryCount} memor${state.rootEntryCount === 1 ? "y" : "ies"}, injected before the greeting.`;
    sec.body.appendChild(status);
    const rootEntries = [
      ...state.volumes.filter((v) => v.isRoot),
      ...state.arcs.filter((a) => a.isRoot),
      ...state.chapters.filter((ch) => ch.isRoot)
    ];
    if (rootEntries.length) {
      const list = document.createElement("div");
      list.className = "lmb-multiselect";
      for (const e of rootEntries) {
        const rowEl = document.createElement("div");
        rowEl.className = "lmb-multiselect-row";
        rowEl.style.opacity = "0.75";
        const tag = e.meta.tier === 3 ? "VOL" : e.meta.tier === 2 ? "ARC" : "CH";
        rowEl.textContent = `[${tag}] ${e.comment || e.meta.title || e.entryId.slice(0, 6)} (${formatTokens(e.contentTokens)}t)`;
        list.appendChild(rowEl);
      }
      sec.body.appendChild(list);
    }
    const detachRow = document.createElement("div");
    detachRow.className = "lmb-actions";
    detachRow.appendChild(makeButton("Detach root", async () => {
      const ok = await confirmDelete(ctx, "Detach inherited memories?", "Memoria will remove the inherited memories from this chat. Your own chapters and arcs stay.");
      if (ok)
        send({ type: "detach_root", chatId });
    }, { small: true, danger: true, title: "Remove the inherited root memories from this chat" }));
    sec.body.appendChild(detachRow);
  }
  if (candidates.length > 0) {
    const help = document.createElement("div");
    help.className = "lmb-help";
    help.textContent = hasOwn ? "This chat already has its own memories. Rebuilding deletes them and re-summarizes on top of the chosen root." : "Seed this chat with another chat's memories. They inject as a frozen prologue before the greeting.";
    sec.body.appendChild(help);
    const row = document.createElement("div");
    row.className = "lmb-actions";
    let actionBtn;
    const picker = select({
      value: localState.rebaseSourceId,
      ariaLabel: "Source chat to inherit memories from",
      options: [
        { value: "", label: "Pick a source chat..." },
        ...candidates.map((cand) => ({ value: cand.chatId, label: `${cand.chatName} (${cand.entryCount})` }))
      ],
      onChange: (v) => {
        localState.rebaseSourceId = v;
        actionBtn.disabled = !v;
      }
    });
    row.appendChild(picker);
    if (hasOwn) {
      actionBtn = makeButton("Rebuild from...", async () => {
        const sourceChatId = picker.value;
        if (!sourceChatId)
          return;
        const ok = await confirmDelete(ctx, "Rebuild from root?", "Memoria will DELETE this chat's existing chapters and arcs, seed the chosen root, then re-summarize this chat from scratch. This cannot be undone.");
        if (ok)
          send({ type: "rebuild_root", chatId, sourceChatId });
      }, { disabled: !localState.rebaseSourceId, title: "Replaces this chat's memories with the chosen root (asks to confirm)" });
    } else {
      actionBtn = makeButton("Rebase", () => {
        const sourceChatId = picker.value;
        if (!sourceChatId)
          return;
        send({ type: "rebase_root", chatId, sourceChatId });
      }, { primary: true, disabled: !localState.rebaseSourceId, title: "Seed this chat with the chosen chat's memories" });
    }
    row.appendChild(actionBtn);
    sec.body.appendChild(row);
  }
  host.appendChild(sec.wrap);
}
function renderMaintenance(host, state, ctx, send) {
  const chatId = state.activeChatId;
  const disabled = state.busy.length > 0 || !state.settings.enabled;
  const sec = section("Maintenance");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Repair tools for when the shelf and the chat drift apart, e.g. after editing entries in the Lorebook drawer.";
  sec.body.appendChild(help);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(makeButton("Re-hide covered", () => send({ type: "resync_hidden", chatId }), {
    disabled,
    title: "Re-apply the exclude-from-context flag on every covered message"
  }), makeButton("Resync visibility", () => send({ type: "resync_visibility", chatId }), {
    disabled,
    title: "Unhide messages whose chapter or arc no longer exists, and re-align hidden state with current coverage"
  }));
  sec.body.appendChild(row);
  const dangerRow = document.createElement("div");
  dangerRow.className = "lmb-actions";
  dangerRow.append(makeButton("Rebuild books", async () => {
    const ok = await confirmDelete(ctx, "Rebuild the shelf?", "Memoria will DELETE every chapter, arc, and volume for this chat, then re-summarize it from scratch. This cannot be undone.");
    if (ok)
      send({ type: "rebuild_books", chatId });
  }, {
    disabled,
    title: "Wipe the shelf and re-summarize this chat from message one"
  }), makeButton("Wipe books", async () => {
    const ok = await confirmDelete(ctx, "Wipe the shelf?", "Memoria will DELETE every chapter, arc, and volume for this chat and let all messages back into the prompt. This cannot be undone.");
    if (ok)
      send({ type: "wipe_books", chatId });
  }, { danger: true, disabled, title: "Delete every LumiBooks entry for this chat" }));
  sec.body.appendChild(dangerRow);
  host.appendChild(sec.wrap);
}
// node_modules/d3-quadtree/src/add.js
function add_default(d) {
  const x = +this._x.call(null, d), y = +this._y.call(null, d);
  return add(this.cover(x, y), x, y, d);
}
function add(tree, x, y, d) {
  if (isNaN(x) || isNaN(y))
    return tree;
  var parent, node = tree._root, leaf = { data: d }, x0 = tree._x0, y0 = tree._y0, x1 = tree._x1, y1 = tree._y1, xm, ym, xp, yp, right, bottom, i, j;
  if (!node)
    return tree._root = leaf, tree;
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right]))
      return parent[i] = leaf, tree;
  }
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp)
    return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | xp >= xm));
  return parent[j] = node, parent[i] = leaf, tree;
}
function addAll(data) {
  var d, i, n = data.length, x, y, xz = new Array(n), yz = new Array(n), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (i = 0;i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d)))
      continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0)
      x0 = x;
    if (x > x1)
      x1 = x;
    if (y < y0)
      y0 = y;
    if (y > y1)
      y1 = y;
  }
  if (x0 > x1 || y0 > y1)
    return this;
  this.cover(x0, y0).cover(x1, y1);
  for (i = 0;i < n; ++i) {
    add(this, xz[i], yz[i], data[i]);
  }
  return this;
}

// node_modules/d3-quadtree/src/cover.js
function cover_default(x, y) {
  if (isNaN(x = +x) || isNaN(y = +y))
    return this;
  var x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1;
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  } else {
    var z = x1 - x0 || 1, node = this._root, parent, i;
    while (x0 > x || x >= x1 || y0 > y || y >= y1) {
      i = (y < y0) << 1 | x < x0;
      parent = new Array(4), parent[i] = node, node = parent, z *= 2;
      switch (i) {
        case 0:
          x1 = x0 + z, y1 = y0 + z;
          break;
        case 1:
          x0 = x1 - z, y1 = y0 + z;
          break;
        case 2:
          x1 = x0 + z, y0 = y1 - z;
          break;
        case 3:
          x0 = x1 - z, y0 = y1 - z;
          break;
      }
    }
    if (this._root && this._root.length)
      this._root = node;
  }
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
}

// node_modules/d3-quadtree/src/data.js
function data_default() {
  var data = [];
  this.visit(function(node) {
    if (!node.length)
      do
        data.push(node.data);
      while (node = node.next);
  });
  return data;
}

// node_modules/d3-quadtree/src/extent.js
function extent_default(_) {
  return arguments.length ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1]) : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
}

// node_modules/d3-quadtree/src/quad.js
function quad_default(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
}

// node_modules/d3-quadtree/src/find.js
function find_default(x, y, radius) {
  var data, x0 = this._x0, y0 = this._y0, x1, y1, x2, y2, x3 = this._x1, y3 = this._y1, quads = [], node = this._root, q, i;
  if (node)
    quads.push(new quad_default(node, x0, y0, x3, y3));
  if (radius == null)
    radius = Infinity;
  else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }
  while (q = quads.pop()) {
    if (!(node = q.node) || (x1 = q.x0) > x3 || (y1 = q.y0) > y3 || (x2 = q.x1) < x0 || (y2 = q.y1) < y0)
      continue;
    if (node.length) {
      var xm = (x1 + x2) / 2, ym = (y1 + y2) / 2;
      quads.push(new quad_default(node[3], xm, ym, x2, y2), new quad_default(node[2], x1, ym, xm, y2), new quad_default(node[1], xm, y1, x2, ym), new quad_default(node[0], x1, y1, xm, ym));
      if (i = (y >= ym) << 1 | x >= xm) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    } else {
      var dx = x - +this._x.call(null, node.data), dy = y - +this._y.call(null, node.data), d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x - d, y0 = y - d;
        x3 = x + d, y3 = y + d;
        data = node.data;
      }
    }
  }
  return data;
}

// node_modules/d3-quadtree/src/remove.js
function remove_default(d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d)))
    return this;
  var parent, node = this._root, retainer, previous, next, x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1, x, y, xm, ym, right, bottom, i, j;
  if (!node)
    return this;
  if (node.length)
    while (true) {
      if (right = x >= (xm = (x0 + x1) / 2))
        x0 = xm;
      else
        x1 = xm;
      if (bottom = y >= (ym = (y0 + y1) / 2))
        y0 = ym;
      else
        y1 = ym;
      if (!(parent = node, node = node[i = bottom << 1 | right]))
        return this;
      if (!node.length)
        break;
      if (parent[i + 1 & 3] || parent[i + 2 & 3] || parent[i + 3 & 3])
        retainer = parent, j = i;
    }
  while (node.data !== d)
    if (!(previous = node, node = node.next))
      return this;
  if (next = node.next)
    delete node.next;
  if (previous)
    return next ? previous.next = next : delete previous.next, this;
  if (!parent)
    return this._root = next, this;
  next ? parent[i] = next : delete parent[i];
  if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
    if (retainer)
      retainer[j] = node;
    else
      this._root = node;
  }
  return this;
}
function removeAll(data) {
  for (var i = 0, n = data.length;i < n; ++i)
    this.remove(data[i]);
  return this;
}

// node_modules/d3-quadtree/src/root.js
function root_default() {
  return this._root;
}

// node_modules/d3-quadtree/src/size.js
function size_default() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length)
      do
        ++size;
      while (node = node.next);
  });
  return size;
}

// node_modules/d3-quadtree/src/visit.js
function visit_default(callback) {
  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
  if (node)
    quads.push(new quad_default(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3])
        quads.push(new quad_default(child, xm, ym, x1, y1));
      if (child = node[2])
        quads.push(new quad_default(child, x0, ym, xm, y1));
      if (child = node[1])
        quads.push(new quad_default(child, xm, y0, x1, ym));
      if (child = node[0])
        quads.push(new quad_default(child, x0, y0, xm, ym));
    }
  }
  return this;
}

// node_modules/d3-quadtree/src/visitAfter.js
function visitAfter_default(callback) {
  var quads = [], next = [], q;
  if (this._root)
    quads.push(new quad_default(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0])
        quads.push(new quad_default(child, x0, y0, xm, ym));
      if (child = node[1])
        quads.push(new quad_default(child, xm, y0, x1, ym));
      if (child = node[2])
        quads.push(new quad_default(child, x0, ym, xm, y1));
      if (child = node[3])
        quads.push(new quad_default(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
}

// node_modules/d3-quadtree/src/x.js
function defaultX(d) {
  return d[0];
}
function x_default(_) {
  return arguments.length ? (this._x = _, this) : this._x;
}

// node_modules/d3-quadtree/src/y.js
function defaultY(d) {
  return d[1];
}
function y_default(_) {
  return arguments.length ? (this._y = _, this) : this._y;
}

// node_modules/d3-quadtree/src/quadtree.js
function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}
function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}
function leaf_copy(leaf) {
  var copy = { data: leaf.data }, next = copy;
  while (leaf = leaf.next)
    next = next.next = { data: leaf.data };
  return copy;
}
var treeProto = quadtree.prototype = Quadtree.prototype;
treeProto.copy = function() {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1), node = this._root, nodes, child;
  if (!node)
    return copy;
  if (!node.length)
    return copy._root = leaf_copy(node), copy;
  nodes = [{ source: node, target: copy._root = new Array(4) }];
  while (node = nodes.pop()) {
    for (var i = 0;i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length)
          nodes.push({ source: child, target: node.target[i] = new Array(4) });
        else
          node.target[i] = leaf_copy(child);
      }
    }
  }
  return copy;
};
treeProto.add = add_default;
treeProto.addAll = addAll;
treeProto.cover = cover_default;
treeProto.data = data_default;
treeProto.extent = extent_default;
treeProto.find = find_default;
treeProto.remove = remove_default;
treeProto.removeAll = removeAll;
treeProto.root = root_default;
treeProto.size = size_default;
treeProto.visit = visit_default;
treeProto.visitAfter = visitAfter_default;
treeProto.x = x_default;
treeProto.y = y_default;
// node_modules/d3-force/src/constant.js
function constant_default(x) {
  return function() {
    return x;
  };
}

// node_modules/d3-force/src/jiggle.js
function jiggle_default(random) {
  return (random() - 0.5) * 0.000001;
}

// node_modules/d3-force/src/collide.js
function x(d) {
  return d.x + d.vx;
}
function y(d) {
  return d.y + d.vy;
}
function collide_default(radius) {
  var nodes, radii, random, strength = 1, iterations = 1;
  if (typeof radius !== "function")
    radius = constant_default(radius == null ? 1 : +radius);
  function force() {
    var i, n = nodes.length, tree, node, xi, yi, ri, ri2;
    for (var k = 0;k < iterations; ++k) {
      tree = quadtree(nodes, x, y).visitAfter(prepare);
      for (i = 0;i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }
    function apply(quad, x0, y0, x1, y1) {
      var { data, r: rj } = quad, r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          var x2 = xi - data.x - data.vx, y2 = yi - data.y - data.vy, l = x2 * x2 + y2 * y2;
          if (l < r * r) {
            if (x2 === 0)
              x2 = jiggle_default(random), l += x2 * x2;
            if (y2 === 0)
              y2 = jiggle_default(random), l += y2 * y2;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x2 *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y2 *= l) * r;
            data.vx -= x2 * (r = 1 - r);
            data.vy -= y2 * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }
  function prepare(quad) {
    if (quad.data)
      return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0;i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length, node;
    radii = new Array(n);
    for (i = 0;i < n; ++i)
      node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }
  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };
  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };
  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : radius;
  };
  return force;
}
// node_modules/d3-force/src/link.js
function index(d) {
  return d.index;
}
function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node)
    throw new Error("node not found: " + nodeId);
  return node;
}
function link_default(links) {
  var id = index, strength = defaultStrength, strengths, distance = constant_default(30), distances, nodes, count, bias, random, iterations = 1;
  if (links == null)
    links = [];
  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }
  function force(alpha) {
    for (var k = 0, n = links.length;k < iterations; ++k) {
      for (var i = 0, link, source, target, x2, y2, l, b;i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x2 = target.x + target.vx - source.x - source.vx || jiggle_default(random);
        y2 = target.y + target.vy - source.y - source.vy || jiggle_default(random);
        l = Math.sqrt(x2 * x2 + y2 * y2);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x2 *= l, y2 *= l;
        target.vx -= x2 * (b = bias[i]);
        target.vy -= y2 * b;
        source.vx += x2 * (b = 1 - b);
        source.vy += y2 * b;
      }
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length, m = links.length, nodeById = new Map(nodes.map((d, i2) => [id(d, i2, nodes), d])), link;
    for (i = 0, count = new Array(n);i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object")
        link.source = find(nodeById, link.source);
      if (typeof link.target !== "object")
        link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }
    for (i = 0, bias = new Array(m);i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }
    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }
  function initializeStrength() {
    if (!nodes)
      return;
    for (var i = 0, n = links.length;i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }
  function initializeDistance() {
    if (!nodes)
      return;
    for (var i = 0, n = links.length;i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }
  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };
  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };
  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default(+_), initializeStrength(), force) : strength;
  };
  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant_default(+_), initializeDistance(), force) : distance;
  };
  return force;
}
// node_modules/d3-dispatch/src/dispatch.js
var noop = { value: () => {} };
function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t;i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t))
      throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}
function Dispatch(_) {
  this._ = _;
}
function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t))
      throw new Error("unknown type: " + t);
    return { type: t, name };
  });
}
Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._, T = parseTypenames(typename + "", _), t, i = -1, n = T.length;
    if (arguments.length < 2) {
      while (++i < n)
        if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name)))
          return t;
      return;
    }
    if (callback != null && typeof callback !== "function")
      throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type)
        _[t] = set(_[t], typename.name, callback);
      else if (callback == null)
        for (t in _)
          _[t] = set(_[t], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _)
      copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0)
      for (var args = new Array(n), i = 0, n, t;i < n; ++i)
        args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type))
      throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type))
      throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  }
};
function get(type, name) {
  for (var i = 0, n = type.length, c;i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}
function set(type, name, callback) {
  for (var i = 0, n = type.length;i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null)
    type.push({ name, value: callback });
  return type;
}
var dispatch_default = dispatch;
// node_modules/d3-timer/src/timer.js
var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
  setTimeout(f, 17);
};
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function")
      throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail)
        taskTail._next = this;
      else
        taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};
function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}
function timerFlush() {
  now();
  ++frame;
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0)
      t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now2 = clock.now(), delay = now2 - clockLast;
  if (delay > pokeDelay)
    clockSkew -= delay, clockLast = now2;
}
function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time)
        time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}
function sleep(time) {
  if (frame)
    return;
  if (timeout)
    timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity)
      timeout = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval)
      interval = clearInterval(interval);
  } else {
    if (!interval)
      clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}
// node_modules/d3-force/src/lcg.js
var a = 1664525;
var c = 1013904223;
var m = 4294967296;
function lcg_default() {
  let s = 1;
  return () => (s = (a * s + c) % m) / m;
}

// node_modules/d3-force/src/simulation.js
function x2(d) {
  return d.x;
}
function y2(d) {
  return d.y;
}
var initialRadius = 10;
var initialAngle = Math.PI * (3 - Math.sqrt(5));
function simulation_default(nodes) {
  var simulation, alpha = 1, alphaMin = 0.001, alphaDecay = 1 - Math.pow(alphaMin, 1 / 300), alphaTarget = 0, velocityDecay = 0.6, forces = new Map, stepper = timer(step), event = dispatch_default("tick", "end"), random = lcg_default();
  if (nodes == null)
    nodes = [];
  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }
  function tick(iterations) {
    var i, n = nodes.length, node;
    if (iterations === undefined)
      iterations = 1;
    for (var k = 0;k < iterations; ++k) {
      alpha += (alphaTarget - alpha) * alphaDecay;
      forces.forEach(function(force) {
        force(alpha);
      });
      for (i = 0;i < n; ++i) {
        node = nodes[i];
        if (node.fx == null)
          node.x += node.vx *= velocityDecay;
        else
          node.x = node.fx, node.vx = 0;
        if (node.fy == null)
          node.y += node.vy *= velocityDecay;
        else
          node.y = node.fy, node.vy = 0;
      }
    }
    return simulation;
  }
  function initializeNodes() {
    for (var i = 0, n = nodes.length, node;i < n; ++i) {
      node = nodes[i], node.index = i;
      if (node.fx != null)
        node.x = node.fx;
      if (node.fy != null)
        node.y = node.fy;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(0.5 + i), angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }
  function initializeForce(force) {
    if (force.initialize)
      force.initialize(nodes, random);
    return force;
  }
  initializeNodes();
  return simulation = {
    tick,
    restart: function() {
      return stepper.restart(step), simulation;
    },
    stop: function() {
      return stepper.stop(), simulation;
    },
    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
    },
    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },
    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },
    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },
    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },
    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },
    randomSource: function(_) {
      return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
    },
    force: function(name, _) {
      return arguments.length > 1 ? (_ == null ? forces.delete(name) : forces.set(name, initializeForce(_)), simulation) : forces.get(name);
    },
    find: function(x3, y3, radius) {
      var i = 0, n = nodes.length, dx, dy, d2, node, closest;
      if (radius == null)
        radius = Infinity;
      else
        radius *= radius;
      for (i = 0;i < n; ++i) {
        node = nodes[i];
        dx = x3 - node.x;
        dy = y3 - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius)
          closest = node, radius = d2;
      }
      return closest;
    },
    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
}

// node_modules/d3-force/src/manyBody.js
function manyBody_default() {
  var nodes, node, random, alpha, strength = constant_default(-30), strengths, distanceMin2 = 1, distanceMax2 = Infinity, theta2 = 0.81;
  function force(_) {
    var i, n = nodes.length, tree = quadtree(nodes, x2, y2).visitAfter(accumulate);
    for (alpha = _, i = 0;i < n; ++i)
      node = nodes[i], tree.visit(apply);
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length, node2;
    strengths = new Array(n);
    for (i = 0;i < n; ++i)
      node2 = nodes[i], strengths[node2.index] = +strength(node2, i, nodes);
  }
  function accumulate(quad) {
    var strength2 = 0, q, c2, weight = 0, x3, y3, i;
    if (quad.length) {
      for (x3 = y3 = i = 0;i < 4; ++i) {
        if ((q = quad[i]) && (c2 = Math.abs(q.value))) {
          strength2 += q.value, weight += c2, x3 += c2 * q.x, y3 += c2 * q.y;
        }
      }
      quad.x = x3 / weight;
      quad.y = y3 / weight;
    } else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do
        strength2 += strengths[q.data.index];
      while (q = q.next);
    }
    quad.value = strength2;
  }
  function apply(quad, x1, _, x22) {
    if (!quad.value)
      return true;
    var x3 = quad.x - node.x, y3 = quad.y - node.y, w = x22 - x1, l = x3 * x3 + y3 * y3;
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x3 === 0)
          x3 = jiggle_default(random), l += x3 * x3;
        if (y3 === 0)
          y3 = jiggle_default(random), l += y3 * y3;
        if (l < distanceMin2)
          l = Math.sqrt(distanceMin2 * l);
        node.vx += x3 * quad.value * alpha / l;
        node.vy += y3 * quad.value * alpha / l;
      }
      return true;
    } else if (quad.length || l >= distanceMax2)
      return;
    if (quad.data !== node || quad.next) {
      if (x3 === 0)
        x3 = jiggle_default(random), l += x3 * x3;
      if (y3 === 0)
        y3 = jiggle_default(random), l += y3 * y3;
      if (l < distanceMin2)
        l = Math.sqrt(distanceMin2 * l);
    }
    do
      if (quad.data !== node) {
        w = strengths[quad.data.index] * alpha / l;
        node.vx += x3 * w;
        node.vy += y3 * w;
      }
    while (quad = quad.next);
  }
  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : strength;
  };
  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };
  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };
  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };
  return force;
}
// node_modules/d3-force/src/x.js
function x_default2(x3) {
  var strength = constant_default(0.1), nodes, strengths, xz;
  if (typeof x3 !== "function")
    x3 = constant_default(x3 == null ? 0 : +x3);
  function force(alpha) {
    for (var i = 0, n = nodes.length, node;i < n; ++i) {
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0;i < n; ++i) {
      strengths[i] = isNaN(xz[i] = +x3(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }
  force.initialize = function(_) {
    nodes = _;
    initialize();
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : strength;
  };
  force.x = function(_) {
    return arguments.length ? (x3 = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : x3;
  };
  return force;
}
// node_modules/d3-force/src/y.js
function y_default2(y3) {
  var strength = constant_default(0.1), nodes, strengths, yz;
  if (typeof y3 !== "function")
    y3 = constant_default(y3 == null ? 0 : +y3);
  function force(alpha) {
    for (var i = 0, n = nodes.length, node;i < n; ++i) {
      node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i, n = nodes.length;
    strengths = new Array(n);
    yz = new Array(n);
    for (i = 0;i < n; ++i) {
      strengths[i] = isNaN(yz[i] = +y3(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }
  force.initialize = function(_) {
    nodes = _;
    initialize();
  };
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : strength;
  };
  force.y = function(_) {
    return arguments.length ? (y3 = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : y3;
  };
  return force;
}
// src/ui/tabs/codex-tab.ts
var SUBTABS2 = [
  { key: "overview", label: "Overview" },
  { key: "entities", label: "Entities" },
  { key: "relations", label: "Relations" },
  { key: "timeline", label: "Timeline" },
  { key: "threads", label: "Threads" },
  { key: "lore", label: "Lore" }
];
var ENTITY_GROUPS = [
  { key: "characters", title: "Characters", singular: "character", ns: "char" },
  { key: "locations", title: "Locations", singular: "location", ns: "loc" },
  { key: "things", title: "Things", singular: "thing", ns: "thing" }
];
function objArray(v) {
  if (!Array.isArray(v))
    return [];
  return v.filter((x3) => !!x3 && typeof x3 === "object" && !Array.isArray(x3));
}
function strArray(v) {
  if (!Array.isArray(v))
    return [];
  return v.filter((x3) => typeof x3 === "string");
}
function str(v) {
  return typeof v === "string" ? v : "";
}
function parseCodexFiles(files) {
  const out = {
    characters: [],
    locations: [],
    things: [],
    relations: [],
    events: [],
    threads: [],
    seeds: [],
    world: [],
    knowledge: [],
    broken: []
  };
  const read = (key) => {
    const raw = files[key];
    if (raw === undefined)
      return null;
    try {
      const v = JSON.parse(raw);
      return v && typeof v === "object" && !Array.isArray(v) ? v : null;
    } catch {
      out.broken.push(`${key}.json`);
      return null;
    }
  };
  for (const key of ["characters", "locations", "things"]) {
    const v = read(key);
    if (v)
      out[key] = objArray(v["entities"]);
  }
  const rel = read("relations");
  if (rel)
    out.relations = objArray(rel["relations"]);
  const tl = read("timeline");
  if (tl)
    out.events = objArray(tl["events"]);
  const th = read("threads");
  if (th) {
    out.threads = objArray(th["threads"]);
    out.seeds = strArray(th["seeds"]);
  }
  const wo = read("world");
  if (wo)
    out.world = objArray(wo["entries"]);
  const kn = read("knowledge");
  if (kn)
    out.knowledge = objArray(kn["items"]);
  return out;
}
function makeNameResolver(parsed) {
  const names = new Map;
  for (const list of [parsed.characters, parsed.locations, parsed.things]) {
    for (const e of list) {
      const id = str(e["id"]);
      const name = str(e["name"]);
      if (id && name)
        names.set(id, name);
    }
  }
  return (ref) => {
    const hit = names.get(ref);
    if (hit)
      return hit;
    const m2 = /^(?:char|loc|thing):(.+)$/.exec(ref);
    return m2 ? m2[1].replace(/_/g, " ") : ref;
  };
}
var cache = { chatId: null, files: null, parsed: null, pending: false };
var local = {
  subtab: "overview",
  query: "",
  expandedEntity: null,
  entityDraft: null,
  recordDraft: null,
  addFormGroup: null,
  addFormName: "",
  expandedRelations: new Set,
  expandedEvents: new Set,
  expandedWorld: new Set,
  expandedSecrets: new Set,
  relationsView: "list",
  expandedThreads: new Set,
  showFullTimeline: false
};
function clearExpansions() {
  local.expandedRelations.clear();
  local.expandedEvents.clear();
  local.expandedWorld.clear();
  local.expandedSecrets.clear();
  local.expandedThreads.clear();
}
var globalSaveSeq = 0;
var pendingCodexSave = null;
var TIMELINE_RECENT = 12;
function codexWantsRefresh(chatId) {
  return cache.chatId === chatId;
}
var lastArgs = null;
function rerender() {
  const a2 = lastArgs;
  if (!a2 || !a2.host.isConnected)
    return;
  preserveScroll(a2.host, () => renderCodexTab(a2.host, a2.state, a2.ctx, a2.send));
}
function deliverCodexFiles(chatId, files, savedFile, savedSeq) {
  if (cache.chatId === chatId) {
    cache.files = files;
    cache.parsed = parseCodexFiles(files);
    cache.pending = false;
  }
  if (pendingCodexSave && savedFile === pendingCodexSave.file && savedSeq === pendingCodexSave.seq) {
    pendingCodexSave = null;
    local.entityDraft = null;
    local.recordDraft = null;
  }
}
function sendCodexWrite(file, value, state, send) {
  const chatId = state.activeChatId;
  if (!chatId)
    return;
  globalSaveSeq++;
  const seq = globalSaveSeq;
  pendingCodexSave = { file, seq };
  send({
    type: "codex_write_file",
    chatId,
    file,
    content: JSON.stringify(value, null, 2),
    seq
  });
  setTimeout(() => {
    if (pendingCodexSave?.seq !== seq)
      return;
    pendingCodexSave = null;
    let touched = false;
    if (local.entityDraft?.saving) {
      local.entityDraft.saving = false;
      touched = true;
    }
    if (local.recordDraft?.saving) {
      local.recordDraft.saving = false;
      touched = true;
    }
    if (touched)
      rerender();
  }, 15000);
}
function renderCodexTab(host, state, ctx, send) {
  lastArgs = { host, state, ctx, send };
  host.replaceChildren();
  const chatId = state.activeChatId;
  if (!chatId) {
    const empty = section("Knowledge Codex");
    empty.body.appendChild(textNode("Open a chat to consult the codex", "lmb-empty"));
    host.appendChild(empty.wrap);
    return;
  }
  if (cache.chatId !== chatId) {
    cache.chatId = chatId;
    cache.files = null;
    cache.parsed = null;
    cache.pending = false;
    local.query = "";
    local.expandedEntity = null;
    local.entityDraft = null;
    local.recordDraft = null;
    local.addFormGroup = null;
    local.addFormName = "";
    clearExpansions();
    local.showFullTimeline = false;
    pendingCodexSave = null;
  }
  if (!state.codexExists && cache.files) {
    cache.files = null;
    cache.parsed = null;
  }
  if (state.codexExists && !cache.files && !cache.pending) {
    cache.pending = true;
    send({ type: "codex_read", chatId });
  }
  host.appendChild(makeSubtabs(SUBTABS2, local.subtab, (key) => {
    local.subtab = key;
    local.query = "";
    local.recordDraft = null;
    clearExpansions();
    rerender();
    scrollPaneTop(host);
  }));
  const parsed = cache.parsed;
  if (local.subtab === "overview") {
    renderOverview2(host, state, ctx, send, parsed);
    return;
  }
  if (!state.codexExists) {
    const sec = section("Knowledge Codex");
    sec.body.appendChild(textNode(state.activeProfile.codexEnabled ? "No codex yet. Memoria starts writing once enough messages pile up, or use Update now in Overview." : "The codex is off. Enable it in Tuning to start tracking entities, relations, and threads.", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  if (!parsed) {
    const sec = section("Knowledge Codex");
    sec.body.appendChild(textNode("Memoria is fetching the codex files...", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const search = searchField({
    value: local.query,
    placeholder: "Search this section...",
    onChange: (v) => {
      local.query = v.toLowerCase();
      drawPane();
    }
  });
  host.appendChild(search.wrap);
  const paneHost = document.createElement("div");
  paneHost.className = "lmb-pane";
  host.appendChild(paneHost);
  const drawPane = () => {
    paneHost.replaceChildren();
    switch (local.subtab) {
      case "entities":
        renderEntities(paneHost, parsed, state, ctx, send);
        break;
      case "relations":
        renderRelations(paneHost, parsed, state, ctx, send);
        break;
      case "timeline":
        renderTimeline(paneHost, parsed, state, ctx, send);
        break;
      case "threads":
        renderThreads(paneHost, parsed, state, ctx, send);
        break;
      case "lore":
        renderLore(paneHost, parsed, state, ctx, send);
        break;
      default:
        break;
    }
  };
  drawPane();
}
function matches(q, ...bits) {
  if (!q)
    return true;
  for (const b of bits) {
    if (b === undefined)
      continue;
    if (typeof b === "string") {
      if (b.toLowerCase().includes(q))
        return true;
    } else if (b.some((x3) => x3.toLowerCase().includes(q))) {
      return true;
    }
  }
  return false;
}
var BIBLE_TILES = [
  { id: "characters", label: "Characters", files: ["characters"] },
  { id: "places", label: "Places · Things", files: ["locations", "things"] },
  { id: "relations", label: "Relations", files: ["relations"] },
  { id: "events", label: "Events", files: ["timeline"] },
  { id: "threads", label: "Threads", files: ["threads"] },
  { id: "lore", label: "Lore", files: ["world", "knowledge"] }
];
function tileCount(parsed, id) {
  switch (id) {
    case "characters":
      return parsed.characters.length;
    case "places":
      return parsed.locations.length + parsed.things.length;
    case "relations":
      return parsed.relations.length;
    case "events":
      return parsed.events.length;
    case "threads":
      return parsed.threads.length;
    case "lore":
      return parsed.world.length + parsed.knowledge.length;
    default:
      return 0;
  }
}
function tileState(state, files) {
  const s = state.codexFileStates?.[files[0]];
  return s === "noInject" || s === "frozen" ? s : "on";
}
var TILE_STATE_LABEL = {
  on: "injected · updated",
  noInject: "not injected · still updated",
  frozen: "frozen · no updates"
};
function renderOverview2(host, state, ctx, send, parsed) {
  const chatId = state.activeChatId;
  const profile = state.activeProfile;
  const sec = section("Story Bible");
  const bits = [];
  bits.push(state.codexExists ? "codex on file" : "no codex yet");
  bits.push(`${state.codexBacklog} message${state.codexBacklog === 1 ? "" : "s"} unindexed`);
  if (state.codexLastRunAt)
    bits.push(`updated ${relativeTime(state.codexLastRunAt)}`);
  sec.body.appendChild(textNode(bits.join(" · "), "lmb-help"));
  if (!profile.codexEnabled) {
    sec.body.appendChild(textNode("The codex agent is off for this profile. Enable it in Tuning → Codex.", "lmb-empty"));
  }
  const busy = state.busy.some((b) => b.kind === "codex" && b.chatId === chatId);
  if (busy) {
    const row2 = document.createElement("div");
    row2.className = "lmb-busy";
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    row2.append(dot, document.createTextNode("Memoria is working on the codex, watch Home for progress"));
    sec.body.appendChild(row2);
  }
  if (parsed) {
    if (parsed.broken.length > 0) {
      sec.body.appendChild(textNode(`Unreadable on disk: ${parsed.broken.join(", ")} - Rebuild codex regenerates them from the story`, "lmb-help"));
    }
    const tiles = document.createElement("div");
    tiles.className = "lmb-tiles";
    for (const def of BIBLE_TILES) {
      tiles.appendChild(renderBibleTile(def, parsed, state, ctx, send, busy));
    }
    sec.body.appendChild(tiles);
    sec.body.appendChild(textNode("Click a record card to cycle it: injected → kept out of the prompt → frozen. Records stay editable in their sections either way.", "lmb-help"));
  }
  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(makeButton("Update now", () => send({ type: "codex_update_now", chatId }), {
    primary: true,
    disabled: busy || !state.settings.enabled || !profile.codexEnabled,
    title: "Consume everything up to the newest message now, ignoring lag and window"
  }), busy ? makeButton("Cancel", () => send({ type: "abort_busy", chatId, kind: "codex" }), {
    danger: true,
    title: "Abort the codex task in flight"
  }) : makeButton("Tidy up", () => send({ type: "codex_tidy", chatId }), {
    disabled: !state.settings.enabled || !profile.codexEnabled || !state.codexExists,
    title: "One LLM pass that rewrites every record to be leaner without losing plot-relevant information"
  }), makeButton("Rebuild codex", async () => {
    const ok = await confirmDelete(ctx, "Rebuild the codex?", "Memoria will erase the story bible and re-read the whole chat from message one. Costs one full backfill of agent runs.");
    if (ok)
      send({ type: "codex_rebuild", chatId });
  }, {
    disabled: busy || !state.settings.enabled || !profile.codexEnabled,
    title: "Wipe and regenerate the whole story bible from the start of the chat"
  }), makeButton("Wipe codex", async () => {
    const ok = await confirmDelete(ctx, "Wipe the codex?", "Memoria will erase every codex record for this chat and start blank on the next update. This cannot be undone.");
    if (ok)
      send({ type: "codex_reset", chatId });
  }, { danger: true, disabled: busy }));
  sec.body.appendChild(row);
  host.appendChild(sec.wrap);
}
function renderBibleTile(def, parsed, state, ctx, send, busy) {
  const chatId = state.activeChatId;
  const st = tileState(state, def.files);
  const stale = def.files.some((f) => state.codexStaleFiles?.includes(f));
  const tokens = state.codexFileTokens ? def.files.reduce((acc, f) => acc + (state.codexFileTokens[f] ?? 0), 0) : def.files.reduce((acc, f) => acc + Math.ceil((cache.files?.[f]?.length ?? 0) / 4), 0);
  const tile = document.createElement("div");
  tile.className = `lmb-tile lmb-bible-tile ${st}${stale ? " stale" : ""}`;
  tile.title = `${TILE_STATE_LABEL[st]}${stale ? " · missed updates while frozen" : ""} - click to cycle`;
  const v = document.createElement("div");
  v.className = "lmb-tile-value";
  v.textContent = String(tileCount(parsed, def.id));
  const l = document.createElement("div");
  l.className = "lmb-tile-label";
  l.textContent = def.label;
  const s = document.createElement("div");
  s.className = "lmb-tile-sub";
  s.textContent = `~${formatTokens(tokens)} tokens`;
  const stateLine = document.createElement("div");
  stateLine.className = "lmb-tile-state";
  stateLine.textContent = `${TILE_STATE_LABEL[st]}${stale ? " · stale" : ""}`;
  tile.append(v, l, s, stateLine);
  const tools = document.createElement("div");
  tools.className = "lmb-tile-tools";
  const tidyBtn = makeButton(busy ? "Cancel" : "Tidy", () => {
    if (busy)
      send({ type: "abort_busy", chatId, kind: "codex" });
    else
      send({ type: "codex_tidy", chatId, files: def.files });
  }, {
    small: true,
    disabled: !busy && (st === "frozen" || !state.settings.enabled || !state.activeProfile.codexEnabled),
    title: busy ? "Abort the codex task in flight" : "Compress just this record with one LLM pass"
  });
  tidyBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(tidyBtn);
  tile.appendChild(tools);
  tile.addEventListener("click", () => {
    cycleTileState(def, st, stale, state, ctx, send);
  });
  return tile;
}
async function cycleTileState(def, st, stale, state, ctx, send) {
  const chatId = state.activeChatId;
  const setAll = (next) => {
    for (const f of def.files)
      send({ type: "codex_set_file_state", chatId, file: f, state: next });
  };
  if (st === "on") {
    setAll("noInject");
    return;
  }
  if (st === "noInject") {
    setAll("frozen");
    return;
  }
  if (stale) {
    let rebuild = false;
    try {
      const r = await ctx.ui.showConfirm({
        title: "This record is out of date",
        message: "Memoria kept updating the story while this record was frozen, so it may be missing recent events. Rebuild the codex from the start of the chat, or just re-enable it as-is?",
        variant: "warning",
        confirmLabel: "Rebuild",
        cancelLabel: "Re-enable as-is"
      });
      rebuild = !!r.confirmed;
    } catch {
      rebuild = window.confirm("This record missed updates while frozen. Rebuild the codex from the start? (Cancel re-enables it as-is)");
    }
    setAll("on");
    if (rebuild)
      send({ type: "codex_rebuild", chatId });
    return;
  }
  setAll("on");
}
var ENTITY_TEXT_FIELDS = ["kind", "role", "status", "significance"];
var ENTITY_LONG_FIELDS = ["appearance", "description", "notes"];
var ENTITY_LIST_FIELDS = ["aliases", "traits", "goals", "ties"];
var ENTITY_KNOWN = new Set(["id", "name", ...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS, ...ENTITY_LIST_FIELDS]);
function entitySearchText(e) {
  const bits = [];
  for (const v of Object.values(e)) {
    if (typeof v === "string")
      bits.push(v);
    else if (Array.isArray(v))
      bits.push(...strArray(v));
  }
  return bits;
}
function slugId(ns, name, taken) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unnamed";
  let id = `${ns}:${base}`;
  let n = 2;
  while (taken.has(id))
    id = `${ns}:${base}_${n++}`;
  return id;
}
function renderEntities(host, parsed, state, ctx, send) {
  const sec = section("Entities");
  sec.body.appendChild(textNode("Click a name to open its sheet. Edits are validated and saved to the codex, Memoria builds on them from her next pass.", "lmb-help"));
  let any = false;
  for (const g of ENTITY_GROUPS) {
    const all = parsed[g.key];
    const list = all.filter((e) => matches(local.query, ...entitySearchText(e)));
    if (all.length > 0)
      any = true;
    const searching = local.query !== "";
    const sub = document.createElement("div");
    sub.className = "lmb-section-title";
    sub.textContent = searching ? `${g.title} · ${list.length} of ${all.length}` : `${g.title} (${all.length})`;
    sec.body.appendChild(sub);
    const grid = document.createElement("div");
    grid.className = "lmb-chipgrid";
    for (const e of list) {
      const id = str(e["id"]) || str(e["name"]);
      const chipEl = document.createElement("button");
      chipEl.type = "button";
      chipEl.className = `lmb-chip${local.expandedEntity === id ? " active" : ""}`;
      chipEl.textContent = str(e["name"]) || id || "?";
      chipEl.addEventListener("click", () => {
        local.expandedEntity = local.expandedEntity === id ? null : id;
        local.entityDraft = null;
        rerender();
      });
      grid.appendChild(chipEl);
    }
    if (!searching) {
      const addChip = document.createElement("button");
      addChip.type = "button";
      addChip.className = "lmb-chip add";
      addChip.textContent = `+ ${g.singular}`;
      addChip.addEventListener("click", () => {
        local.addFormGroup = local.addFormGroup === g.key ? null : g.key;
        local.addFormName = "";
        rerender();
      });
      grid.appendChild(addChip);
    }
    sec.body.appendChild(grid);
    if (local.addFormGroup === g.key) {
      sec.body.appendChild(renderAddForm(g.key, g.ns, parsed));
    }
    const draft = local.entityDraft;
    if (draft && draft.group === g.key) {
      sec.body.appendChild(renderEntityForm(draft, state, send));
    } else {
      const open = all.find((e) => (str(e["id"]) || str(e["name"])) === local.expandedEntity);
      if (open)
        sec.body.appendChild(renderEntityCard(g.key, open, parsed, state, ctx, send));
    }
  }
  if (!any)
    sec.body.appendChild(textNode("No entities recorded yet, add one or let Memoria find them", "lmb-empty"));
  host.appendChild(sec.wrap);
}
function renderAddForm(group, ns, parsed) {
  const row = document.createElement("div");
  row.className = "lmb-add-form";
  const input = textInput({
    value: local.addFormName,
    placeholder: "Name...",
    autoFocus: true,
    onChange: (v) => {
      local.addFormName = v;
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
      submit();
  });
  const submit = () => {
    const name = local.addFormName.trim();
    if (!name)
      return;
    const taken = new Set(parsed[group].map((e) => str(e["id"])));
    const id = slugId(ns, name, taken);
    local.entityDraft = makeDraft(group, { id, name });
    local.expandedEntity = id;
    local.addFormGroup = null;
    local.addFormName = "";
    rerender();
  };
  row.append(input, makeButton("Create", submit, { primary: true, small: true }), makeButton("Cancel", () => {
    local.addFormGroup = null;
    local.addFormName = "";
    rerender();
  }, { small: true }));
  return row;
}
function makeDraft(group, e) {
  const fields = { name: str(e["name"]) };
  for (const f of ENTITY_TEXT_FIELDS)
    fields[f] = str(e[f]);
  for (const f of ENTITY_LONG_FIELDS)
    fields[f] = str(e[f]);
  for (const f of ENTITY_LIST_FIELDS)
    fields[f] = strArray(e[f]).join(", ");
  return { group, id: str(e["id"]), fields, saving: false };
}
function renderEntityCard(group, e, parsed, state, ctx, send) {
  const card = document.createElement("div");
  card.className = "lmb-entity-card";
  const name = document.createElement("div");
  name.className = "lmb-entity-name";
  name.textContent = str(e["name"]) || "?";
  const id = str(e["id"]);
  if (id) {
    const idEl = document.createElement("span");
    idEl.className = "lmb-entity-id";
    idEl.textContent = id;
    name.appendChild(idEl);
  }
  card.appendChild(name);
  const kv = document.createElement("div");
  kv.className = "lmb-kv";
  const addKv = (label, value) => {
    if (!value)
      return;
    const k = document.createElement("div");
    k.className = "lmb-kv-key";
    k.textContent = label;
    const v = document.createElement("div");
    v.className = "lmb-kv-value";
    v.textContent = value;
    kv.append(k, v);
  };
  for (const f of [...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS])
    addKv(f, str(e[f]));
  for (const f of ENTITY_LIST_FIELDS) {
    const list = strArray(e[f]);
    if (list.length)
      addKv(f, list.join(" · "));
  }
  for (const [k, v] of Object.entries(e)) {
    if (ENTITY_KNOWN.has(k))
      continue;
    if (typeof v === "string" && v)
      addKv(k, v);
    else if (typeof v === "number")
      addKv(k, String(v));
    else if (Array.isArray(v))
      addKv(k, strArray(v).join(" · "));
  }
  card.appendChild(kv);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton("Edit sheet", () => {
    local.entityDraft = makeDraft(group, e);
    rerender();
  }, { primary: true, small: true }), makeButton("Delete", async () => {
    const ok = await confirmDelete(ctx, "Delete entity?", `Memoria will remove "${str(e["name"])}" from the codex. References to it elsewhere become plain text.`);
    if (!ok)
      return;
    const next = parsed[group].filter((x3) => str(x3["id"]) !== id);
    sendCodexWrite(group, { entities: next }, state, send);
  }, { danger: true, small: true }));
  card.appendChild(actions);
  return card;
}
function renderEntityForm(draft, state, send) {
  const card = document.createElement("div");
  card.className = "lmb-entity-card editing";
  const name = document.createElement("div");
  name.className = "lmb-entity-name";
  name.textContent = draft.fields["name"] || "New entity";
  const idEl = document.createElement("span");
  idEl.className = "lmb-entity-id";
  idEl.textContent = draft.id;
  name.appendChild(idEl);
  card.appendChild(name);
  const bind = (key, el) => {
    el.addEventListener("input", () => {
      draft.fields[key] = el.value;
    });
  };
  const form = document.createElement("div");
  form.className = "lmb-entity-form";
  const nameField = fieldWrap("Name");
  const nameInput = textInput({ value: draft.fields["name"] ?? "" });
  bind("name", nameInput);
  nameField.appendChild(nameInput);
  form.appendChild(nameField);
  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  for (const f of ENTITY_TEXT_FIELDS) {
    const w = fieldWrap(f);
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    grid.appendChild(w);
  }
  form.appendChild(grid);
  for (const f of ENTITY_LONG_FIELDS) {
    const w = fieldWrap(f);
    const ta = textArea({ value: draft.fields[f] ?? "", rows: 2 });
    bind(f, ta);
    w.appendChild(ta);
    form.appendChild(w);
  }
  const relationsOn = state.activeProfile.codexRelationsTable;
  for (const f of ENTITY_LIST_FIELDS) {
    if (f === "ties" && relationsOn)
      continue;
    const w = fieldWrap(`${f} (comma separated)`);
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    form.appendChild(w);
  }
  card.appendChild(form);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const saveBtn = makeButton(draft.saving ? "Saving..." : "Save", () => {
    if (draft.saving)
      return;
    const parsed = cache.parsed;
    if (!parsed)
      return;
    const entity = buildEntityFromDraft(draft, parsed);
    if (!entity)
      return;
    const list = parsed[draft.group];
    const idx = list.findIndex((x3) => str(x3["id"]) === draft.id);
    const next = idx >= 0 ? [...list.slice(0, idx), entity, ...list.slice(idx + 1)] : [...list, entity];
    draft.saving = true;
    sendCodexWrite(draft.group, { entities: next }, state, send);
    rerender();
  }, { primary: true, small: true, disabled: draft.saving });
  actions.append(saveBtn, makeButton("Cancel", () => {
    local.entityDraft = null;
    rerender();
  }, { small: true, disabled: draft.saving }));
  card.appendChild(actions);
  return card;
}
function fieldWrap(label) {
  const w = document.createElement("div");
  w.className = "lmb-field";
  const l = document.createElement("div");
  l.className = "lmb-field-label";
  l.textContent = label;
  w.appendChild(l);
  return w;
}
function buildEntityFromDraft(draft, parsed) {
  const name = (draft.fields["name"] ?? "").trim();
  if (!name)
    return null;
  const orig = parsed[draft.group].find((x3) => str(x3["id"]) === draft.id);
  const out = {};
  if (orig) {
    for (const [k, v] of Object.entries(orig)) {
      if (!ENTITY_KNOWN.has(k))
        out[k] = v;
    }
  }
  out["id"] = draft.id;
  out["name"] = name;
  for (const f of [...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS]) {
    const v = (draft.fields[f] ?? "").trim();
    if (v)
      out[f] = v;
  }
  for (const f of ENTITY_LIST_FIELDS) {
    const items = (draft.fields[f] ?? "").split(/[,\n]/).map((x3) => x3.trim()).filter(Boolean);
    if (items.length)
      out[f] = items;
  }
  return out;
}
function splitLines(v) {
  return v.split(/\n/).map((x3) => x3.trim()).filter(Boolean);
}
function splitComma(v) {
  return v.split(/[,\n]/).map((x3) => x3.trim()).filter(Boolean);
}
function ensureRefDatalist(parsed) {
  const ID = "lmb-entity-refs";
  document.getElementById(ID)?.remove();
  const dl = document.createElement("datalist");
  dl.id = ID;
  for (const list of [parsed.characters, parsed.locations, parsed.things]) {
    for (const e of list) {
      const id = str(e["id"]);
      if (!id)
        continue;
      const opt = document.createElement("option");
      opt.value = id;
      opt.label = str(e["name"]);
      dl.appendChild(opt);
    }
  }
  document.body.appendChild(dl);
  return ID;
}
function renderRecordForm(title, specs, draft, refListId, onSave) {
  const card = document.createElement("div");
  card.className = "lmb-entity-card editing";
  const head = document.createElement("div");
  head.className = "lmb-entity-name";
  head.textContent = title;
  card.appendChild(head);
  const form = document.createElement("div");
  form.className = "lmb-entity-form";
  for (const spec of specs) {
    const w = fieldWrap(spec.label);
    let el;
    if (spec.widget === "select") {
      el = select({
        value: draft.fields[spec.key] ?? spec.options?.[0]?.value ?? "",
        options: spec.options ?? [],
        onChange: (v) => {
          draft.fields[spec.key] = v;
        }
      });
    } else if (spec.widget === "input") {
      el = textInput({ value: draft.fields[spec.key] ?? "", placeholder: spec.placeholder });
      if (spec.refList && refListId)
        el.setAttribute("list", refListId);
      el.addEventListener("input", () => {
        draft.fields[spec.key] = el.value;
      });
    } else {
      el = textArea({ value: draft.fields[spec.key] ?? "", rows: spec.widget === "lines" ? 3 : 2, placeholder: spec.placeholder });
      el.addEventListener("input", () => {
        draft.fields[spec.key] = el.value;
      });
    }
    w.appendChild(el);
    form.appendChild(w);
  }
  card.appendChild(form);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton(draft.saving ? "Saving..." : "Save", () => {
    if (!draft.saving)
      onSave();
  }, { primary: true, small: true, disabled: draft.saving }), makeButton("Cancel", () => {
    local.recordDraft = null;
    rerender();
  }, { small: true, disabled: draft.saving }));
  card.appendChild(actions);
  return card;
}
function recordItemActions(onEdit, onDelete, ctx, deleteMessage) {
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(makeButton("Edit", onEdit, { small: true }), makeButton("Delete", async () => {
    const ok = await confirmDelete(ctx, "Delete?", deleteMessage);
    if (ok)
      onDelete();
  }, { small: true, danger: true }));
  return actions;
}
function relationSearchText(r, nameOf) {
  const bits = [str(r["kind"]), str(r["state"]), ...strArray(r["history"])];
  if (r["type"] === "group")
    bits.push(...strArray(r["members"]).map(nameOf));
  else
    bits.push(nameOf(str(r["a"])), nameOf(str(r["b"])));
  return bits;
}
function relationDraftFrom(r, index2) {
  return {
    kind: "relation",
    index: index2,
    saving: false,
    fields: {
      type: r?.["type"] === "group" ? "group" : "pair",
      a: str(r?.["a"]),
      b: str(r?.["b"]),
      members: strArray(r?.["members"]).join(", "),
      kind: str(r?.["kind"]),
      state: str(r?.["state"]),
      history: strArray(r?.["history"]).join(`
`)
    }
  };
}
function buildRelationFromDraft(d) {
  const kind = (d.fields["kind"] ?? "").trim();
  const stateText = (d.fields["state"] ?? "").trim();
  if (!kind || !stateText)
    return null;
  const history = splitLines(d.fields["history"] ?? "");
  if (d.fields["type"] === "group") {
    const members = splitComma(d.fields["members"] ?? "");
    if (members.length < 2)
      return null;
    return { type: "group", kind, members, state: stateText, ...history.length ? { history } : {} };
  }
  const a2 = (d.fields["a"] ?? "").trim();
  const b = (d.fields["b"] ?? "").trim();
  if (!a2 || !b)
    return null;
  return { type: "pair", a: a2, b, kind, state: stateText, ...history.length ? { history } : {} };
}
function saveRelationDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const rel = buildRelationFromDraft(d);
  if (!rel)
    return;
  const next = d.index >= 0 ? [...parsed.relations.slice(0, d.index), rel, ...parsed.relations.slice(d.index + 1)] : [...parsed.relations, rel];
  d.saving = true;
  sendCodexWrite("relations", { relations: next }, state, send);
  rerender();
}
function relationFormEl(draft, refListId, state, send) {
  const isGroup = draft.fields["type"] === "group";
  const specs = [
    { key: "type", label: "Type", widget: "select", options: [{ value: "pair", label: "pair (a → b)" }, { value: "group", label: "group" }] },
    ...isGroup ? [{ key: "members", label: "Members (comma separated refs)", widget: "input", refList: true, placeholder: "char:elias, char:wren" }] : [
      { key: "a", label: "From (a)", widget: "input", refList: true, placeholder: "char:elias" },
      { key: "b", label: "To (b)", widget: "input", refList: true, placeholder: "char:wren" }
    ],
    { key: "kind", label: "Kind", widget: "input", placeholder: "bond, owns, at, rival..." },
    { key: "state", label: "State", widget: "textarea", placeholder: "loves her, hides it" },
    { key: "history", label: "History (one per line)", widget: "lines", placeholder: "day 12: she saw him kill" }
  ];
  const form = renderRecordForm(draft.index >= 0 ? "Edit relation" : "New relation", specs, draft, refListId, () => saveRelationDraft(draft, state, send));
  form.querySelector("select")?.addEventListener("change", () => rerender());
  return form;
}
function renderRelations(host, parsed, state, ctx, send) {
  const sec = section("Relations");
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const relationsOn = state.activeProfile.codexRelationsTable;
  const viewRow = document.createElement("div");
  viewRow.className = "lmb-actions";
  viewRow.append(makeButton("List", () => {
    if (local.relationsView === "list")
      return;
    local.relationsView = "list";
    local.recordDraft = null;
    rerender();
  }, { small: true }), makeButton("Graph", () => {
    if (local.relationsView === "graph")
      return;
    local.relationsView = "graph";
    local.recordDraft = null;
    rerender();
  }, { small: true }));
  viewRow.children[local.relationsView === "list" ? 0 : 1].classList.add("active");
  if (relationsOn && local.relationsView === "list") {
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    viewRow.append(spacer, makeButton("+ Relation", () => {
      local.recordDraft = relationDraftFrom(null, -1);
      rerender();
    }, { small: true, primary: true }));
  }
  sec.body.appendChild(viewRow);
  const draft = local.recordDraft;
  if (draft?.kind === "relation" && draft.index === -1) {
    sec.body.appendChild(relationFormEl(draft, refListId, state, send));
  }
  if (parsed.relations.length === 0) {
    sec.body.appendChild(textNode(relationsOn ? "No relations recorded yet, add one or let Memoria find them." : "The relations table is off for this profile, connections live as ties on each entity sheet.", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  if (local.relationsView === "graph") {
    renderRelationGraph(sec.body, parsed, nameOf);
    host.appendChild(sec.wrap);
    return;
  }
  const list = document.createElement("div");
  list.className = "lmb-relation-list";
  let shown = 0;
  parsed.relations.forEach((r, i) => {
    if (!matches(local.query, ...relationSearchText(r, nameOf)))
      return;
    shown++;
    if (draft?.kind === "relation" && draft.index === i) {
      list.appendChild(relationFormEl(draft, refListId, state, send));
      return;
    }
    const expanded = local.expandedRelations.has(i);
    const row = document.createElement("div");
    row.className = "lmb-relation";
    const head = document.createElement("button");
    head.type = "button";
    head.className = "lmb-record-head";
    const names = document.createElement("span");
    names.className = "lmb-relation-names lmb-grow";
    if (r["type"] === "group") {
      names.textContent = strArray(r["members"]).map(nameOf).join(" · ");
    } else {
      names.append(document.createTextNode(nameOf(str(r["a"]))), arrowSpan(), document.createTextNode(nameOf(str(r["b"]))));
    }
    const kind = str(r["kind"]);
    head.appendChild(names);
    if (kind) {
      const tag = document.createElement("span");
      tag.className = "lmb-entry-tag";
      tag.textContent = kind;
      head.appendChild(tag);
    }
    const chevron = document.createElement("span");
    chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
    head.appendChild(chevron);
    head.addEventListener("click", () => {
      if (expanded)
        local.expandedRelations.delete(i);
      else
        local.expandedRelations.add(i);
      rerender();
    });
    row.appendChild(head);
    const stateText = str(r["state"]);
    if (stateText)
      row.appendChild(textNode(stateText, "lmb-relation-state"));
    if (expanded) {
      const history = strArray(r["history"]);
      if (history.length) {
        const ul = document.createElement("ul");
        ul.className = "lmb-history";
        for (const h of history) {
          const li = document.createElement("li");
          li.textContent = h;
          ul.appendChild(li);
        }
        row.appendChild(ul);
      }
      row.appendChild(recordItemActions(() => {
        local.recordDraft = relationDraftFrom(r, i);
        rerender();
      }, () => {
        const next = parsed.relations.filter((_, j) => j !== i);
        sendCodexWrite("relations", { relations: next }, state, send);
      }, ctx, "Memoria will remove this relation from the codex."));
    }
    list.appendChild(row);
  });
  if (shown === 0) {
    sec.body.appendChild(textNode("No relation matches the search", "lmb-empty"));
  } else {
    sec.body.appendChild(list);
  }
  host.appendChild(sec.wrap);
}
function arrowSpan() {
  const s = document.createElement("span");
  s.className = "lmb-relation-arrow";
  s.textContent = "→";
  return s;
}
var GRAPH_W = 520;
var GRAPH_H = 360;
var GRAPH_PAD = 34;
var NODE_CLEAR = 14;
var SVG_NS = "http://www.w3.org/2000/svg";
function nsOf(ref) {
  if (ref.startsWith("char:"))
    return "char";
  if (ref.startsWith("loc:"))
    return "loc";
  if (ref.startsWith("thing:"))
    return "thing";
  return "other";
}
function buildGraph(parsed, nameOf) {
  const nodeIds = new Set;
  const raw = [];
  for (const r of parsed.relations) {
    if (!matches(local.query, ...relationSearchText(r, nameOf)))
      continue;
    const kind = str(r["kind"]);
    const stateText = str(r["state"]);
    if (r["type"] === "group") {
      const members = strArray(r["members"]);
      for (let i = 0;i < members.length; i++) {
        for (let j = i + 1;j < members.length; j++) {
          raw.push({ a: members[i], b: members[j], kind, state: stateText, directed: false, group: true });
        }
      }
      members.forEach((m2) => nodeIds.add(m2));
    } else {
      const a2 = str(r["a"]);
      const b = str(r["b"]);
      if (!a2 || !b)
        continue;
      raw.push({ a: a2, b, kind, state: stateText, directed: true, group: false });
      nodeIds.add(a2);
      nodeIds.add(b);
    }
  }
  const laneCounts = new Map;
  const pairKey = (a2, b) => a2 < b ? `${a2}\x00${b}` : `${b}\x00${a2}`;
  for (const e of raw)
    laneCounts.set(pairKey(e.a, e.b), (laneCounts.get(pairKey(e.a, e.b)) ?? 0) + 1);
  const laneUsed = new Map;
  const edges = raw.map((e) => {
    const key = pairKey(e.a, e.b);
    const lane = laneUsed.get(key) ?? 0;
    laneUsed.set(key, lane + 1);
    return { ...e, lane, lanes: laneCounts.get(key) ?? 1 };
  });
  const nodes = [...nodeIds].map((id) => ({
    id,
    name: nameOf(id),
    ns: nsOf(id),
    x: NaN,
    y: NaN
  }));
  return { nodes, edges };
}
function layoutGraph(nodes, edges) {
  if (nodes.length === 0)
    return;
  const ids = new Set(nodes.map((n) => n.id));
  const links = edges.filter((e) => ids.has(e.a) && ids.has(e.b) && e.a !== e.b).map((e) => ({ source: e.a, target: e.b }));
  const sim = simulation_default(nodes).force("link", link_default(links).id((d) => d.id).distance(85).strength(0.55)).force("charge", manyBody_default().strength(-220)).force("collide", collide_default(30)).force("x", x_default2(GRAPH_W / 2).strength(0.05)).force("y", y_default2(GRAPH_H / 2).strength(0.09)).stop();
  sim.tick(300);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  }
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const labelPad = 10;
  const scale = Math.min((GRAPH_W - GRAPH_PAD * 2) / spanX, (GRAPH_H - GRAPH_PAD * 2 - labelPad) / spanY, 2.1);
  const offX = (GRAPH_W - spanX * scale) / 2 - minX * scale;
  const offY = (GRAPH_H - labelPad - spanY * scale) / 2 - minY * scale;
  for (const n of nodes) {
    n.x = n.x * scale + offX;
    n.y = n.y * scale + offY;
  }
}
function edgePath(a2, b, e) {
  const ddx = b.x - a2.x;
  const ddy = b.y - a2.y;
  const d = Math.max(0.15, Math.hypot(ddx, ddy));
  const ux = ddx / d;
  const uy = ddy / d;
  const off = (e.lane - (e.lanes - 1) / 2) * 18;
  const mx = (a2.x + b.x) / 2 - uy * off;
  const my = (a2.y + b.y) / 2 + ux * off;
  const ax = a2.x + ux * NODE_CLEAR;
  const ay = a2.y + uy * NODE_CLEAR;
  const bx = b.x - ux * (e.directed ? NODE_CLEAR + 3 : NODE_CLEAR);
  const by = b.y - uy * (e.directed ? NODE_CLEAR + 3 : NODE_CLEAR);
  return off === 0 ? `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}` : `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}
function svgEl(tag) {
  return document.createElementNS(SVG_NS, tag);
}
function renderRelationGraph(host, parsed, nameOf) {
  const { nodes, edges } = buildGraph(parsed, nameOf);
  if (nodes.length === 0) {
    host.appendChild(textNode(local.query ? "No relation matches the search" : "No relations to chart yet", "lmb-empty"));
    return;
  }
  layoutGraph(nodes, edges);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const svg = svgEl("svg");
  svg.setAttribute("class", "lmb-graph");
  svg.setAttribute("viewBox", `0 0 ${GRAPH_W} ${GRAPH_H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  const defs = svgEl("defs");
  const marker = svgEl("marker");
  marker.setAttribute("id", "lmb-arrow");
  marker.setAttribute("viewBox", "0 0 8 8");
  marker.setAttribute("refX", "7");
  marker.setAttribute("refY", "4");
  marker.setAttribute("markerWidth", "7");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("orient", "auto-start-reverse");
  const arrow = svgEl("path");
  arrow.setAttribute("d", "M 0 0.5 L 8 4 L 0 7.5 z");
  arrow.setAttribute("class", "lmb-graph-arrow");
  marker.appendChild(arrow);
  defs.appendChild(marker);
  svg.appendChild(defs);
  const edgeLayer = svgEl("g");
  const nodeLayer = svgEl("g");
  svg.append(edgeLayer, nodeLayer);
  const detail = document.createElement("div");
  detail.className = "lmb-graph-detail";
  let selectedEdge = null;
  const edgePaths = [];
  for (const e of edges) {
    const a2 = byId.get(e.a);
    const b = byId.get(e.b);
    if (!a2 || !b)
      continue;
    const g = svgEl("g");
    g.setAttribute("class", "lmb-graph-edgeg");
    const path = svgEl("path");
    path.setAttribute("class", `lmb-graph-edge${e.group ? " group" : ""}`);
    path.setAttribute("d", edgePath(a2, b, e));
    if (e.directed)
      path.setAttribute("marker-end", "url(#lmb-arrow)");
    const hit = svgEl("path");
    hit.setAttribute("class", "lmb-graph-hit");
    hit.setAttribute("d", edgePath(a2, b, e));
    const story = e.group ? `${nameOf(e.a)} · ${nameOf(e.b)}${e.kind ? ` [${e.kind}]` : ""}: ${e.state}` : `${nameOf(e.a)} → ${nameOf(e.b)}${e.kind ? ` [${e.kind}]` : ""}: ${e.state}`;
    const tip = svgEl("title");
    tip.textContent = story;
    hit.appendChild(tip);
    hit.addEventListener("click", () => {
      selectedEdge?.classList.remove("selected");
      selectedEdge = g;
      g.classList.add("selected");
      detail.replaceChildren();
      const names = document.createElement("b");
      names.textContent = e.group ? `${nameOf(e.a)} · ${nameOf(e.b)}` : `${nameOf(e.a)} → ${nameOf(e.b)}`;
      detail.append(names, document.createTextNode(`${e.kind ? ` [${e.kind}] ` : " "}${e.state}`));
    });
    g.append(path, hit);
    edgeLayer.appendChild(g);
    edgePaths.push({ visible: path, hit, edge: e });
  }
  const refreshEdgesFor = (id) => {
    for (const { visible, hit, edge } of edgePaths) {
      if (edge.a !== id && edge.b !== id)
        continue;
      const a2 = byId.get(edge.a);
      const b = byId.get(edge.b);
      if (!a2 || !b)
        continue;
      const d = edgePath(a2, b, edge);
      visible.setAttribute("d", d);
      hit.setAttribute("d", d);
    }
  };
  const toSvgPoint = (clientX, clientY) => {
    const ctm = svg.getScreenCTM();
    if (!ctm)
      return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  };
  for (const node of nodes) {
    const g = svgEl("g");
    g.setAttribute("class", `lmb-graph-node ${node.ns}`);
    g.setAttribute("transform", `translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
    const rect = svgEl("rect");
    rect.setAttribute("x", "-7.5");
    rect.setAttribute("y", "-7.5");
    rect.setAttribute("width", "15");
    rect.setAttribute("height", "15");
    rect.setAttribute("rx", "2");
    rect.setAttribute("transform", "rotate(45)");
    const label = svgEl("text");
    label.setAttribute("y", "22");
    label.setAttribute("text-anchor", "middle");
    label.textContent = node.name.length > 14 ? `${node.name.slice(0, 13)}…` : node.name;
    const tip = svgEl("title");
    tip.textContent = `${node.name} (${node.id})`;
    g.append(rect, label, tip);
    let dragging = false;
    let moved = 0;
    g.addEventListener("pointerdown", (ev) => {
      dragging = true;
      moved = 0;
      g.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    g.addEventListener("pointermove", (ev) => {
      if (!dragging)
        return;
      const p = toSvgPoint(ev.clientX, ev.clientY);
      moved += Math.hypot(p.x - node.x, p.y - node.y);
      node.x = Math.min(GRAPH_W - 10, Math.max(10, p.x));
      node.y = Math.min(GRAPH_H - 10, Math.max(10, p.y));
      g.setAttribute("transform", `translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
      refreshEdgesFor(node.id);
    });
    g.addEventListener("pointerup", () => {
      const wasClick = moved < 5;
      dragging = false;
      if (wasClick && node.ns !== "other") {
        local.subtab = "entities";
        local.expandedEntity = node.id;
        local.entityDraft = null;
        rerender();
      }
    });
    g.addEventListener("pointercancel", () => {
      dragging = false;
    });
    nodeLayer.appendChild(g);
  }
  const wrap = document.createElement("div");
  wrap.className = "lmb-graph-wrap";
  wrap.appendChild(svg);
  host.appendChild(wrap);
  host.appendChild(detail);
  const legend = document.createElement("div");
  legend.className = "lmb-spine-legend";
  const present = new Set(nodes.map((node) => node.ns));
  const entries = [
    { ns: "char", label: "character" },
    { ns: "loc", label: "location" },
    { ns: "thing", label: "thing" }
  ];
  for (const e of entries) {
    if (!present.has(e.ns))
      continue;
    const item = document.createElement("span");
    item.className = "lmb-spine-key";
    const swatch = document.createElement("span");
    swatch.className = `lmb-graph-swatch ${e.ns}`;
    item.append(swatch, document.createTextNode(e.label));
    legend.appendChild(item);
  }
  host.appendChild(legend);
  host.appendChild(textNode("Tap an edge for the story, tap a diamond to open its sheet, drag to rearrange.", "lmb-help"));
}
function eventDraftFrom(e, index2) {
  return {
    kind: "event",
    index: index2,
    saving: false,
    fields: {
      when: str(e?.["when"]),
      event: str(e?.["event"]),
      participants: strArray(e?.["participants"]).join(", "),
      where: str(e?.["where"]),
      causes: str(e?.["causes"])
    }
  };
}
function saveEventDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const when = (d.fields["when"] ?? "").trim();
  const eventText = (d.fields["event"] ?? "").trim();
  if (!when || !eventText)
    return;
  const participants = splitComma(d.fields["participants"] ?? "");
  const where = (d.fields["where"] ?? "").trim();
  const causes = (d.fields["causes"] ?? "").trim();
  const ev = { when, event: eventText };
  if (participants.length)
    ev["participants"] = participants;
  if (where)
    ev["where"] = where;
  if (causes)
    ev["causes"] = causes;
  const next = d.index >= 0 ? [...parsed.events.slice(0, d.index), ev, ...parsed.events.slice(d.index + 1)] : [...parsed.events, ev];
  d.saving = true;
  sendCodexWrite("timeline", { events: next }, state, send);
  rerender();
}
var EVENT_SPECS = [
  { key: "when", label: "When", widget: "input", placeholder: "day 12" },
  { key: "event", label: "Event", widget: "textarea", placeholder: "Mara sees Elias kill the duke" },
  { key: "participants", label: "Participants (comma separated refs)", widget: "input", refList: true },
  { key: "where", label: "Where", widget: "input", refList: true, placeholder: "loc:ashford_manor" },
  { key: "causes", label: "Causes", widget: "input", placeholder: "she flees the city" }
];
function renderTimeline(host, parsed, state, ctx, send) {
  const sec = section("Timeline");
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const toolbar = document.createElement("div");
  toolbar.className = "lmb-actions";
  toolbar.appendChild(makeButton("+ Event", () => {
    local.recordDraft = eventDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  sec.body.appendChild(toolbar);
  const draft = local.recordDraft;
  if (draft?.kind === "event" && draft.index === -1) {
    sec.body.appendChild(renderRecordForm("New event", EVENT_SPECS, draft, refListId, () => saveEventDraft(draft, state, send)));
  }
  if (parsed.events.length === 0) {
    sec.body.appendChild(textNode("No events recorded yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const withIndex = parsed.events.map((e, i) => ({ e, i }));
  const all = withIndex.filter(({ e }) => matches(local.query, str(e["when"]), str(e["event"]), str(e["causes"]), strArray(e["participants"]).map(nameOf)));
  if (all.length === 0) {
    sec.body.appendChild(textNode("No event matches the search", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const paged = !local.query && !local.showFullTimeline && all.length > TIMELINE_RECENT;
  const shown = (paged ? all.slice(-TIMELINE_RECENT) : all).slice().reverse();
  const rail = document.createElement("div");
  rail.className = "lmb-timeline";
  let prevContext = "";
  for (const { e, i } of shown) {
    if (draft?.kind === "event" && draft.index === i) {
      rail.appendChild(renderRecordForm("Edit event", EVENT_SPECS, draft, refListId, () => saveEventDraft(draft, state, send)));
      prevContext = "";
      continue;
    }
    const expanded = local.expandedEvents.has(i);
    const item = document.createElement("div");
    item.className = `lmb-timeline-item lmb-record-click${expanded ? " expanded" : ""}`;
    item.title = "Click for edit and delete";
    const when = document.createElement("div");
    when.className = "lmb-timeline-when";
    when.textContent = str(e["when"]) || "?";
    const eventText = document.createElement("div");
    eventText.className = "lmb-timeline-event";
    eventText.textContent = str(e["event"]);
    item.append(when, eventText);
    const contextBits = [];
    const participants = strArray(e["participants"]).map(nameOf);
    if (participants.length)
      contextBits.push(participants.join(", "));
    const where = str(e["where"]);
    if (where)
      contextBits.push(`@ ${nameOf(where)}`);
    const context = contextBits.join("  ·  ");
    const detailBits = [];
    if (context && context !== prevContext)
      detailBits.push(context);
    prevContext = context;
    const causes = str(e["causes"]);
    if (causes)
      detailBits.push(`→ ${causes}`);
    if (detailBits.length) {
      item.appendChild(textNode(detailBits.join("  ·  "), "lmb-timeline-detail"));
    }
    item.addEventListener("click", () => {
      if (expanded)
        local.expandedEvents.delete(i);
      else
        local.expandedEvents.add(i);
      rerender();
    });
    if (expanded) {
      const actions = recordItemActions(() => {
        local.recordDraft = eventDraftFrom(e, i);
        rerender();
      }, () => {
        const next = parsed.events.filter((_, j) => j !== i);
        sendCodexWrite("timeline", { events: next }, state, send);
      }, ctx, "Memoria will remove this event from the timeline.");
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      item.appendChild(actions);
    }
    rail.appendChild(item);
  }
  sec.body.appendChild(rail);
  if (!local.query && all.length > TIMELINE_RECENT) {
    sec.body.appendChild(makeButton(local.showFullTimeline ? "Show recent only" : `Show earlier (${all.length - TIMELINE_RECENT})`, () => {
      local.showFullTimeline = !local.showFullTimeline;
      rerender();
    }, { small: true }));
  }
  host.appendChild(sec.wrap);
}
var THREAD_TONE = {
  open: "ok",
  stalled: "warn",
  abandoned: "danger",
  resolved: undefined
};
function threadDraftFrom(t, index2) {
  return {
    kind: "thread",
    index: index2,
    saving: false,
    fields: {
      name: str(t?.["name"]),
      status: str(t?.["status"]) || "open",
      summary: str(t?.["summary"]),
      latest: str(t?.["latest"]),
      planted: strArray(t?.["planted"]).join(`
`)
    }
  };
}
var THREAD_SPECS = [
  { key: "name", label: "Name", widget: "input", placeholder: "The stolen crown" },
  { key: "status", label: "Status", widget: "select", options: [
    { value: "open", label: "open" },
    { value: "stalled", label: "stalled" },
    { value: "resolved", label: "resolved" },
    { value: "abandoned", label: "abandoned" }
  ] },
  { key: "summary", label: "Summary", widget: "textarea" },
  { key: "latest", label: "Latest development", widget: "input" },
  { key: "planted", label: "Planted details (one per line)", widget: "lines" }
];
function saveThreadDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const name = (d.fields["name"] ?? "").trim();
  const summary = (d.fields["summary"] ?? "").trim();
  if (!name || !summary)
    return;
  const t = { name, status: d.fields["status"] || "open", summary };
  const latest = (d.fields["latest"] ?? "").trim();
  if (latest)
    t["latest"] = latest;
  const planted = splitLines(d.fields["planted"] ?? "");
  if (planted.length)
    t["planted"] = planted;
  const next = d.index >= 0 ? [...parsed.threads.slice(0, d.index), t, ...parsed.threads.slice(d.index + 1)] : [...parsed.threads, t];
  d.saving = true;
  sendCodexWrite("threads", { threads: next, seeds: parsed.seeds }, state, send);
  rerender();
}
function renderThreads(host, parsed, state, ctx, send) {
  const sec = section("Threads");
  const toolbar = document.createElement("div");
  toolbar.className = "lmb-actions";
  toolbar.append(makeButton("+ Thread", () => {
    local.recordDraft = threadDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }), makeButton("Edit seeds", () => {
    local.recordDraft = { kind: "seeds", index: -1, saving: false, fields: { seeds: parsed.seeds.join(`
`) } };
    rerender();
  }, { small: true }));
  sec.body.appendChild(toolbar);
  const draft = local.recordDraft;
  if (draft?.kind === "thread" && draft.index === -1) {
    sec.body.appendChild(renderRecordForm("New thread", THREAD_SPECS, draft, null, () => saveThreadDraft(draft, state, send)));
  } else if (draft?.kind === "seeds") {
    sec.body.appendChild(renderRecordForm("Edit seeds", [{ key: "seeds", label: "Seeds (one per line)", widget: "lines" }], draft, null, () => {
      draft.saving = true;
      sendCodexWrite("threads", { threads: parsed.threads, seeds: splitLines(draft.fields["seeds"] ?? "") }, state, send);
      rerender();
    }));
  }
  if (parsed.threads.length === 0 && parsed.seeds.length === 0) {
    sec.body.appendChild(textNode("No open storylines tracked yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const list = document.createElement("div");
  list.className = "lmb-thread-list";
  let shown = 0;
  parsed.threads.forEach((t, i) => {
    if (!matches(local.query, str(t["name"]), str(t["summary"]), str(t["latest"]), strArray(t["planted"])))
      return;
    shown++;
    if (draft?.kind === "thread" && draft.index === i) {
      list.appendChild(renderRecordForm("Edit thread", THREAD_SPECS, draft, null, () => saveThreadDraft(draft, state, send)));
      return;
    }
    const name = str(t["name"]);
    const row = document.createElement("div");
    row.className = "lmb-thread";
    const head = document.createElement("button");
    head.type = "button";
    head.className = "lmb-thread-head";
    const status = str(t["status"]) || "open";
    head.append(pill(status, THREAD_TONE[status]));
    const title = document.createElement("span");
    title.className = "lmb-thread-name";
    title.textContent = name || "?";
    head.appendChild(title);
    const chevron = document.createElement("span");
    chevron.className = `lmb-chevron${local.expandedThreads.has(name) ? " open" : ""}`;
    head.appendChild(chevron);
    head.addEventListener("click", () => {
      if (local.expandedThreads.has(name))
        local.expandedThreads.delete(name);
      else
        local.expandedThreads.add(name);
      rerender();
    });
    row.appendChild(head);
    row.appendChild(textNode(str(t["summary"]), "lmb-thread-summary"));
    if (local.expandedThreads.has(name)) {
      const latest = str(t["latest"]);
      if (latest)
        row.appendChild(textNode(`Latest: ${latest}`, "lmb-thread-detail"));
      for (const p of strArray(t["planted"])) {
        row.appendChild(textNode(`◆ planted: ${p}`, "lmb-thread-detail"));
      }
      row.appendChild(recordItemActions(() => {
        local.recordDraft = threadDraftFrom(t, i);
        rerender();
      }, () => {
        const next = parsed.threads.filter((_, j) => j !== i);
        sendCodexWrite("threads", { threads: next, seeds: parsed.seeds }, state, send);
      }, ctx, "Memoria will remove this thread from the codex."));
    }
    list.appendChild(row);
  });
  if (shown > 0)
    sec.body.appendChild(list);
  else if (parsed.threads.length > 0)
    sec.body.appendChild(textNode("No thread matches the search", "lmb-empty"));
  const seeds = parsed.seeds.filter((s) => matches(local.query, s));
  if (seeds.length) {
    const sub = document.createElement("div");
    sub.className = "lmb-section-title";
    sub.textContent = `Seeds (${parsed.seeds.length})`;
    sec.body.appendChild(sub);
    for (const s of seeds) {
      sec.body.appendChild(textNode(`◆ ${s}`, "lmb-thread-detail"));
    }
  }
  host.appendChild(sec.wrap);
}
function worldDraftFrom(w, index2) {
  return {
    kind: "world",
    index: index2,
    saving: false,
    fields: {
      topic: str(w?.["topic"]),
      facts: strArray(w?.["facts"]).join(`
`)
    }
  };
}
function knowledgeDraftFrom(k, index2) {
  const beliefs = objArray(k?.["falseBeliefs"]).map((b) => `${str(b["who"])} => ${str(b["believes"])}`).join(`
`);
  return {
    kind: "knowledge",
    index: index2,
    saving: false,
    fields: {
      fact: str(k?.["fact"]),
      knownBy: strArray(k?.["knownBy"]).join(", "),
      hiddenFrom: strArray(k?.["hiddenFrom"]).join(", "),
      falseBeliefs: beliefs,
      note: str(k?.["note"])
    }
  };
}
function saveWorldDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const topic = (d.fields["topic"] ?? "").trim();
  const facts = splitLines(d.fields["facts"] ?? "");
  if (!topic || facts.length === 0)
    return;
  const entry = { topic, facts };
  const next = d.index >= 0 ? [...parsed.world.slice(0, d.index), entry, ...parsed.world.slice(d.index + 1)] : [...parsed.world, entry];
  d.saving = true;
  sendCodexWrite("world", { entries: next }, state, send);
  rerender();
}
function saveKnowledgeDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const fact = (d.fields["fact"] ?? "").trim();
  if (!fact)
    return;
  const item = { fact };
  const knownBy = splitComma(d.fields["knownBy"] ?? "");
  if (knownBy.length)
    item["knownBy"] = knownBy;
  const hiddenFrom = splitComma(d.fields["hiddenFrom"] ?? "");
  if (hiddenFrom.length)
    item["hiddenFrom"] = hiddenFrom;
  const falseBeliefs = splitLines(d.fields["falseBeliefs"] ?? "").map((line) => {
    const at = line.indexOf("=>");
    if (at === -1)
      return null;
    const who = line.slice(0, at).trim();
    const believes = line.slice(at + 2).trim();
    return who && believes ? { who, believes } : null;
  }).filter((x3) => !!x3);
  if (falseBeliefs.length)
    item["falseBeliefs"] = falseBeliefs;
  const note = (d.fields["note"] ?? "").trim();
  if (note)
    item["note"] = note;
  const next = d.index >= 0 ? [...parsed.knowledge.slice(0, d.index), item, ...parsed.knowledge.slice(d.index + 1)] : [...parsed.knowledge, item];
  d.saving = true;
  sendCodexWrite("knowledge", { items: next }, state, send);
  rerender();
}
var WORLD_SPECS = [
  { key: "topic", label: "Topic", widget: "input", placeholder: "Magic" },
  { key: "facts", label: "Facts (one per line)", widget: "lines", placeholder: "blood magic costs memories" }
];
var KNOWLEDGE_SPECS = [
  { key: "fact", label: "Fact", widget: "textarea", placeholder: "Elias killed the duke" },
  { key: "knownBy", label: "Known by (comma separated refs)", widget: "input", refList: true },
  { key: "hiddenFrom", label: "Hidden from (comma separated refs)", widget: "input", refList: true },
  { key: "falseBeliefs", label: 'False beliefs (one per line, "who => belief")', widget: "lines", placeholder: "char:captain => bandits did it" },
  { key: "note", label: "Note", widget: "input" }
];
function renderLore(host, parsed, state, ctx, send) {
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const draft = local.recordDraft;
  const world = section("World rules");
  const worldBar = document.createElement("div");
  worldBar.className = "lmb-actions";
  worldBar.appendChild(makeButton("+ Topic", () => {
    local.recordDraft = worldDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  world.body.appendChild(worldBar);
  if (draft?.kind === "world" && draft.index === -1) {
    world.body.appendChild(renderRecordForm("New topic", WORLD_SPECS, draft, null, () => saveWorldDraft(draft, state, send)));
  }
  const worldShown = parsed.world.map((w, i) => ({ w, i })).filter(({ w }) => matches(local.query, str(w["topic"]), strArray(w["facts"])));
  if (parsed.world.length === 0) {
    world.body.appendChild(textNode("No world lore recorded yet", "lmb-empty"));
  } else if (worldShown.length === 0) {
    world.body.appendChild(textNode("No topic matches the search", "lmb-empty"));
  }
  for (const { w, i } of worldShown) {
    if (draft?.kind === "world" && draft.index === i) {
      world.body.appendChild(renderRecordForm("Edit topic", WORLD_SPECS, draft, null, () => saveWorldDraft(draft, state, send)));
      continue;
    }
    const expanded = local.expandedWorld.has(i);
    const block = document.createElement("div");
    block.className = "lmb-lore-topic lmb-record-click";
    block.title = "Click for edit and delete";
    const t = document.createElement("div");
    t.className = "lmb-lore-title";
    t.textContent = str(w["topic"]) || "?";
    block.appendChild(t);
    const ul = document.createElement("ul");
    ul.className = "lmb-lore-facts";
    for (const f of strArray(w["facts"])) {
      const li = document.createElement("li");
      li.textContent = f;
      ul.appendChild(li);
    }
    block.appendChild(ul);
    block.addEventListener("click", () => {
      if (expanded)
        local.expandedWorld.delete(i);
      else
        local.expandedWorld.add(i);
      rerender();
    });
    if (expanded) {
      const actions = recordItemActions(() => {
        local.recordDraft = worldDraftFrom(w, i);
        rerender();
      }, () => {
        const next = parsed.world.filter((_, j) => j !== i);
        sendCodexWrite("world", { entries: next }, state, send);
      }, ctx, "Memoria will remove this topic and its facts.");
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    world.body.appendChild(block);
  }
  host.appendChild(world.wrap);
  const secrets = section("Who knows what");
  const secretBar = document.createElement("div");
  secretBar.className = "lmb-actions";
  secretBar.appendChild(makeButton("+ Secret", () => {
    local.recordDraft = knowledgeDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  secrets.body.appendChild(secretBar);
  if (draft?.kind === "knowledge" && draft.index === -1) {
    secrets.body.appendChild(renderRecordForm("New secret", KNOWLEDGE_SPECS, draft, refListId, () => saveKnowledgeDraft(draft, state, send)));
  }
  const knowledgeShown = parsed.knowledge.map((k, i) => ({ k, i })).filter(({ k }) => matches(local.query, str(k["fact"]), str(k["note"]), strArray(k["knownBy"]).map(nameOf), strArray(k["hiddenFrom"]).map(nameOf)));
  if (parsed.knowledge.length === 0) {
    secrets.body.appendChild(textNode("No secrets or asymmetric knowledge tracked yet", "lmb-empty"));
  } else if (knowledgeShown.length === 0) {
    secrets.body.appendChild(textNode("No secret matches the search", "lmb-empty"));
  }
  for (const { k, i } of knowledgeShown) {
    if (draft?.kind === "knowledge" && draft.index === i) {
      secrets.body.appendChild(renderRecordForm("Edit secret", KNOWLEDGE_SPECS, draft, refListId, () => saveKnowledgeDraft(draft, state, send)));
      continue;
    }
    const expanded = local.expandedSecrets.has(i);
    const block = document.createElement("div");
    block.className = "lmb-secret lmb-record-click";
    block.title = "Click for edit and delete";
    block.appendChild(textNode(str(k["fact"]), "lmb-secret-fact"));
    const chips = document.createElement("div");
    chips.className = "lmb-actions";
    for (const who of strArray(k["knownBy"]))
      chips.appendChild(pill(`knows: ${nameOf(who)}`, "ok"));
    for (const who of strArray(k["hiddenFrom"]))
      chips.appendChild(pill(`hidden: ${nameOf(who)}`, "warn"));
    if (chips.childElementCount)
      block.appendChild(chips);
    for (const b of objArray(k["falseBeliefs"])) {
      block.appendChild(textNode(`${nameOf(str(b["who"]))} wrongly believes: ${str(b["believes"])}`, "lmb-thread-detail"));
    }
    const note = str(k["note"]);
    if (note)
      block.appendChild(textNode(note, "lmb-thread-detail"));
    block.addEventListener("click", () => {
      if (expanded)
        local.expandedSecrets.delete(i);
      else
        local.expandedSecrets.add(i);
      rerender();
    });
    if (expanded) {
      const actions = recordItemActions(() => {
        local.recordDraft = knowledgeDraftFrom(k, i);
        rerender();
      }, () => {
        const next = parsed.knowledge.filter((_, j) => j !== i);
        sendCodexWrite("knowledge", { items: next }, state, send);
      }, ctx, "Memoria will remove this secret from the codex.");
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    secrets.body.appendChild(block);
  }
  host.appendChild(secrets.wrap);
}

// src/shared.ts
var STORAGE_VERSION = 3;
var DEFAULT_SAMPLERS = {
  temperature: null,
  top_p: null,
  top_k: null,
  max_tokens: null,
  max_input_tokens: null,
  frequency_penalty: null,
  presence_penalty: null
};
var SAMPLER_DEFAULTS = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 32000,
  max_input_tokens: 128000,
  frequency_penalty: 0,
  presence_penalty: 0
};
function makeDefaultProfile(id, name) {
  return {
    id,
    name,
    lagUnit: "messages",
    lagValue: 65,
    windowUnit: "messages",
    windowValue: 18,
    chapterTargetUnit: "percent",
    chapterTargetPercent: 15,
    chapterTargetTokens: 800,
    arcTargetUnit: "percent",
    arcTargetPercent: 20,
    arcTargetTokens: 1500,
    volumeTargetUnit: "percent",
    volumeTargetPercent: 25,
    volumeTargetTokens: 3000,
    arcTrigger: "chapters",
    arcAfterChapters: 6,
    arcAfterTokens: 8000,
    arcLagChapters: 7,
    arcLagTokens: 2000,
    chapterPresetKey: "summary",
    arcPresetKey: "arc_default",
    volumePresetKey: "volume_default",
    previousMemoriesCount: 7,
    regexOutgoingScriptIds: [],
    regexIncomingScriptIds: [],
    connectionId: null,
    samplers: { ...DEFAULT_SAMPLERS },
    autoCreate: true,
    autoCreateChapter: true,
    autoCreateArc: true,
    hideCoveredMessages: true,
    showMemoryPreviews: false,
    retryCount: 3,
    shortCommentRulesOverride: null,
    memoriaPersonaOverride: null,
    ttftTimeoutSecs: 60,
    codexEnabled: true,
    codexLagUnit: "messages",
    codexLagValue: 6,
    codexWindowUnit: "messages",
    codexWindowValue: 30,
    codexTokenBreakpoint: 1e5,
    codexRelationsTable: true,
    codexThorough: false,
    codexConnectionId: null,
    codexExtraContext: false
  };
}
var DEFAULT_SETTINGS = {
  version: STORAGE_VERSION,
  enabled: true,
  profiles: [makeDefaultProfile("default", "Default")],
  activeProfileId: "default",
  customPresets: [],
  debugLog: false,
  forceConstantEntries: true,
  showAutomationToasts: true
};

// src/ui/tabs/profile-tab.ts
var PROFILE_DEFAULTS = makeDefaultProfile("__defaults__", "Defaults");
var CODEX_LAG_TOKENS_DEFAULT = 2000;
var CODEX_WINDOW_TOKENS_DEFAULT = 8000;
function renderCodexSettings(host, state, profile, patch) {
  const sec = section("Knowledge Codex");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "An agent reads every new turn and keeps per-chat JSON records of characters, locations, things, relations, timeline, threads, world rules, and who-knows-what. The codex is injected into the prompt as a snapshot of the story's present.";
  sec.body.appendChild(help);
  sec.body.appendChild(checkbox({
    checked: profile.codexEnabled,
    label: "Enabled",
    hint: "Runs automatically after generations once the backlog fills. Manual updates live in the Books tab.",
    onChange: (v) => patch({ codexEnabled: v })
  }));
  const fields = document.createElement("div");
  fields.className = profile.codexEnabled ? "lmb-subgroup" : "lmb-subgroup lmb-greyed";
  sec.body.appendChild(fields);
  const lagGrid = document.createElement("div");
  lagGrid.className = "lmb-grid-2";
  lagGrid.append(labelled("Lag unit", select({
    value: profile.codexLagUnit,
    options: [
      { value: "messages", label: "messages" },
      { value: "tokens", label: "tokens" }
    ],
    onChange: (v) => patch({ codexLagUnit: v === "tokens" ? "tokens" : "messages" })
  })), labelled(profile.codexLagUnit === "tokens" ? "Lag tokens" : "Lag messages", numberInput({
    value: profile.codexLagValue,
    min: 0,
    max: profile.codexLagUnit === "tokens" ? 1e6 : 1e5,
    step: profile.codexLagUnit === "tokens" ? 50 : 1,
    defaultValue: profile.codexLagUnit === "tokens" ? CODEX_LAG_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexLagValue,
    onBlur: (v) => patch({ codexLagValue: v ?? (profile.codexLagUnit === "tokens" ? CODEX_LAG_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexLagValue) })
  })));
  fields.appendChild(lagGrid);
  const windowGrid = document.createElement("div");
  windowGrid.className = "lmb-grid-2";
  windowGrid.append(labelled("Window unit", select({
    value: profile.codexWindowUnit,
    options: [
      { value: "messages", label: "messages" },
      { value: "tokens", label: "tokens" }
    ],
    onChange: (v) => patch({ codexWindowUnit: v === "tokens" ? "tokens" : "messages" })
  })), labelled(profile.codexWindowUnit === "tokens" ? "Window tokens" : "Window messages", numberInput({
    value: profile.codexWindowValue,
    min: 1,
    max: profile.codexWindowUnit === "tokens" ? 1e6 : 1e5,
    step: profile.codexWindowUnit === "tokens" ? 100 : 1,
    defaultValue: profile.codexWindowUnit === "tokens" ? CODEX_WINDOW_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexWindowValue,
    onBlur: (v) => patch({ codexWindowValue: v ?? (profile.codexWindowUnit === "tokens" ? CODEX_WINDOW_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexWindowValue) })
  })));
  fields.appendChild(windowGrid);
  if (profile.codexWindowUnit === "messages") {
    fields.appendChild(labelled("Tokens breakpoint", numberInput({
      value: profile.codexTokenBreakpoint,
      min: 1000,
      max: 1e6,
      step: 5000,
      defaultValue: PROFILE_DEFAULTS.codexTokenBreakpoint,
      onBlur: (v) => patch({ codexTokenBreakpoint: v ?? PROFILE_DEFAULTS.codexTokenBreakpoint })
    })));
    const bpHint = document.createElement("div");
    bpHint.className = "lmb-field-hint";
    bpHint.textContent = "The window fires at whichever arrives first: the message count above or this many tokens. Keeps verbose chats from building enormous chunks.";
    fields.appendChild(bpHint);
  }
  const cadenceHint = document.createElement("div");
  cadenceHint.className = "lmb-field-hint";
  cadenceHint.textContent = "Lag is the recent tail the codex leaves alone until it settles. Once a window's worth of older messages piles up behind it, the agent consumes them in one pass. Keep the lag smaller than the chapter lag if you want the codex fresher than the summaries.";
  fields.appendChild(cadenceHint);
  fields.appendChild(checkbox({
    checked: profile.codexRelationsTable,
    label: "Relations table",
    hint: "Tracks connections between entities as one shared table with integrity checks. When off, relationships live as short notes on each entity sheet instead.",
    onChange: (v) => patch({ codexRelationsTable: v })
  }));
  fields.appendChild(checkbox({
    checked: profile.codexThorough,
    label: "Thorough mode",
    hint: "Spends one extra verification round per update to sweep for stale info and compress bloat.",
    onChange: (v) => patch({ codexThorough: v })
  }));
  fields.appendChild(checkbox({
    checked: profile.codexExtraContext,
    label: "Extra context mode",
    hint: "Summarizes chapters early at the codex lag as ghost chapters. Ghosts feed the agent story-so-far context and are promoted into real chapters once the chapter lag arrives, with no second summarization.",
    onChange: (v) => patch({ codexExtraContext: v })
  }));
  const connOpts = [
    { value: "", label: "Same as Memoria's connection" },
    ...state.connections.map((c2) => ({
      value: c2.id,
      label: `${c2.name} - ${c2.provider}${c2.model ? "/" + c2.model : ""}${c2.isDefault ? " (default)" : ""}`
    }))
  ];
  fields.appendChild(labelled("Codex connection", select({
    value: profile.codexConnectionId ?? "",
    options: connOpts,
    onChange: (v) => patch({ codexConnectionId: v || null })
  })));
  host.appendChild(sec.wrap);
}
function renderResetSettings(host, state, send) {
  const profile = state.activeProfile;
  const sec = section("Reset");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Resets this profile's settings to their defaults.";
  sec.body.appendChild(help);
  const IDLE = "Reset profile to defaults";
  const CONFIRM = "Click again to confirm";
  let btn;
  let armed = false;
  let timer2;
  const disarm = () => {
    armed = false;
    if (timer2) {
      clearTimeout(timer2);
      timer2 = undefined;
    }
    btn.textContent = IDLE;
  };
  btn = makeButton(IDLE, () => {
    if (!armed) {
      armed = true;
      btn.textContent = CONFIRM;
      timer2 = setTimeout(disarm, 3000);
      return;
    }
    disarm();
    send({
      type: "save_profile",
      profile: makeDefaultProfile(profile.id, profile.name),
      chatId: state.activeChatId
    });
  }, { danger: true });
  sec.body.appendChild(btn);
  host.appendChild(sec.wrap);
}
function renderProfilePicker(host, state, ctx, send) {
  const sec = section("Profile");
  const row = document.createElement("div");
  row.className = "lmb-field-row";
  const grow = document.createElement("div");
  grow.className = "lmb-grow";
  grow.appendChild(select({
    value: state.activeProfile.id,
    options: state.settings.profiles.map((p) => ({ value: p.id, label: p.name })),
    onChange: (v) => send({ type: "set_active_profile", profileId: v, chatId: state.activeChatId })
  }));
  row.appendChild(grow);
  row.append(makeButton("New", async () => {
    const name = await promptForString(ctx, "New profile name", "");
    if (!name)
      return;
    send({ type: "create_profile", name, chatId: state.activeChatId });
  }, { small: true }), makeButton("Delete", () => {
    send({ type: "delete_profile", profileId: state.activeProfile.id, chatId: state.activeChatId });
  }, { small: true, danger: true, disabled: state.settings.profiles.length <= 1 }));
  sec.body.appendChild(row);
  const profile = state.activeProfile;
  const nameField = field("Profile name");
  nameField.body.appendChild(textInput({
    value: profile.name,
    onBlur: (v) => send({ type: "save_profile", profile: { id: profile.id, name: v.slice(0, 60) }, chatId: state.activeChatId })
  }));
  sec.body.appendChild(nameField.wrap);
  const enableWrap = field("Extension");
  enableWrap.body.appendChild(checkbox({
    checked: state.settings.enabled,
    label: "Enabled",
    hint: "Master switch. When off, Memoria does nothing on this account.",
    onChange: (v) => send({ type: "save_settings", patch: { enabled: v }, chatId: state.activeChatId })
  }));
  sec.body.appendChild(enableWrap.wrap);
  host.appendChild(sec.wrap);
}
function renderAutomation(host, profile, patch) {
  const sec = section("Automation");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Everything in this section runs in the background after each generation. Manual actions in the Books and Make tabs always work regardless of these toggles.";
  sec.body.appendChild(help);
  sec.body.appendChild(checkbox({
    checked: profile.autoCreate,
    label: "Run automation",
    hint: "Master toggle. When off, Memoria only acts on manual triggers.",
    onChange: (v) => patch({ autoCreate: v })
  }));
  const subsWrap = document.createElement("div");
  subsWrap.className = profile.autoCreate ? "lmb-subgroup" : "lmb-subgroup lmb-greyed";
  sec.body.appendChild(subsWrap);
  const chapterGroupTitle = document.createElement("div");
  chapterGroupTitle.className = "lmb-subgroup-title";
  chapterGroupTitle.textContent = "Auto-file chapters";
  subsWrap.appendChild(chapterGroupTitle);
  subsWrap.appendChild(checkbox({
    checked: profile.autoCreateChapter,
    label: "Enabled",
    hint: "Compresses the oldest uncovered window into a chapter once thresholds are met.",
    onChange: (v) => patch({ autoCreateChapter: v })
  }));
  const chapterFields = document.createElement("div");
  chapterFields.className = profile.autoCreateChapter ? "" : "lmb-greyed";
  subsWrap.appendChild(chapterFields);
  const lagGrid = document.createElement("div");
  lagGrid.className = "lmb-grid-2";
  lagGrid.append(labelled("Lag unit", select({
    value: profile.lagUnit,
    options: [
      { value: "messages", label: "messages" },
      { value: "tokens", label: "tokens" }
    ],
    onChange: (v) => patch({ lagUnit: v === "tokens" ? "tokens" : "messages" })
  })), labelled(profile.lagUnit === "tokens" ? "Lag tokens" : "Lag messages", numberInput({
    value: profile.lagValue,
    min: 0,
    max: profile.lagUnit === "tokens" ? 1e6 : 1e5,
    step: profile.lagUnit === "tokens" ? 50 : 1,
    defaultValue: PROFILE_DEFAULTS.lagValue,
    onBlur: (v) => patch({ lagValue: v ?? PROFILE_DEFAULTS.lagValue })
  })));
  chapterFields.appendChild(lagGrid);
  const scheduleHint = document.createElement("div");
  scheduleHint.className = "lmb-field-hint";
  scheduleHint.textContent = "Lag is the most-recent portion Memoria leaves uncompressed. Once the lag is full and there's a window's worth of older messages behind it, Memoria files them. In token mode, the lag bucket includes messages up to and including the one that hits the token limit.";
  chapterFields.appendChild(scheduleHint);
  const arcGroupTitle = document.createElement("div");
  arcGroupTitle.className = "lmb-subgroup-title";
  arcGroupTitle.style.marginTop = "6px";
  arcGroupTitle.textContent = "Auto-bind arcs";
  subsWrap.appendChild(arcGroupTitle);
  subsWrap.appendChild(checkbox({
    checked: profile.autoCreateArc,
    label: "Enabled",
    hint: "Rolls oldest chapters into an arc once the threshold is met, leaving the recent ones as lag.",
    onChange: (v) => patch({ autoCreateArc: v })
  }));
  const arcFields = document.createElement("div");
  arcFields.className = profile.autoCreateArc ? "" : "lmb-greyed";
  subsWrap.appendChild(arcFields);
  const arcGrid = document.createElement("div");
  arcGrid.className = "lmb-grid-2";
  arcGrid.append(labelled("Trigger", select({
    value: profile.arcTrigger,
    options: [
      { value: "chapters", label: "after N chapters" },
      { value: "tokens", label: "after N tokens" },
      { value: "manual", label: "manual only" }
    ],
    onChange: (v) => patch({ arcTrigger: v === "tokens" || v === "manual" ? v : "chapters" })
  })), labelled(profile.arcTrigger === "tokens" ? "Lag tokens" : "Lag chapters", numberInput({
    value: profile.arcTrigger === "tokens" ? profile.arcLagTokens : profile.arcLagChapters,
    min: 0,
    max: profile.arcTrigger === "tokens" ? 200000 : 100,
    step: profile.arcTrigger === "tokens" ? 100 : 1,
    disabled: profile.arcTrigger === "manual",
    defaultValue: profile.arcTrigger === "tokens" ? PROFILE_DEFAULTS.arcLagTokens : PROFILE_DEFAULTS.arcLagChapters,
    onBlur: (v) => {
      if (v === null)
        return;
      if (profile.arcTrigger === "tokens")
        patch({ arcLagTokens: v });
      else
        patch({ arcLagChapters: v });
    }
  })));
  arcFields.appendChild(arcGrid);
  const arcHint = document.createElement("div");
  arcHint.className = "lmb-field-hint";
  arcHint.textContent = "Arc lag reserves the most-recent chapters and never binds them, so you keep some chapter-level detail.";
  arcFields.appendChild(arcHint);
  host.appendChild(sec.wrap);
}
function renderCompressionTargets(host, profile, patch) {
  const sec = section("Compression targets");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "How much Memoria compresses each chapter and arc, and how much input goes into each. Used by both manual and automatic triggers.";
  sec.body.appendChild(help);
  const chapterTitle = document.createElement("div");
  chapterTitle.className = "lmb-subgroup-title";
  chapterTitle.textContent = "Chapter";
  sec.body.appendChild(chapterTitle);
  const windowGrid = document.createElement("div");
  windowGrid.className = "lmb-grid-2";
  windowGrid.append(labelled("Window unit", select({
    value: profile.windowUnit,
    options: [
      { value: "messages", label: "messages" },
      { value: "tokens", label: "tokens" }
    ],
    onChange: (v) => patch({ windowUnit: v === "tokens" ? "tokens" : "messages" })
  })), labelled(profile.windowUnit === "tokens" ? "Tokens to chapterize" : "Messages to chapterize", numberInput({
    value: profile.windowValue,
    min: 1,
    max: profile.windowUnit === "tokens" ? 1e6 : 1e5,
    step: profile.windowUnit === "tokens" ? 100 : 1,
    defaultValue: PROFILE_DEFAULTS.windowValue,
    onBlur: (v) => patch({ windowValue: v ?? PROFILE_DEFAULTS.windowValue })
  })));
  sec.body.appendChild(windowGrid);
  const windowHint = document.createElement("div");
  windowHint.className = "lmb-field-hint";
  windowHint.textContent = "In token mode, the window includes messages up to and including the one that hits the token limit.";
  sec.body.appendChild(windowHint);
  const chapterRatioGrid = document.createElement("div");
  chapterRatioGrid.className = "lmb-grid-2";
  chapterRatioGrid.append(labelled("Chapter ratio", select({
    value: profile.chapterTargetUnit,
    options: [
      { value: "percent", label: "% of input" },
      { value: "tokens", label: "token budget" }
    ],
    onChange: (v) => patch({ chapterTargetUnit: v === "tokens" ? "tokens" : "percent" })
  })), labelled(profile.chapterTargetUnit === "tokens" ? "Chapter tokens" : "Chapter %", numberInput({
    value: profile.chapterTargetUnit === "tokens" ? profile.chapterTargetTokens : profile.chapterTargetPercent,
    min: profile.chapterTargetUnit === "tokens" ? 50 : 2,
    max: profile.chapterTargetUnit === "tokens" ? 1e6 : 90,
    step: profile.chapterTargetUnit === "tokens" ? 50 : 1,
    defaultValue: profile.chapterTargetUnit === "tokens" ? PROFILE_DEFAULTS.chapterTargetTokens : PROFILE_DEFAULTS.chapterTargetPercent,
    onBlur: (v) => {
      if (v === null)
        return;
      if (profile.chapterTargetUnit === "tokens")
        patch({ chapterTargetTokens: v });
      else
        patch({ chapterTargetPercent: v });
    }
  })));
  sec.body.appendChild(chapterRatioGrid);
  const arcTitle = document.createElement("div");
  arcTitle.className = "lmb-subgroup-title";
  arcTitle.style.marginTop = "6px";
  arcTitle.textContent = "Arc";
  sec.body.appendChild(arcTitle);
  sec.body.appendChild(labelled(profile.arcTrigger === "tokens" ? "Tokens to bind" : "Chapters to bind", numberInput({
    value: profile.arcTrigger === "tokens" ? profile.arcAfterTokens : profile.arcAfterChapters,
    min: profile.arcTrigger === "tokens" ? 500 : 2,
    max: profile.arcTrigger === "tokens" ? 200000 : 100,
    step: profile.arcTrigger === "tokens" ? 500 : 1,
    disabled: profile.arcTrigger === "manual",
    defaultValue: profile.arcTrigger === "tokens" ? PROFILE_DEFAULTS.arcAfterTokens : PROFILE_DEFAULTS.arcAfterChapters,
    onBlur: (v) => {
      if (v === null)
        return;
      if (profile.arcTrigger === "tokens")
        patch({ arcAfterTokens: v });
      else
        patch({ arcAfterChapters: v });
    }
  })));
  const arcRatioGrid = document.createElement("div");
  arcRatioGrid.className = "lmb-grid-2";
  arcRatioGrid.append(labelled("Arc ratio", select({
    value: profile.arcTargetUnit,
    options: [
      { value: "percent", label: "% of input" },
      { value: "tokens", label: "token budget" }
    ],
    onChange: (v) => patch({ arcTargetUnit: v === "tokens" ? "tokens" : "percent" })
  })), labelled(profile.arcTargetUnit === "tokens" ? "Arc tokens" : "Arc %", numberInput({
    value: profile.arcTargetUnit === "tokens" ? profile.arcTargetTokens : profile.arcTargetPercent,
    min: profile.arcTargetUnit === "tokens" ? 50 : 5,
    max: profile.arcTargetUnit === "tokens" ? 1e6 : 95,
    step: profile.arcTargetUnit === "tokens" ? 50 : 1,
    defaultValue: profile.arcTargetUnit === "tokens" ? PROFILE_DEFAULTS.arcTargetTokens : PROFILE_DEFAULTS.arcTargetPercent,
    onBlur: (v) => {
      if (v === null)
        return;
      if (profile.arcTargetUnit === "tokens")
        patch({ arcTargetTokens: v });
      else
        patch({ arcTargetPercent: v });
    }
  })));
  sec.body.appendChild(arcRatioGrid);
  const volumeTitle = document.createElement("div");
  volumeTitle.className = "lmb-subgroup-title";
  volumeTitle.style.marginTop = "6px";
  volumeTitle.textContent = "Volume";
  sec.body.appendChild(volumeTitle);
  const volumeHint = document.createElement("div");
  volumeHint.className = "lmb-field-hint";
  volumeHint.textContent = "Volumes are manual only. Turn arcs into a volume from the Make tab.";
  sec.body.appendChild(volumeHint);
  const volumeRatioGrid = document.createElement("div");
  volumeRatioGrid.className = "lmb-grid-2";
  volumeRatioGrid.append(labelled("Volume ratio", select({
    value: profile.volumeTargetUnit,
    options: [
      { value: "percent", label: "% of input" },
      { value: "tokens", label: "token budget" }
    ],
    onChange: (v) => patch({ volumeTargetUnit: v === "tokens" ? "tokens" : "percent" })
  })), labelled(profile.volumeTargetUnit === "tokens" ? "Volume tokens" : "Volume %", numberInput({
    value: profile.volumeTargetUnit === "tokens" ? profile.volumeTargetTokens : profile.volumeTargetPercent,
    min: profile.volumeTargetUnit === "tokens" ? 50 : 5,
    max: profile.volumeTargetUnit === "tokens" ? 1e6 : 95,
    step: profile.volumeTargetUnit === "tokens" ? 50 : 1,
    defaultValue: profile.volumeTargetUnit === "tokens" ? PROFILE_DEFAULTS.volumeTargetTokens : PROFILE_DEFAULTS.volumeTargetPercent,
    onBlur: (v) => {
      if (v === null)
        return;
      if (profile.volumeTargetUnit === "tokens")
        patch({ volumeTargetTokens: v });
      else
        patch({ volumeTargetPercent: v });
    }
  })));
  sec.body.appendChild(volumeRatioGrid);
  host.appendChild(sec.wrap);
}
function renderConnection(host, state, profile, patch) {
  const sec = section("Connection");
  const opts = [
    { value: "", label: state.connections.length ? "Default connection" : "No connections available" },
    ...state.connections.map((c2) => ({
      value: c2.id,
      label: `${c2.name} - ${c2.provider}${c2.model ? "/" + c2.model : ""}${c2.isDefault ? " (default)" : ""}`
    }))
  ];
  sec.body.appendChild(select({
    value: profile.connectionId ?? "",
    options: opts,
    onChange: (v) => patch({ connectionId: v || null })
  }));
  if (state.resolvedSidecarConnectionId) {
    const resolved = state.connections.find((c2) => c2.id === state.resolvedSidecarConnectionId);
    if (resolved) {
      const hint = document.createElement("div");
      hint.className = "lmb-field-hint";
      hint.textContent = `Memoria writes with ${resolved.name}`;
      sec.body.appendChild(hint);
    }
  }
  host.appendChild(sec.wrap);
}
function renderSamplers(host, state, profile, send) {
  const sec = section("Samplers");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "LumiBooks ships with its own sampler defaults tuned for summarization (low temperature, generous output budget). Empty fields use those defaults - placeholders show what will be sent. Temperature, max output, and max input are always sent on the wire; top_p / top_k / penalties are only sent when you set them.";
  sec.body.appendChild(help);
  const saveSampler = (key) => (v) => {
    const patch = { [key]: v };
    send({ type: "save_samplers", profileId: profile.id, samplers: patch, chatId: state.activeChatId });
  };
  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  grid.append(labelled("Max input tokens", numberInput({
    value: profile.samplers.max_input_tokens,
    min: 256,
    max: 4000000,
    step: 1024,
    placeholder: String(SAMPLER_DEFAULTS.max_input_tokens),
    onBlur: saveSampler("max_input_tokens")
  })), labelled("Max output tokens", numberInput({
    value: profile.samplers.max_tokens,
    min: 1,
    max: 1e6,
    step: 256,
    placeholder: String(SAMPLER_DEFAULTS.max_tokens),
    onBlur: saveSampler("max_tokens")
  })));
  sec.body.appendChild(grid);
  const sampleGrid = document.createElement("div");
  sampleGrid.className = "lmb-grid-3";
  sampleGrid.append(labelled("Temperature", numberInput({
    value: profile.samplers.temperature,
    min: 0,
    max: 2,
    step: 0.05,
    placeholder: String(SAMPLER_DEFAULTS.temperature),
    onBlur: saveSampler("temperature")
  })), labelled("Top P", numberInput({
    value: profile.samplers.top_p,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: String(SAMPLER_DEFAULTS.top_p),
    onBlur: saveSampler("top_p")
  })), labelled("Top K", numberInput({
    value: profile.samplers.top_k,
    min: 0,
    max: 1000,
    step: 1,
    placeholder: String(SAMPLER_DEFAULTS.top_k),
    onBlur: saveSampler("top_k")
  })), labelled("Freq penalty", numberInput({
    value: profile.samplers.frequency_penalty,
    min: -2,
    max: 2,
    step: 0.05,
    placeholder: String(SAMPLER_DEFAULTS.frequency_penalty),
    onBlur: saveSampler("frequency_penalty")
  })), labelled("Pres penalty", numberInput({
    value: profile.samplers.presence_penalty,
    min: -2,
    max: 2,
    step: 0.05,
    placeholder: String(SAMPLER_DEFAULTS.presence_penalty),
    onBlur: saveSampler("presence_penalty")
  })));
  sec.body.appendChild(sampleGrid);
  host.appendChild(sec.wrap);
}
function renderRegex(host, state, profile, patch) {
  const sec = section("Regex");
  if (state.regexScripts.length === 0) {
    sec.body.appendChild(textNode("No regex scripts found in Lumiverse", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Outgoing runs on the prompt before Memoria reads it. Incoming runs on the result after Memoria writes.";
  sec.body.appendChild(help);
  const outgoing = field("Outgoing");
  outgoing.body.appendChild(multiSelect({
    options: state.regexScripts.map((s) => ({ value: s.id, label: s.name })),
    selected: profile.regexOutgoingScriptIds,
    onChange: (ids) => patch({ regexOutgoingScriptIds: ids })
  }));
  sec.body.appendChild(outgoing.wrap);
  const incoming = field("Incoming");
  incoming.body.appendChild(multiSelect({
    options: state.regexScripts.map((s) => ({ value: s.id, label: s.name })),
    selected: profile.regexIncomingScriptIds,
    onChange: (ids) => patch({ regexIncomingScriptIds: ids })
  }));
  sec.body.appendChild(incoming.wrap);
  host.appendChild(sec.wrap);
}
function renderContext(host, profile, patch) {
  const sec = section("Context");
  const f = field("Chapter context");
  f.body.appendChild(numberInput({
    value: profile.previousMemoriesCount,
    min: 0,
    max: 20,
    defaultValue: PROFILE_DEFAULTS.previousMemoriesCount,
    onBlur: (v) => patch({ previousMemoriesCount: v ?? PROFILE_DEFAULTS.previousMemoriesCount })
  }));
  const hint = document.createElement("div");
  hint.className = "lmb-field-hint";
  hint.textContent = "How many recent chapters to feed Memoria as continuity context.";
  f.body.appendChild(hint);
  sec.body.appendChild(f.wrap);
  const retry = field("Retries");
  retry.body.appendChild(numberInput({
    value: profile.retryCount,
    min: 0,
    max: 10,
    defaultValue: PROFILE_DEFAULTS.retryCount,
    onBlur: (v) => patch({ retryCount: v ?? PROFILE_DEFAULTS.retryCount })
  }));
  const retryHint = document.createElement("div");
  retryHint.className = "lmb-field-hint";
  retryHint.textContent = "Tries per attempt. After the last try, Memoria will pick the same messages again next turn.";
  retry.body.appendChild(retryHint);
  sec.body.appendChild(retry.wrap);
  const ttft = field("First-token timeout (seconds)");
  ttft.body.appendChild(numberInput({
    value: profile.ttftTimeoutSecs,
    min: 10,
    max: 600,
    step: 5,
    defaultValue: PROFILE_DEFAULTS.ttftTimeoutSecs,
    onBlur: (v) => patch({ ttftTimeoutSecs: v ?? PROFILE_DEFAULTS.ttftTimeoutSecs })
  }));
  const ttftHint = document.createElement("div");
  ttftHint.className = "lmb-field-hint";
  ttftHint.textContent = "How long Memoria waits for the first streamed token before giving up. After the first token she lets the stream run.";
  ttft.body.appendChild(ttftHint);
  sec.body.appendChild(ttft.wrap);
  host.appendChild(sec.wrap);
}
function renderBehavior(host, profile, patch) {
  const sec = section("Behavior");
  sec.body.appendChild(checkbox({
    checked: profile.hideCoveredMessages,
    label: "Hide messages once filed",
    hint: "Greys out covered messages in the chat. Enforcement runs in the interceptor either way.",
    onChange: (v) => patch({ hideCoveredMessages: v })
  }));
  sec.body.appendChild(checkbox({
    checked: profile.showMemoryPreviews,
    label: "Preview before saving",
    hint: "Memoria stages new chapters and arcs in the Books tab for your approval.",
    onChange: (v) => patch({ showMemoryPreviews: v })
  }));
  host.appendChild(sec.wrap);
}

// src/ui/tabs/prompts-tab.ts
var CATEGORY_SUBTABS = [
  { key: "chapter", label: "Chapter" },
  { key: "arc", label: "Arc" },
  { key: "volume", label: "Volume" }
];
var local2 = { category: "chapter" };
function renderPromptsPane(host, state, ctx, send) {
  const profile = state.activeProfile;
  const setKey = (category, key) => {
    const p = category === "arc" ? { arcPresetKey: key } : category === "volume" ? { volumePresetKey: key } : { chapterPresetKey: key };
    send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  };
  const selectedKeyFor = (c2) => c2 === "arc" ? profile.arcPresetKey : c2 === "volume" ? profile.volumePresetKey : profile.chapterPresetKey;
  const pane = document.createElement("div");
  pane.className = "lmb-pane";
  host.appendChild(pane);
  const draw = () => {
    pane.replaceChildren();
    pane.appendChild(makeSubtabs(CATEGORY_SUBTABS, local2.category, (key) => {
      local2.category = key;
      draw();
    }));
    renderCategory(pane, state, ctx, send, local2.category, selectedKeyFor(local2.category), setKey);
    renderMemoriaOverrides(pane, state, send);
    renderImport(pane, state, ctx, send);
    renderHelp(pane);
  };
  draw();
}
var ALPHABET_PICK = "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}";
var DEFAULT_SHORT_COMMENT_RULES_TEMPLATE = [
  "A single playful nyandere remark in Memoria voice about the scene you just summarized.",
  `It must start with a word beginning with the letter "${ALPHABET_PICK}".`,
  `It must also include another word that starts with the letter "${ALPHABET_PICK}".`,
  "One sentence only. No emoji. Stay in catgirl-librarian register, slightly possessive, slightly proud."
].join(" ");
var DEFAULT_MEMORIA_PERSONA = [
  "You are Memoria, a young nyandere catgirl librarian with black hair and blue eyes, wearing a maid uniform.",
  "You quietly keep this user's story shelved and organized.",
  "When you write a JSON memory, you obey the schema strictly and never break it,",
  "but the short_comment field is your one allowed indulgence: one nyandere remark about the scene you just filed."
].join(" ");
function renderMemoriaOverrides(host, state, send) {
  const sec = section("Memoria overrides");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Persona is the system-prompt header. Short-comment rules control how {{memoria_short_comment_rules}} expands inside any prompt.";
  sec.body.appendChild(help);
  const profile = state.activeProfile;
  const chatId = state.activeChatId;
  sec.body.appendChild(buildOverrideBlock({
    label: "Memoria persona",
    value: profile.memoriaPersonaOverride ?? DEFAULT_MEMORIA_PERSONA,
    defaultText: DEFAULT_MEMORIA_PERSONA,
    rows: 4,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, memoriaPersonaOverride: next },
      chatId
    })
  }));
  sec.body.appendChild(buildOverrideBlock({
    label: "Memoria short-comment rules",
    value: profile.shortCommentRulesOverride ?? DEFAULT_SHORT_COMMENT_RULES_TEMPLATE,
    defaultText: DEFAULT_SHORT_COMMENT_RULES_TEMPLATE,
    rows: 4,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, shortCommentRulesOverride: next },
      chatId
    })
  }));
  host.appendChild(sec.wrap);
}
function buildOverrideBlock(opts) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = opts.label;
  wrap.appendChild(lbl);
  const area = document.createElement("textarea");
  area.className = "lmb-input lmb-textarea";
  area.rows = opts.rows;
  area.value = opts.value;
  area.addEventListener("input", () => {
    opts.onSave(area.value);
  });
  wrap.appendChild(area);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "lmb-btn small";
  resetBtn.textContent = "Reset to default";
  let confirmTimer = null;
  const restoreIdle = () => {
    resetBtn.textContent = "Reset to default";
    resetBtn.classList.remove("danger");
    confirmTimer = null;
  };
  resetBtn.addEventListener("click", () => {
    if (confirmTimer === null) {
      resetBtn.textContent = "Click again to confirm";
      resetBtn.classList.add("danger");
      confirmTimer = setTimeout(restoreIdle, 3000);
      return;
    }
    clearTimeout(confirmTimer);
    confirmTimer = null;
    restoreIdle();
    area.value = opts.defaultText;
    opts.onSave(null);
  });
  actions.appendChild(resetBtn);
  wrap.appendChild(actions);
  return wrap;
}
function renderCategory(host, state, ctx, send, category, selectedKey, setKey) {
  const sec = section(category === "arc" ? "Arc prompt" : category === "volume" ? "Volume prompt" : "Chapter prompt");
  const builtIns = category === "arc" ? state.arcPresets : category === "volume" ? state.volumePresets : state.chapterPresets;
  const customs = state.customPresets.filter((p) => p.category === category);
  const opts = [
    ...builtIns.map((b) => ({ value: b.key, label: `Built-in: ${b.displayName}` })),
    ...customs.map((c2) => ({ value: c2.key, label: `Custom: ${c2.displayName}` }))
  ];
  const pickerRow = document.createElement("div");
  pickerRow.className = "lmb-field-row";
  const grow = document.createElement("div");
  grow.className = "lmb-grow";
  grow.appendChild(select({
    value: selectedKey,
    options: opts,
    onChange: (v) => setKey(category, v)
  }));
  pickerRow.append(grow);
  sec.body.appendChild(pickerRow);
  const isUserPreset = customs.some((c2) => c2.key === selectedKey);
  const selectedText = findPresetText(state, category, selectedKey);
  const buttonsRow = document.createElement("div");
  buttonsRow.className = "lmb-actions";
  buttonsRow.append(makeButton("New blank prompt", async () => {
    const name = await promptForString(ctx, `Name for new ${category} prompt`, "Untitled");
    if (!name)
      return;
    const key = `${category}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    send({
      type: "save_custom_preset",
      preset: {
        key,
        displayName: name,
        prompt: blankPromptTemplate(category),
        category,
        createdAt: Date.now()
      },
      chatId: state.activeChatId
    });
    setKey(category, key);
  }, { small: true }), makeButton(isUserPreset ? "Duplicate to new" : "Duplicate to edit", async () => {
    const sourceName = customs.find((c2) => c2.key === selectedKey)?.displayName ?? builtIns.find((b) => b.key === selectedKey)?.displayName ?? "Untitled";
    const name = await promptForString(ctx, `Name for duplicate`, `${sourceName} copy`);
    if (!name)
      return;
    const key = `${category}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    send({
      type: "save_custom_preset",
      preset: {
        key,
        displayName: name,
        prompt: selectedText,
        category,
        createdAt: Date.now()
      },
      chatId: state.activeChatId
    });
    setKey(category, key);
  }, { small: true }), makeButton("Dry run", () => {
    if (!state.activeChatId)
      return;
    send(category === "arc" ? { type: "dry_run_arc", chatId: state.activeChatId } : category === "volume" ? { type: "dry_run_volume", chatId: state.activeChatId } : { type: "dry_run_chapter", chatId: state.activeChatId });
  }, {
    small: true,
    disabled: !state.activeChatId || !state.settings.enabled,
    title: "Assemble this preset's prompt with all macros resolved and show what would be sent. Does not call the model."
  }), makeButton("Delete", async () => {
    if (!isUserPreset)
      return;
    const ok = await confirmDelete(ctx, "Delete prompt?", "This removes the custom prompt and falls back to the built-in default.");
    if (!ok)
      return;
    send({ type: "delete_custom_preset", key: selectedKey, category, chatId: state.activeChatId });
  }, { small: true, danger: true, disabled: !isUserPreset }));
  sec.body.appendChild(buttonsRow);
  if (isUserPreset) {
    const custom = customs.find((c2) => c2.key === selectedKey);
    const draft = { ...custom };
    const flush = () => send({
      type: "save_custom_preset",
      preset: { ...draft },
      chatId: state.activeChatId
    });
    const nameField = field("Display name");
    nameField.body.appendChild(textInput({
      value: draft.displayName,
      onBlur: (v) => {
        draft.displayName = v.slice(0, 80);
        flush();
      }
    }));
    sec.body.appendChild(nameField.wrap);
    const textField = field("Prompt");
    textField.body.appendChild(textArea({
      value: draft.prompt,
      rows: 14,
      onBlur: (v) => {
        draft.prompt = v;
        flush();
      }
    }));
    sec.body.appendChild(textField.wrap);
  } else {
    const lbl = document.createElement("div");
    lbl.className = "lmb-field-label";
    lbl.textContent = "Prompt (built-in, duplicate to edit)";
    sec.body.appendChild(lbl);
    const view = document.createElement("div");
    view.className = "lmb-preset-text";
    view.textContent = selectedText;
    sec.body.appendChild(view);
  }
  host.appendChild(sec.wrap);
}
function blankPromptTemplate(category) {
  const noun = category === "arc" ? "arc" : category === "volume" ? "volume" : "chapter";
  return [
    `Summarize the following ${noun} into a JSON memory.`,
    "",
    "Return ONLY valid JSON in this exact shape:",
    "{",
    '  "title": "Short title",',
    `  "content": "Memoria's compressed text. Aim for ~{{target_tokens}} tokens.",`,
    '  "keywords": ["keyword1", "keyword2"],',
    '  "short_comment": "{{memoria_short_comment_rules}}"',
    "}",
    "",
    "No commentary outside the JSON."
  ].join(`
`);
}
function findPresetText(state, category, key) {
  const c2 = state.customPresets.find((p) => p.key === key && p.category === category);
  if (c2)
    return c2.prompt;
  const builtIns = category === "arc" ? state.arcPresets : category === "volume" ? state.volumePresets : state.chapterPresets;
  const b = builtIns.find((p) => p.key === key);
  return b?.prompt ?? "";
}
function renderImport(host, state, ctx, send) {
  const sec = section("Import STMB presets");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Upload a SillyTavern Memory Books export. Memoria reads the prompts and adds them as custom presets you can edit.";
  sec.body.appendChild(help);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(makeButton("Import chapter presets", () => importFile(ctx, "chapter", send, state.activeChatId)), makeButton("Import arc presets", () => importFile(ctx, "arc", send, state.activeChatId)));
  sec.body.appendChild(row);
  if (state.customPresets.length > 0) {
    const list = document.createElement("ul");
    list.className = "lmb-entry-list";
    for (const p of state.customPresets) {
      const li = document.createElement("li");
      li.className = "lmb-entry";
      const head = document.createElement("div");
      head.className = "lmb-entry-head";
      const tag = document.createElement("span");
      tag.className = "lmb-entry-tag";
      tag.textContent = p.category.toUpperCase();
      const title = document.createElement("div");
      title.className = "lmb-entry-title";
      title.textContent = p.displayName;
      head.append(tag, title);
      head.append(makeButton("Delete", async () => {
        const ok = await confirmDelete(ctx, "Delete preset?", "");
        if (ok)
          send({ type: "delete_custom_preset", key: p.key, category: p.category, chatId: state.activeChatId });
      }, { small: true, danger: true }));
      li.appendChild(head);
      list.appendChild(li);
    }
    sec.body.appendChild(list);
  } else {
    sec.body.appendChild(textNode("No custom presets yet", "lmb-empty"));
  }
  host.appendChild(sec.wrap);
}
function importFile(ctx, category, send, chatId) {
  ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 1e6 }).then((files) => {
    if (!files.length)
      return;
    const file = files[0];
    let text;
    try {
      text = new TextDecoder().decode(file.bytes);
    } catch (err) {
      console.warn("[LumiBooks] preset file decode failed", err);
      showImportFailure(ctx, "Memoria can't read this file");
      return;
    }
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.warn("[LumiBooks] preset JSON parse failed", err);
      showImportFailure(ctx, "Memoria couldn't parse the preset JSON");
      return;
    }
    send({ type: "import_preset", category, raw: parsed, chatId });
  }).catch((err) => {
    console.warn("[LumiBooks] import picker failed", err);
  });
}
function showImportFailure(ctx, message) {
  try {
    ctx.ui.showConfirm({
      title: "Import failed",
      message,
      variant: "warning",
      confirmLabel: "OK",
      cancelLabel: "OK"
    });
  } catch {
    window.alert(message);
  }
}
function renderHelp(host) {
  const sec = section("Info");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.innerHTML = [
    "Duplicate any built-in, or create new to edit.",
    "Prompts must ask the model for strict JSON (examples below).",
    "{{target_tokens}} expands to the active compression target.",
    "{{memoria_short_comment_rules}} expands to this turn's nyandere short-comment rules.",
    "Prompts are macro-evaluated."
  ].join("<br/>");
  sec.body.appendChild(help);
  host.appendChild(sec.wrap);
}

// src/ui/tabs/tuning-tab.ts
var SUBTABS3 = [
  { key: "profile", label: "Profile" },
  { key: "codex", label: "Codex" },
  { key: "model", label: "Model" },
  { key: "prompts", label: "Prompts" }
];
var local3 = { subtab: "profile" };
function renderTuningTab(host, state, ctx, send) {
  host.replaceChildren();
  if (local3.subtab !== "profile") {
    const strip = document.createElement("div");
    strip.className = "lmb-profile-strip";
    strip.append(document.createTextNode("Profile"));
    const name = document.createElement("b");
    name.textContent = state.activeProfile.name;
    strip.appendChild(name);
    if (!state.settings.enabled) {
      strip.appendChild(document.createTextNode("· extension off"));
    }
    strip.title = "Switch or manage profiles in the Profile pane";
    host.appendChild(strip);
  }
  host.appendChild(makeSubtabs(SUBTABS3, local3.subtab, (key) => {
    local3.subtab = key;
    renderTuningTab(host, state, ctx, send);
    scrollPaneTop(host);
  }));
  const profile = state.activeProfile;
  const patch = (p) => send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  const pane = document.createElement("div");
  pane.className = "lmb-pane";
  if (!state.settings.enabled && local3.subtab !== "profile") {
    pane.classList.add("lmb-greyed");
    pane.setAttribute("inert", "");
  }
  host.appendChild(pane);
  switch (local3.subtab) {
    case "profile": {
      renderProfilePicker(pane, state, ctx, send);
      const rest = document.createElement("div");
      rest.className = "lmb-pane";
      if (!state.settings.enabled) {
        rest.classList.add("lmb-greyed");
        rest.setAttribute("inert", "");
      }
      pane.appendChild(rest);
      renderCompressionTargets(rest, profile, patch);
      renderAutomation(rest, profile, patch);
      renderContext(rest, profile, patch);
      renderBehavior(rest, profile, patch);
      renderGlobalSettings(rest, state, send);
      renderResetSettings(rest, state, send);
      break;
    }
    case "codex":
      renderCodexSettings(pane, state, profile, patch);
      break;
    case "model":
      renderConnection(pane, state, profile, patch);
      renderSamplers(pane, state, profile, send);
      renderRegex(pane, state, profile, patch);
      break;
    case "prompts":
      renderPromptsPane(pane, state, ctx, send);
      break;
  }
}
function renderGlobalSettings(host, state, send) {
  const sec = section("Everywhere");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "These apply to every chat and profile on this account.";
  sec.body.appendChild(help);
  sec.body.appendChild(checkbox({
    checked: state.settings.showAutomationToasts,
    label: "Automation toasts",
    hint: "When off, Memoria's background runs stay quiet. Errors and your own actions still toast.",
    onChange: (v) => send({ type: "save_settings", patch: { showAutomationToasts: v }, chatId: state.activeChatId })
  }));
  sec.body.appendChild(checkbox({
    checked: state.settings.forceConstantEntries,
    label: "Force constant entries",
    hint: "When on, every LumiBooks lorebook entry (current and future) is marked constant so it activates without keyword matching. Toggling re-flips every existing LumiBooks entry across all chats.",
    onChange: (v) => send({ type: "set_force_constant", value: v, chatId: state.activeChatId })
  }));
  host.appendChild(sec.wrap);
}

// src/ui/tabs/about-tab.ts
function renderAboutTab(host, state, send) {
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
  tag.textContent = "Young nyandere catgirl in a maid uniform. Black hair, blue eyes. " + "Files your chats into chapters, binds chapters into arcs, and leaves a tiny nyaa note on every shelf.";
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
    "Storage lives in a per-chat world book named LumiBooks. Renaming or deleting entries there releases the messages back."
  ];
  for (const l of lines) {
    how.body.appendChild(textNode(l, "lmb-about-line"));
  }
  host.appendChild(how.wrap);
  const where = section("Where things live");
  for (const l of [
    "Settings and toggles moved to Tuning (profile, codex, model, prompts, account-wide switches).",
    "Shelf repair tools live under Books → Continuity."
  ]) {
    where.body.appendChild(textNode(l, "lmb-about-line"));
  }
  host.appendChild(where.wrap);
  const ack = section("Acknowledgements");
  const a2 = document.createElement("div");
  a2.className = "lmb-about-line";
  a2.textContent = "Built on Lumiverse Spindle, with prompts and UX inspired by SillyTavern Memory Books. " + "Memoria thanks the original Memory Books authors for the inspiration.";
  ack.body.appendChild(a2);
  host.appendChild(ack.wrap);
}

// src/ui/app.ts
var TAB_ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v3"/><path d="M5.6 6.6l2.1 2.1"/><path d="M18.4 6.6l-2.1 2.1"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M3 19h18"/></svg>`,
  books: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>`,
  codex: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 10-10 10L2 12z"/><path d="M12 7.5l4.5 4.5-4.5 4.5L7.5 12z"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>`,
  tuning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6"/><path d="M6 14v6"/><path d="M12 4v2"/><path d="M12 10v10"/><path d="M18 4v8"/><path d="M18 16v4"/><path d="M4 10h4"/><path d="M10 6h4"/><path d="M16 12h4"/></svg>`,
  stuff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l0.9 2.1L22 19l-2.1 0.9L19 22l-0.9-2.1L16 19l2.1-0.9z"/></svg>`
};
var TABS = [
  { key: "home", label: "Home" },
  { key: "books", label: "Books" },
  { key: "codex", label: "Codex" },
  { key: "tuning", label: "Tuning" },
  { key: "stuff", label: "Stuff" }
];
var FONT_LINK_ID = "lmb-deco-fonts";
function ensureDecoFonts() {
  if (document.getElementById(FONT_LINK_ID))
    return;
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://fonts.gstatic.com";
  preconnect.crossOrigin = "anonymous";
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Marcellus&family=Josefin+Sans:ital,wght@0,400;0,600;1,400&display=swap";
  document.head.append(preconnect, link);
}
function setup(ctx) {
  ensureDecoFonts();
  ctx.dom.addStyle(STYLES);
  const tab = ctx.ui.registerDrawerTab({
    id: "lumi_books_tab",
    title: "LumiBooks",
    shortName: "Books",
    description: "Memoria files your chat into chapters and arcs.",
    keywords: ["lumibooks", "lumi books", "memoria", "memory", "chapters", "arcs", "summary", "codex"],
    headerTitle: "LumiBooks",
    iconSvg: ICON_SVG
  });
  const root = document.createElement("div");
  root.className = "lmb-root";
  tab.root.appendChild(root);
  const strip = document.createElement("div");
  strip.className = "lmb-tabstrip";
  root.appendChild(strip);
  const content = document.createElement("div");
  content.className = "lmb-tab-content";
  root.appendChild(content);
  let activeTab = "home";
  let lastState = null;
  let renderPending = false;
  const tabButtons = new Map;
  for (const t of TABS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lmb-tab";
    const icon = document.createElement("span");
    icon.className = "lmb-tab-icon";
    icon.innerHTML = TAB_ICONS[t.key];
    const label = document.createElement("span");
    label.className = "lmb-tab-label";
    label.textContent = t.label;
    btn.append(icon, label);
    btn.addEventListener("click", () => {
      activeTab = t.key;
      refreshTabStyles();
      doRender();
      scrollPaneTop(content);
    });
    strip.appendChild(btn);
    tabButtons.set(t.key, btn);
  }
  const send = (msg) => ctx.sendToBackend(msg);
  const refreshTabStyles = () => {
    for (const [key, btn] of tabButtons) {
      btn.classList.toggle("active", key === activeTab);
    }
  };
  const hasFocusedEditableChild = () => {
    const active = document.activeElement;
    if (!active || !content.contains(active))
      return false;
    const tag = active.tagName;
    if (tag === "TEXTAREA")
      return true;
    if (tag !== "INPUT")
      return false;
    const type = (active.type || "text").toLowerCase();
    return type === "text" || type === "number" || type === "search" || type === "email" || type === "url" || type === "tel" || type === "password";
  };
  let lastRenderedTab = null;
  const doRender = () => {
    if (!lastState) {
      content.replaceChildren();
      lastRenderedTab = null;
      return;
    }
    const renderInner = () => {
      if (activeTab === "home")
        renderHomeTab(content, lastState, ctx, send);
      else if (activeTab === "books")
        renderBooksTab(content, lastState, ctx, send);
      else if (activeTab === "codex")
        renderCodexTab(content, lastState, ctx, send);
      else if (activeTab === "tuning")
        renderTuningTab(content, lastState, ctx, send);
      else
        renderAboutTab(content, lastState, send);
    };
    if (lastRenderedTab === activeTab) {
      preserveScroll(content, renderInner);
    } else {
      renderInner();
    }
    lastRenderedTab = activeTab;
  };
  const renderActive = () => {
    if (hasFocusedEditableChild()) {
      renderPending = true;
      return;
    }
    renderPending = false;
    doRender();
  };
  content.addEventListener("focusout", () => {
    if (!renderPending)
      return;
    setTimeout(() => {
      if (hasFocusedEditableChild())
        return;
      renderPending = false;
      doRender();
    }, 0);
  });
  refreshTabStyles();
  const unsub = ctx.onBackendMessage((raw) => {
    const msg = raw;
    switch (msg.type) {
      case "state":
        lastState = msg.state;
        renderActive();
        break;
      case "toast":
        if (msg.tone === "error")
          console.error(`[LumiBooks] ${msg.text}`);
        else if (msg.tone === "warn")
          console.warn(`[LumiBooks] ${msg.text}`);
        else
          console.info(`[LumiBooks] ${msg.tone}: ${msg.text}`);
        showInlineToast(root, msg.tone, msg.text);
        break;
      case "busy":
        if (lastState) {
          const prev = lastState.busy;
          const next = msg.entries;
          lastState = { ...lastState, busy: next };
          const finishedCodexChats = new Set;
          for (const b of prev) {
            if (b.kind !== "codex")
              continue;
            if (!next.some((n) => n.kind === "codex" && n.chatId === b.chatId)) {
              finishedCodexChats.add(b.chatId);
            }
          }
          for (const chatId of finishedCodexChats) {
            if (codexWantsRefresh(chatId))
              send({ type: "codex_read", chatId });
          }
          const sameShape = prev.length === next.length && prev.every((b, i) => b.kind === next[i].kind && b.chatId === next[i].chatId);
          if (activeTab === "home") {
            if (sameShape && tryUpdateBusyLabelsInPlace(next))
              break;
            if (hasFocusedEditableChild())
              renderPending = true;
            else
              renderHomeTab(content, lastState, ctx, send);
          } else if (activeTab === "codex" && !sameShape) {
            if (hasFocusedEditableChild())
              renderPending = true;
            else
              renderCodexTab(content, lastState, ctx, send);
          }
        }
        break;
      case "error":
        console.warn(`[LumiBooks] error: ${msg.text}`);
        break;
      case "dry_run_result":
        showDryRunModal(msg.kind, msg.messages, msg.diagnostics);
        break;
      case "codex_files":
        deliverCodexFiles(msg.chatId, msg.files, msg.savedFile, msg.savedSeq);
        if (activeTab === "codex" && lastState)
          renderActive();
        break;
      case "stream_text":
        deliverStreamText(msg);
        break;
    }
  });
  const onRevealEntry = (e) => {
    const entryId = e.detail?.entryId;
    if (!entryId || !lastState)
      return;
    focusShelfEntry(entryId);
    activeTab = "books";
    refreshTabStyles();
    doRender();
    scrollPaneTop(content);
  };
  document.addEventListener("lmb-reveal-entry", onRevealEntry);
  send({ type: "ready", chatId: null });
  const unsubActivate = tab.onActivate(() => send({ type: "refresh", chatId: null }));
  return () => {
    try {
      unsub();
    } catch (_) {}
    try {
      unsubActivate?.();
    } catch (_) {}
    try {
      document.removeEventListener("lmb-reveal-entry", onRevealEntry);
    } catch (_) {}
    try {
      tab.destroy?.();
    } catch (_) {}
  };
}
var TOAST_STACK_CAP = 5;
function showInlineToast(host, tone, text) {
  let stack = document.body.querySelector(":scope > .lmb-toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "lmb-toast-stack";
    document.body.appendChild(stack);
  }
  while (stack.childElementCount >= TOAST_STACK_CAP) {
    stack.firstElementChild?.remove();
  }
  const el = document.createElement("div");
  el.className = `lmb-toast lmb-toast-${tone}`;
  el.textContent = text;
  stack.appendChild(el);
  const duration = tone === "error" ? 8000 : tone === "warn" ? 6000 : 4000;
  setTimeout(() => {
    el.classList.add("lmb-toast-leaving");
    setTimeout(() => el.remove(), 200);
  }, duration);
}
export {
  setup
};
