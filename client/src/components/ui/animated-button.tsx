import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { equipmentAnimations } from "@/lib/animation-utils";
import { useState } from "react";

interface AnimatedButtonProps extends ButtonProps {
  animationType?: "bounceAction" | "statusChange";
  loadingText?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function AnimatedButton({ 
  animationType = "bounceAction",
  loadingText,
  isLoading = false,
  children,
  disabled,
  onClick,
  ...props 
}: AnimatedButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || isAnimating) return;
    
    setIsAnimating(true);
    
    if (onClick) {
      await onClick(e);
    }
    
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 800);
  };

  const animation = equipmentAnimations[animationType];
  
  return (
    <motion.div
      animate={isAnimating ? animation.animate : animation.initial}
      transition={animation.transition}
    >
      <Button 
        {...props}
        disabled={disabled || isLoading || isAnimating}
        onClick={handleClick}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
            {loadingText || "Loading..."}
          </div>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  );
}