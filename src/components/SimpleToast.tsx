"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function toast(message: string, type: "success" | "error" = "success") {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  notify();
  
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3000);
}

toast.success = (message: string) => toast(message, "success");
toast.error = (message: string) => toast(message, "error");

export function useSimpleToast() {
  const [, setState] = useState<Toast[]>([]);

  useCallback(() => {
    const listener = (newToasts: Toast[]) => setState(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);
}

export function SimpleToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useCallback(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {currentToasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2 ${
            t.type === "success"
              ? "bg-green-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
