import { createSignal } from "solid-js";

type ViewMode = 'browser' | 'dashboard';

const [viewMode, setViewMode] = createSignal<ViewMode>('browser');

export { viewMode, setViewMode };

export function switchToDashboard(): void {
  setViewMode('dashboard');
}

export function switchToBrowser(): void {
  setViewMode('browser');
}
