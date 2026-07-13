import { LESSON_STYLES } from "./lessons/styles-lessons";

/**
 * LumiBooks visual system - "Gilded Archive".
 *
 * Art Deco structure rendered in Lumiverse's amethyst palette: gently rounded
 * frames with corner brackets and roman-numeral plaques, underlined inputs,
 * uppercase tracked labels, and glow instead of drop shadow. Every color
 * resolves through Lumiverse theme tokens (--lumiverse-*) so host themes
 * restyle LumiBooks for free; the rgba fallbacks mirror the stock theme.
 *
 * Built for a narrow vertical sidebar (~1/3.5 of a desktop screen) and scales
 * down to phone-width drawers. All ornament lives in CSS pseudo-elements so
 * the tab renderers stay markup-identical.
 */
export const STYLES = `
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
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  flex: 0 0 auto;
}
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
/* The web gets as much room as the pane can give, and the camera (pan and
   zoom) frames it, so labels stay readable at any cast size. */
.lmb-graph-wrap { position: relative; height: clamp(300px, 56vh, 620px); }
.lmb-graph {
  width: 100%;
  height: 100%;
  display: block;
  background:
    radial-gradient(90% 70% at 50% 40%, var(--lmb-frame-faint), transparent 75%),
    var(--lmb-fill-strong);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  touch-action: none;
  cursor: grab;
}
.lmb-graph:active { cursor: grabbing; }
.lmb-graph-tools {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  z-index: 2;
}
.lmb-graph-tools .lmb-btn {
  min-height: 0;
  padding: 4px 9px 3px;
  background: var(--lmb-void);
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
` + LESSON_STYLES;

/** Lucide "book-marked" (ISC license, lucide.dev): a book with a ribbon
 * bookmark, hinted to stay crisp at drawer-tab size. */
export const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 2v8l3-3 3 3V2"/>
  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
</svg>
`;
