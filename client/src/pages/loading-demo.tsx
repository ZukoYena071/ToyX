import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToyGridSkeleton, ToyCardSkeleton, ProfileSkeleton, ExchangeFormSkeleton, ChatMessageSkeleton } from "@/components/loading-skeletons";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function LoadingDemo() {
  const [activeDemo, setActiveDemo] = useState<string>("grid");

  const demos = [
    { id: "grid", name: "Toy Grid", component: () => <ToyGridSkeleton count={6} /> },
    { id: "card", name: "Toy Card", component: () => <div className="grid grid-cols-2 gap-4"><ToyCardSkeleton /><ToyCardSkeleton /></div> },
    { id: "profile", name: "Profile", component: () => <ProfileSkeleton /> },
    { id: "exchange", name: "Exchange Form", component: () => <ExchangeFormSkeleton /> },
    { id: "chat", name: "Chat Messages", component: () => <ChatMessageSkeleton /> },
    { id: "search", name: "Search", component: () => <ToyGridSkeleton count={4} /> },
  ];

  const currentDemo = demos.find(d => d.id === activeDemo);

  return (
    <div className="max-w-sm mx-auto bg-white dark:bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-border">
        <Link href="/">
          <Button variant="ghost" size="icon" className="w-10 h-10 bg-gray-100 dark:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-muted-foreground" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold text-charcoal dark:text-foreground">Loading Skeletons Demo</h1>
        <div className="w-10 h-10" />
      </div>

      {/* Demo Controls */}
      <div className="p-4 border-b dark:border-border">
        <div className="flex flex-wrap gap-2">
          {demos.map((demo) => (
            <Button
              key={demo.id}
              variant={activeDemo === demo.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDemo(demo.id)}
              className={`text-xs ${
                activeDemo === demo.id 
                  ? "bg-royal text-white" 
                  : "text-gray-600 dark:text-muted-foreground hover:bg-royal hover:text-white"
              }`}
            >
              {demo.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Demo Content */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4 text-charcoal dark:text-foreground">
          {currentDemo?.name} Skeleton
        </h2>
        <div className="space-y-4">
          {currentDemo?.component()}
        </div>
      </div>

      {/* Animation Info */}
      <div className="p-4 bg-gray-50 dark:bg-muted/20 m-4 rounded-2xl">
        <h3 className="font-semibold text-charcoal dark:text-foreground mb-2">✨ Animations included:</h3>
        <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1">
          <li>• Shimmer effect on skeleton elements</li>
          <li>• Bouncing toy emojis (🧸, 🎪, 💬)</li>
          <li>• Rolling toys animation</li>
          <li>• Gradient color transitions</li>
          <li>• Smooth fade-in effects</li>
        </ul>
      </div>
    </div>
  );
}