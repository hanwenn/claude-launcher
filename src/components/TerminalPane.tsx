import type { Component } from "solid-js";
import { onMount, onCleanup } from "solid-js";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
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
  let term: Terminal | null = null;
  let fitAddon: FitAddon | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

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
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef);

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

    // ResizeObserver with debounce
    resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        if (fitAddon && term) {
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
      if (fitAddon && term && containerRef && containerRef.clientWidth > 0) {
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
  });

  return (
    <div
      class="terminal-container"
      ref={containerRef}
    />
  );
};

export default TerminalPane;
