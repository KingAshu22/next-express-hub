import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate";
import { Countries } from "@/app/constants/country";

export async function POST(req) {
  try {
    const { startWeight, endWeight, selectedServices, profitPercent, includeGST } = await req.json();
    const userId = req.headers.get("userId");
    const userType = req.headers.get("userType");

    if (!selectedServices || selectedServices.length !== 1) {
      return NextResponse.json(
        { error: "Please select exactly one service for this calculation." },
        { status: 400 }
      );
    }

    const selectedService = selectedServices[0];
    await connectToDB();

    // 1. Build access control query and fetch the rate document
    let rateQuery = { originalName: selectedService };
    if (userType === 'franchise' || userType === 'client') {
      if (!userId) {
        rateQuery.status = 'live';
      } else {
        rateQuery['$or'] = [
          { status: 'live' },
          { status: 'unlisted', assignedTo: userId }
        ];
      }
    } else if (userType !== 'admin' && userType !== 'branch') {
      rateQuery.status = 'live';
    }

    const rateResult = await Rate.findOne(rateQuery);

    if (!rateResult) {
      return NextResponse.json({ error: `Service "${selectedService}" not found or not available for your account.` }, { status: 404 });
    }

    // 2. Prepare data for calculation
    const { rates, zones } = rateResult;
    const dbCharges = rateResult.charges || []; // Main dynamic charges

    // 3. Generate weights array
    const weights = [];
    let currentWeight = Number.parseFloat(startWeight);
    const endWeightFloat = Number.parseFloat(endWeight);
    while (currentWeight <= endWeightFloat + 0.0001) {
      weights.push(Number(currentWeight.toFixed(2)));
      currentWeight += (currentWeight < 20) ? 0.5 : 1;
    }

    // Pre-process zones for faster lookup inside the loop
    const countryToZoneMap = new Map();
    for (const zoneObj of zones) {
        let zoneExtraCharges = [];
        if (zoneObj.extraCharges) {
            if (Array.isArray(zoneObj.extraCharges)) {
                zoneExtraCharges = zoneObj.extraCharges;
            } else if (typeof zoneObj.extraCharges === 'object') {
                zoneExtraCharges = Object.entries(zoneObj.extraCharges).map(([name, value]) => ({
                    chargeName: name, chargeType: 'perKg', chargeValue: value
                }));
            }
        }
        if (Array.isArray(zoneObj.countries)) {
            for (const country of zoneObj.countries) {
                countryToZoneMap.set(country, { zone: zoneObj.zone, extraCharges: zoneExtraCharges });
            }
        }
    }

    // Pre-sort rates for faster lookup
    const sortedRates = rates.map(r => ({ kg: parseFloat(r.kg), data: r })).sort((a, b) => a.kg - b.kg);

    // Helper function to find the correct rate slab
    const findWeightRate = (weight) => {
        const exactMatch = sortedRates.find(r => r.kg === weight);
        if (exactMatch) return { data: exactMatch.data, dbWeight: weight };
        
        const fallbackRate = [...sortedRates].reverse().find(r => r.kg <= weight);
        if (fallbackRate) return { data: fallbackRate.data, dbWeight: fallbackRate.kg };
        
        return null;
    };

    // 4. Calculate rates for all countries and weights
    const results = {
      countries: Countries,
      service: selectedService,
      weightRanges: weights.map((weightFloat) => {
        const row = {
          weight: weightFloat,
          rates: Countries.map((country) => {
            try {
              const zoneInfo = countryToZoneMap.get(country);
              if (!zoneInfo) return null;
              
              const { zone: selectedZone, extraCharges: zoneExtraCharges } = zoneInfo;
              
              const roundedWeight = Math.round(weightFloat * 2) / 2;
              const rateInfo = findWeightRate(roundedWeight);
              if (!rateInfo) return null;

              const { data: weightRateData, dbWeight: closestDbWeight } = rateInfo;
              const zoneRateValue = weightRateData[selectedZone];
              if (zoneRateValue === undefined || zoneRateValue === null) return null;
              
              // --- Start Dynamic Calculation ---
              const perKgRate = zoneRateValue / closestDbWeight;
              const baseRate = perKgRate * roundedWeight;
              
              const isSpecialRate = rateResult.status === 'unlisted';
              let subtotalAfterProfit = baseRate;
              if (!isSpecialRate) {
                  subtotalAfterProfit += (profitPercent / 100) * baseRate;
              }

              let chargesBreakdown = {};
              const extraChargesWeight = Math.ceil(weightFloat);

              const processCharges = (chargeList, weightForPerKg) => {
                  if (!Array.isArray(chargeList)) return;
                  chargeList.forEach(charge => {
                      if (!charge || typeof charge.chargeValue !== 'number') return;
                      let chargeAmount = 0;
                      switch (charge.chargeType) {
                          case 'perKg': chargeAmount = charge.chargeValue * weightForPerKg; break;
                          case 'oneTime': chargeAmount = charge.chargeValue; break;
                      }
                      if (charge.chargeType !== 'percentage') {
                          chargesBreakdown[charge.chargeName] = (chargesBreakdown[charge.chargeName] || 0) + chargeAmount;
                      }
                  });
              };
              
              processCharges(dbCharges, extraChargesWeight);
              processCharges(zoneExtraCharges, extraChargesWeight);

              const fixedChargesTotal = Object.values(chargesBreakdown).reduce((sum, val) => sum + val, 0);
              let subtotalAfterFixedCharges = subtotalAfterProfit + fixedChargesTotal;
              
              const allCharges = [...dbCharges, ...zoneExtraCharges];
              allCharges.filter(c => c && c.chargeType === 'percentage').forEach(charge => {
                  if (typeof charge.chargeValue === 'number') {
                      const chargeAmount = (charge.chargeValue / 100) * subtotalAfterFixedCharges;
                      chargesBreakdown[charge.chargeName] = (chargesBreakdown[charge.chargeName] || 0) + chargeAmount;
                  }
              });
              
              const totalCharges = Object.values(chargesBreakdown).reduce((sum, val) => sum + val, 0);
              const totalBeforeGST = subtotalAfterProfit + totalCharges;
              
              let finalRate = totalBeforeGST;
              if (includeGST) {
                  finalRate += (18 / 100) * totalBeforeGST;
              }
              
              return parseFloat((finalRate / weightFloat).toFixed(2));

            } catch (error) {
              console.error(`Error calculating rate for country ${country}, weight ${weightFloat}:`, error);
              return null;
            }
          }),
        };
        return row;
      }),
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in rate-all-countries API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}