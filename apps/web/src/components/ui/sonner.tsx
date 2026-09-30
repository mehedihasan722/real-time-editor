"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      richColors
      closeButton
      expand
      visibleToasts={5}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-slate-200 group-[.toaster]:bg-white/95 group-[.toaster]:text-slate-950 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl dark:group-[.toaster]:border-slate-700 dark:group-[.toaster]:bg-slate-950/95 dark:group-[.toaster]:text-slate-50",
          title: "group-[.toast]:text-sm group-[.toast]:font-bold",
          description: "group-[.toast]:text-xs group-[.toast]:leading-5 group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-indigo-600 group-[.toast]:font-semibold group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
