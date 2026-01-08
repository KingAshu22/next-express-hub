"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Package, ShoppingCart, Edit2, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ViewRatePage() {
  const router = useRouter()
  const params = useParams()
  const rateId = params.id

  const [rate, setRate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRate()
  }, [rateId])

  const fetchRate = async () => {
    try {
      const response = await fetch(`/api/rates/${rateId}`)
      if (response.ok) {
        const data = await response.json()
        setRate(data)
      } else {
        toast({
          title: "Error",
          description: "Rate not found.",
          variant: "destructive",
        })
        router.push("/rates")
      }
    } catch (error) {
      console.error("Error fetching rate:", error)
      toast({
        title: "Error",
        description: "Failed to load rate details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading rate details...</p>
        </div>
      </div>
    )
  }

  if (!rate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Rate not found. Please try again or go back to the rates list.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const chargeTypeLabels = {
    percentage: "%",
    perKg: "₹/kg",
    oneTime: "₹",
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/rates">
            <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Rate Details</h1>
            <p className="text-muted-foreground">
              {rate.vendorName} - {rate.service}
            </p>
          </div>
        </div>
        <Link href={`/rates/edit/${rateId}`}>
          <Button className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit Rate
          </Button>
        </Link>
      </div>

      {/* Basic Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {rate.rateCategory === "purchase" ? <Package className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Vendor Name</p>
              <p className="text-lg font-semibold">{rate.vendorName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="text-lg font-semibold">{rate.service}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Original Name</p>
              <p className="text-lg font-semibold">{rate.originalName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rate Category</p>
              <div className="mt-1">
                <Badge variant={rate.rateCategory === "purchase" ? "default" : "secondary"}>
                  {rate.rateCategory === "purchase" ? "Purchase" : "Sales"}
                </Badge>
              </div>
            </div>
            {rate.type && (
              <div>
                <p className="text-sm text-muted-foreground">Type/Category</p>
                <p className="text-lg font-semibold">{rate.type}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Rate Mode</p>
              <p className="text-lg font-semibold capitalize">{rate.rateMode}</p>
            </div>
            {rate.targetCountry && (
              <div>
                <p className="text-sm text-muted-foreground">Target Country</p>
                <p className="text-lg font-semibold">{rate.targetCountry}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={rate.status === "hidden" ? "outline" : "default"} className="mt-1">
                {rate.status === "hidden" ? "Hidden" : "Visible"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Charges */}
      {rate.charges && rate.charges.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Charges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rate.charges.map((charge, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div>
                    <p className="font-medium">{charge.chargeName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{chargeTypeLabels[charge.chargeType]}</Badge>
                    <p className="font-semibold">{charge.chargeValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zones */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Zones & Countries</CardTitle>
          <CardDescription>{rate.zones?.length || 0} zone(s) defined</CardDescription>
        </CardHeader>
        <CardContent>
          {rate.zones && rate.zones.length > 0 ? (
            <div className="space-y-4">
              {rate.zones.map((zone, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{zone.zone}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Countries:</p>
                    <div className="flex flex-wrap gap-2">
                      {zone.countries.map((country, idx) => (
                        <Badge key={idx} variant="secondary">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* --- FIXED SECTION START --- */}
                  {zone.extraCharges && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Extra Charges:</p>
                      <div className="space-y-1">
                        {Array.isArray(zone.extraCharges) ? (
                          // Case 1: It is an Array of objects (This fixes your specific error)
                          zone.extraCharges.map((charge, idx) => (
                            <p key={idx} className="text-sm">
                              {charge.chargeName}: <span className="font-semibold">₹{charge.chargeValue}</span>
                            </p>
                          ))
                        ) : typeof zone.extraCharges === 'object' ? (
                          // Case 2: It is a simple Key-Value object (Backwards compatibility)
                          Object.entries(zone.extraCharges).map(([name, value]) => (
                            <p key={name} className="text-sm">
                              {name}: <span className="font-semibold">₹{value}</span>
                            </p>
                          ))
                        ) : null}
                      </div>
                    </div>
                  )}
                  {/* --- FIXED SECTION END --- */}

                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No zones defined.</p>
          )}
        </CardContent>
      </Card>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Weight-Based Rates</CardTitle>
          <CardDescription>Rates by weight and zone</CardDescription>
        </CardHeader>
        <CardContent>
          {rate.rates && rate.rates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Weight (kg)</TableHead>
                    {rate.zones?.map((zone) => (
                      <TableHead key={zone.zone} className="text-right font-semibold">
                        Zone {zone.zone}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rate.rates.map((rateRow, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{rateRow.kg} kg</TableCell>
                      {rate.zones?.map((zone) => {
                        const zoneIndex = rate.zones.indexOf(zone) + 1
                        const rateValue = rateRow[zoneIndex.toString()]
                        return (
                          <TableCell key={zone.zone} className="text-right">
                            {rateValue ? `₹${Number(rateValue).toFixed(2)}` : "-"}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">No rates defined.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
