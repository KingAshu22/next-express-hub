"use client"
import { useEffect, useState } from "react"
import { DataTableOptimized } from "./data-table-optimized"
import { adminColumns } from "./adminColumns"
import { clientColumns } from "./clientColumns"
import { csColumns } from "./csColumns"
import withAuth from "@/lib/withAuth"
import { HashLoader } from "react-spinners"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Plus } from "lucide-react"

function AWBTable() {
  const [mounted, setMounted] = useState(false)
  const [userType, setUserType] = useState("")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    // Get user info from localStorage
    const uType = localStorage.getItem("userType")
    const uId = localStorage.getItem("code")

    setUserType(uType || "")
    setUserId(uId || "")
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center p-10">
          <HashLoader color="#dc2626" size={80} />
        </div>
      </div>
    )
  }

  let selectedColumns = adminColumns
  if (userType === "client" || userType === "franchise") {
    selectedColumns = clientColumns
  } else if (userType === "Customer Service") {
    selectedColumns = csColumns
  }

  return (
    <div className="w-full px-4 -py-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">AWB Bookings</h1>
          <p className="text-sm text-slate-500">Create, bulk import, and manage shipment bookings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/awb/bulk">
              <FileSpreadsheet className="h-4 w-4" />
              Bulk Booking
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-red-600 hover:bg-red-700">
            <Link href="/awb/create">
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>
      <DataTableOptimized columns={selectedColumns} userType={userType} userId={userId} />
    </div>
  )
}

export default withAuth(AWBTable)
