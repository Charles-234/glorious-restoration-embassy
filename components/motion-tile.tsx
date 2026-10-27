"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { PointerEvent, ReactNode } from "react";

type MotionTileProps = {
  children: ReactNode;
  className?: string;
};

const spring = { stiffness: 180, damping: 24, mass: 0.6 };

export function MotionTile({ children, className }: MotionTileProps) {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const shineOpacity = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [8, -8]),
    spring,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-8, 8]),
    spring,
  );
  const shineX = useTransform(mouseX, [-0.5, 0.5], [100, 0]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], [100, 0]);
  const backgroundPosition = useMotionTemplate`${shineX}% ${shineY}%`;
  const smoothShineOpacity = useSpring(shineOpacity, spring);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    shineOpacity.set(0.2);
  }

  function handlePointerLeave() {
    mouseX.set(0);
    mouseY.set(0);
    shineOpacity.set(0);
  }

  return (
    <div
      className={className}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: 900, position: "relative", isolation: "isolate" }}
    >
      <motion.div
        aria-hidden="true"
        className="gre-ministry-card-surface pointer-events-none absolute inset-0"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="gre-ministry-card-glare absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.45) 50%, transparent 70%)",
            backgroundPosition,
            backgroundSize: "240% 240%",
            opacity: smoothShineOpacity,
          }}
        />
      </motion.div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
