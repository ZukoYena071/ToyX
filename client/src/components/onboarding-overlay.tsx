import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OnboardingCharacter from "./onboarding-character";
import { useOnboarding } from "@/hooks/useOnboarding";
import { X, ArrowLeft, ArrowRight, SkipForward } from "lucide-react";

export default function OnboardingOverlay() {
  const {
    isActive,
    currentStep,
    totalSteps,
    getCurrentStep,
    nextStep,
    prevStep,
    skipOnboarding
  } = useOnboarding();

  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const step = getCurrentStep();
    if (step.target) {
      const element = document.querySelector(step.target);
      setHighlightedElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isActive, getCurrentStep]);

  if (!isActive) return null;

  const step = getCurrentStep();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Highlight spotlight */}
      {highlightedElement && (
        <div 
          className="fixed z-45 pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 8,
            left: highlightedElement.getBoundingClientRect().left - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
            background: "rgba(255, 255, 255, 0.1)",
            border: "2px solid #FF6B9D",
            borderRadius: "12px",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)"
          }}
        />
      )}

      {/* Onboarding card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-white dark:bg-card rounded-3xl shadow-2xl border-2 border-mint/30">
          <CardContent className="p-6">
            {/* Header with character and progress */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <OnboardingCharacter emotion={step.character.emotion} size="medium" />
                <div>
                  <h3 className="font-bold text-charcoal dark:text-foreground">Toby</h3>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">Your Guide</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipOnboarding}
                className="w-8 h-8 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-muted rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-mint to-royal h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step indicator */}
            <div className="text-center text-xs text-gray-500 dark:text-muted-foreground mb-4">
              Step {currentStep + 1} of {totalSteps}
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-charcoal dark:text-foreground mb-3">
                {step.title}
              </h2>
              <p className="text-gray-600 dark:text-muted-foreground text-sm mb-4">
                {step.description}
              </p>
              
              {/* Character message bubble */}
              <div className="bg-gradient-to-r from-cream via-peach/20 to-mint/20 dark:from-muted dark:to-card rounded-2xl p-4 relative">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-gradient-to-r from-cream via-peach/20 to-mint/20 dark:from-muted dark:to-card rotate-45" />
                <p className="text-sm text-charcoal dark:text-foreground font-medium italic">
                  "{step.character.message}"
                </p>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={skipOnboarding}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </Button>
              )}

              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-mint to-royal hover:from-mint/90 hover:to-royal/90 text-white flex items-center space-x-2"
              >
                <span>{currentStep === totalSteps - 1 ? "Get Started!" : "Next"}</span>
                {currentStep < totalSteps - 1 && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}