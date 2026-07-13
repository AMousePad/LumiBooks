import type { LessonGrade } from "../../shared";
import { LESSON_GRADE_LABEL } from "../../shared";
import { makeButton, textInput } from "../components";
import { MEMORIA_AVATAR } from "./avatar";
import { memoriaSprite } from "./seal";

export interface DiplomaData {
  courseTitle: string;
  name: string;
  grade: LessonGrade;
  wrong: number;
  total: number;
  completedAt: number;
}

const GRADE_REMARK: Record<LessonGrade, string> = {
  gilded: "Not a page out of place. My favorite reader, nyaa.",
  silver: "Nearly flawless filing. The shelf approves.",
  bronze: "A solid apprenticeship. The stacks will teach the rest.",
  apprentice: "The library forgives. Retake a section whenever you like.",
};

/* ------------------------------------------------------------- register */

export function renderRegister(
  host: HTMLElement,
  defaultName: string,
  onSign: (name: string) => void,
): void {
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
    if (e.key === "Enter") sign.click();
  });
  row.appendChild(sign);
  card.append(title, hint, input, row);
  host.appendChild(card);
}

/* -------------------------------------------------------------- diploma */

export function renderDiploma(
  host: HTMLElement,
  data: DiplomaData,
  actions: { label: string; onClick: () => void; primary?: boolean }[],
): void {
  host.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "lmb-diploma";

  const frame = document.createElement("div");
  frame.className = "lmb-diploma-frame";
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

  frame.append(arch, course, grant, name, line, stamp, score, sealRow);
  wrap.appendChild(frame);

  const btnRow = document.createElement("div");
  btnRow.className = "lmb-seal-actions";
  btnRow.appendChild(makeButton("Save as image", () => void downloadDiploma(data), { small: true }));
  for (const a of actions) {
    btnRow.appendChild(makeButton(a.label, a.onClick, { small: true, primary: a.primary }));
  }
  wrap.appendChild(btnRow);
  host.appendChild(wrap);

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    wrap.appendChild(makeConfetti());
  }
}

function makeConfetti(): HTMLElement {
  const layer = document.createElement("div");
  layer.className = "lmb-confetti";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 36; i++) {
    const d = document.createElement("span");
    d.textContent = "◆";
    d.style.left = `${(i * 137) % 100}%`;
    d.style.animationDelay = `${(i % 12) * 90}ms`;
    d.style.fontSize = `${8 + (i % 4) * 3}px`;
    layer.appendChild(d);
  }
  setTimeout(() => layer.remove(), 3200);
  return layer;
}

/* ----------------------------------------------------------- PNG export */

async function downloadDiploma(data: DiplomaData): Promise<void> {
  const W = 900;
  const H = 640;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const g = canvas.getContext("2d");
  if (!g) return;
  g.scale(dpr, dpr);

  try {
    await Promise.all([
      document.fonts.load('20px "Marcellus"'),
      document.fonts.load('42px "Marcellus"'),
    ]);
  } catch {
    /* fall back to the serif stack below */
  }
  const display = (px: number): string => `${px}px "Marcellus", "Palatino Linotype", Georgia, serif`;

  g.fillStyle = "#181422";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(201, 168, 106, 0.9)";
  g.lineWidth = 3;
  g.strokeRect(24, 24, W - 48, H - 48);
  g.lineWidth = 1;
  g.strokeStyle = "rgba(201, 168, 106, 0.5)";
  g.strokeRect(34, 34, W - 68, H - 68);
  for (const [x, y] of [[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]] as const) {
    g.save();
    g.translate(x, y);
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
  g.fillText(
    `${gold} of ${data.total} gold stamps · ${new Date(data.completedAt).toLocaleDateString()}`,
    W / 2,
    330,
  );

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

  await new Promise<void>((resolve) => {
    const img = new Image();
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

  const a = document.createElement("a");
  a.download = `lumibooks-diploma-${data.courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}
