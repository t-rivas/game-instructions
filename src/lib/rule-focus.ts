// A selection can cross a client route; consume it after the target rule opens.
let requested: { pathname: string; section: string } | undefined;
export function requestRuleFocus(pathname: string, section: string) {
  requested = { pathname, section };
}
export function focusRequestedRule() {
  if (
    !requested ||
    requested.pathname !== location.pathname ||
    document.querySelector("dialog[open]")
  )
    return;
  const rule = document.getElementById(requested.section);
  if (!(rule instanceof HTMLDetailsElement) || !rule.open) return;
  const heading = rule.querySelector<HTMLElement>("summary");
  if (!heading) return;
  requested = undefined;
  heading.focus({ preventScroll: true });
  rule.scrollIntoView({ block: "start", behavior: "instant" });
}
