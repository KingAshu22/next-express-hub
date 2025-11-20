import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate"; // Your mongoose model

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const country = searchParams.get("country");
    const profitPercent = parseFloat(searchParams.get("profitPercent")) || 0;
    const inputWeight = parseFloat(searchParams.get("weight"));
    const userId = req.headers.get("userId");
    const userType = req.headers.get("userType");

    // --- DEBUG STEP 0: Log initial request parameters ---
    console.log("\n--- [START] /api/rate Request ---");
    console.log(`Params: type=${type}, country=${country}, weight=${inputWeight}`);
    console.log(`User Context: userType=${userType}, userId=${userId}`);

    if (!type || !inputWeight || !country) {
        console.error("DEBUG: Missing required parameters.");
        return NextResponse.json({ error: "Missing required parameters: type, weight, country" }, { status: 400 });
    }

    const calculatedWeight = Math.round(inputWeight * 2) / 2;
    const extraChargesWeight = Math.ceil(inputWeight);

    await connectToDB();

    try {
        // --- DEBUG STEP 1: Building and logging the initial database query ---
        let rateQuery = { originalName: type };
        if (userType === 'franchise' || userType === 'client') {
            if (!userId) {
                rateQuery.status = 'live';
            } else {
                rateQuery['$or'] = [{ status: 'live' }, { status: 'unlisted', assignedTo: userId }];
            }
        } else if (userType !== 'admin' && userType !== 'branch') {
            rateQuery.status = 'live';
        }
        // If user is 'admin' or 'branch', no extra filters are added.
        console.log("DEBUG [Checkpoint 1]: Executing query to find rate sheet:", JSON.stringify(rateQuery));
        
        const rateResult = await Rate.findOne(rateQuery);

        if (!rateResult) {
            console.error(`DEBUG [FAIL] Checkpoint 1: Rate sheet for query ${JSON.stringify(rateQuery)} not found.`);
            return NextResponse.json({ error: `Service "${type}" not found or is not available for your account.` }, { status: 404 });
        }
        console.log(`DEBUG [SUCCESS] Checkpoint 1: Found rate sheet: ${rateResult.originalName} (ID: ${rateResult._id})`);

        const { rates, zones } = rateResult;
        const dbCharges = rateResult.charges || [];
        
        // --- DEBUG STEP 2: Finding the zone for the country ---
        let selectedZone;
        let zoneExtraCharges = [];
        console.log(`DEBUG [Checkpoint 2]: Searching for country "${country}" in zones...`);

        for (const zoneObj of zones) {
            // Log each zone being checked
            // console.log(`  - Checking zone "${zoneObj.zone}" with countries: [${zoneObj.countries?.join(', ')}]`);
            if (zoneObj.countries && zoneObj.countries.includes(country)) {
                selectedZone = zoneObj.zone;
                console.log(`DEBUG [SUCCESS] Checkpoint 2: Found country in zone "${selectedZone}".`);
                if (zoneObj.extraCharges) {
                    if (Array.isArray(zoneObj.extraCharges)) {
                        zoneExtraCharges = zoneObj.extraCharges;
                    } else if (typeof zoneObj.extraCharges === 'object') {
                        zoneExtraCharges = Object.entries(zoneObj.extraCharges).map(([name, value]) => ({
                            chargeName: name, chargeType: 'perKg', chargeValue: value
                        }));
                    }
                }
                break;
            }
        }

        if (!selectedZone) {
            console.error(`DEBUG [FAIL] Checkpoint 2: Country "${country}" was not found in any zone for service "${type}".`);
            return NextResponse.json({ error: `Zone not found for country '${country}' in service '${type}'.` }, { status: 404 });
        }

        // --- DEBUG STEP 3: Finding the weight slab ---
        console.log(`DEBUG [Checkpoint 3]: Finding rate for calculatedWeight=${calculatedWeight} (from inputWeight=${inputWeight})...`);
        const sortedRates = rates.map(rate => ({ kg: parseFloat(rate.kg), data: rate })).sort((a, b) => a.kg - b.kg);
        let weightRateData;
        let closestDbWeight;

        const exactMatch = sortedRates.find(r => r.kg === calculatedWeight);
        if (exactMatch) {
            weightRateData = exactMatch.data;
            closestDbWeight = calculatedWeight;
            console.log(`DEBUG [SUCCESS] Checkpoint 3: Found exact weight slab for ${calculatedWeight}kg.`);
        } else {
            console.log(`DEBUG: No exact match for ${calculatedWeight}kg. Looking for fallback slab...`);
            const fallbackRate = [...sortedRates].reverse().find(r => r.kg <= calculatedWeight);
            if (fallbackRate) {
                weightRateData = fallbackRate.data;
                closestDbWeight = fallbackRate.kg;
                console.log(`DEBUG [SUCCESS] Checkpoint 3: Found fallback weight slab: ${closestDbWeight}kg.`);
            } else {
                console.error(`DEBUG [FAIL] Checkpoint 3: No suitable rate slab found for weight ${calculatedWeight}. Smallest slab is likely > ${calculatedWeight}.`);
                return NextResponse.json({ error: `No suitable rate found for weight ${inputWeight}kg.` }, { status: 404 });
            }
        }

        // --- DEBUG STEP 4: Finding the rate value within the slab ---
        console.log(`DEBUG [Checkpoint 4]: Looking for rate of zone "${selectedZone}" in the selected weight slab.`);
        const zoneRateValue = weightRateData[selectedZone];
        if (zoneRateValue === undefined || zoneRateValue === null) {
            console.error(`DEBUG [FAIL] Checkpoint 4: The key for zone "${selectedZone}" does not exist or is null in the rate data for weight ${closestDbWeight}kg.`);
            console.error("Available keys in rate data:", Object.keys(weightRateData));
            return NextResponse.json({ error: `Rate for zone '${selectedZone}' is not defined for this weight.` }, { status: 404 });
        }
        console.log(`DEBUG [SUCCESS] Checkpoint 4: Found zone rate value: ${zoneRateValue}.`);
        
        // --- If all checkpoints pass, proceed with calculation ---
        console.log("--- All checkpoints passed. Starting final calculation. ---");
        
        const perKgRate = zoneRateValue / closestDbWeight;
        const baseRate = perKgRate * calculatedWeight;

        const isSpecialRate = rateResult.status === 'unlisted';
        let profitCharges = 0;
        let subtotalAfterProfit = baseRate;
        if (!isSpecialRate) {
            profitCharges = (profitPercent / 100) * baseRate;
            subtotalAfterProfit += profitCharges;
        }

        let chargesBreakdown = {};
        
        const processCharges = (chargeList, weightForPerKg) => {
            if (!Array.isArray(chargeList)) return 0;
            let total = 0;
            chargeList.forEach(charge => {
                if (!charge || typeof charge.chargeValue !== 'number') return;
                let chargeAmount = 0;
                switch (charge.chargeType) {
                    case 'perKg': chargeAmount = charge.chargeValue * weightForPerKg; break;
                    case 'oneTime': chargeAmount = charge.chargeValue; break;
                }
                if (charge.chargeType !== 'percentage') {
                    chargesBreakdown[charge.chargeName] = (chargesBreakdown[charge.chargeName] || 0) + chargeAmount;
                    total += chargeAmount;
                }
            });
            return total;
        };

        const mainFixedCharges = processCharges(dbCharges, extraChargesWeight);
        const zoneFixedCharges = processCharges(zoneExtraCharges, extraChargesWeight);
        let subtotalAfterFixedCharges = subtotalAfterProfit + mainFixedCharges + zoneFixedCharges;

        const allCharges = [...dbCharges, ...zoneExtraCharges];
        allCharges.filter(c => c && c.chargeType === 'percentage').forEach(charge => {
            if (typeof charge.chargeValue === 'number') {
                const chargeAmount = (charge.chargeValue / 100) * subtotalAfterFixedCharges;
                chargesBreakdown[charge.chargeName] = (chargesBreakdown[charge.chargeName] || 0) + chargeAmount;
            }
        });
        
        const totalCharges = Object.values(chargesBreakdown).reduce((sum, val) => sum + val, 0);
        const subtotalBeforeGST = subtotalAfterProfit + totalCharges;
        const gstAmount = (18 / 100) * subtotalBeforeGST;
        const finalTotal = subtotalBeforeGST + gstAmount;

        console.log("--- [END] Request Processed Successfully ---");
        return NextResponse.json({
            service: rateResult.service,
            originalName: rateResult.originalName,
            zone: selectedZone,
            inputWeight,
            calculatedWeight,
            extraChargesWeight,
            closestDbWeight,
            isSpecialRate,
            refCode: rateResult.refCode || null,
            baseRate: parseFloat(baseRate.toFixed(2)),
            profitPercent: isSpecialRate ? 0 : profitPercent,
            profitCharges: parseFloat(profitCharges.toFixed(2)),
            chargesBreakdown: Object.entries(chargesBreakdown).reduce((acc, [key, value]) => {
                acc[key] = parseFloat(value.toFixed(2));
                return acc;
            }, {}),
            totalCharges: parseFloat(totalCharges.toFixed(2)),
            subtotalBeforeGST: parseFloat(subtotalBeforeGST.toFixed(2)),
            gstAmount: parseFloat(gstAmount.toFixed(2)),
            total: parseFloat(finalTotal.toFixed(2)),
        });

    } catch (error) {
        console.error("FATAL: An unexpected error occurred in the try block:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}