"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../_components/Sidebar";
import { usePathname } from "next/navigation"; // Import the hook to get the current path
import Header from "../_components/Header";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname(); // Get the current pathname
  const isAWBPage =
    (pathname.includes("/awb/") && !pathname.includes("/awb/create"))  && !pathname.includes("/awb/update-track/") && !pathname.includes("/awb/sales") ||
    pathname.includes("/signin") ||
    pathname == "/" ||
    pathname.includes("/blogs") ||
    pathname.includes("/blogs/") ||
    pathname.includes("/track") || pathname.includes("/about") ||
    pathname.includes("/contact") || pathname.includes("/privacy-policy") ||
    pathname.includes("/terms-and-conditions") ||
    pathname.includes("/refunds-cancellation-policy") ||
    pathname.includes("/merchant-agreement") ||
    (pathname.includes("/billing/") && !pathname.includes("/billing/create") && !pathname.includes("/billing/edit") && !pathname.includes("/billing/payment"));

  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster />
        <SidebarProvider>
          {!isAWBPage && <AppSidebar />}{" "}
          {/* Only render the sidebar if it's not the AWB page */}
          <main
            className={`flex-grow ${pathname !== "/" ||
              (pathname.includes("/track") &&
                !pathname.includes("/signin") &&
                "p-4")
              }`}
          >
            {!isAWBPage && (
              <div className="mb-20">
                <Header />
              </div>
            )}
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
