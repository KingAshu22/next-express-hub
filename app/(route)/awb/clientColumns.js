"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Copy } from "lucide-react"
import toast from "react-hot-toast"

// Helper function to truncate text if it exceeds a certain length.
const truncateText = (text, maxLength = 20) => {
  if (!text) {
    return "N/A"
  }
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text
}

export const clientColumns = [
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
    header: "Tracking No.",
    cell: ({ row }) => {
      const trackingNumber = row.original.trackingNumber
      const router = useRouter()
      return (
        <span className="cursor-pointer hover:underline" onClick={() => router.push(`/awb/${trackingNumber}`)}>
          {trackingNumber}
        </span>
      )
    },
  },
  {
    accessorKey: "sender.name",
    header: "Sender",
    cell: ({ row }) => {
      const senderName = row.original.sender?.name
      return <span>{truncateText(senderName)}</span>
    },
  },
  {
    accessorKey: "receiver.name",
    header: "Receiver",
    cell: ({ row }) => {
      const receiverName = row.original.receiver?.name
      return <span>{truncateText(receiverName)}</span>
    },
  },
  {
    accessorKey: "receiver.country",
    header: "Destination",
    cell: ({ row }) => {
      const country = row.original.receiver?.country
      return <span>{truncateText(country)}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const router = useRouter()
      const { trackingNumber } = row.original

      // Helper function to handle cloning of AWB
      const handleCloneAwb = async (awb) => {
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
          // Redirect to edit form with cloned AWB data
          router.push(`/edit-awb/${clonedAwb.data.trackingNumber}?cloned=true`)
        } catch (error) {
          console.error("Error cloning AWB:", error)
          toast.error("Failed to clone AWB")
        }
      }

      return (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="px-2 py-1 bg-green-800" onClick={() => router.push(`/awb/${trackingNumber}`)}>
            AWB
          </Button>
          <Button
            size="sm"
            className="px-2 py-1 bg-purple-800"
            onClick={() => router.push(`/edit-awb/${trackingNumber}`)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700"
            onClick={() => handleCloneAwb(row.original)}
            title="Clone this AWB"
          >
            <Copy className="w-3 h-3 mr-1" />
            Clone
          </Button>
          <Button
            size="sm"
            className="px-2 py-1 bg-yellow-800"
            onClick={() => window.open(`/track/${trackingNumber}`, "_blank")}
          >
            Track
          </Button>
          <Button
            size="sm"
            className="px-2 py-1 bg-blue-400"
            onClick={() => router.push(`/shipping-invoice/${trackingNumber}`)}
          >
            Ship INV
          </Button>
          <Button
            size="sm"
            className="px-2 py-1 bg-red-400"
            onClick={() => router.push(`/shipping-and-label/${trackingNumber}`)}
          >
            Docs
          </Button>
        </div>
      )
    },
  },
]
