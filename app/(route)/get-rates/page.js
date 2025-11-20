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
import { Countries } from '@/app/constants/country'
import axios from 'axios'
import { Separator } from '@/components/ui/separator'

// Helper function for consistent currency formatting
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    return amount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

// A dedicated component for rendering each result card.
const ResultCard = ({ data, billedWeight, showProfit }) => {
    const perKgRate = billedWeight > 0 ? data.total / billedWeight : 0;
    const hasOtherCharges = data.chargesBreakdown && Object.keys(data.chargesBreakdown).length > 0;

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
                            <div className="flex justify-between">
                                <span>Base Rate:</span>
                                <span className="font-mono">{formatCurrency(data.baseRate)}</span>
                            </div>
                            {showProfit && (
                                data.isSpecialRate ? (
                                    <div className="flex justify-between items-center p-2 bg-blue-50 border border-blue-200 rounded-md">
                                        <Info className="h-4 w-4 text-blue-500 mr-2" />
                                        <span className="text-blue-700 text-xs font-semibold">Special Rate (No Profit Applied)</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between">
                                        <span>Profit ({data.profitPercent}%):</span>
                                        <span className="font-mono">{formatCurrency(data.profitCharges)}</span>
                                    </div>
                                )
                            )}
                            {hasOtherCharges && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-medium">
                                        <span>Additional Charges:</span>
                                    </div>
                                    <div className="pl-4 border-l-2 ml-2 space-y-1">
                                        {Object.entries(data.chargesBreakdown).map(([key, value]) => (
                                            <div key={key} className="flex justify-between text-xs text-muted-foreground">
                                                <span>{key}:</span>
                                                <span className="font-mono">{formatCurrency(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between font-semibold">
                                <span>Subtotal (before GST):</span>
                                <span className="font-mono">{formatCurrency(data.subtotalBeforeGST)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GST (18%):</span>
                                <span className="font-mono">{formatCurrency(data.gstAmount)}</span>
                            </div>
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

    // State for calculated values
    const [volumetricWeight, setVolumetricWeight] = useState(0);
    const [chargeableWeight, setChargeableWeight] = useState(0);
    const [billedWeight, setBilledWeight] = useState(0);

    // General state
    const [availableTypes, setAvailableTypes] = useState([]);
    const [showProfit, setShowProfit] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userType, setUserType] = useState('');
    const [code, setCode] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

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
            finalWeight = (rawChargeableWeight <= 20) ? Math.ceil(rawChargeableWeight * 2) / 2 : Math.ceil(rawChargeableWeight);
        }
        setBilledWeight(finalWeight);
    }, [actualWeight, length, breadth, height]);

    // --- FIX 1: Pass values directly to fetchServices ---
    useEffect(() => {
        const ut = localStorage.getItem('userType') || '';
        const c = localStorage.getItem('code') || '';
        
        setUserType(ut);
        setCode(c);
        
        fetchServices(ut, c); // Pass the values directly
        
        if (ut === 'admin') {
            setShowProfit(true);
        }
    }, []);

    // --- FIX 2: Update fetchServices to accept parameters ---
    const fetchServices = async (currentUserType, currentCode) => {
        try {
            const response = await fetch("/api/services", {
                headers: {
                    userType: currentUserType,
                    userId: currentCode,
                },
            });
            const data = await response.json();
            setAvailableTypes(data);
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    };

    useEffect(() => {
        const fetchProfitPercent = async () => {
            if (!country || !userType || userType === 'admin') return;
            try {
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
                    if (client?.owner && client.owner !== "admin") {
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
                console.error("Failed to fetch profit percent:", err);
            }
        };
        fetchProfitPercent();
    }, [country, userType, code]);

    const handleFetchRates = async () => {
        if (!billedWeight || billedWeight <= 0 || !country) {
            setError('Please provide a valid weight/dimensions and select a country.');
            return;
        }
        setLoading(true);
        setError('');
        setResults([]);
        setHasSearched(true);
        try {
            // --- FIX 3: Pass headers directly in this function too ---
            const apiHeaders = {
                userType: userType,
                userId: code,
            };
            const promises = availableTypes.map(async (type) => {
                const params = new URLSearchParams({ type, weight: billedWeight, country, profitPercent });
                const res = await fetch(`/api/rate?${params.toString()}`, { headers: apiHeaders });
                if (!res.ok) {
                    const errorData = await res.json();
                    return { type, data: { error: errorData.error || `HTTP error! status: ${res.status}` } };
                }
                const data = await res.json();
                return { type, data };
            });
            const resultsData = await Promise.all(promises);
            const filtered = resultsData.filter(r => r.data && !r.data.error).sort((a, b) => a.data.total - b.data.total);
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
                                    <Input id="volWeight" value={volumetricWeight.toFixed(2)} readOnly className="mt-1 bg-gray-100 dark:bg-gray-800" />
                                </div>
                                <div>
                                    <Label htmlFor="chargeWeight" className="text-sm text-muted-foreground">Chargeable Wt. (kg)</Label>
                                    <Input id="chargeWeight" value={chargeableWeight.toFixed(2)} readOnly className="mt-1 bg-gray-100 dark:bg-gray-800" />
                                </div>
                                <div>
                                    <Label htmlFor="billedWeight" className="text-sm font-bold">Billed Weight (kg)</Label>
                                    <Input id="billedWeight" value={billedWeight.toFixed(2)} readOnly className="mt-1 bg-blue-50 dark:bg-blue-900/30 border-blue-400 font-bold" />
                                </div>
                            </div>
                            {showProfit && (
                                <div className="md:col-span-2">
                                    <Label htmlFor="profit" className="font-semibold">Profit %</Label>
                                    <Input id="profit" type="number" placeholder="e.g., 50" value={profitPercent} onChange={(e) => setProfitPercent(e.target.value)} className="mt-1" />
                                </div>
                            )}
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