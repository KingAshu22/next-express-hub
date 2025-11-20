"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Users, Globe, Lock, Info, Tag } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const formatChargeValue = (charge) => {
  switch (charge.chargeType) {
    case 'percentage':
      return `${charge.chargeValue}%`;
    case 'perKg':
      return `₹${charge.chargeValue} / kg`;
    case 'oneTime':
      return `₹${charge.chargeValue}`;
    default:
      return charge.chargeValue;
  }
};

// Helper to get styling for status badges
const getStatusBadge = (status) => {
  switch (status) {
    case "live":
      return (
        <Badge variant="success" className="text-base">
          <Globe className="w-4 h-4 mr-2" />
          Live
        </Badge>
      )
    case "unlisted":
      return (
        <Badge variant="default" className="text-base">
          <Users className="w-4 h-4 mr-2" />
          Unlisted
        </Badge>
      )
    case "hidden":
    default:
      return (
        <Badge variant="secondary" className="text-base">
          <Lock className="w-4 h-4 mr-2" />
          Hidden
        </Badge>
      )
  }
}

export default function RateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [rate, setRate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchRate()
    }
  }, [params.id])

  const fetchRate = async () => {
    try {
      const response = await fetch(`/api/rates/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRate(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch rate details",
          variant: "destructive",
        })
        router.push("/rates")
      }
    } catch (error) {
      console.error("Error fetching rate:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching rate details.",
        variant: "destructive",
      })
      router.push("/rates")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        Loading rate details...
      </div>
    )
  }

  if (!rate) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        Rate not found.
        <Link href="/rates" className="mt-4 block">
          <Button variant="outline">Go Back</Button>
        </Link>
      </div>
    )
  }

  const zoneKeys = rate.rates && rate.rates.length > 0 ? Object.keys(rate.rates[0]).filter((key) => key !== "kg" && key !== "_id") : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/rates">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{rate.service}</h1>
              {getStatusBadge(rate.status)}
            </div>
            <p className="text-muted-foreground">{rate.originalName}</p>
          </div>
        </div>
        <Link href={`/rates/edit/${rate._id}`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Rate
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column for Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{rate.type}</span>
              </div>
              {rate.charges && rate.charges.length > 0 && (
                <>
                  <hr/>
                  {rate.charges.map((charge, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-muted-foreground">{charge.chargeName}:</span>
                      <span className="font-medium">{formatChargeValue(charge)}</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rate.status === "unlisted" ? (
                rate.assignedTo && rate.assignedTo.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {rate.assignedTo.map((client) => (
                      <Badge key={client} variant="secondary">
                        {client}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned to any clients.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  This rate is <span className="font-semibold">{rate.status}</span> and does not have specific assignments.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column for Tables */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rate Sheet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Weight (kg)</TableHead>
                      {zoneKeys.map((zone) => (
                        <TableHead key={zone} className="text-center">
                          Zone {zone}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rate.rates?.map((rateEntry, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{rateEntry.kg}</TableCell>
                        {zoneKeys.map((zone) => (
                          <TableCell key={zone} className="text-center">
                            ₹{rateEntry[zone] || "–"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zone Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone</TableHead>
                      <TableHead>Countries</TableHead>
                      <TableHead>Extra Charges</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rate.zones?.map((zone, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">Zone {zone.zone}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">{zone.countries?.join(", ")}</div>
                        </TableCell>
                        <TableCell>
                          {zone.extraCharges && Object.keys(zone.extraCharges).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(zone.extraCharges).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="font-normal">
                                  {key}: ₹{value}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}