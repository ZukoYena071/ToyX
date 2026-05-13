import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import PageContainer from "@/components/ui/PageContainer";

export default function Welcome() {
  return (
    <PageContainer className="flex flex-col">
      <div className="pt-16" />

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="text-center">
          <div className="relative mb-12">
            <div className="flex items-center justify-center">
              <img
                src={toyxLogo}
                alt="ToyX Logo"
                className="h-48 w-auto"
              />
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">Welcome to ToyX</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-12 px-4">
            A joyful experience for parents, caregivers and children for sharing treasured toys. New connections and happy memories await!
          </p>
        </div>
      </div>

      <div className="px-8 pb-12">
        <Link href="/signup">
          <Button className="w-full text-base mb-6">
            Get Started
          </Button>
        </Link>

        <div className="text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Already have an account? </span>
          <Link href="/login" className="text-sm font-semibold text-purple-500 hover:text-purple-600">
            Log in
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
