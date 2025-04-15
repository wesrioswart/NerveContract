import { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";
import { animationPresets } from "@/lib/animation-utils";

type AnimationType = "fadeIn" | "slideUp" | "slideIn" | "scale" | "success" | "notification" | "none";

interface AnimationWrapperProps extends MotionProps {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  once?: boolean;
  as?: React.ElementType;
  className?: string;
}

export function AnimationWrapper({
  children,
  type = "fadeIn",
  delay = 0,
  once = true,
  as = "div",
  className,
  ...props
}: AnimationWrapperProps) {
  // Define animation properties based on type
  const getAnimationProps = () => {
    const baseDelay = delay;
    
    switch (type) {
      case "fadeIn":
        return {
          ...animationPresets.fadeIn,
          transition: { 
            duration: 0.5, 
            delay: baseDelay 
          }
        };
      case "slideUp":
        return {
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { 
            duration: 0.5, 
            delay: baseDelay 
          }
        };
      case "slideIn":
        return {
          initial: { opacity: 0, x: -30 },
          animate: { opacity: 1, x: 0 },
          transition: { 
            duration: 0.5, 
            delay: baseDelay 
          }
        };
      case "scale":
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: { 
            duration: 0.4, 
            delay: baseDelay 
          }
        };
      case "success":
        return {
          ...animationPresets.success,
          transition: {
            ...animationPresets.success.transition,
            delay: baseDelay
          }
        };
      case "notification":
        return {
          ...animationPresets.notification,
          transition: {
            ...animationPresets.notification.transition,
            delay: baseDelay
          }
        };
      case "none":
        return {};
      default:
        return {
          ...animationPresets.fadeIn,
          transition: { 
            duration: 0.5, 
            delay: baseDelay 
          }
        };
    }
  };

  const animProps = getAnimationProps();

  // Different elements based on the 'as' prop
  if (as === "span") {
    return (
      <motion.span
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.span>
    );
  } else if (as === "section") {
    return (
      <motion.section
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.section>
    );
  } else if (as === "article") {
    return (
      <motion.article
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.article>
    );
  } else if (as === "header") {
    return (
      <motion.header
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.header>
    );
  } else if (as === "footer") {
    return (
      <motion.footer
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.footer>
    );
  } else if (as === "h1") {
    return (
      <motion.h1
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.h1>
    );
  } else if (as === "h2") {
    return (
      <motion.h2
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.h2>
    );
  } else if (as === "p") {
    return (
      <motion.p
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.p>
    );
  } else {
    // Default to div
    return (
      <motion.div
        className={className}
        viewport={{ once }}
        {...animProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
}