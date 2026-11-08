import { Platform } from "react-native";

// Web (e.g. iPhone Safari): holding the on-screen d-pad must not select text or open the callout menu.
if (Platform.OS === "web" && typeof document !== "undefined" && !document.getElementById("no-select-style")) {
  const style = document.createElement("style");
  style.id = "no-select-style";
  style.textContent = `html, body, body * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
input, textarea, input *, textarea * { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }`;
  document.head.appendChild(style);
  const allow = (t: EventTarget | null) => !!(t as Element | null)?.closest?.("input,textarea");
  document.addEventListener("contextmenu", (e) => { if (!allow(e.target)) e.preventDefault(); }, { capture: true });
  document.addEventListener("selectstart", (e) => { if (!allow(e.target)) e.preventDefault(); }, { capture: true });
}
