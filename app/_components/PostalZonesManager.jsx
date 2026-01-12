"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlusCircle, Trash2, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const searchModeLabels = {
  exact: "Exact Match (same as)",
  contains: "Contains",
  startsWith: "Starts With",
}

export default function PostalZonesManager({ value, onChange, readOnly = false }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newZone, setNewZone] = useState({
    zoneName: "",
    postalCodes: "",
    searchMode: "exact",
  })

  const parsePostalCodes = (input) => {
    const codes = []
    const parts = input.split(",").map((p) => p.trim())

    parts.forEach((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((p) => Number.parseInt(p.trim()))
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            codes.push(i.toString())
          }
        }
      } else if (!isNaN(Number.parseInt(part))) {
        codes.push(part)
      }
    })

    return codes
  }

  const handleAddZone = () => {
    if (!newZone.zoneName || !newZone.postalCodes) {
      toast({
        title: "Validation Error",
        description: "Please provide zone name and postal codes.",
        variant: "destructive",
      })
      return
    }

    const codes = parsePostalCodes(newZone.postalCodes)
    if (codes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide valid postal codes (e.g., 2421,2020-2030).",
        variant: "destructive",
      })
      return
    }

    onChange([
      ...value,
      {
        zoneName: newZone.zoneName,
        postalCodes: codes,
        originalInput: newZone.postalCodes,
        searchMode: newZone.searchMode,
      },
    ])

    setNewZone({ zoneName: "", postalCodes: "", searchMode: "exact" })
    setIsDialogOpen(false)
    toast({ title: "Success", description: "Postal zone added successfully." })
  }

  const handleRemoveZone = (index) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <Label>Postal Zones for {value[0]?.country || "Selected Country"}</Label>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Enter postal codes as single values (2421), ranges (2020-2030), or comma-separated combinations
          (2421,2218,2020-2030). The search mode determines how customer zip codes are matched against these zones.
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead>Postal Codes</TableHead>
              <TableHead>Search Mode</TableHead>
              <TableHead>Code Count</TableHead>
              <TableHead className="w-20">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {value.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                  No postal zones added yet.
                </TableCell>
              </TableRow>
            ) : (
              value.map((zone, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{zone.zoneName}</TableCell>
                  <TableCell className="text-sm">{zone.originalInput}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-muted px-2 py-1 rounded">{searchModeLabels[zone.searchMode]}</span>
                  </TableCell>
                  <TableCell>{zone.postalCodes.length}</TableCell>
                  <TableCell>
                    {!readOnly && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveZone(index)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Postal Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Postal Zone</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="zoneName">Zone Name</Label>
                <Input
                  id="zoneName"
                  placeholder="e.g., North, South, Zone A"
                  value={newZone.zoneName}
                  onChange={(e) => setNewZone({ ...newZone, zoneName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCodes">Postal Codes</Label>
                <Input
                  id="postalCodes"
                  placeholder="e.g., 2421,2218 or 2020-2030 or 2421,2020-2030"
                  value={newZone.postalCodes}
                  onChange={(e) => setNewZone({ ...newZone, postalCodes: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Separate values with commas, use hyphen for ranges</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="searchMode">Search Mode</Label>
                <Select value={newZone.searchMode} onValueChange={(val) => setNewZone({ ...newZone, searchMode: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">{searchModeLabels.exact}</SelectItem>
                    <SelectItem value="contains">{searchModeLabels.contains}</SelectItem>
                    <SelectItem value="startsWith">{searchModeLabels.startsWith}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How customer zip codes will be matched against this zone
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleAddZone}>
                Add Zone
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
