"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Eye,
  LayoutDashboard,
  Plane,
  Barcode,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const ShowName = ({ id }) => {
  const [name, setName] = useState("Loading...");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        let data = null;

        // Try fetching from franchises API first
        const franchiseRes = await axios.get(`/api/franchises/${id}`);
        data = franchiseRes.data;

        // If not found in franchise, fallback to clients API
        if (!data || !data.name) {
          const clientRes = await axios.get(`/api/clients/${id}`);
          data = clientRes.data;
        }

        setName(data?.name || "Unknown Client");
      } catch (err) {
        console.error("Error fetching client:", err);
        setName("Error");
      }
    };

    if (id) fetchClient();
  }, [id]);

  return <span>{name}</span>;
};

export const csColumns = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.date;
      return (
        <span>
          {date
            ? new Date(date).toLocaleDateString("en-GB")
            : "No date available"}
        </span>
      );
    },
  },
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 cursor-pointer"
      >
        INV <ArrowUpDown className="ml-2 h-4 w-4" />
      </span>
    ),
  },
  {
    accessorKey: "trackingNumber",
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 cursor-pointer"
      >
        Tracking <ArrowUpDown className="ml-2 h-4 w-4" />
      </span>
    ),
    cell: ({ row }) => {
      const trackingNumber = row.original.trackingNumber;
      const hasForwardingInfo =
        row.original?.forwardingNumber?.length > 0 &&
        row.original?.forwardingLink?.length > 0;

      const handleClick = () => {
        window.location.href = `/awb/${trackingNumber}`;
      };

      return (
        <span
          className={`cursor-pointer ${hasForwardingInfo ? "text-black" : "text-red-500"}`}
          onClick={handleClick}
        >
          {trackingNumber}
        </span>
      );
    },
  },
  {
    accessorKey: "staffId",
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 cursor-pointer"
      >
        Client <ArrowUpDown className="ml-2 h-4 w-4" />
      </span>
    ),
    cell: ({ row }) => {
      const refCode = row.original.refCode;
      return refCode ? <ShowName id={refCode} /> : <span>Unknown</span>;
    },
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ row }) => {
      const country = row.original.receiver?.country;
      return <span>{country ? country.slice(0, 20) : "Unknown"}</span>;
    },
  },
  {
    accessorKey: "senderName",
    header: "Sender Name",
    cell: ({ row }) => {
      const senderName = row.original.sender?.name;
      return <span>{senderName ? senderName.slice(0, 20) : "Unknown"}</span>;
    },
  },
  {
    accessorKey: "receiverName",
    header: "Receiver Name",
    cell: ({ row }) => {
      const receiverName = row.original.receiver?.name;
      return <span>{receiverName ? receiverName.slice(0, 20) : "Unknown"}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const router = useRouter();
      const { trackingNumber } = row.original;

      return (
        <div className="flex gap-1 text-[10px]">
          <Button
            className="p-1 bg-yellow-800"
            onClick={() => router.push(`/awb/update-track/${trackingNumber}`)}
          >
            Update
          </Button>
          <Button
            className="p-1 bg-red-400"
            onClick={() => router.push(`/shipping-and-label/${trackingNumber}`)}
          >
            Docs
          </Button>
          <Button
            className="p-1 bg-blue-400"
            onClick={() => router.push(`/shipping-invoice/${trackingNumber}`)}
          >
            Ship INV
          </Button>
          <Button
            className="p-1 bg-purple-600"
            onClick={() => router.push(`/label/${trackingNumber}`)}>
            Label
          </Button>
        </div>
      );
    },
  },
];
