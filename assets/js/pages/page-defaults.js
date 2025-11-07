import { loadHeader } from "../components/header.js";
import { initDropdown } from "../components/dropdown.js";
import { initSignup } from "../components/signup.js";
import { loadFooter } from "../components/footer.js";

async function safeLoad(fn, name) {
  try {
    await fn();
  } catch (err) {
  }
}

async function initPage() {
  // Load header & footer in parallel
  await Promise.all([
    safeLoad(loadHeader, "Header"), 
    safeLoad(loadFooter, "Footer")
  ]);

  // Now fire a custom event so other modules can hook in
  document.dispatchEvent(new Event("base:ready"));

  // Init other components that depend on header/footer
  initDropdown();
  initSignup();
}

initPage();