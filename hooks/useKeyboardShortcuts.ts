import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

/**
 * Custom hook for managing keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
): void => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
};

/**
 * Get platform-specific modifier key name
 */
export const getModifierKeyName = (): string => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  return isMac ? 'Cmd' : 'Ctrl';
};

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  const modKey = getModifierKeyName();

  if (shortcut.ctrl || shortcut.meta) parts.push(modKey);
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
};
