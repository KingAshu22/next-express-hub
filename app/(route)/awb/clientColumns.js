import { Button } from "@/components/ui/button";
import {
    ArrowUpDown,
    Eye,
    Pencil,
} from "lucide-react";

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
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
            <span
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                Invoice No.
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
        ),
    },
    {
        accessorKey: "trackingNumber",
        header: ({ column }) => (
            <span
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                Tracking No.
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
            const { trackingNumber } = row.original;
            return (
                <div className="flex flex-rows gap-2">
                    <Button
                        className="px-2 py-1 bg-green-800"
                        onClick={() => window.open(`/awb/${trackingNumber}`)}
                    >
                        <Eye className="w-[20px] h-[20px]" />
                    </Button>
                    <Button
                        className="px-2 py-1 bg-blue-800"
                        onClick={() => window.open(`/edit-awb/${trackingNumber}`)}
                    >
                        <Pencil className="w-[20px] h-[20px]" />
                    </Button>
                </div>
            );
        },
    },
];
