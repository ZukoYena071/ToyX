import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Check } from "lucide-react";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import PageContainer from "@/components/ui/PageContainer";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.agreeToTerms) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, firstName: formData.firstName }),
        credentials: "include",
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const err = await res.json();
        alert(err.message || "Signup failed");
      }
    } catch (err) {
      alert("Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginRedirect = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "" }),
        credentials: "include",
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const err = await res.json();
        alert(err.message || "Login failed");
      }
    } catch (err) {
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer className="flex flex-col">
      <div className="flex items-center justify-between px-6 pt-12 pb-8">
        <Link href="/welcome">
          <button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="text-gray-500 dark:text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img src={toyxLogo} alt="ToyX Logo" className="h-48 w-auto" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Create Account</h2>
      </div>

      <div className="px-8 mb-8">
        <div className="space-y-3">
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-4">Continue with</div>

          <button
            onClick={() => window.location.href = "/api/auth/google"}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Continue with Google</span>
          </button>


        </div>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
          <span className="px-3 text-xs text-gray-500 dark:text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        </div>
      </div>

      <div className="flex-1 px-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Create Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pr-12"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="pr-12"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 py-4">
            <button
              onClick={() => handleInputChange('agreeToTerms', !formData.agreeToTerms)}
              className={`min-w-[44px] min-h-[44px] rounded-xl border-2 flex items-center justify-center ${
                formData.agreeToTerms
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {formData.agreeToTerms && <Check className="text-white w-4 h-4" />}
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pt-2">
              I agree to the <span className="text-purple-500 font-medium">Terms of Service</span> and have read the <span className="text-purple-500 font-medium">Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !formData.agreeToTerms}
          className="w-full text-base mb-6"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Account...</span>
            </span>
          ) : 'Sign Up'}
        </Button>

        <Link href="/login">
          <Button variant="secondary" className="w-full text-base">
            Already have an account?
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
}
