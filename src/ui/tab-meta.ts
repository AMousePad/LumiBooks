/** The drawer's top-level tabs, shared by the real tab strip in app.ts and
 * the lesson stage's working replica strip. One source so they never drift. */

export type AppTabKey = "home" | "books" | "codex" | "tuning" | "stuff";

export const APP_TABS: { key: AppTabKey; label: string; icon: string }[] = [
  {
    key: "home",
    label: "Home",
    // Sunburst over a horizon: the at-a-glance dashboard.
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v3"/><path d="M5.6 6.6l2.1 2.1"/><path d="M18.4 6.6l-2.1 2.1"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M3 19h18"/></svg>`,
  },
  {
    key: "books",
    label: "Books",
    // The shelf: a bound book.
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>`,
  },
  {
    key: "codex",
    label: "Codex",
    // Compass rose diamond: the story bible.
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 10-10 10L2 12z"/><path d="M12 7.5l4.5 4.5-4.5 4.5L7.5 12z"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>`,
  },
  {
    key: "tuning",
    label: "Tuning",
    // Sliders: settings.
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6"/><path d="M6 14v6"/><path d="M12 4v2"/><path d="M12 10v10"/><path d="M18 4v8"/><path d="M18 16v4"/><path d="M4 10h4"/><path d="M10 6h4"/><path d="M16 12h4"/></svg>`,
  },
  {
    key: "stuff",
    label: "Stuff",
    // Four-point sparkle: extras and lore.
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l0.9 2.1L22 19l-2.1 0.9L19 22l-0.9-2.1L16 19l2.1-0.9z"/></svg>`,
  },
];
