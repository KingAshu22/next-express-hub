import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const country = searchParams.get("country");
    const zipCode = searchParams.get("zipCode"); // For single-country-zip mode
    const profitPercent = parseFloat(searchParams.get("profitPercent")) || 0;
    const inputWeight = parseFloat(searchParams.get("weight"));
    const rateCategory = searchParams.get("rateCategory") || "sales"; // 'purchase' or 'sales'
    const userId = req.headers.get("userId");
    const userType = req.headers.get("userType");

    console.log("\n--- [START] /api/rate Request ---");
    console.log(`Params: type=${type}, country=${country}, zipCode=${zipCode}, weight=${inputWeight}, rateCategory=${rateCategory}`);
    console.log(`User Context: userType=${userType}, userId=${userId}`);

    if (!type || !inputWeight || !country) {
        console.error("DEBUG: Missing required parameters.");
        return NextResponse.json({ error: "Missing required parameters: type, weight, country" }, { status: 400 });
    }

    const calculatedWeight = Math.round(inputWeight * 2) / 2;
    const extraChargesWeight = Math.ceil(inputWeight);

    await connectToDB();

    try {
        // Build query for finding the rate
        let rateQuery = { 
            originalName: type,
            rateCategory: rateCategory 
        };

        // Add visibility filters based on user type
        if (userType === 'admin' || userType === 'branch') {
            // Admins can see all rates
            console.log("DEBUG: Admin/Branch user - no visibility filter applied");
        } else if (userType === 'franchise' || userType === 'client') {
            // Non-admin users can only see sales rates
            if (rateCategory === 'purchase') {
                return NextResponse.json({ error: "Purchase rates are not available for your account." }, { status: 403 });
            }
            
            if (!userId) {
                rateQuery.status = 'live';
            } else {
                rateQuery.$or = [
                    { status: 'live' },
                    { status: 'unlisted', assignedTo: userId }
                ];
            }
        } else {
            // Public users - only live sales rates
            if (rateCategory === 'purchase') {
                return NextResponse.json({ error: "Purchase rates are not available." }, { status: 403 });
            }
            rateQuery.status = 'live';
        }

        console.log("DEBUG [Checkpoint 1]: Executing query:", JSON.stringify(rateQuery));
        
        const rateResult = await Rate.findOne(rateQuery);

        if (!rateResult) {
            console.error(`DEBUG [FAIL] Checkpoint 1: Rate sheet not found for query.`);
            return NextResponse.json({ error: `Service "${type}" not found or is not available for your account.` }, { status: 404 });
        }
        console.log(`DEBUG [SUCCESS] Checkpoint 1: Found rate sheet: ${rateResult.originalName} (ID: ${rateResult._id}, Category: ${rateResult.rateCategory})`);

        const { rates, zones, postalZones, rateMode, targetCountry } = rateResult;
        const dbCharges = rateResult.charges || [];
        
        // Determine zone based on rate mode
        let selectedZone;
        let zoneExtraCharges = [];

        if (rateMode === 'single-country-zip') {
            // ZIP-based zone lookup
            console.log(`DEBUG [Checkpoint 2]: Single-country-zip mode for ${targetCountry}`);
            
            if (country.toLowerCase() !== targetCountry?.toLowerCase()) {
                return NextResponse.json({ error: `This rate is only for ${targetCountry}.` }, { status: 404 });
            }

            if (!zipCode) {
                return NextResponse.json({ error: "ZIP code is required for this rate." }, { status: 400 });
            }

            // Find zone by ZIP code
            for (const pz of postalZones || []) {
                let matches = false;
                
                if (pz.zipCode) {
                    // Individual ZIP code match
                    matches = pz.zipCode === zipCode;
                } else if (pz.zipFrom && pz.zipTo) {
                    // ZIP range match
                    const zipNum = parseInt(zipCode.replace(/\D/g, ''), 10);
                    const fromNum = parseInt(pz.zipFrom.replace(/\D/g, ''), 10);
                    const toNum = parseInt(pz.zipTo.replace(/\D/g, ''), 10);
                    
                    if (!isNaN(zipNum) && !isNaN(fromNum) && !isNaN(toNum)) {
                        matches = zipNum >= fromNum && zipNum <= toNum;
                    } else {
                        // String comparison for non-numeric ZIPs
                        matches = zipCode >= pz.zipFrom && zipCode <= pz.zipTo;
                    }
                }

                if (matches) {
                    selectedZone = pz.zone;
                    zoneExtraCharges = pz.extraCharges ? 
                        (Array.isArray(pz.extraCharges) ? pz.extraCharges : 
                            Object.entries(pz.extraCharges).map(([name, value]) => ({
                                chargeName: name, chargeType: 'perKg', chargeValue: value
                            }))
                        ) : [];
                    console.log(`DEBUG [SUCCESS]: Found ZIP ${zipCode} in zone ${selectedZone}`);
                    break;
                }
            }

            if (!selectedZone) {
                return NextResponse.json({ error: `Zone not found for ZIP code '${zipCode}'.` }, { status: 404 });
            }
        } else {
            // Multi-country zone lookup
            console.log(`DEBUG [Checkpoint 2]: Searching for country "${country}" in zones...`);

            for (const zoneObj of zones || []) {
                if (zoneObj.countries && zoneObj.countries.some(c => c.toLowerCase() === country.toLowerCase())) {
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
                console.error(`DEBUG [FAIL] Checkpoint 2: Country "${country}" was not found in any zone.`);
                return NextResponse.json({ error: `Zone not found for country '${country}' in service '${type}'.` }, { status: 404 });
            }
        }

        // Find weight slab
        console.log(`DEBUG [Checkpoint 3]: Finding rate for calculatedWeight=${calculatedWeight}...`);
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
                console.error(`DEBUG [FAIL] Checkpoint 3: No suitable rate slab found.`);
                return NextResponse.json({ error: `No suitable rate found for weight ${inputWeight}kg.` }, { status: 404 });
            }
        }

        // Get zone rate value
        console.log(`DEBUG [Checkpoint 4]: Looking for rate of zone "${selectedZone}" in the selected weight slab.`);
        const zoneRateValue = weightRateData[selectedZone];
        if (zoneRateValue === undefined || zoneRateValue === null) {
            console.error(`DEBUG [FAIL] Checkpoint 4: Zone "${selectedZone}" not found in rate data.`);
            return NextResponse.json({ error: `Rate for zone '${selectedZone}' is not defined for this weight.` }, { status: 404 });
        }
        console.log(`DEBUG [SUCCESS] Checkpoint 4: Found zone rate value: ${zoneRateValue}.`);
        
        // Calculate final price
        console.log("--- All checkpoints passed. Starting final calculation. ---");
        
        const perKgRate = zoneRateValue / closestDbWeight;
        const baseRate = perKgRate * calculatedWeight;

        // For unlisted sales rates or purchase rates, don't apply profit
        const isSpecialRate = rateResult.status === 'unlisted' || rateCategory === 'purchase';
        let profitCharges = 0;
        let subtotalAfterProfit = baseRate;
        
        if (!isSpecialRate && profitPercent > 0) {
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

        // Process percentage charges
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
            vendorName: rateResult.vendorName,
            rateCategory: rateResult.rateCategory,
            ratePurchaseId: rateResult.purchaseRateId || null,
            rateMode: rateResult.rateMode,
            targetCountry: rateResult.targetCountry,
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
        console.error("FATAL: An unexpected error occurred:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}