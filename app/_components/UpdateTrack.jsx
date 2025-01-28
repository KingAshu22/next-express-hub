"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axios from "axios";
import Modal from "./Modal";

const statusOptions = [
  "Shipment AWB Prepared - HYD HUB",
  "Scanned at Origin - Hyderabad HUB",
  "In Transit from Hyd HUB",
  "Scanned at Mumbai HUB",
  "Under Clearance- Export- BOM Airport",
  "Cleared Export Clearance - BOM Airport",
  "In Transit from BOM Airport",
  "Reached Destination Airport",
  "Under Customs Clearance Facility",
  "Cleared Customs",
  "At Destination Sort Facility",
  "In transit",
  "Out for delivery",
  "Delivered",
  "Unsuccessful Delivery Attempt",
];

export default function UpdateTrackForm({ awb }) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [parcelStatus, setParcelStatus] = useState(
    awb?.parcelStatus || [
      {
        status: "",
        timestamp: new Date(),
        comment: "",
      },
    ]
  );

  const addStatus = () => {
    setParcelStatus([
      ...parcelStatus,
      {
        status: "",
        timestamp: new Date(),
        comment: "",
      },
    ]);
  };

  const handleStatusChange = (index, field, value) => {
    const updatedStatus = [...parcelStatus];
    updatedStatus[index][field] = value;
    setParcelStatus(updatedStatus);
  };

  const removeStatus = (statusIndex) => {
    const updatedStatus = [...parcelStatus];
    updatedStatus.splice(statusIndex, 1);
    setParcelStatus(updatedStatus);
  };

  const editSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Inside Edit Parcel Status");
      const parcelData = {
        parcelStatus,
      };

      const response = await axios.put(
        `/api/awb/${awb.trackingNumber}`,
        parcelData
      );

      if (response.status === 200) {
        console.log("Parcel status updated successfully:", response.data);
        setSuccess(true);
      } else {
        console.error("Failed to edit parcel status:", response.data);
        alert("Failed to edit the parcel status. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error updating parcel status:",
        error.response?.data || error.message
      );
      alert("An error occurred while updating the parcel status.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#232C65]">
        Update Parcel Status
      </h1>
      <form onSubmit={editSubmit} className="space-y-8">
        {parcelStatus.map((status, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-xl text-[#232C65] flex justify-between items-center">
                Status Update {index + 1}
                {index > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeStatus(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Status
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status.status}
                  onValueChange={(value) =>
                    handleStatusChange(index, "status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timestamp</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !status.timestamp && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {status.timestamp ? (
                        format(status.timestamp, "PPP HH:mm:ss")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={status.timestamp}
                      onSelect={(date) =>
                        handleStatusChange(index, "timestamp", date)
                      }
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        step="1"
                        value={format(status.timestamp, "HH:mm:ss")}
                        onChange={(e) => {
                          const [hours, minutes, seconds] =
                            e.target.value.split(":");
                          const newDate = new Date(status.timestamp);
                          newDate.setHours(hours);
                          newDate.setMinutes(minutes);
                          newDate.setSeconds(seconds);
                          handleStatusChange(index, "timestamp", newDate);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`comment-${index}`}>Comment (Optional)</Label>
                <Textarea
                  id={`comment-${index}`}
                  placeholder="Add any additional comments here"
                  value={status.comment}
                  onChange={(e) =>
                    handleStatusChange(index, "comment", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addStatus}
          className="mt-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Status Update
        </Button>
        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-[#E31E24] hover:bg-[#C71D23] text-white"
          >
            Update Parcel Status
          </Button>
        </div>
      </form>
      <Modal
        isOpen={success}
        onClose={() => setSuccess(false)}
        title="AWB Parcel Status Updated Successfully"
        description={`The AWB Parcel Status has been updated successfully. Click the button below to view AWB or go back to AWB Table.`}
      >
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => router.push(`/awb/${awb.trackingNumber}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            View AWB
          </Button>
          <Button
            onClick={() => router.push(`/awb`)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Back to AWB Table
          </Button>
        </div>
      </Modal>
    </div>
  );
}
