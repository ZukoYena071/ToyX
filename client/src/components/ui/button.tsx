import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-purple-500 hover:bg-purple-600 text-white px-6 py-3",
        destructive:
          "bg-red-500 hover:bg-red-600 text-white px-6 py-3",
        outline:
          "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 px-6 py-3",
        secondary:
          "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 px-6 py-3",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3",
        link: "text-purple-500 underline-offset-4 hover:underline px-2 py-3",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-4 text-base",
        icon: "w-[44px] h-[44px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
