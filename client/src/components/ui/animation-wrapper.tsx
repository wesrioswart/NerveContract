import { motion } from "framer-motion";
import { equipmentAnimations } from "@/lib/animation-utils";

interface AnimationWrapperProps {
  children: React.ReactNode;
  animationType?: keyof typeof equipmentAnimations;
  delay?: number;
  className?: string;
}

export function AnimationWrapper({ 
  children, 
  animationType = "staggerItem", 
  delay = 0,
  className 
}: AnimationWrapperProps) {
  const animation = equipmentAnimations[animationType];
  
  return (
    <motion.div
      initial={animation.initial}
      animate={animation.animate}
      exit={animation.exit}
      transition={{ ...animation.transition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      variants={equipmentAnimations.staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}