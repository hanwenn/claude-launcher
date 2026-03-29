import { render } from "solid-js/web";
import DashboardApp from "./DashboardApp";
import "./styles/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

render(() => <DashboardApp />, root);
