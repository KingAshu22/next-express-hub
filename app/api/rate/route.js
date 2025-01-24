import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate"; // Import your Rate model
import { NextRequest, NextResponse } from "next/server";

// Function to calculate rates
async function getRates(type, weight, country, profitPercent = 50) {
    try {
        const rateResult = await Rate.findOne({ type });
        if (!rateResult) {
            return { error: "Type not found in rates" };
        }

        const { rates, zones } = rateResult;

        // Find the zone for the given country
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
            return { error: "Zone not found for the given country" };
        }

        weight = (Math.ceil(weight) + 0.0).toFixed(1).toString();

        const weightRate = rates.find((rate) => rate.kg == weight);
        if (!weightRate) {
            return { error: "Rate not found for the given weight" };
        }

        const zoneRate = weightRate[selectedZone];
        if (!zoneRate) {
            return { error: "Rate not found for the selected zone" };
        }

        const rate = Math.ceil(Math.ceil(zoneRate) / weight);
        let baseCharges = rate * weight;

        const baseCharge = baseCharges;

        let covidCharges = ["dtdc", "aramex", "orbit"].includes(type)
            ? Math.ceil(15 * weight)
            : 0;

        baseCharges += covidCharges;

        let fuelCharges = 0;
        if (type === "dhl" || type === "fedex") {
            fuelCharges = Math.ceil((30 / 100) * baseCharges);
        } else if (type === "ups") {
            fuelCharges = Math.ceil((30.5 / 100) * baseCharges);
        } else if (type === "dtdc") {
            fuelCharges = Math.ceil((36 / 100) * baseCharges);
        } else if (["aramex", "orbit"].includes(type)) {
            fuelCharges = Math.ceil((25 / 100) * baseCharges);
        }

        baseCharges += fuelCharges;

        let extraChargeTotal = 0;
        for (const chargeValue of Object.values(extraCharges)) {
            extraChargeTotal += Math.ceil(chargeValue * weight);
        }

        baseCharges += extraChargeTotal;

        let profitCharges = ["Anaya World", "Prime"].includes(type)
            ? 0
            : Math.ceil((profitPercent / 100) * baseCharges);

        const total = baseCharges + profitCharges;
        const GST = (18 / 100) * total;
        const totalWithGST = Math.ceil(total + GST);

        return {
            zone: selectedZone,
            weight,
            rate,
            baseCharge,
            covidCharges,
            fuelCharges,
            extraCharges,
            extraChargeTotal,
            baseCharges,
            profitPercent,
            profitCharges,
            total,
            GST,
            totalWithGST,
        };
    } catch (error) {
        console.error(error);
        return { error: "Internal Server Error" };
    }
}

// API Route handler
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const weight = searchParams.get("weight");
        const country = searchParams.get("country");
        const profitPercent = searchParams.get("profitPercent");

        if (!type || !weight || !country) {
            return NextResponse.json(
                { error: "Type, weight, and country are required fields." },
                { status: 400 }
            );
        }

        await connectToDB();

        const result = await getRates(type, weight, country, profitPercent);
        if (result.error) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error processing the request:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}