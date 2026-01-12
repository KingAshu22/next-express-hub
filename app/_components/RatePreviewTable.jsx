"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RatePreviewTable({ rates, zones, rateMode, baseRateMode }) {
  if (!rates || rates.length === 0) return null

  // Format zones based on rate mode
  const formatZoneLabel = (zone) => {
    if (rateMode === "single-country-zip") {
      return zone.zoneName
    }
    return `Zone ${zone.zoneName || zone}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Preview</CardTitle>
        <CardDescription>
          {baseRateMode === "baseRate"
            ? "Showing total rates per weight"
            : "Showing rates per kg (multiply by weight for total)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted">Weight (kg)</TableHead>
                {zones.map((zone) => (
                  <TableHead key={zone.zoneName || zone} className="bg-muted text-right">
                    {formatZoneLabel(zone)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.slice(0, 20).map((rate, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-center">{rate.kg}</TableCell>
                  {zones.map((zone) => {
                    const zoneKey = zone.zoneName || zone
                    const value = rate[zoneKey]
                    return (
                      <TableCell key={zoneKey} className="text-right">
                        <Badge variant="outline">{baseRateMode === "baseRate" ? `₹${value}` : `₹${value}/kg`}</Badge>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rates.length > 20 && (
          <p className="text-xs text-muted-foreground text-center mt-2">Showing first 20 of {rates.length} rates...</p>
        )}
      </CardContent>
    </Card>
  )
}
