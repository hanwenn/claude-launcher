import type { Component } from "solid-js";
import { Show } from "solid-js";
import { MessageSquare } from "lucide-solid";
import type { SessionInfo } from "../types";
import { formatDate, truncateSummary } from "../lib/formatters";
import { activeSessions } from "../stores/sessionStore";
import LaunchButton from "./LaunchButton";

interface SessionCardProps {
  readonly session: SessionInfo;
  readonly folderPath: string;
  readonly index: number;
}

function modelBadgeClass(model: string | null): string {
  if (!model) return "session-card__badge";
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return "session-card__badge session-card__badge--opus";
  if (lower.includes("sonnet")) return "session-card__badge session-card__badge--sonnet";
  if (lower.includes("haiku")) return "session-card__badge session-card__badge--haiku";
  return "session-card__badge";
}

function modelLabel(model: string | null): string {
  if (!model) return "unknown";
  return model;
}

const SessionCard: Component<SessionCardProps> = (props) => {
  const isActive = () => activeSessions().includes(props.session.id);

  return (
    <div
      class="session-card"
      classList={{ "session-card--active": isActive() }}
      style={{ "animation-delay": `${props.index * 50}ms` }}
    >
      <div class="session-card__header">
        <div class="session-card__meta">
          <Show when={isActive()}>
            <span class="session-card__active-badge">
              <span style={{ width: "6px", height: "6px", "border-radius": "50%", background: "var(--accent-green)", display: "inline-block" }} />
              运行中
            </span>
          </Show>
          <Show when={props.session.model}>
            <span class={modelBadgeClass(props.session.model)}>
              {modelLabel(props.session.model)}
            </span>
          </Show>
          <span class="session-card__date">{formatDate(props.session.timestamp)}</span>
        </div>
        <div class="session-card__msg-count">
          <MessageSquare size={12} />
          <span>{props.session.message_count}</span>
        </div>
      </div>

      <p class="session-card__summary">
        {truncateSummary(props.session.summary, 120)}
      </p>

      <div class="session-card__footer">
        <span class="session-card__id mono">
          {props.session.id.slice(0, 16)}
        </span>
        <LaunchButton
          folderPath={props.folderPath}
          sessionId={props.session.id}
          label="恢复会话"
          variant="outline"
          disabled={isActive()}
        />
      </div>
    </div>
  );
};

export default SessionCard;
