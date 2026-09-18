import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Sonner } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

try {
  const stored = localStorage.getItem("stm:theme");
  document.documentElement.classList.toggle("dark", stored === "dark");
} catch {
  /* abaikan */
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Sonner richColors position="top-right" />
    </BrowserRouter>
  </StrictMode>
);