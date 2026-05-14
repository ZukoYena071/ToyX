import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

interface LoadingLogoProps {
  label?: string;
  className?: string;
}

export default function LoadingLogo({ label = "Loading...", className }: LoadingLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className || ""}`}>
      <img
        src={toyxLogo}
        alt="ToyX"
        className="h-16 w-auto toyx-pulse dark:brightness-110"
      />
      {label && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{label}</p>
      )}
    </div>
  );
}
