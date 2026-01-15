import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const country = searchParams.get("country");
    const zipCode = searchParams.get("zipCode");
    const profitPercent = parseFloat(searchParams.get("profitPercent")) || 0;
    const inputWeight = parseFloat(searchParams.get("weight"));
    const rateCategory = searchParams.get("rateCategory") || "sales";
    
    // Handle case-insensitive headers
    const userType = req.headers.get("userType") || req.headers.get("usertype") || "";
    const userId = req.headers.get("userId") || req.headers.get("userid") || "";

    console.log("\n--- [START] /api/rate Request ---");
    console.log(`Params: type=${type}, country=${country}, zipCode=${zipCode}, weight=${inputWeight}, rateCategory=${rateCategory}, profitPercent=${profitPercent}`);
    console.log(`User Context: userType="${userType}", userId="${userId}"`);

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

        // Determine if user is admin or branch
        const isAdminOrBranch = userType === "admin" || userType === "branch";

        if (isAdminOrBranch || !userType) {
            console.log("DEBUG: Admin/Branch/Testing - no visibility filter applied");
        } else if (userType === "franchise" || userType === "client") {
            if (rateCategory === "purchase") {
                return NextResponse.json({ error: "Purchase rates are not available for your account." }, { status: 403 });
            }
            
            if (userId) {
                rateQuery.$or = [
                    { status: "live" },
                    { status: "unlisted", assignedTo: userId }
                ];
            } else {
                rateQuery.status = "live";
            }
        } else {
            if (rateCategory === "purchase") {
                return NextResponse.json({ error: "Purchase rates are not available." }, { status: 403 });
            }
            rateQuery.status = "live";
        }

        console.log("DEBUG [Checkpoint 1]: Executing query:", JSON.stringify(rateQuery));
        
        const rateResult = await Rate.findOne(rateQuery).lean();

        if (!rateResult) {
            console.error(`DEBUG [FAIL] Checkpoint 1: Rate sheet not found for query.`);
            
            const anyRate = await Rate.findOne({ originalName: type }).lean();
            if (anyRate) {
                console.log("DEBUG: Found rate with different criteria:", {
                    originalName: anyRate.originalName,
                    rateCategory: anyRate.rateCategory,
                    status: anyRate.status
                });
            } else {
                console.log("DEBUG: No rate found with originalName:", type);
            }
            
            return NextResponse.json({ error: `Service "${type}" not found or is not available for your account.` }, { status: 404 });
        }
        
        console.log(`DEBUG [SUCCESS] Checkpoint 1: Found rate sheet: ${rateResult.originalName} (ID: ${rateResult._id}, Category: ${rateResult.rateCategory}, Status: ${rateResult.status}, Mode: ${rateResult.rateMode})`);

        const { rates, zones, postalZones, rateMode, targetCountry } = rateResult;
        const dbCharges = rateResult.charges || [];
        
        // Determine zone based on rate mode
        let selectedZone;
        let zoneExtraCharges = [];

        if (rateMode === "single-country-zip") {
            // ZIP-based zone lookup
            console.log(`DEBUG [Checkpoint 2]: Single-country-zip mode for ${targetCountry}`);
            
            // Validate country matches
            if (country.toLowerCase() !== targetCountry?.toLowerCase()) {
                console.error(`DEBUG [FAIL]: Country mismatch. Expected ${targetCountry}, got ${country}`);
                return NextResponse.json({ 
                    error: `This rate is only available for ${targetCountry}.` 
                }, { status: 404 });
            }

            // ZIP code is required for single-country-zip mode
            if (!zipCode) {
                console.error(`DEBUG [FAIL]: ZIP code required but not provided`);
                return NextResponse.json({ 
                    error: "ZIP/Postal code is required for this rate." 
                }, { status: 400 });
            }

            // Find zone by ZIP code
            console.log(`DEBUG: Searching for ZIP ${zipCode} in ${postalZones?.length || 0} postal zones`);
            
            for (const pz of postalZones || []) {
                let matches = false;
                
                // Exact match
                if (pz.zipCode) {
                    matches = pz.zipCode === zipCode;
                    if (matches) {
                        console.log(`DEBUG: Exact match found for ZIP ${zipCode}`);
                    }
                }
                
                // Range match
                if (!matches && pz.zipFrom && pz.zipTo) {
                    // Try numeric comparison
                    const zipNum = parseInt(zipCode.replace(/\D/g, ""), 10);
                    const fromNum = parseInt(String(pz.zipFrom).replace(/\D/g, ""), 10);
                    const toNum = parseInt(String(pz.zipTo).replace(/\D/g, ""), 10);
                    
                    if (!isNaN(zipNum) && !isNaN(fromNum) && !isNaN(toNum)) {
                        matches = zipNum >= fromNum && zipNum <= toNum;
                    } else {
                        // Fallback to string comparison for alphanumeric codes
                        matches = zipCode >= pz.zipFrom && zipCode <= pz.zipTo;
                    }
                    
                    if (matches) {
                        console.log(`DEBUG: Range match found for ZIP ${zipCode} in ${pz.zipFrom}-${pz.zipTo}`);
                    }
                }

                if (matches) {
                    selectedZone = pz.zone;
                    
                    // Parse extra charges
                    if (pz.extraCharges) {
                        if (Array.isArray(pz.extraCharges)) {
                            zoneExtraCharges = pz.extraCharges;
                        } else if (typeof pz.extraCharges === "object") {
                            zoneExtraCharges = Object.entries(pz.extraCharges).map(([name, value]) => ({
                                chargeName: name, 
                                chargeType: "perKg", 
                                chargeValue: parseFloat(value) || 0
                            }));
                        }
                    }
                    
                    console.log(`DEBUG [SUCCESS]: Found ZIP ${zipCode} in zone ${selectedZone}`);
                    break;
                }
            }

            if (!selectedZone) {
                console.error(`DEBUG [FAIL]: ZIP ${zipCode} not found in any postal zone`);
                return NextResponse.json({ 
                    error: `ZIP/Postal code '${zipCode}' is not serviceable for this rate.` 
                }, { status: 404 });
            }
            
        } else {
            // Multi-country zone lookup (default)
            console.log(`DEBUG [Checkpoint 2]: Multi-country mode - searching for country "${country}" in zones...`);

            for (const zoneObj of zones || []) {
                const countryMatch = zoneObj.countries?.some(c => 
                    c.toLowerCase() === country.toLowerCase()
                );
                
                if (countryMatch) {
                    selectedZone = zoneObj.zone;
                    console.log(`DEBUG [SUCCESS] Checkpoint 2: Found country in zone "${selectedZone}".`);
                    
                    // Parse extra charges
                    if (zoneObj.extraCharges) {
                        if (Array.isArray(zoneObj.extraCharges)) {
                            zoneExtraCharges = zoneObj.extraCharges;
                        } else if (typeof zoneObj.extraCharges === "object") {
                            zoneExtraCharges = Object.entries(zoneObj.extraCharges).map(([name, value]) => ({
                                chargeName: name, 
                                chargeType: "perKg", 
                                chargeValue: parseFloat(value) || 0
                            }));
                        }
                    }
                    break;
                }
            }

            if (!selectedZone) {
                console.error(`DEBUG [FAIL] Checkpoint 2: Country "${country}" was not found in any zone.`);
                return NextResponse.json({ 
                    error: `Country '${country}' is not serviceable for '${type}'.` 
                }, { status: 404 });
            }
        }

        // Find weight slab
        console.log(`DEBUG [Checkpoint 3]: Finding rate for calculatedWeight=${calculatedWeight}kg...`);
        
        if (!rates || !Array.isArray(rates) || rates.length === 0) {
            console.error("DEBUG [FAIL]: No rates array in document");
            return NextResponse.json({ error: "No rate data found for this service." }, { status: 404 });
        }

        const sortedRates = rates
            .map(rate => ({ kg: parseFloat(rate.kg), data: rate }))
            .filter(r => !isNaN(r.kg))
            .sort((a, b) => a.kg - b.kg);
            
        let weightRateData;
        let closestDbWeight;

        // Try exact match first
        const exactMatch = sortedRates.find(r => r.kg === calculatedWeight);
        if (exactMatch) {
            weightRateData = exactMatch.data;
            closestDbWeight = calculatedWeight;
            console.log(`DEBUG [SUCCESS] Checkpoint 3: Found exact weight slab for ${calculatedWeight}kg.`);
        } else {
            // Fallback to closest lower weight
            console.log(`DEBUG: No exact match for ${calculatedWeight}kg. Looking for fallback slab...`);
            const fallbackRate = [...sortedRates].reverse().find(r => r.kg <= calculatedWeight);
            
            if (fallbackRate) {
                weightRateData = fallbackRate.data;
                closestDbWeight = fallbackRate.kg;
                console.log(`DEBUG [SUCCESS] Checkpoint 3: Found fallback weight slab: ${closestDbWeight}kg.`);
            } else {
                // Try getting the minimum weight slab
                const minRate = sortedRates[0];
                if (minRate && calculatedWeight < minRate.kg) {
                    weightRateData = minRate.data;
                    closestDbWeight = minRate.kg;
                    console.log(`DEBUG [SUCCESS] Checkpoint 3: Using minimum weight slab: ${closestDbWeight}kg.`);
                } else {
                    console.error(`DEBUG [FAIL] Checkpoint 3: No suitable rate slab found.`);
                    return NextResponse.json({ 
                        error: `No rate available for weight ${inputWeight}kg.` 
                    }, { status: 404 });
                }
            }
        }

        // Get zone rate value
        console.log(`DEBUG [Checkpoint 4]: Looking for rate of zone "${selectedZone}" in the selected weight slab.`);
        
        const zoneRateValue = parseFloat(weightRateData[selectedZone]);
        
        if (isNaN(zoneRateValue) || zoneRateValue === undefined || zoneRateValue === null) {
            console.error(`DEBUG [FAIL] Checkpoint 4: Zone "${selectedZone}" not found in rate data.`);
            console.log("DEBUG: Available keys in rate data:", Object.keys(weightRateData));
            return NextResponse.json({ 
                error: `Rate for zone '${selectedZone}' is not defined for this weight.` 
            }, { status: 404 });
        }
        
        console.log(`DEBUG [SUCCESS] Checkpoint 4: Found zone rate value: ${zoneRateValue}.`);
        
        // ========================================
        // CALCULATE FINAL PRICE
        // ========================================
        console.log("--- All checkpoints passed. Starting final calculation. ---");
        
        // 1. Base Rate Calculation
        const perKgRate = zoneRateValue / closestDbWeight;
        const baseRateInitial = perKgRate * calculatedWeight; 

        // 2. Profit Calculation
        let profitCharges = 0;
        let baseRateAfterProfit = baseRateInitial;
        if (profitPercent > 0) {
            profitCharges = (profitPercent / 100) * baseRateInitial;
            baseRateAfterProfit += profitCharges;
        }

        const isSpecialRate = rateResult.status === "unlisted" || rateResult.status === "hidden";

        // 3. Additional Charges Calculation
        let chargesBreakdown = {};
        let totalFixedChargesAmount = 0;
        const percentageChargesToApply = [];

        // Combine database-level charges and zone-specific charges
        const allConfiguredCharges = [...dbCharges, ...zoneExtraCharges];

        allConfiguredCharges.forEach(charge => {
            if (!charge || typeof charge.chargeValue !== "number" || !charge.chargeType || !charge.chargeName) {
                return;
            }

            let chargeAmount = 0;
            switch (charge.chargeType) {
                case "perKg":
                    chargeAmount = charge.chargeValue * extraChargesWeight;
                    chargesBreakdown[charge.chargeName] = (chargesBreakdown[charge.chargeName] || 0) + chargeAmount;
                    totalFixedChargesAmount += chargeAmount;
                    break;
                case "oneTime":
                    chargeAmount = charge.chargeValue;
                    chargesBreakdown[charge.chargeName] = (chargesBreakdown[charge.chargeName] || 0) + chargeAmount;
                    totalFixedChargesAmount += chargeAmount;
                    break;
                case "percentage":
                    percentageChargesToApply.push(charge);
                    break;
            }
        });

        // 4. Calculate subtotal before percentage charges
        let subtotalAccumulator = baseRateAfterProfit + totalFixedChargesAmount;

        // 5. Apply percentage-based charges (applied on subtotal)
        percentageChargesToApply.forEach(charge => {
            const chargeAmount = (charge.chargeValue / 100) * subtotalAccumulator;
            chargesBreakdown[charge.chargeName] = (chargesBreakdown[charge.chargeName] || 0) + chargeAmount;
            subtotalAccumulator += chargeAmount;
        });

        const subtotalBeforeGST = subtotalAccumulator;
        const totalAllAdditionalCharges = Object.values(chargesBreakdown).reduce((sum, val) => sum + val, 0);

        // 6. Apply GST (18%)
        const gstAmount = (18 / 100) * subtotalBeforeGST;
        const finalTotal = subtotalBeforeGST + gstAmount;

        console.log("--- [END] Request Processed Successfully ---");
        
        return NextResponse.json({
            service: rateResult.service,
            originalName: rateResult.originalName,
            vendorName: rateResult.vendorName,
            rateCategory: rateResult.rateCategory,
            rateStatus: rateResult.status,
            ratePurchaseId: rateResult.purchaseRateId || null,
            rateMode: rateResult.rateMode,
            targetCountry: rateResult.targetCountry || null,
            zone: selectedZone,
            inputWeight,
            calculatedWeight,
            extraChargesWeight,
            closestDbWeight,
            isSpecialRate: isSpecialRate,
            refCode: rateResult.refCode || null,
            baseRate: parseFloat(baseRateInitial.toFixed(2)),
            profitPercent: profitPercent,
            profitCharges: parseFloat(profitCharges.toFixed(2)),
            chargesBreakdown: Object.entries(chargesBreakdown).reduce((acc, [key, value]) => {
                acc[key] = parseFloat(value.toFixed(2));
                return acc;
            }, {}),
            totalCharges: parseFloat(totalAllAdditionalCharges.toFixed(2)),
            subtotalBeforeGST: parseFloat(subtotalBeforeGST.toFixed(2)),
            gstAmount: parseFloat(gstAmount.toFixed(2)),
            total: parseFloat(finalTotal.toFixed(2)),
        });

    } catch (error) {
        console.error("FATAL: An unexpected error occurred:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error.message 
        }, { status: 500 });
    }
}