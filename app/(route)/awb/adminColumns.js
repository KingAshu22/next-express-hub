"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LayoutDashboard, Pencil, Trash, Plane, Copy, IndianRupee } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

// --- START: OPTIMIZATION LOGIC ---

// Helper function to truncate text if it exceeds a certain length.
const truncateText = (text, maxLength = 20) => {
  if (!text) return "N/A"
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + "..."
}

// Module-level promise to cache the client/franchise data.
// This ensures we only fetch this data ONCE per page load, for all components.
let dataMapPromise = null

const getClientAndFranchiseMap = () => {
  // If the promise doesn't exist, create it.
  if (!dataMapPromise) {
    dataMapPromise = new Promise(async (resolve, reject) => {
      try {
        // Fetch both clients and franchises at the same time.
        const [clientsRes, franchisesRes] = await Promise.all([
          axios
            .get("/api/clients")
            .catch(() => ({ data: [] })), // Add catch to prevent one failure from breaking both
          axios.get("/api/franchises").catch(() => ({ data: [] })),
        ])

        // Use a Map for fast O(1) lookups by ID/code.
        const combinedMap = new Map()

        // Process clients and add them to the map.
        ;(clientsRes.data || []).forEach((c) => {
          const key = c.code || c.id
          const name = c.companyName || c.name || "Unnamed Client"
          if (key) combinedMap.set(key, name)
        })

        // Process franchises. They will overwrite clients if keys conflict (which is fine).
        ;(franchisesRes.data || []).forEach((f) => {
          const key = f.code || f.id
          const name = f.firmName || f.name || "Unnamed Franchise"
          if (key) combinedMap.set(key, name)
        })

        resolve(combinedMap)
      } catch (error) {
        console.error("Failed to pre-fetch client/franchise data:", error)
        dataMapPromise = null // Reset on failure so the next component can retry.
        reject(error)
      }
    })
  }
  // Return the promise (either the one we just created or the existing one).
  return dataMapPromise
}

// The new, highly-optimized ShowName component.
const ShowName = ({ id }) => {
  const [name, setName] = useState("Loading...")

  useEffect(() => {
    if (!id) {
      setName("N/A")
      return
    }

    let isMounted = true

    // Use the cached data fetching function.
    getClientAndFranchiseMap()
      .then((dataMap) => {
        if (isMounted) {
          const foundName = dataMap.get(id)
          setName(foundName || "Unknown")
        }
      })
      .catch(() => {
        if (isMounted) setName("Error")
      })

    // Cleanup function to prevent state updates on unmounted components.
    return () => {
      isMounted = false
    }
  }, [id])

  return <span>{truncateText(name)}</span>
}

// --- END: OPTIMIZATION LOGIC ---

const deleteAwb = async (trackingNumber) => {
  try {
    await axios.delete(`/api/awb/${trackingNumber}`, {
      withCredentials: true,
    })
    // Reload the page to reflect the deletion.
    // In a more complex app, you might trigger a state update instead.
    window.location.reload()
  } catch (error) {
    console.error("Error Deleting AWB:", error)
    // You could show an error toast to the user here.
  }
}

const handleCloneAwb = async (awb, router) => {
  try {
    const response = await fetch("/api/awb/clone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceAwbId: awb._id }),
    })

    if (!response.ok) {
      throw new Error("Failed to clone AWB")
    }

    const clonedAwb = await response.json()
    toast.success("AWB cloned successfully")
    router.push(`/edit-awb/${clonedAwb.data.trackingNumber}?cloned=true`)
  } catch (error) {
    console.error("Error cloning AWB:", error)
    toast.error("Failed to clone AWB")
  }
}

const calculateBoxWeights = (boxes) => {
  if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
    return { actual: 0, volume: 0, chargeable: 0 }
  }

  return boxes.reduce((acc, box) => {
    const act = parseFloat(box.actualWeight) || 0
    const dim = parseFloat(box.dimensionalWeight) || 0
    const chg = parseFloat(box.chargeableWeight) || Math.max(act, dim)

    return {
      actual: acc.actual + act,
      volume: acc.volume + dim,
      chargeable: acc.chargeable + chg
    }
  }, { actual: 0, volume: 0, chargeable: 0 })
}

export const adminColumns = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.date
      return <span>{date ? new Date(date).toLocaleDateString("en-GB") : "N/A"}</span>
    },
  },
  {
    accessorKey: "trackingNumber",
    header: "Tracking",
    cell: ({ row }) => {
      const trackingNumber = row.original.trackingNumber
      const hasForwardingInfo =
        (row.original?.forwardingNumber?.length > 0 && row.original?.forwardingLink?.length > 0) ||
        row.original?.cNoteNumber?.length > 0

      // The useRouter hook must be called inside the cell render prop.
      const router = useRouter()

      return (
        <span
          className={`cursor-pointer hover:underline ${hasForwardingInfo ? "text-blue-600" : "text-red-500"}`}
          onClick={() => router.push(`/awb/${trackingNumber}`)}
        >
          {trackingNumber}
        </span>
      )
    },
  },
  {
    accessorKey: "refCode", // Correct key for client/franchise reference
    header: "Client / Franchise",
    cell: ({ row }) => {
      const refCode = row.original.refCode
      // Use the new, efficient ShowName component.
      return refCode ? <ShowName id={refCode} /> : <span>Admin</span>
    },
  },
  {
    accessorKey: "receiver.country", // Use dot notation for nested data
    header: "Country",
    cell: ({ row }) => {
      const country = row.original.receiver?.country
      return <span>{truncateText(country)}</span>
    },
  },
  {
    accessorKey: "sender.name", // Use dot notation for nested data
    header: "Sender Name",
    cell: ({ row }) => {
      const senderName = row.original.sender?.name
      return <span>{truncateText(senderName)}</span>
    },
  },
  {
    accessorKey: "receiver.name", // Use dot notation for nested data
    header: "Receiver Name",
    cell: ({ row }) => {
      const receiverName = row.original.receiver?.name
      return <span>{truncateText(receiverName)}</span>
    },
  },
  {
    accessorKey: "boxes", // Use dot notation for nested data
    header: "Chg.Wt",
    cell: ({ row }) => {
      const boxes = row.original.boxes
      const weights = calculateBoxWeights(boxes)
      return <span>{weights.chargeable}KG</span>
    },
  },
  {
    accessorKey: "financials", // Use dot notation for nested data
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.original?.financials?.sales?.grandTotal || 0
      return <span>{Math.round(amount).toLocaleString("en-IN")}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const router = useRouter()
      const { trackingNumber } = row.original

      return (
        <div className="flex items-center gap-2">
          <Button
            title="Shipping & Label"
            size="icon"
            className="h-8 w-12 bg-purple-600"
            onClick={() => router.push(`/track/${trackingNumber}`)}
          >
            Track
          </Button>
          <Button
            title="Shipping & Label"
            size="icon"
            className="h-8 w-8 bg-blue-400"
            onClick={() => router.push(`/shipping-and-label/${trackingNumber}`)}
          >
            <Plane className="w-4 h-4" />
          </Button>
          <Button
            title="Edit AWB"
            size="icon"
            className="h-8 w-8 bg-blue-800"
            onClick={() => router.push(`/edit-awb/${trackingNumber}`)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            title="Clone AWB"
            size="icon"
            className="h-8 w-8 bg-cyan-600 hover:bg-cyan-700"
            onClick={() => handleCloneAwb(row.original, router)}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            title="Update Tracking"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push(`/awb/update-track/${trackingNumber}`)}
          >
            <LayoutDashboard className="w-4 h-4" />
          </Button>
          <Button
            title="Sales Purchase Entry"
            size="icon"
            className="h-8 w-8 bg-green-600"
            onClick={() => router.push(`/awb/sales/${trackingNumber}`)}
          >
            <IndianRupee className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button title="Delete AWB" variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100">
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the AWB with Tracking Number:{" "}
                  <strong>{trackingNumber}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => deleteAwb(trackingNumber)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    },
  },
]
