export type IconName = "pause" | "restart" | "settings" | "help" | "home";

export function icon(name: IconName): string {
  if (name === "pause") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z" /></svg>`;
  }
  if (name === "restart") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.4 7.1A8 8 0 1 0 20 12h-2.4a5.6 5.6 0 1 1-1.1-3.3L13 12h8V4z" /></svg>`;
  }
  if (name === "settings") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 2h2.4l.6 2.3 1.4.6 2-1.2 1.7 1.7-1.2 2 .6 1.4 2.3.6v2.4l-2.3.6-.6 1.4 1.2 2-1.7 1.7-2-1.2-1.4.6-.6 2.3h-2.4l-.6-2.3-1.4-.6-2 1.2-1.7-1.7 1.2-2-.6-1.4-2.3-.6V9.4l2.3-.6.6-1.4-1.2-2 1.7-1.7 2 1.2 1.4-.6zm1.2 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7" /></svg>`;
  }
  if (name === "home") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 8h-3v9h-5v-6h-2v6H6v-9H3z" /></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 17h2v2h-2zm1-14a7 7 0 0 0-6.4 9.8l1.8-.8A5 5 0 1 1 12 17h-1v-1.2c0-2.5 1.3-3.5 2.5-4.4 1-.7 1.5-1.2 1.5-2.4a3 3 0 0 0-6 0H7a5 5 0 1 1 10 0c0 2.2-1.2 3.2-2.4 4.1-1 .8-1.6 1.3-1.6 2.7V17h-2v-1.2c0-2.4 1.3-3.4 2.4-4.3.9-.7 1.6-1.3 1.6-2.5a3 3 0 0 0-3-3z" /></svg>`;
}
