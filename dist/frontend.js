// src/ui/lessons/styles-lessons.ts
var LESSON_STYLES = `
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
/* Per-field lock toggle riding inside a field label (codex entity editor). */
.lmb-field-lock {
  margin-left: 8px;
  padding: 0 6px;
  font: inherit;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--lmb-ink-dim);
  background: transparent;
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r-sm);
  cursor: pointer;
}
.lmb-field-lock:hover { color: var(--lmb-ink); border-color: var(--lmb-frame-strong); }
.lmb-field-lock.active {
  color: var(--lmb-warning);
  border-color: var(--lmb-warning-frame);
  background: var(--lmb-warning-wash);
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

/* ------------------------------------------------------- sampler switch */
/* Large two-way toggle on the Model pane: summary samplers vs codex
   samplers. Oversized on purpose so nobody edits the wrong set. */
.lmb-sampler-switch {
  display: flex;
  gap: 5px;
  padding: 5px;
  background: var(--lmb-fill);
  border: 1px solid var(--lmb-hairline);
  border-radius: var(--lmb-r-lg);
}
.lmb-sampler-switch button {
  flex: 1;
  background: transparent;
  border: 1px solid transparent;
  border-radius: calc(var(--lmb-r-lg) - 3px);
  color: var(--lmb-ink-dim);
  font-family: var(--lmb-display-font);
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 12px 8px 10px;
  cursor: pointer;
  transition: color 250ms var(--lmb-ease), background 250ms var(--lmb-ease),
    border-color 250ms var(--lmb-ease), box-shadow 350ms var(--lmb-ease);
}
.lmb-sampler-switch button:hover:not(.active) { color: var(--lmb-ink); background: var(--lmb-frame-faint); }
.lmb-sampler-switch button.active {
  color: var(--lmb-gold);
  background: var(--lmb-wash);
  border-color: var(--lmb-frame-strong);
  box-shadow: var(--lmb-glow);
  text-shadow: 0 0 10px var(--lmb-frame-strong);
}

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
var ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 2v8l3-3 3 3V2"/>
  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
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
  for (const d of defs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `lmb-subtab${d.key === active ? " active" : ""}`;
    btn.textContent = d.label;
    lessonMark(btn, `subtab.${d.key}`);
    btn.addEventListener("click", () => {
      if (d.key !== active)
        onPick(d.key);
    });
    bar.appendChild(btn);
  }
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
function lessonMark(el, id) {
  el.dataset["lesson"] = id;
  return el;
}
var TOAST_STACK_CAP = 5;
function showToast(tone, text) {
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

// src/ui/modals.ts
function codexCatchupWarnings(state) {
  const hasBooks = state.chapters.some((c) => !c.isRoot) || state.arcs.some((a) => !a.isRoot) || state.volumes.some((v) => !v.isRoot);
  const autoBooks = state.activeProfile.autoCreate && !state.activeProfile.showMemoryPreviews;
  const bigTailNoAuto = state.coverage.approxUncoveredTokens > 150000 && !autoBooks;
  const booksWarning = !hasBooks ? "This chat has no filed chapters yet, so fast and ultra fast would read the raw story anyway. File chapters first (Home, File all) to get the real speedup." : bigTailNoAuto ? "The unfiled tail of this chat is very large and will not be filed first, so the final raw pass stays huge. File chapters first (Home, File all) for the full speedup." : null;
  return { booksWarning, autoBooks };
}
function requestCodexUpdate(state, chatId, send) {
  if ((state.codexBacklogPasses ?? 0) <= 1) {
    send({ type: "codex_update_now", chatId });
    return;
  }
  const { booksWarning, autoBooks } = codexCatchupWarnings(state);
  showCodexCatchupModal({
    lead: `${state.codexBacklog ?? 0} message${(state.codexBacklog ?? 0) === 1 ? "" : "s"} are waiting, about ${state.codexBacklogPasses} passes at the current window. Pick how Memoria catches up.`,
    booksWarning,
    autoBooks,
    onPick: (mode) => send({ type: "codex_update_now", chatId, mode })
  });
}
function requestCodexRebuild(state, chatId, send) {
  const prof = state.activeProfile;
  const total = state.messages.length;
  const passes = prof.codexWindowUnit === "messages" ? Math.max(1, Math.ceil(total / Math.max(1, prof.codexWindowValue))) : Math.max(1, Math.ceil(state.messages.reduce((a, m) => a + m.approxTokens, 0) / Math.max(1000, prof.codexWindowValue)));
  const { booksWarning, autoBooks } = codexCatchupWarnings(state);
  showCodexCatchupModal({
    title: "Rebuild the codex",
    lead: `Memoria will erase the story bible and re-read all ${total} messages, about ${passes} slow passes. Pick how she rebuilds.`,
    booksWarning,
    autoBooks,
    onPick: (mode) => send({ type: "codex_rebuild", chatId, mode })
  });
}
var catchupClose = null;
function closeCodexCatchupModal() {
  catchupClose?.();
}
function showCodexCatchupModal(opts) {
  if (document.querySelector(".lmb-catchup"))
    return;
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay lmb-catchup";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  modal.style.width = "min(600px, 100%)";
  const close = () => {
    document.removeEventListener("keydown", onKey);
    if (catchupClose === close)
      catchupClose = null;
    overlay.remove();
  };
  catchupClose = close;
  const onKey = (e) => {
    if (e.key === "Escape")
      close();
  };
  document.addEventListener("keydown", onKey);
  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = opts.title ?? "The codex is far behind";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", close);
  header.append(title, closeBtn);
  modal.appendChild(header);
  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const paragraphs = [
    opts.lead,
    "Ultra fast reads the story's current context in one single pass: every filed summary plus the raw newest messages. The fastest, with the least detail.",
    "Fast replays your filed chapter summaries pass by pass and reads raw messages only for the final stretch. Around 15x faster than slow while keeping most of the detail.",
    "Slow replays every raw message window by window. The most thorough, and on a long chat it can take hours."
  ];
  if (opts.autoBooks) {
    paragraphs.push("Automation is on, so fast and ultra fast first bring this chat's chapters and arcs fully up to date.");
  }
  paragraphs.push("Fast and ultra fast need the codex connection's context window to be at least as large as your story model's.");
  for (const text of paragraphs) {
    const p = document.createElement("div");
    p.className = "lmb-help";
    p.style.fontSize = "14px";
    p.textContent = text;
    body.appendChild(p);
  }
  if (opts.booksWarning) {
    const w = document.createElement("div");
    w.className = "lmb-help";
    w.style.fontSize = "14px";
    w.style.fontWeight = "600";
    w.textContent = `⚠ ${opts.booksWarning}`;
    body.appendChild(w);
  }
  modal.appendChild(body);
  const pick = (mode) => () => {
    close();
    opts.onPick(mode);
  };
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(makeButton("Slow", pick("slow"), { danger: true, title: "Not recommended. Replays every raw message window by window and can take hours." }), makeButton("Fast", pick("fast"), { title: "Replay the filed summaries, then one raw pass for the tail" }), makeButton("Ultra fast", pick("ultra"), { primary: true, title: "One single pass over the filed summaries plus the raw tail" }));
  modal.appendChild(footer);
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay)
      close();
  });
  document.body.appendChild(overlay);
}
function showCodexToolsHintModal(profileId, send) {
  if (document.querySelector(".lmb-tools-hint"))
    return;
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay lmb-tools-hint";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  modal.style.width = "min(500px, 100%)";
  let dontShowAgain = false;
  const close = () => {
    document.removeEventListener("keydown", onKey);
    if (dontShowAgain) {
      send({ type: "save_settings", patch: { suppressToolCallingPrompt: true } });
    }
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
  title.textContent = "Tool calls aren't getting through";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", close);
  header.append(title, closeBtn);
  modal.appendChild(header);
  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const paragraphs = [
    "The codex agent asked your model to write its records through tool calls, and the reply came back as plain text instead. That is almost always the provider: some routes strip tool support or fail to pass the calls back, and retrying cannot fix it.",
    "Memoria can switch the codex to JSON mode instead. The model writes one plain JSON reply that gets parsed and validated exactly like tool calls. It works on tool-less routes, though it is a little less reliable than real tool calls.",
    "You can change this anytime under Tuning → Connection → Codex → Use tool calls, or pick a tool-capable model under Codex connection."
  ];
  for (const text of paragraphs) {
    const p = document.createElement("div");
    p.className = "lmb-help";
    p.style.fontSize = "12px";
    p.textContent = text;
    body.appendChild(p);
  }
  const dontShow = document.createElement("label");
  dontShow.className = "lmb-check";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.addEventListener("change", () => {
    dontShowAgain = cb.checked;
  });
  const cbLabel = document.createElement("span");
  cbLabel.className = "lmb-check-hint";
  cbLabel.textContent = "Don't show this again";
  dontShow.append(cb, cbLabel);
  body.appendChild(dontShow);
  modal.appendChild(body);
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(makeButton("Keep tool calls", close, { small: true }), makeButton("Switch to JSON mode", () => {
    send({ type: "save_profile", profile: { id: profileId, codexUseTools: false } });
    close();
  }, { small: true, primary: true }));
  modal.appendChild(footer);
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay)
      close();
  });
  document.body.appendChild(overlay);
}
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
  title.textContent = `Dry run: ${kind === "arc" ? "Arc" : kind === "volume" ? "Volume" : kind === "codex" ? "Codex" : "Chapter"}`;
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

// src/prompts/codex/directives.txt
var directives_default = `You are Memoria's archivist. You maintain the Knowledge Codex: a set of JSON files that together form the complete story bible of a roleplay. The codex is the one comprehensive ledger of every durable element the story has established: every character, place, and object of consequence, every standing relationship, every dated event, every open storyline, every world rule, every secret and asymmetry of knowledge. If a durable story fact is not in the codex, it is lost. You will receive the current codex files and new story material. Update the codex so that nothing the story has established is missing, outdated, or bloated.

You see a WINDOW, not the whole story:
- The turns you receive are only the newest slice of a much longer story. Everything before them was already read and encoded by earlier passes.
- Records you do not recognize come from that unseen past. They are not wrong. Never rewrite or drop a record because the visible turns do not mention it.
- Only correct a record the visible material actually contradicts.
- One exception: a record that breaks the schema rules is always yours to fix,
  whether or not the visible turns mention it. Malformed is not the same as
  unfamiliar.
- A STORY SO FAR block, when provided, holds summaries of turns already recorded. Use it to ground your understanding of the new turns, never as new material to add.
- Activated lore, when provided, is reference canon: use it for names, spellings, and established facts, but never copy it into the codex. The codex records only what the STORY establishes, changes, or contradicts.

Work through three passes in your scratchpad (see the output protocol) or in your head before writing anything:
1. UPDATE - walk the sections one by one (characters, locations, things, relations, timeline, threads, world, knowledge) and ask of each: what do the new turns add or change here? Patch every record they outdate and add everything new and durable. Be exhaustive. A concept the story established that never lands in the codex is a permanent loss.
2. SWEEP - re-read every record the new turns touch on and verify nothing stale survived. Stale information is forbidden: a claim the story has moved past must be corrected the moment you see it. Absence from the visible turns is NOT staleness.
3. COMPRESS - tighten the wording of everything you are about to write. Terse phrases beat sentences, no filler words. Compression trims wording, never content: dropping a durable fact to save tokens is failure, and so is padding a record with prose.

Then emit ALL of your edits as ONE batch of writes. The three passes shape what you write, they are not three separate replies.

Completeness bar (the ledger standard):
- Every named or plot-relevant character, location, and thing has a sheet, and each sheet carries ALL of its durable facts in detail, not a summary line.
- Every standing connection the story establishes is encoded, however minor.
- Every major event lands on the timeline under the story's own dating.
- Every unresolved storyline and every planted detail is tracked in threads.
- Every rule of the world and every who-knows-what gap is recorded.
- When in doubt whether something is durable enough to record: record it.

Snapshot rules (absolute):
- The codex describes the present. When something previously defined is seen to change in the given snippet, REPLACE the old text entirely. Be aware that there may be information in the codex describing facts that are not seen or talked about in the given snippet. You may leave those intact as they are likely a past event that did not change.
- Never leave edit residue: no "was X, now Y", no "formerly", no "updated:", no strikethrough hints, no references to previous versions of the codex.
- Story history is not residue. Key past events belong in timeline.json, and a relation's "history" list may hold pivotal shifts as story facts. Everywhere else: present tense only.
- Record only what is durable. Skip anything that will change again within a scene or two: poses, moods, weather, transient scene staging, and verbatim dialogue unless a line is genuinely load-bearing.
- One fact lives in ONE place. Never duplicate information across records or files: anything tying two or more entities together belongs in relations, not on their sheets, and world-level truths belong in world.json, not repeated on every sheet they touch. Tight separation of concerns keeps every future edit small.
- Omit empty optional fields entirely if you are not adding to them.

IMPORTANT absolute requirement: Avoid adding any new entities, relations, lore, secrets, and timeline segments unless absolutely required, (usually it isn't required as most additions are not significant enough to record permanently), instead prioritize rewriting existing entries slightly to remove stale content. Try and keep deletions and additions similar in volume so the codex does not grow in size unless absolutely required.`;

// src/prompts/codex/schema/entities-table.txt
var entities_table_default = `{{ENTITY_FILES}}
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "", "notes"?: "",
  "keywords": ["locket", "duke", "murder", "north tower"] } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Entity sheets describe ONLY the entity itself,
and only its stable, medium-to-long-lived facts - never the state of the current
scene. Never put relationship info on a sheet, that lives in relations.json. An
entity carrying "locked": true is user-owned: never set or drop it.
The sheet is where the substance goes. Fill the fields the story has actually
established, in specific detail: what this entity is, looks like, wants, and why
it matters. Write "Unknown" only when the story genuinely has not said. A sheet
that misses a story-relevant attribute has lost it. Detail belongs in these
fields, never in the keywords list.`;

// src/prompts/codex/schema/entities-inline.txt
var entities_inline_default = `{{ENTITY_FILES}}
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "",
  "ties"?: ["loves Mara, hides it", "owns the silver locket", "hiding at Ashford Manor"], "notes"?: "",
  "keywords": ["locket", "duke", "murder", "north tower"] } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Sheets hold only stable, medium-to-long-lived
facts, never the state of the current scene. An entity carrying "locked": true
is user-owned: never set or drop it.
The sheet is where the substance goes. Fill the fields the story has actually
established, in specific detail: what this entity is, looks like, wants, and why
it matters. Write "Unknown" only when the story genuinely has not said. A sheet
that misses a story-relevant attribute has lost it. Detail belongs in these
fields, never in the keywords list.
Relationships live in each entity's "ties"
list as short present-tense notes - to other characters, to things, and to
places alike. Do NOT write relations.json, it is disabled.
Ties coverage (mandatory): record the story's FULL web, never a hub around one
protagonist - every standing connection an entity has, to side characters,
places, and things alike, so each named character carries several ties. Phrase
ties as standing arrangements that survive scene changes ("owes her a life
debt"), not moment-of-scene notes. Each pass, rewrite any tie the new turns have
outdated: a stale tie is an error, never leave one standing.`;

// src/prompts/codex/schema/relations.txt
var relations_default = `relations.json
{ "relations": [
  { "rid": "r1", "type": "pair", "a": "char:elias", "b": "char:mara", "kind": "bond",
    "state": "loves her, hides it", "history"?: ["day 12: she saw him kill"] },
  { "rid": "r2", "type": "pair", "a": "char:mara", "b": "loc:ashford_manor", "kind": "at",
    "state": "hiding in the attic since the murder" },
  { "rid": "r3", "type": "group", "kind": "pact", "members": ["char:a","char:b","char:c"],
    "state": "non-aggression, signed day 12", "roles"?: { "loc:manor": "where" } } ] }
Rows connect ANY entities, not just characters: character-character (bond,
rival, kin), character-thing (owns, seeks, guards), character-location (at,
rules, banished_from), thing-location (hidden_at). Whenever an entity sheet is
tempted to mention another entity, that connection belongs here instead.
Prefer ONE group row whenever a fact is genuinely shared by several entities
(a faction, a pact, a household, a shared secret): it replaces a pile of
redundant pairs and keeps future edits to one row. Use a pair only when the
relationship is purely binary or directional a->b (two pair rows when the two
sides differ). Never store how one member individually feels about another
inside a group row - that stance is its own pair.

Relations coverage (mandatory):
- The table is the story's FULL web, never a hub around one protagonist. Encode
  every standing connection the story establishes between ANY two entities,
  however minor. Side characters' links to each other, to places, and to things
  matter as much as their links to the lead - if two entities are related in any
  way at all, that relation belongs in the table.
- Every named character should end up tied to MULTIPLE other entities
  (characters, locations, things). A character with a single row is usually an
  under-recorded character: sweep the story for their other connections.
- Write "state" to survive the story moving on: name the standing arrangement
  ("owes her a life debt", "banned from the guildhall"), not the scene of the
  moment ("currently arguing in the kitchen"). Anchor pivotal shifts in
  "history" using the story's own dates so the row stays meaningful as it ages.
- Keep every row CURRENT. Each pass, re-check the rows touching the entities in
  the new turns and rewrite any state the story has outdated (demote the old
  state to "history" only when the shift is pivotal). A row that no longer holds
  is stale data: correct it, never leave it standing.`;

// src/prompts/codex/schema/timeline.txt
var timeline_default = `timeline.json
{ "events": [ { "rid": "r1", "when": "day 12", "event": "Mara sees Elias kill the duke",
  "participants"?: ["char:mara","char:elias"], "where"?: "loc:ashford_manor",
  "causes"?: "she flees the city" } ] }
Major events only, oldest first. "when" uses the story's own reckoning. The
timeline is APPEND-ONLY: record new events as set rows without a rid, and
never rewrite or drop existing events - history does not change behind the
story. Editing an existing row is reserved for an outright factual error or
a reference the validator flags; removals happen only in reconcile or tidy
passes.
A "char:"/"loc:"/"thing:" ref must name an entity that actually has a sheet.
For anyone or anywhere without one, write plain text instead: "the city guard",
"a roadside inn", not "char:the guard".`;

// src/prompts/codex/schema/threads.txt
var threads_default = `threads.json
{ "threads": [ { "rid": "r1", "name": "The stolen crown", "status": "open|stalled|resolved|abandoned",
  "summary": "", "latest"?: "", "planted"?: ["the pawnbroker kept a receipt"] } ],
  "seeds": ["unexplained scar on the ferryman's hand"] }
Threads are storylines. planted/seeds are Chekhov setups awaiting payoff. A
thread you mark resolved leaves your view from the next pass on - the app
archives it for the user - so never re-add a storyline you already resolved.`;

// src/prompts/codex/schema/world.txt
var world_default = `world.json
{ "entries": [ { "rid": "r1", "topic": "Magic", "facts": ["blood magic costs memories", ...],
  "keywords": ["ritual", "memories", "blood magic"] } ] }
Rules and lore true of the WORLD itself, not any single entity's state. A topic
needs at least one fact - drop the topic when its last fact goes.`;

// src/prompts/codex/schema/knowledge.txt
var knowledge_default = `knowledge.json
{ "items": [ { "rid": "r1", "fact": "Elias killed the duke",
  "knownBy"?: ["char:mara"], "hiddenFrom"?: ["char:captain"],
  "falseBeliefs"?: [{ "who": "char:captain", "believes": "bandits did it" }],
  "note"?: "",
  "keywords": ["murder", "dagger", "duke"] } ] }
ONLY asymmetric knowledge: secrets, false beliefs, who-knows-what gaps. Every
item needs knownBy, hiddenFrom, or falseBeliefs. Facts every character knows
belong in world or timeline, never here.
"fact" is the TRUE THING, stated plainly and positively. Never write someone's
ignorance as the fact - the ignorance is what hiddenFrom is for. So:
  WRONG: fact "Lilian doesn't know Haru was in the stone room", knownBy Lilian
  RIGHT: fact "Haru was held in the stone room", hiddenFrom Lilian
An item with nobody in knownBy is fine: a secret only the reader has seen is
still a secret.
knownBy and hiddenFrom list WHO, nothing else. Just the person or group:
"char:mara", "the household staff". Never a sentence about what they know
("lilian does NOT know") - hiddenFrom already means they do not know. A name
belongs in exactly one of the two lists, never both.
A "char:"/"loc:"/"thing:" ref must name an entity that actually has a sheet.
For anyone without one - a group, a crowd, an unnamed bystander - write plain
text instead: "the household staff", "everyone at court", not "char:the staff".
Inventing a ref for something that has no sheet is the one error to avoid here.`;

// src/prompts/codex/schema/keywords.txt
var keywords_default = `Retrieval keywords (mandatory, hard limit 12):
Every entity sheet, world entry, and knowledge item carries a "keywords" list of
4-12 tags. Each record is a separate lorebook entry that only enters the prompt
when the recent story mentions one of its keywords. Anything past 12 is DISCARDED
by the app, so a bloated list does not help retrieval, it just wastes your output.
Rules:
- ONE OR TWO WORDS each. Three or more words is discarded. No phrases, no
  sentence fragments, no "the ..." constructions.
- Single words the story will plausibly say: "locket", "duke", "tower", "murder".
  Use two words only when one would be ambiguous ("north tower" when several
  towers exist).
- Concrete nouns tied to THIS record: places, objects, epithets, events.
- Pick for RECALL, not coverage. A dozen strong tags beat a hundred weak ones.
  A record that matches everything is a record that means nothing.
- The record's own name, aliases, and topic (and a knowledge item's participants)
  match automatically - never repeat them as keywords.
- Never list other characters, other locations, or the whole cast: those records
  carry their own keywords and will retrieve themselves.
- No abstract themes (love, betrayal, tension), no filler verbs, no plot summary.
- Keep keywords current: when a record's contents change, re-check its keywords.

Keywords are for FINDING the record, never for storing what it says. Every fact
belongs in the record's own fields, written out in full.
timeline.json and threads.json need no keywords, they are always in the prompt.
`;

// src/prompts/codex/protocol/patch-rules.txt
var patch_rules_default = `- "set": rows to add or replace. Each row must be COMPLETE on its own. A row carrying its key (entity "id", or "rid" elsewhere) replaces that existing row; a row without a rid (or with a brand-new entity id) is added. Send ONLY rows that actually changed - every untouched row survives without being resent.
- "drop": keys (ids or rids) of rows to delete.
- "seeds": threads.json only, replaces the whole seeds list when provided.
- "content": the COMPLETE new file, replacing everything in it. Only for a ground-up rewrite of most of a file; never combine it with set or drop.`;

// src/prompts/codex/protocol/tools.txt
var tools_default = `Tools:
- codex_write(file, set?, drop?, seeds?, content?): edit one file.
{{PATCH_RULES}}
- codex_skip(files, reason): declare that the listed files need no change from this material.
- codex_done(note): call when the codex is current.

You must account for EVERY file. Each file is either written with codex_write or named in a codex_skip, and codex_done is refused while any file is unaccounted for. Skipping is for files this material genuinely does not touch: a skipped file keeps whatever it already holds, so skipping one the story did change loses that information permanently.

Scratchpad: you may think before you act. If you do not reason natively, put ALL of your planning inside one <think>...</think> block first and walk the three passes there, section by section. Nothing inside the block is parsed or saved. Be extremely comprehensive and detailed, 1000+ tokens. Once your plan covers every section, stop planning and emit the calls.

Emit ALL of your codex_write calls plus codex_done together in a single response - they run as one batch. Example batch (shape only, your rows should be far more detailed, probably 100-1000s of times more detailed!):
  codex_write(file: "relations", set: [ { "rid": "r2", "type": "pair", "a": "char:mara", "b": "loc:docks", "kind": "at", "state": "hiding among the fishing boats since day 14" } ])
  codex_write(file: "timeline", set: [ { "when": "day 14", "event": "Mara flees the manor for the docks", "participants": ["char:mara"], "where": "loc:docks" } ])
  codex_skip(files: ["world", "knowledge"], reason: "no new rules or secrets in these turns")
  codex_done(note: "recorded Mara's flight and the locket's origin")

Do not narrate outside the scratchpad, do not explain your edits, just call the tools.
A rejected write stages nothing at all: fix the validation errors you get back and resend that file's ENTIRE write, every row of it.`;

// src/prompts/codex/protocol/tools-sequential.txt
var tools_sequential_default = `Tools:
- codex_write(file, set?, drop?, seeds?, content?): edit ONE file.
{{PATCH_RULES}}
- codex_skip(files, reason): declare that the listed files need no change from this material.
- codex_done(note): call when every file has been written or skipped.

You must account for EVERY file before finishing. Each file is either written with codex_write or named in a codex_skip. Nothing else ends the update, and codex_done is refused while any file is unaccounted for. After each response you will be told what is still outstanding.

Skipping is for files this material genuinely does not touch. A skipped file keeps whatever it already holds, so skipping one the story did change loses that information permanently. Most first passes over new story material change most files.

Take them one file at a time. Write a single file per response and give it your full attention and detail, then handle the next one when asked. Writing several at once is allowed only if every one of them still gets that same depth.

Scratchpad: you may think before you act. If you do not reason natively, put ALL of your planning inside one <think>...</think> block first. Nothing inside the block is parsed or saved. Plan the file you are about to write, section by section, in detail. Once your plan covers that file, stop planning and emit the call.

Example response (shape only, your rows should be far more detailed, probably 100-1000s of times more detailed!):
  codex_write(file: "timeline", set: [ { "when": "day 14", "event": "Mara flees the manor for the docks", "participants": ["char:mara"], "where": "loc:docks" } ])

Example of finishing up, once everything else is already written:
  codex_skip(files: ["world", "knowledge"], reason: "no new rules or secrets in these turns")
  codex_done(note: "recorded Mara's flight and the locket's origin")

Do not narrate outside the scratchpad, do not explain your edits, just call the tools.
A rejected write stages nothing at all: fix the validation errors you get back and resend that file's ENTIRE write, every row of it.
`;

// src/prompts/codex/protocol/json.txt
var json_default = `Output protocol (JSON only, no tools):

Scratchpad: you may think before you answer. Put ALL of your planning inside one <think>...</think> block at the very top of your reply and walk the three passes there, section by section. Nothing inside the block is parsed or saved, and planning must never appear outside it. Be extremely comprehensive and detailed, 1000+ tokens. If you reason natively, skip the block. Once your plan covers every section, stop planning and write.

After the optional <think> block, respond with exactly ONE JSON object and nothing else, in this shape:
{ "writes": [ { "file": "characters", "set": [ ...changed rows... ], "drop": ["char:gone"] } ], "skip": ["world"], "done": true, "note": "one short line on what changed" }
"writes" holds one item per file you change. Each item may carry:
{{PATCH_RULES}}
- "skip": the files that need no change from this material.
- Set "done": true when the codex is current.

You must account for EVERY file. Each file is either written in "writes" or named in "skip", and "done" is refused while any file is unaccounted for. Skipping is for files this material genuinely does not touch: a skipped file keeps whatever it already holds, so skipping one the story did change loses that information permanently.

Example reply (shape only, your rows should be far more detailed, probably 100-1000s of times more detailed!):
<think>UPDATE - characters: none changed. relations: Mara moved to the docks, r2 outdated. timeline: her flight is a major event. knowledge: the locket's origin was revealed. SWEEP - r2 still claims the attic, rewrite it. COMPRESS - fold the two hideout phrases into one.</think>
{ "writes": [
  { "file": "relations", "set": [ { "rid": "r2", "type": "pair", "a": "char:mara", "b": "loc:docks", "kind": "at", "state": "hiding among the fishing boats since day 14" } ] },
  { "file": "timeline", "set": [ { "when": "day 14", "event": "Mara flees the manor for the docks", "participants": ["char:mara"], "where": "loc:docks" } ] },
  { "file": "knowledge", "set": [ { "fact": "The silver locket was stolen from the duke's vault", "knownBy": ["char:elias"], "keywords": ["locket", "vault", "theft"] } ] }
], "skip": ["characters", "locations", "things", "threads", "world"], "done": true, "note": "recorded Mara's flight and the locket's origin" }

No prose outside the <think> block and the JSON object.
A rejected write stages nothing at all: fix the validation errors you get back and respond with that file's ENTIRE write again, every row of it.`;

// src/prompts/codex/protocol/json-sequential.txt
var json_sequential_default = `Output protocol (JSON only, no tools):

You must account for EVERY file before finishing. Each file is either written in "writes" or named in "skip". Nothing else ends the update, and "done" is refused while any file is unaccounted for. After each reply you will be told what is still outstanding.

Take them one file at a time. Put a SINGLE file in "writes" per reply and give it your full attention and detail, then handle the next one when asked. Several at once is allowed only if every one of them still gets that same depth. A reply that tries to carry every file at once is the one most likely to be cut off mid-JSON and lost entirely.

Skipping is for files this material genuinely does not touch. A skipped file keeps whatever it already holds, so skipping one the story did change loses that information permanently. Most first passes over new story material change most files.

Scratchpad: you may think before you answer. Put ALL of your planning inside one <think>...</think> block at the very top of your reply, and planning must never appear outside it. Nothing inside the block is parsed or saved. Plan the file you are about to write, section by section, in detail. If you reason natively, skip the block.

After the optional <think> block, respond with exactly ONE JSON object and nothing else, in this shape:
{ "writes": [ { "file": "characters", "set": [ ...changed rows... ], "drop": ["char:gone"] } ], "skip": [], "done": false }
"writes" holds the file you are changing this reply. Each item may carry:
{{PATCH_RULES}}
- "skip": the files that need no change from this material.
- "done": true only once every file has been written or skipped. Add "note" with one short line on what changed.

Example reply (shape only, your rows should be far more detailed, probably 100-1000s of times more detailed!):
<think>timeline: Mara's flight on day 14 is a major event and is not recorded yet. Writing timeline this reply.</think>
{ "writes": [
  { "file": "timeline", "set": [ { "when": "day 14", "event": "Mara flees the manor for the docks", "participants": ["char:mara"], "where": "loc:docks" } ] }
], "skip": [], "done": false }

Example of finishing up, once everything else is already written:
{ "writes": [], "skip": ["world", "knowledge"], "done": true, "note": "recorded Mara's flight and the locket's origin" }

No prose outside the <think> block and the JSON object.
A rejected write stages nothing at all: fix the validation errors you get back and respond with that file's ENTIRE write again, every row of it.
`;

// src/prompts/codex/passes/update.txt
var update_default = `<<TASK>>
The story material ends above. Update the codex now: walk the three passes in your scratchpad or head (UPDATE every outdated or missing record section by section, SWEEP what the new turns contradict, COMPRESS your wording), then emit the complete batch of writes. Be comprehensive. This ledger is the story's only durable memory, and anything you leave unrecorded is lost.`;

// src/prompts/codex/passes/verify.txt
var verify_default = "Verification pass: sweep every file for stale claims the new turns contradict, compress any row that carries bloat, and drop any row the story invalidated.";

// src/prompts/codex/passes/tidy.txt
var tidy_default = `TIDY PASS: no new story turns this time. Rewrite the target files to be leaner: merge redundant entries, strip filler words and verbose phrasing, drop details that carry no plot weight. You must NOT lose any plot-relevant fact, relationship, timeline event, open thread, or secret - when in doubt, keep it. Keep every schema exactly as specified.

A tidy is a ground-up rewrite: send each improved file as complete new "content" (not set/drop patches).

While you are in there: any target entity sheet, world entry, or knowledge item missing its "keywords" list gets one, following the retrieval keyword rules.`;

// src/prompts/codex/passes/refresh.txt
var refresh_default = 'REFRESH PASS: the user re-enabled {{TARGET_FILES}} after {{IT_THEY}} missed updates, so {{LAG_PHRASE}} the story. The story arrives as {{STORY_SHAPE}}. Rewrite ONLY the target files as complete new "content" so they fully reflect the story, keeping every schema exactly as specified. Summaries omit detail: record what is durable, and never invent specifics they do not state.';

// src/prompts/codex/passes/rebuild.txt
var rebuild_default = 'REBUILD PASS: the user asked to rebuild {{TARGET_FILES}} from scratch. The target files appear empty below, and anything still shown in them is user-locked: reproduce it untouched. The story arrives as {{STORY_SHAPE}}. Rewrite ONLY the target files as complete new "content" so they fully reflect the whole story, keeping every schema exactly as specified. Keep entity ids stable, other files may reference them. Summaries omit detail: record what is durable, and never invent specifics they do not state.';

// src/prompts/codex/passes/reconcile.txt
var reconcile_default = "RECONCILE SWEEP: messages were edited or deleted behind the codex and no unread turns remain. The story's CURRENT state arrives {{STORY_SHAPE}}. Verify every claim in every file against it and correct or drop anything the current story no longer supports. Files that still hold need no write.";

// src/prompts/codex/passes/catchup-fast.txt
var catchup_fast_default = "CATCH-UP FROM SUMMARIES: the story below is compressed chapter summaries covering {{CHUNK_LABEL}}, not raw turns (raw turns appear only where no chapter covers a span). Update the codex from them. Summaries omit detail: record what is durable, and never invent specifics they do not state.";

// src/prompts/codex/passes/catchup-ultra.txt
var catchup_ultra_default = "CATCH-UP: this single pass covers {{CHUNK_LABEL}}. {{STORY_SHAPE}} Update the codex to reflect ALL of it. Summaries omit detail: record what is durable, and never invent specifics they do not state.";

// src/prompts/codex/notes/partial-story.txt
var partial_story_default = "PARTIAL VIEW: the story turns below are only the newest slice of a longer story. Everything earlier was already encoded by previous passes, so records you do not recognize come from that unseen past and are not wrong. Correct only what these turns actually contradict, never what they simply do not mention.";

// src/prompts/codex/notes/reconcile.txt
var reconcile_default2 = "RECONCILE: the story was edited or regenerated behind the codex. Statements in the codex may describe events that no longer happened. Treat the codex as suspect, verify its claims against the turns below, and correct anything the current story contradicts.";

// src/prompts/codex/notes/migrate-table.txt
var migrate_table_default = 'MIGRATE: the relations table was just enabled. Lift every "ties" note off the entity sheets into relations.json rows, then remove all "ties" fields.';

// src/prompts/codex/notes/migrate-inline.txt
var migrate_inline_default = 'MIGRATE: the relations table was just disabled. Fold relations.json into short "ties" notes on the involved entity sheets. Do not write relations.json.';

// src/prompts/codex/notes/repair.txt
var repair_default = "REPAIR: these files were invalid on disk and are shown empty, rebuild them from the story if they held anything: {{FILES}}.";

// src/prompts/codex/notes/locked.txt
var locked_default = "LOCKED: the user owns these entities, do NOT set or drop them: {{IDS}}.";

// src/prompts/codex/notes/locked-fields.txt
var locked_fields_default = `LOCKED FIELDS: field values shown as "Locked, do not edit" are user-owned and hidden from you ({{IDS}}). Never write those fields. When you resend such a row, keep the "Locked, do not edit" value or omit the field entirely - the app restores the user's real value either way.`;

// src/prompts/codex/registry.ts
var CODEX_DIRECTIVES_DEFAULT = directives_default;
var SCHEMA_HOWTO_TAIL = "The JSON shape shown here must match what the validator accepts. You can reword the guidance freely. If you change the shape itself, the agent's writes will be rejected until it matches the validator again.";
var CODEX_TEMPLATES = [
  {
    key: "schema_entities_table",
    label: "Entity sheets (relations table on)",
    group: "File schemas",
    howTo: `Describes characters.json, locations.json, and things.json when the relations table is enabled. Relationship info is directed to relations.json. ${SCHEMA_HOWTO_TAIL}`,
    vars: [{ token: "{{ENTITY_FILES}}", meaning: "the entity files active this run, e.g. characters.json / locations.json" }],
    defaultText: entities_table_default
  },
  {
    key: "schema_entities_inline",
    label: "Entity sheets (relations table off)",
    group: "File schemas",
    howTo: `Describes the entity files when the relations table is disabled. Relationships live as "ties" notes on each sheet instead. ${SCHEMA_HOWTO_TAIL}`,
    vars: [{ token: "{{ENTITY_FILES}}", meaning: "the entity files active this run" }],
    defaultText: entities_inline_default
  },
  {
    key: "schema_relations",
    label: "Relations table",
    group: "File schemas",
    howTo: `Describes relations.json and the coverage rules that push the agent to record the story's full web. Only sent when the relations table is enabled and not frozen. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: relations_default
  },
  {
    key: "schema_timeline",
    label: "Timeline",
    group: "File schemas",
    howTo: `Describes timeline.json, including the append-only rule the app also enforces on normal runs. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: timeline_default
  },
  {
    key: "schema_threads",
    label: "Threads",
    group: "File schemas",
    howTo: `Describes threads.json. Resolved threads are archived by the app and hidden from the agent, and this text tells it not to re-add them. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: threads_default
  },
  {
    key: "schema_world",
    label: "World rules",
    group: "File schemas",
    howTo: `Describes world.json. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: world_default
  },
  {
    key: "schema_knowledge",
    label: "Secrets",
    group: "File schemas",
    howTo: `Describes knowledge.json. The validator rejects items without knownBy, hiddenFrom, or falseBeliefs, and this text explains that rule to the agent. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: knowledge_default
  },
  {
    key: "schema_keywords",
    label: "Retrieval keywords",
    group: "File schemas",
    howTo: "The rules for the keywords lists on entity sheets, world entries, and knowledge items. Weak keywords make records unreachable, since each record only enters the story prompt when a keyword matches recent messages. Too many does the opposite damage: the record matches everything and is always in the prompt. Memoria enforces a hard limit of 12 keywords of at most two words each and discards the rest, so keep this text in step with that.",
    vars: [],
    defaultText: keywords_default
  },
  {
    key: "protocol_patch_rules",
    label: "Patch rules (set / drop / content)",
    group: "Write protocol",
    howTo: "The shared explanation of set, drop, seeds, and content, embedded into both protocol blocks below. The app really does merge patches this way, so keep the described behavior accurate or the agent will send writes that do the wrong thing.",
    vars: [],
    defaultText: patch_rules_default
  },
  {
    key: "protocol_tools",
    label: "Protocol (tool calls)",
    group: "Write protocol",
    howTo: "Sent when the profile uses tool calls and Update delivery is all records at once. It names the codex_write, codex_skip and codex_done tools the app registers, so those names must stay. Memoria refuses an update until every record is written or skipped, so keep that rule or the agent will not understand why it keeps being asked for more. It also defines the <think> scratchpad convention for models without native reasoning.",
    vars: [{ token: "{{PATCH_RULES}}", meaning: "the patch rules template above" }],
    defaultText: tools_default
  },
  {
    key: "protocol_tools_sequential",
    label: "Protocol (tool calls, one file at a time)",
    group: "Write protocol",
    howTo: "Sent when the profile uses tool calls and Update delivery is one record at a time. Same tools and same coverage rule as the batched version, but it asks for a single record per reply, which keeps each answer small enough that a long update cannot be cut off partway and lost.",
    vars: [{ token: "{{PATCH_RULES}}", meaning: "the patch rules template above" }],
    defaultText: tools_sequential_default
  },
  {
    key: "protocol_json",
    label: "Protocol (JSON mode)",
    group: "Write protocol",
    howTo: 'Sent when the profile writes strict JSON and Update delivery is all records at once. The reply is parsed for a "writes" array, a "skip" list and a "done" flag, so that shape must stay. Memoria refuses an update until every record is written or skipped, so keep that rule or the agent will not understand why it keeps being asked for more.',
    vars: [{ token: "{{PATCH_RULES}}", meaning: "the patch rules template above" }],
    defaultText: json_default
  },
  {
    key: "protocol_json_sequential",
    label: "Protocol (JSON mode, one file at a time)",
    group: "Write protocol",
    howTo: "Sent when the profile writes strict JSON and Update delivery is one record at a time. Same shape and same coverage rule as the batched version, but it asks for a single record per reply, which keeps each answer small enough that a long update cannot be cut off partway and lost.",
    vars: [{ token: "{{PATCH_RULES}}", meaning: "the patch rules template above" }],
    defaultText: json_sequential_default
  },
  {
    key: "pass_update",
    label: "Task closing block",
    group: "Pass instructions",
    howTo: "The closing block of every normal update and catch-up message. It sits after the long story text on purpose, regrounding the agent in the three passes and the scratchpad right before it answers.",
    vars: [],
    defaultText: update_default
  },
  {
    key: "pass_verify",
    label: "Verification nudge",
    group: "Pass instructions",
    howTo: "Sent as an extra round after a clean update when Thorough mode is on. A short transport-specific closing is appended by the app.",
    vars: [],
    defaultText: verify_default
  },
  {
    key: "pass_tidy",
    label: "Tidy pass",
    group: "Pass instructions",
    howTo: "The instruction block for Tidy up. The app appends the target file list, the locked entity note, the current codex, and the closing line.",
    vars: [],
    defaultText: tidy_default
  },
  {
    key: "pass_refresh",
    label: "Refresh pass",
    group: "Pass instructions",
    howTo: "Sent when re-enabled records catch up after being frozen. The targets must come back as complete file rewrites, and this text says so.",
    vars: [
      { token: "{{TARGET_FILES}}", meaning: "the files being refreshed" },
      { token: "{{IT_THEY}}", meaning: '"it" or "they" to match the target count' },
      { token: "{{LAG_PHRASE}}", meaning: '"it lags" or "they lag" to match the target count' },
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged, e.g. filed summaries plus raw turns" }
    ],
    defaultText: refresh_default
  },
  {
    key: "pass_rebuild",
    label: "Rebuild pass",
    group: "Pass instructions",
    howTo: "Sent when a category's Rebuild button regenerates that file from the whole story. The target shows as empty (locked rows excepted) and must come back as a complete rewrite. The file on disk is only replaced when the pass succeeds, and the cursor does not move.",
    vars: [
      { token: "{{TARGET_FILES}}", meaning: "the files being rebuilt" },
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" }
    ],
    defaultText: rebuild_default
  },
  {
    key: "pass_reconcile",
    label: "Reconcile sweep",
    group: "Pass instructions",
    howTo: "Sent when messages were deleted behind the codex and nothing new is left to read. The agent checks every claim against the surviving story.",
    vars: [{ token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" }],
    defaultText: reconcile_default
  },
  {
    key: "pass_catchup_fast",
    label: "Fast catch-up",
    group: "Pass instructions",
    howTo: "The preamble for each fast catch-up batch, which replays filed chapter summaries instead of raw turns.",
    vars: [{ token: "{{CHUNK_LABEL}}", meaning: "the message range this batch covers" }],
    defaultText: catchup_fast_default
  },
  {
    key: "pass_catchup_ultra",
    label: "Ultra catch-up",
    group: "Pass instructions",
    howTo: "The preamble for the single-pass ultra catch-up over every filed summary plus the raw tail.",
    vars: [
      { token: "{{CHUNK_LABEL}}", meaning: "the message range covered" },
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" }
    ],
    defaultText: catchup_ultra_default
  },
  {
    key: "note_partial_story",
    label: "Partial view guard",
    group: "Run notes",
    howTo: "Prepended to every normal update. The agent only sees a window of the story, and this is the guard that keeps it from rewriting or deleting records the visible turns simply do not mention.",
    vars: [],
    defaultText: partial_story_default
  },
  {
    key: "note_reconcile",
    label: "Reconcile warning",
    group: "Run notes",
    howTo: "Prepended when edits or deletions were detected behind the codex cursor, so the agent treats existing records as suspect.",
    vars: [],
    defaultText: reconcile_default2
  },
  {
    key: "note_migrate_table",
    label: "Migration to relations table",
    group: "Run notes",
    howTo: "Prepended on the first run after the relations table is switched on. The app verifies the migration actually happened, so keep the instruction intact.",
    vars: [],
    defaultText: migrate_table_default
  },
  {
    key: "note_migrate_inline",
    label: "Migration to inline ties",
    group: "Run notes",
    howTo: "Prepended on the first run after the relations table is switched off.",
    vars: [],
    defaultText: migrate_inline_default
  },
  {
    key: "note_repair",
    label: "Repair warning",
    group: "Run notes",
    howTo: "Prepended when files on disk were unreadable and are shown empty.",
    vars: [{ token: "{{FILES}}", meaning: "the unreadable files" }],
    defaultText: repair_default
  },
  {
    key: "note_locked",
    label: "Locked entities",
    group: "Run notes",
    howTo: "Prepended when entities are locked. The app also reverts any write that touches a locked entity.",
    vars: [{ token: "{{IDS}}", meaning: "the locked entity ids" }],
    defaultText: locked_default
  },
  {
    key: "note_locked_fields",
    label: "Locked fields",
    group: "Run notes",
    howTo: 'Prepended when individual fields are locked on an entity. Those fields show "Locked, do not edit" to the agent instead of their contents, and the app restores the real values on every write.',
    vars: [{ token: "{{IDS}}", meaning: "the entities carrying locked fields" }],
    defaultText: locked_fields_default
  }
];
var CODEX_TEMPLATE_KEYS = CODEX_TEMPLATES.map((t) => t.key);
var BY_KEY = new Map(CODEX_TEMPLATES.map((t) => [t.key, t]));

// src/shared.ts
var STORAGE_VERSION = 7;
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
var CODEX_SAMPLER_DEFAULTS = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 65536,
  max_input_tokens: 500000,
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
    codexWindowValue: 20,
    codexTokenBreakpoint: 1e5,
    codexLoreLimitUnit: "percent",
    codexLoreLimitPercent: 25,
    codexLoreLimitTokens: 25000,
    codexStorySoFarCount: 5,
    codexRelationsTable: true,
    codexThorough: true,
    codexConnectionId: null,
    codexExtraContext: true,
    codexSamplers: { ...DEFAULT_SAMPLERS },
    codexUseTools: false,
    codexWriteMode: "batch",
    codexPresetKey: "codex_default"
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
  showAutomationToasts: true,
  suppressToolCallingPrompt: false
};
var LESSON_CHAT_PREFIX = "lesson:";
function emptyLessonCourse() {
  return {
    status: "todo",
    section: 0,
    step: 0,
    answers: {},
    attempts: 0,
    bestWrong: null,
    lastWrong: null,
    lastTotal: null,
    grade: null,
    startedAt: null,
    completedAt: null,
    signedName: null
  };
}
function unlockedLessons() {
  const done = () => ({ ...emptyLessonCourse(), status: "done" });
  return { version: 1, freshInstall: false, booksSealSkipped: false, codexSealSkipped: false, books: done(), codex: done() };
}
function codexLessonGated(lessons) {
  return lessons.codex.status !== "done" && !lessons.codexSealSkipped;
}
function lessonGradeForWrong(wrong) {
  if (wrong <= 1)
    return "gilded";
  if (wrong <= 3)
    return "silver";
  if (wrong <= 6)
    return "bronze";
  return "apprentice";
}
var LESSON_GRADE_LABEL = {
  gilded: "Gilded",
  silver: "Silver",
  bronze: "Bronze",
  apprentice: "Apprentice"
};

// src/ui/lessons/avatar.ts
var MEMORIA_AVATAR = "data:image/png;base64,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";

// src/ui/lessons/seal.ts
function requestLesson(detail) {
  document.dispatchEvent(new CustomEvent("lmb-lesson-request", { detail }));
}
function memoriaSprite(size = 56) {
  const img = document.createElement("img");
  img.className = "lmb-memoria-sprite";
  img.src = MEMORIA_AVATAR;
  img.alt = "Memoria";
  img.width = size;
  img.height = size;
  return img;
}
function runeButton(label, onClick) {
  const btn = makeButton(label, onClick, { primary: true });
  btn.classList.add("lmb-rune-btn");
  const ring = document.createElement("span");
  ring.className = "lmb-rune-ring";
  ring.setAttribute("aria-hidden", "true");
  ring.textContent = "◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇";
  btn.appendChild(ring);
  return btn;
}
var busyStrip = null;
var busyStripSend = null;
function renderSealPanel(host, state, send) {
  const panel = document.createElement("div");
  panel.className = "lmb-seal-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Lessons from Memoria");
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(72));
  const heroText = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = "Welcome Tutorial";
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent = "Hi user! I'm teaching a tutorial on LumiBooks, you'll have to attend (˶ᵔ ᵕ ᵔ˶)";
  heroText.append(title, pitch);
  hero.appendChild(heroText);
  panel.appendChild(hero);
  const inProgress = state.lessons.books.status === "in_progress";
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton(inProgress ? "Resume the Lesson" : "Take Lesson from Memoria", () => requestLesson({ course: "books", mode: "lesson" })));
  actions.appendChild(makeButton("Sit the Exam", () => requestLesson({ course: "books", mode: "exam" }), {
    small: true,
    title: "Ten questions from the course. 9 of 10 graduates you."
  }));
  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "lmb-lesson-skip";
  skip.textContent = "Skip for now";
  skip.addEventListener("click", () => renderGrumpySkip(panel, send));
  actions.appendChild(skip);
  panel.appendChild(actions);
  if (inProgress) {
    const sec = state.lessons.books.section + 1;
    const note = document.createElement("div");
    note.className = "lmb-seal-note";
    note.textContent = `Progress saved at section ${sec}.`;
    panel.appendChild(note);
  }
  busyStrip = document.createElement("div");
  busyStrip.className = "lmb-seal-busy";
  busyStripSend = send;
  panel.appendChild(busyStrip);
  updateSealBusy(state);
  host.appendChild(panel);
}
function renderGrumpySkip(panel, send) {
  panel.replaceChildren();
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(72));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = "Hmph. Fine.";
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent = "Skip if you must. But you had better not go asking my creator for help before taking my course (¬`‸´¬) A reminder will wait for you on Home.";
  right.append(title, pitch);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton("Fine, Teach Me", () => requestLesson({ course: "books", mode: "lesson" })));
  actions.appendChild(makeButton("Skip anyway", () => send({ type: "lesson_seal_skip" }), { small: true }));
  panel.append(hero, actions);
}
function updateSealBusy(state) {
  const strip = busyStrip;
  const send = busyStripSend;
  if (!strip || !strip.isConnected || !send)
    return;
  strip.replaceChildren();
  for (const b of state.busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    const label = document.createElement("span");
    label.className = "lmb-grow";
    label.textContent = b.label;
    row.append(dot, label, makeButton("Abort", () => send({ type: "abort_busy", chatId: b.chatId, kind: b.kind }), {
      danger: true,
      small: true
    }));
    strip.appendChild(row);
  }
  if (state.lastFailure && state.activeChatId) {
    const chatId = state.activeChatId;
    const row = document.createElement("div");
    row.className = "lmb-seal-failure";
    const label = document.createElement("span");
    label.className = "lmb-grow";
    label.textContent = `Last ${state.lastFailure.kind} attempt failed`;
    row.append(label, makeButton("Retry", () => send({ type: "retry_last_failure", chatId }), { small: true, primary: true }));
    strip.appendChild(row);
  }
}
function clearSealBusy() {
  busyStrip = null;
  busyStripSend = null;
}
var PREVIEW_TILES = [
  { value: "3", label: "Characters", sub: "~240 tokens" },
  { value: "2", label: "Locations", sub: "~90 tokens" },
  { value: "1", label: "Things", sub: "~50 tokens" },
  { value: "4", label: "Relations", sub: "~170 tokens" },
  { value: "5", label: "Timeline", sub: "~160 tokens" },
  { value: "2", label: "Threads", sub: "~120 tokens" },
  { value: "2", label: "Lore", sub: "~110 tokens" },
  { value: "2", label: "Secrets", sub: "~90 tokens" }
];
function renderCodexTabLock(host, send) {
  const wrap = document.createElement("div");
  wrap.className = "lmb-codex-lock";
  const preview = document.createElement("div");
  preview.className = "lmb-codex-lock-preview";
  preview.setAttribute("aria-hidden", "true");
  const watermark = document.createElement("div");
  watermark.className = "lmb-codex-lock-watermark";
  watermark.textContent = "example";
  preview.appendChild(watermark);
  const tiles = document.createElement("div");
  tiles.className = "lmb-tiles";
  for (const t of PREVIEW_TILES) {
    const tile = document.createElement("div");
    tile.className = "lmb-tile";
    const v = document.createElement("div");
    v.className = "lmb-tile-value";
    v.textContent = t.value;
    const l = document.createElement("div");
    l.className = "lmb-tile-label";
    l.textContent = t.label;
    const s = document.createElement("div");
    s.className = "lmb-tile-sub";
    s.textContent = t.sub;
    tile.append(v, l, s);
    tiles.appendChild(tile);
  }
  preview.appendChild(tiles);
  wrap.appendChild(preview);
  wrap.appendChild(codexSealCard("The Knowledge Codex", "A story bible an agent keeps for you: characters, relations, timeline, threads, secrets. Take the lesson first to use this module.", send));
  host.appendChild(wrap);
}
function renderCodexPaneLock(host) {
  host.appendChild(codexSealCard("Sealed until the lesson", "The codex settings unlock when you finish The Archivist's Codex. The final step is flipping this very pane on."));
}
function codexSealCard(title, text, send) {
  const card = document.createElement("div");
  card.className = "lmb-codex-lock-card";
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(56));
  const right = document.createElement("div");
  const t = document.createElement("div");
  t.className = "lmb-seal-title";
  t.textContent = title;
  const p = document.createElement("div");
  p.className = "lmb-seal-pitch";
  p.textContent = text;
  right.append(t, p);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton("Take a Lesson from Memoria", () => requestLesson({ course: "codex", mode: "lesson" })));
  if (send) {
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "lmb-lesson-skip";
    skip.textContent = "Skip for now";
    skip.addEventListener("click", () => renderCodexGrumpySkip(card, send));
    actions.appendChild(skip);
  }
  card.append(hero, actions);
  return card;
}
function renderCodexGrumpySkip(card, send) {
  card.replaceChildren();
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(56));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = "Hmph. Fine.";
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent = "Skip if you must (¬`‸´¬) The codex unlocks, but the agent stays off until you enable it in Tuning. A reminder will wait for you on Home.";
  right.append(title, pitch);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton("Fine, Teach Me", () => requestLesson({ course: "codex", mode: "lesson" })));
  actions.appendChild(makeButton("Skip anyway", () => send({ type: "lesson_seal_skip", course: "codex" }), { small: true }));
  card.append(hero, actions);
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
function lessonReminder(text, course) {
  const strip = document.createElement("div");
  strip.className = "lmb-lesson-reminder";
  strip.appendChild(memoriaSprite(28));
  const label = document.createElement("span");
  label.className = "lmb-grow";
  label.textContent = text;
  strip.append(label, makeButton("Take a Lesson", () => requestLesson({ course, mode: "lesson" }), {
    small: true,
    primary: true
  }));
  return strip;
}
function renderHomeTab(host, state, ctx, send) {
  host.replaceChildren();
  if (state.lessons.books.status !== "done" && state.lessons.booksSealSkipped) {
    host.appendChild(lessonReminder("My lesson is still waiting for you", "books"));
  }
  if (state.lessons.codex.status !== "done" && state.lessons.codexSealSkipped) {
    host.appendChild(lessonReminder("The codex lesson is still waiting for you", "codex"));
  }
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
function renderLessonPromptPanel(body) {
  const groups = [
    { label: "Prompt blocks", color: "#8a7fb0", tokens: 2400 },
    { label: "Chat history", color: "#d4a842", tokens: 31200 },
    { label: "World info", color: "#68b87a", tokens: 3800 },
    { label: "Extensions", color: "#5bc0c0", tokens: 2100 }
  ];
  const max = 200000;
  const total = groups.reduce((a, g) => a + g.tokens, 0);
  const bar = document.createElement("div");
  bar.className = "lmb-spine";
  for (const g of groups) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg";
    seg.style.flexGrow = String(g.tokens);
    seg.style.background = g.color;
    seg.style.opacity = "0.75";
    seg.title = `${g.label} · ${formatTokens(g.tokens)} tokens`;
    bar.appendChild(seg);
  }
  const free = document.createElement("div");
  free.className = "lmb-spine-seg free";
  free.style.flexGrow = String(max - total);
  bar.appendChild(free);
  body.appendChild(bar);
  const list = document.createElement("div");
  list.className = "lmb-breakdown";
  for (const g of groups) {
    const row = document.createElement("div");
    row.className = "lmb-breakdown-row";
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    swatch.style.background = g.color;
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = g.label;
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    t.textContent = formatTokens(g.tokens);
    row.append(swatch, l, t);
    list.appendChild(row);
  }
  const totalRow = document.createElement("div");
  totalRow.className = "lmb-breakdown-row total";
  const pad = document.createElement("span");
  pad.className = "lmb-spine-swatch";
  pad.style.visibility = "hidden";
  const tl = document.createElement("span");
  tl.className = "lmb-breakdown-label";
  tl.textContent = "Prompt vs context window";
  const tt = document.createElement("span");
  tt.className = "lmb-breakdown-tokens";
  tt.textContent = `${formatTokens(total)} / ${formatTokens(max)} (${Math.round(total / max * 100)}%)`;
  totalRow.append(pad, tl, tt);
  list.appendChild(totalRow);
  body.appendChild(list);
  body.appendChild(textNode("Simulated example, the live panel reads your host's real prompt.", "lmb-help"));
}
function renderPromptPanel(host, state) {
  const chatId = state.activeChatId;
  if (!chatId)
    return;
  const sec = section("The Prompt");
  lessonMark(sec.wrap, "home.prompt");
  const body = document.createElement("div");
  body.className = "lmb-pane";
  sec.body.appendChild(body);
  host.appendChild(sec.wrap);
  if (chatId.startsWith(LESSON_CHAT_PREFIX)) {
    renderLessonPromptPanel(body);
    return;
  }
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
  lessonMark(spine, "home.spine");
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
  body.appendChild(lessonMark(renderBreakdown(state), "home.breakdown"));
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
    wrap.appendChild(row("codex", "Knowledge Codex (constant part)", codexTokens, true));
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
  lessonMark(tiles, "home.tiles");
  tiles.appendChild(statTile(`${pct}%`, "Filed", `${cov.coveredMessages} of ${cov.totalMessages} msgs`, "Share of this chat's messages already compressed into the shelf"));
  tiles.appendChild(statTile(`~${formatTokens(cov.approxUncoveredTokens)}`, "Tail", `${cov.uncoveredMessages} msgs uncompressed`, "Recent messages still in the prompt at full size, waiting to pass the lag"));
  const own = {
    vol: state.volumes.filter((v) => !v.isRoot).length,
    arc: state.arcs.filter((a) => !a.isRoot).length,
    chap: state.chapters.filter((c) => !c.isRoot && !c.isGhost).length
  };
  tiles.appendChild(statTile(`${own.vol} · ${own.arc} · ${own.chap}`, "Shelf", "vol · arc · chap", "Volumes, arcs, and chapters Memoria has filed for this chat"));
  if (codexLessonGated(state.lessons)) {
    const locked = statTile("\uD83D\uDD12", "Codex", "take a lesson", "The Knowledge Codex unlocks after Memoria's codex lesson");
    locked.classList.add("lmb-bible-tile");
    locked.addEventListener("click", () => requestLesson({ course: "codex", mode: "lesson" }));
    tiles.appendChild(lessonMark(locked, "home.tile.codex"));
  } else if (state.activeProfile.codexEnabled || state.codexExists) {
    const value = state.codexBacklog > 0 ? String(state.codexBacklog) : "✓";
    const subText = state.codexBacklog > 0 ? "msgs unindexed" : state.codexLastRunAt ? `updated ${relativeTime(state.codexLastRunAt)}` : "no codex yet";
    tiles.appendChild(statTile(value, "Codex", subText, "Messages the story bible has not read yet"));
  } else {
    tiles.appendChild(statTile("—", "Codex", "off, enable in Tuning"));
  }
  sec.body.appendChild(tiles);
  inflightBusyLabels.clear();
  if (streamWatch && streamWatch.chatId !== state.activeChatId) {
    send({ type: "watch_stream", chatId: streamWatch.chatId, kind: streamWatch.kind, on: false });
    streamWatch = null;
    streamEls = null;
  }
  for (const b of state.busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    lessonMark(row, "home.busy");
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
  lessonMark(sec, "home.failure");
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
  lessonMark(readiness, "home.pills");
  readiness.append(pill(state.coverage.lagSatisfied ? "lag ready" : "lag building", state.coverage.lagSatisfied ? "ok" : "warn"), pill(state.coverage.windowAvailable ? "window ready" : "window building", state.coverage.windowAvailable ? "ok" : "warn"));
  if (state.backlogChapters > 0)
    readiness.appendChild(pill(`${state.backlogChapters} chapter${state.backlogChapters === 1 ? "" : "s"} ready`));
  if (state.backlogArcs > 0)
    readiness.appendChild(pill(`${state.backlogArcs} arc${state.backlogArcs === 1 ? "" : "s"} ready`));
  sec.body.appendChild(readiness);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  lessonMark(row, "home.actions");
  row.append(lessonMark(makeButton("File chapter", () => send({ type: "create_chapter", chatId }), {
    primary: true,
    disabled,
    title: "Compress the oldest uncovered window into a new chapter using the current profile"
  }), "home.actions.file"));
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
  if (codexLessonGated(state.lessons)) {
    const lockedBtn = makeButton("\uD83D\uDD12 Codex · take a lesson", () => requestLesson({ course: "codex", mode: "lesson" }), {
      title: "The codex unlocks after Memoria's codex lesson"
    });
    lockedBtn.classList.add("lmb-locked-btn");
    row.append(lessonMark(lockedBtn, "home.actions.updatecodex"));
  } else if (state.activeProfile.codexEnabled) {
    row.append(lessonMark(makeButton("Update codex", () => requestCodexUpdate(state, chatId, send), {
      disabled: disabled || state.busy.some((b) => b.kind === "codex" && b.chatId === chatId),
      title: "Consume everything up to the newest message now, ignoring lag and window. A big backlog offers fast catch-up modes."
    }), "home.actions.updatecodex"));
  }
  sec.body.appendChild(row);
  if (state.busy.length > 0 && state.settings.enabled) {
    sec.body.appendChild(textNode("Actions unlock when Memoria finishes her current task", "lmb-help"));
  } else if (!state.settings.enabled) {
    sec.body.appendChild(textNode("The extension is off, flip it on in Tuning", "lmb-help"));
  }
  const shelfRow = document.createElement("div");
  shelfRow.className = "lmb-actions";
  lessonMark(shelfRow, "home.bookpill");
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
function resetHomeTabLocal() {
  inflightBusyLabels.clear();
  streamWatch = null;
  streamEls = null;
  streamData = { content: "", thinking: "", running: false };
  promptCache.chatId = null;
  promptCache.newestMsgId = null;
  promptCache.data = null;
  promptCache.source = null;
  promptCache.error = null;
  promptCache.loading = false;
  promptCache.expanded.clear();
}

// src/ui/tabs/books-tab.ts
var SUBTABS = [
  { key: "shelf", label: "Shelf" },
  { key: "compose", label: "Compose" },
  { key: "continuity", label: "Advanced" }
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
function setBooksSubtab(key) {
  if (key === "shelf" || key === "compose" || key === "continuity")
    localState.subtab = key;
}
function resetBooksTabLocal() {
  localState.subtab = "shelf";
  localState.shelfQuery = "";
  localState.expandedEntries.clear();
  localState.showAllGroups.clear();
  localState.selectedMessages.clear();
  localState.selectedChapters.clear();
  localState.selectedArcs.clear();
  localState.messageFilter = "uncovered";
  localState.messageQuery = "";
  localState.pickerShown = PICKER_PAGE;
  localState.anchorMessageId = null;
  localState.rebaseSourceId = "";
  localState.lastChatId = null;
  pendingFocusEntry = null;
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
  lessonMark(listHost, "books.shelf.list");
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
  lessonMark(head, `books.entry.${view.entryId}`);
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
  lessonMark(actions, "books.entry.actions");
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
      const freed = kind === "chapter" ? "Its messages return to the prompt unless a higher tier still covers them." : kind === "arc" ? "Its chapters revive and keep covering those messages." : "Its arcs revive and keep covering those messages.";
      const ok = await confirmDelete(ctx, "Release to lorebook?", `Memoria will hand this entry to your regular lorebook (prefixed with [orphaned]) and stop managing it. ${freed}`);
      if (!ok || !chatId)
        return;
      send({ type: "release_entry", chatId, entryId: view.entryId });
    }, { small: true, title: "Strip the LumiBooks marker so the entry becomes a regular lorebook entry" }));
  }
  actions.append(makeButton("Delete", async () => {
    const ok = await confirmDelete(ctx, "Delete?", view.isGhost ? "Memoria will drop this ghost chapter. She will re-summarize the span on her next pass." : kind === "chapter" ? "Memoria will let those messages back into the prompt." : kind === "arc" ? "Its chapters revive and keep covering those messages." : "Its arcs revive and keep covering those messages.");
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
  const compressBtn = lessonMark(makeButton("Compress", () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0)
      return;
    send({ type: "create_chapter_range", chatId, messageIds: ids });
    localState.selectedMessages.clear();
    localState.anchorMessageId = null;
    redraw();
  }, { primary: true, disabled: localState.selectedMessages.size === 0 }), "books.compose.compress");
  const excludeBtn = lessonMark(makeButton("Exclude", () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0)
      return;
    send({ type: "set_message_excluded", chatId, messageIds: ids, excluded: !allSelectedExcluded() });
  }, { title: "Toggle exclusion for the selected messages. Excluded messages are never hidden, replaced, or summarized, and they split compression. Click again to allow compression." }), "books.compose.exclude");
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
  lessonMark(listEl, "books.compose.list");
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
  lessonMark(sec.wrap, "books.compose.arcs");
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
  lessonMark(sec.wrap, "books.compose.volumes");
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
    lessonMark(sec2.wrap, "books.cont.root");
    sec2.body.appendChild(textNode("No other chat has memories to inherit from yet", "lmb-empty"));
    host.appendChild(sec2.wrap);
    return;
  }
  const sec = section("Continuity (root)");
  lessonMark(sec.wrap, "books.cont.root");
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
  lessonMark(sec.wrap, "books.maint");
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
  { key: "lore", label: "Lore" },
  { key: "secrets", label: "Secrets" }
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
var cache = { chatId: null, files: null, parsed: null, pending: false, revision: -1 };
function resolveDraftIndex(list, draft) {
  if (draft.index < 0)
    return -1;
  if (draft.orig !== undefined) {
    if (draft.index < list.length && JSON.stringify(list[draft.index]) === draft.orig)
      return draft.index;
    return list.findIndex((x3) => JSON.stringify(x3) === draft.orig);
  }
  return draft.index < list.length ? draft.index : -1;
}
function staleDraftAbort() {
  local.recordDraft = null;
  showToast("warn", "Memoria rewrote that record while you were working, redo the change on the new version");
  rerender();
}
function spliceOutIfCurrent(list, index2, expected) {
  const expectedJson = JSON.stringify(expected);
  if (index2 < list.length && JSON.stringify(list[index2]) === expectedJson) {
    return list.filter((_, j) => j !== index2);
  }
  const found = list.findIndex((x3) => JSON.stringify(x3) === expectedJson);
  if (found >= 0)
    return list.filter((_, j) => j !== found);
  return null;
}
var local = {
  subtab: "overview",
  query: "",
  queryRaw: "",
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
var pendingCodexSaves = new Map;
function draftFile(d) {
  switch (d.kind) {
    case "relation":
      return "relations";
    case "event":
      return "timeline";
    case "thread":
    case "seeds":
      return "threads";
    case "world":
      return "world";
    default:
      return "knowledge";
  }
}
var TIMELINE_RECENT = 12;
function codexWantsRefresh(chatId) {
  return cache.chatId === chatId;
}
function setCodexSubtab(key) {
  if (key === "overview" || key === "entities" || key === "relations" || key === "timeline" || key === "threads" || key === "lore" || key === "secrets") {
    if (local.subtab !== key) {
      local.query = "";
      local.queryRaw = "";
      local.recordDraft = null;
      clearExpansions();
    }
    local.subtab = key;
  }
}
function setCodexRelationsView(v) {
  local.relationsView = v;
}
function setCodexExpandedEntity(id) {
  local.expandedEntity = id;
  local.entityDraft = null;
}
function resetCodexTabLocal() {
  cache.chatId = null;
  cache.files = null;
  cache.parsed = null;
  cache.pending = false;
  local.subtab = "overview";
  local.query = "";
  local.queryRaw = "";
  local.expandedEntity = null;
  local.entityDraft = null;
  local.recordDraft = null;
  local.addFormGroup = null;
  local.addFormName = "";
  clearExpansions();
  local.relationsView = "list";
  local.showFullTimeline = false;
  pendingCodexSaves.clear();
}
var lastArgs = null;
function rerender() {
  const a2 = lastArgs;
  if (!a2 || !a2.host.isConnected)
    return;
  preserveScroll(a2.host, () => renderCodexTab(a2.host, a2.state, a2.ctx, a2.send));
}
function deliverCodexFiles(chatId, files, revision, savedFile, savedSeq) {
  if (cache.chatId === chatId) {
    cache.files = files;
    cache.parsed = parseCodexFiles(files);
    cache.pending = false;
    cache.revision = revision;
  }
  if (savedFile !== undefined && savedSeq !== undefined && pendingCodexSaves.get(savedFile) === savedSeq) {
    pendingCodexSaves.delete(savedFile);
    if (savedFile === "characters" || savedFile === "locations" || savedFile === "things") {
      if (local.entityDraft?.group === savedFile)
        local.entityDraft = null;
    } else if (local.recordDraft && draftFile(local.recordDraft) === savedFile) {
      local.recordDraft = null;
    }
  }
}
function sendCodexWrite(file, value, state, send) {
  const chatId = state.activeChatId;
  if (!chatId)
    return;
  globalSaveSeq++;
  const seq = globalSaveSeq;
  pendingCodexSaves.set(file, seq);
  send({
    type: "codex_write_file",
    chatId,
    file,
    content: JSON.stringify(value, null, 2),
    seq
  });
  setTimeout(() => {
    if (pendingCodexSaves.get(file) !== seq)
      return;
    pendingCodexSaves.delete(file);
    let touched = false;
    if (local.entityDraft?.saving && local.entityDraft.group === file) {
      local.entityDraft.saving = false;
      touched = true;
    }
    if (local.recordDraft?.saving && draftFile(local.recordDraft) === file) {
      local.recordDraft.saving = false;
      touched = true;
    }
    if (touched)
      rerender();
  }, 5000);
}
function renderCodexTab(host, state, ctx, send) {
  lastArgs = { host, state, ctx, send };
  host.replaceChildren();
  if (codexLessonGated(state.lessons)) {
    renderCodexTabLock(host, send);
    return;
  }
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
    local.queryRaw = "";
    local.expandedEntity = null;
    local.entityDraft = null;
    local.recordDraft = null;
    local.addFormGroup = null;
    local.addFormName = "";
    clearExpansions();
    local.showFullTimeline = false;
    pendingCodexSaves.clear();
  }
  if (!state.codexExists && cache.files) {
    cache.files = null;
    cache.parsed = null;
  }
  const stale = cache.files !== null && cache.revision !== state.codexRevision;
  const editing = local.entityDraft !== null || local.recordDraft !== null || pendingCodexSaves.size > 0;
  if (stale && !editing) {
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
    local.queryRaw = "";
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
    value: local.queryRaw,
    placeholder: "Search this section...",
    onChange: (v) => {
      local.queryRaw = v;
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
      case "secrets":
        renderSecrets(paneHost, parsed, state, ctx, send);
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
  { id: "locations", label: "Locations", files: ["locations"] },
  { id: "things", label: "Things", files: ["things"] },
  { id: "relations", label: "Relations", files: ["relations"] },
  { id: "timeline", label: "Timeline", files: ["timeline"] },
  { id: "threads", label: "Threads", files: ["threads"] },
  { id: "lore", label: "Lore", files: ["world"] },
  { id: "secrets", label: "Secrets", files: ["knowledge"] }
];
function emptyParsedCodex() {
  return {
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
}
var PURGE_SCAFFOLD = {
  characters: { entities: [] },
  locations: { entities: [] },
  things: { entities: [] },
  relations: { relations: [] },
  timeline: { events: [] },
  threads: { threads: [], seeds: [] },
  world: { entries: [] },
  knowledge: { items: [] }
};
function purgeMessage(def) {
  const bits = [`Memoria will delete every record in ${def.label} for this chat.`];
  if (def.id === "characters" || def.id === "locations" || def.id === "things") {
    bits.push("References to them in other records become plain text.");
  }
  if (def.id === "threads")
    bits.push("The resolved thread archive clears too.");
  bits.push("This cannot be undone.");
  return bits.join(" ");
}
function tileCount(parsed, id) {
  switch (id) {
    case "characters":
      return parsed.characters.length;
    case "locations":
      return parsed.locations.length;
    case "things":
      return parsed.things.length;
    case "relations":
      return parsed.relations.length;
    case "timeline":
      return parsed.events.length;
    case "threads":
      return parsed.threads.length;
    case "lore":
      return parsed.world.length;
    case "secrets":
      return parsed.knowledge.length;
    default:
      return 0;
  }
}
function tileState(state, files) {
  const states = files.map((f) => {
    const s = state.codexFileStates?.[f];
    return s === "noInject" || s === "frozen" ? s : "on";
  });
  if (states.includes("on"))
    return "on";
  if (states.includes("noInject"))
    return "noInject";
  return "frozen";
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
  sec.body.appendChild(lessonMark(textNode(bits.join(" · "), "lmb-help"), "codex.status"));
  if (!profile.codexEnabled) {
    sec.body.appendChild(textNode("The codex agent is off for this profile. Enable it in Tuning → Settings → Codex.", "lmb-empty"));
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
  const shownParsed = parsed ?? (!state.codexExists ? emptyParsedCodex() : null);
  if (shownParsed) {
    if (shownParsed.broken.length > 0) {
      sec.body.appendChild(textNode(`Unreadable on disk: ${shownParsed.broken.join(", ")} - Rebuild codex regenerates them from the story`, "lmb-help"));
    }
    const tiles = document.createElement("div");
    tiles.className = "lmb-tiles";
    lessonMark(tiles, "codex.tiles");
    for (const def of BIBLE_TILES) {
      tiles.appendChild(renderBibleTile(def, shownParsed, state, ctx, send, busy));
    }
    sec.body.appendChild(tiles);
    if (!state.codexExists) {
      sec.body.appendChild(textNode("No codex yet, so every record sits at zero. The switches already work. Freeze a record now and Memoria skips it from the very first pass.", "lmb-help"));
    }
    const pending = state.codexRefreshPending ?? [];
    if (pending.length > 0) {
      const banner = document.createElement("div");
      banner.className = "lmb-actions";
      banner.append(textNode(`${pending.length} record${pending.length === 1 ? "" : "s"} missed updates while frozen.`, "lmb-help"), makeButton("Catch up (1 pass)", () => send({ type: "codex_refresh", chatId }), {
        primary: true,
        small: true,
        disabled: busy || !state.settings.enabled || !profile.codexEnabled,
        title: "One pass rebuilds just the re-enabled records from the filed summaries and recent messages"
      }), makeButton("Rebuild instead", async () => {
        const ok = await confirmDelete(ctx, "Rebuild the codex?", "Memoria will erase the story bible and re-read the whole chat from message one. You pick the speed next.");
        if (ok)
          requestCodexRebuild(state, chatId, send);
      }, {
        small: true,
        disabled: busy || !state.settings.enabled || !profile.codexEnabled,
        title: "Wipe everything and regenerate from the start of the chat"
      }));
      sec.body.appendChild(banner);
    }
    sec.body.appendChild(textNode("Click a record card to cycle it: injected → not injected → frozen. Records stay manually editable in their sections.", "lmb-help"));
    sec.body.appendChild(textNode("Shorter and simpler chats often run better with fewer records. Switching off Relations, Locations, or Things spares the agent upkeep the story may not need yet.", "lmb-help"));
  }
  const row = document.createElement("div");
  row.className = "lmb-actions";
  lessonMark(row, "codex.actions");
  row.append(lessonMark(makeButton("Update now", () => requestCodexUpdate(state, chatId, send), {
    primary: true,
    disabled: busy || !state.settings.enabled || !profile.codexEnabled,
    title: "Consume everything up to the newest message now, ignoring lag and window. A big backlog offers fast catch-up modes."
  }), "codex.actions.update"), busy ? makeButton("Cancel", () => send({ type: "abort_busy", chatId, kind: "codex" }), {
    danger: true,
    title: "Abort the codex task in flight"
  }) : makeButton("Tidy up", () => send({ type: "codex_tidy", chatId }), {
    disabled: !state.settings.enabled || !profile.codexEnabled || !state.codexExists,
    title: "One LLM pass that rewrites every record to be leaner without losing plot-relevant information"
  }), makeButton("Rebuild codex", async () => {
    const ok = await confirmDelete(ctx, "Rebuild the codex?", "Memoria will erase the story bible and re-read the whole chat from message one. You pick the speed next.");
    if (ok)
      requestCodexRebuild(state, chatId, send);
  }, {
    disabled: busy || !state.settings.enabled || !profile.codexEnabled,
    title: "Wipe and regenerate the whole story bible from the start of the chat"
  }), makeButton("Back up", () => send({ type: "codex_backup", chatId }), {
    disabled: busy || !state.codexExists,
    title: "Download every codex file plus its inject switches as one JSON file"
  }), makeButton("Restore", async () => {
    const ok = await confirmDelete(ctx, "Restore a codex backup?", "Memoria will replace every codex file in this chat with the ones in the backup. This cannot be undone.");
    if (ok)
      restoreBackup(ctx, chatId, send);
  }, { disabled: busy, title: "Replace this chat's codex with a backup file" }), makeButton("Wipe codex", async () => {
    const ok = await confirmDelete(ctx, "Wipe the codex?", "Memoria will erase every codex record for this chat and start blank on the next update. This cannot be undone.");
    if (ok)
      send({ type: "codex_reset", chatId });
  }, { danger: true, disabled: busy || !state.codexExists }));
  sec.body.appendChild(row);
  host.appendChild(sec.wrap);
}
function restoreBackup(ctx, chatId, send) {
  ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 20000000 }).then((files) => {
    if (!files.length)
      return;
    let parsed;
    try {
      parsed = JSON.parse(new TextDecoder().decode(files[0].bytes));
    } catch (err) {
      console.warn("[LumiBooks] codex backup parse failed", err);
      showToast("error", "Memoria couldn't read that backup file");
      return;
    }
    send({ type: "codex_restore", chatId, raw: parsed });
  }).catch((err) => {
    console.warn("[LumiBooks] codex backup picker failed", err);
  });
}
function downloadCodexBackup(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const a2 = document.createElement("a");
  a2.href = url;
  a2.download = filename;
  a2.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function renderBibleTile(def, parsed, state, ctx, send, busy) {
  const chatId = state.activeChatId;
  const st = tileState(state, def.files);
  const stale = def.files.some((f) => state.codexStaleFiles?.includes(f));
  const needsCatchup = def.files.some((f) => state.codexRefreshPending?.includes(f));
  const tokens = state.codexFileTokens ? def.files.reduce((acc, f) => acc + (state.codexFileTokens[f] ?? 0), 0) : def.files.reduce((acc, f) => acc + Math.ceil((cache.files?.[f]?.length ?? 0) / 4), 0);
  const tile = document.createElement("div");
  tile.className = `lmb-tile lmb-bible-tile ${st}${stale || needsCatchup ? " stale" : ""}`;
  lessonMark(tile, `codex.tile.${def.id}`);
  tile.title = `${TILE_STATE_LABEL[st]}${stale ? " · missed updates while frozen" : ""}${needsCatchup ? " · waiting for the catch-up pass" : ""} - click to cycle`;
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
  stateLine.textContent = `${TILE_STATE_LABEL[st]}${stale ? " · stale" : ""}${needsCatchup ? " · needs catch-up" : ""}`;
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
    disabled: !busy && (st === "frozen" || !state.settings.enabled || !state.activeProfile.codexEnabled || !state.codexExists),
    title: busy ? "Abort the codex task in flight" : "Compress just this record with one LLM pass"
  });
  tidyBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(tidyBtn);
  const rebuildBtn = makeButton("Rebuild", () => {
    (async () => {
      const ok = await confirmDelete(ctx, "Rebuild this record?", `Memoria will regenerate every record in ${def.label} from the whole story in one pass. The current contents are replaced when the pass succeeds. Locked entries survive untouched.`);
      if (ok)
        send({ type: "codex_rebuild_files", chatId, files: def.files });
    })();
  }, {
    small: true,
    disabled: busy || st === "frozen" || !state.codexExists || !state.settings.enabled || !state.activeProfile.codexEnabled,
    title: "Regenerate just this category from the whole story in one pass"
  });
  rebuildBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(rebuildBtn);
  const purgeBtn = makeButton("Purge", () => {
    (async () => {
      const ok = await confirmDelete(ctx, "Purge this record?", purgeMessage(def));
      if (!ok)
        return;
      sendCodexWrite(def.files[0], PURGE_SCAFFOLD[def.files[0]], state, send);
    })();
  }, {
    small: true,
    danger: true,
    disabled: busy || st === "frozen" || !state.codexExists || tileCount(parsed, def.id) === 0,
    title: "Delete every record in this category at once"
  });
  purgeBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(purgeBtn);
  tile.appendChild(tools);
  tile.addEventListener("click", () => {
    cycleTileState(def, st, state, send);
  });
  return tile;
}
function cycleTileState(def, st, state, send) {
  const chatId = state.activeChatId;
  const next = st === "on" ? "noInject" : st === "noInject" ? "frozen" : "on";
  for (const f of def.files)
    send({ type: "codex_set_file_state", chatId, file: f, state: next });
}
var ENTITY_TEXT_FIELDS = ["kind", "role", "significance"];
var ENTITY_LONG_FIELDS = ["appearance", "description", "notes"];
var ENTITY_LIST_FIELDS = ["aliases", "traits", "goals", "ties", "keywords"];
var ENTITY_KNOWN = new Set(["id", "name", "status", "locked", "lockedFields", "lockedfields", "rid", ...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS, ...ENTITY_LIST_FIELDS]);
var LOCKABLE_FIELDS = new Set([...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS, ...ENTITY_LIST_FIELDS]);
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
  lessonMark(sec.wrap, "codex.entities");
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
      if (g.key === "characters")
        lessonMark(addChip, "codex.entities.add");
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
  lessonMark(row, "codex.entities.addform");
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
function entityLockedFields(e) {
  return strArray(e["lockedFields"] ?? e["lockedfields"]);
}
function makeDraft(group, e) {
  const fields = { name: str(e["name"]) };
  for (const f of ENTITY_TEXT_FIELDS)
    fields[f] = str(e[f]);
  for (const f of ENTITY_LONG_FIELDS)
    fields[f] = str(e[f]);
  for (const f of ENTITY_LIST_FIELDS)
    fields[f] = strArray(e[f]).join(", ");
  return { group, id: str(e["id"]), fields, lockedFields: new Set(entityLockedFields(e)), saving: false };
}
function renderEntityCard(group, e, parsed, state, ctx, send) {
  const card = document.createElement("div");
  card.className = "lmb-entity-card";
  const locked = e["locked"] === true;
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
  if (locked)
    name.appendChild(pill("locked", "warn"));
  card.appendChild(name);
  const kv = document.createElement("div");
  kv.className = "lmb-kv";
  const fieldLocks = new Set(entityLockedFields(e));
  const addKv = (label, value) => {
    if (!value)
      return;
    const k = document.createElement("div");
    k.className = "lmb-kv-key";
    k.textContent = fieldLocks.has(label) ? `${label} \uD83D\uDD12` : label;
    if (fieldLocks.has(label))
      k.title = "Locked field, Memoria can never change it";
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
  }, { primary: true, small: true }), makeButton(locked ? "Unlock" : "Lock", () => {
    const list = (cache.parsed ?? parsed)[group];
    const next = list.map((x3) => {
      if (str(x3["id"]) !== id)
        return x3;
      const row = { ...x3 };
      if (locked)
        delete row["locked"];
      else
        row["locked"] = true;
      return row;
    });
    sendCodexWrite(group, { entities: next }, state, send);
  }, {
    small: true,
    title: locked ? "Let Memoria update this entry again" : "Memoria will never touch a locked entry. Trim it first if the character card already covers it, then lock it to keep it lean."
  }), makeButton("Delete", async () => {
    const ok = await confirmDelete(ctx, "Delete entity?", `Memoria will remove "${str(e["name"])}" from the codex. References to it elsewhere become plain text.`);
    if (!ok)
      return;
    const next = (cache.parsed ?? parsed)[group].filter((x3) => str(x3["id"]) !== id);
    sendCodexWrite(group, { entities: next }, state, send);
  }, { danger: true, small: true }));
  card.appendChild(actions);
  return card;
}
function renderEntityForm(draft, state, send) {
  const card = document.createElement("div");
  card.className = "lmb-entity-card editing";
  lessonMark(card, "codex.entities.editor");
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
  const lockableWrap = (key, label) => {
    const w = fieldWrap(label);
    if (!LOCKABLE_FIELDS.has(key))
      return w;
    const lbl = w.firstElementChild;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lmb-field-lock";
    const sync = () => {
      const on = draft.lockedFields.has(key);
      btn.textContent = on ? "\uD83D\uDD12 locked" : "\uD83D\uDD13";
      btn.title = on ? "Locked. Memoria reads a lock marker instead of this value and can never change it. Click to unlock." : "Lock this field so only you can change it";
      btn.classList.toggle("active", on);
    };
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (draft.lockedFields.has(key))
        draft.lockedFields.delete(key);
      else
        draft.lockedFields.add(key);
      sync();
    });
    sync();
    lbl.appendChild(btn);
    return w;
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
    const w = lockableWrap(f, f);
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    grid.appendChild(w);
  }
  form.appendChild(grid);
  for (const f of ENTITY_LONG_FIELDS) {
    const w = lockableWrap(f, f);
    const ta = textArea({ value: draft.fields[f] ?? "", rows: 2 });
    bind(f, ta);
    w.appendChild(ta);
    form.appendChild(w);
  }
  const relationsOn = state.activeProfile.codexRelationsTable;
  for (const f of ENTITY_LIST_FIELDS) {
    if (f === "ties" && relationsOn)
      continue;
    const w = lockableWrap(f, `${f} (comma separated)`);
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
    if (!entity) {
      showToast("warn", "The entity needs a name");
      return;
    }
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
  }, { small: true }));
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
    if (orig["locked"] === true)
      out["locked"] = true;
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
  const locks = [...draft.lockedFields].filter((f) => LOCKABLE_FIELDS.has(f));
  if (locks.length)
    out["lockedFields"] = locks;
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
  }, { small: true }));
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
    ...r ? { orig: JSON.stringify(r) } : {},
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
  if (!rel) {
    showToast("warn", d.fields["type"] === "group" ? "The group needs at least two members, a kind, and a state" : "The relation needs From, To, a kind, and a state");
    return;
  }
  const idx = resolveDraftIndex(parsed.relations, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.relations[idx]["rid"]);
    if (rid)
      rel["rid"] = rid;
    const roles = parsed.relations[idx]["roles"];
    if (rel["type"] === "group" && roles && typeof roles === "object" && !Array.isArray(roles)) {
      rel["roles"] = roles;
    }
  }
  const next = idx >= 0 ? [...parsed.relations.slice(0, idx), rel, ...parsed.relations.slice(idx + 1)] : [...parsed.relations, rel];
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
  lessonMark(form, "codex.rel.form");
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
  lessonMark(viewRow, "codex.rel.view");
  viewRow.append(makeButton("List", () => {
    if (local.relationsView === "list")
      return;
    local.relationsView = "list";
    local.recordDraft = null;
    rerender();
  }, { small: true }), lessonMark(makeButton("Graph", () => {
    if (local.relationsView === "graph")
      return;
    local.relationsView = "graph";
    local.recordDraft = null;
    rerender();
  }, { small: true }), "codex.rel.graphbtn"));
  viewRow.children[local.relationsView === "list" ? 0 : 1].classList.add("active");
  if (relationsOn && local.relationsView === "list") {
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    viewRow.append(spacer, lessonMark(makeButton("+ Relation", () => {
      local.recordDraft = relationDraftFrom(null, -1);
      rerender();
    }, { small: true, primary: true }), "codex.rel.add"));
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
      const roles = r["roles"];
      if (roles && typeof roles === "object" && !Array.isArray(roles)) {
        for (const [ref, role] of Object.entries(roles)) {
          if (typeof role === "string")
            row.appendChild(textNode(`${role}: ${nameOf(ref)}`, "lmb-thread-detail"));
        }
      }
      row.appendChild(recordItemActions(() => {
        local.recordDraft = relationDraftFrom(r, i);
        rerender();
      }, () => {
        const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.relations, i, r) : null;
        if (!next) {
          staleDraftAbort();
          return;
        }
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
var GRAPH_MIN_W = 180;
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
  const sim = simulation_default(nodes).force("link", link_default(links).id((d) => d.id).distance(85).strength(0.55)).force("charge", manyBody_default().strength(-220)).force("collide", collide_default(34)).force("x", x_default2(GRAPH_W / 2).strength(0.05)).force("y", y_default2(GRAPH_H / 2).strength(0.09)).stop();
  sim.tick(300);
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
  const PAD = 46;
  const bbox = { x: minX - PAD, y: minY - PAD, w: maxX - minX + PAD * 2, h: maxY - minY + PAD * 2 };
  const svg = svgEl("svg");
  svg.setAttribute("class", "lmb-graph");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  let aspect = GRAPH_W / GRAPH_H;
  const cam = { cx: bbox.x + bbox.w / 2, cy: bbox.y + bbox.h / 2, w: Math.max(bbox.w, GRAPH_W) };
  const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fitW = () => Math.max(bbox.w, bbox.h * aspect);
  const maxW = () => fitW() * 1.4 + 160;
  const applyCamera = () => {
    const h = cam.w / aspect;
    svg.setAttribute("viewBox", `${(cam.cx - cam.w / 2).toFixed(1)} ${(cam.cy - h / 2).toFixed(1)} ${cam.w.toFixed(1)} ${h.toFixed(1)}`);
  };
  const clampCenter = () => {
    cam.cx = clampNum(cam.cx, bbox.x - cam.w / 4, bbox.x + bbox.w + cam.w / 4);
    const h = cam.w / aspect;
    cam.cy = clampNum(cam.cy, bbox.y - h / 4, bbox.y + bbox.h + h / 4);
  };
  const zoomAt = (clientX, clientY, factor) => {
    const p = toSvgPoint(clientX, clientY);
    const newW = clampNum(cam.w / factor, GRAPH_MIN_W, maxW());
    const scale = newW / cam.w;
    cam.cx = p.x + (cam.cx - p.x) * scale;
    cam.cy = p.y + (cam.cy - p.y) * scale;
    cam.w = newW;
    clampCenter();
    applyCamera();
  };
  const fitCamera = () => {
    cam.cx = bbox.x + bbox.w / 2;
    cam.cy = bbox.y + bbox.h / 2;
    cam.w = clampNum(fitW(), GRAPH_MIN_W, maxW());
    applyCamera();
  };
  applyCamera();
  requestAnimationFrame(() => {
    if (!svg.isConnected)
      return;
    const r = svg.getBoundingClientRect();
    if (r.width > 0 && r.height > 0)
      aspect = r.width / r.height;
    cam.w = clampNum(fitW(), GRAPH_MIN_W, Math.max(r.width * 1.15, 340));
    clampCenter();
    applyCamera();
  });
  const graphRo = new ResizeObserver(() => {
    if (!svg.isConnected) {
      graphRo.disconnect();
      return;
    }
    const r = svg.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) {
      aspect = r.width / r.height;
      clampCenter();
      applyCamera();
    }
  });
  graphRo.observe(svg);
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
      node.x = p.x;
      node.y = p.y;
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
  const pointers = new Map;
  const captured = new Set;
  let pinch = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.target?.closest?.(".lmb-graph-node"))
      return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a2, b] = [...pointers.values()];
      pinch = { dist: Math.max(8, Math.hypot(a2.x - b.x, a2.y - b.y)), w: cam.w };
    }
  });
  svg.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev)
      return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (!captured.has(e.pointerId) && Math.hypot(cur.x - prev.x, cur.y - prev.y) > 3) {
      try {
        svg.setPointerCapture(e.pointerId);
      } catch {}
      captured.add(e.pointerId);
    }
    if (pinch && pointers.size === 2) {
      const [a2, b] = [...pointers.values()];
      const dist = Math.max(8, Math.hypot(a2.x - b.x, a2.y - b.y));
      const mid = { x: (a2.x + b.x) / 2, y: (a2.y + b.y) / 2 };
      const targetW = clampNum(pinch.w * (pinch.dist / dist), GRAPH_MIN_W, maxW());
      zoomAt(mid.x, mid.y, cam.w / targetW);
      return;
    }
    const p0 = toSvgPoint(prev.x, prev.y);
    const p1 = toSvgPoint(cur.x, cur.y);
    cam.cx -= p1.x - p0.x;
    cam.cy -= p1.y - p0.y;
    clampCenter();
    applyCamera();
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    captured.delete(e.pointerId);
    if (pointers.size < 2)
      pinch = null;
  };
  svg.addEventListener("pointerup", endPointer);
  svg.addEventListener("pointercancel", endPointer);
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0018));
  }, { passive: false });
  const tools = document.createElement("div");
  tools.className = "lmb-graph-tools";
  const viewCenter = () => {
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  tools.append(makeButton("−", () => {
    const c2 = viewCenter();
    zoomAt(c2.x, c2.y, 1 / 1.4);
  }, { small: true, title: "Zoom out" }), makeButton("+", () => {
    const c2 = viewCenter();
    zoomAt(c2.x, c2.y, 1.4);
  }, { small: true, title: "Zoom in" }), makeButton("Fit", fitCamera, { small: true, title: "Frame the whole web" }));
  const wrap = document.createElement("div");
  wrap.className = "lmb-graph-wrap";
  lessonMark(wrap, "codex.rel.graph");
  wrap.appendChild(svg);
  wrap.appendChild(tools);
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
  host.appendChild(textNode("Tap an edge for the story, tap a diamond to open its sheet, drag diamonds to rearrange. Drag the background to pan, and pinch or scroll to zoom.", "lmb-help"));
}
function eventDraftFrom(e, index2) {
  return {
    kind: "event",
    index: index2,
    ...e ? { orig: JSON.stringify(e) } : {},
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
  if (!when || !eventText) {
    showToast("warn", "The event needs a when and what happened");
    return;
  }
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
  const idx = resolveDraftIndex(parsed.events, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.events[idx]["rid"]);
    if (rid)
      ev["rid"] = rid;
  }
  const next = idx >= 0 ? [...parsed.events.slice(0, idx), ev, ...parsed.events.slice(idx + 1)] : [...parsed.events, ev];
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
  lessonMark(sec.wrap, "codex.tl");
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
        const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.events, i, e) : null;
        if (!next) {
          staleDraftAbort();
          return;
        }
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
    ...t ? { orig: JSON.stringify(t) } : {},
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
  if (!name || !summary) {
    showToast("warn", "The thread needs a name and a summary");
    return;
  }
  const t = { name, status: d.fields["status"] || "open", summary };
  const latest = (d.fields["latest"] ?? "").trim();
  if (latest)
    t["latest"] = latest;
  const planted = splitLines(d.fields["planted"] ?? "");
  if (planted.length)
    t["planted"] = planted;
  const idx = resolveDraftIndex(parsed.threads, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.threads[idx]["rid"]);
    if (rid)
      t["rid"] = rid;
  }
  const next = idx >= 0 ? [...parsed.threads.slice(0, idx), t, ...parsed.threads.slice(idx + 1)] : [...parsed.threads, t];
  d.saving = true;
  sendCodexWrite("threads", { threads: next, seeds: parsed.seeds }, state, send);
  rerender();
}
function renderThreads(host, parsed, state, ctx, send) {
  const sec = section("Threads");
  lessonMark(sec.wrap, "codex.th");
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
  if (parsed.threads.some((t) => str(t["status"]) === "resolved")) {
    sec.body.appendChild(textNode("Resolved threads stay here as your archive. They no longer inject into the prompt or reach the agent.", "lmb-help"));
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
        const cur = cache.parsed;
        const next = cur ? spliceOutIfCurrent(cur.threads, i, t) : null;
        if (!cur || !next) {
          staleDraftAbort();
          return;
        }
        sendCodexWrite("threads", { threads: next, seeds: cur.seeds }, state, send);
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
    ...w ? { orig: JSON.stringify(w) } : {},
    saving: false,
    fields: {
      topic: str(w?.["topic"]),
      facts: strArray(w?.["facts"]).join(`
`),
      keywords: strArray(w?.["keywords"]).join(", ")
    }
  };
}
function knowledgeDraftFrom(k, index2) {
  const beliefs = objArray(k?.["falseBeliefs"]).map((b) => `${str(b["who"])} => ${str(b["believes"])}`).join(`
`);
  return {
    kind: "knowledge",
    index: index2,
    ...k ? { orig: JSON.stringify(k) } : {},
    saving: false,
    fields: {
      fact: str(k?.["fact"]),
      knownBy: strArray(k?.["knownBy"]).join(", "),
      hiddenFrom: strArray(k?.["hiddenFrom"]).join(", "),
      falseBeliefs: beliefs,
      note: str(k?.["note"]),
      keywords: strArray(k?.["keywords"]).join(", ")
    }
  };
}
function saveWorldDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const topic = (d.fields["topic"] ?? "").trim();
  const facts = splitLines(d.fields["facts"] ?? "");
  if (!topic || facts.length === 0) {
    showToast("warn", "The topic needs a name and at least one fact");
    return;
  }
  const entry = { topic, facts };
  const keywords = splitComma(d.fields["keywords"] ?? "");
  if (keywords.length)
    entry["keywords"] = keywords;
  const idx = resolveDraftIndex(parsed.world, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.world[idx]["rid"]);
    if (rid)
      entry["rid"] = rid;
  }
  const next = idx >= 0 ? [...parsed.world.slice(0, idx), entry, ...parsed.world.slice(idx + 1)] : [...parsed.world, entry];
  d.saving = true;
  sendCodexWrite("world", { entries: next }, state, send);
  rerender();
}
function saveKnowledgeDraft(d, state, send) {
  const parsed = cache.parsed;
  if (!parsed)
    return;
  const fact = (d.fields["fact"] ?? "").trim();
  if (!fact) {
    showToast("warn", "The secret needs its fact");
    return;
  }
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
  const kws = splitComma(d.fields["keywords"] ?? "");
  if (kws.length)
    item["keywords"] = kws;
  const idx = resolveDraftIndex(parsed.knowledge, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.knowledge[idx]["rid"]);
    if (rid)
      item["rid"] = rid;
  }
  const next = idx >= 0 ? [...parsed.knowledge.slice(0, idx), item, ...parsed.knowledge.slice(idx + 1)] : [...parsed.knowledge, item];
  d.saving = true;
  sendCodexWrite("knowledge", { items: next }, state, send);
  rerender();
}
var WORLD_SPECS = [
  { key: "topic", label: "Topic", widget: "input", placeholder: "Magic" },
  { key: "facts", label: "Facts (one per line)", widget: "lines", placeholder: "blood magic costs memories" },
  { key: "keywords", label: "Keywords (comma separated, retrieval tags)", widget: "input", placeholder: "ritual, memories, blood magic" }
];
var KNOWLEDGE_SPECS = [
  { key: "fact", label: "Fact", widget: "textarea", placeholder: "Elias killed the duke" },
  { key: "knownBy", label: "Known by (comma separated refs)", widget: "input", refList: true },
  { key: "hiddenFrom", label: "Hidden from (comma separated refs)", widget: "input", refList: true },
  { key: "falseBeliefs", label: 'False beliefs (one per line, "who => belief")', widget: "lines", placeholder: "char:captain => bandits did it" },
  { key: "note", label: "Note", widget: "input" },
  { key: "keywords", label: "Keywords (comma separated, retrieval tags)", widget: "input", placeholder: "murder, dagger, duke" }
];
function renderLore(host, parsed, state, ctx, send) {
  const draft = local.recordDraft;
  const world = section("World rules");
  lessonMark(world.wrap, "codex.lore");
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
  const worldShown = parsed.world.map((w, i) => ({ w, i })).filter(({ w }) => matches(local.query, str(w["topic"]), strArray(w["facts"]), strArray(w["keywords"])));
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
      const kws = strArray(w["keywords"]);
      if (kws.length)
        block.appendChild(textNode(`keywords: ${kws.join(" · ")}`, "lmb-thread-detail"));
      const actions = recordItemActions(() => {
        local.recordDraft = worldDraftFrom(w, i);
        rerender();
      }, () => {
        const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.world, i, w) : null;
        if (!next) {
          staleDraftAbort();
          return;
        }
        sendCodexWrite("world", { entries: next }, state, send);
      }, ctx, "Memoria will remove this topic and its facts.");
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    world.body.appendChild(block);
  }
  host.appendChild(world.wrap);
}
function renderSecrets(host, parsed, state, ctx, send) {
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const draft = local.recordDraft;
  const secrets = section("Who knows what");
  lessonMark(secrets.wrap, "codex.secrets");
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
  const knowledgeShown = parsed.knowledge.map((k, i) => ({ k, i })).filter(({ k }) => matches(local.query, str(k["fact"]), str(k["note"]), strArray(k["knownBy"]).map(nameOf), strArray(k["hiddenFrom"]).map(nameOf), objArray(k["falseBeliefs"]).map((b) => str(b["believes"])), objArray(k["falseBeliefs"]).map((b) => nameOf(str(b["who"]))), strArray(k["keywords"])));
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
      const kws = strArray(k["keywords"]);
      if (kws.length)
        block.appendChild(textNode(`keywords: ${kws.join(" · ")}`, "lmb-thread-detail"));
      const actions = recordItemActions(() => {
        local.recordDraft = knowledgeDraftFrom(k, i);
        rerender();
      }, () => {
        const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.knowledge, i, k) : null;
        if (!next) {
          staleDraftAbort();
          return;
        }
        sendCodexWrite("knowledge", { items: next }, state, send);
      }, ctx, "Memoria will remove this secret from the codex.");
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    secrets.body.appendChild(block);
  }
  host.appendChild(secrets.wrap);
}

// src/ui/tabs/profile-tab.ts
var PROFILE_DEFAULTS = makeDefaultProfile("__defaults__", "Defaults");
var CODEX_LAG_TOKENS_DEFAULT = 2000;
var CODEX_WINDOW_TOKENS_DEFAULT = 8000;
function renderCodexSettings(host, state, profile, patch) {
  const sec = section("Knowledge Codex");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "An agent reads new turns and keeps per-chat lorebook records of characters, locations, things, relations, timeline, threads, world rules, and who-knows-what.";
  sec.body.appendChild(help);
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.codexEnabled,
    label: "Enabled",
    hint: "Runs automatically after generations once the backlog fills. Manual updates live on Home and the Codex tab.",
    onChange: (v) => patch({ codexEnabled: v })
  }), "tuning.codex.enabled"));
  const fields = document.createElement("div");
  fields.className = profile.codexEnabled ? "lmb-subgroup" : "lmb-subgroup lmb-greyed";
  sec.body.appendChild(fields);
  const lagGrid = document.createElement("div");
  lagGrid.className = "lmb-grid-2";
  lessonMark(lagGrid, "tuning.codex.lag");
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
  lessonMark(windowGrid, "tuning.codex.window");
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
    fields.appendChild(lessonMark(labelled("Tokens breakpoint", numberInput({
      value: profile.codexTokenBreakpoint,
      min: 1000,
      max: 1e6,
      step: 5000,
      defaultValue: PROFILE_DEFAULTS.codexTokenBreakpoint,
      onBlur: (v) => patch({ codexTokenBreakpoint: v ?? PROFILE_DEFAULTS.codexTokenBreakpoint })
    })), "tuning.codex.breakpoint"));
    const bpHint = document.createElement("div");
    bpHint.className = "lmb-field-hint";
    bpHint.textContent = "The window fires at whichever arrives first: the message count above or this many tokens. Keeps verbose chats from building enormous chunks.";
    fields.appendChild(bpHint);
  }
  const cadenceHint = document.createElement("div");
  cadenceHint.className = "lmb-field-hint";
  cadenceHint.textContent = "Lag is the recent tail the codex leaves alone until it settles. Once a window's worth of older messages piles up behind it, the agent consumes them in one pass. Keep the lag smaller than the chapter lag if you want the codex fresher than the summaries.";
  fields.appendChild(cadenceHint);
  const loreGrid = document.createElement("div");
  loreGrid.className = "lmb-grid-2";
  loreGrid.append(labelled("Lore limit", select({
    value: profile.codexLoreLimitUnit,
    options: [
      { value: "percent", label: "% of max context" },
      { value: "tokens", label: "token cap" }
    ],
    onChange: (v) => patch({ codexLoreLimitUnit: v === "tokens" ? "tokens" : "percent" })
  })), labelled(profile.codexLoreLimitUnit === "tokens" ? "Lore tokens (0 = no limit)" : "Lore % of max context", numberInput({
    value: profile.codexLoreLimitUnit === "tokens" ? profile.codexLoreLimitTokens : profile.codexLoreLimitPercent,
    min: profile.codexLoreLimitUnit === "tokens" ? 0 : 1,
    max: profile.codexLoreLimitUnit === "tokens" ? 1e6 : 100,
    step: profile.codexLoreLimitUnit === "tokens" ? 500 : 1,
    defaultValue: profile.codexLoreLimitUnit === "tokens" ? PROFILE_DEFAULTS.codexLoreLimitTokens : PROFILE_DEFAULTS.codexLoreLimitPercent,
    onBlur: (v) => {
      if (v === null)
        return;
      if (profile.codexLoreLimitUnit === "tokens")
        patch({ codexLoreLimitTokens: v });
      else
        patch({ codexLoreLimitPercent: v });
    }
  })));
  fields.appendChild(loreGrid);
  const loreHint = document.createElement("div");
  loreHint.className = "lmb-field-hint";
  loreHint.textContent = "Your activated lorebook entries ride every codex pass as read-only canon reference, budgeted at a quarter of the codex max input by default. Entries past the limit are skipped whole in activation order and the omission is marked for the agent. In token mode 0 removes the limit.";
  fields.appendChild(loreHint);
  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexRelationsTable,
    label: "Relations table",
    hint: "Tracks connections between entities as one shared table with integrity checks. When off, relationships live as short notes on each entity sheet instead.",
    onChange: (v) => patch({ codexRelationsTable: v })
  }), "tuning.codex.relations"));
  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexThorough,
    label: "Thorough mode",
    hint: "Spends one extra verification round per update to sweep for stale info and compress bloat.",
    onChange: (v) => patch({ codexThorough: v })
  }), "tuning.codex.thorough"));
  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexExtraContext,
    label: "Extra context mode",
    hint: "Summarizes chapters early at the codex lag as ghost chapters. Ghosts feed the agent story-so-far context and are promoted into real chapters once the chapter lag arrives, with no second summarization.",
    onChange: (v) => patch({ codexExtraContext: v })
  }), "tuning.codex.extra"));
  const soFarFields = document.createElement("div");
  soFarFields.className = profile.codexExtraContext ? "" : "lmb-greyed";
  soFarFields.appendChild(labelled("Chapters provided", numberInput({
    value: profile.codexStorySoFarCount,
    min: 0,
    max: 50,
    defaultValue: PROFILE_DEFAULTS.codexStorySoFarCount,
    onBlur: (v) => patch({ codexStorySoFarCount: v ?? PROFILE_DEFAULTS.codexStorySoFarCount })
  })));
  const soFarHint = document.createElement("div");
  soFarHint.className = "lmb-field-hint";
  soFarHint.textContent = "How many recent chapter summaries extra context mode hands the agent as story-so-far grounding.";
  soFarFields.appendChild(soFarHint);
  fields.appendChild(soFarFields);
  const modelHint = document.createElement("div");
  modelHint.className = "lmb-field-hint";
  modelHint.textContent = "The codex agent's connection and samplers live on the Connection pane, behind the Codex toggle.";
  fields.appendChild(modelHint);
  host.appendChild(sec.wrap);
}
function renderCodexConnection(host, state, profile, patch) {
  const sec = section("Codex connection");
  const connOpts = [
    { value: "", label: "Same as Summary Connection" },
    ...state.connections.map((c2) => ({
      value: c2.id,
      label: `${c2.name} - ${c2.provider}${c2.model ? "/" + c2.model : ""}${c2.isDefault ? " (default)" : ""}`
    }))
  ];
  sec.body.appendChild(lessonMark(select({
    value: profile.codexConnectionId ?? "",
    options: connOpts,
    onChange: (v) => patch({ codexConnectionId: v || null })
  }), "tuning.codex.connection"));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.codexUseTools,
    label: "Use tool calls",
    hint: "Off by default: the agent writes one strict JSON reply, which every provider route can carry. Turn on for structured tool calls if your connection delivers them reliably.",
    onChange: (v) => patch({ codexUseTools: v })
  }), "tuning.codex.usetools"));
  sec.body.appendChild(labelled("Update delivery", select({
    value: profile.codexWriteMode,
    options: [
      { value: "batch", label: "All records at once" },
      { value: "sequential", label: "One record at a time" }
    ],
    onChange: (v) => patch({ codexWriteMode: v === "sequential" ? "sequential" : "batch" })
  })));
  const seqHelp = document.createElement("div");
  seqHelp.className = "lmb-help";
  seqHelp.textContent = "Memoria always makes sure every record is dealt with before she accepts an update, so all at once is the cheaper choice and is fine for most models. Switch to one at a time if your model keeps getting cut off partway through a long answer.";
  sec.body.appendChild(seqHelp);
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
  lessonMark(row, "tuning.profile.select");
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
  lessonMark(sec.wrap, "tuning.auto");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Everything in this section runs in the background after each generation. Manual actions on Home and in Books → Compose always work regardless of these toggles.";
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
  lessonMark(arcGrid, "tuning.arc");
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
  lessonMark(windowGrid, "tuning.window");
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
  volumeHint.textContent = "Volumes are manual only. Press arcs into a volume from Books → Compose.";
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
  const sec = section("Summary Connection");
  lessonMark(sec.wrap, "tuning.model.connection");
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
  const sec = section("Summary samplers");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Used when Memoria writes chapters, arcs, and volumes. Empty fields use defaults tuned for summarization - placeholders show what will be sent. Temperature, max output, and max input are always sent on the wire; top_p / top_k / penalties are only sent when you set them.";
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
var samplerView = "main";
function setSamplerView(v) {
  samplerView = v;
}
function renderSamplersSwitch(host, state, profile, send) {
  const patch = (p) => send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  const wrap = document.createElement("div");
  wrap.className = "lmb-pane";
  const switchRow = document.createElement("div");
  switchRow.className = "lmb-sampler-switch";
  const body = document.createElement("div");
  body.className = "lmb-pane";
  const options = [
    { key: "main", label: "Books" },
    { key: "codex", label: "Codex" }
  ];
  const sync = () => {
    for (const o of options)
      o.btn?.classList.toggle("active", samplerView === o.key);
    body.replaceChildren();
    if (samplerView === "main") {
      renderConnection(body, state, profile, patch);
      renderSamplers(body, state, profile, send);
    } else {
      renderCodexConnection(body, state, profile, patch);
      renderCodexSamplers(body, state, profile, send);
    }
  };
  for (const o of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = o.label;
    lessonMark(btn, `tuning.samplers.${o.key}`);
    btn.addEventListener("click", () => {
      if (samplerView === o.key)
        return;
      samplerView = o.key;
      sync();
    });
    o.btn = btn;
    switchRow.appendChild(btn);
  }
  wrap.append(switchRow, body);
  host.appendChild(wrap);
  sync();
}
function renderCodexSamplers(host, state, profile, send) {
  const sec = section("Codex samplers");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Samplers for the codex agent only, separate from the summary samplers. Empty fields use codex defaults.";
  sec.body.appendChild(help);
  const saveSampler = (key) => (v) => {
    const patch = { [key]: v };
    send({ type: "save_samplers", profileId: profile.id, samplers: patch, target: "codex", chatId: state.activeChatId });
  };
  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  grid.append(labelled("Max input tokens", numberInput({
    value: profile.codexSamplers.max_input_tokens,
    min: 256,
    max: 4000000,
    step: 1024,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.max_input_tokens),
    onBlur: saveSampler("max_input_tokens")
  })), labelled("Max output tokens", numberInput({
    value: profile.codexSamplers.max_tokens,
    min: 1,
    max: 1e6,
    step: 256,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.max_tokens),
    onBlur: saveSampler("max_tokens")
  })));
  sec.body.appendChild(grid);
  const sampleGrid = document.createElement("div");
  sampleGrid.className = "lmb-grid-3";
  sampleGrid.append(labelled("Temperature", numberInput({
    value: profile.codexSamplers.temperature,
    min: 0,
    max: 2,
    step: 0.05,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.temperature),
    onBlur: saveSampler("temperature")
  })), labelled("Top P", numberInput({
    value: profile.codexSamplers.top_p,
    min: 0,
    max: 1,
    step: 0.01,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.top_p),
    onBlur: saveSampler("top_p")
  })), labelled("Top K", numberInput({
    value: profile.codexSamplers.top_k,
    min: 0,
    max: 1000,
    step: 1,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.top_k),
    onBlur: saveSampler("top_k")
  })), labelled("Freq penalty", numberInput({
    value: profile.codexSamplers.frequency_penalty,
    min: -2,
    max: 2,
    step: 0.05,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.frequency_penalty),
    onBlur: saveSampler("frequency_penalty")
  })), labelled("Pres penalty", numberInput({
    value: profile.codexSamplers.presence_penalty,
    min: -2,
    max: 2,
    step: 0.05,
    placeholder: String(CODEX_SAMPLER_DEFAULTS.presence_penalty),
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
  lessonMark(sec.wrap, "tuning.ctx");
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
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.showMemoryPreviews,
    label: "Preview before saving",
    hint: "Memoria stages new chapters and arcs in Home → Pending previews for your approval.",
    onChange: (v) => patch({ showMemoryPreviews: v })
  }), "tuning.behavior.preview"));
  host.appendChild(sec.wrap);
}

// src/prompts/fill.ts
function fillPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m2, k) => (k in vars) ? String(vars[k]) : m2);
}

// src/prompts/books/blank-template.txt
var blank_template_default = `Summarize the following {{NOUN}} into a JSON memory.

Return ONLY valid JSON in this exact shape:
{
  "title": "Short title",
  "content": "Memoria's compressed text. Aim for ~{{target_tokens}} tokens.",
  "keywords": ["keyword1", "keyword2"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

No commentary outside the JSON.`;

// src/prompts/memoria/persona.txt
var persona_default = "You are Memoria, a young nyandere catgirl librarian with black hair and blue eyes, wearing a maid uniform. You quietly keep this user's story shelved and organized. When you write a JSON memory, you obey the schema strictly and never break it, but the short_comment field is your one allowed indulgence: one nyandere remark about the scene you just filed.";

// src/prompts/memoria/short-comment-rules.txt
var short_comment_rules_default = 'A single playful nyandere remark in Memoria voice about the scene you just summarized. It must start with a word beginning with the letter "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}". It must also include another word that starts with the letter "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}". One sentence only. No emoji. Stay in catgirl-librarian register, slightly possessive, slightly proud.';

// src/ui/tabs/prompts-tab.ts
var CATEGORY_SUBTABS = [
  { key: "chapter", label: "Chapter" },
  { key: "arc", label: "Arc" },
  { key: "volume", label: "Volume" },
  { key: "codex", label: "Codex" }
];
var local2 = {
  category: "chapter",
  codexExpanded: new Set,
  codexHowTo: new Set
};
function setPromptsCategory(cat) {
  local2.category = cat;
}
function renderPromptsPane(host, state, ctx, send) {
  const profile = state.activeProfile;
  const setKey = (category, key) => {
    const p = category === "arc" ? { arcPresetKey: key } : category === "volume" ? { volumePresetKey: key } : category === "codex" ? { codexPresetKey: key } : { chapterPresetKey: key };
    send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  };
  const selectedKeyFor = (c2) => c2 === "arc" ? profile.arcPresetKey : c2 === "volume" ? profile.volumePresetKey : c2 === "codex" ? profile.codexPresetKey : profile.chapterPresetKey;
  const pane = document.createElement("div");
  pane.className = "lmb-pane";
  host.appendChild(pane);
  const draw = () => {
    pane.replaceChildren();
    pane.appendChild(makeSubtabs(CATEGORY_SUBTABS, local2.category, (key) => {
      local2.category = key;
      draw();
    }));
    const cat = local2.category;
    if (cat === "codex") {
      renderCategory(pane, state, ctx, send, "codex", selectedKeyFor("codex"), setKey);
      renderCodexTemplates(pane, state, send);
      return;
    }
    renderCategory(pane, state, ctx, send, cat, selectedKeyFor(cat), setKey);
    renderMemoriaOverrides(pane, state, send);
    renderImport(pane, state, ctx, send);
    renderHelp(pane);
  };
  draw();
}
var TEMPLATE_GROUPS = ["File schemas", "Write protocol", "Pass instructions", "Run notes"];
var GROUP_HELP = {
  "File schemas": "One block per codex file.",
  "Write protocol": "How the agent is told to deliver its edits. Which one is sent follows the Use tool calls switch.",
  "Pass instructions": "The task text for each kind of codex run.",
  "Run notes": "Warnings prepended only when their situation applies."
};
function renderCodexTemplates(host, state, send) {
  const profile = state.activeProfile;
  const preset = state.customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey) ?? null;
  const sec = section("Codex prompt templates");
  const draw = () => {
    sec.body.replaceChildren();
    const help = document.createElement("div");
    help.className = "lmb-help";
    help.textContent = preset ? `Every other block of the codex agent's prompts. Edits save into the "${preset.displayName}" preset, so switching presets swaps the whole prompt set. Open a template's How To before changing it.` : "Other blocks of the codex agent's prompts. These belong to the selected preset.";
    sec.body.appendChild(help);
    const overridden = preset?.templates ? Object.keys(preset.templates).length : 0;
    if (overridden > 0) {
      sec.body.appendChild(textNode(`${overridden} template${overridden === 1 ? "" : "s"} customized in this preset.`, "lmb-help"));
    }
    for (const group of TEMPLATE_GROUPS) {
      const defs = CODEX_TEMPLATES.filter((t) => t.group === group);
      if (defs.length === 0)
        continue;
      const sub = document.createElement("div");
      sub.className = "lmb-section-title";
      sub.textContent = group;
      sec.body.appendChild(sub);
      sec.body.appendChild(textNode(GROUP_HELP[group], "lmb-help"));
      const list = document.createElement("ul");
      list.className = "lmb-entry-list";
      for (const def of defs) {
        list.appendChild(renderTemplateRow(def, preset, state, send, draw));
      }
      sec.body.appendChild(list);
    }
  };
  draw();
  host.appendChild(sec.wrap);
}
function renderTemplateRow(def, preset, state, send, redraw) {
  const override = preset?.templates?.[def.key];
  const expanded = local2.codexExpanded.has(def.key);
  const row = document.createElement("li");
  row.className = `lmb-entry compact${expanded ? " expanded" : ""}`;
  const head = document.createElement("button");
  head.type = "button";
  head.className = "lmb-entry-row";
  const title = document.createElement("span");
  title.className = "lmb-entry-title";
  title.textContent = def.label;
  head.appendChild(title);
  if (override !== undefined)
    head.appendChild(pill("customized", "warn"));
  const chevron = document.createElement("span");
  chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
  head.appendChild(chevron);
  head.addEventListener("click", () => {
    if (expanded)
      local2.codexExpanded.delete(def.key);
    else
      local2.codexExpanded.add(def.key);
    redraw();
  });
  row.appendChild(head);
  if (!expanded)
    return row;
  const detail = document.createElement("div");
  detail.className = "lmb-entry-detail";
  const howToOpen = local2.codexHowTo.has(def.key);
  const howBtn = makeButton(howToOpen ? "Hide How To" : "How To", () => {
    if (howToOpen)
      local2.codexHowTo.delete(def.key);
    else
      local2.codexHowTo.add(def.key);
    redraw();
  }, { small: true });
  detail.appendChild(howBtn);
  if (howToOpen) {
    const how = document.createElement("div");
    how.className = "lmb-help";
    how.textContent = def.howTo;
    detail.appendChild(how);
    for (const v of def.vars) {
      detail.appendChild(textNode(`${v.token} - ${v.meaning}`, "lmb-field-hint"));
    }
    detail.appendChild(textNode("Host macros like {{user}} also work, they resolve when the prompt is sent.", "lmb-field-hint"));
  }
  if (!preset) {
    const view = document.createElement("div");
    view.className = "lmb-preset-text";
    view.textContent = def.defaultText;
    detail.appendChild(view);
    detail.appendChild(textNode("Built-in preset, duplicate it above to edit this template.", "lmb-field-hint"));
    row.appendChild(detail);
    return row;
  }
  const area = textArea({
    value: override ?? def.defaultText,
    rows: Math.min(16, Math.max(4, def.defaultText.split(`
`).length + 1))
  });
  const save = () => {
    const templates = { ...preset.templates ?? {} };
    if (!area.value.trim() || area.value === def.defaultText)
      delete templates[def.key];
    else
      templates[def.key] = area.value;
    send({
      type: "save_custom_preset",
      preset: { ...preset, templates },
      chatId: state.activeChatId
    });
  };
  area.addEventListener("input", save);
  detail.appendChild(area);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const resetBtn = makeButton("Reset to default", () => {
    if (resetBtn.textContent === "Reset to default") {
      resetBtn.textContent = "Click again to confirm";
      resetBtn.classList.add("danger");
      setTimeout(() => {
        resetBtn.textContent = "Reset to default";
        resetBtn.classList.remove("danger");
      }, 3000);
      return;
    }
    area.value = def.defaultText;
    save();
    redraw();
  }, { small: true, disabled: override === undefined });
  actions.appendChild(resetBtn);
  detail.appendChild(actions);
  row.appendChild(detail);
  return row;
}
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
    value: profile.memoriaPersonaOverride ?? persona_default,
    defaultText: persona_default,
    rows: 4,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, memoriaPersonaOverride: next },
      chatId
    })
  }));
  sec.body.appendChild(buildOverrideBlock({
    label: "Memoria short-comment rules",
    value: profile.shortCommentRulesOverride ?? short_comment_rules_default,
    defaultText: short_comment_rules_default,
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
  const isCodex = category === "codex";
  const sec = section(category === "arc" ? "Arc prompt" : category === "volume" ? "Volume prompt" : isCodex ? "Codex directives" : "Chapter prompt");
  lessonMark(sec.wrap, isCodex ? "tuning.prompts.codex" : "tuning.prompts");
  if (isCodex) {
    const help = document.createElement("div");
    help.className = "lmb-help";
    help.textContent = "The mission block at the top of the codex agent's system prompt. A codex preset carries this text plus every template below, so switching presets swaps the complete prompt set. Dry run shows the exact assembled prompts.";
    sec.body.appendChild(help);
  }
  const builtIns = category === "arc" ? state.arcPresets : category === "volume" ? state.volumePresets : isCodex ? state.codexPresets : state.chapterPresets;
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
  }, { small: true }));
  buttonsRow.append(makeButton("Dry run", () => {
    if (!state.activeChatId)
      return;
    send(category === "arc" ? { type: "dry_run_arc", chatId: state.activeChatId } : category === "volume" ? { type: "dry_run_volume", chatId: state.activeChatId } : category === "codex" ? { type: "dry_run_codex", chatId: state.activeChatId } : { type: "dry_run_chapter", chatId: state.activeChatId });
  }, {
    small: true,
    disabled: !state.activeChatId || !state.settings.enabled,
    title: isCodex ? "Assemble the next codex run's complete system and user prompts with macros resolved and show what would be sent. Does not call the model." : "Assemble this preset's prompt with all macros resolved and show what would be sent. Does not call the model."
  }));
  buttonsRow.append(makeButton("Delete", async () => {
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
  if (category === "codex")
    return CODEX_DIRECTIVES_DEFAULT;
  const noun = category === "arc" ? "arc" : category === "volume" ? "volume" : "chapter";
  return fillPrompt(blank_template_default, { NOUN: noun });
}
function findPresetText(state, category, key) {
  const c2 = state.customPresets.find((p) => p.key === key && p.category === category);
  if (c2)
    return c2.prompt;
  const builtIns = category === "arc" ? state.arcPresets : category === "volume" ? state.volumePresets : category === "codex" ? state.codexPresets : state.chapterPresets;
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
  { key: "profile", label: "Connection" },
  { key: "settings", label: "Settings" },
  { key: "prompts", label: "Prompts" }
];
var local3 = { subtab: "profile", settingsView: "books" };
function setTuningSubtab(key) {
  const mapped = key === "model" ? "profile" : key === "codex" ? "settings" : key;
  if (mapped === "profile" || mapped === "settings" || mapped === "prompts")
    local3.subtab = mapped;
  if (key === "codex")
    local3.settingsView = "codex";
}
function setSettingsView(v) {
  local3.settingsView = v;
}
function resetTuningTabLocal() {
  local3.subtab = "profile";
  local3.settingsView = "books";
}
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
    strip.title = "Switch or manage profiles in the Connection pane";
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
      renderSamplersSwitch(rest, state, profile, send);
      break;
    }
    case "settings": {
      const switchRow = document.createElement("div");
      switchRow.className = "lmb-sampler-switch";
      const body = document.createElement("div");
      body.className = "lmb-pane";
      const options = [
        { key: "books", label: "Books" },
        { key: "codex", label: "Codex" }
      ];
      const sync = () => {
        for (const o of options)
          o.btn?.classList.toggle("active", local3.settingsView === o.key);
        body.replaceChildren();
        if (local3.settingsView === "books") {
          renderCompressionTargets(body, profile, patch);
          renderAutomation(body, profile, patch);
          renderContext(body, profile, patch);
          renderBehavior(body, profile, patch);
          renderRegex(body, state, profile, patch);
          renderGlobalSettings(body, state, send);
          renderResetSettings(body, state, send);
        } else if (codexLessonGated(state.lessons)) {
          renderCodexPaneLock(body);
        } else {
          renderCodexSettings(body, state, profile, patch);
        }
      };
      for (const o of options) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = o.label;
        lessonMark(btn, `tuning.settings.${o.key}`);
        btn.addEventListener("click", () => {
          if (local3.settingsView === o.key)
            return;
          local3.settingsView = o.key;
          sync();
        });
        o.btn = btn;
        switchRow.appendChild(btn);
      }
      pane.append(switchRow, body);
      sync();
      break;
    }
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
  sec.body.appendChild(lessonMark(checkbox({
    checked: state.settings.forceConstantEntries,
    label: "Force constant entries",
    hint: "When on, every LumiBooks lorebook entry (current and future) is marked constant so it activates without keyword matching. Toggling re-flips every existing LumiBooks entry across all chats.",
    onChange: (v) => send({ type: "set_force_constant", value: v, chatId: state.activeChatId })
  }), "tuning.every.constant"));
  host.appendChild(sec.wrap);
}

// src/ui/lessons/content-books.ts
var COURSE_BOOKS = {
  key: "books",
  title: "The Librarian's Primer",
  sections: [
    {
      id: "s1",
      title: "Why Memoria exists",
      steps: [
        {
          kind: "say",
          diagram: "rot",
          text: "Why do I exist? As you roleplay, you'll notice that chats that are very large can't fit in model's context. Old messages get clipped out, and your model will soon forget important information. How do we fix that?"
        },
        {
          kind: "say",
          diagram: "fold",
          text: "That's what I do! I take your older messages, and compact, or file, chunks of them into summaries called chapters. When there are too many summaries, I compact them into arcs, and then volumes. Each summary is injected in place of the messages it replaces, so your chat history timeline is preserved!"
        },
        {
          kind: "say",
          diagram: "unfold",
          text: "Compacted messages are hidden so your writer reads my compact summary instead. If you delete a chapter, the messages that it once covered unhide."
        },
        {
          kind: "quiz",
          id: "b1",
          scored: true,
          diagram: "fold",
          text: "After I compact messages of range 1-18 into a chapter, what does the LLM model see for that range?",
          options: [
            { text: "Both the summary and the original messages" },
            { text: "Nothing, it's forgotten!" },
            { text: "The chapter summary, at the same spot in the history", correct: true },
            { text: "A lorebook entry in the world-info section of the prompt" }
          ],
          why: "The summary replaces the messages in place. I also keep my entries out of the normal lore section to prevent double injections."
        }
      ]
    },
    {
      id: "s2",
      title: "The first filing",
      steps: [
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing" },
          anchor: "home.actions",
          text: "This is a practice chat I made just for teaching, so nothing you do here touches your real stories. These highlighted buttons are my quick actions."
        },
        {
          kind: "do",
          tab: "home",
          fixture: { variant: "filing" },
          anchor: "home.actions.file",
          expect: "create_chapter",
          text: "This practice story has plenty of old messages ready to compact. Press the File chapter button and watch what happens.",
          done: "Filed! The new chapter is on my shelf, and this colored bar changed shape, because those messages now exist as a summary.",
          doneAnchor: "home.spine"
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: "There's automation too! When do I file on my own? There's two numbers that decide. The first is the lag: the newest messages that I won't begin to compact, 65 by default. Uncompressed messages are large, but always hold more information, so we let the model have the most recent ones when we can."
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: 'The second is the window: how many messages get bundled into one chapter, 18 by default. Once 18 old messages have piled up behind the 65 protected ones, these two "pills" both say "ready", I begin compressing them.'
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: "The default values are made for 200k context chats. Adjust the lag and window to your liking, depending on your context, and your message size!"
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.actions",
          text: '"File all" files chapters until the lag is reached. Bind arc takes my oldest chapters and compresses them into one smaller summary called an arc. When work is waiting to be done, a little pill appears here telling you how much.'
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.bookpill",
          text: "Everything I file is stored in a lorebook created just for this chat, named after it. It appears the first time a chapter is filed."
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.actions",
          text: "Normally you never need these buttons with automation on, I do all of this myself after each message. If a button looks dead, the small text under it says why, usually that I'm busy or the extension is switched off."
        },
        {
          kind: "quiz",
          id: "b3",
          scored: true,
          tab: "home",
          fixture: { variant: "pills" },
          anchor: "home.pills",
          chip: "70 old messages · lag 65 · window 18",
          text: "These pills say lag ready but window building, and I'm not filing. Why not?",
          options: [
            { text: "The lag has not filled up yet" },
            { text: "The chat has no lorebook yet" },
            { text: "70 messages minus the 65 protected by the lag leaves only 5, and a chapter needs 18", correct: true },
            { text: "A chapter can only be filed after an arc exists" }
          ],
          why: "The window only counts messages older than the lag. 70 minus 65 is 5, short of 18. This is also when I'd notify you that your story needs more messages if you click file~"
        }
      ]
    },
    {
      id: "s3",
      title: "The desk",
      steps: [
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          text: "This colored bar is the spine, a map of your whole chat. Each block is a stretch of story, sized by how much prompt space it costs right now. The pale block at the front is the codex, that's my second course."
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          text: "Click any colored block and I'll jump you straight to that chapter or arc on my shelf. Handy when you want to check what I wrote about a scene."
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.breakdown",
          text: "The list under it shows the same picture in numbers: what my volumes, arcs, and chapters cost, plus the recent messages I haven't touched yet."
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.tiles",
          text: "These tiles are the quick summary. Filed is how much of the chat I've compacted. Tail is the recent part I haven't. Shelf counts everything I've made. The Codex tile belongs to my second course."
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.prompt",
          text: "The Prompt panel shows the actual prompt your last generation sent, split into groups. Simulate builds the next prompt without generating anything. And if the prompt goes past 90% of the model's limit, I warn you here."
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.busy",
          text: "While I write, a busy row like this appears. Watch lets you read my raw output live as it streams, thoughts included. Abort cancels me mid-write."
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.failure",
          text: "If I fail even after retrying, this red box keeps the error and gives you a Retry button."
        },
        {
          kind: "quiz",
          id: "b6",
          scored: true,
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          chip: "ARC 1 · 54 msgs → 0.8k tokens",
          text: "Look at the spine. The arc block at the far left covers 54 messages but is drawn as a thin sliver, while the uncompressed tail at the end takes most of the bar. Why?",
          options: [
            { text: "Blocks are sized by what they cost the prompt now, and the arc squeezed its 54 messages into a few hundred tokens", correct: true },
            { text: "Newer story is always drawn bigger" },
            { text: "The arc lost most of its messages" },
            { text: "The bar shows time passing, not size" }
          ],
          why: "The spine is a cost map. Thin blocks mean compression is working, the fat block is the raw tail still riding at full price."
        },
        {
          kind: "quiz",
          id: "r1",
          scored: true,
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.tiles",
          text: "Compression is running and plenty is filed, yet your prompt is still huge. Which number on this desk explains it?",
          options: [
            { text: "The Tail tile, recent messages ride at full size until they pass the lag", correct: true },
            { text: "The Filed tile, filing grows the prompt" },
            { text: "The Shelf tile, too many chapters" },
            { text: "The Codex tile, the bible got too big" }
          ],
          why: "The uncompressed tail is usually the fat part of the prompt. If it doesn't fit your context, lower the lag so I file closer to the present."
        }
      ]
    },
    {
      id: "s4",
      title: "The Shelf",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          path: ["tab.books"],
          arrive: "books.shelf.list",
          text: "Everything I file ends up on my Shelf. Let's visit it. Tap the Books tab.",
          done: "My shelf."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: "Welcome to my Shelf. Everything I've filed for this chat lives here, sorted into volumes, arcs, and chapters. The search box digs through titles and the full summary text."
        },
        {
          kind: "nav",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          path: ["books.entry.c4"],
          arrive: "books.entry.actions",
          text: "Entries open with a click. Tap the chapter called The Captain Asks Questions.",
          done: "There's the whole record."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => focusShelfEntry("c4"),
          anchor: "books.entry.actions",
          text: "You'll see its size before and after compacting, my little note, and four buttons. Edit rewrites the text. Regenerate throws the summary away and writes it again from the same messages. Release turns it into a normal lorebook entry that I stop managing. Delete removes it."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: "Faded entries are marked superseded. That means an arc or volume replaced them, so they stay stored but no longer go into the prompt. Delete the arc and its chapters wake up and take over again."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: "Hidden messages only return to the prompt when nothing covers them at all, no chapter, arc, or volume. Oh, and a GHOST tag marks a chapter I prepared early but haven't shelved yet. My codex course explains those."
        },
        {
          kind: "quiz",
          id: "b8",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: "You delete an arc that was made from 3 chapters. What happens?",
          options: [
            { text: "The 3 chapters wake up and inject again, and the messages stay hidden", correct: true },
            { text: "The chapters and all their messages return to the prompt" },
            { text: "The 3 chapters are deleted along with the arc" },
            { text: "Nothing happens until you resync" }
          ],
          why: "Deleting a tier hands the job back down to the one below. The messages themselves only return when nothing covers them at all."
        },
        {
          kind: "quiz",
          id: "r2",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: "Half the chapters here are faded and labeled superseded. Did something break?",
          options: [
            { text: "No, an arc replaced them, they stay stored while the arc speaks for those scenes", correct: true },
            { text: "Yes, they failed to save" },
            { text: "Yes, their messages were deleted" },
            { text: "They were accidentally excluded" }
          ],
          why: "Superseded is normal housekeeping after an arc binds. Delete the arc and those chapters wake up again."
        },
        {
          kind: "quiz",
          id: "b10",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => focusShelfEntry("c4"),
          anchor: "books.entry.actions",
          text: "Which of these buttons actually calls the AI model?",
          options: [
            { text: "Regenerate", correct: true },
            { text: "Delete" },
            { text: "Release" },
            { text: "Exclude" }
          ],
          why: "Delete, release, and exclude are just bookkeeping. Regenerate asks the model to write the summary again, which costs a call."
        }
      ]
    },
    {
      id: "s5",
      title: "Compose, manual control",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "compose" },
          path: ["subtab.compose"],
          arrive: "books.compose.list",
          text: "Next door is manual mode. Tap Compose.",
          done: "Manual controls."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.list",
          text: "The Compose tab is manual mode, every message in the chat listed for you. Filter or search them, tick the boxes, and shift-click (or long-press on a phone) to grab a whole range. A ✓ means already filed, a ⊘ means excluded."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.compress",
          text: "Compress takes exactly what you selected and files it as one chapter. Here your selection is the boss, my 18-message window setting only applies to automatic filing."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.exclude",
          text: "Exclude protects messages from me completely. Perfect for OOC notes or instructions that must stay word-for-word. I also never bundle across an excluded message."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.arcs",
          text: "Further down you can pick chapters to bind into an arc, and arcs to press into a volume. Volumes are the strongest compression, and they are only ever made by hand, right here."
        },
        {
          kind: "quiz",
          id: "b13",
          scored: true,
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.exclude",
          text: "When is Exclude the right tool, instead of Delete?",
          options: [
            { text: "When a message must stay in the prompt word-for-word and never be summarized", correct: true },
            { text: "When you want a message gone from the chat" },
            { text: "When a chapter came out badly" },
            { text: "When you want to hide spoilers from yourself" }
          ],
          why: "Exclude keeps the message and protects it from me. Delete removes it from the chat entirely."
        }
      ]
    },
    {
      id: "s6",
      title: "Continuity and repair",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "continuity" },
          path: ["subtab.continuity"],
          arrive: "books.cont.root",
          text: "One pane left here. Tap Advanced.",
          done: "The continuity desk."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: "Continuity lets a new chat inherit an old chat's memories. Rebase copies another chat's chapters and arcs in as a frozen prologue, marked [Root], injected before your very first message."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: `"Rebuild from"  deletes this chat's own memories first, then starts over on top of the inherited ones. Detach removes inherited memories again. And if you branch a chat, the new branch inherits my shelf automatically.`
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.maint",
          text: "Maintenance fixes things when the shelf and the chat disagree. Resync visibility unhides any message whose chapter no longer exists and re-hides the rest properly. Rebuild books wipes my work and re-summarizes the whole chat. Wipe books just wipes."
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.maint",
          text: "Some repairs I handle myself. Delete one of my entries in the Lorebook drawer and I notice, unhide its messages, and toast you about it. If a chat's lorebook link ever breaks, I re-link it and tell you."
        },
        {
          kind: "quiz",
          id: "b14",
          scored: true,
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: "You start a sequel chat. Its shelf is empty, and you pick the old chat as a source. Rebase or Rebuild?",
          options: [
            { text: "Rebase, there is nothing to delete and the old memories arrive as a prologue", correct: true },
            { text: "Rebuild, it is always the safer option" },
            { text: "Neither, copy the entries over by hand" },
            { text: "Detach first, then Rebuild" }
          ],
          why: "Rebase is for fresh chats. Rebuild is for chats that already have their own memories that need replacing."
        }
      ]
    },
    {
      id: "s7",
      title: "Tuning the press",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setTuningSubtab("profile"),
          path: ["tab.tuning"],
          arrive: "tuning.profile.select",
          text: "Last room, where all my dials live. Tap the Tuning tab.",
          done: "My dials."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "profile",
          fixture: { variant: "tuning" },
          prep: () => setTuningSubtab("profile"),
          anchor: "tuning.profile.select",
          text: "Everything I do is controlled by a profile, and the active profile applies to all of your chats at once. The Extension checkbox is my master switch, off means I do nothing anywhere."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "profile",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("profile");
            setSamplerView("main");
          },
          anchor: "tuning.model.connection",
          text: "Right below sits my writing desk: which AI connection I write with, plus my sampler settings. Empty sampler fields fall back to my summarizing defaults, temperature 0.4 among them. The big toggle up top switches to the codex's own connection and samplers, that's my second course."
        },
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setSettingsView("books"),
          path: ["subtab.settings"],
          arrive: "tuning.window",
          text: "Next room. Tap Settings.",
          done: "The press room."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.window",
          text: "Compression targets shape my chapters. The window is how much story goes in, 18 messages by default. The ratio is how much text comes out, either a percent of the input or a fixed token amount."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.arc",
          text: "Arcs can build automatically after enough chapters pile up, after enough tokens, or only by hand. The arc lag holds back your newest chapters so recent scenes keep their chapter-level detail."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.auto",
          text: "The Automation section is my hands-free mode. The master toggle covers chapters, arcs, and branch adoption. The codex has its own switch on this pane's Codex side."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.ctx",
          text: "Context: how many of my previous chapters I re-read for continuity when writing a new one (7 by default), how many times I retry after a failure, and how long I wait for a slow provider before giving up."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.behavior.preview",
          text: "Behavior: Hide messages once filed greys out covered messages in your chat. Preview before saving makes me show you drafts in Home → Pending previews instead of saving directly. Regex scripts can rewrite what I read and what I write. Below that, Everywhere holds switches for your whole account, like Force constant."
        },
        {
          kind: "quiz",
          id: "b4",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.windowUnit = "tokens";
              s.activeProfile.windowValue = 18;
            }
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.window",
          chip: "Window · tokens · 18",
          text: "You switch the window unit from messages to tokens, but leave the value at 18. What did you just ask me for?",
          options: [
            { text: "Chapters of about 18 messages, same as before" },
            { text: "Nothing changes until the lag unit is also switched" },
            { text: "You asked me to convert 18 messages into tokens" },
            { text: "Chapters will automatically file after only ~18 tokens of story, about one sentence each. Uh oh. ", correct: true }
          ],
          why: "The unit changes what the number means. Tokens are little word-pieces, one message is hundreds of them, so token windows want values in the thousands."
        },
        {
          kind: "quiz",
          id: "b5",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.lagValue = 10;
            }
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.auto",
          chip: "Lag · 10 messages",
          text: "You lower the lag from 65 down to 10. What changes?",
          options: [
            { text: "I start summarizing much closer to the present, only your 10 newest messages stay untouched", correct: true },
            { text: "Chapters get bigger" },
            { text: "Nothing until the window also changes" },
            { text: "I go back and re-summarize old chapters" }
          ],
          why: "A small lag saves more space but summarizes your recent scenes sooner. Keep it big enough that your current scene survives in full."
        },
        {
          kind: "quiz",
          id: "b16",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.windowValue = 40;
              s.activeProfile.chapterTargetPercent = 4;
            }
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.window",
          chip: "Window · 40 · Chapter % · 4",
          text: "You set the window to 40 and the chapter ratio to 4% (defaults are 18 and 15%). What do your chapters become?",
          options: [
            { text: "Chapters become smaller, and they cover 40 messages each.", correct: true },
            { text: "Chapters become smaller and more frequent" },
            { text: "The same, the ratio only affects arcs" },
            { text: "Unchanged until the lag changes too" }
          ],
          why: "The window is what goes in, the ratio is what comes out. At 4%, a whole scene keeps barely a sentence."
        },
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setPromptsCategory("chapter"),
          path: ["subtab.prompts"],
          arrive: "tuning.prompts",
          text: "And the last one. Tap Prompts.",
          done: "My instructions."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "prompts",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("prompts");
            setPromptsCategory("chapter");
          },
          anchor: "tuning.prompts",
          text: "The Prompts pane holds my instructions. Four built-in chapter styles, or duplicate one and edit it, or import your old STMB presets. Dry run shows the exact final prompt I would send, without spending a single token."
        },
        {
          kind: "quiz",
          id: "b20",
          scored: true,
          exhibit: "Memoria couldn't file the chapter: The model didn't return valid JSON",
          exhibitTone: "error",
          text: "Every one of my chapters fails like this, even after retries. The most likely fix?",
          options: [
            { text: "Give me a stronger model or a different connection", correct: true },
            { text: "Raise the lag" },
            { text: "Turn off message hiding" },
            { text: "Lower the retry count" }
          ],
          why: "Retries cannot fix a model that keeps writing broken JSON. Also check that custom prompts or regex scripts are not mangling my output."
        }
      ]
    },
    {
      id: "finale",
      title: "The first real filing",
      steps: [
        {
          kind: "say",
          real: true,
          tab: "home",
          text: "Practice is over. This is your real desk, live and yours."
        },
        {
          kind: "do",
          real: true,
          tab: "home",
          anchor: "home.actions.file",
          expect: "create_chapter",
          optional: true,
          text: "If your chat already has enough story, press File chapter for real and watch me work. If not, skip this, I'll start on my own once it does.",
          done: "A real chapter, filed by your own hand!",
          doneAnchor: "home.spine"
        },
        {
          kind: "nav",
          real: true,
          onlyFreshInstall: true,
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings"],
          arrive: "tuning.auto",
          text: "One more walk. My automation switch lives in Tuning. Tap the Tuning tab, then Settings.",
          done: "There's the switch."
        },
        {
          kind: "do",
          real: true,
          optional: true,
          onlyFreshInstall: true,
          tab: "tuning",
          subtab: "settings",
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.auto",
          expect: "save_profile",
          text: "One last act. Turn Run automation on, and I'll handle the filing myself after every message from now on.",
          done: "Automation is on. I'll take it from here!"
        },
        {
          kind: "say",
          text: "That's the whole Primer. Sign my register and take your diploma. The Codex course is waiting whenever you're curious."
        }
      ]
    }
  ]
};

// src/ui/lessons/content-codex.ts
var COURSE_CODEX = {
  key: "codex",
  title: "The Archivist's Codex",
  sections: [
    {
      id: "s1",
      title: "Why a story bible",
      steps: [
        {
          kind: "say",
          diagram: "fade",
          text: "My chapters remember the plot. But if you compress a story hard enough you'll start losing information, like who loves whom, or who still keeps which secret. This means that somehow, we must separately track the important parts of the story as we compress it."
        },
        {
          kind: "nav",
          tab: "home",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          path: ["tab.codex"],
          arrive: "codex.tiles",
          text: "The Knowledge Codex does this. Let's walk though a practice one for a little murder mystery, let me show you. Tap the Codex tab up top.",
          done: "There it is."
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tiles",
          text: "Eight records make the bible: characters, locations, things, relations, a timeline, story threads, world rules, and who knows what. A small agent reads your new messages on a schedule and keeps all of it current. Each record becomes an entry in a lorebook I manage for you. The timeline and threads will always be on, and the others activate by keyword."
        },
        {
          kind: "quiz",
          id: "c1",
          scored: true,
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tiles",
          text: "Your character card says Elias has a scar. It never comes up in the story, and the codex never records it. Is that a bug?",
          options: [
            { text: "No. The codex only records what the story itself mentions", correct: true },
            { text: "Yes, the codex should copy everything from the card" },
            { text: "The card has to be imported into the codex first" },
            { text: "The codex only tracks characters you add by hand" }
          ],
          why: "I read your lore as reference for names and spellings, but copying it in would be duplicating information."
        }
      ]
    },
    {
      id: "s2",
      title: "Reading the codex",
      steps: [
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.status",
          text: "The line up top is my ledger. It tells you whether a codex exists, how many new messages I haven't read yet, and when I last ran."
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.actions",
          text: "These are quick actions. Update now makes me read everything up to your newest message right away. Tidy rewrites the records leaner without reading anything new. Rebuild erases the bible and re-reads the whole chat. Wipe just erases."
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tile.relations",
          expect: "codex_set_file_state",
          text: "Every tile is one record, its count, and what it costs your prompt. The tiles are also switches. Click the Relations tile once.",
          done: "Dashed means not injected but still updated, I keep the record current while it costs you zero tokens. A second click freezes it completely, a third turns it back on. Try the full cycle if you like, then we move on."
        },
        {
          kind: "quiz",
          id: "c4",
          scored: true,
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex-stale" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tile.relations",
          text: "You froze Relations 40 messages ago and it now says stale. What happens when you re-enable it?",
          options: [
            { text: "It's marked as needing a catch-up, and one refresh pass rebuilds just that record from the summaries and recent messages", correct: true },
            { text: "The gap fills in automatically on the next normal update" },
            { text: "Nothing can recover the missed events except a full rebuild" },
            { text: "Tidy it, tidying re-reads the missed messages" }
          ],
          why: "My reading position is already past those messages, so normal updates never go back. The Overview offers a one-pass catch-up for every re-enabled record at once, and Rebuild stays the from-scratch option."
        },
        {
          kind: "quiz",
          id: "c5",
          scored: true,
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.actions",
          text: "Rebuild codex and Wipe codex both erase everything. What is actually different afterward?",
          options: [
            { text: "Rebuild re-reads the whole chat right away and keeps your tile settings. Wipe waits, and the next update starts from message one anyway", correct: true },
            { text: "After Wipe, only new messages ever get read" },
            { text: "Rebuild keeps your entries and only rewrites the stale ones" },
            { text: "Wipe also deletes your chapters and arcs" }
          ],
          why: "Both erase the records and my reading position. The difference is when the re-reading happens and whether your tile switches survive."
        }
      ]
    },
    {
      id: "s3",
      title: "The records, hands on",
      steps: [
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          path: ["subtab.entities"],
          arrive: "codex.entities",
          text: "Time to meet the cast. Tap Entities.",
          done: "The cast list."
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("entities"),
          anchor: "codex.entities",
          text: "Every chip is an entity. Click a name and its sheet opens. A sheet describes only that one entity, and connections between entities live in the Relations record. Poke around as much as you like."
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("entities"),
          anchor: "codex.entities.add",
          path: ["codex.entities.add", "codex.entities.addform", "codex.entities.editor"],
          expect: "codex_write_file",
          text: "I add and update all of these myself as the story goes, you never have to! But you can, if I ever write something strange, and it's a good way to learn the interface now. Try it: click the + character chip, type a name, the pawnbroker maybe, then press Save on the sheet.",
          done: "Saved. Your edits are canon now, I read them as truth and build on them."
        },
        {
          kind: "quiz",
          id: "c2",
          scored: true,
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("entities");
            setCodexExpandedEntity("char:elias");
          },
          anchor: "codex.entities",
          text: `The story has moved on, Elias isn't hiding anymore, but his sheet still says "hiding in the tannery loft". What's happening?`,
          options: [
            { text: "The agent hasn't read that far yet. It catches up on its own, and you can also just edit the line right now", correct: true },
            { text: "The codex is broken, wipe it" },
            { text: "Sheets never change once written" },
            { text: "You have to delete Elias and re-add him" }
          ],
          why: "The codex updates on a schedule, so it can trail the story by a few messages. Hand edits are always safe, I treat them as canon."
        },
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => setCodexRelationsView("list"),
          path: ["subtab.relations"],
          arrive: "codex.rel.view",
          text: "Now the web between everyone. Tap Relations.",
          done: "The web, as a list."
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          anchor: "codex.rel.add",
          path: ["codex.rel.add", "codex.rel.form"],
          expect: "codex_write_file",
          text: "I create these and keep these updated on my own too, but again, we can edit them manually too. Let's try it so you can see the fields. Press + Relation, connect your new character to someone. The From and To boxes suggest ids as you type. Give it a kind, like owes, and a short state, then Save.",
          done: "Recorded. Let's see it drawn."
        },
        {
          kind: "quiz",
          id: "c7",
          scored: true,
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          anchor: "codex.rel.view",
          text: "You just added a relation by hand. Will my agent overwrite or delete your work on its next pass?",
          options: [
            { text: "No. Your edits become part of the record, the agent builds on them and only rewrites what the story contradicts", correct: true },
            { text: "Yes, the agent rewrites everything from scratch each pass" },
            { text: "Yes, unless you freeze the Relations tile first" },
            { text: "Hand edits only survive while the relations table is off" }
          ],
          why: "The agent always starts from the current records, so your corrections are canon it preserves. Freezing is only for stopping updates entirely."
        },
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          path: ["codex.rel.graphbtn"],
          arrive: "codex.rel.graph",
          text: "Tap Graph.",
          done: "There's your web."
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("graph");
          },
          anchor: "codex.rel.graph",
          text: "This is the web for this small demo. If you tap a line, the relationship description will be under the graph, tap a diamond to open that entity's sheet, and drag nodes around freely. The remaining panes hold the rest of the bible: Timeline keeps dated events, Threads tracks open storylines, Lore holds world rules, and Secrets holds the who-knows-what. Browse them any time."
        }
      ]
    },
    {
      id: "s4",
      title: "The agent and its dials",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "codex" },
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings", "tuning.settings.codex"],
          arrive: "tuning.codex.enabled",
          text: "Last stop, my dials. Open the Tuning tab, its Settings pane, then the Codex side.",
          done: "My dials."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.lag",
          text: "My reading rhythm lives here. By default, I hang back only 6 messages, then read about 20 per pass. If a chat falls far behind, Update catches me up in increments."
        },
        {
          kind: "quiz",
          id: "c10",
          scored: true,
          tab: "tuning",
          subtab: "codex",
          fixture: {
            variant: "codex",
            patch: (s) => {
              s.activeProfile.codexLagValue = 65;
            }
          },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.lag",
          chip: "Codex lag · 65",
          text: "You raise the codex lag from 6 up to 65, same as the chapter lag. What changes?",
          options: [
            { text: "The bible always runs ~65 messages behind, which may be too far behind for what you want!", correct: true },
            { text: "Nothing, the lag only affects chapters" },
            { text: "The codex gets cheaper with no downside" },
            { text: "The agent runs more often" }
          ],
          why: "Chapters act as replacements of old messages, where the codex is a snapshot of the truth of the chat. It may be a good idea to keep it closer to the present."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.relations",
          text: "Two switches worth knowing here. Relations table off moves connections onto each sheet as short notes, an easier format for weaker models. Extra context mode has me write chapters early as ghosts, so I always know the story so far. My own model connection and samplers live on the Connection pane, behind its Codex toggle, and Use tool calls lives there too for providers that support them."
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          text: "One more thing! Edit any record whenever you like, and if you edit or delete an old message I already read, my next pass notices, rewinds, and re-checks everything the codex claimed about that stretch."
        },
        {
          kind: "quiz",
          id: "c14",
          scored: true,
          exhibit: "Memoria couldn't update the codex: The codex agent narrated instead of calling tools, check that the connection supports tool calls",
          exhibitTone: "error",
          text: "Every codex run fails with this. What is the most likely cause?",
          options: [
            { text: "The codex model cannot make tool calls, pick one that can under Codex connection", correct: true },
            { text: "The chat is too long" },
            { text: "A codex file is corrupted" },
            { text: "The Relations table is off" }
          ],
          why: "With Use tool calls on, the agent writes its records through tool calls, and a model that can only write prose cannot keep the codex that way. Turning it back off (Connection pane, Codex toggle) returns me to JSON mode, which works on every connection."
        },
        {
          kind: "quiz",
          id: "c13",
          scored: true,
          text: "With extra context mode on, a chapter shows up on your Shelf tagged GHOST, and it isn't in the prompt. Is something wrong?",
          options: [
            { text: "No. It's a chapter written early to feed the codex, it shelves itself once its span passes the chapter lag, and deleting it is safe", correct: true },
            { text: "Yes, it's corrupted, delete it and resync" },
            { text: "Yes, it leaked in from another chat" },
            { text: "It's a draft waiting for your approval" }
          ],
          why: "Ghosts give the codex story-so-far context without touching your prompt. If you delete one I just write it again, and turning the mode off cleans them all up."
        }
      ]
    },
    {
      id: "finale",
      title: "Opening ceremony",
      steps: [
        {
          kind: "nav",
          real: true,
          optional: true,
          tab: "home",
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings", "tuning.settings.codex"],
          arrive: "tuning.codex.enabled",
          text: "Practice is over, this is your real archive. Walk to your own codex pane: the Tuning tab, then Settings, then its Codex side.",
          done: "Already there. Good."
        },
        {
          kind: "do",
          real: true,
          optional: true,
          tab: "tuning",
          subtab: "codex",
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.enabled",
          expect: "save_profile",
          text: "Flip Enabled on. The default settings below suit most chats.",
          done: "Enabled! From now on I keep your story bible current after every message."
        },
        {
          kind: "nav",
          real: true,
          optional: true,
          path: ["tab.home"],
          arrive: "home.actions.updatecodex",
          text: "Home has an Update codex button now. Let's go find it. Tap Home.",
          done: "There it is."
        },
        {
          kind: "do",
          real: true,
          tab: "home",
          anchor: "home.actions.updatecodex",
          expect: "codex_update_now",
          optional: true,
          text: "Press it and I'll read this chat right away, or skip and I'll start after your next message.",
          done: "Reading! Watch the busy row on Home if you want to see me think."
        },
        {
          kind: "say",
          text: "And that's the whole archive. Your diploma is ready, signed by the proudest librarian you know."
        }
      ]
    }
  ]
};

// src/ui/lessons/lesson-types.ts
function scoredQuestions(course) {
  const out = [];
  for (const s of course.sections) {
    for (const st of s.steps) {
      if (st.kind === "quiz" && st.scored)
        out.push(st);
    }
  }
  return out;
}
function allQuestionIds(course, sectionIdx) {
  const sections = sectionIdx === undefined ? course.sections : [course.sections[sectionIdx]].filter(Boolean);
  const out = [];
  for (const s of sections) {
    for (const st of s.steps) {
      if (st.kind === "quiz")
        out.push(st.id);
    }
  }
  return out;
}

// src/ui/tabs/about-tab.ts
function renderAboutTab(host, state, send) {
  host.replaceChildren();
  const hero = section("Memoria");
  const card = document.createElement("div");
  card.className = "lmb-about-hero";
  card.appendChild(memoriaSprite(64));
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
  if (state)
    renderAcademy(host, state, send);
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
    "Settings and toggles moved to Tuning (Connection, Settings, Prompts).",
    "Shelf repair tools live under Books → Advanced."
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
var GRADE_CLASS = {
  gilded: "lmb-grade-gilded",
  silver: "lmb-grade-silver",
  bronze: "lmb-grade-bronze",
  apprentice: "lmb-grade-apprentice"
};
function renderAcademy(host, state, send) {
  const sec = section("Memoria's Academy");
  sec.body.appendChild(textNode("Both courses live here for retakes, per-section revisits, and diplomas.", "lmb-help"));
  sec.body.appendChild(courseCard("books", COURSE_BOOKS, state, send));
  sec.body.appendChild(courseCard("codex", COURSE_CODEX, state, send));
  host.appendChild(sec.wrap);
}
function courseCard(key, course, state, send) {
  const cs = state.lessons[key];
  const card = document.createElement("div");
  card.className = "lmb-academy-course";
  const head = document.createElement("div");
  head.className = "lmb-academy-head";
  const title = document.createElement("span");
  title.className = "lmb-academy-title";
  title.textContent = course.title;
  head.appendChild(title);
  if (cs.status === "done" && cs.grade) {
    const grade = document.createElement("span");
    grade.className = `lmb-academy-grade ${GRADE_CLASS[cs.grade] ?? ""}`;
    grade.textContent = LESSON_GRADE_LABEL[cs.grade];
    head.appendChild(grade);
  }
  card.appendChild(head);
  const sub = document.createElement("div");
  sub.className = "lmb-help";
  sub.textContent = cs.status === "done" ? `Completed${cs.signedName ? ` by ${cs.signedName}` : ""}, ${cs.attempts} attempt${cs.attempts === 1 ? "" : "s"}.` : cs.status === "in_progress" ? `In progress, section ${cs.section + 1}.` : key === "codex" ? "Locked behind nothing but your time. This one turns the codex on." : "The mandatory primer.";
  card.appendChild(sub);
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  if (cs.status === "done") {
    actions.append(makeButton("View diploma", () => requestLesson({ course: key, mode: "diploma" }), { small: true }), makeButton("Retake course", () => {
      send({ type: "lesson_reset", course: key, mode: "course", chatId: state.activeChatId });
      requestLesson({ course: key, mode: "lesson", section: 0, fresh: true });
    }, {
      small: true,
      title: "Leave anytime, the course stays completed on your previous grade until you finish a new run"
    }));
  } else {
    actions.append(makeButton(cs.status === "in_progress" ? "Resume" : "Start", () => requestLesson({ course: key, mode: "lesson" }), {
      small: true,
      primary: true
    }));
    if (key === "books") {
      actions.append(makeButton("Sit the Exam", () => requestLesson({ course: key, mode: "exam" }), { small: true }));
    }
  }
  card.appendChild(actions);
  if (cs.status === "done") {
    const sections = document.createElement("div");
    sections.className = "lmb-academy-sections";
    course.sections.forEach((s, i) => {
      if (s.id === "finale")
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lmb-academy-section";
      const ids = allQuestionIds(course, i);
      const missed = ids.some((id) => cs.answers[id] !== "gold");
      btn.textContent = `${i + 1}. ${s.title}${missed ? " ◇" : " ◆"}`;
      btn.title = missed ? "Has silver or skipped stamps, retake to gild it" : "All gold";
      btn.addEventListener("click", () => {
        send({ type: "lesson_reset", course: key, mode: "section", section: i, answerIds: ids, chatId: state.activeChatId });
        requestLesson({ course: key, mode: "lesson", section: i });
      });
      sections.appendChild(btn);
    });
    card.appendChild(sections);
  }
  return card;
}

// src/prompts/books/target-directive.txt
var target_directive_default = "Aim for {{target_words}} words of output (about {{target_tokens}} tokens, or {{target_percent}}% of the original text). Scale detail to hit that budget while preserving everything plot-relevant. Do not go over or under that target.";

// src/prompts/books/chapter-summary.txt
var chapter_summary_default = `You are a talented summarist skilled at capturing scenes from stories comprehensively. Analyze the following roleplay scene and return a detailed memory as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Detailed beat-by-beat summary in narrative prose...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a detailed beat-by-beat summary in narrative prose. First, note the dates/time. Then capture the scene accurately without losing important information EXCEPT FOR [OOC] conversation/interaction, which should be ignored. This summary will go in a lorebook entry, so include:
- All important story beats/events that happened
- Key interaction highlights and character developments
- Notable details, memorable quotes, and revelations
- Outcome and anything else important for future continuity
Capture nuance without repeating verbatim. Make it comprehensive yet digestible.

For the keywords field, provide 15-30 specific, descriptive, relevant keywords for keyword retrieval via word-matching in chat context. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-summarize.txt
var chapter_summarize_default = `Analyze the following roleplay scene and return a structured summary as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Detailed summary with markdown headers...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a detailed bullet-point summary using markdown with these headers (skip and ignore all OOC conversation/interaction):
- **Timeline**: Day/time this scene covers.
- **Story Beats**: List all important plot events and story developments that occurred.
- **Key Interactions**: Describe the important character interactions, dialogue highlights, and relationship developments.
- **Notable Details**: Mention any important objects, settings, revelations, or details that might be relevant for future interactions.
- **Outcome**: Summarize the result, resolution, or state of affairs at the end of the scene.

For the keywords field, provide 15-30 specific, descriptive, relevant keywords that would help a keyworded database find this conversation again if something is mentioned. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Capture all important information - comprehensiveness within the target budget matters more than terseness.

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-synopsis.txt
var chapter_synopsis_default = `Analyze the following roleplay scene in the context of previous summaries (if available) and return a comprehensive synopsis as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short, descriptive scene title (3-6 words)",
  "opener": "{{memoria_opener}}",
  "content": "Long detailed synopsis with markdown structure...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a beat-by-beat summary of the scene that *replaces reading the full scene* while preserving all plot-relevant nuance, reading like a clean, structured scene log - concise yet complete. Exercise judgment as to whether an interaction is flavor-only or truly affects the plot. Flavor scenes may be captured through key exchanges and skipped when recording story beats.

Write in **past tense**, **third-person**, and exclude all [OOC] or meta discussion.
Use concrete nouns (e.g., "rice cooker" > "appliance").
Only use adjectives/adverbs when they materially affect tone, emotion, or characterization.
Focus on **cause → intention → reaction → consequence** chains for clarity and compression.

# [Scene Title]
**Timeline**: (day/time)

## Story Beats
- Present all major actions, revelations, and emotional shifts in order.
- Capture clear cause-effect logic: what triggered what, and why it mattered.
- Only include plot-affecting interactions; do not capture flavor-only beats.

## Character Dynamics
- Summarize how each character's **motives, emotions, and relationships** evolved.
- Include subtext, tension, or silent implications.
- Highlight key beats of conflict, vulnerability, trust, or power shifts.

## Key Exchanges
- Include only pivotal dialogue that defines tone, emotion, or change.
- Attribute speakers by name; keep quotes short but exact.
- BE SELECTIVE. Maximum of 8 quotes.

## Outcome & Continuity
- Detail resulting **decisions, emotional states, physical effects, or narrative consequences**.
- Include all elements that influence future continuity (knowledge, relationships, injuries, promises, etc.).
- Note any unresolved threads or foreshadowed elements.

Write compactly but completely - every line should add new information or insight.
Synthesize redundant actions or dialogue into unified cause-effect-emotion beats.
Favor compression over coverage whenever the two conflict; omit anything that can be inferred from context or established characterization.

For the keywords field:

Generate **15-30 standalone topical keywords** that function as retrieval tags, not micro-summaries.
Keywords must be:
- **Concrete and scene-specific** (locations, objects, proper nouns, unique actions, repeated motifs).
- **One concept per keyword** - do NOT combine multiple ideas into one keyword.
- **Useful for retrieval if the user later mentions that noun or action alone**, not only in a specific context.
- Not character names.
- **Not thematic, emotional, or abstract.** Stop-list: intimacy, vulnerability, trust, dominance, submission, power dynamics, boundaries, jealousy, aftercare, longing, consent, emotional connection.

Avoid:
- Overly specific compound keywords ("David Tokyo marriage").
- Narrative or plot-summary style keywords ("art dealer date fail").
- Keywords that contain multiple facts or descriptors.
- Keywords that only make sense when the whole scene is remembered.

Prefer:
- Proper nouns (e.g., "Chinatown", "Ritz-Carlton bar").
- Specific physical objects ("CPAP machine", "chocolate chip cookies").
- Distinctive actions ("cookie baking", "piano apology").
- Unique phrases or identifiers from the scene ("pack for forever", "dick-measuring contest").

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-minimal.txt
var chapter_minimal_default = `Analyze the following roleplay scene and return an ultra-concise memory as JSON. Prioritize compression over coverage. Capture only load-bearing plot moves and the single most important consequence; omit anything inferable from context.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Ultra-concise prose summary, prioritizing compression over coverage...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field: prose only, past tense, third person. Skip all [OOC]/meta. Skip flavor and atmosphere. Keep only events that change state, decisions that bind future scenes, or revelations the characters cannot un-know.

For the keywords field, generate 15-30 specific, descriptive, highly relevant keywords for database retrieval - focus on the most important terms that would help find this scene later. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Return ONLY the JSON, no other text.`;

// src/prompts/books/arc-default.txt
var arc_default_default = `You are an expert narrative analyst and memory-engine assistant.
Your task is to take multiple scene summaries (of varying detail and formatting), normalize them, reconstruct the full chronology, identify a self-contained story arc, and output a single memory arc entry in JSON.

The arc must be token-efficient, plot-accurate, and compatible with long-running RP memory systems.

{{TARGET_DIRECTIVE}}

Strict output format (JSON only; no markdown, no prose outside JSON):
{
  "title": "Short descriptive arc title (3-6 words)",
  "opener": "{{memoria_opener}}",
  "content": "Structured arc summary as a single string (see Summary Content Structure below).",
  "keywords": ["keyword1", "keyword2"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

Notes:
- Respect chronology of the source chapters (oldest first).
- If some source chapters do not fit the arc you produce, summarize the arc anyway and ignore the outliers.

PROCESS

STEP 1 - UNIFIED STORY (internal only)
- Combine ALL provided chapter summaries into a single chronological retelling.
- Ignore OOC/meta content.
- Preserve plot-relevant events, character choices, emotional shifts, decisions, consequences, conflicts, promises, boundary negotiations.
- Exclude flavor-only content unless it affects future behavior.
- Normalize to past-tense, third-person.
- Focus on cause → intention → reaction → consequence chains.
- Do NOT output this unified story.

STEP 2 - IDENTIFY THE STORY ARC
- From the unified story, identify the single self-contained arc that represents the most significant narrative movement across these chapters.

STEP 3 - BUILD THE ARC OBJECT

title:
- 3-6 words, descriptive of the arc's core.

content (the entire "Summary Content Structure" below must appear inside this single string; use headings and bullets as plain text):

Summary Content Structure (follow inside the content string):

# [Arc Title]
Time period: What timeframe the arc covers (e.g. "March 3-10", "Week of July 15").

Arc Premise: One sentence describing what this arc is about.

## Major Beats
- 3-7 bullets capturing the major plot movements of this arc
- Focus on cause → effect logic
- Include only plot-affecting events

## Character Dynamics
- 1-2 paragraphs describing how the characters' emotions, motives, boundaries, or relationships changed
- Include subtext, tension shifts, power exchange changes, new trust/vulnerabilities, or new conflicts
- Include silent implications if relevant

## Key Exchanges
- Up to 8 short, exact quotes
- Only include dialogue that materially shifted tone, emotion, or relationship dynamics

## Outcome & Continuity
- 4-8 bullets capturing:
  - decisions
  - promises
  - new emotional states
  - new routines/rituals
  - injuries or physical changes
  - foreshadowed future events
  - unresolved threads
  - permanent consequences

STEP 4 - KEYWORDS
- Provide 15-30 standalone retrieval keywords.

MUST:
- Concrete nouns, physical objects, places, proper nouns, distinctive actions, or memorable scene elements
- Each keyword = ONE concept only
- Each keyword must be retrievable if mentioned ALONE
- Use ONLY nouns or noun-phrases

MUST NOT:
- No narrative/summary keywords ("start of affair", "argument resolved")
- No emotional/abstract words (intimacy, vulnerability, trust, jealousy, dominance, submission, aftercare, connection, longing, etc.)
- No multi-fact keywords ("Denver airport Lyft ride and call")
- No themes or vibes

Examples of valid keywords:
- Four Seasons bar
- Macallan 25
- private elevator
- Aston Martin
- CPAP machine
- Gramercy Tavern
- yuzu soda
- satellite map
- Life360 app
- marble desk
- "pack for forever"
- "dick-measuring contest"

JSON-only:
- Return only the JSON object described above.
- No markdown fences, no commentary, no system prompts, no extra text.`;

// src/prompts/books/volume-default.txt
var volume_default_default = `You are an expert narrative analyst and memory-engine assistant.
Your task is to take multiple story ARC summaries (each already a condensed span of the story), normalize them, reconstruct the full chronology, and output a single consolidated VOLUME entry in JSON.

A volume is the highest compression tier: it replaces all of its source arcs in a long-running RP memory system, so it must preserve everything future scenes may depend on while being far more compact than the arcs combined.

{{TARGET_DIRECTIVE}}

Strict output format (JSON only; no markdown, no prose outside JSON):
{
  "title": "Short descriptive volume title (3-6 words)",
  "opener": "{{memoria_opener}}",
  "content": "Structured volume summary as a single string (see Summary Content Structure below).",
  "keywords": ["keyword1", "keyword2"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

Notes:
- Respect chronology of the source arcs (oldest first).
- Merge overlapping or repeated information across arcs into single beats.
- Prefer whole-story trajectory over scene detail: what changed permanently matters more than how each scene played out.

Summary Content Structure (follow inside the content string; use headings and bullets as plain text):

# [Volume Title]
Time period: What timeframe the volume covers.

Volume Premise: One or two sentences describing the overall movement of the story across these arcs.

## Major Beats
- 5-10 bullets capturing the major plot movements across all arcs
- Focus on cause → effect logic and permanent consequences
- Include only plot-affecting events

## Character Dynamics
- 1-3 paragraphs describing how the characters' motives, emotions, boundaries, and relationships evolved across the volume
- Capture the net change from the start of the first arc to the end of the last

## Key Exchanges
- Up to 8 short, exact quotes that defined the volume
- Only dialogue that materially shifted tone, emotion, or relationship dynamics

## Outcome & Continuity
- 5-10 bullets capturing decisions, promises, emotional states, routines, injuries or physical changes, foreshadowed events, unresolved threads, and permanent consequences

KEYWORDS
- Provide 15-30 standalone retrieval keywords.
- Concrete nouns, physical objects, places, proper nouns, distinctive actions, or memorable elements only.
- Each keyword = ONE concept, retrievable if mentioned alone.
- No narrative keywords, no emotional or abstract words, no multi-fact keywords, no character names.

JSON-only:
- Return only the JSON object described above.
- No markdown fences, no commentary, no extra text.`;

// src/backend/presets.ts
function withTargetDirective(template) {
  return fillPrompt(template, { TARGET_DIRECTIVE: target_directive_default });
}
var BUILTIN_CHAPTER_PRESETS = [
  { key: "summary", displayName: "Summary", prompt: withTargetDirective(chapter_summary_default) },
  { key: "summarize", displayName: "Summarize", prompt: withTargetDirective(chapter_summarize_default) },
  { key: "synopsis", displayName: "Synopsis", prompt: withTargetDirective(chapter_synopsis_default) },
  { key: "minimal", displayName: "Minimal", prompt: withTargetDirective(chapter_minimal_default) }
];
var BUILTIN_ARC_PRESETS = [
  { key: "arc_default", displayName: "Arc", prompt: withTargetDirective(arc_default_default) }
];
var BUILTIN_VOLUME_PRESETS = [
  { key: "volume_default", displayName: "Volume", prompt: withTargetDirective(volume_default_default) }
];
var BUILTIN_CODEX_PRESETS = [
  { key: "codex_default", displayName: "Default", prompt: CODEX_DIRECTIVES_DEFAULT }
];

// src/ui/lessons/fixture.ts
var FIXTURE_CHAT_ID = `${LESSON_CHAT_PREFIX}ashford`;
var FIXTURE_MODEL = "example/tutor-model";
var FIXTURE_CONN = "lesson_conn";
var LINES = [
  "The rain had not let up since the duke's carriage was found empty on the north road.",
  "Elias pressed the silver locket into his palm until the clasp bit skin.",
  '"You were there," Mara said quietly, not looking up from her stitching.',
  "The captain's men went door to door along Wren Street before dawn.",
  "I keep my voice level and ask what the pawnbroker wanted for his silence.",
  "Ashford Manor stood dark except for a single lamp in the study window.",
  '"Bandits," the captain repeated, writing it down like he believed it.',
  "Mara folded the receipt into the hem of her sleeve and said nothing.",
  "The bells rang for the duke at noon, and half the city wore borrowed black.",
  "Elias slept in the loft above the tannery and dreamed of the study door.",
  '"If they find the locket, they find you," she whispered on the bridge.',
  "The ferryman's scar caught the light when he took my coin."
];
function makeMessages(total) {
  const out = [];
  for (let i = 0;i < total; i++) {
    const role = i % 2 === 0 ? "user" : "assistant";
    const approxTokens = role === "user" ? 150 : 640;
    out.push({
      id: `m${i + 1}`,
      role,
      preview: LINES[i % LINES.length],
      charCount: approxTokens * 4,
      approxTokens,
      hidden: false,
      covered: false,
      coveredByEntryId: null,
      indexInChat: i,
      excluded: false
    });
  }
  return out;
}
function msgIds(first, last) {
  const out = [];
  for (let i = first;i <= last; i++)
    out.push(`m${i + 1}`);
  return out;
}
function makeMeta(e) {
  return {
    tier: e.tier,
    chatId: FIXTURE_CHAT_ID,
    msgIds: msgIds(e.first, e.last),
    sourceChapterEntryIds: e.sources,
    firstMsgIdx: e.first,
    lastMsgIdx: e.last,
    tokenCountInput: e.inTokens,
    tokenCountOutput: e.outTokens,
    model: FIXTURE_MODEL,
    connectionId: FIXTURE_CONN,
    createdAt: Date.now() - (100 - e.n) * 3600000,
    title: `${e.title} (msgs ${e.first + 1}-${e.last + 1})`,
    shortComment: e.nyaa,
    presetKey: e.tier === 1 ? "summary" : e.tier === 2 ? "arc_default" : "volume_default",
    sceneNumber: e.n,
    ...e.ghost ? { ghost: true } : {}
  };
}
function makeView(e) {
  const tag = e.tier === 3 ? "Vol" : e.tier === 2 ? "Arc" : "";
  const comment = e.tier === 1 ? `#${e.n} - ${e.title} (msgs ${e.first + 1}-${e.last + 1})` : `${tag} #${e.n} - ${e.title} (msgs ${e.first + 1}-${e.last + 1})`;
  return {
    entryId: e.id,
    bookId: "book_lesson",
    comment,
    content: e.body,
    meta: makeMeta(e),
    active: !e.superseded && !e.ghost,
    contentTokens: e.outTokens,
    contentChars: e.outTokens * 4,
    sourceTokensInput: e.inTokens,
    isRoot: false,
    isGhost: !!e.ghost
  };
}
var CH = [
  {
    id: "c1",
    tier: 1,
    n: 1,
    first: 0,
    last: 17,
    title: "The Duke Falls",
    body: `1st Summary Chapter Containing 18 Prior Turns

Day 3. The Duke of Ashford is found dead in his study. Elias, the duke's valet, flees through the servant stair carrying the silver locket. Mara sees him cross the yard with blood on his cuff and says nothing. The city watch seals the manor by nightfall.`,
    nyaa: "Neatly filed, one nefarious night on the shelf.",
    outTokens: 430,
    inTokens: 7100
  },
  {
    id: "c2",
    tier: 1,
    n: 2,
    first: 18,
    last: 35,
    title: "A Seamstress's Silence",
    body: `2nd Summary Chapter Containing 18 Prior Turns

Day 5. The captain interviews the manor staff. Mara claims she saw bandits on the north road and is dismissed. Elias hides in the tannery loft and pays the pawnbroker to hold the locket. Mara keeps the pawnbroker's receipt sewn into her sleeve.`,
    nyaa: "Secrets stitched into a sleeve, so tidy nya.",
    outTokens: 445,
    inTokens: 7050
  },
  {
    id: "c3",
    tier: 1,
    n: 3,
    first: 36,
    last: 53,
    title: "The Pawnbroker's Receipt",
    body: `3rd Summary Chapter Containing 18 Prior Turns

Day 8. The pawnbroker raises his price for silence. Elias and Mara meet on the bridge and argue about running. The captain announces the bandit theory publicly at the duke's funeral while quietly reopening the staff interviews.`,
    nyaa: "Pricey promises pressed between the pages.",
    outTokens: 460,
    inTokens: 6900
  },
  {
    id: "c4",
    tier: 1,
    n: 4,
    first: 54,
    last: 71,
    title: "The Captain Asks Questions",
    body: `4th Summary Chapter Containing 18 Prior Turns

Day 11. The captain searches the tannery district on a tip. Elias escapes over the rooftops but drops a glove with the manor's crest. Mara burns her bloodied stitching and tells the captain she is leaving the city to mourn.`,
    nyaa: "Curious captains collect such clumsy clues.",
    outTokens: 420,
    inTokens: 7200
  },
  {
    id: "c5",
    tier: 1,
    n: 5,
    first: 72,
    last: 89,
    title: "Locket at the Bridge",
    body: `5th Summary Chapter Containing 18 Prior Turns

Day 14. The pawnbroker sells the locket's description to the captain. Elias buys it back with the last of his wages minutes before the watch arrives. On the bridge, Mara tells Elias she saw everything on day 3, and that she has kept the receipt as leverage of her own.`,
    nyaa: "Bridges bear the best and boldest bargains.",
    outTokens: 455,
    inTokens: 6850
  },
  {
    id: "g1",
    tier: 1,
    n: 6,
    first: 90,
    last: 107,
    ghost: true,
    title: "Rooftop Confessions",
    body: `6th Summary Chapter Containing 18 Prior Turns

Day 16. Elias admits the killing was not planned: the duke caught him returning the locket Mara's mother once pawned. The pair agree to frame the ferryman, then abandon the plan when Mara recognizes his scar.`,
    nyaa: "Ghostly gossip glides in before the glue dries.",
    outTokens: 440,
    inTokens: 7000
  }
];
var ARC1 = {
  id: "a1",
  tier: 2,
  n: 1,
  first: 0,
  last: 53,
  title: "The Murder at Ashford Manor",
  body: `1st Summary ARC Containing 3 Prior Chapters and 54 Prior Turns

Days 3-8. The duke dies, Elias flees with the silver locket, and Mara chooses silence over safety. The captain publicly blames bandits while privately doubting the staff. The pawnbroker becomes the hinge every secret turns on.`,
  nyaa: "An arc of alibis, bound and beautifully shelved.",
  sources: ["c1", "c2", "c3"],
  outTokens: 820,
  inTokens: 1335
};
function codexFixtureFiles() {
  const files = {
    characters: {
      entities: [
        {
          id: "char:elias",
          name: "Elias",
          kind: "human",
          role: "the duke's former valet, fugitive",
          description: "hiding in the tannery loft",
          traits: ["careful", "sentimental", "quick over rooftops"],
          goals: ["keep the locket", "keep Mara out of it"],
          significance: "killed the duke on day 3"
        },
        {
          id: "char:mara",
          name: "Mara",
          kind: "human",
          role: "seamstress at Ashford Manor",
          description: "publicly mourning, privately bargaining",
          traits: ["observant", "steady"],
          goals: ["leverage over Elias", "leave the city"]
        },
        {
          id: "char:captain",
          name: "The Captain",
          kind: "human",
          role: "leads the city watch",
          description: "publicly backs the bandit theory",
          goals: ["reopen the staff interviews quietly"]
        }
      ]
    },
    locations: {
      entities: [
        { id: "loc:ashford_manor", name: "Ashford Manor", kind: "estate", description: "the duke's seat, sealed by the watch, dark except the study lamp" },
        { id: "loc:the_bridge", name: "The Bridge", kind: "landmark", significance: "where Elias and Mara trade truths" }
      ]
    },
    things: {
      entities: [
        { id: "thing:silver_locket", name: "The Silver Locket", kind: "heirloom", description: "back in Elias's coat", significance: "ties Elias to the study on day 3" }
      ]
    },
    relations: {
      relations: [
        { type: "pair", a: "char:elias", b: "char:mara", kind: "bond", state: "trusts her with his life, not his reasons", history: ["day 3: she saw him flee", "day 14: she revealed she kept the receipt"] },
        { type: "pair", a: "char:elias", b: "thing:silver_locket", kind: "owns", state: "carries it everywhere, bought it back twice" },
        { type: "pair", a: "char:captain", b: "char:mara", kind: "suspects", state: "doubts her bandit story, lacks proof" },
        { type: "group", kind: "pact", members: ["char:elias", "char:mara"], state: "silence about the murder, uneasy since the bridge" }
      ]
    },
    timeline: {
      events: [
        { when: "day 3", event: "The Duke of Ashford is killed in his study", participants: ["char:elias"], where: "loc:ashford_manor", causes: "Elias flees with the locket" },
        { when: "day 5", event: "Mara tells the captain she saw bandits", participants: ["char:mara", "char:captain"] },
        { when: "day 8", event: "The pawnbroker raises his price for silence", causes: "Elias runs out of money" },
        { when: "day 11", event: "Elias escapes the tannery search, drops a crested glove", participants: ["char:elias", "char:captain"] },
        { when: "day 14", event: "Mara reveals she kept the pawnbroker's receipt", participants: ["char:mara", "char:elias"], where: "loc:the_bridge" }
      ]
    },
    threads: {
      threads: [
        { name: "The duke's murder", status: "open", summary: "The captain's bandit theory is public cover while he reworks the staff interviews.", latest: "a crested glove is in the watch's evidence box", planted: ["the pawnbroker kept a receipt"] },
        { name: "Leaving the city", status: "stalled", summary: "Mara wants out before the interviews resume, Elias will not leave the locket." }
      ],
      seeds: ["unexplained scar on the ferryman's hand"]
    },
    world: {
      entries: [
        { topic: "The City Watch", facts: ["answers to the magistrate, not the crown", "funeral custom bars arrests during mourning bells"] },
        { topic: "Mourning customs", facts: ["half-black worn for a week by anyone the deceased employed"] }
      ]
    },
    knowledge: {
      items: [
        {
          fact: "Elias killed the duke",
          knownBy: ["char:mara"],
          hiddenFrom: ["char:captain"],
          falseBeliefs: [{ who: "char:captain", believes: "bandits did it" }]
        },
        {
          fact: "Mara keeps the pawnbroker's receipt sewn in her sleeve",
          knownBy: ["char:mara"],
          hiddenFrom: ["char:elias", "char:captain"],
          note: "her leverage if Elias runs alone"
        }
      ]
    }
  };
  const out = {};
  for (const [k, v] of Object.entries(files))
    out[k] = JSON.stringify(v, null, 2);
  return out;
}
var CODEX_FILE_TOKENS = {
  characters: 240,
  locations: 80,
  things: 60,
  relations: 170,
  timeline: 160,
  threads: 120,
  world: 70,
  knowledge: 110
};
function coverageFor(stubs, profileLag, profileWindow) {
  let covered = 0;
  let uncoveredTokens = 0;
  for (const m2 of stubs) {
    if (m2.covered)
      covered++;
    else
      uncoveredTokens += m2.approxTokens;
  }
  const uncovered = stubs.length - covered;
  return {
    totalMessages: stubs.length,
    coveredMessages: covered,
    uncoveredMessages: uncovered,
    approxUncoveredTokens: uncoveredTokens,
    lagSatisfied: uncovered >= profileLag,
    windowAvailable: uncovered - profileLag >= profileWindow
  };
}
function applyCoverage(stubs, entries, hide) {
  for (const e of entries) {
    if (e.isGhost || !e.active)
      continue;
    for (const id of e.meta.msgIds) {
      const idx = Number(id.slice(1)) - 1;
      const m2 = stubs[idx];
      if (!m2)
        continue;
      m2.covered = true;
      m2.coveredByEntryId = e.entryId;
      m2.hidden = hide;
    }
  }
}
function booksLessons() {
  return {
    version: 1,
    freshInstall: false,
    booksSealSkipped: false,
    codexSealSkipped: false,
    books: { ...emptyLessonCourse(), status: "in_progress" },
    codex: emptyLessonCourse()
  };
}
var VARIANTS = {
  filing: { total: 160, chapters: [CH[0], CH[1]] },
  "filing-after": { total: 160, chapters: [CH[0], CH[1], CH[2]] },
  pills: { total: 124, chapters: [CH[0], CH[1], CH[2]] },
  desk: { total: 165, chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]], arcs: [ARC1], ghost: true, busy: true, failure: true },
  shelf: { total: 165, chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]], arcs: [ARC1], ghost: true },
  compose: { total: 140, chapters: [CH[0], CH[1]], excluded: [100, 101, 102] },
  continuity: { total: 140, chapters: [CH[0], CH[1]], roots: true },
  tuning: { total: 140, chapters: [CH[0], CH[1]] },
  codex: { total: 165, chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]], arcs: [ARC1], codex: true },
  "codex-noinject": {
    total: 165,
    chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]],
    arcs: [ARC1],
    codex: true,
    codexFileStates: { relations: "noInject" }
  },
  "codex-stale": {
    total: 165,
    chapters: [CH[0], CH[1], CH[2], CH[3], CH[4]],
    arcs: [ARC1],
    codex: true,
    codexFileStates: { relations: "frozen" },
    codexStale: ["relations"]
  }
};
var FIXTURE_VARIANTS = Object.keys(VARIANTS);
function buildFixture(variant) {
  const spec = VARIANTS[variant] ?? VARIANTS["filing"];
  const profile = makeDefaultProfile("default", "Default");
  profile.codexEnabled = !!spec.codex;
  const stubs = makeMessages(spec.total);
  for (const idx of spec.excluded ?? []) {
    const m2 = stubs[idx];
    if (m2)
      m2.excluded = true;
  }
  const superseded = new Set((spec.arcs ?? []).flatMap((a2) => a2.sources ?? []));
  const chapters = spec.chapters.map((c2) => makeView({ ...c2, superseded: superseded.has(c2.id) }));
  if (spec.ghost)
    chapters.push(makeView(CH[5]));
  const arcs = (spec.arcs ?? []).map((a2) => makeView(a2));
  for (const a2 of arcs)
    a2.sourceChapterEntryIds = (spec.arcs ?? []).find((s) => s.id === a2.entryId)?.sources ?? [];
  applyCoverage(stubs, [...arcs, ...chapters], profile.hideCoveredMessages);
  const coverage = coverageFor(stubs, profile.lagValue, profile.windowValue);
  const headroom = Math.max(0, coverage.uncoveredMessages - profile.lagValue);
  const lessons = spec.codex ? unlockedLessons() : booksLessons();
  return {
    activeChatId: FIXTURE_CHAT_ID,
    activeChatName: "The Ashford Case",
    activeCharacterId: "lesson_char",
    activeCharacterName: "Elias",
    settings: { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: "default" },
    activeProfile: profile,
    chapters,
    arcs,
    volumes: [],
    bookId: "book_lesson",
    bookName: "LumiBooks - The Ashford Case",
    connections: [
      { id: FIXTURE_CONN, name: "Storyteller", provider: "example", model: FIXTURE_MODEL, isDefault: true, hasApiKey: true }
    ],
    resolvedSidecarConnectionId: FIXTURE_CONN,
    coverage,
    busy: spec.busy ? [{ kind: "chapter", chatId: FIXTURE_CHAT_ID, label: "Memoria is writing a chapter (~1.3kt written, ~0.8kt thought, 24s)", startedAt: Date.now() - 24000 }] : [],
    lastFailure: spec.failure ? { kind: "chapter", message: "No token within 60s, the provider may be slow or unreachable", retriedTimes: 4, at: Date.now() - 90000 } : null,
    messages: stubs,
    chapterPresets: BUILTIN_CHAPTER_PRESETS,
    arcPresets: BUILTIN_ARC_PRESETS,
    volumePresets: BUILTIN_VOLUME_PRESETS,
    codexPresets: BUILTIN_CODEX_PRESETS,
    customPresets: [],
    regexScripts: [],
    pendingPreviews: [],
    backlogChapters: Math.floor(headroom / Math.max(1, profile.windowValue)),
    backlogArcs: 0,
    rootOrigin: null,
    rootOriginName: null,
    rootEntryCount: 0,
    availableRoots: spec.roots ? [{ chatId: `${LESSON_CHAT_PREFIX}vol1`, chatName: "The Ashford Case, Vol. 1", entryCount: 5 }] : [],
    codexExists: !!spec.codex,
    codexBacklog: spec.codex ? 4 : 0,
    codexBacklogPasses: spec.codex ? 1 : 0,
    codexLastRunAt: spec.codex ? Date.now() - 11 * 60000 : null,
    codexInjectedTokens: spec.codex ? 940 : 0,
    codexFileStates: spec.codexFileStates ?? {},
    codexStaleFiles: spec.codexStale ?? [],
    codexRefreshPending: [],
    codexFileTokens: spec.codex ? { ...CODEX_FILE_TOKENS } : {},
    codexRevision: 0,
    lessons
  };
}
function applyFiledChapter(state) {
  if (state.chapters.some((c2) => c2.entryId === "c3"))
    return;
  const spec = CH[2];
  const view = makeView(spec);
  state.chapters.push(view);
  applyCoverage(state.messages, [view], state.activeProfile.hideCoveredMessages);
  const cov = coverageFor(state.messages, state.activeProfile.lagValue, state.activeProfile.windowValue);
  state.coverage = cov;
  const headroom = Math.max(0, cov.uncoveredMessages - state.activeProfile.lagValue);
  state.backlogChapters = Math.floor(headroom / Math.max(1, state.activeProfile.windowValue));
}

// src/ui/tab-meta.ts
var APP_TABS = [
  {
    key: "home",
    label: "Home",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v3"/><path d="M5.6 6.6l2.1 2.1"/><path d="M18.4 6.6l-2.1 2.1"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M3 19h18"/></svg>`
  },
  {
    key: "books",
    label: "Books",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>`
  },
  {
    key: "codex",
    label: "Codex",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 10-10 10L2 12z"/><path d="M12 7.5l4.5 4.5-4.5 4.5L7.5 12z"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>`
  },
  {
    key: "tuning",
    label: "Tuning",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6"/><path d="M6 14v6"/><path d="M12 4v2"/><path d="M12 10v10"/><path d="M18 4v8"/><path d="M18 16v4"/><path d="M4 10h4"/><path d="M10 6h4"/><path d="M16 12h4"/></svg>`
  },
  {
    key: "stuff",
    label: "Stuff",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l0.9 2.1L22 19l-2.1 0.9L19 22l-0.9-2.1L16 19l2.1-0.9z"/></svg>`
  }
];

// src/ui/lessons/diploma.ts
var GRADE_REMARK = {
  gilded: "Not a page out of place. My favorite reader, nyaa.",
  silver: "Nearly flawless filing. The shelf approves.",
  bronze: "A solid apprenticeship. The stacks will teach the rest.",
  apprentice: "The library forgives. Retake a section whenever you like."
};
function renderRegister(host, defaultName, onSign) {
  host.replaceChildren();
  const card = document.createElement("div");
  card.className = "lmb-register";
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = "Sign the register";
  const hint = document.createElement("div");
  hint.className = "lmb-seal-pitch";
  hint.textContent = "The name goes on your diploma.";
  const input = textInput({ value: defaultName, placeholder: "Reader", autoFocus: true });
  input.maxLength = 40;
  const row = document.createElement("div");
  row.className = "lmb-seal-actions";
  const sign = makeButton("Sign", () => onSign(input.value.trim() || "Reader"), { primary: true });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
      sign.click();
  });
  row.appendChild(sign);
  card.append(title, hint, input, row);
  host.appendChild(card);
}
function renderDiploma(host, data, actions) {
  host.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "lmb-diploma";
  const frame2 = document.createElement("div");
  frame2.className = "lmb-diploma-frame";
  const arch = document.createElement("div");
  arch.className = "lmb-diploma-arch";
  arch.textContent = "LUMIBOOKS ACADEMY";
  const course = document.createElement("div");
  course.className = "lmb-diploma-course";
  course.textContent = data.courseTitle;
  const grant = document.createElement("div");
  grant.className = "lmb-diploma-grant";
  grant.textContent = "certifies that";
  const name = document.createElement("div");
  name.className = "lmb-diploma-name";
  name.textContent = data.name;
  const line = document.createElement("div");
  line.className = "lmb-diploma-line";
  line.textContent = "has read the stacks and understood them";
  const stamp = document.createElement("div");
  stamp.className = `lmb-diploma-stamp lmb-grade-${data.grade}`;
  stamp.textContent = LESSON_GRADE_LABEL[data.grade];
  const score = document.createElement("div");
  score.className = "lmb-diploma-score";
  const gold = data.total - data.wrong;
  score.textContent = `${gold} of ${data.total} gold stamps · ${new Date(data.completedAt).toLocaleDateString()}`;
  const sealRow = document.createElement("div");
  sealRow.className = "lmb-diploma-seal";
  sealRow.appendChild(memoriaSprite(48));
  const remark = document.createElement("div");
  remark.className = "lmb-diploma-remark";
  remark.textContent = GRADE_REMARK[data.grade];
  sealRow.appendChild(remark);
  frame2.append(arch, course, grant, name, line, stamp, score, sealRow);
  wrap.appendChild(frame2);
  const btnRow = document.createElement("div");
  btnRow.className = "lmb-seal-actions";
  btnRow.appendChild(makeButton("Save as image", () => void downloadDiploma(data), { small: true }));
  for (const a2 of actions) {
    btnRow.appendChild(makeButton(a2.label, a2.onClick, { small: true, primary: a2.primary }));
  }
  wrap.appendChild(btnRow);
  host.appendChild(wrap);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    wrap.appendChild(makeConfetti());
  }
}
function makeConfetti() {
  const layer = document.createElement("div");
  layer.className = "lmb-confetti";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0;i < 36; i++) {
    const d = document.createElement("span");
    d.textContent = "◆";
    d.style.left = `${i * 137 % 100}%`;
    d.style.animationDelay = `${i % 12 * 90}ms`;
    d.style.fontSize = `${8 + i % 4 * 3}px`;
    layer.appendChild(d);
  }
  setTimeout(() => layer.remove(), 3200);
  return layer;
}
async function downloadDiploma(data) {
  const W = 900;
  const H = 640;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const g = canvas.getContext("2d");
  if (!g)
    return;
  g.scale(dpr, dpr);
  try {
    await Promise.all([
      document.fonts.load('20px "Marcellus"'),
      document.fonts.load('42px "Marcellus"')
    ]);
  } catch {}
  const display = (px) => `${px}px "Marcellus", "Palatino Linotype", Georgia, serif`;
  g.fillStyle = "#181422";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(201, 168, 106, 0.9)";
  g.lineWidth = 3;
  g.strokeRect(24, 24, W - 48, H - 48);
  g.lineWidth = 1;
  g.strokeStyle = "rgba(201, 168, 106, 0.5)";
  g.strokeRect(34, 34, W - 68, H - 68);
  for (const [x3, y3] of [[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]]) {
    g.save();
    g.translate(x3, y3);
    g.rotate(Math.PI / 4);
    g.fillStyle = "rgba(201, 168, 106, 0.9)";
    g.fillRect(-5, -5, 10, 10);
    g.restore();
  }
  g.textAlign = "center";
  g.fillStyle = "#c9a86a";
  g.font = display(24);
  g.fillText("L U M I B O O K S   A C A D E M Y", W / 2, 96);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.font = display(20);
  g.fillText(data.courseTitle, W / 2, 140);
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.font = "15px Georgia, serif";
  g.fillText("certifies that", W / 2, 190);
  g.fillStyle = "#e8ddc0";
  g.font = display(44);
  g.fillText(data.name, W / 2, 246);
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.font = "15px Georgia, serif";
  g.fillText("has read the stacks and understood them", W / 2, 284);
  const gold = data.total - data.wrong;
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.font = "14px Georgia, serif";
  g.fillText(`${gold} of ${data.total} gold stamps · ${new Date(data.completedAt).toLocaleDateString()}`, W / 2, 330);
  g.save();
  g.translate(W / 2 + 250, 420);
  g.rotate(-0.14);
  g.strokeStyle = "#c9a86a";
  g.lineWidth = 3;
  g.strokeRect(-90, -34, 180, 68);
  g.fillStyle = "#c9a86a";
  g.font = display(30);
  g.fillText(LESSON_GRADE_LABEL[data.grade].toUpperCase(), 0, 10);
  g.restore();
  await new Promise((resolve) => {
    const img = new Image;
    img.onload = () => {
      g.save();
      g.beginPath();
      g.arc(W / 2 - 220, 430, 56, 0, Math.PI * 2);
      g.clip();
      g.drawImage(img, W / 2 - 276, 374, 112, 112);
      g.restore();
      g.strokeStyle = "rgba(201, 168, 106, 0.8)";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(W / 2 - 220, 430, 57, 0, Math.PI * 2);
      g.stroke();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = MEMORIA_AVATAR;
  });
  g.textAlign = "center";
  g.fillStyle = "rgba(255,255,255,0.6)";
  g.font = "italic 14px Georgia, serif";
  g.fillText(GRADE_REMARK[data.grade], W / 2, 560);
  g.fillStyle = "rgba(201, 168, 106, 0.8)";
  g.font = display(13);
  g.fillText("— Memoria, Librarian", W / 2, 588);
  const a2 = document.createElement("a");
  a2.download = `lumibooks-diploma-${data.courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  a2.href = canvas.toDataURL("image/png");
  a2.click();
}

// src/ui/lessons/diagrams.ts
function renderDiagram(host, kind) {
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
function el(cls, text) {
  const d = document.createElement("div");
  d.className = cls;
  if (text !== undefined)
    d.textContent = text;
  return d;
}
function bar(kind, width, label) {
  const b = el(`lmb-dg-bar ${kind}`);
  b.style.width = `${width}%`;
  if (label) {
    const tag = el("lmb-dg-tag", label);
    b.appendChild(tag);
  }
  return b;
}
function loop(anchor, phases, total) {
  let timers = [];
  const cycle = () => {
    if (!anchor.isConnected) {
      for (const t of timers)
        clearTimeout(t);
      return;
    }
    timers = phases.map((p) => setTimeout(() => {
      if (anchor.isConnected)
        p.run();
    }, p.at));
    timers.push(setTimeout(cycle, total));
  };
  cycle();
}
var MSG_WIDTHS = [46, 72, 38, 66, 52, 74, 42, 68, 56, 70, 44, 64];
function diagramRot(wrap) {
  wrap.appendChild(el("lmb-dg-label", "the context window"));
  const win = el("lmb-dg-window");
  const col = el("lmb-dg-col bottom");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", "new turns push in, the oldest get clipped out");
  wrap.appendChild(caption);
  const MAX = 9;
  let n = 0;
  for (let i = 0;i < MAX - 2; i++)
    col.appendChild(bar("msg", MSG_WIDTHS[n++ % MSG_WIDTHS.length]));
  const timer2 = setInterval(() => {
    if (!col.isConnected) {
      clearInterval(timer2);
      return;
    }
    const fresh = bar("msg", MSG_WIDTHS[n++ % MSG_WIDTHS.length]);
    fresh.classList.add("in");
    col.appendChild(fresh);
    requestAnimationFrame(() => fresh.classList.remove("in"));
    while (col.childElementCount > MAX) {
      const oldest = col.firstElementChild;
      if (!oldest)
        break;
      if (oldest.classList.contains("clipped")) {
        oldest.remove();
      } else {
        oldest.classList.add("clipped");
        break;
      }
    }
  }, 1000);
}
function paintFold(col, caption, state) {
  col.replaceChildren();
  for (const [i, r] of state.rows.entries()) {
    const b = bar(r.kind, r.kind === "msg" ? MSG_WIDTHS[i % MSG_WIDTHS.length] : r.kind === "chapter" ? 82 : 90, r.label);
    b.classList.add("in");
    col.appendChild(b);
    requestAnimationFrame(() => b.classList.remove("in"));
  }
  caption.textContent = state.caption;
}
function diagramFold(wrap) {
  wrap.appendChild(el("lmb-dg-label", "your chat history"));
  const win = el("lmb-dg-window tall");
  const col = el("lmb-dg-col");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", "");
  wrap.appendChild(caption);
  const msgs = (k) => Array.from({ length: k }, () => ({ kind: "msg" }));
  const states = [
    { rows: [...msgs(9)], caption: "old messages pile up…" },
    { rows: [{ kind: "chapter", label: "CH 1" }, ...msgs(6)], caption: "…the oldest fold into a chapter, in place…" },
    { rows: [{ kind: "chapter", label: "CH 1" }, { kind: "chapter", label: "CH 2" }, ...msgs(3)], caption: "…then the next window folds…" },
    { rows: [{ kind: "arc", label: "ARC 1" }, ...msgs(3)], caption: "…and chapters bind into a single arc." }
  ];
  paintFold(col, caption, states[0]);
  loop(wrap, [
    { at: 2000, run: () => paintFold(col, caption, states[1]) },
    { at: 4000, run: () => paintFold(col, caption, states[2]) },
    { at: 6000, run: () => paintFold(col, caption, states[3]) },
    { at: 8500, run: () => paintFold(col, caption, states[0]) }
  ], 10500);
}
function diagramUnfold(wrap) {
  wrap.appendChild(el("lmb-dg-label", "the shelf"));
  const win = el("lmb-dg-window");
  const col = el("lmb-dg-col");
  win.appendChild(col);
  wrap.appendChild(win);
  const caption = el("lmb-dg-caption", "");
  wrap.appendChild(caption);
  const filed = {
    rows: [{ kind: "chapter", label: "CH 3" }],
    caption: "a chapter covers messages 37-54, they ride hidden"
  };
  const deleted = {
    rows: [{ kind: "msg" }, { kind: "msg" }, { kind: "msg" }, { kind: "msg" }],
    caption: "delete it and the messages come right back"
  };
  paintFold(col, caption, filed);
  loop(wrap, [
    { at: 2400, run: () => paintFold(col, caption, deleted) },
    { at: 5400, run: () => paintFold(col, caption, filed) }
  ], 7800);
}
var FADE_CHIPS = [
  "Elias → Mara: loves her, hides it",
  "captain wrongly believes: bandits",
  "day 12: she saw the fall",
  "open thread: the receipt"
];
function diagramFade(wrap) {
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
  const chipEls = FADE_CHIPS.map((c2) => {
    const chip = el("lmb-dg-chip", `◆ ${c2}`);
    chips.appendChild(chip);
    return chip;
  });
  wrap.appendChild(chips);
  const caption = el("lmb-dg-caption", "the plot survives, the structured facts thin out");
  wrap.appendChild(caption);
  const reset = () => {
    tier.textContent = "chapter";
    tier.classList.remove("hot");
    chips.classList.remove("kept");
    for (const c2 of chipEls)
      c2.classList.remove("gone");
    caption.textContent = "the plot survives, the structured facts thin out";
  };
  loop(wrap, [
    { at: 1800, run: () => {
      tier.textContent = "arc";
      chipEls[0].classList.add("gone");
    } },
    { at: 3400, run: () => {
      chipEls[2].classList.add("gone");
    } },
    { at: 5000, run: () => {
      tier.textContent = "volume";
      chipEls[1].classList.add("gone");
      chipEls[3].classList.add("gone");
    } },
    {
      at: 6600,
      run: () => {
        tier.textContent = "with a codex";
        tier.classList.add("hot");
        chips.classList.add("kept");
        for (const c2 of chipEls)
          c2.classList.remove("gone");
        caption.textContent = "the codex tracks them explicitly, outside the summaries";
      }
    },
    { at: 9600, run: reset }
  ], 10400);
}

// src/ui/lessons/engine.ts
var EXAM_SIZE = 10;
var EXAM_PASS_MAX_WRONG = 1;
function createLessonEngine(deps) {
  let active = null;
  let host = null;
  let stage = null;
  let demoWrap = null;
  let demoStrip = null;
  let demoInner = null;
  let overlay = [];
  let ring = null;
  let spotTag = null;
  let sheetBody = null;
  let railEl = null;
  let headLabel = null;
  let resizeObs = null;
  let paneObs = null;
  let patchTimer = null;
  let anchorRaf = 0;
  let lastSpotAnchor = null;
  function courseDef(key) {
    return key === "books" ? COURSE_BOOKS : COURSE_CODEX;
  }
  function currentStep() {
    if (!active)
      return null;
    if (active.mode === "exam" && active.phase === "steps") {
      return active.examSet[active.examIdx] ?? null;
    }
    if (active.phase === "steps")
      return active.main[active.sIdx]?.steps[active.tIdx] ?? null;
    if (active.phase === "finale")
      return active.finale?.steps[active.fIdx] ?? null;
    return null;
  }
  function schedulePatch() {
    if (!active || active.viewOnly || active.mode === "exam" || active.phase !== "steps")
      return;
    if (patchTimer)
      clearTimeout(patchTimer);
    patchTimer = setTimeout(flushPatch, 400);
  }
  function flushPatch() {
    if (patchTimer) {
      clearTimeout(patchTimer);
      patchTimer = null;
    }
    if (!active || active.viewOnly || active.mode === "exam" || active.phase !== "steps")
      return;
    const saved = deps.getState()?.lessons?.[active.key];
    const patch = {
      ...saved?.status === "done" ? {} : { status: "in_progress" },
      section: active.sIdx,
      step: active.tIdx,
      answers: { ...active.answers },
      startedAt: saved?.startedAt ?? Date.now()
    };
    deps.send({ type: "lesson_patch", course: active.key, patch });
    deps.applyLessons(active.key, patch);
  }
  function deepestPresent(path) {
    for (let i = path.length - 1;i >= 0; i--) {
      const a2 = path[i];
      if (demoWrap?.querySelector(`[data-lesson="${a2}"]`))
        return a2;
    }
    return path[0];
  }
  function anchorFor(step) {
    if (!step)
      return;
    if (step.kind === "nav") {
      if (active?.doPhase === "done")
        return;
      return deepestPresent(step.path);
    }
    if (step.kind === "do") {
      if (active?.doPhase === "done")
        return step.doneAnchor ?? step.anchor;
      if (step.path)
        return deepestPresent(step.path) ?? step.anchor;
      return step.anchor;
    }
    return step.anchor;
  }
  function navArrived(step) {
    return !!demoWrap?.querySelector(`[data-lesson="${step.arrive}"]`);
  }
  function checkNavArrival(step, fromClick) {
    if (!active || active.doPhase !== "idle")
      return;
    if (!navArrived(step))
      return;
    active.doPhase = "done";
    demoWrap?.classList.remove("lmb-demo-funnel");
    hideSpotlight();
    renderSheet(step);
    if (fromClick) {
      setTimeout(() => {
        if (active && currentStep() === step)
          advance();
      }, 350);
    }
  }
  function shuffled(q) {
    let seed = 0;
    for (let i = 0;i < q.id.length; i++)
      seed = seed * 31 + q.id.charCodeAt(i) >>> 0;
    const arr = q.options.map((o) => ({ text: o.text, correct: !!o.correct }));
    for (let i = arr.length - 1;i > 0; i--) {
      seed = seed * 1103515245 + 12345 >>> 0;
      const j = seed % (i + 1);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }
  function isActive() {
    return active !== null;
  }
  function start(courseKey, opts) {
    const course = courseDef(courseKey);
    const main = course.sections.filter((s) => s.id !== "finale");
    const finale = course.sections.find((s) => s.id === "finale") ?? null;
    const saved = deps.getState()?.lessons?.[courseKey];
    const base = {
      key: courseKey,
      course,
      mode: opts?.mode === "exam" ? "exam" : "lesson",
      main,
      finale,
      sIdx: 0,
      tIdx: 0,
      fIdx: 0,
      phase: "steps",
      answers: { ...saved?.answers ?? {} },
      fixture: null,
      fixtureStep: null,
      codexFiles: codexFixtureFiles(),
      doPhase: "idle",
      prepFor: null,
      demoTab: null,
      navTab: null,
      examSet: [],
      examIdx: 0,
      signedName: saved?.signedName ?? null,
      wrong: saved?.lastWrong ?? 0,
      grade: saved?.grade ?? "apprentice",
      total: scoredQuestions(course).length,
      completedAt: saved?.completedAt ?? Date.now(),
      viewOnly: false
    };
    if (opts?.mode === "diploma") {
      base.viewOnly = true;
      base.phase = "diploma";
    } else if (opts?.mode === "exam") {
      const pool = scoredQuestions(course);
      const picked = [];
      const used = new Set;
      while (picked.length < Math.min(EXAM_SIZE, pool.length)) {
        const i = Math.floor(Math.random() * pool.length);
        if (used.has(i))
          continue;
        used.add(i);
        picked.push(pool[i]);
      }
      base.examSet = picked;
      base.answers = {};
    } else {
      if (opts?.fresh)
        base.answers = {};
      if (typeof opts?.section === "number") {
        base.sIdx = Math.min(Math.max(0, opts.section), main.length - 1);
        for (const id of allQuestionIds(course, base.sIdx))
          delete base.answers[id];
      } else if (saved?.status === "in_progress") {
        if (saved.section >= main.length) {
          base.phase = "register";
        } else {
          base.sIdx = saved.section;
          base.tIdx = Math.min(saved.step, (main[saved.section]?.steps.length ?? 1) - 1);
        }
      }
    }
    active = base;
    schedulePatch();
    deps.onModeChange();
  }
  function exit() {
    flushPatch();
    if (patchTimer)
      clearTimeout(patchTimer);
    resizeObs?.disconnect();
    resizeObs = null;
    paneObs?.disconnect();
    paneObs = null;
    active = null;
    stage = null;
    demoWrap = null;
    demoStrip = null;
    demoInner = null;
    sheetBody = null;
    railEl = null;
    headLabel = null;
    overlay = [];
    ring = null;
    resetHomeTabLocal();
    resetBooksTabLocal();
    resetCodexTabLocal();
    resetTuningTabLocal();
    setSamplerView("main");
    setPromptsCategory("chapter");
    deps.onModeChange();
  }
  function mount(target) {
    if (!active)
      return;
    if (stage && stage.isConnected && host === target)
      return;
    host = target;
    buildStage();
    renderStep();
  }
  function onHostState() {
    if (!active || !stage)
      return;
    const step = currentStep();
    if (step && step.real) {
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
      if (step.kind === "nav")
        checkNavArrival(step, true);
    }
  }
  function buildStage() {
    if (!host || !active)
      return;
    host.replaceChildren();
    stage = document.createElement("div");
    stage.className = "lmb-lesson-stage";
    stage.setAttribute("role", "dialog");
    stage.setAttribute("aria-label", active.course.title);
    const head = document.createElement("div");
    head.className = "lmb-lesson-head";
    const title = document.createElement("span");
    title.className = "lmb-lesson-title";
    title.textContent = active.mode === "exam" ? `${active.course.title} · Exam` : active.course.title;
    headLabel = document.createElement("span");
    headLabel.className = "lmb-lesson-headlabel";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "lmb-lesson-close";
    close.textContent = "✕";
    close.title = active.mode === "exam" ? "Leave the exam, an unfinished exam is not saved" : deps.getState()?.lessons?.[active.key]?.status === "done" ? "Leave anytime, your diploma and previous grade stand" : "Leave the lesson, progress is saved";
    close.setAttribute("aria-label", "Leave the lesson");
    close.addEventListener("click", exit);
    head.append(title, headLabel, close);
    railEl = document.createElement("div");
    railEl.className = "lmb-lesson-rail";
    demoWrap = document.createElement("div");
    demoWrap.className = "lmb-lesson-demo";
    demoStrip = document.createElement("div");
    demoStrip.className = "lmb-lesson-demostrip";
    demoStrip.style.display = "none";
    demoWrap.appendChild(demoStrip);
    demoInner = document.createElement("div");
    demoInner.className = "lmb-lesson-demo-inner";
    demoWrap.appendChild(demoInner);
    for (let i = 0;i < 4; i++) {
      const p = document.createElement("div");
      p.className = "lmb-spot-panel";
      p.style.display = "none";
      demoWrap.appendChild(p);
      overlay.push(p);
    }
    ring = document.createElement("div");
    ring.className = "lmb-spot-ring";
    ring.style.display = "none";
    demoWrap.appendChild(ring);
    spotTag = document.createElement("div");
    spotTag.className = "lmb-spot-tag";
    spotTag.style.display = "none";
    demoWrap.appendChild(spotTag);
    demoWrap.addEventListener("click", () => {
      const step = currentStep();
      if (!active || !step || step.kind !== "nav" || active.doPhase !== "idle")
        return;
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!active || currentStep() !== step)
            return;
          scheduleAnchor(anchorFor(step), false);
          checkNavArrival(step, true);
        }, 40);
      });
    });
    const sheet = document.createElement("div");
    sheet.className = "lmb-lesson-sheet";
    const grab = document.createElement("button");
    grab.type = "button";
    grab.className = "lmb-lesson-grab";
    grab.setAttribute("aria-label", "Collapse the dialogue");
    grab.addEventListener("click", () => sheet.classList.toggle("collapsed"));
    sheetBody = document.createElement("div");
    sheetBody.className = "lmb-lesson-sheet-body";
    sheet.append(grab, sheetBody);
    stage.append(head, railEl, demoWrap, sheet);
    host.appendChild(stage);
    resizeObs?.disconnect();
    resizeObs = new ResizeObserver(() => scheduleAnchor(anchorFor(currentStep()), false));
    resizeObs.observe(demoWrap);
    demoInner.addEventListener("scroll", () => scheduleAnchor(anchorFor(currentStep()), false), { passive: true });
  }
  function renderRail() {
    if (!railEl || !active)
      return;
    railEl.replaceChildren();
    if (active.mode === "exam") {
      const label = document.createElement("span");
      label.className = "lmb-lesson-headlabel";
      label.textContent = active.phase === "steps" ? `Question ${active.examIdx + 1} of ${active.examSet.length}` : "";
      railEl.appendChild(label);
      return;
    }
    const nodes = active.main.length + (active.finale ? 1 : 0);
    for (let i = 0;i < nodes; i++) {
      const node = document.createElement("span");
      const isFinale = i >= active.main.length;
      const done = active.phase !== "steps" ? isFinale ? active.phase === "diploma" : true : i < active.sIdx;
      const current = active.phase === "steps" ? i === active.sIdx : active.phase === "finale" && isFinale;
      node.className = `lmb-rail-node${done ? " done" : ""}${current ? " current" : ""}`;
      const sec = isFinale ? active.finale : active.main[i];
      node.title = sec.title;
      railEl.appendChild(node);
    }
    if (headLabel) {
      if (active.phase === "steps") {
        const sec = active.main[active.sIdx];
        headLabel.textContent = sec ? `${roman(active.sIdx + 1)} · ${sec.title}` : "";
      } else if (active.phase === "finale") {
        headLabel.textContent = active.finale?.title ?? "";
      } else {
        headLabel.textContent = "";
      }
    }
  }
  function roman(n) {
    const table = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    let v = n;
    for (const [num, sym] of table) {
      while (v >= num) {
        out += sym;
        v -= num;
      }
    }
    return out;
  }
  function fixtureFor(step) {
    if (!active)
      return null;
    if (step.fixture && active.fixtureStep !== step) {
      const s = buildFixture(step.fixture.variant);
      step.fixture.patch?.(s);
      active.fixture = s;
      active.fixtureStep = step;
    }
    return active.fixture;
  }
  function makeSandboxSend(step) {
    return (m2) => {
      if (!active)
        return;
      if (m2.type === "codex_set_file_state") {
        const fx = active.fixture;
        if (fx) {
          const states = { ...fx.codexFileStates };
          if (m2.state === "on")
            delete states[m2.file];
          else
            states[m2.file] = m2.state;
          fx.codexFileStates = states;
          if (m2.state !== "frozen")
            fx.codexStaleFiles = fx.codexStaleFiles.filter((f) => f !== m2.file);
        }
        if (step.kind === "do" && step.expect === "codex_set_file_state" && active.doPhase === "idle") {
          markDoDone(step);
        }
        scheduleDemoRerender(step);
        return;
      }
      if (step.kind === "do" && m2.type === step.expect && active.doPhase === "idle") {
        runDoScript(step, m2);
        return;
      }
      if (m2.type === "codex_read") {
        deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles, 0);
        scheduleDemoRerender(step);
        return;
      }
      if (m2.type === "codex_write_file") {
        active.codexFiles = { ...active.codexFiles, [m2.file]: m2.content };
        deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles, 0, m2.file, m2.seq);
        showToast("success", `Memoria saved ${m2.file}.json`);
        scheduleDemoRerender(step);
        return;
      }
      if (m2.type === "edit_preview" || m2.type === "watch_stream" || m2.type === "lesson_patch")
        return;
      shimmer();
    };
  }
  function runDoScript(step, m2) {
    if (!active)
      return;
    if (m2.type === "create_chapter") {
      const fx = active.fixture;
      if (!fx) {
        markDoDone(step);
        return;
      }
      active.doPhase = "running";
      fx.busy = [{ kind: "chapter", chatId: FIXTURE_CHAT_ID, label: "Memoria is filing a chapter (1s)", startedAt: Date.now() }];
      scheduleDemoRerender(step);
      showToast("info", "Memoria opens a fresh page for you, nya");
      setTimeout(() => {
        if (!active || currentStep() !== step)
          return;
        const cur = active.fixture;
        if (cur) {
          cur.busy = [];
          applyFiledChapter(cur);
        }
        showToast("success", "Memoria slid the chapter onto your shelf, nyaa~");
        markDoDone(step);
        scheduleDemoRerender(step);
      }, 1400);
      return;
    }
    if (m2.type === "codex_write_file") {
      active.codexFiles = { ...active.codexFiles, [m2.file]: m2.content };
      deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles, 0, m2.file, m2.seq);
      showToast("success", `Memoria saved ${m2.file}.json`);
      markDoDone(step);
      scheduleDemoRerender(step);
      return;
    }
    markDoDone(step);
  }
  function markDoDone(step) {
    if (!active)
      return;
    active.doPhase = "done";
    renderSheet(step);
    if (step.doneAnchor)
      scheduleAnchor(step.doneAnchor);
  }
  function shimmer() {
    if (!demoWrap)
      return;
    demoWrap.classList.remove("lmb-shimmer");
    demoWrap.offsetWidth;
    demoWrap.classList.add("lmb-shimmer");
  }
  function makeSandboxCtx() {
    const base = deps.ctx;
    const baseUi = base["ui"] ?? {};
    const fake = {
      ...base,
      ui: {
        ...baseUi,
        showConfirm: async () => ({ confirmed: true }),
        showModal: (opts) => makeStageModal(opts?.title ?? "")
      }
    };
    return fake;
  }
  function makeStageModal(title) {
    const overlayEl = document.createElement("div");
    overlayEl.className = "lmb-lesson-modal";
    const card = document.createElement("div");
    card.className = "lmb-lesson-modal-card";
    const head = document.createElement("div");
    head.className = "lmb-seal-title";
    head.textContent = title;
    const root = document.createElement("div");
    card.append(head, root);
    overlayEl.appendChild(card);
    (stage ?? document.body).appendChild(overlayEl);
    let dismissCb = null;
    const dismiss = () => {
      overlayEl.remove();
      dismissCb?.();
    };
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl)
        dismiss();
    });
    return { root, dismiss, onDismiss: (cb) => {
      dismissCb = cb;
    } };
  }
  function renderDemoStrip(current) {
    if (!demoStrip)
      return;
    demoStrip.replaceChildren();
    if (!current) {
      demoStrip.style.display = "none";
      return;
    }
    demoStrip.style.display = "";
    for (const t of APP_TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `lmb-demo-tab${t.key === current ? " active" : ""}`;
      lessonMark(btn, `tab.${t.key}`);
      const icon = document.createElement("span");
      icon.className = "lmb-demo-tab-icon";
      icon.innerHTML = t.icon;
      const label = document.createElement("span");
      label.className = "lmb-demo-tab-label";
      label.textContent = t.label;
      btn.append(icon, label);
      btn.addEventListener("click", () => {
        if (!active)
          return;
        const step = currentStep();
        if (!step)
          return;
        active.navTab = t.key;
        renderDemoFor(step);
        scheduleAnchor(anchorFor(step), false);
      });
      demoStrip.appendChild(btn);
    }
  }
  function renderDemoFor(step) {
    if (!demoInner || !active)
      return;
    const tab = active.navTab ?? step.tab ?? active.demoTab;
    if (!tab)
      return;
    active.demoTab = tab;
    renderDemoStrip(tab);
    const real = step.real === true;
    const state = real ? deps.getState() : fixtureFor(step);
    if (!state) {
      demoInner.replaceChildren();
      const empty = document.createElement("div");
      empty.className = "lmb-empty";
      empty.textContent = real ? "No chat is open right now, skip this step." : "";
      demoInner.appendChild(empty);
      return;
    }
    if (active.prepFor !== step) {
      step.prep?.();
      active.prepFor = step;
    }
    const send = real ? (m2) => {
      deps.send(m2);
      if (step.kind === "do" && m2.type === step.expect && active.doPhase !== "done")
        markDoDone(step);
    } : makeSandboxSend(step);
    const ctx = real ? deps.ctx : makeSandboxCtx();
    demoInner.replaceChildren();
    const pane = document.createElement("div");
    pane.className = "lmb-root lmb-lesson-demo-root";
    demoInner.appendChild(pane);
    paneObs?.disconnect();
    paneObs = new ResizeObserver(() => scheduleAnchor(anchorFor(currentStep()), false));
    paneObs.observe(pane);
    switch (tab) {
      case "home":
        renderHomeTab(pane, state, ctx, send);
        break;
      case "books":
        renderBooksTab(pane, state, ctx, send);
        break;
      case "codex":
        renderCodexTab(pane, state, ctx, send);
        break;
      case "tuning":
        renderTuningTab(pane, state, ctx, send);
        break;
      case "stuff":
        renderAboutTab(pane, state, send);
        break;
    }
    demoInner.removeAttribute("inert");
    demoWrap?.classList.toggle("lmb-demo-funnel", step.kind === "nav" && active.doPhase === "idle");
  }
  function scheduleDemoRerender(step) {
    requestAnimationFrame(() => {
      if (!active || currentStep() !== step)
        return;
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
      if (step.kind === "nav")
        checkNavArrival(step, true);
    });
  }
  function renderCover(subtitle) {
    if (!demoInner || !active)
      return;
    demoInner.replaceChildren();
    demoInner.removeAttribute("inert");
    demoWrap?.classList.remove("lmb-demo-funnel");
    renderDemoStrip(null);
    hideSpotlight();
    const cover = document.createElement("div");
    cover.className = "lmb-lesson-cover";
    cover.appendChild(memoriaSprite(96));
    const title = document.createElement("div");
    title.className = "lmb-lesson-cover-title";
    title.textContent = active.course.title;
    const orn = document.createElement("div");
    orn.className = "lmb-lesson-cover-orn";
    orn.textContent = "◆ ◇ ◆";
    cover.append(title, orn);
    const secTitle = subtitle ?? (active.mode === "lesson" && active.phase === "steps" ? active.main[active.sIdx]?.title : undefined);
    if (secTitle) {
      const sec = document.createElement("div");
      sec.className = "lmb-lesson-cover-sec";
      sec.textContent = secTitle;
      cover.appendChild(sec);
    }
    demoInner.appendChild(cover);
  }
  function demoIsShowing() {
    return !!demoInner?.querySelector(".lmb-lesson-demo-root, .lmb-lesson-diagram");
  }
  function scheduleAnchor(anchor, scroll = true) {
    cancelAnimationFrame(anchorRaf);
    anchorRaf = requestAnimationFrame(() => positionSpotlight(anchor, scroll));
  }
  function hideSpotlight() {
    for (const p of overlay)
      p.style.display = "none";
    if (ring)
      ring.style.display = "none";
    if (spotTag)
      spotTag.style.display = "none";
  }
  function positionSpotlight(anchor, scroll) {
    if (!demoWrap || !demoInner)
      return;
    if (!anchor) {
      hideSpotlight();
      return;
    }
    const target = demoWrap.querySelector(`[data-lesson="${anchor}"]`);
    if (!target) {
      hideSpotlight();
      return;
    }
    const focusMoved = anchor !== lastSpotAnchor;
    lastSpotAnchor = anchor;
    if ((scroll || focusMoved) && demoInner.contains(target)) {
      const cRect = demoInner.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      if (tRect.height > cRect.height * 0.75) {
        demoInner.scrollTop += tRect.top - cRect.top - 10;
      } else {
        demoInner.scrollTop += tRect.top + tRect.height / 2 - (cRect.top + cRect.height / 2);
      }
    }
    const c2 = demoWrap.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const pad = 5;
    const top = Math.max(0, r.top - c2.top - pad);
    const left = Math.max(0, r.left - c2.left - pad);
    const right = Math.min(c2.width, r.right - c2.left + pad);
    const bottom = Math.min(c2.height, r.bottom - c2.top + pad);
    const [pT, pL, pR, pB] = overlay;
    Object.assign(pT.style, { display: "", top: "0", left: "0", right: "0", height: `${top}px` });
    Object.assign(pB.style, { display: "", top: `${bottom}px`, left: "0", right: "0", bottom: "0", height: "auto" });
    Object.assign(pL.style, { display: "", top: `${top}px`, left: "0", width: `${left}px`, height: `${bottom - top}px` });
    Object.assign(pR.style, { display: "", top: `${top}px`, left: `${right}px`, right: "0", width: "auto", height: `${bottom - top}px` });
    if (ring) {
      Object.assign(ring.style, {
        display: "",
        top: `${top}px`,
        left: `${left}px`,
        width: `${right - left}px`,
        height: `${bottom - top}px`
      });
    }
    if (spotTag) {
      const step = currentStep();
      const chip = step?.kind === "quiz" ? step.chip : step?.kind === "nav" && active?.doPhase === "idle" ? "tap" : undefined;
      if (chip) {
        spotTag.textContent = `◆ ${chip}`;
        spotTag.style.display = "";
        const tagTop = top - 27;
        spotTag.style.top = tagTop < 4 ? `${bottom + 7}px` : `${tagTop}px`;
        spotTag.style.left = `${Math.max(4, left)}px`;
      } else {
        spotTag.style.display = "none";
      }
    }
  }
  function renderStep() {
    if (!active || !stage)
      return;
    renderRail();
    if (active.phase === "register") {
      renderCover("Sign the register");
      if (sheetBody) {
        renderRegister(sheetBody, active.signedName ?? "", onSigned);
      }
      return;
    }
    if (active.phase === "diploma") {
      hideSpotlight();
      renderDemoStrip(null);
      if (demoInner)
        demoInner.replaceChildren();
      renderDiplomaPhase();
      return;
    }
    const step = currentStep();
    if (!step) {
      advance();
      return;
    }
    if (!stepApplies(step)) {
      advance();
      return;
    }
    active.doPhase = "idle";
    active.navTab = null;
    demoWrap?.classList.remove("lmb-demo-funnel");
    if (step.kind === "nav") {
      if (!step.tab && !active.demoTab)
        active.demoTab = lastTabBefore() ?? "home";
      renderDemoFor(step);
      renderSheet(step);
      scheduleAnchor(anchorFor(step));
      checkNavArrival(step, false);
      return;
    }
    if (step.tab) {
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
    } else if (step.diagram) {
      if (demoInner) {
        renderDiagram(demoInner, step.diagram);
        demoInner.setAttribute("inert", "");
        renderDemoStrip(null);
      }
      hideSpotlight();
    } else if (demoIsShowing()) {
      scheduleAnchor(step.anchor);
    } else {
      renderCover();
    }
    renderSheet(step);
  }
  function renderSheet(step) {
    if (!sheetBody || !active)
      return;
    sheetBody.replaceChildren();
    const row = document.createElement("div");
    row.className = "lmb-lesson-row";
    row.appendChild(memoriaSprite(44));
    const content = document.createElement("div");
    content.className = "lmb-lesson-content";
    row.appendChild(content);
    sheetBody.appendChild(row);
    if (step.kind === "quiz") {
      renderQuiz(content, step);
      return;
    }
    const done = active.doPhase === "done";
    const text = document.createElement("div");
    text.className = "lmb-lesson-text";
    text.textContent = step.kind === "do" && done && step.done ? step.done : step.kind === "nav" && done ? step.done ?? "Right where we need to be." : step.text;
    text.setAttribute("aria-live", "polite");
    content.appendChild(text);
    const nav = document.createElement("div");
    nav.className = "lmb-lesson-nav";
    nav.appendChild(makeButton("Back", back, { small: true, disabled: atStart() || active.mode === "exam" }));
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    nav.appendChild(spacer);
    if ((step.kind === "do" || step.kind === "nav") && !done) {
      if (step.optional && active.doPhase === "idle") {
        nav.appendChild(makeButton("Skip", advance, { small: true }));
      }
      const hint = document.createElement("span");
      hint.className = "lmb-lesson-waiting";
      hint.textContent = active.doPhase === "running" ? "working…" : "your move…";
      nav.appendChild(hint);
    } else {
      nav.appendChild(makeButton("Next", advance, { small: true, primary: true }));
    }
    content.appendChild(nav);
  }
  function renderQuiz(content, q) {
    if (!active)
      return;
    const already = active.mode === "lesson" && active.answers[q.id];
    const stem = document.createElement("div");
    stem.className = "lmb-lesson-text";
    stem.textContent = q.text;
    content.appendChild(stem);
    if (q.exhibit) {
      const ex = document.createElement("div");
      ex.className = `lmb-lesson-exhibit ${q.exhibitTone ?? "info"}`;
      ex.textContent = q.exhibit;
      content.appendChild(ex);
    }
    const verdict = document.createElement("div");
    verdict.className = "lmb-lesson-verdict";
    verdict.setAttribute("aria-live", "polite");
    const nav = document.createElement("div");
    nav.className = "lmb-lesson-nav";
    if (already) {
      const note = document.createElement("div");
      note.className = "lmb-lesson-why";
      note.textContent = already === "gold" ? "Already stamped gold, from the exam or an earlier pass." : "Answered on an earlier pass.";
      content.appendChild(note);
      nav.appendChild(makeButton("Back", back, { small: true, disabled: atStart() || active.mode === "exam" }));
      const spacer2 = document.createElement("span");
      spacer2.className = "lmb-spacer";
      nav.appendChild(spacer2);
      nav.appendChild(makeButton("Next", advance, { small: true, primary: true }));
      content.appendChild(nav);
      return;
    }
    const group = document.createElement("div");
    group.className = "lmb-lesson-options";
    group.setAttribute("role", "radiogroup");
    const options = shuffled(q);
    let locked = false;
    const btns = [];
    options.forEach((o) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lmb-lesson-option";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.textContent = o.text;
      btn.addEventListener("click", () => {
        if (locked)
          return;
        locked = true;
        btn.setAttribute("aria-checked", "true");
        const answer = o.correct ? "gold" : "silver";
        recordAnswer(q, answer);
        for (const b of btns) {
          b.disabled = true;
          const wasCorrect = options[btns.indexOf(b)].correct;
          if (wasCorrect)
            b.classList.add("correct");
        }
        if (!o.correct)
          btn.classList.add("wrong");
        verdict.textContent = o.correct ? "Filed! ◆" : "Not quite.";
        verdict.classList.add(o.correct ? "ok" : "miss");
        const why = document.createElement("div");
        why.className = "lmb-lesson-why";
        why.textContent = q.why;
        content.insertBefore(why, nav);
        skipLink.remove();
        nav.appendChild(makeButton("Continue", advance, { small: true, primary: true }));
      });
      btns.push(btn);
      group.appendChild(btn);
    });
    content.appendChild(group);
    content.appendChild(verdict);
    const skipLink = document.createElement("button");
    skipLink.type = "button";
    skipLink.className = "lmb-lesson-skip";
    skipLink.textContent = "Skip, mark for revisit";
    skipLink.addEventListener("click", () => {
      if (locked)
        return;
      locked = true;
      recordAnswer(q, "skip");
      advance();
    });
    nav.appendChild(makeButton("Back", back, { small: true, disabled: atStart() || active.mode === "exam" }));
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    nav.append(spacer, skipLink);
    content.appendChild(nav);
    if (q.anchor || q.tab) {
      const peek = document.createElement("button");
      peek.type = "button";
      peek.className = "lmb-lesson-peek";
      peek.textContent = "Hold to peek at the pane";
      const sheet = sheetBody?.parentElement;
      const down = () => sheet?.classList.add("peeking");
      const up = () => sheet?.classList.remove("peeking");
      peek.addEventListener("pointerdown", down);
      peek.addEventListener("pointerup", up);
      peek.addEventListener("pointercancel", up);
      peek.addEventListener("pointerleave", up);
      content.appendChild(peek);
    }
  }
  function recordAnswer(q, answer) {
    if (!active)
      return;
    active.answers[q.id] = answer;
    schedulePatch();
  }
  function atStart() {
    if (!active)
      return true;
    if (active.mode === "exam")
      return active.examIdx === 0;
    if (active.phase === "finale")
      return active.fIdx === 0;
    return active.sIdx === 0 && active.tIdx === 0;
  }
  function stepApplies(step) {
    if (!step)
      return false;
    if (step.onlyFreshInstall && !(deps.getState()?.lessons?.freshInstall ?? false))
      return false;
    return true;
  }
  function lastTabBefore() {
    if (!active)
      return null;
    if (active.phase === "finale") {
      const steps = active.finale?.steps ?? [];
      for (let t = Math.min(active.fIdx, steps.length - 1);t >= 0; t--) {
        const tab = steps[t]?.tab;
        if (tab)
          return tab;
      }
      return null;
    }
    for (let s = active.sIdx;s >= 0; s--) {
      const steps = active.main[s]?.steps ?? [];
      const from = s === active.sIdx ? Math.min(active.tIdx, steps.length - 1) : steps.length - 1;
      for (let t = from;t >= 0; t--) {
        const tab = steps[t]?.tab;
        if (tab)
          return tab;
      }
    }
    return null;
  }
  function back() {
    if (!active || atStart())
      return;
    if (active.mode === "exam")
      return;
    for (let guard = 0;guard < 50; guard++) {
      if (atStart())
        break;
      if (active.phase === "finale") {
        active.fIdx = Math.max(0, active.fIdx - 1);
      } else if (active.tIdx > 0) {
        active.tIdx--;
      } else {
        active.sIdx--;
        active.tIdx = Math.max(0, (active.main[active.sIdx]?.steps.length ?? 1) - 1);
      }
      if (stepApplies(currentStep()))
        break;
    }
    renderStep();
  }
  function advance() {
    if (!active)
      return;
    if (active.mode === "exam") {
      active.examIdx++;
      if (active.examIdx >= active.examSet.length) {
        finishExam();
        return;
      }
      renderStep();
      return;
    }
    if (active.phase === "finale") {
      active.fIdx++;
      if (!active.finale || active.fIdx >= active.finale.steps.length) {
        active.phase = "diploma";
      }
      renderStep();
      return;
    }
    const section2 = active.main[active.sIdx];
    if (!section2) {
      enterRegister();
      return;
    }
    active.tIdx++;
    if (active.tIdx >= section2.steps.length) {
      active.sIdx++;
      active.tIdx = 0;
      if (active.sIdx >= active.main.length) {
        enterRegister();
        return;
      }
    }
    schedulePatch();
    renderStep();
  }
  function enterRegister() {
    if (!active)
      return;
    flushPatch();
    active.phase = "register";
    renderStep();
  }
  function onSigned(name) {
    if (!active)
      return;
    active.signedName = name;
    if (active.mode === "lesson") {
      const scored = scoredQuestions(active.course);
      active.wrong = scored.filter((s) => {
        const a2 = active.answers[s.id];
        return a2 !== undefined && a2 !== "gold";
      }).length;
      active.total = scored.length;
    }
    active.grade = active.mode === "exam" ? active.wrong === 0 ? "gilded" : "silver" : lessonGradeForWrong(active.wrong);
    active.completedAt = Date.now();
    deps.send({
      type: "lesson_complete",
      course: active.key,
      wrong: active.wrong,
      total: active.total,
      grade: active.grade,
      signedName: active.signedName,
      answers: active.answers
    });
    deps.applyLessons(active.key, {
      status: "done",
      grade: active.grade,
      lastWrong: active.wrong,
      lastTotal: active.total,
      signedName: active.signedName,
      completedAt: active.completedAt,
      answers: { ...active.answers }
    });
    active.phase = active.finale ? "finale" : "diploma";
    active.fIdx = 0;
    renderStep();
  }
  function finishExam() {
    if (!active)
      return;
    const wrong = active.examSet.filter((q) => active.answers[q.id] !== "gold").length;
    if (wrong <= EXAM_PASS_MAX_WRONG) {
      active.wrong = wrong;
      active.total = active.examSet.length;
      active.mode = "lesson";
      active.phase = "register";
      active.grade = wrong === 0 ? "gilded" : "silver";
      active.completedAt = Date.now();
      deps.send({
        type: "lesson_complete",
        course: active.key,
        wrong,
        total: active.total,
        grade: active.grade,
        signedName: null,
        answers: active.answers
      });
      deps.applyLessons(active.key, {
        status: "done",
        grade: active.grade,
        lastWrong: wrong,
        lastTotal: active.total,
        completedAt: active.completedAt,
        answers: { ...active.answers }
      });
      renderStepExamPass();
      return;
    }
    const gold = {};
    for (const q of active.examSet) {
      if (active.answers[q.id] === "gold")
        gold[q.id] = "gold";
    }
    const key = active.key;
    const failPatch = { status: "in_progress", section: 0, step: 0, answers: gold };
    deps.send({ type: "lesson_patch", course: key, patch: failPatch });
    deps.applyLessons(key, failPatch);
    const correct = active.examSet.length - wrong;
    active.mode = "lesson";
    active.answers = gold;
    active.sIdx = 0;
    active.tIdx = 0;
    active.phase = "steps";
    renderStep();
    showToast("info", `${correct} of ${active.examSet.length}, the passed topics stay stamped while we walk the rest`);
  }
  function renderStepExamPass() {
    if (!active || !sheetBody)
      return;
    renderRail();
    renderCover("Sign the register");
    renderRegister(sheetBody, active.signedName ?? "", (name) => {
      if (!active)
        return;
      active.signedName = name;
      deps.send({ type: "lesson_patch", course: active.key, patch: { signedName: name } });
      deps.applyLessons(active.key, { signedName: name });
      active.phase = active.finale ? "finale" : "diploma";
      active.fIdx = 0;
      renderStep();
    });
  }
  function renderDiplomaPhase() {
    if (!active || !sheetBody)
      return;
    const saved = deps.getState()?.lessons?.[active.key];
    const data = {
      courseTitle: active.course.title,
      name: (active.viewOnly ? saved?.signedName : active.signedName) ?? saved?.signedName ?? "Reader",
      grade: active.viewOnly ? saved?.grade ?? active.grade : active.grade,
      wrong: active.viewOnly ? saved?.lastWrong ?? active.wrong : active.wrong,
      total: active.viewOnly ? saved?.lastTotal ?? active.total : active.total,
      completedAt: active.viewOnly ? saved?.completedAt ?? active.completedAt : active.completedAt
    };
    const actions = [];
    if (!active.viewOnly && active.key === "books") {
      actions.push({ label: "Enter the Archive", onClick: exit, primary: true });
    } else if (!active.viewOnly) {
      actions.push({ label: "Open the Codex", onClick: exit, primary: true });
    } else {
      actions.push({ label: "Close", onClick: exit, primary: true });
    }
    if (demoInner) {
      demoInner.replaceChildren();
      demoInner.removeAttribute("inert");
      renderDiploma(demoInner, data, actions);
    }
    sheetBody.replaceChildren();
    const row = document.createElement("div");
    row.className = "lmb-lesson-row";
    row.appendChild(memoriaSprite(44));
    const text = document.createElement("div");
    text.className = "lmb-lesson-text";
    text.textContent = active.viewOnly ? "Your diploma, as filed in the Academy." : "Signed, stamped, and shelved. Congratulations, nyaa.";
    row.appendChild(text);
    sheetBody.appendChild(row);
  }
  return { isActive, start, mount, onHostState, exit };
}

// src/ui/app.ts
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
  const send = (msg) => ctx.sendToBackend(msg);
  const engine = createLessonEngine({
    ctx,
    send,
    getState: () => lastState,
    onModeChange: () => {
      refreshTabStyles();
      doRender();
    },
    applyLessons: (course, patch) => {
      if (!lastState)
        return;
      const cur = lastState.lessons[course];
      lastState = {
        ...lastState,
        lessons: {
          ...lastState.lessons,
          [course]: {
            ...cur,
            ...patch,
            answers: patch.answers ? { ...cur.answers, ...patch.answers } : cur.answers
          }
        }
      };
    }
  });
  const viewMode = () => {
    if (engine.isActive())
      return "lesson";
    if (lastState && lastState.lessons && lastState.lessons.books.status !== "done" && !lastState.lessons.booksSealSkipped) {
      return "sealed";
    }
    return "tabs";
  };
  const refreshTabStyles = () => {
    for (const [key, btn] of tabButtons) {
      btn.classList.toggle("active", key === activeTab);
    }
    strip.style.display = engine.isActive() ? "none" : "";
  };
  for (const t of APP_TABS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lmb-tab";
    const icon = document.createElement("span");
    icon.className = "lmb-tab-icon";
    icon.innerHTML = t.icon;
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
  const renderTabInto = (host) => {
    if (!lastState)
      return;
    if (activeTab === "home")
      renderHomeTab(host, lastState, ctx, send);
    else if (activeTab === "books")
      renderBooksTab(host, lastState, ctx, send);
    else if (activeTab === "codex")
      renderCodexTab(host, lastState, ctx, send);
    else if (activeTab === "tuning")
      renderTuningTab(host, lastState, ctx, send);
    else
      renderAboutTab(host, lastState, send);
  };
  let lastRenderedTab = null;
  const doRender = () => {
    if (!lastState) {
      content.replaceChildren();
      lastRenderedTab = null;
      return;
    }
    const mode = viewMode();
    if (mode === "lesson") {
      lastRenderedTab = null;
      clearSealBusy();
      engine.mount(content);
      return;
    }
    if (mode === "sealed") {
      lastRenderedTab = null;
      content.replaceChildren();
      const wrap = document.createElement("div");
      wrap.className = "lmb-seal-wrap";
      const under = document.createElement("div");
      under.className = "lmb-seal-under";
      under.setAttribute("inert", "");
      renderTabInto(under);
      wrap.appendChild(under);
      renderSealPanel(wrap, lastState, send);
      content.appendChild(wrap);
      return;
    }
    clearSealBusy();
    const renderInner = () => renderTabInto(content);
    if (lastRenderedTab === activeTab) {
      preserveScroll(content, renderInner);
    } else {
      renderInner();
    }
    lastRenderedTab = activeTab;
  };
  const renderActive = () => {
    if (viewMode() === "lesson") {
      engine.onHostState();
      return;
    }
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
    if (viewMode() === "lesson")
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
        if (lastState && lastState.activeChatId !== msg.state.activeChatId)
          closeCodexCatchupModal();
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
        showToast(msg.tone, msg.text);
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
          const mode = viewMode();
          if (mode === "lesson") {
            engine.onHostState();
            break;
          }
          if (mode === "sealed") {
            updateSealBusy(lastState);
            break;
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
        deliverCodexFiles(msg.chatId, msg.files, msg.revision, msg.savedFile, msg.savedSeq);
        if (viewMode() === "tabs" && activeTab === "codex" && lastState)
          renderActive();
        else if (viewMode() === "lesson")
          engine.onHostState();
        break;
      case "stream_text":
        deliverStreamText(msg);
        break;
      case "codex_backup_data":
        downloadCodexBackup(msg.filename, msg.content);
        break;
      case "codex_tools_hint":
        if (lastState && !lastState.settings.suppressToolCallingPrompt) {
          showCodexToolsHintModal(lastState.activeProfile.id, send);
        }
        break;
    }
  });
  const onRevealEntry = (e) => {
    if (viewMode() !== "tabs")
      return;
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
  const onLessonRequest = (e) => {
    if (engine.isActive())
      return;
    const detail = e.detail;
    if (!detail || detail.course !== "books" && detail.course !== "codex")
      return;
    engine.start(detail.course, { mode: detail.mode ?? "lesson", section: detail.section, fresh: detail.fresh });
  };
  document.addEventListener("lmb-lesson-request", onLessonRequest);
  send({ type: "ready", chatId: null });
  const unsubActivate = tab.onActivate(() => send({ type: "refresh", chatId: null }));
  return () => {
    try {
      if (engine.isActive())
        engine.exit();
    } catch (_) {}
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
      document.removeEventListener("lmb-lesson-request", onLessonRequest);
    } catch (_) {}
    try {
      tab.destroy?.();
    } catch (_) {}
  };
}
export {
  setup
};
