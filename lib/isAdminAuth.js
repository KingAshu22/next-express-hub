"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "./hook";
import { HashLoader } from "react-spinners";

const isAdminAuth = (WrappedComponent) => {
  // eslint-disable-next-line react/display-name
  return (props) => {
    const isAuthenticated = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const userType = typeof window !== "undefined" ? localStorage.getItem("userType") : null;

    useEffect(() => {
      if (isAuthenticated === false) {
        // Construct the full URL including query parameters
        const redirectUrl = window.location.href; // This will include the full URL with query params
        router.replace(
          `/signin?redirect_url=${encodeURIComponent(redirectUrl)}`
        );
      } else if (isAuthenticated === true && userType === "admin") {
        setLoading(false);
      }
    }, [isAuthenticated, router]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <HashLoader color="#dc2626" size={80} />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default isAdminAuth;
