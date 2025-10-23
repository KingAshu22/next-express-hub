"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Download } from "lucide-react"
import { Countries } from "@/app/constants/country"

export default function RateCalculator() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [calculationMode, setCalculationMode] = useState("single") // "single" or "all"
  const [formData, setFormData] = useState({
    startWeight: 0.5,
    endWeight: 5,
    country: "",
    selectedServices: [],
    selectedService: "", // For all countries mode
    profitPercent: 0,
    includeGST: false,
  })
  const [results, setResults] = useState(null)
  const [allCountriesResults, setAllCountriesResults] = useState(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCountryChange = (value) => {
    setFormData({
      ...formData,
      country: value,
    })
  }

  const handleServiceChange = (value) => {
    setFormData({
      ...formData,
      selectedService: value,
    })
  }

  const handleServiceToggle = (service) => {
    setFormData((prev) => {
      const selectedServices = prev.selectedServices.includes(service)
        ? prev.selectedServices.filter((s) => s !== service)
        : [...prev.selectedServices, service]

      return {
        ...prev,
        selectedServices,
      }
    })
  }

  const handleGSTToggle = (checked) => {
    setFormData({
      ...formData,
      includeGST: checked,
    })
  }

  const handleModeChange = (value) => {
    setCalculationMode(value)
    setResults(null)
    setAllCountriesResults(null)
    // Reset form data when switching modes
    setFormData({
      ...formData,
      selectedServices: [],
      selectedService: "",
      country: "",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (calculationMode === "single") {
      if (!formData.country || formData.selectedServices.length === 0) {
        alert("Please select a country and at least one service")
        return
      }
    } else {
      if (!formData.selectedService) {
        alert("Please select a service")
        return
      }
    }

    setLoading(true)
    try {
      const endpoint = calculationMode === "single" ? "/api/rate-range" : "/api/rate-all-countries"
      const payload =
        calculationMode === "single"
          ? formData
          : {
              ...formData,
              selectedServices: [formData.selectedService],
            }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (calculationMode === "single") {
        setResults(data)
        setAllCountriesResults(null)
      } else {
        setAllCountriesResults(data)
        setResults(null)
      }
    } catch (error) {
      console.error("Error calculating rates:", error)
      alert("Error calculating rates. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    const isAllCountries = calculationMode === "all" && allCountriesResults

    let tableContent = ""

    if (isAllCountries) {
      // All countries table format
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>Weight (kg)</th>
              ${allCountriesResults.countries.map((country) => `<th>${country}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${allCountriesResults.weightRanges
              .map(
                (weightData) => `
              <tr>
                <td>${weightData.weight}</td>
                ${weightData.rates.map((rate) => `<td>${rate || "-"}</td>`).join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    } else if (results) {
      // Single country table format
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>Weight (kg)</th>
              ${results.headers.map((header) => `<th>${header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${results.rows
              .map(
                (row) => `
              <tr>
                <td>${row.weight}</td>
                ${row.rates.map((rate) => `<td>${rate || "-"}</td>`).join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Rate Sheet - Express Hub</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            .letterhead {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #F44336;
            }
            .tagline {
              font-style: italic;
              margin-bottom: 10px;
            }
            .contact {
              font-size: 14px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .gst-note {
              margin: 15px 0;
              font-style: italic;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: ${isAllCountries ? "10px" : "12px"};
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: center;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              text-align: center;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="company-name">Express Hub</div>
            <div class="tagline">International & Domestic Courier & Cargo Services</div>
            <div class="contact">Mob No: +91 97699 93011 / +91 81691 55537</div>
          </div>
          
          <div class="title">
            ${
              isAllCountries
                ? `Rate for All Countries - ${formData.selectedService}`
                : `Rate for ${results?.countryName || ""}`
            }
          </div>
          
          <div class="gst-note">
            ${formData.includeGST ? "Rates are inclusive of 18% GST" : "18% GST will be charged extra"}
            <br>
            All rates are per kg
          </div>
          
          ${tableContent}
          
          <div class="footer">
            <p>Thank you for choosing Express Hub</p>
            <p>This rate sheet is as of ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const handleCSVExport = () => {
    if (!allCountriesResults && !results) return

    let csvContent = ""

    if (calculationMode === "all" && allCountriesResults) {
      // CSV for all countries
      const headers = ["Weight (kg)", ...allCountriesResults.countries]
      csvContent = headers.join(",") + "\n"

      allCountriesResults.weightRanges.forEach((weightData) => {
        const row = [weightData.weight, ...weightData.rates.map((rate) => rate || "-")]
        csvContent += row.join(",") + "\n"
      })
    } else if (results) {
      // CSV for single country
      const headers = ["Weight (kg)", ...results.headers]
      csvContent = headers.join(",") + "\n"

      results.rows.forEach((row) => {
        const csvRow = [row.weight, ...row.rates.map((rate) => rate || "-")]
        csvContent += csvRow.join(",") + "\n"
      })
    }

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `rate-sheet-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Rate Calculator</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate Rate Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-3">
              <Label>Calculation Mode</Label>
              <RadioGroup value={calculationMode} onValueChange={handleModeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">Rate for Single Country</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Rate for All Countries</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country Selection - Only for single country mode */}
              {calculationMode === "single" && (
                <div className="space-y-2">
                  <Label htmlFor="country">Select Country</Label>
                  <Select onValueChange={handleCountryChange} value={formData.country}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Service Selection - Single service for all countries mode */}
              {calculationMode === "all" && (
                <div className="space-y-2">
                  <Label htmlFor="service">Select Service</Label>
                  <Select onValueChange={handleServiceChange} value={formData.selectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="profitPercent">Profit Percentage</Label>
                <Input
                  id="profitPercent"
                  name="profitPercent"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.profitPercent}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startWeight">Start Weight (kg)</Label>
                <Input
                  id="startWeight"
                  name="startWeight"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.startWeight}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endWeight">End Weight (kg)</Label>
                <Input
                  id="endWeight"
                  name="endWeight"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.endWeight}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Multiple Services Selection - Only for single country mode */}
            {calculationMode === "single" && (
              <div className="space-y-2">
                <Label>Select Services</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {services.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        checked={formData.selectedServices.includes(service)}
                        onCheckedChange={() => handleServiceToggle(service)}
                      />
                      <Label htmlFor={`service-${service}`}>{service}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox id="includeGST" checked={formData.includeGST} onCheckedChange={handleGSTToggle} />
              <Label htmlFor="includeGST">Include 18% GST in rates</Label>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Calculating..." : "Generate Rate Sheet"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results for Single Country */}
      {results && calculationMode === "single" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rate Sheet</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCSVExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Express Hub</h2>
              <p className="text-sm italic">International & Domestic Courier & Cargo Services</p>
              <p className="text-xs mt-1">Mob No: +91 97699 93011 / +91 81691 55537</p>
            </div>
            <h3 className="text-lg font-semibold text-center mb-4">Rate for {results.countryName}</h3>
            <p className="text-sm italic mb-4">
              {formData.includeGST ? "Rates are inclusive of 18% GST" : "18% GST will be charged extra"}
              <br />
              All rates are per kg
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Weight (kg)</th>
                    {results.headers.map((header) => (
                      <th key={header} className="border p-2 text-center">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="border p-2 font-medium">{row.weight}</td>
                      {row.rates.map((rate, idx) => (
                        <td key={idx} className="border p-2 text-center">
                          {rate || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results for All Countries */}
      {allCountriesResults && calculationMode === "all" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rate Sheet - All Countries</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCSVExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Express Hub</h2>
              <p className="text-sm italic">International & Domestic Courier & Cargo Services</p>
              <p className="text-xs mt-1">Mob No: +91 97699 93011 / +91 81691 55537</p>
            </div>
            <h3 className="text-lg font-semibold text-center mb-4">
              Rate for All Countries - {formData.selectedService}
            </h3>
            <p className="text-sm italic mb-4">
              {formData.includeGST ? "Rates are inclusive of 18% GST" : "18% GST will be charged extra"}
              <br />
              All rates are per kg
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left font-medium">Weight (kg)</th>
                    {allCountriesResults.countries.map((country) => (
                      <th key={country} className="border p-2 text-center font-medium min-w-[100px]">
                        {country}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allCountriesResults.weightRanges.map((weightData, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="border p-2 font-medium">{weightData.weight}</td>
                      {weightData.rates.map((rate, idx) => (
                        <td key={idx} className="border p-2 text-center">
                          {rate || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
