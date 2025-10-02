import { Button } from "@/components/ui/button";
import {
    ArrowUpDown,
    Barcode,
    Eye,
    Pencil,
    Plane,
} from "lucide-react";
import { useRouter } from "next/navigation";

export const clientColumns = [
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
            const date = row.original.date;
            if (date) {
                // Assuming date is either a Date object or a string in ISO format
                return <span>{new Date(date).toLocaleDateString("en-GB")}</span>;
            } else {
                // Handle cases where date is missing or invalid
                return <span>No date available</span>;
            }
        },
    },
    {
        accessorKey: "trackingNumber",
        header: ({ column }) => (
            <span
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                AWB No.
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
        ),
    },
    {
        accessorKey: "sender.name",
        header: ({ column }) => (
            <span
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                Sender
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
        ),
    },
    {
        accessorKey: "receiver.name",
        header: ({ column }) => (
            <span
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                Receiver
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
        ),
    },
    {
        accessorKey: "receiver.country",
        header: ({ column }) => (
            <span
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                Destination
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
        ),
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const router = useRouter();
            const { trackingNumber } = row.original;
            return (
                <div className="flex flex-rows gap-2">
                    <Button
                        className="px-2 py-1 bg-yellow-800"
                        onClick={() => window.open(`/track/${trackingNumber}`)}
                    >
                        Track
                    </Button>
                    <Button
                        className="px-2 py-1 bg-green-800"
                        onClick={() => window.open(`/awb/${trackingNumber}`)}
                    >
                        AWB
                    </Button>
                    <Button
                        className="bg-blue-400"
                        onClick={() => router.push(`/shipping-invoice/${trackingNumber}`)}
                    >
                        Ship INV
                    </Button>
                    <Button
                        className="bg-red-400"
                        onClick={() => router.push(`/shipping-and-label/${trackingNumber}`)}
                    >
                        Docs
                    </Button>
                </div>
            );
        },
    },
];
