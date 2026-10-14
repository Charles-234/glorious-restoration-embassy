"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const pageMotion = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="popLayout">
      <motion.div key={pathname} initial="initial" animate="animate" exit="exit" variants={pageMotion} transition={pageMotion.transition} className="relative flex-grow">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
