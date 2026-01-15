"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "../_components/Sidebar";
import { usePathname } from "next/navigation";
import Header from "../_components/Header";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Menu, PanelLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

// Mobile Trigger with Tooltip
const MobileSidebarTrigger = () => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className="h-9 w-9 shrink-0 rounded-lg border border-border/40 bg-background p-0 hover:bg-accent lg:hidden">
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </SidebarTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>Toggle sidebar</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {isMac ? (
              <>
                <span className="text-xs">⌘</span>B
              </>
            ) : (
              <>
                <span className="text-xs">Ctrl</span>+B
              </>
            )}
          </kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Desktop Toggle Button for Header
const DesktopSidebarToggle = () => {
  const { toggleSidebar, state } = useSidebar();
  const [isMac, setIsMac] = useState(false);
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleSidebar}
            className={cn(
              "hidden lg:flex h-9 w-9 items-center justify-center rounded-lg",
              "border border-border/40 bg-background",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-accent hover:border-border",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className={cn("h-4 w-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {isMac ? (
              <>
                <span className="text-xs">⌘</span>B
              </>
            ) : (
              <>
                <span className="text-xs">Ctrl</span>+B
              </>
            )}
          </kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Inner layout component that uses sidebar context
const InnerLayout = ({ children }) => {
  return (
    <SidebarInset className="flex flex-1 flex-col">

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="container">{children}</div>
      </main>
    </SidebarInset>
  );
};

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Define pages where sidebar should be hidden
  const hideSidebarPaths = [
    "/signin",
    "/blogs",
    "/track",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms-and-conditions",
    "/refunds-cancellation-policy",
    "/merchant-agreement",
    "/details",
  ];

  const isAWBDetailPage =
    pathname.includes("/awb/") &&
    !pathname.includes("/awb/create") &&
    !pathname.includes("/awb/update-track/");

  const isHomePage = pathname === "/";

  const shouldHideSidebar =
    isAWBDetailPage ||
    isHomePage ||
    hideSidebarPaths.some((path) => pathname.includes(path));

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(inter.className, "min-h-screen bg-background antialiased")}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!bg-background !text-foreground !border !border-border",
          }}
        />

        {shouldHideSidebar ? (
          // Layout without sidebar
          <main className="min-h-screen">{children}</main>
        ) : (
          // Layout with sidebar
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <InnerLayout>{children}</InnerLayout>
            </div>
          </SidebarProvider>
        )}
      </body>
    </html>
  );
}