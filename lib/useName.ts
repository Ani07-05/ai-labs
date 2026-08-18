"use client";

import { useEffect, useState } from "react";

const KEY = "ai-labs-name";

export function useName() {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored) setName(stored);
  }, []);

  function save(newName: string) {
    window.localStorage.setItem(KEY, newName);
    setName(newName);
  }

  return { name, setName: save };
}
