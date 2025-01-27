import {
  Calendar,
  LayoutDashboard,
  User,
  Search,
  Settings,
  Sun,
  Box,
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
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

export function AppSidebar() {
  const [userType, setUserType] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserType(localStorage?.getItem("userType"));
    }
  });

  // Menu items
  const items = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Air Way Bills",
      url: "/awb",
      icon: Box,
    },
    // Add Clients menu item conditionally
    ...(userType === "admin"
      ? [
          {
            title: "Clients",
            url: "/clients",
            icon: User,
          },
        ]
      : []),
  ];
  return (
    <>
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
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
