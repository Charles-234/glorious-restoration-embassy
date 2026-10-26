"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Container?: new (options?: Record<string, unknown>) => {
      element: HTMLDivElement;
      canvas: HTMLCanvasElement;
      updateSizeFromDOM: () => void;
    };
    html2canvas?: {
      // html2canvas is a runtime global, but the project does not import it.
      // Type is intentionally loose to keep the browser-only bridge simple.
      [key: string]: unknown;
    };
  }
}

export function LiquidGlassHeroActions({
  children,
}: {
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<{
    element: HTMLDivElement;
    canvas: HTMLCanvasElement;
    updateSizeFromDOM: () => void;
  } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let isCancelled = false;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
            return;
          }
          existing.addEventListener("load", () => {
            existing.dataset.loaded = "true";
            resolve();
          }, { once: true });
          existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
          script.dataset.loaded = "true";
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });

    const initializeGlass = () => {
      if (!window.Container || !window.html2canvas) return;

      const shell = new window.Container({
        borderRadius: 32,
        type: "pill",
        tintOpacity: 0.16,
      });

      shell.element.classList.add("liquid-glass-hero-shell");
      shell.element.style.position = "absolute";
      shell.element.style.inset = "0";
      shell.element.style.width = "100%";
      shell.element.style.height = "100%";
      shell.element.style.pointerEvents = "none";
      shell.element.style.zIndex = "0";
      shell.element.style.border = "1px solid rgba(255,255,255,0.2)";
      shell.element.style.boxShadow = "0 28px 80px -34px rgba(6, 24, 48, 0.38)";
      shell.canvas.style.pointerEvents = "none";
      shell.canvas.style.zIndex = "0";

      host.appendChild(shell.element);
      shell.updateSizeFromDOM();
      instanceRef.current = shell;
    };

    const hasUnsupportedColorSyntax = () => {
      const hasUnsupportedColorRule = (rules: CSSRuleList): boolean =>
        Array.from(rules).some((rule) => {
          if (/(?:color-mix|oklab|oklch|lab\(|lch\(|color\(srgb)/i.test(rule.cssText)) {
            return true;
          }

          return rule instanceof CSSGroupingRule
            ? hasUnsupportedColorRule(rule.cssRules)
            : false;
        });

      return Array.from(document.styleSheets).some((sheet) => {
        try {
          return hasUnsupportedColorRule(sheet.cssRules);
        } catch {
          return false;
        }
      });
    };

    const bootstrap = async () => {
      if (isCancelled) return;

      try {
        if (hasUnsupportedColorSyntax()) return;

        if (!window.html2canvas) {
          await loadScript("/liquid-glass-js/html2canvas.min.js");
        }
        if (!window.Container) {
          await loadScript("/liquid-glass-js/container.js");
        }
        if (!isCancelled) {
          initializeGlass();
        }
      } catch {
        console.warn("Liquid Glass JS could not initialize; using the CSS fallback.");
      }
    };

    if (window.Container && typeof window.html2canvas === "function") {
      initializeGlass();
    } else {
      void bootstrap();
    }

    return () => {
      isCancelled = true;
      const shell = instanceRef.current;
      if (shell?.element?.parentNode) {
        shell.element.parentNode.removeChild(shell.element);
      }
      instanceRef.current = null;
    };
  }, []);

  return (
    <div className="gre-hero-actions-shell">
      <div ref={hostRef} className="liquid-glass-hero-surface" aria-hidden="true" />
      {children}
    </div>
  );
}
