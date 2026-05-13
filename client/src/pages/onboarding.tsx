import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  illustration: string;
  bgGradient: string;
  features: Array<{
    icon: string;
    text: string;
  }>;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [, setLocation] = useLocation();

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'discover',
      title: 'Discover Amazing Toys',
      subtitle: 'Browse thousands of toys shared by parents in your community',
      illustration: '🔍',
      bgGradient: 'from-purple-500 to-pink-500',
      features: [
        { icon: 'fas fa-search', text: 'Smart search & filters' },
        { icon: 'fas fa-map-marker-alt', text: 'Find toys nearby' },
        { icon: 'fas fa-star', text: 'Highly rated toys' }
      ]
    },
    {
      id: 'exchange',
      title: 'Exchange & Share',
      subtitle: 'Trade toys your kids have outgrown for something new and exciting',
      illustration: '🔄',
      bgGradient: 'from-green-500 to-blue-500',
      features: [
        { icon: 'fas fa-exchange-alt', text: 'Easy toy exchanges' },
        { icon: 'fas fa-handshake', text: 'Safe meetups' },
        { icon: 'fas fa-heart', text: 'Make other kids happy' }
      ]
    },
    {
      id: 'connect',
      title: 'Connect with Parents',
      subtitle: 'Build a community of like-minded parents who love sharing joy',
      illustration: '👥',
      bgGradient: 'from-pink-500 to-red-500',
      features: [
        { icon: 'fas fa-comments', text: 'Chat with other parents' },
        { icon: 'fas fa-users', text: 'Join parent groups' },
        { icon: 'fas fa-calendar', text: 'Organize playdates' }
      ]
    },
    {
      id: 'sustainable',
      title: 'Sustainable & Smart',
      subtitle: 'Reduce waste while giving toys a second life and saving money',
      illustration: '🌱',
      bgGradient: 'from-emerald-500 to-teal-500',
      features: [
        { icon: 'fas fa-recycle', text: 'Eco-friendly sharing' },
        { icon: 'fas fa-piggy-bank', text: 'Save money' },
        { icon: 'fas fa-leaf', text: 'Reduce toy waste' }
      ]
    },
    {
      id: 'safety',
      title: 'Safe & Secure',
      subtitle: 'Your family\'s safety is our top priority with verified users and secure exchanges',
      illustration: '🛡️',
      bgGradient: 'from-indigo-500 to-purple-500',
      features: [
        { icon: 'fas fa-shield-alt', text: 'Verified profiles' },
        { icon: 'fas fa-lock', text: 'Secure messaging' },
        { icon: 'fas fa-user-check', text: 'Trusted community' }
      ]
    }
  ];

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('toyxOnboardingCompleted', 'true');
    setLocation('/');
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const completeOnboarding = () => {
    localStorage.setItem('toyxOnboardingCompleted', 'true');
    window.location.href = '/';
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center w-full max-w-sm shadow-lg">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">You're All Set!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Welcome to the ToyX community! Start exploring amazing toys and connect with other parents.
          </p>
          <button
            onClick={(e) => { e.preventDefault(); completeOnboarding(); }}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-xl font-semibold text-base transition-colors min-h-[44px]"
          >
            Start Exploring
          </button>
        </div>
      </div>
    );
  }

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentStepData.bgGradient} flex flex-col relative overflow-hidden`}>
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute top-1/3 right-8 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute bottom-20 left-6 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute bottom-1/3 right-12 w-16 h-16 bg-white/10 rounded-full" />

      <div className="flex items-center justify-between px-6 pt-12 pb-4 relative z-10">
        <button
          onClick={prevStep}
          className={`min-w-[44px] min-h-[44px] bg-white/20 rounded-full flex items-center justify-center ${
            currentStep === 0 ? 'opacity-50' : 'hover:bg-white/30'
          } transition-all`}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={skipOnboarding}
          className="text-white font-medium bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-all min-h-[44px]"
        >
          Skip
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
        {onboardingSteps.map((_, index) => (
          <button
            key={index}
            onClick={() => goToStep(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentStep
                ? 'bg-white w-8'
                : index < currentStep
                  ? 'bg-white/70 w-3'
                  : 'bg-white/30 w-3'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <div className="text-8xl mb-8 animate-bounce">
          {currentStepData.illustration}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
            {currentStepData.title}
          </h1>
          <p className="text-white/90 text-lg leading-relaxed px-4">
            {currentStepData.subtitle}
          </p>
        </div>

        <div className="w-full space-y-4 mb-12">
          {currentStepData.features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-4 bg-white/20 rounded-2xl p-4 backdrop-blur-sm"
            >
              <div className="min-w-[44px] min-h-[44px] bg-white/30 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
              <span className="text-white font-medium text-sm">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 pb-12 relative z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-white font-medium text-sm">
              {currentStep + 1} of {onboardingSteps.length}
            </span>
          </div>

          <button
            onClick={nextStep}
            className="flex-1 bg-white text-gray-900 py-4 rounded-xl font-semibold text-base shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span>{currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
