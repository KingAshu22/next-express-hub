"use client";

import {
  LayoutDashboard,
  User,
  Package,
  Users,
  SquarePlus,
  Truck,
  Newspaper,
  Receipt,
  Calculator,
  BarChart3,
  ChevronRight,
  LogOut,
  Settings,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Building2,
  Store,
  Boxes,
  Coins,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Hook to detect if user is on Mac
const useIsMac = () => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  return isMac;
};

// Marquee text component for truncated text
const MarqueeText = ({ text, isActive }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (containerRef.current && textRef.current) {
        const isOverflowing =
          textRef.current.scrollWidth > containerRef.current.clientWidth;
        setShouldAnimate(isOverflowing);
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [text]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={containerRef}
            className="relative flex-1 overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span
              ref={textRef}
              className={cn(
                "inline-block whitespace-nowrap text-sm font-medium transition-colors duration-200",
                isActive && "font-semibold text-primary",
                shouldAnimate && isHovered && "animate-marquee"
              )}
              style={{
                animationDuration: shouldAnimate
                  ? `${text.length * 0.15}s`
                  : undefined,
              }}
            >
              {text}
            </span>
          </div>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  );
};

// Animation wrapper component
const AnimatedMenuItem = ({ children, index }) => {
  return (
    <div
      className="animate-in fade-in slide-in-from-left-2 duration-300"
      style={{
        animationDelay: `${index * 40}ms`,
        animationFillMode: "backwards",
      }}
    >
      {children}
    </div>
  );
};

// Toggle Button Component
const SidebarToggleButton = () => {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMac = useIsMac();

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleSidebar}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "border border-border/40 bg-background",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-accent hover:border-border",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={10}
          className="flex items-center gap-2"
        >
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

export function AppSidebar() {
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMac = useIsMac();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedType = localStorage.getItem("userType");
      const storedName = localStorage.getItem("name");
      setUserType(storedType || "");
      setUserName(storedName || "");
    }
  }, []);

  // Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("id");
    localStorage.removeItem("name");
    localStorage.removeItem("authExpiry");
    localStorage.removeItem("userType");
    localStorage.removeItem("code");
    router.push("/signin");
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "G";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Menu items configuration with better icons
  let mainItems = [];
  let secondaryItems = [];

  if (userType === "pickup") {
    mainItems = [
      { title: "Pickup", url: "/pickup", icon: Truck, emoji: "🚚" },
    ];
  } else {
    mainItems = [
      { title: "Show Bookings", url: "/awb", icon: Boxes, emoji: "📦", exactMatch: false },
    ];

    if (userType !== "Customer Service") {
      mainItems.unshift({
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        emoji: "📊",
      });
      mainItems.unshift({
        title: "New Booking",
        url: "/awb/create",
        icon: SquarePlus,
        emoji: "➕",
        exactMatch: true, // This will ensure exact match
      });
    }

    if (userType === "admin") {
      mainItems.push(
        { title: "Customers", url: "/customers", icon: Users, emoji: "👥" },
        { title: "Clients", url: "/clients", icon: Building2, emoji: "🏢" },
        { title: "Franchise", url: "/franchise", icon: Store, emoji: "🏪" }
      );
      secondaryItems = [
        { title: "Rate Config", url: "/rates", icon: Calculator, emoji: "🧮" },
        { title: "Billing", url: "/billing", icon: Receipt, emoji: "🧾" },
        { title: "MIS Reports", url: "/mis", icon: BarChart3, emoji: "📈" },
        { title: "Pickup", url: "/pickup", icon: Truck, emoji: "🚚" },
        { title: "Estimation", url: "/estimate", icon: Coins, emoji: "💰" },
        { title: "Blogs", url: "/admin-blogs", icon: Newspaper, emoji: "📰" },
      ];
    }

    if (userType === "branch") {
      mainItems.push({
        title: "Customers",
        url: "/customers",
        icon: Users,
        emoji: "👥",
      });
      secondaryItems = [
        { title: "Pickup", url: "/pickup", icon: Truck, emoji: "🚚" },
        { title: "Estimation", url: "/estimate", icon: Coins, emoji: "💰" },
        { title: "Blogs", url: "/admin-blogs", icon: Newspaper, emoji: "📰" },
      ];
    }

    if (userType === "franchise") {
      mainItems.push({
        title: "Clients",
        url: "/clients",
        icon: Building2,
        emoji: "🏢",
      });
    }
  }

  // Fixed isActive function to handle exact matches
  const isActive = (item) => {
    const { url, exactMatch } = item;

    // For dashboard, always exact match
    if (url === "/dashboard") return pathname === url;

    // For items that require exact match (like /awb/create)
    if (exactMatch) return pathname === url;

    // For /awb, we need special handling to not match /awb/create
    if (url === "/awb") {
      return pathname === "/awb" || (pathname?.startsWith("/awb/") && !pathname?.startsWith("/awb/create") && !pathname?.startsWith("/awb/update-track"));
    }

    // Default: check if pathname starts with url
    return pathname?.startsWith(url);
  };

  const MenuItemComponent = ({ item, index }) => {
    const active = isActive(item);
    const Icon = item.icon;

    const content = (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={isCollapsed ? item.title : undefined}
          className={cn(
            "group relative h-10 w-full rounded-lg transition-all duration-200 ease-out ml-2",
            "hover:bg-accent hover:text-accent-foreground",
            active && [
              "bg-primary/10 text-primary",
              "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
              "before:h-6 before:w-1 before:rounded-r-full before:bg-primary",
            ]
          )}
        >
          <Link
            href={item.url}
            className={cn(
              "flex items-center gap-3",
              isCollapsed ? "justify-center px-2" : "px-3"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                active && "bg-primary/15 text-primary"
              )}
            >
              {/* You can switch between emoji and icon here */}
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  "hover:scale-110",
                  active && "scale-110"
                )}
              />
            </div>
            {!isCollapsed && (
              <>
                <MarqueeText text={item.title} isActive={active} />
                {item.badge && (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
                {active && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-primary opacity-70" />
                )}
              </>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );

    if (isCollapsed && !isMobile) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <AnimatedMenuItem index={index}>{content}</AnimatedMenuItem>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={10}
              className="flex items-center gap-2 font-medium"
            >
              <span>{item.emoji}</span>
              {item.title}
              {item.badge && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <AnimatedMenuItem index={index}>{content}</AnimatedMenuItem>;
  };

  if (!mounted) {
    return (
      <Sidebar collapsible="icon" className="border-r border-border/40">
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      {/* Header */}
      <SidebarHeader className="border-b border-border/40 px-4 py-4">
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className={cn("flex items-center", isCollapsed ? "" : "gap-3")}>
            <div className="relative shrink-0">
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-amber-500 to-orange-600",
                  "shadow-lg shadow-orange-500/20 transition-all duration-300",
                  "hover:shadow-orange-500/30 hover:scale-105",
                  isCollapsed ? "h-9 w-9" : "h-10 w-10"
                )}
              >
                <Sun
                  className={cn(
                    "text-white",
                    isCollapsed ? "h-4 w-4" : "h-5 w-5"
                  )}
                />
              </div>
              <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="truncate text-base font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Kargo One
                </h2>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {userType || "Guest"} Portal
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && <SidebarToggleButton />}
        </div>
        {isCollapsed && (
          <div className="mt-3 flex justify-center">
            <SidebarToggleButton />
          </div>
        )}
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className="sidebar-scrollbar bg-yellow-100 rounded-r-lg">
        {/* Main Navigation Group */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Main Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 -mx-2">
              {mainItems.map((item, index) => (
                <MenuItemComponent key={item.title} item={item} index={index} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation Group */}
        {secondaryItems.length > 0 && (
          <SidebarGroup className="-mt-4">
            {!isCollapsed && (
              <SidebarGroupLabel className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Management
              </SidebarGroupLabel>
            )}
            {isCollapsed && (
              <div className="mx-auto mb-3 h-px w-8 bg-border/60" />
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 -mx-2">
                {secondaryItems.map((item, index) => (
                  <MenuItemComponent
                    key={item.title}
                    item={item}
                    index={index + mainItems.length}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="mt-auto border-t border-border/40">
        {/* User Profile Card */}
        <div
          className={cn(
            "p-2",
            isCollapsed && "flex justify-center"
          )}
        >
          {isCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="p-3">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{userName || "Guest"}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {userType || "Guest"} Account
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="overflow-hidden rounded-xl bg-gradient-to-br from-muted/80 to-muted/40 p-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-semibold">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {userName || "Guest User"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground capitalize">
                    {userType || "Guest"} Account
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={isCollapsed ? "Settings" : undefined}
              className="h-10 rounded-lg transition-all duration-200 hover:bg-accent"
            >
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3",
                  isCollapsed && "justify-center"
                )}
              >
                <Settings className="h-4 w-4 shrink-0 transition-transform duration-300 hover:rotate-90" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">Settings</span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Logout with confirmation dialog */}
          <SidebarMenuItem>
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
              <AlertDialogTrigger asChild>
                <SidebarMenuButton
                  tooltip={isCollapsed ? "Logout" : undefined}
                  className={cn(
                    "h-10 rounded-lg transition-all duration-200 cursor-pointer",
                    "hover:bg-destructive/10 hover:text-destructive"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 w-full",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">Logout</span>
                    )}
                  </div>
                </SidebarMenuButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be signed out of your account and redirected to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSignOut}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Keyboard Shortcut Hint */}
        {!isCollapsed && (
          <div className="mt-3 mb-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50">
            <span>Toggle with</span>
            <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px]">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <span>+</span>
            <kbd className="inline-flex h-5 items-center rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px]">
              B
            </kbd>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}