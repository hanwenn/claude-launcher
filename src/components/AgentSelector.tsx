import type { Component } from "solid-js";
import { createSignal, For, Show, onCleanup } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { agents, selectedAgentId, setSelectedAgentId, selectedAgent } from "../stores/agentStore";

const AgentSelector: Component = () => {
  const [open, setOpen] = createSignal(false);
  let dropdownRef: HTMLDivElement | undefined;

  function handleClickOutside(e: MouseEvent): void {
    if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
      setOpen(false);
    }
  }

  function toggleDropdown(): void {
    const next = !open();
    setOpen(next);
    if (next) {
      document.addEventListener("click", handleClickOutside, { once: true });
    }
  }

  function handleSelect(agentId: string): void {
    setSelectedAgentId(agentId);
    setOpen(false);
  }

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  return (
    <div class="agent-selector" ref={dropdownRef}>
      <button
        class="agent-selector__trigger"
        onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
        title="选择 AI Agent"
      >
        <span
          class="agent-selector__dot"
          style={{ background: selectedAgent().color }}
        />
        <span class="agent-selector__name">{selectedAgent().name}</span>
        <ChevronDown size={14} class="agent-selector__chevron" classList={{ "agent-selector__chevron--open": open() }} />
      </button>

      <Show when={open()}>
        <div class="agent-selector__dropdown">
          <For each={agents()}>
            {(agent) => (
              <button
                class="agent-selector__option"
                classList={{ "agent-selector__option--active": agent.id === selectedAgentId() }}
                onClick={(e) => { e.stopPropagation(); handleSelect(agent.id); }}
              >
                <span
                  class="agent-selector__dot"
                  style={{ background: agent.color }}
                />
                <span class="agent-selector__option-name">{agent.name}</span>
                <Show when={agent.id === selectedAgentId()}>
                  <span class="agent-selector__check">&#10003;</span>
                </Show>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default AgentSelector;
