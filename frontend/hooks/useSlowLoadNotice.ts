"use client";

import { useEffect, useState } from "react";

export function useSlowLoadNotice(isLoading: boolean, delayMs = 8000) {
  const [showSlowLoadNotice, setShowSlowLoadNotice] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSlowLoadNotice(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowLoadNotice(true);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, isLoading]);

  return showSlowLoadNotice;
}
