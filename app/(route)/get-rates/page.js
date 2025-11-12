'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2, Info, PackageSearch } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox' // <-- Import Checkbox
import { Countries } from '@/app/constants/country'
import axios from 'axios'
import { Separator } from '@/components/ui/separator'

// Helper function for consistent currency formatting
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return amount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

// A dedicated component for rendering each result card.
const ResultCard = ({ data, billedWeight, showProfit }) => {
    // Calculate per-kg rate based on the final billed weight used for the API call
    const perKgRate = billedWeight > 0 ? data.total / billedWeight : 0;

    return (
        <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-800">{data.originalName}</CardTitle>
                        <CardDescription className="text-sm">Zone {data.zone}</CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-extrabold text-green-600">{formatCurrency(data.total)}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(perKgRate)}/kg</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-sm font-semibold">View Price Breakdown</AccordionTrigger>
                        <AccordionContent className="text-sm space-y-2 pt-2">
                            {/* Conditional rendering for Base Rate and Profit */}
                            {showProfit ? (
                                <>
                                    <div className="flex justify-between">
                                        <span>Base Rate:</span>
                                        <span className="font-mono">{formatCurrency(data.baseRate)}</span>
                                    </div>
                                    {data.isSpecialRate ? (
                                        <div className="flex justify-between items-center p-2 bg-blue-50 border border-blue-200 rounded-md">
                                            <Info className="h-4 w-4 text-blue-500 mr-2" />
                                            <span className="text-blue-700 text-xs font-semibold">Special Rate (Profit Included)</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between">
                                            <span>Profit ({data.profitPercent}%):</span>
                                            <span className="font-mono">{formatCurrency(data.profitCharges)}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex justify-between">
                                    <span>Base Rate:</span>
                                    {/* For non-admins, show Base Rate + Profit combined */}
                                    <span className="font-mono">{formatCurrency(data.baseRate + data.profitCharges)}</span>
                                </div>
                            )}

                            {/* UPDATED: Display Extra Charges section if total is > 0 */}
                            {data.extraChargeTotal > 0 && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-medium">
                                        <span>Extra Charges:</span>
                                        <span className="font-mono">{formatCurrency(data.extraChargeTotal)}</span>
                                    </div>
                                    <div className="pl-4 border-l-2 ml-2">
                                        {Object.entries(data.extraChargesBreakdown).map(([key, value]) => (
                                            <div key={key} className="flex justify-between text-xs text-muted-foreground">
                                                <span>{key}:</span>
                                                <span className="font-mono">{formatCurrency(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            
                            {/* NEW: Display AWB Charges if they exist */}
                            {data.awbCharges > 0 && (
                                <div className="flex justify-between">
                                    <span>AWB Charges:</span>
                                    <span className="font-mono">{formatCurrency(data.awbCharges)}</span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span>Fuel Surcharge ({data.fuelChargePercent}%):</span>
                                <span className="font-mono">{formatCurrency(data.fuelCharges)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-semibold">
                                <span>Subtotal:</span>
                                <span className="font-mono">{formatCurrency(data.subtotalBeforeGST)}</span>
                            </div>

                            {/* NEW: Conditionally display GST based on API response */}
                            {data.gstApplied && data.gstAmount > 0 && (
                                <div className="flex justify-between">
                                    <span>GST (18%):</span>
                                    <span className="font-mono">{formatCurrency(data.gstAmount)}</span>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default function GetRatesPage() {
    // State for inputs
    const [actualWeight, setActualWeight] = useState('');
    const [length, setLength] = useState('');
    const [breadth, setBreadth] = useState('');
    const [height, setHeight] = useState('');
    const [country, setCountry] = useState('');
    const [profitPercent, setProfitPercent] = useState('0');
    const [countrySearchOpen, setCountrySearchOpen] = useState(false);
    const [applyGst, setApplyGst] = useState(false); // <-- State for GST checkbox

    // State for calculated values
    const [volumetricWeight, setVolumetricWeight] = useState(0);
    const [chargeableWeight, setChargeableWeight] = useState(0); // Raw max weight
    const [billedWeight, setBilledWeight] = useState(0); // Final rounded weight for API

    // General state
    const [availableTypes, setAvailableTypes] = useState([]);
    const [showProfit, setShowProfit] = useState(true);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userType, setUserType] = useState('');
    const [code, setCode] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // This effect recalculates all weights whenever inputs change
    useEffect(() => {
        const l = parseFloat(length) || 0;
        const b = parseFloat(breadth) || 0;
        const h = parseFloat(height) || 0;
        const aw = parseFloat(actualWeight) || 0;

        let volWeight = (l * b * h) / 5000;
        setVolumetricWeight(volWeight);

        const rawChargeableWeight = Math.max(aw, volWeight);
        setChargeableWeight(rawChargeableWeight);

        let finalWeight = 0;
        if (rawChargeableWeight > 0) {
            if (rawChargeableWeight <= 20) {
                finalWeight = Math.ceil(rawChargeableWeight * 2) / 2;
            } else {
                finalWeight = Math.ceil(rawChargeableWeight);
            }
        }
        setBilledWeight(finalWeight);
    }, [actualWeight, length, breadth, height]);

    // Effect to fetch services and user data on component mount
    useEffect(() => {
        const ut = localStorage.getItem('userType') || '';
        const c = localStorage.getItem('code') || '';
        fetchServices();
        setUserType(ut);
        setCode(c);
        if (ut !== 'admin') setShowProfit(false);
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch("/api/services", {
                headers: {
                    userType: localStorage.getItem("userType"),
                    userId: localStorage.getItem("code"),
                },
            });
            const data = await response.json();
            setAvailableTypes(data);
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    };

    // Effect to fetch profit percentage based on user type and country
    useEffect(() => {
        const fetchProfitPercent = async () => {
            if (!country || userType === 'admin') return;

            try {
                setLoading(true);
                setError('');
                const normCountry = country.trim().toLowerCase();
                let totalPercent = 0;

                if (userType === 'franchise') {
                    const res = await axios.get(`/api/franchises/${code}`);
                    const franchise = Array.isArray(res.data) ? res.data[0] : res.data;
                    const rates = franchise?.rates || [];
                    const match = rates.find(r => r.country?.trim().toLowerCase() === normCountry);
                    const rest = rates.find(r => r.country?.trim().toLowerCase() === 'rest of world');
                    totalPercent = Number(match?.percent ?? rest?.percent ?? 0);
                } else if (userType === 'client') {
                    const clientRes = await axios.get(`/api/clients/${code}`);
                    const client = Array.isArray(clientRes.data) ? clientRes.data[0] : clientRes.data;
                    const clientRates = client?.rates || [];
                    const clientMatch = clientRates.find(r => r.country?.trim().toLowerCase() === normCountry);
                    const clientRest = clientRates.find(r => r.country?.trim().toLowerCase() === 'rest of world');
                    const clientP = Number(clientMatch?.profitPercent ?? clientRest?.profitPercent ?? 0);

                    let franchiseP = 0;
                    if (client?.owner !== "admin") {
                        const franchiseRes = await axios.get(`/api/franchises/${client.owner}`);
                        const franchise = Array.isArray(franchiseRes.data) ? franchiseRes.data[0] : franchiseRes.data;
                        const fRates = franchise?.rates || [];
                        const fMatch = fRates.find(r => r.country?.trim().toLowerCase() === normCountry);
                        const fRest = fRates.find(r => r.country?.trim().toLowerCase() === 'rest of world');
                        franchiseP = Number(fMatch?.percent ?? fRest?.percent ?? 0);
                    }
                    totalPercent = clientP + franchiseP;
                }
                setProfitPercent(totalPercent.toString());
            } catch (err) {
                console.error(err);
                setError('Failed to fetch profit percent data.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfitPercent();
    }, [country, userType, code]);

    const handleFetchRates = async () => {
        if ((!billedWeight || billedWeight <= 0) || !country) {
            setError('Please provide a valid weight/dimensions and select a country.');
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);
        setHasSearched(true);

        try {
            const promises = availableTypes.map(async (type) => {
                const params = new URLSearchParams({ type, weight: billedWeight, country, profitPercent });
                // NEW: Conditionally add 'gst=false' if the checkbox is unchecked
                if (!applyGst) {
                    params.append('gst', 'false');
                }
                const res = await fetch(`/api/rate?${params.toString()}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    return { type, data: { error: errorData.error || `HTTP error! status: ${res.status}` } };
                }
                const data = await res.json();
                return { type, data };
            });

            const resultsData = await Promise.all(promises);
            const filtered = resultsData.filter(r => !r.data.error).sort((a, b) => a.data.total - b.data.total);

            if (!filtered.length) {
                const firstError = resultsData.find(r => r.data.error);
                setError(firstError?.data.error || 'No services found for the selected criteria.');
            }
            setResults(filtered);
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred while fetching rates.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-2">Ship Smarter, Not Harder</h1>
                <p className="text-center text-muted-foreground mb-8">Instantly compare shipping rates across top carriers.</p>
                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="country" className="font-semibold">Destination Country</Label>
                                    <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={countrySearchOpen} className="w-full justify-between mt-1">
                                                {country ? country : "Select Country..."}
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
                                                            setCountry(country === selectedCountry ? "" : selectedCountry);
                                                            setCountrySearchOpen(false);
                                                        }}>
                                                            <Check className={cn("mr-2 h-4 w-4", country === c ? "opacity-100" : "opacity-0")} />
                                                            {c}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label htmlFor="actualWeight" className="font-semibold">Actual Weight (kg)</Label>
                                    <Input id="actualWeight" type="number" placeholder="e.g., 2.5" value={actualWeight} onChange={(e) => setActualWeight(e.target.value)} className="mt-1" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="font-semibold">Dimensions (cm) - Optional</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input type="number" placeholder="L" value={length} onChange={(e) => setLength(e.target.value)} />
                                    <Input type="number" placeholder="B" value={breadth} onChange={(e) => setBreadth(e.target.value)} />
                                    <Input type="number" placeholder="H" value={height} onChange={(e) => setHeight(e.target.value)} />
                                </div>
                            </div>
                            <div className="md:col-span-2 grid grid-cols-3 gap-2">
                                <div>
                                    <Label htmlFor="volWeight" className="text-sm text-muted-foreground">Volumetric Wt. (kg)</Label>
                                    <Input id="volWeight" value={volumetricWeight.toFixed(2)} readOnly className="mt-1 bg-gray-100" />
                                </div>
                                <div>
                                    <Label htmlFor="chargeWeight" className="text-sm text-muted-foreground">Chargeable Wt. (kg)</Label>
                                    <Input id="chargeWeight" value={chargeableWeight.toFixed(2)} readOnly className="mt-1 bg-gray-100" />
                                </div>
                                <div>
                                    <Label htmlFor="billedWeight" className="text-sm font-bold">Billed Weight (kg)</Label>
                                    <Input id="billedWeight" value={billedWeight.toFixed(2)} readOnly className="mt-1 bg-blue-50 border-blue-400 font-bold" />
                                </div>
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between gap-4">
                                {showProfit && (
                                    <div className="flex-grow">
                                        <Label htmlFor="profit" className="font-semibold">Profit %</Label>
                                        <Input id="profit" type="number" placeholder="e.g., 50" value={profitPercent} onChange={(e) => setProfitPercent(e.target.value)} className="mt-1" />
                                    </div>
                                )}
                                {/* NEW: GST Checkbox */}
                                <div className="flex items-center space-x-2 pt-6">
                                    <Checkbox id="gst" checked={applyGst} onCheckedChange={setApplyGst} />
                                    <Label htmlFor="gst" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Include GST
                                    </Label>
                                </div>
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <Button onClick={handleFetchRates} disabled={loading || billedWeight <= 0 || !country} className="w-full text-lg py-6">
                                    {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Fetching Best Rates...</>) : ('Get Rates')}
                                </Button>
                            </div>
                        </div>
                        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
                    </CardContent>
                </Card>
                <div className="mt-10">
                    {loading ? (
                        <div className="text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p>Searching for rates...</p></div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map(({ type, data }) => (<ResultCard key={type} data={data} billedWeight={billedWeight} showProfit={showProfit} />))}
                        </div>
                    ) : hasSearched && !error ? (
                        <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                            <PackageSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">No Services Found</h3>
                            <p className="text-muted-foreground mt-2">We couldn't find any shipping services for the selected criteria. Please try different options.</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}