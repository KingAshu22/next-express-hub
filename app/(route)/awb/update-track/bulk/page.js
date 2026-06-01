"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import axios from "axios"
import Link from "next/link"
import withAuth from "@/lib/withAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, Loader2, AlertTriangle, Plus, Zap, CalendarIcon, Trash2, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { format } from "date-fns"

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
  "SHIPMENT RECEIVED",
  "PREPARING FOR EXPORT",
  "BAGGING DONE",
  "UNDER CUSTOMS CLEARANCE",
  "CUSTOMS CLEARED",
  "WAITING FOR FLIGHT CONFIRMATION",
  "SHIPMENT SENT TO DESTINATION",
]

const statusTemplates = [
  {
    id: "template1",
    name: "Shipment Preparation",
    description: "Received, preparing, and bagging",
    statuses: ["SHIPMENT RECEIVED", "PREPARING FOR EXPORT", "BAGGING DONE"],
  },
  {
    id: "template2",
    name: "Customs & Dispatch",
    description: "Customs clearance to shipment dispatch",
    statuses: ["UNDER CUSTOMS CLEARANCE", "CUSTOMS CLEARED", "WAITING FOR FLIGHT CONFIRMATION", "SHIPMENT SENT TO DESTINATION"],
  },
  {
    id: "template3",
    name: "Delivery Progress",
    description: "Destination arrival and delivery",
    statuses: ["Reached Destination Airport", "Under Customs Clearance Facility", "Cleared Customs", "At Destination Sort Facility", "Out for delivery", "Delivered"],
  },
]

const createEmptyStatus = () => ({
  status: "",
  location: "",
  timestamp: new Date(),
  comment: "",
})

function BulkUpdateTrackPage() {
  const searchParams = useSearchParams()
  const trackingNumbers = useMemo(() => {
    const raw = searchParams.get("trackingNumbers") || ""
    return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))]
  }, [searchParams])

  const [awbs, setAwbs] = useState([])
  const [awbFieldData, setAwbFieldData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [saving, setSaving] = useState(false)

  const [parcelStatus, setParcelStatus] = useState([createEmptyStatus()])

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [templateStartTime, setTemplateStartTime] = useState(new Date())
  const [templateLocation, setTemplateLocation] = useState("MUMBAI")
  const [intervalMinutes, setIntervalMinutes] = useState(15)

  useEffect(() => {
    if (trackingNumbers.length === 0) {
      setLoading(false)
      setError("No selected AWBs found. Please select parcels from the table first.")
      return
    }

    const fetchAwbs = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({ trackingNumbers: trackingNumbers.join(",") })
        const response = await axios.get(`/api/awb?${params.toString()}`, {
          headers: {
            userType: localStorage.getItem("userType") || "",
            userId: localStorage.getItem("code") || localStorage.getItem("userId") || "",
          },
        })

        if (!Array.isArray(response.data.data)) {
          throw new Error("Unexpected response from server")
        }

        const data = response.data.data
        setAwbs(data)

        const initialFields = {}
        data.forEach((awb) => {
          initialFields[awb.trackingNumber] = {
            cNoteNumber: awb.cNoteNumber || "",
            cNoteVendorName: awb.cNoteVendorName || "",
            forwardingNumber: awb.forwardingNumber || "",
            forwardingLink: awb.forwardingLink || "",
          }
        })
        setAwbFieldData(initialFields)
      } catch (err) {
        console.error("Failed to load selected AWBs", err)
        setError(err.response?.data?.error || err.message || "Failed to load selected AWBs")
      } finally {
        setLoading(false)
      }
    }

    fetchAwbs()
  }, [trackingNumbers])

  const handleAwbFieldChange = (trackingNumber, field, value) => {
    setAwbFieldData((prev) => ({
      ...prev,
      [trackingNumber]: {
        ...prev[trackingNumber],
        [field]: value,
      },
    }))
  }

  const addStatus = () => {
    setParcelStatus((prev) => [...prev, createEmptyStatus()])
  }

  const removeStatus = (index) => {
    setParcelStatus((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleStatusChange = (index, field, value) => {
    setParcelStatus((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const applyTemplate = (templateId) => {
    const template = statusTemplates.find((item) => item.id === templateId)
    if (!template) return

    const newStatuses = template.statuses.map((status, index) => {
      const timestamp = new Date(templateStartTime)
      timestamp.setMinutes(templateStartTime.getMinutes() + index * intervalMinutes)
      return {
        status,
        location: templateLocation.toUpperCase(),
        timestamp,
        comment: "",
      }
    })

    setParcelStatus(newStatuses)
    setTemplateDialogOpen(false)
    setSelectedTemplate("")
  }

  const clearStatuses = () => setParcelStatus([createEmptyStatus()])

  const handleBulkSave = async (event) => {
    event.preventDefault()

    const anyAwbFieldFilled = awbs.some((awb) => {
      const d = awbFieldData[awb.trackingNumber]
      return (
        d?.cNoteNumber?.trim() ||
        d?.cNoteVendorName?.trim() ||
        d?.forwardingNumber?.trim() ||
        d?.forwardingLink?.trim()
      )
    })

    if (!anyAwbFieldFilled && !parcelStatus.some((item) => item.status)) {
      toast.error("Please fill at least one field for any AWB or add one parcel status entry.")
      return
    }

    setSaving(true)
    setError("")
    setSuccessMessage("")

    try {
      const payload = {
        trackingNumbers,
        awbUpdates: awbs.map((awb) => ({
          trackingNumber: awb.trackingNumber,
          cNoteNumber: awbFieldData[awb.trackingNumber]?.cNoteNumber?.trim() || "",
          cNoteVendorName: awbFieldData[awb.trackingNumber]?.cNoteVendorName?.trim() || "",
          forwardingNumber: awbFieldData[awb.trackingNumber]?.forwardingNumber?.trim() || "",
          forwardingLink: awbFieldData[awb.trackingNumber]?.forwardingLink?.trim() || "",
        })),
      }

      const validStatuses = parcelStatus
        .filter((item) => item.status)
        .map((item) => ({
          status: item.status,
          location: item.location,
          timestamp: item.timestamp,
          comment: item.comment,
        }))

      if (validStatuses.length > 0) {
        payload.parcelStatus = validStatuses
      }

      const response = await axios.put("/api/awb/bulk-update", payload)

      if (response.data?.success) {
        setSuccessMessage(response.data.message || "Bulk update applied successfully.")
        toast.success(response.data.message || "Bulk update applied successfully.")
      } else {
        throw new Error(response.data?.message || "Bulk update failed.")
      }
    } catch (err) {
      console.error("Bulk update error", err)
      setError(err.response?.data?.message || err.message || "Bulk update failed.")
      toast.error(err.response?.data?.message || err.message || "Bulk update failed.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-3 px-0 text-slate-600 hover:text-slate-900">
              <Link href="/awb">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to AWB
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Bulk Tracking Update</h1>
            <p className="mt-2 text-slate-600">
              Edit individual tracking fields per AWB below and apply a shared parcel status timeline to all selected parcels.
            </p>
          </div>
          <Badge className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">
            {trackingNumbers.length} selected parcel{trackingNumbers.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleBulkSave} className="space-y-6">
          <Card className="bg-white">
            <CardHeader className="border-b">
              <CardTitle>Selected Parcel Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading selected parcels...
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>AWB Number</TableHead>
                          <TableHead>Sender</TableHead>
                          <TableHead>Receiver</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>C Note Number</TableHead>
                          <TableHead>C Note Vendor</TableHead>
                          <TableHead>Forwarding Number</TableHead>
                          <TableHead>Forwarding Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {awbs.length > 0 ? (
                          awbs.map((awb) => (
                            <TableRow key={awb.trackingNumber}>
                              <TableCell className="whitespace-nowrap font-medium">
                                {awb.awbNumber || awb.trackingNumber || "-"}
                              </TableCell>
                              <TableCell>{awb.sender?.name || "-"}</TableCell>
                              <TableCell>{awb.receiver?.name || "-"}</TableCell>
                              <TableCell>{awb.receiver?.country || "-"}</TableCell>
                              <TableCell>
                                <Input
                                  value={awbFieldData[awb.trackingNumber]?.cNoteNumber || ""}
                                  onChange={(e) =>
                                    handleAwbFieldChange(awb.trackingNumber, "cNoteNumber", e.target.value)
                                  }
                                  placeholder="C Note #"
                                  className="min-w-[140px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={awbFieldData[awb.trackingNumber]?.cNoteVendorName || ""}
                                  onChange={(e) =>
                                    handleAwbFieldChange(awb.trackingNumber, "cNoteVendorName", e.target.value)
                                  }
                                  placeholder="Vendor"
                                  className="min-w-[140px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={awbFieldData[awb.trackingNumber]?.forwardingNumber || ""}
                                  onChange={(e) =>
                                    handleAwbFieldChange(awb.trackingNumber, "forwardingNumber", e.target.value)
                                  }
                                  placeholder="Fwd #"
                                  className="min-w-[140px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={awbFieldData[awb.trackingNumber]?.forwardingLink || ""}
                                  onChange={(e) =>
                                    handleAwbFieldChange(awb.trackingNumber, "forwardingLink", e.target.value)
                                  }
                                  placeholder="https://..."
                                  className="min-w-[160px]"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                              No parcels loaded for the selected tracking numbers.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Update the 4 fields individually for each AWB above. The bulk status timeline below will apply to all selected parcels at once.
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="border-b">
              <CardTitle>Bulk Status Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Same status timeline for all selected parcels</p>
                  <p className="text-sm text-slate-500">
                    Pick a quick template or enter custom statuses once. The selected timeline will apply across every parcel.
                  </p>
                </div>
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="gap-2">
                      <Zap className="h-4 w-4" /> Quick Status Templates
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Select a Status Template</DialogTitle>
                      <DialogDescription>
                        Select a prebuilt sequence and the status list will populate for all selected AWBs.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {statusTemplates.map((template) => (
                          <div key={template.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-slate-900">{template.name}</h3>
                                <p className="text-sm text-slate-500">{template.description}</p>
                              </div>
                              <Button type="button" size="sm" onClick={() => applyTemplate(template.id)}>
                                Apply
                              </Button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {template.statuses.map((status, idx) => (
                                <Badge key={idx} className="bg-slate-100 text-slate-700">
                                  {status}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" className="w-full justify-start text-left">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(templateStartTime, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={templateStartTime}
                                onSelect={(date) => date && setTemplateStartTime(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={templateLocation}
                            onChange={(e) => setTemplateLocation(e.target.value)}
                            placeholder="MUMBAI"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Interval (minutes)</Label>
                          <Input
                            type="number"
                            min={5}
                            max={180}
                            value={intervalMinutes}
                            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {parcelStatus.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-slate-900">Status Update {index + 1}</span>
                          {parcelStatus.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => removeStatus(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={item.status}
                              onValueChange={(value) => handleStatusChange(index, "status", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose status" />
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
                            <Label>Location</Label>
                            <Input
                              value={item.location}
                              onChange={(e) => handleStatusChange(index, "location", e.target.value.toUpperCase())}
                              placeholder="Enter location"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="w-full max-w-xs space-y-3">
                        <div className="space-y-2">
                          <Label>Timestamp</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" className="w-full justify-start text-left">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {item.timestamp ? format(new Date(item.timestamp), "PPP HH:mm") : "Pick date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={new Date(item.timestamp)}
                                onSelect={(date) => date && handleStatusChange(index, "timestamp", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Comment</Label>
                          <Textarea
                            value={item.comment}
                            onChange={(e) => handleStatusChange(index, "comment", e.target.value)}
                            placeholder="Optional comment"
                            className="h-24"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" className="w-full gap-2" onClick={addStatus}>
                <Plus className="h-4 w-4" /> Add Status Update
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Button
              type="submit"
              className="w-full bg-[#E31E24] text-white hover:bg-[#C71D23] py-4 text-base"
              disabled={saving || loading || trackingNumbers.length === 0}
            >
              {saving ? "Applying Bulk Update..." : "Apply Bulk Update to All Selected Parcels"}
            </Button>
            <Button asChild variant="outline" className="w-full lg:w-auto">
              <Link href="/awb">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default withAuth(BulkUpdateTrackPage)