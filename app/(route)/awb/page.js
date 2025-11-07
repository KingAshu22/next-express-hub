"use client"
import { useEffect, useState } from "react"
import { DataTableOptimized } from "./data-table-optimized"
import { adminColumns } from "./adminColumns"
import { clientColumns } from "./clientColumns"
import { csColumns } from "./csColumns"
import withAuth from "@/lib/withAuth"
import { HashLoader } from "react-spinners"

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
      <DataTableOptimized columns={selectedColumns} userType={userType} userId={userId} />
    </div>
  )
}

export default withAuth(AWBTable)
