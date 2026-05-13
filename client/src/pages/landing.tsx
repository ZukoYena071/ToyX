import { Button } from "@/components/ui/button";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import PageContainer from "@/components/ui/PageContainer";
import SectionCard from "@/components/ui/SectionCard";

export default function Landing() {
  return (
    <PageContainer className="flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center mb-8">
          <img
            src={toyxLogo}
            alt="ToyX"
            className="h-48 w-auto"
          />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">Welcome to ToyX!</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Share toys, spread joy</p>
      </div>

      <div className="w-full space-y-4 mb-12">
        <SectionCard className="text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Browse Toys</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Discover amazing toys shared by families in your community</p>
        </SectionCard>

        <SectionCard className="text-center">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Share Your Toys</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">List toys your children have outgrown for other families to enjoy</p>
        </SectionCard>

        <SectionCard className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Connect & Exchange</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Chat with other parents and arrange safe toy exchanges</p>
        </SectionCard>
      </div>

      <div className="w-full">
        <Button
          className="w-full text-base"
          onClick={() => window.location.href = "/welcome"}
        >
          Get Started with ToyX
        </Button>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Join our community of families sharing the joy of toys
        </p>
      </div>
    </PageContainer>
  );
}
