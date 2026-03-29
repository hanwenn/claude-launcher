import type { Component } from "solid-js";
import { FolderPlus, Inbox, FolderOpen } from "lucide-solid";

interface EmptyStateProps {
  readonly variant: "no-folders" | "no-sessions" | "no-selection";
  readonly onAction?: () => void;
}

const config = {
  "no-folders": {
    icon: FolderPlus,
    title: "还没有工作目录",
    description: "添加一个文件夹来开始使用 Claude",
    actionLabel: "添加文件夹",
  },
  "no-sessions": {
    icon: Inbox,
    title: "此目录没有会话",
    description: "启动 Claude 开始你的第一次对话",
    actionLabel: "启动 Claude",
  },
  "no-selection": {
    icon: FolderOpen,
    title: "选择一个工作目录",
    description: "从左侧列表中选择文件夹以查看会话",
    actionLabel: null,
  },
} as const;

const EmptyState: Component<EmptyStateProps> = (props) => {
  const cfg = () => config[props.variant];

  return (
    <div class="empty-state">
      <div class="empty-state__icon">
        {(() => {
          const Icon = cfg().icon;
          return <Icon size={48} />;
        })()}
      </div>
      <h3 class="empty-state__title">{cfg().title}</h3>
      <p class="empty-state__desc">{cfg().description}</p>
      {cfg().actionLabel && props.onAction && (
        <button class="empty-state__action" onClick={props.onAction}>
          {cfg().actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
