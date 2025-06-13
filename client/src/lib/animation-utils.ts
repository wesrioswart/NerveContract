// Animation utilities for equipment interactions and loading states

export const equipmentAnimations = {
  // Slide in from right animation for equipment cards
  slideInRight: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },

  // Fade and scale animation for equipment status changes
  statusChange: {
    initial: { scale: 1, opacity: 1 },
    animate: { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] },
    transition: { duration: 0.6, ease: "easeInOut" }
  },

  // Bounce animation for equipment hire/off-hire actions
  bounceAction: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.2, 0.9, 1.1, 1] },
    transition: { duration: 0.8, ease: "easeInOut" }
  },

  // Loading pulse animation for equipment data
  loadingPulse: {
    animate: { 
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.02, 1]
    },
    transition: { 
      duration: 1.5, 
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Stagger animation for equipment lists
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },

  staggerItem: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: "easeOut" }
  },

  // Equipment scan animation (QR code scanning effect)
  scanEffect: {
    initial: { scaleY: 0, opacity: 0 },
    animate: { 
      scaleY: [0, 1, 1, 0],
      opacity: [0, 1, 1, 0],
      y: [0, 0, 100, 100]
    },
    transition: { 
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Success checkmark animation
  successCheck: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 0.8, ease: "easeOut" }
  },

  // Equipment status indicator pulse
  statusPulse: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.8, 1, 0.8]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Modal slide up animation
  modalSlideUp: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },

  // Equipment card hover effect
  cardHover: {
    whileHover: { 
      scale: 1.02,
      y: -4,
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
    },
    transition: { duration: 0.2 }
  }
};

// Predefined loading states for different equipment operations
export const equipmentLoadingStates = {
  scanning: "Scanning equipment...",
  updating: "Updating status...",
  hiring: "Processing hire request...",
  returning: "Processing return...",
  validating: "Validating documents...",
  calculating: "Calculating costs...",
  syncing: "Syncing with system...",
  generating: "Generating report..."
};

// Equipment status colors and animations
export const equipmentStatusConfig = {
  "available": {
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    animation: equipmentAnimations.statusPulse
  },
  "on-hire": {
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    animation: equipmentAnimations.statusPulse
  },
  "maintenance": {
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    animation: equipmentAnimations.statusPulse
  },
  "off-hire": {
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    animation: equipmentAnimations.statusPulse
  },
  "overdue": {
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    animation: equipmentAnimations.statusPulse
  }
};

// Equipment operation icons with animations
export const equipmentIcons = {
  hire: "📋",
  return: "↩️",
  scan: "📷",
  maintenance: "🔧",
  validate: "✅",
  alert: "⚠️"
};