import React from 'react';
import { getModifierKeyName } from '../hooks/useKeyboardShortcuts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<Props> = ({ isOpen, onClose }) => {
  const modKey = getModifierKeyName();

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['1'], description: 'Switch to Files view' },
    { keys: ['2'], description: 'Switch to Crop Map view' },
    { keys: ['3'], description: 'Switch to Magic Spell view' },
    { keys: [modKey, '4'], description: 'Toggle Logs view' },
    { keys: ['←'], description: 'Previous scan (in Crop Map)' },
    { keys: ['→'], description: 'Next scan (in Crop Map)' },
    { keys: ['Esc'], description: 'Back to Files view' },
    { keys: [modKey, 'Q'], description: 'Logout' },
    { keys: [modKey, 'Shift', 'R'], description: 'Reboot application' },
    { keys: ['Delete'], description: 'Delete selected files' },
    { keys: [modKey, 'A'], description: 'Select all files' },
    { keys: ['?'], description: 'Show this help' },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-[#00ffa3]/30 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#00ffa3]">
              <i className="fa-solid fa-keyboard mr-2"></i>
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-[#00ffa3] transition-colors"
              aria-label="Close"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-950/50 rounded border border-gray-800 hover:border-[#00ffa3]/20 transition-colors"
              >
                <span className="text-gray-300">{shortcut.description}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      {keyIndex > 0 && (
                        <span className="text-gray-600 mx-1">+</span>
                      )}
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-800 border border-gray-700 rounded text-[#00ffa3] min-w-[2rem] text-center">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Press <kbd className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded">
              Esc
            </kbd>{' '}
            or click outside to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
