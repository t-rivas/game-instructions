/** Keep keyboard focus in the active native dialog, including nested dialogs. */
export function trapDialogTab(
  dialog: HTMLDialogElement,
  event: Pick<KeyboardEvent, "key" | "shiftKey" | "preventDefault">,
) {
  if (event.key !== "Tab" || document.activeElement?.closest("dialog") !== dialog) return;
  const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
    'button, a[href], input, select, textarea, [tabindex]',
  )).filter(node => node.tabIndex >= 0 && !node.matches(':disabled, [hidden]') &&
    node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden");
  const current = controls.indexOf(document.activeElement as HTMLElement);
  if (!controls.length) return;
  event.preventDefault();
  const next = current === -1
    ? event.shiftKey ? controls.length - 1 : 0
    : (current + (event.shiftKey ? controls.length - 1 : 1)) % controls.length;
  controls[next].focus();
}
