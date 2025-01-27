"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AWBTable from "@/app/_components/AWBTable";
import withAuth from "@/lib/withAuth";

function Dashboard() {
  const [awbData, setAWBData] = useState([]);

  useEffect(() => {
    fetchAWBData();
  }, []);

  const fetchAWBData = async () => {
    try {
      const userType = localStorage.getItem("userType");
      const userId = localStorage.getItem("id");

      const response = await axios.get("/api/awb", {
        headers: {
          userType,
          userId,
        },
      });
      setAWBData(response.data);
    } catch (error) {
      console.error("Error fetching AWB data:", error);
    }
  };

  const handleEditAWB = async (updatedAWB) => {
    try {
      await axios.put(`/api/awb/${updatedAWB.trackingNumber}`, updatedAWB);
      fetchAWBData();
    } catch (error) {
      console.error("Error updating AWB:", error);
    }
  };

  const handleDeleteAWB = async (trackingNumber) => {
    try {
      await axios.delete(`/api/awb/${trackingNumber}`);
      fetchAWBData();
    } catch (error) {
      console.error("Error deleting AWB:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome Back,{" "}
        <span className="text-[#E31E24]">{localStorage?.getItem("name")}!</span>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total AWBs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{awbData.length}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>AWB Table</CardTitle>
        </CardHeader>
        <CardContent>
          <AWBTable
            awbData={awbData}
            onEdit={handleEditAWB}
            onDelete={handleDeleteAWB}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(Dashboard);
