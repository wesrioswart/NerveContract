import { motion } from "framer-motion";
import { Card, CardProps } from "@/components/ui/card";
import { equipmentAnimations } from "@/lib/animation-utils";

interface AnimatedCardProps extends CardProps {
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
  
  return (
    <motion.div
      initial={animation.initial}
      animate={animation.animate}
      exit={animation.exit}
      transition={{ ...animation.transition, delay }}
      {...(animationType === "cardHover" ? equipmentAnimations.cardHover : {})}
    >
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}