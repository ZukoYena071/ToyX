import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
        secondary:
          "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
        destructive:
          "border-transparent bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
        outline: "border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50",
        success:
          "border-transparent bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
        warning:
          "border-transparent bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
