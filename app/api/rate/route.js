import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate"; // Your mongoose model

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const country = searchParams.get("country");
    const profitPercent = parseFloat(searchParams.get("profitPercent")) || 0;
    const inputWeight = parseFloat(searchParams.get("weight"));

    if (!type || !inputWeight || !country) {
        return NextResponse.json({ error: "Missing required parameters: type, weight, country" }, { status: 400 });
    }

    // 1. Define the different weights to be used in calculations
    // Weight for base rate calculation (rounded to nearest 0.5 kg)
    const calculatedWeight = Math.round(inputWeight * 2) / 2;
    // Weight for extra charges (rounded up to the next whole number)
    const extraChargesWeight = Math.ceil(inputWeight);

    await connectToDB();

    try {
        const rateResult = await Rate.findOne({ originalName: type });

        if (!rateResult) {
            return NextResponse.json({ error: "Courier type not found in rates" }, { status: 404 });
        }

        const { rates, zones, fuelCharges: fuelChargesPercentFromDB } = rateResult;

        // Find the zone and its specific extra charges for the given country
        let selectedZone;
        let zoneExtraCharges = {};
        for (const zoneObj of zones) {
            if (zoneObj.countries.includes(country)) {
                selectedZone = zoneObj.zone;
                zoneExtraCharges = zoneObj.extraCharges || {};
                break;
            }
        }

        if (!selectedZone) {
            return NextResponse.json({ error: "Zone not found for the given country" }, { status: 404 });
        }

        // Find the correct rate slab for the calculated weight
        const sortedRates = rates
            .map(rate => ({ kg: parseFloat(rate.kg), data: rate }))
            .sort((a, b) => a.kg - b.kg);

        // Find exact match first
        let weightRateData = sortedRates.find(r => r.kg === calculatedWeight)?.data;
        let closestDbWeight;

        // If no exact match, find the closest lower or equal weight slab
        if (!weightRateData) {
            const fallbackRate = [...sortedRates].reverse().find(r => r.kg <= calculatedWeight);
            if (fallbackRate) {
                weightRateData = fallbackRate.data;
                closestDbWeight = fallbackRate.kg;
            } else {
                return NextResponse.json({ error: "No suitable rate found for the given weight" }, { status: 404 });
            }
        } else {
            closestDbWeight = calculatedWeight;
        }

        const zoneRateValue = weightRateData[selectedZone];
        if (zoneRateValue === undefined || zoneRateValue === null) {
            return NextResponse.json({ error: "Rate not found for the selected zone" }, { status: 404 });
        }
        
        // --- START NEW CALCULATION LOGIC ---

        // 1. Get the Base Rate
        const perKgRate = zoneRateValue / closestDbWeight;
        const baseRate = perKgRate * calculatedWeight;

        // 2. Add Profit (or skip for special rates with refCode)
        const isSpecialRate = !!rateResult.refCode; // Check if refCode exists and is not empty
        let profitCharges = 0;
        let subtotalAfterProfit = baseRate;

        if (!isSpecialRate) {
            profitCharges = (profitPercent / 100) * baseRate;
            subtotalAfterProfit += profitCharges;
        }

        // 3. Add Extra Charges (calculated with upper rounded weight)
        let extraChargeTotal = 0;
        let extraChargesBreakdown = {};
        for (const [chargeName, chargeValue] of Object.entries(zoneExtraCharges)) {
            const chargeAmount = chargeValue * extraChargesWeight;
            extraChargesBreakdown[chargeName] = chargeAmount;
            extraChargeTotal += chargeAmount;
        }
        const subtotalAfterExtraCharges = subtotalAfterProfit + extraChargeTotal;

        // 4. Add Fuel Charges
        let fuelChargePercent = 0;
        if (fuelChargesPercentFromDB !== undefined && fuelChargesPercentFromDB !== null) {
            fuelChargePercent = fuelChargesPercentFromDB;
        } else {
            // Fallback logic if not defined in DB
            const fallbackFuel = {
                "dhl": 27.5, "fedex": 29, "ups": 30.5,
                "dtdc": 36, "aramex": 35.5, "orbit": 35.5
            };
            fuelChargePercent = fallbackFuel[rateResult.type] || 0;
        }
        
        const fuelCharges = (fuelChargePercent / 100) * subtotalAfterExtraCharges;
        const subtotalBeforeGST = subtotalAfterExtraCharges + fuelCharges;

        // 5. Add GST (18%)
        const gstAmount = (18 / 100) * subtotalBeforeGST;

        // 6. Calculate Final Total
        const finalTotal = subtotalBeforeGST + gstAmount;

        // --- END NEW CALCULATION LOGIC ---

        return NextResponse.json({
            // Input Details
            service: rateResult.service,
            originalName: rateResult.originalName,
            zone: selectedZone,
            inputWeight,

            // Weight Calculation Details
            calculatedWeight,       // Weight used for rate lookup (rounded to 0.5)
            extraChargesWeight,     // Weight used for extra charges (rounded up)
            closestDbWeight,        // The DB weight slab used for the per-kg rate

            // Rate Calculation Breakdown
            isSpecialRate,
            refCode: weightRateData.refCode || null,
            baseRate: parseFloat(baseRate.toFixed(2)),
            
            // Charges Breakdown
            profitPercent: isSpecialRate ? 0 : profitPercent,
            profitCharges: parseFloat(profitCharges.toFixed(2)),
            
            extraChargesBreakdown,
            extraChargeTotal: parseFloat(extraChargeTotal.toFixed(2)),
            
            fuelChargePercent,
            fuelCharges: parseFloat(fuelCharges.toFixed(2)),

            subtotalBeforeGST: parseFloat(subtotalBeforeGST.toFixed(2)),
            
            gstAmount: parseFloat(gstAmount.toFixed(2)),

            // Final Total
            total: parseFloat(finalTotal.toFixed(2)),
        });

    } catch (error) {
        console.error("Error in rate calculation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}