import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"
import { Countries } from "@/app/constants/country"

export async function POST(req) {
  try {
    const { startWeight, endWeight, selectedServices, profitPercent, includeGST } = await req.json()

    if (!selectedServices || selectedServices.length !== 1) {
      return NextResponse.json(
        { error: "Please select exactly one service for all countries calculation" },
        { status: 400 },
      )
    }

    const selectedService = selectedServices[0]

    await connectToDB()

    // Generate weights array
    const weights = []
    let currentWeight = Number.parseFloat(startWeight)
    const endWeightFloat = Number.parseFloat(endWeight)

    while (currentWeight <= endWeightFloat) {
      weights.push(currentWeight.toFixed(1))
      currentWeight += 1
    }

    // Fetch rate data for the selected service
    const rateResult = await Rate.findOne({ service: selectedService })

    if (!rateResult) {
      return NextResponse.json({ error: `No rates found for service: ${selectedService}` }, { status: 404 })
    }

    const { rates, zones, type } = rateResult

    // Helper function to calculate rate for a specific country and weight
    const calculateRateForCountryAndWeight = (country, weight) => {
      try {
        const weightFloat = Number.parseFloat(weight)

        // Find zone for the country
        let selectedZone
        let extraCharges = {}

        for (const zoneObj of zones) {
          if (zoneObj.countries && zoneObj.countries.includes(country)) {
            selectedZone = zoneObj.zone
            extraCharges = zoneObj.extraCharges || {}
            break
          }
        }

        if (!selectedZone) {
          return null
        }

        // Find rate for the weight
        const roundedWeight = weightFloat.toFixed(2)
        let weightRate = rates.find((rate) => Number.parseFloat(rate.kg) === Number.parseFloat(roundedWeight))

        if (!weightRate) {
          const sortedRates = rates
            .map((rate) => ({ kg: Number.parseFloat(rate.kg), data: rate }))
            .sort((a, b) => b.kg - a.kg)

          const fallbackRate = sortedRates.find((r) => r.kg <= weightFloat)

          if (fallbackRate) {
            weightRate = fallbackRate.data
          } else {
            return null
          }
        }

        const zoneRate = weightRate[selectedZone]

        if (!zoneRate) {
          return null
        }

        const rate = Number.parseFloat((zoneRate / weightFloat).toFixed(2))
        const baseCharge = Number.parseFloat((rate * weightFloat).toFixed(2))
        let baseCharges = baseCharge

        // COVID charges
        let covidCharges = 0
        const covidChargePerKg = 15

        if (["aramex"].includes(type)) {
          covidCharges = Number.parseFloat((covidChargePerKg * weightFloat).toFixed(2))
        }

        baseCharges += covidCharges

        // Extra charges
        let extraChargeTotal = 0
        for (const chargeValue of Object.values(extraCharges)) {
          const charge = Number.parseFloat((chargeValue * weightFloat).toFixed(2))
          extraChargeTotal += charge
        }

        baseCharges += extraChargeTotal

        // Fuel charges
        let fuelCharges = 0
        if (type === "dhl") {
          fuelCharges = Number.parseFloat(((27.5 / 100) * baseCharges).toFixed(2))
        } else if (type === "fedex") {
          fuelCharges = Number.parseFloat(((29 / 100) * baseCharges).toFixed(2))
        } else if (type === "ups") {
          fuelCharges = Number.parseFloat(((30.5 / 100) * baseCharges).toFixed(2))
        } else if (type === "dtdc") {
          fuelCharges = Number.parseFloat(((36 / 100) * baseCharges).toFixed(2))
        } else if (["aramex", "orbit"].includes(type)) {
          fuelCharges = Number.parseFloat(((35.5 / 100) * baseCharges).toFixed(2))
        }

        baseCharges += fuelCharges

        // Profit
        const profitCharges = Number.parseFloat(((profitPercent / 100) * baseCharges).toFixed(2))
        const total = Number.parseFloat((baseCharges + profitCharges).toFixed(2))

        // GST
        let finalRate

        if (includeGST) {
          const GST = Number.parseFloat(((18 / 100) * total).toFixed(2))
          finalRate = Number.parseFloat((total + GST).toFixed(2))
        } else {
          finalRate = total
        }

        // Calculate rate per kg
        const ratePerKg = Number.parseFloat((finalRate / weightFloat).toFixed(2))

        return ratePerKg
      } catch (error) {
        console.error(`Error calculating rate for country ${country}, weight ${weight}:`, error)
        return null
      }
    }

    // Calculate rates for all countries and weights
    const results = {
      countries: Countries,
      service: selectedService,
      weightRanges: weights.map((weight) => ({
        weight: weight,
        rates: Countries.map((country) => {
          return calculateRateForCountryAndWeight(country, weight)
        }),
      })),
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error in rate-all-countries API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
