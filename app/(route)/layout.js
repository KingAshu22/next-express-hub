"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../_components/Sidebar";
import { usePathname } from "next/navigation"; // Import the hook to get the current path

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname(); // Get the current pathname
  const isAWBPage = pathname.includes("/awb/"); // Hide sidebar for /awb/[trackingNumber]

  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider>
          {!isAWBPage && <AppSidebar />}{" "}
          {/* Only render the sidebar if it's not the AWB page */}
          <main className="flex-grow p-6">
            {!isAWBPage && <SidebarTrigger className="ml-4 mb-8" />}

            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
