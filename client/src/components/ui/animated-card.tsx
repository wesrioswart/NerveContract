import { HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { animationPresets } from "@/lib/animation-utils";

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  animation?: "default" | "fade" | "slide" | "hover" | "none";
  index?: number;
  delay?: number;
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, animation = "default", index = 0, delay = 0, children, ...props }, ref) => {
    const getAnimationProps = () => {
      const baseDelay = delay || index * 0.1;
      
      switch (animation) {
        case "fade":
          return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.4, delay: baseDelay }
          };
        case "slide":
          return {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { duration: 0.4, delay: baseDelay }
          };
        case "hover":
          return {
            ...animationPresets.cardEntrance,
            transition: { duration: 0.4, delay: baseDelay },
            whileHover: { y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }
          };
        case "none":
          return {};
        default:
          return {
            ...animationPresets.cardEntrance,
            transition: { duration: 0.4, delay: baseDelay }
          };
      }
    };

    return (
      <motion.div {...getAnimationProps()}>
        <Card
          ref={ref}
          className={cn("transition-all duration-300", className)}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };