"use client"

import { useState, useEffect } from "react"
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AWBTable from "@/app/_components/AWBTable";

export default function Dashboard() {
    const [awbData, setAWBData] = useState([])

    useEffect(() => {
        fetchAWBData()
    }, [])

    const fetchAWBData = async () => {
        try {
            const response = await axios.get("/api/awb")
            setAWBData(response.data)
        } catch (error) {
            console.error("Error fetching AWB data:", error)
        }
    }

    const handleEditAWB = async (updatedAWB) => {
        try {
            await axios.put(`/api/awb/${updatedAWB.trackingNumber}`, updatedAWB)
            fetchAWBData()
        } catch (error) {
            console.error("Error updating AWB:", error)
        }
    }

    const handleDeleteAWB = async (trackingNumber) => {
        try {
            await axios.delete(`/api/awb/${trackingNumber}`)
            fetchAWBData()
        } catch (error) {
            console.error("Error deleting AWB:", error)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Express Hub Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Total AWBs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{awbData.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Shipments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{awbData.filter((awb) => awb.status === "Pending").length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Delivered Shipments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{awbData.filter((awb) => awb.status === "Delivered").length}</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>AWB Table</CardTitle>
                </CardHeader>
                <CardContent>
                    <AWBTable awbData={awbData} onEdit={handleEditAWB} onDelete={handleDeleteAWB} />
                </CardContent>
            </Card>
        </div>
    )
}

