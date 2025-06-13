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
  
  // Handle different animation types safely
  const motionProps: any = { className };
  
  if (animation.initial) motionProps.initial = animation.initial;
  if (animation.animate) motionProps.animate = animation.animate;
  if (animation.exit) motionProps.exit = animation.exit;
  
  if (animation.transition) {
    motionProps.transition = { ...animation.transition, delay };
  } else if (delay > 0) {
    motionProps.transition = { delay };
  }
  
  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  const containerAnimation = equipmentAnimations.staggerContainer;
  
  return (
    <motion.div
      initial={containerAnimation.initial}
      animate={containerAnimation.animate}
      className={className}
    >
      {children}
    </motion.div>
  );
}