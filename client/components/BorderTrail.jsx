
import { motion } from "framer-motion";
import { cn } from "../utils/styleUtils.js";

export function BorderTrail({
  className,
  size = 80, // Increased from 60 to 80
  transition,
  delay,
  onAnimationComplete,
  style,
}) {
  const BASE_TRANSITION = {
    repeat: Infinity,
    duration: 5,
    ease: "linear",
  };

  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#3b82f6,#3b82f6)]">
      <motion.div
        className={cn("absolute aspect-square bg-blue-500", className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          ...style,
        }}
        animate={{
          offsetDistance: ["0%", "100%"],
        }}
        transition={{
          ...(transition ?? BASE_TRANSITION),
          delay: delay,
        }}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}
