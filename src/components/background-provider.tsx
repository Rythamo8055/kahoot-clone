"use client";

import { useEffect } from "react";

export default function BackgroundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const userBackground = localStorage.getItem("userBackground");
    if (userBackground) {
      document.body.style.backgroundImage = `url('${userBackground}')`;
    }
  }, []);

  return <>{children}</>;
}
