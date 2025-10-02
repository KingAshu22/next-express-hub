"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "./data-table";
import { adminColumns } from "./adminColumns";
import { HashLoader } from "react-spinners";
import withAuth from "@/lib/withAuth";
import { clientColumns } from "./clientColumns";
import { csColumns } from "./csColumns";
import { ClientDataProvider } from "@/app/_components/ClientDataProvider";

function AWBTable() {
  const [awbs, setAwbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userType = localStorage.getItem("userType");
  const userId = localStorage.getItem("code");

  useEffect(() => {
    fetchAwbs();
  }, []);

  const fetchAwbs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api/awb", {
        headers: {
          userType,
          userId,
        },
      });

      console.log(response.data);
      setAwbs(response.data);
    } catch (error) {
      console.error("Error fetching awbs:", error);
      setError("Failed to fetch awbs. Please try again later.");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center p-10">
          <HashLoader color="#dc2626" size={80} />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container w-full px-4">
      <ClientDataProvider>
        {userType === "admin" || userType === "branch" ?
        <DataTable columns={adminColumns} data={awbs} />
        : userType === "Customer Service"
        ? <DataTable columns={csColumns} data={awbs} />
        : <DataTable columns={clientColumns} data={awbs} />
      }
      </ClientDataProvider>
    </div>
  );
}

export default withAuth(AWBTable);
