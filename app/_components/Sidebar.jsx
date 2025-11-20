import {
  LayoutDashboard,
  User,
  Box,
  Contact,
  Plus,
  Sun,
  Truck,
  Rss,
  IndianRupee,
  Percent,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useEffect, useState } from "react";
import Link from "next/link";

export function AppSidebar() {
  const [userType, setUserType] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedType = localStorage.getItem("userType");
      setUserType(storedType || "");
    }
  }, []);

  let items = [];

  if (userType === "pickup") {
    // Show only Pickup menu
    items = [{ title: "Pickup", url: "/pickup", icon: Truck }];
  } else {
    // Common item shown to most user types
    items = [{ title: "Show Bookings", url: "/awb", icon: Box }];

    if (userType !== "Customer Service") {
      items.unshift({ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard });
      items.unshift({ title: "New Booking", url: "/awb/create", icon: Plus });
    }

    if (userType === "admin" || userType === "branch") {
      items.push(
        { title: "Customers", url: "/customers", icon: Contact },
        { title: "Clients", url: "/clients", icon: User },
        { title: "Franchise", url: "/franchise", icon: User },
        { title: "Pickup", url: "/pickup", icon: Truck },
        { title: "Rate", url: "/rates", icon: Percent },
        { title: "Estimate", url: "/estimate", icon: IndianRupee },
        { title: "Blogs", url: "/admin-blogs", icon: Rss }
      );
    }

    if (userType === "franchise") {
      items.push({ title: "Clients", url: "/clients", icon: User });
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 text-center">
        <Sun />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="py-8">
                    <Link href={item.url} className="flex items-center space-x-2">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
