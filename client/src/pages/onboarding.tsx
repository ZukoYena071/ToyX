import { useState } from "react";
import { useLocation } from "wouter";

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
      bgGradient: 'from-blue-400 to-purple-500',
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
      bgGradient: 'from-green-400 to-blue-500',
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
      bgGradient: 'from-pink-400 to-red-500',
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
      bgGradient: 'from-emerald-400 to-teal-500',
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
      bgGradient: 'from-indigo-400 to-purple-500',
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
    // Mark onboarding as completed and redirect to home
    localStorage.setItem('toyxOnboardingCompleted', 'true');
    setLocation('/');
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const completeOnboarding = () => {
    // Mark onboarding as completed and redirect to home
    console.log('Completing onboarding...');
    localStorage.setItem('toyxOnboardingCompleted', 'true');
    console.log('Onboarding marked as completed, redirecting...');
    
    // Force a page reload to ensure the router picks up the localStorage change
    window.location.href = '/';
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-6 max-w-sm mx-auto">
        <div className="bg-white rounded-3xl p-8 text-center w-full shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">You're All Set!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Welcome to the ToyX community! Start exploring amazing toys and connect with other parents.
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('Start Exploring button clicked');
              completeOnboarding();
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Start Exploring
          </button>
        </div>
      </div>
    );
  }

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentStepData.bgGradient} flex flex-col relative overflow-hidden max-w-sm mx-auto`}>
      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute top-1/3 right-8 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute bottom-20 left-6 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute bottom-1/3 right-12 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4 relative z-10">
        <button 
          onClick={prevStep}
          className={`w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center ${
            currentStep === 0 ? 'opacity-50' : 'hover:bg-opacity-30'
          } transition-all`}
          disabled={currentStep === 0}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          onClick={skipOnboarding}
          className="text-white font-medium bg-white bg-opacity-20 px-4 py-2 rounded-full hover:bg-opacity-30 transition-all"
        >
          Skip
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center justify-center space-x-2 mb-8 relative z-10">
        {onboardingSteps.map((_, index) => (
          <button
            key={index}
            onClick={() => goToStep(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentStep 
                ? 'bg-white w-8' 
                : index < currentStep 
                  ? 'bg-white bg-opacity-70 w-3' 
                  : 'bg-white bg-opacity-30 w-3'
            }`}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        {/* Illustration */}
        <div className="text-8xl mb-8 animate-bounce">
          {currentStepData.illustration}
        </div>

        {/* Title and Subtitle */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
            {currentStepData.title}
          </h1>
          <p className="text-white text-opacity-90 text-lg leading-relaxed px-4">
            {currentStepData.subtitle}
          </p>
        </div>

        {/* Features */}
        <div className="w-full space-y-4 mb-12">
          {currentStepData.features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center space-x-4 bg-white bg-opacity-20 rounded-2xl p-4 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <span className="text-white font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="px-8 pb-12 relative z-10">
        <div className="flex items-center space-x-4">
          {/* Step Counter */}
          <div className="bg-white bg-opacity-20 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-white font-medium text-sm">
              {currentStep + 1} of {onboardingSteps.length}
            </span>
          </div>

          {/* Next Button */}
          <button
            onClick={nextStep}
            className="flex-1 bg-white text-gray-800 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <span>{currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        {currentStep === onboardingSteps.length - 1 && (
          <div className="mt-6 flex items-center justify-center space-x-6">
            <button className="text-white text-opacity-80 text-sm font-medium hover:text-opacity-100 transition-all">
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-6z" />
              </svg>
              Enable Notifications
            </button>
            <button className="text-white text-opacity-80 text-sm font-medium hover:text-opacity-100 transition-all">
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Set Location
            </button>
          </div>
        )}
      </div>

      {/* Interactive Elements for Engagement */}
      {currentStep === 1 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4 animate-pulse">
            <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-xl">🧸</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <div className="w-12 h-12 bg-pink-400 rounded-lg flex items-center justify-center">
              <span className="text-xl">🚗</span>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 animate-bounce">
            <div className="w-8 h-8 bg-white bg-opacity-30 rounded-full"></div>
            <div className="w-8 h-8 bg-white bg-opacity-50 rounded-full"></div>
            <div className="w-8 h-8 bg-white bg-opacity-70 rounded-full"></div>
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
        </div>
      )}

      {/* Swipe Hint */}
      {currentStep === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-opacity-60 text-sm animate-pulse">
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Swipe or tap to continue
        </div>
      )}
    </div>
  );
}