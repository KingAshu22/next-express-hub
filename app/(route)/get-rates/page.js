'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Check,
    ChevronsUpDown,
    Info,
    PackageSearch,
    Package,
    ShoppingCart,
    Filter,
    MapPin,
    Globe,
    Truck,
    Scale,
    TrendingUp,
    Zap,
    Award,
    ChevronDown,
    Network,
    SlidersHorizontal,
    X,
    Star,
    BadgeCheck,
    Sparkles,
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Countries } from '@/app/constants/country'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from 'next/image'

// ─── Carrier Logo Map ──────────────────────────────────────────────────────────
const CARRIER_LOGOS = {
    dhl: 'https://upload.wikimedia.org/wikipedia/commons/archive/a/ac/20250507094329%21DHL_Logo.svg',
    fedex: 'https://cdn.worldvectorlogo.com/logos/fedex-express-6.svg',
    ups: 'https://cdn.worldvectorlogo.com/logos/ups-logo-1.svg',
    aramex: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Aramex_logo.svg',
    skynet: 'https://assets.aftership.com/couriers/svg/skynetworldwide-in.svg',
    default: 'https://kargoone.com/logo.jpg',
}

const EXPRESS_CARRIERS = ['dhl', 'fedex', 'ups', 'aramex']

const detectCarrier = (serviceName) => {
    if (!serviceName) return 'default'
    const name = serviceName.toLowerCase()
    if (name.includes('dhl')) return 'dhl'
    if (name.includes('fedex') || name.includes('fed ex')) return 'fedex'
    if (name.includes('ups')) return 'ups'
    if (name.includes('aramex')) return 'aramex'
    if (name.includes('skynet')) return 'skynet'
    return 'default'
}

const isExpressCarrier = (serviceName) => EXPRESS_CARRIERS.includes(detectCarrier(serviceName))
const getCarrierLogo = (serviceName) => CARRIER_LOGOS[detectCarrier(serviceName)] || CARRIER_LOGOS.default

const normalizeServiceName = (name) => {
    if (!name) return name
    return name.replace(/atlantic/gi, 'SunEx')
}

const detectIsDDP = (serviceName, existingIsDDP) => {
    if (existingIsDDP === true) return true
    if (!serviceName) return false
    const lower = serviceName.toLowerCase()
    return lower.includes('ddp') || lower.includes('duty paid')
}

const applyProfit = (data, profitPct) => {
    const pct = parseFloat(profitPct) || 0
    if (pct <= 0) return data
    const base = parseFloat(data.subtotalBeforeGST) || 0
    const profitAmount = parseFloat(((base * pct) / 100).toFixed(2))
    const newSubtotal = parseFloat((base + profitAmount).toFixed(2))
    const newGst = parseFloat((newSubtotal * 0.18).toFixed(2))
    const newTotal = parseFloat((newSubtotal + newGst).toFixed(2))
    return { ...data, subtotalBeforeGST: newSubtotal, gstAmount: newGst, total: newTotal, profitCharges: profitAmount, profitPercent: pct, isSpecialRate: false }
}

const CARRIER_THEMES = {
    dhl: { gradient: 'from-yellow-400/20 via-yellow-300/10 to-transparent', ring: 'ring-yellow-400/60', bar: 'from-yellow-400 to-yellow-500', priceColor: 'text-yellow-700 dark:text-yellow-400', badgeBg: 'bg-yellow-50 dark:bg-yellow-950/30', badgeText: 'text-yellow-700 dark:text-yellow-400' },
    fedex: { gradient: 'from-purple-500/20 via-purple-400/10 to-transparent', ring: 'ring-purple-400/60', bar: 'from-purple-500 to-purple-600', priceColor: 'text-purple-700 dark:text-purple-400', badgeBg: 'bg-purple-50 dark:bg-purple-950/30', badgeText: 'text-purple-700 dark:text-purple-400' },
    ups: { gradient: 'from-amber-600/20 via-amber-500/10 to-transparent', ring: 'ring-amber-500/60', bar: 'from-amber-500 to-amber-600', priceColor: 'text-amber-800 dark:text-amber-400', badgeBg: 'bg-amber-50 dark:bg-amber-950/30', badgeText: 'text-amber-800 dark:text-amber-400' },
    aramex: { gradient: 'from-red-500/20 via-red-400/10 to-transparent', ring: 'ring-red-400/60', bar: 'from-red-500 to-red-600', priceColor: 'text-red-700 dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/30', badgeText: 'text-red-700 dark:text-red-400' },
    skynet: { gradient: 'from-cyan-400/20 via-cyan-300/10 to-transparent', ring: 'ring-cyan-400/60', bar: 'from-cyan-400 to-cyan-500', priceColor: 'text-cyan-700 dark:text-cyan-400', badgeBg: 'bg-cyan-50 dark:bg-cyan-950/30', badgeText: 'text-cyan-700 dark:text-cyan-400' },
    default: { gradient: 'from-rose-400/20 via-rose-300/10 to-transparent', ring: 'ring-rose-400/60', bar: 'from-rose-400 to-red-500', priceColor: 'text-rose-700 dark:text-rose-400', badgeBg: 'bg-rose-50 dark:bg-rose-950/30', badgeText: 'text-rose-700 dark:text-rose-400' },
}

const shouldSkipAdditionalCharge = (name = '') => {
    const n = name.toLowerCase()
    return n.includes('freight') || n.includes('base') || n.includes('awb')
}

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A'
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const kgToGrams = (kg) => Math.round(kg * 1000)
const gramsToKg = (grams) => grams / 1000

// ─── Loading Animation ────────────────────────────────────────────────────────
const AeroplaneLoadingAnimation = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
        <div className="relative w-full max-w-lg h-40 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 via-sky-50 to-white dark:from-sky-950 dark:via-slate-900 dark:to-gray-950">
            <div className="absolute top-4 animate-[cloudSlide_8s_linear_infinite]">
                <div className="flex gap-24">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-shrink-0 opacity-30">
                            <div className="w-20 h-6 bg-white dark:bg-slate-600 rounded-full" />
                            <div className="w-14 h-5 bg-white dark:bg-slate-600 rounded-full -mt-3 ml-3" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="absolute top-16 animate-[cloudSlide_12s_linear_infinite] delay-1000">
                <div className="flex gap-32">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex-shrink-0 opacity-20">
                            <div className="w-16 h-5 bg-white dark:bg-slate-600 rounded-full" />
                            <div className="w-10 h-4 bg-white dark:bg-slate-600 rounded-full -mt-2 ml-4" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 animate-[planeFloat_2s_ease-in-out_infinite]">
                <div className="animate-[planeFly_3s_ease-in-out_infinite] relative">
                    <div className="relative">
                        <div className="relative w-32 h-10 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-l-full rounded-r-[40%] shadow-xl">
                            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/30 to-transparent rounded-l-full rounded-r-[40%]" />
                            <div className="absolute top-3 left-10 flex gap-1.5">
                                {[1, 2, 3, 4, 5, 6].map(w => <div key={w} className="w-1.5 h-2 bg-sky-200/80 rounded-full" />)}
                            </div>
                            <div className="absolute bottom-1.5 left-8 text-[9px] font-black text-white tracking-wider">Kargo One</div>
                            <div className="absolute top-2 left-2 w-5 h-4 bg-gradient-to-br from-sky-300 to-sky-400 rounded-l-full rounded-tr-sm border border-sky-500/30" />
                        </div>
                        <div className="absolute -top-3 left-12 w-20 h-3 bg-gradient-to-r from-red-700 via-red-600 to-red-500 rounded-sm transform -skew-x-6 shadow-md" />
                        <div className="absolute -bottom-2 left-14 w-16 h-2.5 bg-gradient-to-r from-red-800 via-red-700 to-red-600 rounded-sm transform skew-x-3 shadow-md" />
                        <div className="absolute -top-6 right-0 w-3 h-8 bg-gradient-to-t from-red-600 to-red-500 rounded-t-md transform -skew-x-12 shadow-md" />
                        <div className="absolute -top-1 -right-2 w-10 h-2 bg-gradient-to-r from-red-700 to-red-500 rounded-sm transform -skew-x-6" />
                        <div className="absolute bottom-0 left-16 w-5 h-4 bg-gradient-to-b from-slate-400 to-slate-500 rounded-b-lg rounded-t-sm shadow">
                            <div className="absolute bottom-0 left-0.5 w-4 h-1 bg-orange-400/60 rounded-full animate-pulse" />
                        </div>
                        <div className="absolute bottom-0 left-24 w-5 h-4 bg-gradient-to-b from-slate-400 to-slate-500 rounded-b-lg rounded-t-sm shadow">
                            <div className="absolute bottom-0 left-0.5 w-4 h-1 bg-orange-400/60 rounded-full animate-pulse delay-75" />
                        </div>
                    </div>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 flex flex-col gap-1">
                        <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-white/40 rounded animate-pulse" />
                        <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-white/30 rounded animate-pulse delay-100" />
                        <div className="w-10 h-0.5 bg-gradient-to-l from-transparent to-white/40 rounded animate-pulse delay-200" />
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-emerald-100 to-transparent dark:from-emerald-950/40" />
        </div>
        <div className="flex items-center gap-3">
            {['default', 'dhl', 'fedex', 'ups', 'aramex'].map((carrier, i) => (
                <div key={carrier} className="w-11 h-11 rounded-xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: `${i * 200}ms` }}>
                        <Image src={CARRIER_LOGOS[carrier]} alt={carrier === 'default' ? 'logo' : carrier} width={36} height={36} className="object-contain p-1.5" />
                    </div>
                </div>
            ))}
        </div>
        <div className="text-center space-y-2">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">Fetching Best Rates</p>
            <div className="flex items-center justify-center gap-1">
                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
            </div>
            <p className="text-sm text-muted-foreground">Comparing rates across all carriers...</p>
        </div>
        <style jsx>{`
            @keyframes cloudSlide { from { transform: translateX(100%); } to { transform: translateX(-200%); } }
            @keyframes planeFloat { 0%, 100% { transform: translateY(-50%) translateX(0px); } 25% { transform: translateY(calc(-50% - 4px)) translateX(2px); } 75% { transform: translateY(calc(-50% + 4px)) translateX(-2px); } }
            @keyframes planeFly { 0% { left: -160px; } 100% { left: calc(100% + 40px); } }
        `}</style>
    </div>
)

// ─── Badge Components ─────────────────────────────────────────────────────────
const RateCategoryBadge = ({ category }) => (
    category === 'purchase'
        ? <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-300/40 text-[10px] font-semibold px-1.5 py-0">Purchase</Badge>
        : <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300/40 text-[10px] font-semibold px-1.5 py-0">Sales</Badge>
)

const DeliveryTermBadge = ({ isDDP }) => {
    if (isDDP === undefined || isDDP === null) return null
    return (
        <Badge className={cn("text-[10px] font-bold px-1.5 py-0", isDDP ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-400/40" : "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-300/40")}>
            {isDDP ? '✓ DDP' : 'DDU'}
        </Badge>
    )
}

const RateTypeBadge = ({ isEcommerce }) => (
    isEcommerce
        ? <Badge className="bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-300/40 text-[10px] font-semibold px-1.5 py-0">E-comm</Badge>
        : <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300/40 text-[10px] font-semibold px-1.5 py-0">Courier</Badge>
)

const NetworkTypeBadge = ({ isExpress }) => (
    isExpress
        ? <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-300/40 text-[10px] font-semibold px-1.5 py-0 flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />Express</Badge>
        : <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-300/40 text-[10px] font-semibold px-1.5 py-0 flex items-center gap-0.5"><Network className="w-2.5 h-2.5" />Self Network</Badge>
)

const RateStatusBadge = ({ status }) => {
    const styles = { hidden: "bg-red-500/15 text-red-700 border-red-300/40", unlisted: "bg-yellow-500/15 text-yellow-700 border-yellow-300/40" }
    return <Badge className={cn("text-[10px] font-semibold px-1.5 py-0", styles[status] || "bg-green-500/15 text-green-700 border-green-300/40")}>{status === 'hidden' ? 'Hidden' : status === 'unlisted' ? 'Unlisted' : 'Live'}</Badge>
}

// ─── Result Card ──────────────────────────────────────────────────────────────
const ResultCard = ({ data, billedWeight, showProfit, includeGST, isEcommerceService, rank, profitPercent }) => {
    const [expanded, setExpanded] = useState(false)

    const displayName = normalizeServiceName(data.originalName)
    const isDDP = detectIsDDP(displayName, data.isDDP)

    const enrichedData = useMemo(() => {
        const pct = parseFloat(profitPercent) || 0
        if (pct > 0 && (data.profitCharges === 0 || data.profitCharges === undefined)) {
            return applyProfit(data, pct)
        }
        return data
    }, [data, profitPercent])

    const displayTotal = includeGST ? enrichedData.total : enrichedData.subtotalBeforeGST
    const isEcom = isEcommerceService || data.isEcommerce || data.type === 'ecommerce'
    const isExpress = isExpressCarrier(displayName)
    const perUnitRate = (!isEcom && billedWeight > 0) ? displayTotal / billedWeight : 0
    const weightDisplay = isEcom ? `${kgToGrams(billedWeight)}g` : `${billedWeight.toFixed(2)} kg`
    const carrier = detectCarrier(displayName)
    const logoUrl = getCarrierLogo(displayName)
    const theme = CARRIER_THEMES[carrier] || CARRIER_THEMES.default
    const isSkartVendor = data.vendorName === 'Skart'
    const isBest = rank === 0
    const vendorDisplayName = data.vendorName || ''

    // Charges breakdown
    const displayCharges = {}
    if (enrichedData.chargesBreakdown) {
        Object.entries(enrichedData.chargesBreakdown).forEach(([key, value]) => {
            if (value > 0 && !shouldSkipAdditionalCharge(key)) displayCharges[key] = value
        })
    }
    const hasCharges = Object.keys(displayCharges).length > 0

    return (
        <Card className={cn("relative overflow-hidden transition-all duration-300 group cursor-default border-0 shadow-md hover:shadow-2xl rounded-2xl", isBest && `ring-2 ${theme.ring} ring-offset-2 shadow-xl`)}>
            {isBest && (
                <div className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white">
                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-black tracking-widest uppercase">Best Value</span>
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>
            )}
            {!isBest && <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", theme.bar)} />}
            <div className={cn("absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none", theme.gradient)} />

            <div className="relative p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden p-2 border border-gray-100 dark:border-gray-700">
                        <Image src={logoUrl} alt={carrier} width={56} height={56} className="object-contain w-full h-full" onError={(e) => { e.currentTarget.src = CARRIER_LOGOS.default }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0 pr-2">
                                <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-snug break-words mb-1.5">{displayName}</h3>
                                <div className="flex flex-wrap gap-1">
                                    <RateTypeBadge isEcommerce={isEcom} />
                                    <NetworkTypeBadge isExpress={isExpress} />
                                    <DeliveryTermBadge isDDP={isDDP} />
                                    <RateCategoryBadge category={enrichedData.rateCategory} />
                                    {isSkartVendor && <Badge className="bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 border-yellow-400/40 text-[10px] font-semibold px-1.5 py-0">Skart</Badge>}
                                    {showProfit && enrichedData.rateStatus && <RateStatusBadge status={enrichedData.rateStatus} />}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className={cn("text-xl sm:text-2xl font-black leading-none tabular-nums", isBest ? "text-green-600 dark:text-green-400" : theme.priceColor)}>
                                    {formatCurrency(displayTotal)}
                                </div>
                                {!isEcom && billedWeight > 0 && (
                                    <div className="text-[11px] text-muted-foreground mt-0.5 font-medium tabular-nums">
                                        {formatCurrency(perUnitRate)}<span className="text-[10px]">/kg</span>
                                    </div>
                                )}
                                <div className={cn("text-[10px] mt-1.5 font-semibold", includeGST ? "text-emerald-600 dark:text-emerald-400" : "text-orange-500")}>
                                    {includeGST ? '✓ incl. GST' : '+ GST extra'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {vendorDisplayName && (
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", theme.badgeBg, theme.badgeText)}>{vendorDisplayName}</span>
                    )}
                    {data.zone && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            <MapPin className="w-2.5 h-2.5" />{data.zone}
                        </span>
                    )}
                    {data.tatDays !== undefined && data.tatDays !== null && data.tatDays > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            <Truck className="w-2.5 h-2.5" />{data.tatDays}d transit
                        </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        <Scale className="w-2.5 h-2.5" />{weightDisplay}
                    </span>
                    {isEcom && <span className="text-[11px] text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 px-2 py-0.5 rounded-full font-semibold">Slab Rate</span>}
                    {isDDP && <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-semibold">Duty Included</span>}
                </div>

                <div className="mt-3.5">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={cn("w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 text-muted-foreground hover:text-foreground", expanded ? "bg-muted/60 text-foreground" : "bg-muted/30 hover:bg-muted/50")}
                    >
                        <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Price Breakdown</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", expanded && "rotate-180")} />
                    </button>

                    {expanded && (
                        <div className="mt-2.5 rounded-xl overflow-hidden border border-muted/60 dark:border-muted/30 text-xs">
                            <div className="flex justify-between items-center py-2.5 px-3 bg-muted/20">
                                <span className="font-medium text-muted-foreground">Base Rate</span>
                                <span className="font-bold font-mono tabular-nums">{formatCurrency(enrichedData.baseRate)}</span>
                            </div>

                            {enrichedData.profitCharges > 0 && !enrichedData.isSpecialRate && (
                                <div className="flex justify-between items-center py-2.5 px-3 bg-green-50/80 dark:bg-green-950/30 border-t border-muted/20">
                                    <span className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />Profit Margin ({enrichedData.profitPercent}%)
                                    </span>
                                    <span className="font-black font-mono text-green-700 dark:text-green-400 tabular-nums">+ {formatCurrency(enrichedData.profitCharges)}</span>
                                </div>
                            )}

                            {enrichedData.isSpecialRate && (
                                <div className="flex items-center gap-2 py-2.5 px-3 bg-blue-50/50 dark:bg-blue-950/20 border-t border-muted/20">
                                    <Zap className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                    <span className="font-medium text-blue-700 dark:text-blue-300">Special Rate – No Markup</span>
                                </div>
                            )}

                            {enrichedData.awbCharges > 0 && (
                                <div className="flex justify-between items-center py-2.5 px-3 bg-muted/10 border-t border-muted/20">
                                    <span className="font-medium text-muted-foreground">AWB Charges</span>
                                    <span className="font-bold font-mono tabular-nums">{formatCurrency(enrichedData.awbCharges)}</span>
                                </div>
                            )}

                            {isEcom && (
                                <div className="flex justify-between items-center py-2 px-3 bg-pink-50/50 dark:bg-pink-950/10 border-t border-muted/20">
                                    <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400"><Info className="w-3 h-3" />Weight Slab</span>
                                    <span className="font-bold font-mono text-pink-600 dark:text-pink-400">{kgToGrams(billedWeight)}g</span>
                                </div>
                            )}

                            {hasCharges && (
                                <>
                                    <div className="px-3 pt-2.5 pb-1 border-t border-muted/20 bg-muted/10">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Surcharges</span>
                                    </div>
                                    {Object.entries(displayCharges).map(([name, amount], idx) => (
                                        <div key={name} className={cn("flex justify-between items-center py-2 px-4 border-t border-muted/10", idx % 2 === 0 ? "bg-muted/5" : "bg-transparent")}>
                                            <span className="text-muted-foreground">{name}</span>
                                            <span className="font-bold font-mono tabular-nums">{formatCurrency(amount)}</span>
                                        </div>
                                    ))}
                                </>
                            )}

                            <div className="border-t-2 border-dashed border-muted/40 mx-3 my-0.5" />

                            <div className={cn("flex justify-between items-center py-2.5 px-3", !includeGST ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/20")}>
                                <span className={cn("font-semibold", !includeGST && "text-green-700 dark:text-green-400")}>Subtotal (excl. GST)</span>
                                <span className={cn("font-bold font-mono tabular-nums", !includeGST && "text-green-700 dark:text-green-400")}>{formatCurrency(enrichedData.subtotalBeforeGST)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2 px-3 border-t border-muted/20 bg-muted/10">
                                <span className="text-muted-foreground">GST (18%)</span>
                                <span className="font-mono tabular-nums text-muted-foreground">{formatCurrency(enrichedData.gstAmount)}</span>
                            </div>

                            {includeGST && (
                                <div className={cn("flex justify-between items-center py-3 px-3 border-t-2 border-muted/30", isBest ? "bg-gradient-to-r from-green-100 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/20" : "bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/60 dark:to-slate-900/40")}>
                                    <span className={cn("font-black", isBest ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-gray-100")}>Total (incl. GST)</span>
                                    <span className={cn("font-black font-mono tabular-nums", isBest ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-gray-100")}>{formatCurrency(enrichedData.total)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
const FilterPanel = ({ results, filters, setFilters, onClose }) => {
    const vendors = useMemo(() => {
        const set = new Set()
        results.forEach(r => { const v = r.data?.vendorName || ''; if (v) set.add(v) })
        return Array.from(set).sort()
    }, [results])

    const toggleVendor = (vendor) => setFilters(f => ({ ...f, vendors: f.vendors.includes(vendor) ? f.vendors.filter(v => v !== vendor) : [...f.vendors, vendor] }))

    const activeCount = filters.vendors.length + (filters.ddp !== 'all' ? 1 : 0) + (filters.network !== 'all' ? 1 : 0)

    return (
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="font-bold text-sm">Filter Results</span>
                    {activeCount > 0 && <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">{activeCount} active</Badge>}
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <CardContent className="p-4 space-y-5">
                <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 block">Network Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ value: 'all', label: 'All', icon: Filter }, { value: 'express', label: 'Express', icon: Star }, { value: 'self', label: 'Self Network', icon: Network }].map(({ value, label, icon: Icon }) => (
                            <button key={value} onClick={() => setFilters(f => ({ ...f, network: value }))} className={cn("flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-150 border", filters.network === value ? "bg-slate-800 dark:bg-slate-700 text-white border-slate-700 shadow-md" : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground")}>
                                <Icon className="w-3.5 h-3.5" />{label}
                            </button>
                        ))}
                    </div>
                </div>
                <Separator />
                <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 block">Delivery Terms</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ value: 'all', label: 'All', color: 'bg-slate-800 dark:bg-slate-700 text-white' }, { value: 'ddp', label: '✓ DDP', color: 'bg-emerald-600 text-white' }, { value: 'ddu', label: 'DDU', color: 'bg-sky-600 text-white' }].map(({ value, label, color }) => (
                            <button key={value} onClick={() => setFilters(f => ({ ...f, ddp: value }))} className={cn("py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 border", filters.ddp === value ? cn(color, "border-transparent shadow-md") : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50")}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <Separator />
                <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 block">Vendor</Label>
                    <div className="flex flex-wrap gap-2">
                        {vendors.map(vendor => (
                            <button key={vendor} onClick={() => toggleVendor(vendor)} className={cn("py-1 px-3 rounded-full text-xs font-semibold transition-all duration-150 border", filters.vendors.includes(vendor) ? "bg-slate-800 dark:bg-slate-600 text-white border-transparent shadow-sm" : "bg-muted/30 text-muted-foreground border-muted hover:bg-muted/60")}>
                                {vendor}
                            </button>
                        ))}
                        {vendors.length === 0 && <span className="text-xs text-muted-foreground">No vendors found</span>}
                    </div>
                </div>
                {activeCount > 0 && (
                    <button onClick={() => setFilters({ vendors: [], ddp: 'all', network: 'all' })} className="w-full py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors">
                        Clear All Filters
                    </button>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GetRatesPage() {
    const [actualWeight, setActualWeight] = useState('')
    const [length, setLength] = useState('')
    const [breadth, setBreadth] = useState('')
    const [height, setHeight] = useState('')
    const [country, setCountry] = useState('')
    const [zipCode, setZipCode] = useState('')
    const [profitPercent, setProfitPercent] = useState('0')
    const [countrySearchOpen, setCountrySearchOpen] = useState(false)
    const [rateCategory, setRateCategory] = useState('sales')
    const [rateType, setRateType] = useState('courier')
    const [includeGST, setIncludeGST] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({ vendors: [], ddp: 'all', network: 'all' })

    const [volumetricWeight, setVolumetricWeight] = useState(0)
    const [chargeableWeight, setChargeableWeight] = useState(0)
    const [billedWeight, setBilledWeight] = useState(0)

    // ── No availableServices state needed — we removed that check ──
    const [showProfit, setShowProfit] = useState(false)
    const [canViewPurchase, setCanViewPurchase] = useState(false)
    const [results, setResults] = useState([])
    const [skartRatesCache, setSkartRatesCache] = useState([])
    const [liveRateVendors, setLiveRateVendors] = useState({ xpression: [], itd: [] })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [userType, setUserType] = useState('')
    const [code, setCode] = useState('')
    const [hasSearched, setHasSearched] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    const isEcommerceMode = rateType === 'ecommerce'
    const isCourierMode = rateType === 'courier'
    const isAllMode = rateType === 'all'

    // ── Filtered Results ──────────────────────────────────────────────────────
    const filteredResults = useMemo(() => {
        return results.filter(r => {
            const name = normalizeServiceName(r.data?.originalName || r.service || '')
            const vendorName = r.data?.vendorName || ''
            const isDDP = detectIsDDP(name, r.data?.isDDP)
            const isExpress = isExpressCarrier(name)
            if (filters.vendors.length > 0 && !filters.vendors.includes(vendorName)) return false
            if (filters.ddp === 'ddp' && !isDDP) return false
            if (filters.ddp === 'ddu' && isDDP) return false
            if (filters.network === 'express' && !isExpress) return false
            if (filters.network === 'self' && isExpress) return false
            return true
        })
    }, [results, filters])

    const activeFilterCount = filters.vendors.length + (filters.ddp !== 'all' ? 1 : 0) + (filters.network !== 'all' ? 1 : 0)

    // ── Weight Calculation ────────────────────────────────────────────────────
    useEffect(() => {
        if (isEcommerceMode) {
            const weightGrams = parseFloat(actualWeight) || 0
            const weightKg = gramsToKg(weightGrams)
            setVolumetricWeight(0)
            setChargeableWeight(weightKg)
            setBilledWeight(weightKg)
        } else {
            const l = parseFloat(length) || 0
            const b = parseFloat(breadth) || 0
            const h = parseFloat(height) || 0
            const aw = parseFloat(actualWeight) || 0
            const volWeight = (l * b * h) / 5000
            setVolumetricWeight(volWeight)
            const rawChargeableWeight = Math.max(aw, volWeight)
            setChargeableWeight(rawChargeableWeight)
            let finalWeight = 0
            if (rawChargeableWeight > 0) {
                finalWeight = rawChargeableWeight <= 20 ? Math.ceil(rawChargeableWeight * 2) / 2 : Math.ceil(rawChargeableWeight)
            }
            setBilledWeight(finalWeight)
        }
    }, [actualWeight, length, breadth, height, isEcommerceMode])

    // ── Reset on rate type change ─────────────────────────────────────────────
    useEffect(() => {
        setActualWeight('')
        setLength('')
        setBreadth('')
        setHeight('')
        setResults([])
        setHasSearched(false)
        setError('')
        setFilters({ vendors: [], ddp: 'all', network: 'all' })
    }, [rateType])

    // ── Initialize from localStorage ──────────────────────────────────────────
    useEffect(() => {
        const ut = localStorage.getItem('userType') || ''
        const c = localStorage.getItem('code') || ''
        setUserType(ut)
        setCode(c)
        if (ut === 'admin' || ut === 'branch') {
            setShowProfit(true)
            setCanViewPurchase(true)
            setRateCategory('purchase')
        } else {
            setRateCategory('sales')
        }
        setIsInitialized(true)
    }, [])

    // ── Load Xpression Vendors on init ────────────────────────────────────────
    useEffect(() => {
        if (isInitialized && (userType === 'admin' || userType === 'branch')) {
            fetchLiveRateVendors()
        }
    }, [isInitialized, userType])

    // ── Fetch Xpression Vendors ───────────────────────────────────────────────
    const fetchLiveRateVendors = async () => {
        try {
            const res = await fetch('/api/vendor-integrations', { headers: { 'userType': 'admin' } })
            if (!res.ok) return { xpression: [], itd: [] }
            const data = await res.json()
            const activeVendors = data.data?.filter(v => v.isActive) || []
            const vendors = {
                xpression: activeVendors.filter(v => v.softwareType === 'xpression'),
                itd: activeVendors.filter(v => v.softwareType === 'itd'),
            }
            setLiveRateVendors(vendors)
            return vendors
        } catch (err) {
            console.error('Error fetching live-rate vendors:', err)
            return { xpression: [], itd: [] }
        }
    }

    // ── Fetch Skart Rates ─────────────────────────────────────────────────────
    const fetchSkartRates = async (effectiveUserType, effectiveCode, targetCountry, weight) => {
        if (effectiveUserType !== 'admin' && effectiveUserType !== 'branch') return null
        try {
            const res = await fetch('/api/skart-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'userType': effectiveUserType, 'userId': effectiveCode },
                body: JSON.stringify({ originPincode: '400069', destinationCountry: targetCountry, weight, quantity: 1, shipmentType: 1, bookingType: 1 }),
            })
            if (!res.ok) return null
            const data = await res.json()
            if (!Array.isArray(data) || data.length === 0) return null
            return data.map(rate => ({
                service: rate.originalName,
                rateCategory: 'sales',
                rateMode: 'multi-country',
                isEcommerce: false,
                data: { ...rate, isEcommerce: false, vendorName: 'Skart', originalName: rate.originalName },
            }))
        } catch (err) {
            console.error('Error fetching Skart rates:', err)
            return null
        }
    }

    // ── Fetch Xpression Rates ─────────────────────────────────────────────────
    const fetchXpressionRates = async (effectiveUserType, effectiveCode, targetCountry, weight, vendors) => {
        if (effectiveUserType !== 'admin' && effectiveUserType !== 'branch') return null
        if (!vendors || vendors.length === 0) return null
        const collected = []
        for (const vendor of vendors) {
            try {
                const res = await fetch('/api/xpression-rates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'userType': effectiveUserType, 'userId': effectiveCode },
                    body: JSON.stringify({ vendorId: vendor._id, originCode: 'BOM', destinationCode: targetCountry, destination: targetCountry, toPinCode: zipCode || '', weight, volWeight: 0 }),
                })
                if (!res.ok) continue
                const data = await res.json()
                if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    collected.push(...data.data.map(rate => ({
                        service: rate.originalName,
                        rateCategory: 'purchase',
                        rateMode: 'multi-country',
                        isEcommerce: false,
                        data: { ...rate, isEcommerce: false, vendorName: vendor.vendorName, originalName: rate.originalName },
                    })))
                }
            } catch (err) {
                console.error(`Xpression error for ${vendor.vendorName}:`, err)
            }
        }
        return collected.length > 0 ? collected : null
    }

    // ── Main Fetch Handler ────────────────────────────────────────────────────
    const fetchITDRates = async (effectiveUserType, effectiveCode, targetCountry, weight, vendors) => {
        if (effectiveUserType !== 'admin' && effectiveUserType !== 'branch') return null
        if (!vendors || vendors.length === 0) return null
        const collected = []
        await Promise.all(vendors.map(async (vendor) => {
            try {
                const res = await fetch('/api/itd-rates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'userType': effectiveUserType, 'userId': effectiveCode },
                    body: JSON.stringify({ vendorId: vendor._id, originCode: 'IN', destinationCode: targetCountry, destination: targetCountry, weight, pcs: 1 }),
                })
                if (!res.ok) return
                const data = await res.json()
                if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    collected.push(...data.data.map(rate => ({
                        service: rate.originalName,
                        rateCategory: 'purchase',
                        rateMode: 'multi-country',
                        isEcommerce: false,
                        data: { ...rate, isEcommerce: false, vendorName: vendor.vendorName, originalName: rate.originalName },
                    })))
                }
            } catch (err) {
                console.error(`ITD error for ${vendor.vendorName}:`, err)
            }
        }))
        return collected.length > 0 ? collected : null
    }

    const handleFetchRates = async () => {
        if (!billedWeight || billedWeight <= 0) {
            setError(isEcommerceMode ? 'Please enter a valid weight in grams.' : 'Please provide a valid weight/dimensions.')
            return
        }
        if (!country) { setError('Please select a country.'); return }

        // ── No check for availableServices ──
        // We directly fetch from Skart + Xpression

        setLoading(true)
        setError('')
        setResults([])
        setHasSearched(true)
        setFilters({ vendors: [], ddp: 'all', network: 'all' })

        try {
            const effectiveUserType = userType || 'admin'
            const effectiveCode = code || ''

            // ── Fetch Skart & Xpression in parallel ──
            const vendors = liveRateVendors.xpression.length || liveRateVendors.itd.length
                ? liveRateVendors
                : await fetchLiveRateVendors()

            const [skartData, xpressionData, itdData] = await Promise.all([
                fetchSkartRates(effectiveUserType, effectiveCode, country, billedWeight),
                fetchXpressionRates(effectiveUserType, effectiveCode, country, billedWeight, vendors.xpression),
                fetchITDRates(effectiveUserType, effectiveCode, country, billedWeight, vendors.itd),
            ])

            const skartResults = skartData || []
            const xpressionResults = xpressionData || []
            const itdResults = itdData || []

            setSkartRatesCache(skartResults)

            // ── Combine all results ──
            const allResults = [...skartResults, ...xpressionResults, ...itdResults]

            const filtered = allResults
                .filter(r => r.data && !r.data.error && (r.data.total > 0 || r.data.subtotalBeforeGST > 0))
                .sort((a, b) => {
                    const aTotal = includeGST ? (a.data.total || 0) : (a.data.subtotalBeforeGST || 0)
                    const bTotal = includeGST ? (b.data.total || 0) : (b.data.subtotalBeforeGST || 0)
                    return aTotal - bTotal
                })

            if (!filtered.length) {
                setError('No rates found for this country and weight. Please try a different destination.')
            }

            setResults(filtered)
        } catch (err) {
            console.error(err)
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // ── Re-sort on GST toggle ─────────────────────────────────────────────────
    useEffect(() => {
        if (results.length > 0) {
            const sorted = [...results].sort((a, b) => {
                const aTotal = includeGST ? (a.data.total || 0) : (a.data.subtotalBeforeGST || 0)
                const bTotal = includeGST ? (b.data.total || 0) : (b.data.subtotalBeforeGST || 0)
                return aTotal - bTotal
            })
            setResults(sorted)
        }
    }, [includeGST])

    const expressCount = filteredResults.filter(r => isExpressCarrier(normalizeServiceName(r.data?.originalName || ''))).length
    const selfNetworkCount = filteredResults.filter(r => !isExpressCarrier(normalizeServiceName(r.data?.originalName || ''))).length
    const ddpCount = filteredResults.filter(r => detectIsDDP(normalizeServiceName(r.data?.originalName || ''), r.data?.isDDP)).length

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
                <div className="max-w-5xl mx-auto">

                    {/* ── Hero ── */}
                    <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-4 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
                            <Zap className="w-3 h-3" />Real-time Rate Comparison
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Ship Smarter,</span>
                            <br className="hidden sm:block" />
                            <span className="text-gray-900 dark:text-white"> Not Harder</span>
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                            Compare real-time shipping rates from top carriers instantly
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            {['default', 'dhl', 'fedex', 'ups', 'aramex'].map((carrier) => (
                                <div key={carrier} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center p-1.5 hover:shadow-md transition-shadow">
                                    <Image src={CARRIER_LOGOS[carrier]} alt={carrier === 'default' ? 'logo' : carrier} width={32} height={32} className="object-contain w-full h-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Main Form Card ── */}
                    <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-3xl">
                        <CardContent className="p-4 sm:p-6 md:p-8">

                            {/* Shipping Type Tabs */}
                            <div className="mb-6">
                                <Label className="font-bold mb-3 block flex items-center gap-2 text-sm sm:text-base text-gray-800 dark:text-gray-200">
                                    <Package className="w-4 h-4 sm:w-5 sm:h-5" />Shipping Type
                                </Label>
                                <Tabs value={rateType} onValueChange={setRateType} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 h-16 bg-muted/40 rounded-2xl p-1">
                                        <TabsTrigger value="courier" className="flex flex-col items-center gap-0.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md h-full py-2 text-xs sm:text-sm rounded-xl transition-all">
                                            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="font-semibold">Courier</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="ecommerce" className="flex flex-col items-center gap-0.5 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md h-full py-2 text-xs sm:text-sm rounded-xl transition-all">
                                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="font-semibold">E-commerce</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="all" className="flex flex-col items-center gap-0.5 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md h-full py-2 text-xs sm:text-sm rounded-xl transition-all">
                                            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="font-semibold">All Types</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <div className={cn("mt-3 p-3 rounded-xl text-xs sm:text-sm font-medium",
                                    rateType === 'courier' && "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
                                    rateType === 'ecommerce' && "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300",
                                    rateType === 'all' && "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                                )}>
                                    {rateType === 'courier' && "📦 Standard courier rates with per-kg pricing"}
                                    {rateType === 'ecommerce' && "🛒 E-commerce slab rates — perfect for small packages"}
                                    {rateType === 'all' && "📊 View both courier & e-commerce rates side-by-side"}
                                </div>
                            </div>

                            <Separator className="my-6" />

                            {/* Rate Category (Admin/Branch only) */}
                            {canViewPurchase && (
                                <>
                                    <div className="mb-6">
                                        <Label className="font-bold mb-3 block text-sm sm:text-base text-gray-800 dark:text-gray-200">Rate Category</Label>
                                        <Tabs value={rateCategory} onValueChange={setRateCategory} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 bg-muted/40 rounded-2xl p-1">
                                                <TabsTrigger value="sales" className="flex items-center gap-1.5 text-xs sm:text-sm rounded-xl font-semibold">
                                                    <ShoppingCart className="w-3.5 h-3.5" /><span>Sales</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="purchase" className="flex items-center gap-1.5 text-xs sm:text-sm rounded-xl font-semibold">
                                                    <Package className="w-3.5 h-3.5" /><span>Purchase</span>
                                                </TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                    <Separator className="my-6" />
                                </>
                            )}

                            {/* Form Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left */}
                                <div className="space-y-5">
                                    {/* Country */}
                                    <div>
                                        <Label className="font-semibold flex items-center gap-2 mb-2 text-sm">
                                            <Globe className="w-4 h-4 text-blue-500" />Destination Country
                                        </Label>
                                        <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" className="w-full justify-between h-11 text-sm rounded-xl border-muted">
                                                    <span className={cn(!country && "text-muted-foreground")}>{country || "Select Country..."}</span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search country..." className="h-10" />
                                                    <CommandEmpty>No country found.</CommandEmpty>
                                                    <CommandGroup className="max-h-64 overflow-y-auto">
                                                        {Countries.map((c) => (
                                                            <CommandItem key={c} value={c} onSelect={(value) => {
                                                                const selected = Countries.find(ctry => ctry.toLowerCase() === value.toLowerCase())
                                                                setCountry(country === selected ? "" : selected)
                                                                setCountrySearchOpen(false)
                                                            }}>
                                                                <Check className={cn("mr-2 h-4 w-4", country === c ? "opacity-100" : "opacity-0")} />{c}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* ZIP */}
                                    <div>
                                        <Label className="font-semibold flex items-center gap-2 mb-2 text-sm">
                                            <MapPin className="w-4 h-4 text-blue-500" />ZIP / Postal Code
                                            <Badge variant="outline" className="text-[10px] font-normal">Optional</Badge>
                                        </Label>
                                        <Input type="text" placeholder="e.g., 2000" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="h-11 rounded-xl" />
                                    </div>

                                    {/* Weight */}
                                    <div>
                                        <Label className="font-semibold flex items-center gap-2 mb-2 text-sm">
                                            <Scale className="w-4 h-4 text-blue-500" />
                                            {isEcommerceMode ? 'Weight (grams)' : 'Actual Weight (kg)'}
                                            {isEcommerceMode && <Badge className="text-[10px] bg-pink-500 text-white">Slab</Badge>}
                                        </Label>
                                        <Input
                                            type="number"
                                            placeholder={isEcommerceMode ? 'e.g., 250' : 'e.g., 2.5'}
                                            value={actualWeight}
                                            onChange={(e) => setActualWeight(e.target.value)}
                                            className={cn("h-11 text-base rounded-xl", isEcommerceMode && "border-pink-300 focus-visible:ring-pink-400")}
                                            step={isEcommerceMode ? "1" : "0.1"}
                                            min="0"
                                        />
                                        {isEcommerceMode && (
                                            <p className="text-xs text-pink-600 mt-1.5 flex items-start gap-1">
                                                <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />Auto-matches to nearest weight slab
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right */}
                                <div className="space-y-5">
                                    {!isEcommerceMode && (
                                        <div>
                                            <Label className="font-semibold mb-2 block text-sm">
                                                Dimensions (cm)
                                                <Badge variant="outline" className="text-[10px] font-normal ml-2">Optional</Badge>
                                            </Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Input type="number" placeholder="Length" value={length} onChange={(e) => setLength(e.target.value)} className="h-11 rounded-xl" />
                                                <Input type="number" placeholder="Width" value={breadth} onChange={(e) => setBreadth(e.target.value)} className="h-11 rounded-xl" />
                                                <Input type="number" placeholder="Height" value={height} onChange={(e) => setHeight(e.target.value)} className="h-11 rounded-xl" />
                                            </div>
                                        </div>
                                    )}

                                    {isEcommerceMode ? (
                                        <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100/40 dark:from-pink-950/30 dark:to-pink-900/20 rounded-2xl border border-pink-200 dark:border-pink-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ShoppingCart className="w-4 h-4 text-pink-600" />
                                                <span className="text-sm font-bold text-pink-700 dark:text-pink-400">Weight Summary</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center p-2.5 bg-white/70 dark:bg-black/20 rounded-xl">
                                                    <span className="text-xs text-muted-foreground">Input Weight</span>
                                                    <span className="font-bold text-pink-700 dark:text-pink-400">{parseFloat(actualWeight) || 0}g</span>
                                                </div>
                                                <div className="flex justify-between items-center p-2.5 bg-white/70 dark:bg-black/20 rounded-xl">
                                                    <span className="text-xs text-muted-foreground">Equivalent</span>
                                                    <span className="font-mono text-xs font-semibold">{billedWeight.toFixed(3)} kg</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calculated Weights (kg)</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-[11px] text-muted-foreground mb-1 block">Volumetric</Label>
                                                    <Input value={volumetricWeight.toFixed(2)} readOnly className="h-10 bg-muted/40 text-center font-mono text-sm rounded-xl" />
                                                </div>
                                                <div>
                                                    <Label className="text-[11px] text-muted-foreground mb-1 block">Chargeable</Label>
                                                    <Input value={chargeableWeight.toFixed(2)} readOnly className="h-10 bg-muted/40 text-center font-mono text-sm rounded-xl" />
                                                </div>
                                                <div>
                                                    <Label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1 block">Billed ✓</Label>
                                                    <Input value={billedWeight.toFixed(2)} readOnly className="h-10 bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-center font-black text-sm rounded-xl text-blue-700 dark:text-blue-300" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isEcommerceMode && (
                                        <div className="p-3 bg-muted/20 rounded-xl border border-muted/40">
                                            <Label className="text-[11px] font-bold text-muted-foreground mb-2 block uppercase tracking-wide">Quick Select Slab:</Label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[50, 100, 250, 500, 1000, 1500, 2000, 2500, 3000, 5000].map(w => (
                                                    <button key={w} onClick={() => setActualWeight(w.toString())} className={cn("text-xs px-2.5 py-1 rounded-lg font-semibold transition-all duration-150", parseFloat(actualWeight) === w ? "bg-pink-500 text-white shadow-md scale-105" : "bg-white dark:bg-gray-800 text-muted-foreground border border-muted hover:border-pink-300 hover:text-pink-600")}>
                                                        {w}g
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* GST + Profit */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/10 border border-emerald-200 dark:border-emerald-800">
                                    <div>
                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">Include GST (18%)</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{includeGST ? "Prices include 18% GST" : "GST will be added separately"}</p>
                                    </div>
                                    <Switch id="gst-toggle" checked={includeGST} onCheckedChange={setIncludeGST} className="data-[state=checked]:bg-emerald-600" />
                                </div>

                                {showProfit && (
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/10 border border-purple-200 dark:border-purple-800">
                                        <Label htmlFor="profit" className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-2 block flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-purple-600" />Profit Margin (%)
                                        </Label>
                                        <Input
                                            id="profit"
                                            type="number"
                                            placeholder="e.g., 15"
                                            value={profitPercent}
                                            onChange={(e) => setProfitPercent(e.target.value)}
                                            className="h-10 border-purple-300 focus-visible:ring-purple-400 rounded-xl"
                                            min="0"
                                            step="0.1"
                                        />
                                        {parseFloat(profitPercent) > 0 && (
                                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1.5 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />{profitPercent}% profit will be shown in breakdown
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={handleFetchRates}
                                disabled={loading || billedWeight <= 0 || !country}
                                className={cn(
                                    "w-full mt-6 h-14 text-base sm:text-lg font-black shadow-lg rounded-2xl transition-all duration-300",
                                    isCourierMode && "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                                    isEcommerceMode && "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
                                    isAllMode && "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
                                    "hover:scale-[1.015] active:scale-[0.985] disabled:opacity-60 disabled:scale-100"
                                )}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}</div>
                                        Fetching Rates...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Get Rates
                                        {isEcommerceMode && billedWeight > 0 && (
                                            <span className="opacity-80 font-normal text-base">({kgToGrams(billedWeight)}g)</span>
                                        )}
                                    </span>
                                )}
                            </Button>

                            {/* Error */}
                            {error && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
                                    <p className="text-red-700 dark:text-red-400 text-sm font-medium text-center flex items-center justify-center gap-2">
                                        <Info className="w-4 h-4 flex-shrink-0" />{error}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Results ── */}
                    <div className="mt-10 md:mt-12">
                        {loading ? (
                            <AeroplaneLoadingAnimation />
                        ) : results.length > 0 ? (
                            <>
                                {/* Results Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-extrabold">
                                            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                {filteredResults.length}{results.length !== filteredResults.length ? `/${results.length}` : ''} Rate{results.length !== 1 ? 's' : ''} Found
                                            </span>
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                                            <Badge variant="outline" className={isEcommerceMode ? "bg-pink-50" : "bg-blue-50"}>
                                                {isEcommerceMode ? <><Scale className="w-3 h-3 mr-1" />{kgToGrams(billedWeight)}g</> : <><Package className="w-3 h-3 mr-1" />{billedWeight.toFixed(2)} kg</>}
                                            </Badge>
                                            <span>•</span>
                                            <span className="font-medium">{country}</span>
                                            <span>•</span>
                                            <span className={includeGST ? "text-emerald-600 font-medium" : "text-orange-500 font-medium"}>
                                                {includeGST ? 'Incl. GST' : 'Excl. GST'}
                                            </span>
                                            {parseFloat(profitPercent) > 0 && (
                                                <><span>•</span><span className="text-purple-600 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" />{profitPercent}% profit</span></>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border shadow-sm", showFilters || activeFilterCount > 0 ? "bg-slate-800 dark:bg-slate-700 text-white border-slate-700" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400")}
                                        >
                                            <SlidersHorizontal className="w-4 h-4" />Filter
                                            {activeFilterCount > 0 && <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 ml-1">{activeFilterCount}</Badge>}
                                        </button>
                                        <div className="flex items-center gap-2 px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                                            <span className="text-xs font-semibold text-muted-foreground">{includeGST ? 'w/ GST' : 'w/o GST'}</span>
                                            <Switch id="gst-results" checked={includeGST} onCheckedChange={setIncludeGST} className="data-[state=checked]:bg-emerald-600" />
                                        </div>
                                    </div>
                                </div>

                                {showFilters && (
                                    <div className="mb-5">
                                        <FilterPanel results={results} filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} />
                                    </div>
                                )}

                                {/* Summary Badges */}
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {filteredResults.filter(r => !r.isEcommerce && !r.data?.isEcommerce).length > 0 && (
                                        <Badge className="bg-blue-500 text-white shadow-sm"><Truck className="w-3 h-3 mr-1" />{filteredResults.filter(r => !r.isEcommerce && !r.data?.isEcommerce).length} Courier</Badge>
                                    )}
                                    {filteredResults.filter(r => r.isEcommerce || r.data?.isEcommerce).length > 0 && (
                                        <Badge className="bg-pink-500 text-white shadow-sm"><ShoppingCart className="w-3 h-3 mr-1" />{filteredResults.filter(r => r.isEcommerce || r.data?.isEcommerce).length} E-commerce</Badge>
                                    )}
                                    {expressCount > 0 && <Badge className="bg-violet-500 text-white shadow-sm"><Star className="w-3 h-3 mr-1" />{expressCount} Express</Badge>}
                                    {selfNetworkCount > 0 && <Badge className="bg-teal-500 text-white shadow-sm"><Network className="w-3 h-3 mr-1" />{selfNetworkCount} Self Network</Badge>}
                                    {ddpCount > 0 && <Badge className="bg-emerald-500 text-white shadow-sm"><BadgeCheck className="w-3 h-3 mr-1" />{ddpCount} DDP</Badge>}
                                    {results.filter(r => r.data?.vendorName === 'Skart').length > 0 && (
                                        <Badge className="bg-yellow-500 text-white shadow-sm"><Award className="w-3 h-3 mr-1" />{results.filter(r => r.data?.vendorName === 'Skart').length} Skart</Badge>
                                    )}
                                </div>

                                {filteredResults.length === 0 && (
                                    <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <SlidersHorizontal className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">No results match your filters</p>
                                        <button onClick={() => setFilters({ vendors: [], ddp: 'all', network: 'all' })} className="mt-3 text-sm text-blue-600 hover:underline">Clear all filters</button>
                                    </div>
                                )}

                                {/* Cards Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                                    {filteredResults.map(({ service, data, isEcommerce }, index) => (
                                        <ResultCard
                                            key={`${service}-${data.rateCategory}-${data.rateMode}-${isEcommerce}-${index}`}
                                            data={data}
                                            billedWeight={billedWeight}
                                            showProfit={showProfit}
                                            includeGST={includeGST}
                                            isEcommerceService={isEcommerce}
                                            rank={index}
                                            profitPercent={profitPercent}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : hasSearched && !error ? (
                            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                <CardContent className="text-center py-16 px-4">
                                    <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                        <PackageSearch className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold mb-2">No Rates Found</h3>
                                    <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
                                        We couldn&apos;t find any rates for <strong>{country}</strong>. Try a different country or weight.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
