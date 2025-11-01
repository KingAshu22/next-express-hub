"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlignJustify, LogOut, MessagesSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from "next/image";
import useAuth from "@/lib/hook";

const Header = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(useAuth());
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    setUserName(localStorage?.getItem("name") || "");
    setUserRole(localStorage?.getItem("userType") || "");
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const authExpiry = localStorage.getItem("authExpiry");
      if (authExpiry && Date.now() < parseInt(authExpiry, 10)) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }, 2000); // Set the interval to run every 2000ms (2 seconds)

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Pass an empty array as the second argument

  const handleSignOut = () => {
    localStorage.removeItem("id");
    localStorage.removeItem("name");
    localStorage.removeItem("authExpiry");
    localStorage.removeItem("userType");
    localStorage.removeItem("code");
    router.push("/signin");
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Link href="/" className="flex flex-row items-center">
            <h2>Kargo One</h2>
          </Link>
        </div>
        {isMounted && (
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="p-1">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="flex flex-col space-y-2 p-2">
                  <p className="font-semibold">{userName}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    Role: {userRole}
                  </p>
                  <Button
                    variant="destructive"
                    className="mt-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
