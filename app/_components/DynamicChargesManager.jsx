"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const chargeTypeLabels = {
  percentage: "Percentage (%)",
  perKg: "Per Kg (₹)",
  oneTime: "One Time (₹)",
}

export default function DynamicChargesManager({ value, onChange }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCharge, setNewCharge] = useState({
    chargeName: "",
    chargeType: "percentage",
    chargeValue: "",
  })

  const handleAddCharge = () => {
    if (!newCharge.chargeName || !newCharge.chargeType || newCharge.chargeValue <= 0) {
      toast({
        title: "Invalid Charge",
        description: "Please provide a valid name, type, and positive value.",
        variant: "destructive",
      })
      return
    }
    onChange([...value, { ...newCharge, chargeValue: Number(newCharge.chargeValue) }])
    setNewCharge({ chargeName: "", chargeType: "percentage", chargeValue: "" })
    setIsDialogOpen(false)
  }

  const handleRemoveCharge = (indexToRemove) => {
    onChange(value.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="space-y-4">
      <Label>Additional Charges</Label>
      <div className="p-4 border rounded-lg space-y-3">
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">No additional charges added.</p>
        ) : (
          value.map((charge, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-3">
                <span className="font-medium">{charge.chargeName}</span>
                <Badge variant="outline">{chargeTypeLabels[charge.chargeType]}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">
                  {charge.chargeType === "percentage" ? `${charge.chargeValue}%` : `₹${charge.chargeValue}`}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveCharge(index)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Charge
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Charge</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chargeName">Charge Name</Label>
              <Input
                id="chargeName"
                placeholder="e.g., Fuel Surcharge"
                value={newCharge.chargeName}
                onChange={(e) => setNewCharge({ ...newCharge, chargeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chargeType">Charge Type</Label>
              <Select
                value={newCharge.chargeType}
                onValueChange={(val) => setNewCharge({ ...newCharge, chargeType: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{chargeTypeLabels.percentage}</SelectItem>
                  <SelectItem value="perKg">{chargeTypeLabels.perKg}</SelectItem>
                  <SelectItem value="oneTime">{chargeTypeLabels.oneTime}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chargeValue">Value</Label>
              <Input
                id="chargeValue"
                type="number"
                placeholder="e.g., 18.5"
                value={newCharge.chargeValue}
                onChange={(e) => setNewCharge({ ...newCharge, chargeValue: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddCharge}>
              Save Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
