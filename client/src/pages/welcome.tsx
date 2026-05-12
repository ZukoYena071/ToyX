import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-sm mx-auto">
      {/* Header spacing */}
      <div className="pt-16"></div>

      {/* Illustration */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="text-center">
          <div className="relative mb-12">
            {/* ToyX Logo */}
            <div className="flex items-center justify-center">
              <img 
                src={toyxLogo} 
                alt="ToyX Logo" 
                className="h-48 w-auto drop-shadow-2xl"
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to ToyX</h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-12 px-4">
            A joyful experience for parents, caregivers and children for sharing treasured toys. New connections and happy memories await!
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-8 pb-12">
        <Link href="/signup">
          <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg mb-6 shadow-lg hover:shadow-xl transition-all">
            Get Started
          </Button>
        </Link>
        
        <div className="text-center">
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/login" className="text-purple-600 font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}