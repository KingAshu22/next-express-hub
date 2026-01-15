'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2, Info, PackageSearch, Package, ShoppingCart, Filter, MapPin, Globe } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Countries } from '@/app/constants/country'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

// Rate category badge component
const RateCategoryBadge = ({ category }) => {
    if (category === 'purchase') {
        return (
            <Badge variant="outline" className="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800">
                <Package className="w-3 h-3 mr-1" />
                Purchase
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800">
            <ShoppingCart className="w-3 h-3 mr-1" />
            Sales
        </Badge>
    );
};

// Rate mode badge
const RateModeBadge = ({ mode, targetCountry }) => {
    if (mode === 'single-country-zip') {
        return (
            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800">
                <MapPin className="w-3 h-3 mr-1" />
                ZIP: {targetCountry}
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800">
            <Globe className="w-3 h-3 mr-1" />
            Multi-Country
        </Badge>
    );
};

// Rate status badge
const RateStatusBadge = ({ status }) => {
    if (status === 'hidden') {
        return (
            <Badge variant="outline" className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800">
                Hidden
            </Badge>
        );
    }
    if (status === 'unlisted') {
        return (
            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800">
                Unlisted
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800">
            Live
        </Badge>
    );
};

// Result card component
const ResultCard = ({ data, billedWeight, showProfit, includeGST }) => {
    const displayTotal = includeGST ? data.total : data.subtotalBeforeGST;
    const perKgRate = billedWeight > 0 ? displayTotal / billedWeight : 0;
    const hasOtherCharges = data.chargesBreakdown && Object.keys(data.chargesBreakdown).length > 0;

    return (
        <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate mb-1">
                            {data.originalName}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            <RateCategoryBadge category={data.rateCategory} />
                            <RateModeBadge mode={data.rateMode} targetCountry={data.targetCountry} />
                            {showProfit && data.rateStatus && (
                                <RateStatusBadge status={data.rateStatus} />
                            )}
                        </div>
                        <CardDescription className="text-sm mt-1">
                            {data.vendorName && <span className="font-medium">{data.vendorName} • </span>}
                            Zone {data.zone}
                        </CardDescription>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-extrabold text-green-600">{formatCurrency(displayTotal)}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(perKgRate)}/kg</p>
                        <p className="text-xs text-muted-foreground">
                            {includeGST ? 'incl. GST' : 'excl. GST'}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="text-sm font-semibold py-2">View Price Breakdown</AccordionTrigger>
                        <AccordionContent className="text-sm space-y-2 pt-2">
                            <div className="flex justify-between">
                                <span>Base Rate:</span>
                                <span className="font-mono">{formatCurrency(data.baseRate)}</span>
                            </div>
                            {showProfit && (
                                data.isSpecialRate ? (
                                    <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                                        <Info className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                        <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                            Special Rate ({data.rateStatus})
                                        </span>
                                    </div>
                                ) : data.profitCharges > 0 ? (
                                    <div className="flex justify-between">
                                        <span>Profit ({data.profitPercent}%):</span>
                                        <span className="font-mono">{formatCurrency(data.profitCharges)}</span>
                                    </div>
                                ) : null
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
                            <div className={cn(
                                "flex justify-between",
                                !includeGST ? "font-bold text-green-600" : "font-semibold"
                            )}>
                                <span>Subtotal (excl. GST):</span>
                                <span className="font-mono">{formatCurrency(data.subtotalBeforeGST)}</span>
                            </div>
                            <div className={cn(
                                "flex justify-between",
                                includeGST ? "" : "text-muted-foreground"
                            )}>
                                <span>GST (18%):</span>
                                <span className="font-mono">{formatCurrency(data.gstAmount)}</span>
                            </div>
                            {includeGST && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-green-600">
                                        <span>Total (incl. GST):</span>
                                        <span className="font-mono">{formatCurrency(data.total)}</span>
                                    </div>
                                </>
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
    const [zipCode, setZipCode] = useState('');
    const [profitPercent, setProfitPercent] = useState('0');
    const [countrySearchOpen, setCountrySearchOpen] = useState(false);
    const [rateCategory, setRateCategory] = useState('sales');
    const [includeGST, setIncludeGST] = useState(false);

    // State for calculated values
    const [volumetricWeight, setVolumetricWeight] = useState(0);
    const [chargeableWeight, setChargeableWeight] = useState(0);
    const [billedWeight, setBilledWeight] = useState(0);

    // General state
    const [availableServices, setAvailableServices] = useState([]);
    const [showProfit, setShowProfit] = useState(false);
    const [canViewPurchase, setCanViewPurchase] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
    const [error, setError] = useState('');
    const [userType, setUserType] = useState('');
    const [code, setCode] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Calculate weights
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

    // Initialize user context
    useEffect(() => {
        const ut = localStorage.getItem('userType') || '';
        const c = localStorage.getItem('code') || '';

        setUserType(ut);
        setCode(c);

        if (ut === 'admin' || ut === 'branch') {
            setShowProfit(true);
            setCanViewPurchase(true);
            setRateCategory('purchase');
        } else {
            setRateCategory('sales');
        }
        
        setIsInitialized(true);
    }, []);

    // Fetch services when country or zip changes (debounced)
    useEffect(() => {
        if (isInitialized && country) {
            const timer = setTimeout(() => {
                fetchServices(userType, code, rateCategory, country, zipCode);
            }, 300); // Debounce 300ms
            return () => clearTimeout(timer);
        } else if (isInitialized && !country) {
            // If no country, fetch all services without filtering
            fetchServices(userType, code, rateCategory, '', '');
        }
    }, [isInitialized, rateCategory, country, zipCode]);

    const fetchServices = async (currentUserType, currentCode, category, selectedCountry, selectedZip) => {
        setLoadingServices(true);
        setError('');
        
        const effectiveUserType = currentUserType || 'admin';
        const effectiveCode = currentCode || '';
        
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('rateCategory', category);
            if (selectedCountry) {
                params.append('country', selectedCountry);
            }
            if (selectedZip) {
                params.append('zipCode', selectedZip);
            }

            const response = await fetch(`/api/services?${params.toString()}`, {
                headers: {
                    'userType': effectiveUserType,
                    'userId': effectiveCode,
                },
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch services: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setAvailableServices(data);
            } else {
                setAvailableServices([]);
            }
        } catch (error) {
            setError(`Error loading services: ${error.message}`);
            setAvailableServices([]);
        } finally {
            setLoadingServices(false);
        }
    };

    const handleFetchRates = async () => {
        if (!billedWeight || billedWeight <= 0 || !country) {
            setError('Please provide a valid weight/dimensions and select a country.');
            return;
        }

        if (availableServices.length === 0) {
            setError('No services available for the selected criteria. Try selecting a different country or adding a ZIP code.');
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);
        setHasSearched(true);

        try {
            const effectiveUserType = userType || 'admin';
            const effectiveCode = code || '';

            const promises = availableServices.map(async (service) => {
                const params = new URLSearchParams({
                    type: service.originalName,
                    weight: billedWeight.toString(),
                    country,
                    profitPercent,
                    rateCategory: service.rateCategory || rateCategory
                });

                // Add ZIP code if service requires it or if provided
                if (zipCode && service.rateMode === 'single-country-zip') {
                    params.append('zipCode', zipCode);
                } else if (zipCode) {
                    params.append('zipCode', zipCode);
                }

                const res = await fetch(`/api/rate?${params.toString()}`, { 
                    headers: {
                        'userType': effectiveUserType,
                        'userId': effectiveCode,
                    }
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    return {
                        service: service.originalName,
                        rateCategory: service.rateCategory,
                        rateMode: service.rateMode,
                        data: { error: errorData.error || `HTTP error! status: ${res.status}` }
                    };
                }

                const data = await res.json();
                return {
                    service: service.originalName,
                    rateCategory: service.rateCategory,
                    rateMode: service.rateMode,
                    data
                };
            });

            const resultsData = await Promise.all(promises);
            const filtered = resultsData
                .filter(r => r.data && !r.data.error)
                .sort((a, b) => {
                    const aTotal = includeGST ? a.data.total : a.data.subtotalBeforeGST;
                    const bTotal = includeGST ? b.data.total : b.data.subtotalBeforeGST;
                    return aTotal - bTotal;
                });

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

    // Re-sort results when GST toggle changes
    useEffect(() => {
        if (results.length > 0) {
            const sorted = [...results].sort((a, b) => {
                const aTotal = includeGST ? a.data.total : a.data.subtotalBeforeGST;
                const bTotal = includeGST ? b.data.total : b.data.subtotalBeforeGST;
                return aTotal - bTotal;
            });
            setResults(sorted);
        }
    }, [includeGST]);

    // Count services by type
    const purchaseCount = availableServices.filter(s => s.rateCategory === 'purchase').length;
    const salesCount = availableServices.filter(s => s.rateCategory === 'sales').length;
    const multiCountryCount = availableServices.filter(s => s.rateMode === 'multi-country').length;
    const zipBasedCount = availableServices.filter(s => s.rateMode === 'single-country-zip').length;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-2">Ship Smarter, Not Harder</h1>
                <p className="text-center text-muted-foreground mb-8">Instantly compare shipping rates across top carriers.</p>

                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        {/* Rate Category Selector */}
                        {canViewPurchase && (
                            <div className="mb-6">
                                <Label className="font-semibold mb-2 block">Rate Category</Label>
                                <Tabs value={rateCategory} onValueChange={setRateCategory} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="sales" className="flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4" />
                                            Sales
                                            {salesCount > 0 && (
                                                <Badge variant="secondary" className="ml-1">{salesCount}</Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="purchase" className="flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Purchase
                                            {purchaseCount > 0 && (
                                                <Badge variant="secondary" className="ml-1">{purchaseCount}</Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="all" className="flex items-center gap-2">
                                            <Filter className="w-4 h-4" />
                                            All
                                            <Badge variant="secondary" className="ml-1">
                                                {availableServices.length}
                                            </Badge>
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {rateCategory === 'purchase' && "Viewing internal cost rates (hidden from clients)."}
                                    {rateCategory === 'sales' && "Viewing client-facing rates."}
                                    {rateCategory === 'all' && "Viewing all available rates."}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="country" className="font-semibold">Destination Country</Label>
                                    <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={countrySearchOpen}
                                                className="w-full justify-between mt-1"
                                            >
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
                                                        <CommandItem
                                                            key={c}
                                                            value={c}
                                                            onSelect={(currentValue) => {
                                                                const selectedCountry = Countries.find(
                                                                    countryInList => countryInList.toLowerCase() === currentValue.toLowerCase()
                                                                );
                                                                setCountry(country === selectedCountry ? "" : selectedCountry);
                                                                setCountrySearchOpen(false);
                                                            }}
                                                        >
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
                                    <Label htmlFor="zipCode" className="font-semibold flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        ZIP/Postal Code
                                        <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                                    </Label>
                                    <Input
                                        id="zipCode"
                                        type="text"
                                        placeholder="e.g., 2000"
                                        value={zipCode}
                                        onChange={(e) => setZipCode(e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {zipCode ? (
                                            <span className="text-blue-600">
                                                Showing both ZIP-based ({zipBasedCount}) and country-based ({multiCountryCount}) rates
                                            </span>
                                        ) : (
                                            "Enter ZIP code to see location-specific rates (if available)"
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="actualWeight" className="font-semibold">Actual Weight (kg)</Label>
                                    <Input
                                        id="actualWeight"
                                        type="number"
                                        placeholder="e.g., 2.5"
                                        value={actualWeight}
                                        onChange={(e) => setActualWeight(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="font-semibold">Dimensions (cm) - Optional</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input
                                        type="number"
                                        placeholder="L"
                                        value={length}
                                        onChange={(e) => setLength(e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="B"
                                        value={breadth}
                                        onChange={(e) => setBreadth(e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="H"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-2">
                                    <div>
                                        <Label htmlFor="volWeight" className="text-xs text-muted-foreground">Vol. Wt.</Label>
                                        <Input
                                            id="volWeight"
                                            value={volumetricWeight.toFixed(2)}
                                            readOnly
                                            className="mt-1 bg-gray-100 dark:bg-gray-800 text-sm h-9"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="chargeWeight" className="text-xs text-muted-foreground">Chg. Wt.</Label>
                                        <Input
                                            id="chargeWeight"
                                            value={chargeableWeight.toFixed(2)}
                                            readOnly
                                            className="mt-1 bg-gray-100 dark:bg-gray-800 text-sm h-9"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="billedWeight" className="text-xs font-bold">Billed Wt.</Label>
                                        <Input
                                            id="billedWeight"
                                            value={billedWeight.toFixed(2)}
                                            readOnly
                                            className="mt-1 bg-blue-50 dark:bg-blue-900/30 border-blue-400 font-bold text-sm h-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* GST Toggle and Profit Input Row */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="gst-toggle" className="font-semibold">Include GST (18%)</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {includeGST ? "Showing rates with GST included" : "Showing rates without GST"}
                                        </p>
                                    </div>
                                    <Switch
                                        id="gst-toggle"
                                        checked={includeGST}
                                        onCheckedChange={setIncludeGST}
                                    />
                                </div>

                                {showProfit && (
                                    <div className="p-4 border rounded-lg bg-muted/30">
                                        <Label htmlFor="profit" className="font-semibold">Profit %</Label>
                                        <Input
                                            id="profit"
                                            type="number"
                                            placeholder="e.g., 50"
                                            value={profitPercent}
                                            onChange={(e) => setProfitPercent(e.target.value)}
                                            className="mt-1"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Add profit percentage to base rates.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Service Summary */}
                            {country && (
                                <div className="md:col-span-2">
                                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                                        <span className="text-sm text-muted-foreground">Available for {country}:</span>
                                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30">
                                            <Globe className="w-3 h-3 mr-1" />
                                            {multiCountryCount} Country-based
                                        </Badge>
                                        {zipCode && (
                                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {zipBasedCount} ZIP-based
                                            </Badge>
                                        )}
                                        {!zipCode && zipBasedCount > 0 && (
                                            <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                Enter ZIP to see {zipBasedCount} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Fetch rates button */}
                            <div className="md:col-span-2 mt-4">
                                <Button
                                    onClick={handleFetchRates}
                                    disabled={loading || loadingServices || billedWeight <= 0 || !country}
                                    className="w-full text-lg py-6"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Fetching Best Rates...
                                        </>
                                    ) : loadingServices ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Loading Services...
                                        </>
                                    ) : (
                                        `Get ${rateCategory === 'all' ? '' : rateCategory.charAt(0).toUpperCase() + rateCategory.slice(1) + ' '}Rates (${availableServices.length})`
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    {loadingServices
                                        ? "Loading available services..."
                                        : `${availableServices.length} service${availableServices.length !== 1 ? 's' : ''} available`
                                    }
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Results Section */}
                <div className="mt-10">
                    {loading ? (
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p>Searching for rates...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {results.length} Rate{results.length !== 1 ? 's' : ''} Found
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Prices shown {includeGST ? 'include' : 'exclude'} 18% GST
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 p-2 px-4 border rounded-lg bg-muted/30">
                                    <Label htmlFor="gst-toggle-results" className="text-sm font-medium cursor-pointer">
                                        {includeGST ? 'With GST' : 'Without GST'}
                                    </Label>
                                    <Switch
                                        id="gst-toggle-results"
                                        checked={includeGST}
                                        onCheckedChange={setIncludeGST}
                                    />
                                </div>
                            </div>

                            {/* Results Summary Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {results.filter(r => r.data.rateMode === 'multi-country').length > 0 && (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30">
                                        <Globe className="w-3 h-3 mr-1" />
                                        {results.filter(r => r.data.rateMode === 'multi-country').length} Country-based
                                    </Badge>
                                )}
                                {results.filter(r => r.data.rateMode === 'single-country-zip').length > 0 && (
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {results.filter(r => r.data.rateMode === 'single-country-zip').length} ZIP-based
                                    </Badge>
                                )}
                                {rateCategory === 'all' && (
                                    <>
                                        {results.filter(r => r.data.rateCategory === 'purchase').length > 0 && (
                                            <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/30">
                                                <Package className="w-3 h-3 mr-1" />
                                                {results.filter(r => r.data.rateCategory === 'purchase').length} Purchase
                                            </Badge>
                                        )}
                                        {results.filter(r => r.data.rateCategory === 'sales').length > 0 && (
                                            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30">
                                                <ShoppingCart className="w-3 h-3 mr-1" />
                                                {results.filter(r => r.data.rateCategory === 'sales').length} Sales
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {results.map(({ service, data }) => (
                                    <ResultCard
                                        key={`${service}-${data.rateCategory}-${data.rateMode}`}
                                        data={data}
                                        billedWeight={billedWeight}
                                        showProfit={showProfit}
                                        includeGST={includeGST}
                                    />
                                ))}
                            </div>
                        </>
                    ) : hasSearched && !error ? (
                        <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                            <PackageSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">No Services Found</h3>
                            <p className="text-muted-foreground mt-2">
                                We couldn't find any {rateCategory !== 'all' ? rateCategory + ' ' : ''}shipping services for the selected criteria.
                            </p>
                            {!zipCode && (
                                <p className="text-sm text-blue-600 mt-2">
                                    Try entering a ZIP code to see location-specific rates.
                                </p>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}