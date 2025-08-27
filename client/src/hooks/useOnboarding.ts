import { useState, useEffect } from "react";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: "top" | "bottom" | "left" | "right";
  character: {
    emotion: "happy" | "excited" | "pointing" | "waving" | "thumbsup";
    message: string;
  };
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to ToyX!",
    description: "Hi there! I'm Toby, your friendly toy exchange guide. Let me show you around!",
    character: {
      emotion: "waving",
      message: "Welcome to the most fun way to share toys!"
    }
  },
  {
    id: "upload",
    title: "Share Your Toys",
    description: "Tap the + button to list toys your kids have outgrown. Other families will love them!",
    target: "[data-onboarding='upload-button']",
    position: "top",
    character: {
      emotion: "pointing",
      message: "Start by sharing a toy you no longer need!"
    }
  },
  {
    id: "search",
    title: "Discover Amazing Toys",
    description: "Browse toys from your community. Use filters to find exactly what you're looking for!",
    target: "[data-onboarding='search-tab']",
    position: "top",
    character: {
      emotion: "excited",
      message: "So many wonderful toys to discover!"
    }
  },
  {
    id: "location",
    title: "Find Nearby Toys",
    description: "Enable location to see toys close to you. Distance filtering makes exchanges easier!",
    character: {
      emotion: "happy",
      message: "Find toys right in your neighborhood!"
    }
  },
  {
    id: "chat",
    title: "Connect with Other Parents",
    description: "Message other parents to arrange exchanges. It's safe, friendly, and easy!",
    target: "[data-onboarding='chat-tab']",
    position: "top",
    character: {
      emotion: "happy",
      message: "Make friends while sharing toys!"
    }
  },
  {
    id: "profile",
    title: "Your Toy Exchange Profile",
    description: "Manage your listings, favorites, and settings all in one place.",
    target: "[data-onboarding='profile-tab']",
    position: "top",
    character: {
      emotion: "thumbsup",
      message: "Keep track of all your toy exchanges!"
    }
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Ready to start sharing toys with your community? Let's make some kids happy!",
    character: {
      emotion: "excited",
      message: "Time to spread some toy joy! 🎉"
    }
  }
];

export function useOnboarding() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Check if onboarding has been completed
    const hasCompletedOnboarding = localStorage.getItem("toyxOnboardingCompleted");
    if (!hasCompletedOnboarding) {
      setIsActive(true);
    } else {
      setIsCompleted(true);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem("toyxOnboardingCompleted", "true");
  };

  const restartOnboarding = () => {
    setCurrentStep(0);
    setIsActive(true);
    setIsCompleted(false);
    localStorage.removeItem("toyxOnboardingCompleted");
  };

  const getCurrentStep = () => ONBOARDING_STEPS[currentStep];

  return {
    isActive,
    currentStep,
    isCompleted,
    totalSteps: ONBOARDING_STEPS.length,
    getCurrentStep,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    restartOnboarding
  };
}