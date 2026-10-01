"use client";

import { useEffect, useState } from "react";

type Mode = "real" | "prototype";

export function PrototypeSwitcher() {
  const [mode, setMode] = useState<Mode>("prototype");

  useEffect(() => {
    const saved = localStorage.getItem("diip-visual-mode");
    const initial: Mode = saved === "real" ? "real" : "prototype";
    document.body.classList.toggle("prototype-mode", initial === "prototype");
    const timer = window.setTimeout(() => setMode(initial), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const select = (next: Mode) => {
    document.body.classList.toggle("prototype-mode", next === "prototype");
    localStorage.setItem("diip-visual-mode", next);
    setMode(next);
  };

  return (
    <>
    </>
  );
}
