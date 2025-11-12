import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate"; // Your mongoose model

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const country = searchParams.get("country");
    const profitPercent = parseFloat(searchParams.get("profitPercent")) || 0;
    const inputWeight = parseFloat(searchParams.get("weight"));
    // NEW: Check if GST should be applied. Defaults to true.
    const applyGst = searchParams.get("gst") !== "false";

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

        // UPDATED: Destructure awbCharges along with other properties
        const { rates, zones, fuelCharges: fuelChargesPercentFromDB, awbCharges } = rateResult;

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

        let weightRateData = sortedRates.find(r => r.kg === calculatedWeight)?.data;
        let closestDbWeight;

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

        // 2. Add Profit
        const isSpecialRate = !!rateResult.refCode;
        let profitCharges = 0;
        let subtotalAfterProfit = baseRate;

        if (!isSpecialRate) {
            profitCharges = (profitPercent / 100) * baseRate;
            subtotalAfterProfit += profitCharges;
        }

        // 3. Add Per-KG Extra Charges (calculated with upper rounded weight)
        let extraChargeTotal = 0;
        let extraChargesBreakdown = {};
        for (const [chargeName, chargeValue] of Object.entries(zoneExtraCharges)) {
            const chargeAmount = chargeValue * extraChargesWeight;
            extraChargesBreakdown[chargeName] = chargeAmount;
            extraChargeTotal += chargeAmount;
        }
        const subtotalAfterExtraCharges = subtotalAfterProfit + extraChargeTotal;
        
        // 4. NEW: Add Fixed AWB Charges (if any)
        const awbChargeAmount = parseFloat(awbCharges) || 0;
        const subtotalAfterFixedCharges = subtotalAfterExtraCharges + awbChargeAmount;

        // 5. Add Fuel Charges (as a percentage of the new subtotal)
        let fuelChargePercent = 0;
        if (fuelChargesPercentFromDB !== undefined && fuelChargesPercentFromDB !== null) {
            fuelChargePercent = parseFloat(fuelChargesPercentFromDB) || 0;
        } else {
            // Fallback logic remains the same
            const fallbackFuel = { "dhl": 27.5, "fedex": 29, "ups": 30.5, "dtdc": 36, "aramex": 35.5, "orbit": 35.5 };
            fuelChargePercent = fallbackFuel[rateResult.type] || 0;
        }
        
        const fuelCharges = (fuelChargePercent / 100) * subtotalAfterFixedCharges;
        const subtotalBeforeGST = subtotalAfterFixedCharges + fuelCharges;

        // 6. NEW: Conditionally Add GST (18%)
        let gstAmount = 0;
        let finalTotal = subtotalBeforeGST; // Start with the pre-GST total

        if (applyGst) {
            gstAmount = (18 / 100) * subtotalBeforeGST;
            finalTotal += gstAmount; // Add GST to the final total
        }

        // --- END NEW CALCULATION LOGIC ---

        return NextResponse.json({
            // Input Details
            service: rateResult.service,
            originalName: rateResult.originalName,
            zone: selectedZone,
            inputWeight,

            // Weight Calculation Details
            calculatedWeight,
            extraChargesWeight,
            closestDbWeight,

            // Rate Calculation Breakdown
            isSpecialRate,
            refCode: weightRateData.refCode || null,
            baseRate: parseFloat(baseRate.toFixed(2)),
            
            // Charges Breakdown
            profitPercent: isSpecialRate ? 0 : profitPercent,
            profitCharges: parseFloat(profitCharges.toFixed(2)),
            
            extraChargesBreakdown,
            extraChargeTotal: parseFloat(extraChargeTotal.toFixed(2)),

            awbCharges: awbChargeAmount, // Added AWB charge to response
            
            fuelChargePercent,
            fuelCharges: parseFloat(fuelCharges.toFixed(2)),

            subtotalBeforeGST: parseFloat(subtotalBeforeGST.toFixed(2)),
            
            gstApplied: applyGst, // Added GST flag to response
            gstAmount: parseFloat(gstAmount.toFixed(2)),

            // Final Total
            total: parseFloat(finalTotal.toFixed(2)),
        });

    } catch (error) {
        console.error("Error in rate calculation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}