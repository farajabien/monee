/**
 * Mobile-First Design System for Onboarding
 * Optimized for thumb reach and touch interactions
 */

export const MOBILE_CONFIG = {
  // Touch targets (minimum 44x44px for accessibility)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Button sizing
  button: {
    mobile: 'px-6 py-4 text-base',
    desktop: 'sm:px-4 sm:py-2 sm:text-sm',
    full: 'px-6 py-4 text-base sm:px-4 sm:py-2 sm:text-sm',
  },
  
  // Input fields (16px minimum to prevent iOS zoom)
  input: {
    text: 'text-base min-h-[44px]',
    padding: 'px-4 py-3',
  },
  
  // Spacing
  spacing: {
    formGap: 'gap-6 sm:gap-4',
    sectionGap: 'space-y-8 sm:space-y-6',
    cardPadding: 'p-6 sm:p-4',
    betweenInputs: 'space-y-6 sm:space-y-4',
  },
  
  // Grid layouts
  grid: {
    categories: 'grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3',
    twoColumn: 'grid-cols-1 sm:grid-cols-2 gap-4',
  },
  
  // Typography
  text: {
    title: 'text-2xl sm:text-xl',
    subtitle: 'text-base sm:text-sm',
    label: 'text-base sm:text-sm',
    helper: 'text-sm sm:text-xs',
  },
};

export const STEP_CONFIG = {
  // Simplified 4-step flow
  steps: [
    {
      id: 1,
      key: 'currency',
      title: 'Choose Your Currency',
      description: 'Select your preferred currency for tracking expenses',
      required: true,
      canSkip: false,
    },
    {
      id: 2,
      key: 'categories',
      title: 'Select Categories',
      description: 'Pick categories that match your spending habits',
      required: true,
      canSkip: false,
      defaultAction: 'Use recommended categories',
    },
    {
      id: 3,
      key: 'income',
      title: 'Add Income Sources',
      description: 'Optional: Tell us about your income',
      required: false,
      canSkip: true,
    },
    {
      id: 4,
      key: 'goals',
      title: 'Set Your Goals',
      description: 'Optional: Add savings goals or debts',
      required: false,
      canSkip: true,
    },
  ],
};

// Animation variants for mobile
export const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};
