import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
          
          <div className="mt-6">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
            >
              Go Home
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
