import type { Component } from "solid-js";
import { createSignal, For, onMount, onCleanup, createMemo } from "solid-js";
import {
  Terminal,
  X,
  Maximize,
  Search,
  Grid2x2,
  Keyboard,
  Palette,
  Plus,
  LayoutGrid,
} from "lucide-solid";

interface CommandItem {
  readonly id: string;
  readonly name: string;
  readonly shortcut: string;
  readonly icon: string;
  readonly action: () => void;
}

interface CommandPaletteProps {
  readonly onClose: () => void;
  readonly onNewTerminal: () => void;
  readonly onCloseTerminal: () => void;
  readonly onToggleMaximize: () => void;
  readonly onSearchTerminal: () => void;
  readonly onSetLayout: (mode: number) => void;
  readonly onSwitchTerminal: (index: number) => void;
  readonly onShowShortcuts: () => void;
  readonly onToggleTheme: () => void;
}

const CommandPalette: Component<CommandPaletteProps> = (props) => {
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;

  const commands: readonly CommandItem[] = [
    { id: "new-terminal", name: "New Terminal", shortcut: "Ctrl+Shift+N", icon: "terminal", action: () => { props.onNewTerminal(); props.onClose(); } },
    { id: "close-terminal", name: "Close Terminal", shortcut: "Ctrl+W", icon: "x", action: () => { props.onCloseTerminal(); props.onClose(); } },
    { id: "toggle-maximize", name: "Toggle Maximize", shortcut: "F11", icon: "maximize", action: () => { props.onToggleMaximize(); props.onClose(); } },
    { id: "search-terminal", name: "Search Terminal", shortcut: "Ctrl+F", icon: "search", action: () => { props.onSearchTerminal(); props.onClose(); } },
    { id: "layout-1", name: "Layout: 1 Pane", shortcut: "", icon: "grid", action: () => { props.onSetLayout(1); props.onClose(); } },
    { id: "layout-2", name: "Layout: 2 Panes", shortcut: "", icon: "grid", action: () => { props.onSetLayout(2); props.onClose(); } },
    { id: "layout-4", name: "Layout: 4 Panes", shortcut: "", icon: "grid", action: () => { props.onSetLayout(4); props.onClose(); } },
    { id: "layout-6", name: "Layout: 6 Panes", shortcut: "", icon: "grid", action: () => { props.onSetLayout(6); props.onClose(); } },
    { id: "layout-8", name: "Layout: 8 Panes", shortcut: "", icon: "grid", action: () => { props.onSetLayout(8); props.onClose(); } },
    { id: "switch-1", name: "Switch to Terminal 1", shortcut: "Ctrl+1", icon: "terminal", action: () => { props.onSwitchTerminal(0); props.onClose(); } },
    { id: "switch-2", name: "Switch to Terminal 2", shortcut: "Ctrl+2", icon: "terminal", action: () => { props.onSwitchTerminal(1); props.onClose(); } },
    { id: "switch-3", name: "Switch to Terminal 3", shortcut: "Ctrl+3", icon: "terminal", action: () => { props.onSwitchTerminal(2); props.onClose(); } },
    { id: "switch-4", name: "Switch to Terminal 4", shortcut: "Ctrl+4", icon: "terminal", action: () => { props.onSwitchTerminal(3); props.onClose(); } },
    { id: "switch-5", name: "Switch to Terminal 5", shortcut: "Ctrl+5", icon: "terminal", action: () => { props.onSwitchTerminal(4); props.onClose(); } },
    { id: "switch-6", name: "Switch to Terminal 6", shortcut: "Ctrl+6", icon: "terminal", action: () => { props.onSwitchTerminal(5); props.onClose(); } },
    { id: "switch-7", name: "Switch to Terminal 7", shortcut: "Ctrl+7", icon: "terminal", action: () => { props.onSwitchTerminal(6); props.onClose(); } },
    { id: "switch-8", name: "Switch to Terminal 8", shortcut: "Ctrl+8", icon: "terminal", action: () => { props.onSwitchTerminal(7); props.onClose(); } },
    { id: "show-shortcuts", name: "Show Shortcuts", shortcut: "F1", icon: "keyboard", action: () => { props.onShowShortcuts(); props.onClose(); } },
    { id: "toggle-theme", name: "Toggle Theme", shortcut: "", icon: "palette", action: () => { props.onToggleTheme(); props.onClose(); } },
  ];

  function fuzzyMatch(text: string, search: string): boolean {
    const lower = text.toLowerCase();
    const terms = search.toLowerCase().split(/\s+/);
    return terms.every((term) => lower.includes(term));
  }

  const filtered = createMemo(() => {
    const q = query().trim();
    if (q === "") return commands;
    return commands.filter((cmd) => fuzzyMatch(cmd.name, q));
  });

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered().length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const items = filtered();
      if (items.length > 0 && selectedIndex() < items.length) {
        items[selectedIndex()].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
    }
  }

  function renderIcon(iconName: string) {
    switch (iconName) {
      case "terminal": return <Terminal size={16} />;
      case "x": return <X size={16} />;
      case "maximize": return <Maximize size={16} />;
      case "search": return <Search size={16} />;
      case "grid": return <LayoutGrid size={16} />;
      case "keyboard": return <Keyboard size={16} />;
      case "palette": return <Palette size={16} />;
      default: return <Terminal size={16} />;
    }
  }

  onMount(() => {
    inputRef?.focus();
  });

  return (
    <div class="command-palette-overlay" onClick={() => props.onClose()}>
      <div class="command-palette" onClick={(e) => e.stopPropagation()}>
        <div class="command-palette__search">
          <Search size={16} />
          <input
            ref={inputRef}
            type="text"
            class="command-palette__input"
            placeholder="Type a command..."
            value={query()}
            onInput={(e) => { setQuery(e.currentTarget.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div class="command-palette__list">
          <For each={filtered()}>
            {(cmd, index) => (
              <button
                class="command-palette__item"
                classList={{ "command-palette__item--selected": index() === selectedIndex() }}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(index())}
              >
                <span class="command-palette__item-icon">{renderIcon(cmd.icon)}</span>
                <span class="command-palette__item-name">{cmd.name}</span>
                {cmd.shortcut && (
                  <span class="command-palette__item-shortcut">{cmd.shortcut}</span>
                )}
              </button>
            )}
          </For>
          {filtered().length === 0 && (
            <div class="command-palette__empty">No matching commands</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
