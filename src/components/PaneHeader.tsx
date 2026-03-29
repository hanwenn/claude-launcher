import type { Component } from "solid-js";
import { Show } from "solid-js";
import { GripVertical, Maximize2, Minimize2, X } from "lucide-solid";
import type { TerminalInstance } from "../types";

interface PaneHeaderProps {
  readonly terminal: TerminalInstance;
  readonly onClose: () => void;
  readonly onMaximize: () => void;
  readonly isMaximized: boolean;
  readonly onDragStart?: () => void;
  readonly onDragEnd?: () => void;
}

const PaneHeader: Component<PaneHeaderProps> = (props) => {
  const statusColor = () => props.terminal.status === 'running' ? 'var(--accent-green)' : 'var(--text-muted)';
  const sessionSnippet = () => {
    const sid = props.terminal.sessionId;
    if (!sid) return null;
    return sid.length > 12 ? sid.slice(0, 12) + '...' : sid;
  };

  return (
    <div
      class="pane-header"
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer?.setData("text/plain", props.terminal.id);
        props.onDragStart?.();
      }}
      onDragEnd={() => props.onDragEnd?.()}
    >
      <div class="pane-header__info">
        <span class="pane-header__drag-handle">
          <GripVertical size={14} />
        </span>
        <span
          class="pane-header__status-dot"
          style={{ background: statusColor() }}
        />
        <span class="pane-header__folder truncate">
          {props.terminal.folderDisplayName}
        </span>
        <Show when={sessionSnippet()}>
          {(snippet) => (
            <span class="pane-header__session mono">{snippet()}</span>
          )}
        </Show>
      </div>
      <div class="pane-header__controls">
        <button
          class="pane-header__btn"
          onClick={props.onMaximize}
          title={props.isMaximized ? "还原" : "最大化"}
        >
          <Show when={props.isMaximized} fallback={<Maximize2 size={14} />}>
            <Minimize2 size={14} />
          </Show>
        </button>
        <button
          class="pane-header__btn pane-header__btn--close"
          onClick={props.onClose}
          title="关闭终端"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default PaneHeader;
