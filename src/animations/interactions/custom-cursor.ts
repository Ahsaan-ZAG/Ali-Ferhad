export type CursorMode =
  | 'default'
  | 'link'
  | 'button'
  | 'image'
  | 'drag'
  | 'view';

export function resolveCursorMode(target: EventTarget | null): {
  mode: CursorMode;
  label: string;
} {
  if (!(target instanceof HTMLElement)) {
    return { mode: 'default', label: '' };
  }

  const explicit = target.closest<HTMLElement>('[data-cursor]');
  if (explicit) {
    const raw = explicit.dataset.cursor as CursorMode | undefined;
    const label = explicit.dataset.cursorLabel ?? (raw === 'view' ? 'View' : raw === 'drag' ? 'Drag' : '');
    if (raw) return { mode: raw, label };
  }

  if (target.closest('button, [role="button"], select')) {
    return { mode: 'button', label: '' };
  }
  if (target.closest('a[href]')) {
    return { mode: 'link', label: '' };
  }
  if (target.closest('[data-testid="editorial-3d-canvas"]')) {
    return { mode: 'drag', label: 'Drag' };
  }
  if (target.closest('img')) {
    return { mode: 'image', label: '' };
  }

  return { mode: 'default', label: '' };
}
