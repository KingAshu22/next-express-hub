"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Plus, Trash2, Package, Eye, Edit3, Box } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import Modal from "./Modal"

const statusOptions = [
  "Shipment AWB Prepared - BOM HUB",
  "Scanned at Origin - BOM HUB",
  "In Transit from BOM HUB",
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
]

export default function UpdateTrackForm({ awb }) {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [parcelStatus, setParcelStatus] = useState(
    awb?.parcelStatus || [
      {
        status: "",
        timestamp: new Date(),
        comment: "",
      },
    ],
  )

  const [cNoteNumber, setCNoteNumber] = useState(awb?.cNoteNumber || "")
  const [cNoteVendorName, setCNoteVendorName] = useState(awb?.cNoteVendorName || "")
  const [forwardingNumber, setForwardingNumber] = useState(awb?.forwardingNumber || "")
  const [forwardingLink, setForwardingLink] = useState(awb?.forwardingLink || "")
  const [ourBoxes, setOurBoxes] = useState(awb?.ourBoxes || [])
  const [vendorBoxes, setVendorBoxes] = useState(awb?.vendorBoxes || [])
  const [rateInfo, setRateInfo] = useState(awb?.rateInfo || {})

  const calculateDimensionalWeight = (length, breadth, height) => {
    if (!length || !breadth || !height) return 0
    return (length * breadth * height) / 5000
  }

  const calculateChargeableWeight = (actualWeight, dimensionalWeight) => {
    const maxWeight = Math.max(actualWeight, dimensionalWeight)

    if (maxWeight < 20) {
      // Round to nearest 0.5 for weights less than 20
      return Math.ceil(maxWeight * 2) / 2
    } else {
      // Round up to next whole kg for weights 20 and above
      return Math.ceil(maxWeight)
    }
  }

  const addBox = (boxType) => {
    const newBox = {
      length: "",
      breadth: "",
      height: "",
      actualWeight: "",
      dimensionalWeight: 0,
      chargeableWeight: 0,
    }

    if (boxType === "our") {
      setOurBoxes([...ourBoxes, newBox])
    } else {
      setVendorBoxes([...vendorBoxes, newBox])
    }
  }

  const removeBox = (boxType, index) => {
    if (boxType === "our") {
      const updated = ourBoxes.filter((_, i) => i !== index)
      setOurBoxes(updated)
    } else {
      const updated = vendorBoxes.filter((_, i) => i !== index)
      setVendorBoxes(updated)
    }
  }

  const updateBox = (boxType, index, field, value) => {
    const boxes = boxType === "our" ? ourBoxes : vendorBoxes
    const updated = [...boxes]
    updated[index][field] = value

    const { length, breadth, height, actualWeight } = updated[index]

    if (length && breadth && height) {
      const dimWeight = calculateDimensionalWeight(
        Number.parseFloat(length),
        Number.parseFloat(breadth),
        Number.parseFloat(height),
      )
      updated[index].dimensionalWeight = Number(dimWeight) || 0

      if (actualWeight) {
        updated[index].chargeableWeight = calculateChargeableWeight(
          Number.parseFloat(actualWeight),
          Number(dimWeight) || 0,
        )
      }
    }

    if (actualWeight && updated[index].dimensionalWeight) {
      updated[index].chargeableWeight = calculateChargeableWeight(
        Number.parseFloat(actualWeight),
        Number(updated[index].dimensionalWeight) || 0,
      )
    }

    if (boxType === "our") {
      setOurBoxes(updated)
    } else {
      setVendorBoxes(updated)
    }
  }

  const calculateTotals = (boxes) => {
    return boxes.reduce(
      (totals, box) => ({
        actualWeight: totals.actualWeight + Number.parseFloat(box.actualWeight || 0),
        dimensionalWeight: totals.dimensionalWeight + Number.parseFloat(box.dimensionalWeight || 0),
        chargeableWeight: totals.chargeableWeight + Number.parseFloat(box.chargeableWeight || 0),
      }),
      { actualWeight: 0, dimensionalWeight: 0, chargeableWeight: 0 },
    )
  }

  const addStatus = () => {
    setParcelStatus([
      ...parcelStatus,
      {
        status: "",
        timestamp: new Date(),
        comment: "",
      },
    ])
  }

  const handleStatusChange = (index, field, value) => {
    const updatedStatus = [...parcelStatus]
    updatedStatus[index][field] = value
    setParcelStatus(updatedStatus)
  }

  const removeStatus = (statusIndex) => {
    const updatedStatus = [...parcelStatus]
    updatedStatus.splice(statusIndex, 1)
    setParcelStatus(updatedStatus)
  }

  const editSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log("Inside Edit Parcel Status")
      const parcelData = {
        parcelStatus,
        cNoteNumber,
        cNoteVendorName,
        forwardingNumber,
        forwardingLink,
        ourBoxes,
        vendorBoxes,
        rateInfo,
      }

      const response = await axios.put(`/api/awb/${awb.trackingNumber}`, parcelData)

      if (response.status === 200) {
        console.log("Parcel status updated successfully:", response.data)
        setSuccess(true)
      } else {
        console.error("Failed to edit parcel status:", response.data)
        alert("Failed to edit the parcel status. Please try again.")
      }
    } catch (error) {
      console.error("Error updating parcel status:", error.response?.data || error.message)
      alert("An error occurred while updating the parcel status.")
    }
  }

  const BoxDisplay = ({ boxes, title, icon, readonly = false }) => {
    const totals = calculateTotals(boxes)

    return (
      <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-[#232C65] flex items-center gap-2">
            {icon}
            {title}
            <Badge variant="secondary" className="ml-auto">
              {boxes.length} {boxes.length === 1 ? "Box" : "Boxes"}
            </Badge>
          </CardTitle>
          {boxes.length > 0 && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-medium text-blue-700">Total Actual Weight</div>
                <div className="text-lg font-bold text-blue-800">{totals.actualWeight.toFixed(2)} kg</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="font-medium text-green-700">Total Dimensional Weight</div>
                <div className="text-lg font-bold text-green-800">{totals.dimensionalWeight.toFixed(3)} kg</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="font-medium text-orange-700">Total Chargeable Weight</div>
                <div className="text-lg font-bold text-orange-800">{totals.chargeableWeight.toFixed(1)} kg</div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {boxes.map((box, boxIndex) => (
            <Card key={boxIndex} className="bg-gray-50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Box {boxIndex + 1}</h4>
                  {!readonly && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeBox(title.toLowerCase().includes("our") ? "our" : "vendor", boxIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div>
                    <Label className="text-xs">Length (cm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={box.length}
                      onChange={(e) =>
                        !readonly &&
                        updateBox(
                          title.toLowerCase().includes("our") ? "our" : "vendor",
                          boxIndex,
                          "length",
                          e.target.value,
                        )
                      }
                      className="h-8 text-sm"
                      readOnly={readonly}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Breadth (cm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={box.breadth}
                      onChange={(e) =>
                        !readonly &&
                        updateBox(
                          title.toLowerCase().includes("our") ? "our" : "vendor",
                          boxIndex,
                          "breadth",
                          e.target.value,
                        )
                      }
                      className="h-8 text-sm"
                      readOnly={readonly}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height (cm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={box.height}
                      onChange={(e) =>
                        !readonly &&
                        updateBox(
                          title.toLowerCase().includes("our") ? "our" : "vendor",
                          boxIndex,
                          "height",
                          e.target.value,
                        )
                      }
                      className="h-8 text-sm"
                      readOnly={readonly}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Actual Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={box.actualWeight}
                      onChange={(e) =>
                        !readonly &&
                        updateBox(
                          title.toLowerCase().includes("our") ? "our" : "vendor",
                          boxIndex,
                          "actualWeight",
                          e.target.value,
                        )
                      }
                      className="h-8 text-sm"
                      readOnly={readonly}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Dim Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={box.dimensionalWeight}
                      readOnly={readonly}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Chrg Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={box.chargeableWeight}
                      readOnly={readonly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!readonly && (
            <Button
              type="button"
              variant="outline"
              onClick={() => addBox(title.toLowerCase().includes("our") ? "our" : "vendor")}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Box
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#232C65] mb-2">Update Parcel Tracking</h1>
        <p className="text-gray-600 mb-4">Manage tracking details, boxes, and status updates</p>
        <Button
        onClick={() => router.push(`/awb/cj/${awb.trackingNumber}`)}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
      >
        Create Courier Journey Air Way Bill
      </Button>
      </div>

      <form onSubmit={editSubmit} className="space-y-8">
        <Card className="border-l-4 border-l-[#232C65]">
          <CardHeader>
            <CardTitle className="text-xl text-[#232C65] flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tracking Numbers & References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cNoteNumber">C Note Number</Label>
                <Input
                  id="cNoteNumber"
                  type="text"
                  value={cNoteNumber}
                  onChange={(e) => setCNoteNumber(e.target.value)}
                  placeholder="Enter C Note Number"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cNoteVendorName">C Note Vendor Name</Label>
                <Input
                  id="cNoteVendorName"
                  type="text"
                  value={cNoteVendorName}
                  onChange={(e) => setCNoteVendorName(e.target.value)}
                  placeholder="Enter C Note Vendor Name"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forwardingNumber">Forwarding Number</Label>
                <Input
                  id="forwardingNumber"
                  type="text"
                  value={forwardingNumber}
                  onChange={(e) => setForwardingNumber(e.target.value)}
                  placeholder="Enter Forwarding Number"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forwardingLink">Forwarding Link</Label>
                <Input
                  id="forwardingLink"
                  type="url"
                  value={forwardingLink}
                  onChange={(e) => setForwardingLink(e.target.value)}
                  placeholder="Enter Forwarding Link"
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#E31E24]">
          <CardHeader>
            <CardTitle className="text-xl text-[#232C65] flex items-center gap-2">
              <Box className="h-5 w-5" />
              Boxes Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="original" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="original" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Original Boxes
                </TabsTrigger>
                <TabsTrigger value="our" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Our Boxes
                </TabsTrigger>
                <TabsTrigger value="vendor" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Vendor Boxes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="original" className="mt-6">
                <BoxDisplay
                  boxes={awb?.boxes || []}
                  title="Original Boxes (Read Only)"
                  icon={<Eye className="h-4 w-4" />}
                  readonly={true}
                />
              </TabsContent>

              <TabsContent value="our" className="mt-6">
                <BoxDisplay boxes={ourBoxes} title="Our Boxes" icon={<Edit3 className="h-4 w-4" />} />
              </TabsContent>

              <TabsContent value="vendor" className="mt-6">
                <BoxDisplay boxes={vendorBoxes} title="Vendor Boxes" icon={<Package className="h-4 w-4" />} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {parcelStatus.map((status, index) => (
          <Card key={index} className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-xl text-[#232C65] flex justify-between items-center">
                Status Update {index + 1}
                {index > 0 && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeStatus(index)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Status
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status.status} onValueChange={(value) => handleStatusChange(index, "status", value)}>
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
                        !status.timestamp && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {status.timestamp ? format(status.timestamp, "PPP HH:mm:ss") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={status.timestamp}
                      onSelect={(date) => handleStatusChange(index, "timestamp", date)}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        step="1"
                        value={format(status.timestamp, "HH:mm:ss")}
                        onChange={(e) => {
                          const [hours, minutes, seconds] = e.target.value.split(":")
                          const newDate = new Date(status.timestamp)
                          newDate.setHours(hours)
                          newDate.setMinutes(minutes)
                          newDate.setSeconds(seconds)
                          handleStatusChange(index, "timestamp", newDate)
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
                  onChange={(e) => handleStatusChange(index, "comment", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={addStatus} className="flex-1 bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Status Update
          </Button>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-[#E31E24] hover:bg-[#C71D23] text-white px-8 py-3 text-lg">
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
          <Button onClick={() => router.push(`/awb`)} className="bg-green-600 hover:bg-green-700 text-white">
            Back to AWB Table
          </Button>
        </div>
      </Modal>
    </div>
  )
}
