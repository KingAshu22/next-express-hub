"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Plus, Upload, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function RatesPage() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    try {
      const response = await fetch("/api/rates")
      if (response.ok) {
        const data = await response.json()
        setRates(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch rates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching rates:", error)
      toast({
        title: "Error",
        description: "Failed to fetch rates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    // Create a sample Excel template data
    const templateData = {
      rates: [
        { kg: 0.5, zone1: 1092, zone2: 1085, zone3: 1228 },
        { kg: 1, zone1: 1315, zone2: 1296, zone3: 1491 },
        { kg: 2, zone1: 1537, zone2: 1533, zone3: 1751 },
      ],
      zones: [
        { zone: "1", countries: "Bangladesh,Bhutan,Maldives", extraCharges: "Charge:20" },
        { zone: "2", countries: "Hong Kong,Malaysia,Singapore", extraCharges: "Charge:20" },
        { zone: "3", countries: "China", extraCharges: "Charge:20" },
      ],
    }

    // Convert to CSV format for download
    let csvContent = "data:text/csv;charset=utf-8,"

    // Rates sheet
    csvContent += "RATES SHEET\n"
    csvContent += "kg,zone1,zone2,zone3,zone4,zone5\n"
    csvContent += "0.5,1092,1085,1228,1159,1448\n"
    csvContent += "1,1315,1296,1491,1297,1784\n"
    csvContent += "2,1537,1533,1751,1434,2113\n\n"

    // Zones sheet
    csvContent += "ZONES SHEET\n"
    csvContent += "zone,countries,extraCharges\n"
    csvContent += '1,"Bangladesh,Bhutan,Maldives","Charge:20"\n'
    csvContent += '2,"Hong Kong,Malaysia,Singapore","Charge:20"\n'
    csvContent += '3,"China","Charge:20"\n'

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "rates_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading rates...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shipping Rates</h1>
          <p className="text-muted-foreground">Manage all your shipping rates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Link href="/rates/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Rates
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No rates found</p>
              <Link href="/rates/upload">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Rate
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Original Name</TableHead>
                  <TableHead>Zones</TableHead>
                  <TableHead>Rate Entries</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate._id}>
                    <TableCell>
                      <Badge variant="secondary">{rate.type}</Badge>
                    </TableCell>
                    <TableCell>{rate.service}</TableCell>
                    <TableCell>{rate.originalName}</TableCell>
                    <TableCell>{rate.zones?.length || 0} zones</TableCell>
                    <TableCell>{rate.rates?.length || 0} entries</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/rates/${rate._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/rates/edit/${rate._id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
