import type { Component } from "solid-js";
import { createSignal } from "solid-js";
import { Lock } from "lucide-solid";
import { setProKey, validateKey } from "../lib/proGate";

interface UpgradePromptProps {
  readonly onClose: () => void;
}

const PURCHASE_URL = "https://hanwenn.github.io/claude-launcher/#pricing";

const UpgradePrompt: Component<UpgradePromptProps> = (props) => {
  const [key, setKey] = createSignal("");
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  function handleActivate(): void {
    const k = key().trim();
    if (k.length === 0) {
      setError("Please enter a license key (format: CL-XXXX-XXXX-XXXX).");
      return;
    }
    if (!validateKey(k)) {
      setError("Invalid key format. Expected: CL-XXXX-XXXX-XXXX");
      return;
    }
    setProKey(k);
    setSuccess(true);
    setTimeout(() => props.onClose(), 1500);
  }

  function handleBuyNow(): void {
    window.open(PURCHASE_URL, "_blank");
  }

  return (
    <div class="dialog-overlay" onClick={() => props.onClose()}>
      <div class="upgrade-prompt" onClick={(e) => e.stopPropagation()}>
        <div class="upgrade-prompt__icon">
          <Lock size={32} />
        </div>
        <h3 class="upgrade-prompt__title">Upgrade to Pro</h3>
        <p class="upgrade-prompt__desc">
          One-time purchase of $19. Unlock 8 panes, 5 themes, command palette, and priority support.
        </p>
        <div class="upgrade-prompt__pricing">
          <div class="upgrade-prompt__plan">
            <span class="upgrade-prompt__plan-name">Free</span>
            <span class="upgrade-prompt__plan-detail">4 panes, 3 themes</span>
          </div>
          <div class="upgrade-prompt__plan upgrade-prompt__plan--pro">
            <span class="upgrade-prompt__plan-name">Pro — $19</span>
            <span class="upgrade-prompt__plan-detail">8 panes, 5 themes, command palette</span>
          </div>
        </div>
        {success() ? (
          <p class="upgrade-prompt__success">Pro activated successfully! Enjoy all features.</p>
        ) : (
          <>
            <button
              class="upgrade-prompt__btn upgrade-prompt__btn--buy"
              onClick={handleBuyNow}
            >
              Buy Now — $19
            </button>
            <input
              type="text"
              class="upgrade-prompt__input"
              placeholder="Enter license key: CL-XXXX-XXXX-XXXX"
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
          </>
        )}
      </div>
    </div>
  );
};

export default UpgradePrompt;
