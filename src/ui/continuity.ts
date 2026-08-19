import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { makeButton, section, select, textNode } from "./components";
import { confirmDelete } from "./modals";

export interface ContinuityOption {
  chatId: string;
  chatName: string;
  /** Trailing hint in the option label, e.g. an entry count. */
  detail?: string;
}

export interface ContinuityInherited {
  /** One line describing what was inherited and from where. */
  text: string;
  /** Optional listing of the inherited material. */
  detail?: HTMLElement | null;
  detach: {
    label: string;
    title: string;
    confirmTitle: string;
    confirmBody: string;
    run: () => void;
  };
}

export interface ContinuityPicker {
  help: string;
  ariaLabel: string;
  placeholder: string;
  options: ContinuityOption[];
  selectedId: string;
  onSelect: (chatId: string) => void;
  action: {
    label: string;
    title: string;
    primary?: boolean;
    /** Present when the action destroys existing work. */
    confirm?: { title: string; body: string };
    run: (sourceChatId: string) => void;
  };
}

export interface ContinuitySpec {
  emptyText: string;
  inherited: ContinuityInherited | null;
  picker: ContinuityPicker | null;
}

/**
 * The "Continuity (root)" pane, shared by the shelf and the codex so the two
 * cannot drift. Callers own their own wording, source list, and actions; the
 * layout, the dead-until-chosen button, and the confirm step live here.
 */
export function renderContinuitySection(
  host: HTMLElement,
  ctx: SpindleFrontendContext,
  spec: ContinuitySpec,
): HTMLElement {
  const sec = section("Continuity (root)");

  if (!spec.inherited && !spec.picker) {
    sec.body.appendChild(textNode(spec.emptyText, "lmb-empty"));
    host.appendChild(sec.wrap);
    return sec.wrap;
  }

  if (spec.inherited) {
    sec.body.appendChild(textNode(spec.inherited.text, "lmb-help"));
    if (spec.inherited.detail) sec.body.appendChild(spec.inherited.detail);
    const detachRow = document.createElement("div");
    detachRow.className = "lmb-actions";
    const d = spec.inherited.detach;
    detachRow.appendChild(
      makeButton(d.label, async () => {
        if (await confirmDelete(ctx, d.confirmTitle, d.confirmBody)) d.run();
      }, { small: true, danger: true, title: d.title }),
    );
    sec.body.appendChild(detachRow);
  }

  if (spec.picker) {
    const p = spec.picker;
    sec.body.appendChild(textNode(p.help, "lmb-help"));

    const row = document.createElement("div");
    row.className = "lmb-actions";
    let actionBtn: HTMLButtonElement;
    const picker = select({
      value: p.selectedId,
      ariaLabel: p.ariaLabel,
      options: [
        { value: "", label: p.placeholder },
        ...p.options.map((o) => ({
          value: o.chatId,
          label: o.detail ? `${o.chatName} (${o.detail})` : o.chatName,
        })),
      ],
      onChange: (v) => {
        p.onSelect(v);
        actionBtn.disabled = !v;
      },
    });
    row.appendChild(picker);

    actionBtn = makeButton(p.action.label, async () => {
      const sourceChatId = picker.value;
      if (!sourceChatId) return;
      const c = p.action.confirm;
      if (c && !(await confirmDelete(ctx, c.title, c.body))) return;
      p.action.run(sourceChatId);
    }, {
      ...(p.action.primary ? { primary: true } : {}),
      disabled: !p.selectedId,
      title: p.action.title,
    });
    row.appendChild(actionBtn);
    sec.body.appendChild(row);
  }

  host.appendChild(sec.wrap);
  return sec.wrap;
}
