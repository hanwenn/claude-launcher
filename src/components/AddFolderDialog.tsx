import type { Component } from "solid-js";
import { createSignal, Show, onCleanup, onMount } from "solid-js";
import { X, FolderOpen } from "lucide-solid";

interface AddFolderDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (path: string) => void;
}

const AddFolderDialog: Component<AddFolderDialogProps> = (props) => {
  const [path, setPath] = createSignal("");
  const [error, setError] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;

  function handleClose() {
    setPath("");
    setError("");
    props.onClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      handleClose();
    }
  }

  async function handleBrowse() {
    try {
      const selected = await window.electronAPI.openFolderDialog();
      if (selected) {
        setPath(selected);
        setError("");
      }
    } catch (err) {
      console.error("Folder picker failed:", err);
    }
  }

  async function handleConfirm() {
    const trimmed = path().trim();
    if (!trimmed) {
      setError("请输入文件夹路径");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await props.onConfirm(trimmed);
      handleClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Show when={props.isOpen}>
      <div
        class="dialog-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        onKeyDown={handleKeyDown}
      >
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog__header">
            <h2 class="dialog__title">添加工作目录</h2>
            <button class="dialog__close" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>

          <div class="dialog__body">
            <label class="dialog__label">文件夹路径</label>
            <div class="dialog__input-row">
              <input
                ref={(el) => {
                  inputRef = el;
                  queueMicrotask(() => el.focus());
                }}
                class="dialog__input"
                type="text"
                placeholder="D:\\Projects\\my-project"
                value={path()}
                onInput={(e) => {
                  setPath(e.currentTarget.value);
                  setError("");
                }}
                disabled={submitting()}
              />
              <button
                class="dialog__browse-btn"
                onClick={handleBrowse}
                disabled={submitting()}
              >
                <FolderOpen size={16} />
                <span>浏览</span>
              </button>
            </div>

            <Show when={error()}>
              <p class="dialog__error">{error()}</p>
            </Show>
          </div>

          <div class="dialog__footer">
            <button
              class="dialog__cancel-btn"
              onClick={handleClose}
              disabled={submitting()}
            >
              取消
            </button>
            <button
              class="dialog__confirm-btn"
              onClick={handleConfirm}
              disabled={!path().trim() || submitting()}
            >
              {submitting() ? "添加中..." : "添加"}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default AddFolderDialog;
