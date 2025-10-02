import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate"; // Your mongoose model

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    let weight = parseFloat(searchParams.get("weight"));
    const country = searchParams.get("country");
    const profitPercent = parseFloat(searchParams.get("profitPercent")) || 0;

    if (!type || !weight || !country) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // ✅ Round weight to nearest 0.5 kg
    weight = Math.round(weight * 2) / 2;

    await connectToDB();

    try {
        const rateResult = await Rate.findOne({ type });

        if (!rateResult) {
            return NextResponse.json({ error: "Type not found in rates" }, { status: 404 });
        }

        const { rates, zones } = rateResult;

        // find zone for the given country
        let selectedZone;
        let extraCharges = {};
        for (const zoneObj of zones) {
            if (zoneObj.countries.includes(country)) {
                selectedZone = zoneObj.zone;
                extraCharges = zoneObj.extraCharges || {};
                break;
            }
        }

        if (!selectedZone) {
            return NextResponse.json({ error: "Zone not found for the given country" }, { status: 404 });
        }

        // sort all available weights
        const sortedRates = rates
            .map(rate => ({ kg: parseFloat(rate.kg), data: rate }))
            .sort((a, b) => a.kg - b.kg);

        // find exact match
        let weightRate = sortedRates.find(r => r.kg === weight)?.data;

        // if no exact match, find closest lower or equal weight
        let closestWeight, zoneRate;
        if (!weightRate) {
            const fallbackRate = [...sortedRates].reverse().find(r => r.kg <= weight);
            if (fallbackRate) {
                weightRate = fallbackRate.data;
                closestWeight = fallbackRate.kg;
            } else {
                return NextResponse.json({ error: "No suitable rate found for the weight" }, { status: 404 });
            }
        } else {
            closestWeight = weight;
        }

        zoneRate = weightRate[selectedZone];
        if (!zoneRate) {
            return NextResponse.json({ error: "Rate not found for the selected zone" }, { status: 404 });
        }

        // ✅ calculate per kg rate from closest available weight
        const perKgRate = parseFloat((zoneRate / closestWeight).toFixed(2));

        // ✅ base charge using rounded weight
        const baseCharge = parseFloat((perKgRate * weight).toFixed(2));
        let baseCharges = baseCharge;

        // --- COVID charges ---
        let covidCharges = 0;
        if (rateResult.covidCharges !== undefined && rateResult.covidCharges !== null) {
            // use value from DB (assumed per-kg)
            covidCharges = parseFloat((rateResult.covidCharges * weight).toFixed(2));
        } else if (["aramex"].includes(type)) {
            // fallback logic
            const covidChargePerKg = 15;
            covidCharges = parseFloat((covidChargePerKg * weight).toFixed(2));
        }
        baseCharges += covidCharges;

        // --- Extra charges ---
        let extraChargeTotal = 0;
        for (const chargeValue of Object.values(extraCharges)) {
            const charge = parseFloat((chargeValue * weight).toFixed(2));
            extraChargeTotal += charge;
        }
        baseCharges += extraChargeTotal;

        // --- Fuel charges ---
        let fuelCharges = 0;
        if (rateResult.fuelCharges !== undefined && rateResult.fuelCharges !== null) {
            // use value from DB (assumed percentage of baseCharges)
            fuelCharges = parseFloat(((rateResult.fuelCharges / 100) * baseCharges).toFixed(2));
        } else {
            // fallback logic
            if (type === "dhl") {
                fuelCharges = parseFloat(((27.5 / 100) * baseCharges).toFixed(2));
            } else if (type === "fedex") {
                fuelCharges = parseFloat(((29 / 100) * baseCharges).toFixed(2));
            } else if (type === "ups") {
                fuelCharges = parseFloat(((30.5 / 100) * baseCharges).toFixed(2));
            } else if (type === "dtdc") {
                fuelCharges = parseFloat(((36 / 100) * baseCharges).toFixed(2));
            } else if (["aramex", "orbit"].includes(type)) {
                fuelCharges = parseFloat(((35.5 / 100) * baseCharges).toFixed(2));
            }
        }
        baseCharges += fuelCharges;

        // --- Profit ---
        const profitCharges = parseFloat(((profitPercent / 100) * baseCharges).toFixed(2));
        const total = parseFloat((baseCharges + profitCharges).toFixed(2));

        // --- GST ---
        const GST = parseFloat(((18 / 100) * total).toFixed(2));
        const totalWithGST = parseFloat((total + GST).toFixed(2));

        return NextResponse.json({
            service: rateResult.service,
            zone: selectedZone,
            requestedWeight: weight, // ✅ final rounded weight used
            weight: closestWeight,   // ✅ closest db weight used for per-kg rate
            rate: perKgRate,
            zoneRate: parseFloat(zoneRate.toFixed(2)),
            baseCharge,
            covidCharges,
            extraCharges,
            extraChargeTotal,
            fuelCharges,
            baseCharges: parseFloat(baseCharges.toFixed(2)),
            profitPercent,
            profitCharges,
            total,
            GST,
            totalWithGST,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
