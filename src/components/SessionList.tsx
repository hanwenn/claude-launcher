import type { Component } from "solid-js";
import { Show, For } from "solid-js";
import { RefreshCw } from "lucide-solid";
import { sessions, sessionsLoading, loadSessions } from "../stores/sessionStore";
import { activeFolder } from "../stores/folderStore";
import { formatPath } from "../lib/formatters";
import SessionCard from "./SessionCard";
import LaunchButton from "./LaunchButton";
import AgentSelector from "./AgentSelector";
import EmptyState from "./EmptyState";

const SessionList: Component = () => {
  const currentFolder = () => activeFolder();

  return (
    <main class="session-list">
      <Show when={currentFolder()} fallback={
        <div class="session-list__empty-wrap">
          <EmptyState variant="no-selection" />
        </div>
      }>
        {(folder) => (
          <>
            <div class="session-list__header">
              <span class="session-list__path mono">
                {folder()}
              </span>
              <div class="session-list__actions">
                <AgentSelector />
                <button
                  class="session-list__refresh-btn"
                  onClick={() => loadSessions(folder())}
                  disabled={sessionsLoading()}
                  title="刷新会话列表"
                >
                  <RefreshCw size={14} classList={{"spin-animation": sessionsLoading()}} />
                </button>
                <LaunchButton folderPath={folder()} label="新建会话" />
              </div>
            </div>

            <div class="session-list__content">
              <Show when={sessionsLoading()}>
                <div class="session-list__skeleton">
                  <div class="skeleton-card" />
                  <div class="skeleton-card" />
                  <div class="skeleton-card" />
                </div>
              </Show>

              <Show when={!sessionsLoading() && sessions().length === 0}>
                <EmptyState variant="no-sessions" />
              </Show>

              <Show when={!sessionsLoading() && sessions().length > 0}>
                <For each={sessions()}>
                  {(session, i) => (
                    <SessionCard
                      session={session}
                      folderPath={folder()}
                      index={i()}
                    />
                  )}
                </For>
              </Show>
            </div>
          </>
        )}
      </Show>
    </main>
  );
};

export default SessionList;
