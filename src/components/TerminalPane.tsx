import type { Component } from "solid-js";
import { onMount, onCleanup, createSignal, Show } from "solid-js";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import { ChevronUp, ChevronDown, X } from "lucide-solid";
import "xterm/css/xterm.css";
import * as api from "../lib/tauri-api";
import { subscribeOutput, unsubscribeOutput } from "../stores/terminalStore";

interface TerminalPaneProps {
  readonly terminalId: string;
}

const XTERM_THEME = {
  background: '#0d1117',
  foreground: '#c9d1d9',
  cursor: '#58a6ff',
  cursorAccent: '#0d1117',
  selectionBackground: '#264f78',
  black: '#0d1117',
  red: '#f85149',
  green: '#3fb950',
  yellow: '#d29922',
  blue: '#58a6ff',
  magenta: '#bc8cff',
  cyan: '#39c5cf',
  white: '#c9d1d9',
  brightBlack: '#484f58',
  brightRed: '#ff7b72',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#f0f6fc',
} as const;

const TerminalPane: Component<TerminalPaneProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let searchInputRef: HTMLInputElement | undefined;
  let term: Terminal | null = null;
  let fitAddon: FitAddon | null = null;
  let searchAddon: SearchAddon | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  const [showSearch, setShowSearch] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");

  function openSearch(): void {
    setShowSearch(true);
    // Focus input after DOM update
    requestAnimationFrame(() => {
      searchInputRef?.focus();
      searchInputRef?.select();
    });
  }

  function closeSearch(): void {
    setShowSearch(false);
    setSearchQuery("");
    term?.focus();
  }

  function handleSearchNext(): void {
    const query = searchQuery();
    if (query && searchAddon) {
      searchAddon.findNext(query);
    }
  }

  function handleSearchPrev(): void {
    const query = searchQuery();
    if (query && searchAddon) {
      searchAddon.findPrevious(query);
    }
  }

  function handleSearchKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        handleSearchPrev();
      } else {
        handleSearchNext();
      }
    }
  }

  const outputCallback = (data: string): void => {
    if (term) {
      term.write(data);
    }
  };

  onMount(() => {
    if (!containerRef) return;

    term = new Terminal({
      theme: XTERM_THEME,
      fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      allowProposedApi: true,
    });

    fitAddon = new FitAddon();
    searchAddon = new SearchAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef);

    // Ctrl+F to open search within this terminal
    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f" && e.type === "keydown") {
        openSearch();
        return false; // Prevent terminal from receiving Ctrl+F
      }
      return true;
    });

    // Replay buffer (API returns { success, data } or raw string)
    api.replayTerminal(props.terminalId)
      .then((result) => {
        const buffer = typeof result === 'string' ? result : (result as any)?.data;
        if (buffer && typeof buffer === 'string' && term) {
          term.write(buffer);
        }
      })
      .catch(() => {
        // Replay may not be available yet, ignore
      });

    // Subscribe to live output
    subscribeOutput(props.terminalId, outputCallback);

    // Send keystrokes to backend
    term.onData((data) => {
      api.writeTerminal(props.terminalId, data).catch(() => {
        // Write failure - terminal may have exited
      });
    });

    // ResizeObserver with debounce - check non-zero dimensions before fitting
    resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        if (fitAddon && term && containerRef) {
          const { clientWidth, clientHeight } = containerRef;
          if (clientWidth === 0 || clientHeight === 0) return;
          try {
            fitAddon.fit();
            api.resizeTerminal(props.terminalId, term.cols, term.rows).catch(() => {
              // Resize failure - terminal may have exited
            });
          } catch {
            // fitAddon may throw if terminal is disposed
          }
        }
      }, 100);
    });

    resizeObserver.observe(containerRef);

    // Initial fit after render - use double rAF + delay to ensure container is sized
    const doFit = () => {
      if (fitAddon && term && containerRef && containerRef.clientWidth > 0 && containerRef.clientHeight > 0) {
        try {
          fitAddon.fit();
          api.resizeTerminal(props.terminalId, term.cols, term.rows).catch(() => {});
        } catch {
          // Ignore fit errors
        }
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        doFit();
        // Extra fit after short delay for layout stabilization
        setTimeout(doFit, 200);
        setTimeout(doFit, 500);
      });
    });
  });

  onCleanup(() => {
    unsubscribeOutput(props.terminalId, outputCallback);

    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (term) {
      term.dispose();
      term = null;
    }

    fitAddon = null;
    searchAddon = null;
  });

  return (
    <div class="terminal-pane-wrapper">
      <Show when={showSearch()}>
        <div class="terminal-search-bar">
          <input
            ref={searchInputRef}
            type="text"
            class="terminal-search-bar__input"
            placeholder="Search..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button
            class="terminal-search-bar__btn"
            onClick={handleSearchPrev}
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp size={14} />
          </button>
          <button
            class="terminal-search-bar__btn"
            onClick={handleSearchNext}
            title="Next match (Enter)"
          >
            <ChevronDown size={14} />
          </button>
          <button
            class="terminal-search-bar__btn terminal-search-bar__btn--close"
            onClick={closeSearch}
            title="Close (Escape)"
          >
            <X size={14} />
          </button>
        </div>
      </Show>
      <div
        class="terminal-container"
        ref={containerRef}
      />
    </div>
  );
};

export default TerminalPane;
