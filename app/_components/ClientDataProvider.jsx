"use client";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Create Context
const ClientDataContext = createContext();

// Context Provider
export const ClientDataProvider = ({ children }) => {
  const [clientDataMap, setClientDataMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [franchisesRes, clientsRes] = await Promise.all([
          axios.get("/api/franchises"),
          axios.get("/api/clients"),
        ]);

        const map = new Map();

        // Store franchises by _id
        franchisesRes.data.forEach((item) => {
          map.set(item._id, item);
        });

        // Store clients by _id (without overwriting franchises)
        clientsRes.data.forEach((item) => {
          if (!map.has(item._id)) {
            map.set(item._id, item);
          }
        });

        setClientDataMap(map);
      } catch (err) {
        console.error("Error fetching franchises and clients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <ClientDataContext.Provider value={{ clientDataMap, loading }}>
      {children}
    </ClientDataContext.Provider>
  );
};

// Custom hook to access the data
export const useClientData = () => useContext(ClientDataContext);
