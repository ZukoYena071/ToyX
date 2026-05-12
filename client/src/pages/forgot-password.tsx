import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Headphones } from "lucide-react";

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
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert('Reset link sent to your email!');
      // Navigate back to login
      window.location.href = '/login';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-8">
        <Link href="/login">
          <button className="w-8 h-8 flex items-center justify-center">
            <ArrowLeft className="text-gray-600 w-5 h-5" />
          </button>
        </Link>
      </div>

      {/* Logo and Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-8">
          <span className="text-gray-800">Toy</span>
          <span className="text-purple-600">X</span>
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Forgot Password</h2>
        <p className="text-gray-600 px-8 leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-8">
        <div className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
            <Input
              type="email"
              value={formData.forgotEmail}
              onChange={(e) => handleInputChange('forgotEmail', e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 text-gray-900 dark:text-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-8 pb-8">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg mb-6 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : (
            'Send Reset Link'
          )}
        </Button>

        <div className="text-center">
          <span className="text-gray-600">Try a different method? </span>
          <Link href="/login" className="text-purple-600 font-semibold">
            Back to login
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Headphones className="text-white w-5 h-5" />
          </div>
          <p className="text-gray-500 text-sm">Need help? Contact support</p>
        </div>
      </div>
    </div>
  );
}