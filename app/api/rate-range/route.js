import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate";

export async function POST(req) {
  try {
    const { startWeight, endWeight, country, selectedServices, profitPercent, includeGST } = await req.json();
    const userId = req.headers.get("userId");
    const userType = req.headers.get("userType");

    if (!country || !selectedServices || selectedServices.length === 0) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    await connectToDB();

    // 1. Build the access control query for fetching rates
    let serviceQuery = { originalName: { $in: selectedServices } };

    if (userType === 'franchise' || userType === 'client') {
      if (!userId) {
        serviceQuery.status = 'live';
      } else {
        serviceQuery['$or'] = [
          { status: 'live' },
          { status: 'unlisted', assignedTo: userId }
        ];
      }
    } else if (userType !== 'admin' && userType !== 'branch') {
      serviceQuery.status = 'live';
    }
    // Admins/branches see all selected services

    // 2. Fetch all relevant service rates in a single query
    const serviceRateDocs = await Rate.find(serviceQuery);

    // Map docs to an object for easy lookup
    const serviceRates = serviceRateDocs.reduce((acc, doc) => {
        acc[doc.originalName] = doc;
        return acc;
    }, {});


    // 3. Generate the list of weights to calculate
    const weights = [];
    let currentWeight = Number.parseFloat(startWeight);
    const endWeightFloat = Number.parseFloat(endWeight);
    while (currentWeight <= endWeightFloat + 0.0001) {
      weights.push(Number(currentWeight.toFixed(2)));
      currentWeight += (currentWeight < 20) ? 0.5 : 1;
    }

    // 4. Process rates for each weight and service
    const results = {
      countryName: country,
      headers: selectedServices,
      rows: [],
    };

    for (const weightFloat of weights) {
      const row = {
        weight: weightFloat,
        rates: [],
      };

      for (const originalName of selectedServices) {
        const rateData = serviceRates[originalName];

        if (!rateData) {
          row.rates.push(null); // Service not found or user doesn't have access
          continue;
        }

        try {
          const { rates, zones } = rateData;
          const dbCharges = rateData.charges || []; // Main dynamic charges

          // Find zone for the country
          let selectedZone;
          let zoneExtraCharges = []; // Default to an empty array
          for (const zoneObj of zones) {
            if (zoneObj.countries && zoneObj.countries.includes(country)) {
              selectedZone = zoneObj.zone;
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
            row.rates.push(null);
            continue;
          }

          // Find rate slab for the weight
          const roundedWeight = Math.round(weightFloat * 2) / 2;
          let weightRateData;
          let closestDbWeight;

          const sortedRates = rates.map(r => ({ kg: parseFloat(r.kg), data: r })).sort((a, b) => a.kg - b.kg);
          const exactMatch = sortedRates.find(r => r.kg === roundedWeight);
          
          if(exactMatch) {
              weightRateData = exactMatch.data;
              closestDbWeight = roundedWeight;
          } else {
              const fallbackRate = [...sortedRates].reverse().find(r => r.kg <= roundedWeight);
              if (fallbackRate) {
                  weightRateData = fallbackRate.data;
                  closestDbWeight = fallbackRate.kg;
              } else {
                  row.rates.push(null);
                  continue;
              }
          }
          
          const zoneRateValue = weightRateData[selectedZone];
          if (zoneRateValue === undefined || zoneRateValue === null) {
            row.rates.push(null);
            continue;
          }

          // --- START DYNAMIC CALCULATION ---
          const perKgRate = zoneRateValue / closestDbWeight;
          const baseRate = perKgRate * roundedWeight;
          
          const isSpecialRate = rateData.status === 'unlisted';
          let subtotalAfterProfit = baseRate;
          if (!isSpecialRate) {
              subtotalAfterProfit += (profitPercent / 100) * baseRate;
          }

          let chargesBreakdown = {};
          const extraChargesWeight = Math.ceil(weightFloat);

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
          const totalBeforeGST = subtotalAfterProfit + totalCharges;

          let finalRate = totalBeforeGST;
          if (includeGST) {
              finalRate += (18 / 100) * totalBeforeGST;
          }
          
          const ratePerKg = finalRate / weightFloat;
          row.rates.push(parseFloat(ratePerKg.toFixed(2)));

        } catch (error) {
          console.error(`Error calculating rate for service ${originalName}, weight ${weightFloat}:`, error);
          row.rates.push(null);
        }
      }

      results.rows.push(row);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Rate range calculation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}