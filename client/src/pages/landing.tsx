import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-6 max-w-sm mx-auto relative overflow-hidden">
      {/* ToyX Logo */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center mb-8">
          <img 
            src={toyxLogo} 
            alt="ToyX" 
            className="h-60 w-auto drop-shadow-lg"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">Welcome to ToyX!</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Share toys, spread joy</p>
      </div>

      {/* Feature Cards - Modern design */}
      <div className="w-full space-y-4 mb-12">
        {/* Step 1 */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-200 dark:border-gray-600 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Browse Toys</h3>
            <p className="text-gray-600 dark:text-gray-300">Discover amazing toys shared by families in your community</p>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-200 dark:border-gray-600 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Share Your Toys</h3>
            <p className="text-gray-600 dark:text-gray-300">List toys your children have outgrown for other families to enjoy</p>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-200 dark:border-gray-600 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Connect & Exchange</h3>
            <p className="text-gray-600 dark:text-gray-300">Chat with other parents and arrange safe toy exchanges</p>
          </CardContent>
        </Card>
      </div>

      {/* Get Started Button - Modern gradient design */}
      <div className="w-full">
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
          onClick={() => window.location.href = "/welcome"}
        >
          Get Started with ToyX
        </Button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Join our community of families sharing the joy of toys
        </p>
      </div>
      
      {/* Modern decorative elements */}
      <div className="absolute top-32 left-8 w-8 h-8 bg-purple-300/30 rounded-full animate-bounce"></div>
      <div className="absolute top-96 right-12 w-6 h-6 bg-pink-300/40 rounded-full animate-pulse"></div>
      <div className="absolute bottom-48 left-12 w-10 h-10 bg-purple-400/20 rounded-full animate-bounce delay-300"></div>
      <div className="absolute bottom-72 right-8 w-7 h-7 bg-pink-400/30 rounded-full animate-pulse delay-150"></div>
    </div>
  );
}
