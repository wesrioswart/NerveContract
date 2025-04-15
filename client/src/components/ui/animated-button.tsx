import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { animationPresets } from "@/lib/animation-utils";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success";
  size?: "default" | "sm" | "lg" | "icon";
  animation?: "default" | "success" | "subtle" | "bounce" | "none";
  isLoading?: boolean;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    animation = "default",
    isLoading = false,
    children, 
    ...props 
  }, ref) => {
    const getAnimationProps = () => {
      switch (animation) {
        case "success":
          return animationPresets.success;
        case "subtle":
          return {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 }
          };
        case "bounce":
          return {
            whileHover: { y: -3 },
            whileTap: { y: 2 }
          };
        case "none":
          return {};
        default:
          return animationPresets.buttonHover;
      }
    };

    return (
      <motion.div {...getAnimationProps()}>
        <Button
          className={cn(className)}
          variant={variant}
          size={size}
          ref={ref}
          disabled={isLoading}
          {...props}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          ) : (
            children
          )}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };