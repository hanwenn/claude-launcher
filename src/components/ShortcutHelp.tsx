import type { Component } from "solid-js";
import { For } from "solid-js";
import { X } from "lucide-solid";

interface ShortcutHelpProps {
  readonly onClose: () => void;
}

interface ShortcutEntry {
  readonly key: string;
  readonly description: string;
}

interface ShortcutGroup {
  readonly category: string;
  readonly shortcuts: readonly ShortcutEntry[];
}

const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    category: "Terminal",
    shortcuts: [
      { key: "Ctrl+F", description: "Search in active terminal" },
      { key: "Ctrl+W", description: "Close active terminal (with confirm)" },
      { key: "Ctrl+Shift+N", description: "New terminal in current folder" },
    ],
  },
  {
    category: "Navigation",
    shortcuts: [
      { key: "Ctrl+1..8", description: "Switch to terminal pane 1-8" },
      { key: "Ctrl+Tab", description: "Cycle through terminal panes" },
    ],
  },
  {
    category: "Layout",
    shortcuts: [
      { key: "F11", description: "Toggle maximize active pane" },
      { key: "Escape", description: "Close search / restore from maximize" },
    ],
  },
  {
    category: "General",
    shortcuts: [
      { key: "Ctrl+Shift+P", description: "Command Palette (coming soon)" },
      { key: "Ctrl+? / F1", description: "Show this shortcut help" },
    ],
  },
];

const ShortcutHelp: Component<ShortcutHelpProps> = (props) => {
  function handleOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains("shortcut-help__overlay")) {
      props.onClose();
    }
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      props.onClose();
    }
  }

  return (
    <div
      class="shortcut-help__overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      ref={(el) => requestAnimationFrame(() => el.focus())}
    >
      <div class="shortcut-help">
        <div class="shortcut-help__header">
          <h2 class="shortcut-help__title">Keyboard Shortcuts</h2>
          <button
            class="shortcut-help__close-btn"
            onClick={() => props.onClose()}
            title="Close (Escape)"
          >
            <X size={18} />
          </button>
        </div>
        <div class="shortcut-help__body">
          <For each={SHORTCUT_GROUPS}>
            {(group) => (
              <div class="shortcut-help__group">
                <h3 class="shortcut-help__category">{group.category}</h3>
                <table class="shortcut-help__table">
                  <tbody>
                    <For each={group.shortcuts}>
                      {(shortcut) => (
                        <tr>
                          <td class="shortcut-help__key">
                            <kbd>{shortcut.key}</kbd>
                          </td>
                          <td class="shortcut-help__desc">{shortcut.description}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default ShortcutHelp;
