import { MotionProps } from 'framer-motion';

// Common animation presets for better user experience
export const animationPresets = {
  // Fade in animation for components appearing on page
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  
  // Subtle scale animation for clickable elements
  buttonHover: {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97 }
  },
  
  // Card animation for list items
  cardEntrance: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  },
  
  // Staggered list item animations
  listItem: (index: number): MotionProps => ({
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: 0.3,
      delay: index * 0.05
    }
  }),
  
  // Success animation for completed actions
  success: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { 
      type: "spring",
      stiffness: 200,
      damping: 10
    }
  },
  
  // Error shake animation
  errorShake: {
    animate: { 
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    }
  },
  
  // Expanding animation for panels or accordions
  expand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  // Sidebar item hover effect
  sidebarItem: {
    whileHover: { x: 5 },
    transition: { duration: 0.2 }
  },
  
  // Page transition
  pageTransition: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
    transition: { duration: 0.3 }
  },
  
  // Notification popup
  notification: {
    initial: { opacity: 0, y: -30, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 30, scale: 0.9 },
    transition: { type: "spring", stiffness: 300, damping: 15 }
  }
};

// Animation utility to stagger children animations
export function createStaggerAnimation(
  numItems: number, 
  staggerDelay: number = 0.05
) {
  return Array.from({ length: numItems }, (_, i) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * staggerDelay, duration: 0.3 }
  }));
}