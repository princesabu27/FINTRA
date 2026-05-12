"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";

type Platform = "android" | "ios" | "other";

function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(getPlatform());

    // Hide if already running as standalone (installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Android / desktop: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions after a short delay if not dismissed before
    const iosTimer = setTimeout(() => {
      if (getPlatform() === "ios" && !localStorage.getItem("pwa-prompt-dismissed")) {
        setVisible(true);
      }
    }, 3000);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(iosTimer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setVisible(false);
    setPrompt(null);
  }, [prompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem("pwa-prompt-dismissed", "1");
  }, []);

  if (installed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-2xl mx-auto"
        >
          <div className="bg-card border border-brand/30 rounded-2xl px-4 py-4 shadow-2xl shadow-brand/10">
            <div className="flex items-start gap-3">
              {/* App icon */}
              <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-96x96.png" alt="Fintra" width={40} height={40} className="rounded-xl" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">Add Fintra to Home Screen</p>
                {platform === "ios" ? (
                  <p className="text-pale text-xs mt-1 leading-relaxed">
                    Tap <Share size={11} className="inline mx-0.5 relative -top-px" /> then
                    <span className="text-white font-medium"> "Add to Home Screen"</span> for the full app experience.
                  </p>
                ) : (
                  <p className="text-pale text-xs mt-1 leading-relaxed">
                    Install for offline access, faster loading, and a native app feel.
                  </p>
                )}
              </div>

              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-surface flex items-center justify-center shrink-0 -mt-0.5"
              >
                <X size={14} className="text-muted" />
              </button>
            </div>

            {platform !== "ios" && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleInstall}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold text-sm py-2.5 rounded-xl shadow-lg shadow-brand/30"
              >
                <Download size={15} />
                Install App
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
