import type { Component } from "solid-js";
import { Show, For, createSignal } from "solid-js";
import { FolderPlus, RefreshCw } from "lucide-solid";
import {
  folders,
  activeFolder,
  foldersLoading,
  selectFolder,
  removeFolderByPath,
  loadFolders,
} from "../stores/folderStore";
import FolderItem from "./FolderItem";
import EmptyState from "./EmptyState";

interface FolderListProps {
  readonly onAddFolder: () => void;
}

const FolderList: Component<FolderListProps> = (props) => {
  const [refreshing, setRefreshing] = createSignal(false);

  async function handleRefreshAll() {
    setRefreshing(true);
    try {
      await loadFolders();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <aside class="folder-list">
      <div class="folder-list__header">
        <span class="folder-list__title">工作目录</span>
        <div class="folder-list__header-actions">
          <button
            class="folder-list__icon-btn"
            onClick={handleRefreshAll}
            disabled={refreshing()}
            title="刷新所有目录的会话信息"
          >
            <RefreshCw size={14} classList={{"spin-animation": refreshing()}} />
          </button>
          <button
            class="folder-list__icon-btn"
            onClick={props.onAddFolder}
            title="添加文件夹"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      <div class="folder-list__content">
        <Show when={foldersLoading()}>
          <div class="folder-list__skeleton">
            <div class="skeleton-item" />
            <div class="skeleton-item" />
            <div class="skeleton-item" />
          </div>
        </Show>

        <Show when={!foldersLoading() && folders().length === 0}>
          <EmptyState variant="no-folders" onAction={props.onAddFolder} />
        </Show>

        <Show when={!foldersLoading() && folders().length > 0}>
          <For each={folders()}>
            {(folder) => (
              <FolderItem
                folder={folder}
                isActive={activeFolder() === folder.path}
                onSelect={() => selectFolder(folder.path)}
                onRemove={async () => {
                  try {
                    await removeFolderByPath(folder.path);
                  } catch (err) {
                    console.error("Failed to remove folder:", err);
                  }
                }}
              />
            )}
          </For>
        </Show>
      </div>
    </aside>
  );
};

export default FolderList;
