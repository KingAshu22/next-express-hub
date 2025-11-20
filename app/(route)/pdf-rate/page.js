"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Printer, FileDown, Loader2, Check, ChevronsUpDown, Eraser } from "lucide-react";
import { Countries } from "@/app/constants/country";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PDFRatePage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("");
  const [userCode, setUserCode] = useState("");
  const [formData, setFormData] = useState({
    startWeight: 0.5,
    endWeight: 10,
    country: "",
    selectedServices: [],
    profitPercent: 0,
    includeGST: true,
  });
  const [results, setResults] = useState(null);
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const ut = localStorage.getItem("userType") || "";
    const code = localStorage.getItem("code") || "";
    setUserType(ut);
    setUserCode(code);
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services", {
        headers: {
          userType: localStorage.getItem("userType"),
          userId: localStorage.getItem("code"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else {
        toast({ title: "Error", description: "Could not fetch available services.", variant: "destructive"});
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({ title: "Error", description: "An error occurred while fetching services.", variant: "destructive"});
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCountryChange = (value) => {
    setFormData((prev) => ({ ...prev, country: value }));
  };

  const handleServiceToggle = (service) => {
    setFormData((prev) => {
      const selectedServices = prev.selectedServices.includes(service)
        ? prev.selectedServices.filter((s) => s !== service)
        : [...prev.selectedServices, service];
      return { ...prev, selectedServices };
    });
  };

  const handleSelectAllServices = (selectAll) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: selectAll ? services : []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.country || formData.selectedServices.length === 0) {
      toast({ title: "Validation Error", description: "Please select a country and at least one service.", variant: "destructive"});
      return;
    }
    setLoading(true);
    setResults(null); // Clear previous results
    try {
      const response = await fetch("/api/rate-range", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            userType: localStorage.getItem("userType"),
            userId: localStorage.getItem("code"),
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        toast({ title: "Success", description: "Rate sheet generated successfully."});
      } else {
        const errorData = await response.json();
        toast({ title: "API Error", description: errorData.error || "Failed to generate rate sheet.", variant: "destructive"});
      }
    } catch (error) {
      console.error("Error calculating rates:", error);
      toast({ title: "Error", description: "An unexpected error occurred. Please try again.", variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!results) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Rate Sheet - SunEx Services</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 2rem; color: #1f2937; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            .letterhead { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; }
            .company-name { font-size: 1.875rem; font-weight: 700; color: #dc2626; }
            .tagline { font-style: italic; margin-bottom: 0.5rem; color: #4b5563; }
            .contact { font-size: 0.875rem; color: #4b5563;}
            .title { text-align: center; margin-bottom: 1.5rem; }
            .main-title { font-size: 1.25rem; font-weight: 600; }
            .sub-title { font-size: 0.875rem; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
            th, td { border: 1px solid #d1d5db; padding: 0.75rem; text-align: center; }
            th { background-color: #f3f4f6; font-weight: 600; }
            tbody tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 2rem; font-size: 0.75rem; text-align: center; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="company-name">SunEx Services Pvt Ltd</div>
            <div class="tagline">International & Domestic Courier & Cargo Services</div>
            <div class="contact">Mob No: +91 70213 35122</div>
          </div>
          <div class="title">
            <div class="main-title">Rate per Kg for ${results?.countryName || ""}</div>
            <div class="sub-title">As of ${new Date().toLocaleDateString()} (${formData.includeGST ? "Including 18% GST" : "18% GST Extra"})</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Weight (kg)</th>
                ${results?.headers.map((header) => `<th>${header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${results?.rows.map((row) => `
                <tr>
                  <td><b>${row.weight}</b></td>
                  ${row.rates.map((rate) => `<td>${rate !== null ? `₹${rate.toFixed(2)}` : "-"}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>This is a computer-generated document. Rates are subject to change. Thank you for choosing SunEx Services.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };
  
  useEffect(() => {
    const fetchProfitPercent = async () => {
      try {
        if (!formData.country || !userType || userType === "admin") return;
        const normCountry = formData.country.trim().toLowerCase();
        let totalPercent = 0;
        if (userType === "franchise") {
          const resp = await axios.get(`/api/franchises/${userCode}`);
          const franchise = Array.isArray(resp.data) ? resp.data[0] : resp.data;
          const fRates = franchise?.rates || [];
          const match = fRates.find(r => r.country.trim().toLowerCase() === normCountry);
          const rest = fRates.find(r => r.country.trim().toLowerCase() === "rest of world");
          totalPercent = Number(match?.percent ?? rest?.percent ?? 0);
        } else if (userType === "client") {
          const clientRes = await axios.get(`/api/clients/${userCode}`);
          const client = Array.isArray(clientRes.data) ? clientRes.data[0] : clientRes.data;
          const clientRates = client?.rates || [];
          const cMatch = clientRates.find(r => r.country.trim().toLowerCase() === normCountry);
          const cRest = clientRates.find(r => r.country.trim().toLowerCase() === "rest of world");
          const clientPercent = Number(cMatch?.profitPercent ?? cRest?.profitPercent ?? 0);
          let franchisePercent = 0;
          if (client?.owner && client.owner !== "admin") {
            const fRes = await axios.get(`/api/franchises/${client.owner}`);
            const franchise = Array.isArray(fRes.data) ? fRes.data[0] : fRes.data;
            const fRates = franchise?.rates || [];
            const fMatch = fRates.find(r => r.country.trim().toLowerCase() === normCountry);
            const fRest = fRates.find(r => r.country.trim().toLowerCase() === "rest of world");
            franchisePercent = Number(fMatch?.percent ?? fRest?.percent ?? 0);
          }
          totalPercent = clientPercent + franchisePercent;
        }
        setFormData(prev => ({ ...prev, profitPercent: totalPercent }));
      } catch (err) {
        console.error("Error fetching profit percent", err);
      }
    };
    fetchProfitPercent();
  }, [formData.country, userType, userCode]);

  const handleExportExcel = () => {
    if (!results) return;
    const wsData = [
      ["Weight (kg)", ...results.headers],
      ...results.rows.map((row) => [row.weight, ...row.rates.map(rate => rate !== null ? rate : '-')]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rate Sheet");
    const fileName = `RateSheet-${results.countryName}-${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Rate Sheet Generator</h1>
          <p className="text-muted-foreground mt-2">Create, print, and export customized rate sheets per kilogram.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Configure Sheet</CardTitle>
            <CardDescription>Select destination, weight range, and services to include.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="country">Destination Country</Label>
                   <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={countrySearchOpen} className="w-full justify-between">
                                {formData.country ? formData.country : "Select Country..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search country..." />
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup className="max-h-60 overflow-y-auto">
                                    {Countries.map((c) => (
                                        <CommandItem key={c} value={c} onSelect={(currentValue) => {
                                            const selectedCountry = Countries.find(countryInList => countryInList.toLowerCase() === currentValue.toLowerCase());
                                            handleCountryChange(formData.country === selectedCountry ? "" : selectedCountry);
                                            setCountrySearchOpen(false);
                                        }}>
                                            <Check className={cn("mr-2 h-4 w-4", formData.country === c ? "opacity-100" : "opacity-0")} />
                                            {c}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="startWeight">Start Weight (kg)</Label>
                  <Input id="startWeight" name="startWeight" type="number" min="0.5" step="0.5" value={formData.startWeight} onChange={handleInputChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endWeight">End Weight (kg)</Label>
                  <Input id="endWeight" name="endWeight" type="number" min={formData.startWeight} step="0.5" value={formData.endWeight} onChange={handleInputChange} />
                </div>
                {userType === "admin" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="profitPercent">Profit (%)</Label>
                    <Input id="profitPercent" name="profitPercent" type="number" min="0" step="0.1" value={formData.profitPercent} onChange={handleInputChange} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label>Select Services ({formData.selectedServices.length} / {services.length})</Label>
                    <div className="flex gap-2">
                        <Button type="button" variant="link" className="p-0 h-auto" onClick={() => handleSelectAllServices(true)}>Select All</Button>
                        <Button type="button" variant="link" className="p-0 h-auto" onClick={() => handleSelectAllServices(false)}><Eraser className="w-4 h-4 mr-1"/>Clear</Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3 p-4 border rounded-md max-h-48 overflow-y-auto">
                  {services.length > 0 ? services.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox id={`service-${service}`} checked={formData.selectedServices.includes(service)} onCheckedChange={() => handleServiceToggle(service)} />
                      <Label htmlFor={`service-${service}`} className="font-normal cursor-pointer">{service}</Label>
                    </div>
                  )) : <p className="col-span-full text-center text-muted-foreground text-sm">No services available.</p>}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Checkbox id="includeGST" checked={formData.includeGST} onCheckedChange={(checked) => setFormData(prev => ({...prev, includeGST: checked}))} />
                <Label htmlFor="includeGST">Include 18% GST in final rates</Label>
              </div>

              <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Rate Sheet"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>2. View & Export Results</CardTitle>
                    <CardDescription>Your rate sheet is ready to be printed or exported to Excel.</CardDescription>
                </div>
                <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                    <FileDown className="h-4 w-4 mr-2" /> Export
                </Button>
                </div>
            </CardHeader>
            <CardContent>
              <div id="print-area">
                  <div className="text-center mb-6 hidden print-block">
                    <h2 className="text-xl font-bold">SunEx Services Pvt Ltd</h2>
                    <p className="text-sm italic">International & Domestic Courier & Cargo Services</p>
                    <p className="text-xs mt-1">Mob No: +91 70213 35122</p>
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-4">
                    Rate/kg for {results.countryName} as of {new Date().toLocaleDateString()} ({formData.includeGST ? "Including 18% GST" : "18% GST Extra"})
                  </h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left font-semibold">Weight (kg)</th>
                          {results.headers.map((header) => (
                            <th key={header} className="p-2 text-center font-semibold">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 font-medium">{row.weight}</td>
                            {row.rates.map((rate, idx) => (
                              <td key={idx} className="p-2 text-center font-mono">{rate !== null ? `₹${rate.toFixed(2)}` : "-"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}