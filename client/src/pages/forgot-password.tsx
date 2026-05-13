import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Headphones } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";

export default function ForgotPassword() {
  const [formData, setFormData] = useState({
    forgotEmail: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Reset link sent to your email!');
      window.location.href = '/login';
    }, 2000);
  };

  return (
    <PageContainer className="flex flex-col">
      <div className="flex items-center justify-between px-6 pt-12 pb-8">
        <Link href="/login">
          <button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="text-gray-500 dark:text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">Forgot Password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 px-8 leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="flex-1 px-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <Input
              type="email"
              value={formData.forgotEmail}
              onChange={(e) => handleInputChange('forgotEmail', e.target.value)}
              placeholder="Enter your email"
            />
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full text-base mb-6"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending...</span>
            </span>
          ) : 'Send Reset Link'}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Try a different method? </span>
          <Link href="/login" className="text-sm font-semibold text-purple-500 hover:text-purple-600">
            Back to login
          </Link>
        </div>

        <div className="mt-8 text-center">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Headphones className="text-white w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Need help? Contact support</p>
        </div>
      </div>
    </PageContainer>
  );
}
