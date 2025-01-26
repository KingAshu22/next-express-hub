"use client"

import { useEffect, useState } from "react";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Initialize as null to differentiate between loading and not authenticated

  useEffect(() => {
    const checkAuth = () => {
      const id = localStorage.getItem("id");
      const authExpiry = localStorage.getItem("authExpiry");

      console.log("id:", id);
      console.log("Auth Expiry:", authExpiry);

      if (id && authExpiry && Date.now() < parseInt(authExpiry, 10)) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return isAuthenticated;
};

export default useAuth;
