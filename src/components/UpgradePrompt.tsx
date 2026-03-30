import type { Component } from "solid-js";
import { createSignal } from "solid-js";
import { Lock } from "lucide-solid";
import { setProKey, isProUser } from "../lib/proGate";

interface UpgradePromptProps {
  readonly onClose: () => void;
}

const UpgradePrompt: Component<UpgradePromptProps> = (props) => {
  const [key, setKey] = createSignal("");
  const [error, setError] = createSignal("");

  function handleActivate(): void {
    const k = key().trim();
    if (k.length === 0) {
      setError("Please enter a license key.");
      return;
    }
    setProKey(k);
    props.onClose();
  }

  return (
    <div class="dialog-overlay" onClick={() => props.onClose()}>
      <div class="upgrade-prompt" onClick={(e) => e.stopPropagation()}>
        <div class="upgrade-prompt__icon">
          <Lock size={32} />
        </div>
        <h3 class="upgrade-prompt__title">Upgrade to Pro</h3>
        <p class="upgrade-prompt__desc">
          Free users can use up to 4 terminal panes. Upgrade to Pro to unlock up to 8 panes and future premium features.
        </p>
        <div class="upgrade-prompt__pricing">
          <div class="upgrade-prompt__plan">
            <span class="upgrade-prompt__plan-name">Free</span>
            <span class="upgrade-prompt__plan-detail">4 panes</span>
          </div>
          <div class="upgrade-prompt__plan upgrade-prompt__plan--pro">
            <span class="upgrade-prompt__plan-name">Pro</span>
            <span class="upgrade-prompt__plan-detail">8 panes + more</span>
          </div>
        </div>
        <input
          type="text"
          class="upgrade-prompt__input"
          placeholder="Enter license key..."
          value={key()}
          onInput={(e) => { setKey(e.currentTarget.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleActivate(); }}
        />
        {error() && <p class="upgrade-prompt__error">{error()}</p>}
        <div class="upgrade-prompt__actions">
          <button class="upgrade-prompt__btn upgrade-prompt__btn--cancel" onClick={() => props.onClose()}>
            Cancel
          </button>
          <button class="upgrade-prompt__btn upgrade-prompt__btn--activate" onClick={handleActivate}>
            Activate Pro
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
