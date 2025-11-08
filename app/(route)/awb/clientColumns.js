"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { useRouter } from "next/navigation"

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
      // Assuming date is either a Date object or a string in ISO format
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
        <span
          className="cursor-pointer hover:underline"
          onClick={() => router.push(`/awb/${trackingNumber}`)}
        >
          {trackingNumber}
        </span>
      )
    },
  },
  {
    accessorKey: "sender.name",
    header: "Sender",
    // Apply truncation in the cell renderer
    cell: ({ row }) => {
      const senderName = row.original.sender?.name
      return <span>{truncateText(senderName)}</span>
    },
  },
  {
    accessorKey: "receiver.name",
    header: "Receiver",
    // Apply truncation in the cell renderer
    cell: ({ row }) => {
      const receiverName = row.original.receiver?.name
      return <span>{truncateText(receiverName)}</span>
    },
  },
  {
    accessorKey: "receiver.country",
    header: "Destination",
    // Apply truncation in the cell renderer
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
      return (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="px-2 py-1 bg-green-800" onClick={() => router.push(`/awb/${trackingNumber}`)}>
            AWB
          </Button>
          <Button size="sm" className="px-2 py-1 bg-purple-800" onClick={() => router.push(`/edit-awb/${trackingNumber}`)}>
            Edit
          </Button>
          <Button size="sm" className="px-2 py-1 bg-yellow-800" onClick={() => window.open(`/track/${trackingNumber}`, "_blank")}>
            Track
          </Button>
          <Button size="sm" className="px-2 py-1 bg-blue-400" onClick={() => router.push(`/shipping-invoice/${trackingNumber}`)}>
            Ship INV
          </Button>
          <Button size="sm" className="px-2 py-1 bg-red-400" onClick={() => router.push(`/shipping-and-label/${trackingNumber}`)}>
            Docs
          </Button>
        </div>
      )
    },
  },
]