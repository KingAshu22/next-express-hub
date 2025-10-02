"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
        description: "Failed to fetch rate details",
        variant: "destructive",
      })
      router.push("/rates")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading rate details...</div>
      </div>
    )
  }

  if (!rate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Rate not found</div>
      </div>
    )
  }

  // Get all zone keys from the first rate entry
  const zoneKeys = rate.rates && rate.rates.length > 0 ? Object.keys(rate.rates[0]).filter((key) => key !== "kg") : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/rates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Rates
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {rate.originalName} - {rate.service}
            </h1>
            <p className="text-muted-foreground">Type: {rate.type}</p>
          </div>
        </div>
        <Link href={`/rates/edit/${rate._id}`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Rate
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Rate Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Weight (kg)</TableHead>
                    {zoneKeys.map((zone) => (
                      <TableHead key={zone}>Zone {zone}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rate.rates?.map((rateEntry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{rateEntry.kg}</TableCell>
                      {zoneKeys.map((zone) => (
                        <TableCell key={zone}>₹{rateEntry[zone]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Zones Table */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Configuration</CardTitle>
          </CardHeader>
          <CardContent>
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
                      {zone.extraCharges ? (
                        <div className="space-y-1">
                          {Object.entries(zone.extraCharges).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              {key}: ₹{value}/kg
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
