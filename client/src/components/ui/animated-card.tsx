import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { equipmentAnimations } from "@/lib/animation-utils";
import { ComponentPropsWithoutRef } from "react";

interface AnimatedCardProps extends ComponentPropsWithoutRef<typeof Card> {
  animationType?: keyof typeof equipmentAnimations;
  delay?: number;
  children?: React.ReactNode;
}

export function AnimatedCard({ 
  animationType = "slideInRight", 
  delay = 0, 
  children, 
  className,
  ...props 
}: AnimatedCardProps) {
  const animation = equipmentAnimations[animationType];
  
  // Handle different animation types safely
  const motionProps: any = {};
  
  if (animation.initial) motionProps.initial = animation.initial;
  if (animation.animate) motionProps.animate = animation.animate;
  if (animation.exit) motionProps.exit = animation.exit;
  if (animation.whileHover) motionProps.whileHover = animation.whileHover;
  
  if (animation.transition) {
    motionProps.transition = { ...animation.transition, delay };
  } else if (delay > 0) {
    motionProps.transition = { delay };
  }
  
  return (
    <motion.div {...motionProps}>
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}