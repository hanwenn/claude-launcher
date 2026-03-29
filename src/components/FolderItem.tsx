import type { Component } from "solid-js";
import { createSignal, Show } from "solid-js";
import { Folder, FolderOpen, Trash2 } from "lucide-solid";
import type { FolderInfo } from "../types";

interface FolderItemProps {
  readonly folder: FolderInfo;
  readonly isActive: boolean;
  readonly onSelect: () => void;
  readonly onRemove: () => void;
}

const FolderItem: Component<FolderItemProps> = (props) => {
  const [hovered, setHovered] = createSignal(false);

  return (
    <div
      class="folder-item"
      classList={{
        "folder-item--active": props.isActive,
        "folder-item--hover": hovered(),
      }}
      onClick={props.onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={props.folder.path}
    >
      <div class="folder-item__icon">
        {props.isActive ? <FolderOpen size={16} /> : <Folder size={16} />}
      </div>
      <span class="folder-item__name truncate">{props.folder.display_name}</span>
      <Show when={props.folder.session_count > 0}>
        <span class="folder-item__badge">{props.folder.session_count}</span>
      </Show>
      <Show when={hovered()}>
        <button
          class="folder-item__delete"
          onClick={(e) => {
            e.stopPropagation();
            props.onRemove();
          }}
          title="移除文件夹"
        >
          <Trash2 size={14} />
        </button>
      </Show>
    </div>
  );
};

export default FolderItem;
