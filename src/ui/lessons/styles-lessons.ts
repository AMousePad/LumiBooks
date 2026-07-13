/** Lessons from Memoria styles, appended to the main STYLES string. Every
 * lesson element mounts inside .lmb-root, so the token block applies. */
export const LESSON_STYLES = `
/* ------------------------------------------------------------ rune seal */
.lmb-rune-btn {
  padding: 12px 20px 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  animation: lmb-rune-pulse 3s var(--lmb-ease) infinite;
}
.lmb-rune-ring { display: none; }
@keyframes lmb-rune-pulse {
  0%, 100% { box-shadow: 0 0 10px var(--lmb-frame); text-shadow: 0 0 6px var(--lmb-frame-strong); }
  50% { box-shadow: 0 0 26px var(--lmb-frame-strong); text-shadow: 0 0 14px var(--lmb-frame-strong); }
}

.lmb-memoria-sprite {
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r);
  background: var(--lmb-fill-strong);
  padding: 2px;
  flex: 0 0 auto;
  object-fit: cover;
}

/* ------------------------------------------------------------ seal view */
.lmb-seal-wrap { position: relative; min-height: 420px; }
.lmb-seal-under {
  filter: saturate(0.4) opacity(0.5);
  min-height: 420px;
}
.lmb-seal-panel {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  width: min(430px, 94%);
  background: var(--lmb-panel);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  box-shadow: var(--lmb-glow-strong), var(--lmb-lift);
  padding: 16px 15px 13px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  z-index: 6;
}
.lmb-seal-hero { display: flex; gap: 11px; align-items: center; }
.lmb-seal-title {
  font-family: var(--lmb-display-font);
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--lmb-gold);
  margin-bottom: 3px;
}
.lmb-seal-pitch { font-size: 11.5px; color: var(--lmb-ink-muted); line-height: 1.5; }
.lmb-seal-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.lmb-seal-note { font-size: 10.5px; color: var(--lmb-ink-dim); }
.lmb-seal-busy { display: flex; flex-direction: column; gap: 6px; }
.lmb-seal-failure {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--lmb-danger);
  background: var(--lmb-danger-wash);
  border: 1px solid var(--lmb-danger-frame);
  border-radius: var(--lmb-r);
  padding: 6px 9px;
}

/* ----------------------------------------------------------- codex lock */
.lmb-codex-lock { display: flex; flex-direction: column; gap: 12px; }
.lmb-codex-lock-preview {
  position: relative;
  border: 1px dashed var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  padding: 14px 12px 12px;
  overflow: hidden;
}
.lmb-codex-lock-preview::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(-45deg, var(--lmb-frame-faint) 0 6px, transparent 6px 16px);
}
.lmb-codex-lock-watermark {
  position: absolute;
  top: 7px;
  right: 10px;
  font-size: 9.5px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lmb-ink-hint);
  z-index: 1;
}
.lmb-codex-lock-card {
  background: var(--lmb-panel);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  box-shadow: var(--lmb-glow);
  padding: 14px 13px 12px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.lmb-locked-btn {
  position: relative;
  border-style: dashed;
  opacity: 0.85;
  background: repeating-linear-gradient(-45deg, var(--lmb-frame-faint) 0 4px, transparent 4px 10px);
}

.lmb-lesson-reminder {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  background: var(--lmb-wash);
  border: 1px solid var(--lmb-frame);
  border-left: 3px solid var(--lmb-gold);
  border-radius: var(--lmb-r);
  font-size: 11.5px;
  color: var(--lmb-ink);
}

/* --------------------------------------------------------- lesson stage */
.lmb-lesson-stage {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: calc(100dvh - 190px);
  min-height: 430px;
}
.lmb-lesson-head { display: flex; align-items: center; gap: 10px; }
.lmb-lesson-title {
  font-family: var(--lmb-display-font);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-lesson-headlabel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}
.lmb-lesson-close {
  background: transparent;
  border: none;
  color: var(--lmb-ink-dim);
  font-size: 15px;
  cursor: pointer;
  padding: 3px 7px;
  border-radius: var(--lmb-r-sm);
}
.lmb-lesson-close:hover { color: var(--lmb-gold); background: var(--lmb-frame-faint); }

.lmb-lesson-rail { display: flex; align-items: center; gap: 9px; padding: 0 2px; min-height: 12px; }
.lmb-rail-node {
  width: 9px;
  height: 9px;
  transform: rotate(45deg);
  border: 1px solid var(--lmb-frame-strong);
  background: transparent;
  border-radius: 1.5px;
  transition: background 300ms var(--lmb-ease), box-shadow 300ms var(--lmb-ease);
}
.lmb-rail-node.done { background: linear-gradient(135deg, var(--lmb-gold), var(--lmb-metal)); }
.lmb-rail-node.current { box-shadow: 0 0 8px var(--lmb-frame-strong); border-color: var(--lmb-gold); }

.lmb-lesson-demo {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-lg);
  overflow: hidden;
  background: var(--lmb-void);
}
/* Working replica of the real tab strip: the user navigates the demo with it. */
.lmb-lesson-demostrip {
  flex: 0 0 auto;
  display: flex;
  gap: 2px;
  padding: 4px 5px;
  border-bottom: 1px solid var(--lmb-frame);
  background: var(--lumiverse-bg-deep-080, rgba(20, 17, 28, 0.85));
}
.lmb-demo-tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: transparent;
  border: none;
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-ink-dim);
  font-family: var(--lmb-display-font);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 2px 5px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 250ms var(--lmb-ease), background 250ms var(--lmb-ease);
}
.lmb-demo-tab-icon { width: 13px; height: 13px; display: inline-block; flex: 0 0 auto; }
.lmb-demo-tab-icon svg { width: 100%; height: 100%; display: block; }
.lmb-demo-tab:hover { color: var(--lmb-ink); background: var(--lmb-frame-faint); }
.lmb-demo-tab.active { color: var(--lmb-gold); background: var(--lmb-wash); }
.lmb-lesson-demo-inner {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.lmb-lesson-demo-root { padding: 12px 10px 24px; }

.lmb-lesson-cover {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
  background: radial-gradient(70% 55% at 50% 42%, var(--lmb-frame-faint), transparent 75%);
}
.lmb-lesson-cover .lmb-memoria-sprite {
  border-radius: 50%;
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow-strong);
}
.lmb-lesson-cover-title {
  font-family: var(--lmb-display-font);
  font-size: 16px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--lmb-gold);
  text-shadow: 0 0 14px var(--lmb-frame-strong);
}
.lmb-lesson-cover-orn { font-size: 8px; letter-spacing: 0.5em; color: var(--lmb-metal-soft); }
.lmb-lesson-cover-sec {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-ink-dim);
}

/* ------------------------------------------------------------- diagrams */
.lmb-lesson-diagram {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 11px;
  padding: 20px 14px;
}
.lmb-dg-label {
  font-family: var(--lmb-display-font);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--lmb-gold);
}
.lmb-dg-window {
  width: min(320px, 92%);
  height: 200px;
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  background: var(--lmb-fill-strong);
  box-shadow: var(--lmb-sheen);
  padding: 10px;
  overflow: hidden;
  display: flex;
}
.lmb-dg-window.tall { height: 240px; }
.lmb-dg-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  justify-content: flex-start;
}
.lmb-dg-col.bottom { justify-content: flex-end; }
.lmb-dg-bar {
  position: relative;
  flex: 0 0 auto;
  height: 12px;
  border-radius: 3px;
  background: var(--lmb-fill-hover);
  border: 1px solid var(--lmb-hairline);
  transition: opacity 450ms var(--lmb-ease), transform 450ms var(--lmb-ease), background 450ms var(--lmb-ease);
}
.lmb-dg-bar.in { opacity: 0; transform: translateY(6px) scaleY(0.4); }
.lmb-dg-bar.chapter {
  height: 20px;
  background: linear-gradient(135deg, var(--lmb-wash), var(--lmb-frame-faint));
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow);
}
.lmb-dg-bar.arc {
  height: 24px;
  background: linear-gradient(135deg, var(--lmb-frame), var(--lmb-wash));
  border-color: var(--lmb-metal);
  box-shadow: var(--lmb-glow-strong);
}
.lmb-dg-bar.clipped {
  background: var(--lmb-danger-wash);
  border-color: var(--lmb-danger-frame);
  opacity: 0.3;
}
.lmb-dg-bar.clipped::after {
  content: "✕";
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-58%);
  font-size: 9px;
  color: var(--lmb-danger);
}
.lmb-dg-tag {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--lmb-display-font);
  font-size: 8.5px;
  letter-spacing: 0.16em;
  color: var(--lmb-gold);
}
.lmb-dg-caption {
  min-height: 17px;
  font-size: 11px;
  font-style: italic;
  color: var(--lmb-ink-dim);
  text-align: center;
}
.lmb-dg-tier {
  font-family: var(--lmb-display-font);
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
  border: 1px solid var(--lmb-frame);
  border-radius: var(--lmb-r-sm);
  padding: 3px 12px 2px;
  transition: color 400ms var(--lmb-ease), box-shadow 400ms var(--lmb-ease);
}
.lmb-dg-tier.hot { color: var(--lmb-gold); border-color: var(--lmb-frame-strong); box-shadow: var(--lmb-glow); }
.lmb-dg-card {
  width: min(300px, 90%);
  border: 1px solid var(--lmb-volume-frame);
  border-radius: var(--lmb-r);
  background: var(--lmb-fill);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.lmb-dg-line { height: 8px; border-radius: 2px; background: var(--lmb-fill-hover); }
.lmb-dg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 94%;
}
.lmb-dg-chip {
  font-size: 10px;
  color: var(--lmb-ink-muted);
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r-sm);
  background: var(--lmb-fill);
  padding: 3px 8px;
  transition: opacity 700ms var(--lmb-ease), transform 700ms var(--lmb-ease),
    color 400ms var(--lmb-ease), border-color 400ms var(--lmb-ease);
}
.lmb-dg-chip.gone { opacity: 0.12; transform: scale(0.92); }
.lmb-dg-chips.kept .lmb-dg-chip {
  color: var(--lmb-gold);
  border-color: var(--lmb-frame-strong);
  background: var(--lmb-frame-faint);
}
.lmb-shimmer { animation: lmb-shimmerflash 350ms var(--lmb-ease); }
@keyframes lmb-shimmerflash {
  0% { box-shadow: inset 0 0 0 1px transparent; }
  40% { box-shadow: inset 0 0 24px var(--lmb-frame-strong); }
  100% { box-shadow: inset 0 0 0 1px transparent; }
}

.lmb-spot-panel {
  position: absolute;
  background: rgba(5, 4, 10, 0.55);
  z-index: 5;
  pointer-events: none;
}
/* Nav funnel: the dim panels swallow clicks so the spotlighted control is the
   only clickable thing. Every other step leaves the whole pane live. */
.lmb-demo-funnel .lmb-spot-panel { pointer-events: auto; }
.lmb-spot-ring {
  position: absolute;
  z-index: 6;
  border: 2px solid var(--lmb-gold);
  border-radius: 7px;
  box-shadow: 0 0 14px var(--lmb-frame-strong), inset 0 0 10px var(--lmb-frame-faint);
  pointer-events: none;
  transition: top 150ms var(--lmb-ease), left 150ms var(--lmb-ease),
    width 150ms var(--lmb-ease), height 150ms var(--lmb-ease);
}
.lmb-demo-funnel .lmb-spot-ring { animation: lmb-nav-pulse 1.5s var(--lmb-ease) infinite; }
@keyframes lmb-nav-pulse {
  0%, 100% { box-shadow: 0 0 8px var(--lmb-frame-strong), inset 0 0 8px var(--lmb-frame-faint); }
  50% { box-shadow: 0 0 26px var(--lmb-frame-strong), inset 0 0 14px var(--lmb-frame); }
}

/* ---------------------------------------------------------- lesson sheet */
.lmb-lesson-sheet {
  flex: 0 0 auto;
  background: var(--lmb-panel-solid);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  box-shadow: var(--lmb-sheen), var(--lmb-glow);
  padding: 4px 12px 11px;
  transition: opacity 200ms var(--lmb-ease);
  max-height: 46%;
  overflow-y: auto;
}
.lmb-lesson-sheet.peeking { opacity: 0.15; }
.lmb-lesson-sheet.collapsed .lmb-lesson-sheet-body { display: none; }
.lmb-lesson-grab {
  display: block;
  width: 46px;
  height: 5px;
  margin: 4px auto 7px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: var(--lmb-frame-strong);
  cursor: pointer;
}
.lmb-lesson-row { display: flex; gap: 10px; align-items: flex-start; }
.lmb-lesson-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.lmb-lesson-text { font-size: 12.5px; line-height: 1.55; color: var(--lmb-ink); }
.lmb-lesson-nav { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.lmb-lesson-waiting { font-size: 11px; font-style: italic; color: var(--lmb-ink-hint); }

.lmb-spot-tag {
  position: absolute;
  z-index: 7;
  pointer-events: none;
  background: var(--lmb-void);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-gold);
  font-family: var(--lmb-mono-font);
  font-size: 10px;
  letter-spacing: 0.04em;
  padding: 3px 8px 2px;
  box-shadow: var(--lmb-glow);
  max-width: calc(100% - 12px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: top 150ms var(--lmb-ease), left 150ms var(--lmb-ease);
}
.lmb-lesson-exhibit {
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  background: var(--lmb-fill-strong);
  border: 1px solid var(--lmb-hairline);
  border-left: 3px solid var(--lmb-metal);
  border-radius: var(--lmb-r);
  padding: 8px 10px;
  color: var(--lmb-ink-muted);
}
.lmb-lesson-exhibit.error { border-left-color: var(--lmb-danger); }
.lmb-lesson-exhibit.warn { border-left-color: var(--lmb-warning); }

.lmb-lesson-options { display: flex; flex-direction: column; gap: 6px; }
.lmb-lesson-option {
  text-align: left;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r);
  color: var(--lmb-ink);
  font-family: var(--lmb-body-font);
  font-size: 12px;
  line-height: 1.45;
  padding: 8px 11px;
  cursor: pointer;
  transition: border-color 200ms var(--lmb-ease), background 200ms var(--lmb-ease);
}
.lmb-lesson-option:hover:not(:disabled) { border-color: var(--lmb-frame-strong); background: var(--lmb-frame-faint); }
.lmb-lesson-option:disabled { cursor: default; opacity: 0.75; }
.lmb-lesson-option.correct {
  border-color: var(--lmb-success-frame);
  background: var(--lmb-success-wash);
  color: var(--lmb-ink);
  opacity: 1;
}
.lmb-lesson-option.wrong { border-color: var(--lmb-danger-frame); background: var(--lmb-danger-wash); }
.lmb-lesson-verdict { min-height: 15px; font-size: 11.5px; letter-spacing: 0.04em; }
.lmb-lesson-verdict.ok { color: var(--lmb-gold); }
.lmb-lesson-verdict.miss { color: var(--lmb-ink-dim); }
.lmb-lesson-why { font-size: 11.5px; font-style: italic; color: var(--lmb-ink-muted); line-height: 1.5; }
.lmb-lesson-skip {
  background: transparent;
  border: none;
  color: var(--lmb-ink-hint);
  font-size: 10.5px;
  cursor: pointer;
  text-decoration: underline dotted;
  padding: 3px 4px;
}
.lmb-lesson-skip:hover { color: var(--lmb-ink-muted); }
.lmb-lesson-peek {
  align-self: flex-start;
  background: transparent;
  border: 1px dashed var(--lmb-edge);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-ink-dim);
  font-size: 10px;
  padding: 4px 8px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.lmb-lesson-modal {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.lmb-lesson-modal-card {
  width: min(420px, 100%);
  max-height: 90%;
  overflow-y: auto;
  background: var(--lmb-panel-solid);
  border: 1px solid var(--lmb-frame-strong);
  border-radius: var(--lmb-r-lg);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ------------------------------------------------------------- register */
.lmb-register { display: flex; flex-direction: column; gap: 9px; max-width: 340px; }

/* -------------------------------------------------------------- diploma */
.lmb-diploma {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 18px 10px;
}
.lmb-diploma-frame {
  width: min(460px, 100%);
  background: var(--lmb-panel-solid);
  border: 2px solid var(--lmb-volume-frame);
  box-shadow: inset 0 0 0 5px var(--lmb-panel-solid), inset 0 0 0 6px var(--lmb-volume-frame), var(--lmb-glow-strong);
  border-radius: 3px;
  padding: 22px 16px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: center;
}
.lmb-diploma-arch {
  font-family: var(--lmb-display-font);
  font-size: 13px;
  letter-spacing: 0.4em;
  color: var(--lmb-volume);
}
.lmb-diploma-course {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lmb-ink-muted);
}
.lmb-diploma-grant, .lmb-diploma-line { font-size: 11px; color: var(--lmb-ink-dim); font-style: italic; }
.lmb-diploma-name {
  font-family: var(--lmb-display-font);
  font-size: 24px;
  color: var(--lmb-ink);
  letter-spacing: 0.06em;
}
.lmb-diploma-stamp {
  display: inline-block;
  margin: 6px 0 2px;
  transform: rotate(-8deg);
  border: 2px solid currentColor;
  border-radius: 3px;
  padding: 4px 16px 3px;
  font-family: var(--lmb-display-font);
  font-size: 16px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.lmb-grade-gilded { color: #e8c66a; text-shadow: 0 0 12px rgba(232, 198, 106, 0.5); }
.lmb-grade-silver { color: #c8ccd8; }
.lmb-grade-bronze { color: #c9926a; }
.lmb-grade-apprentice { color: var(--lmb-ink-dim); }
.lmb-diploma-score { font-size: 10.5px; color: var(--lmb-ink-dim); }
.lmb-diploma-seal { display: flex; align-items: center; gap: 9px; margin-top: 4px; }
.lmb-diploma-seal .lmb-memoria-sprite { border-radius: 50%; }
.lmb-diploma-remark { font-size: 11px; font-style: italic; color: var(--lmb-ink-muted); text-align: left; }

.lmb-confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.lmb-confetti span {
  position: absolute;
  top: -20px;
  color: var(--lmb-volume);
  animation: lmb-confetti-fall 2.6s ease-in forwards;
}
@keyframes lmb-confetti-fall {
  to { transform: translateY(560px) rotate(240deg); opacity: 0; }
}

/* ------------------------------------------------------------ academy */
.lmb-academy-course {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r);
  padding: 10px 11px;
}
.lmb-academy-head { display: flex; align-items: center; gap: 8px; }
.lmb-academy-title { flex: 1; font-weight: 600; font-size: 12px; color: var(--lmb-ink); }
.lmb-academy-grade {
  font-family: var(--lmb-display-font);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: 1px solid currentColor;
  border-radius: 3px;
  padding: 2px 8px 1px;
  transform: rotate(-4deg);
}
.lmb-academy-sections { display: flex; flex-wrap: wrap; gap: 5px; }
.lmb-academy-section {
  background: transparent;
  border: 1px solid var(--lmb-edge);
  border-radius: var(--lmb-r-sm);
  color: var(--lmb-ink-dim);
  font-size: 10px;
  padding: 3px 7px;
  cursor: pointer;
}
.lmb-academy-section:hover { color: var(--lmb-gold); border-color: var(--lmb-frame-strong); }

@media (max-width: 600px) {
  .lmb-lesson-stage { height: calc(100dvh - 150px); }
  .lmb-lesson-option { min-height: 40px; font-size: 12.5px; }
  .lmb-lesson-sheet { max-height: 52%; }
  .lmb-seal-panel { top: 24px; }
}
@media (max-width: 430px) {
  .lmb-demo-tab-label { display: none; }
  .lmb-demo-tab-icon { width: 15px; height: 15px; }
}
`;
