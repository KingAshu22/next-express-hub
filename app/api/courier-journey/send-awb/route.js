import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import iso from "iso-3166-1-alpha-2"

const COURIER_JOURNEY_API =
  "http://courierjourney.xpresion.in/api/v1/Awbentry/Awbentry"

// KYC document type mapping (your system → Courier Journey)
const KYC_TYPE_MAP = {
  "Aadhaar No -": "Aadhaar Number",
  "Pan No -": "PAN Number",
  "Passport No -": "Passport Number",
  "Driving License No -": "Driving License Number",
  "Voter ID Card No -": "Voter Id",
  "GST No -": "GSTIN (Normal)",
}

export async function POST(request) {
  try {
    await connectToDB()
    const { awbId, service } = await request.json()

    // Fetch AWB data
    const awb = await Awb.findById(awbId)
    if (!awb) {
      return new Response(JSON.stringify({ error: "AWB not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if already integrated
    if (awb.cNoteNumber && awb.cNoteVendorName) {
      return new Response(
        JSON.stringify({
          error: "AWB already integrated with another vendor",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Calculate total shipping value
    const totalShippingValue = Number.parseFloat(
      awb?.boxes.reduce((acc, box) => {
        return (
          acc +
          box.items.reduce((itemAcc, item) => {
            const itemValue = Number.parseFloat(item.price) || 0
            const itemQuantity = Number.parseInt(item.quantity, 10) || 0
            return itemAcc + itemValue * itemQuantity
          }, 0)
        )
      }, 0),
    )

    // --- Country Code using iso-3166-1-alpha-2 ---
    const destCountry = awb.receiver?.country?.trim()
    const countryCode = iso.getCode(destCountry)

    if (!countryCode) {
      return new Response(
        JSON.stringify({
          error: `Country "${destCountry}" not recognized or supported by ISO-3166-1.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // --- KYC mapping and normalization ---
    const rawKycType = (awb.sender?.kyc?.type || "").toString()
    const normalizedKycType = rawKycType.trim()
    const mappedDocumentType = KYC_TYPE_MAP[normalizedKycType] || null

    // Prefer explicit kyc number if provided, otherwise fallback to GST
    const documentNumber =
      (awb.sender?.kyc?.kyc && String(awb.sender.kyc.kyc).trim()) ||
      (awb.sender?.gst && String(awb.sender.gst).trim()) ||
      "00000000000000"

    // Final document type
    const documentType =
      mappedDocumentType ||
      (awb.sender?.gst ? "GSTIN (Normal)" : "Aadhaar Number")

    console.log("Destination Country:", destCountry)
    console.log("ISO Country Code:", countryCode)
    console.log("KYC raw:", rawKycType)
    console.log("Mapped DocumentType:", mappedDocumentType)
    console.log("Final DocumentType:", documentType)
    console.log("DocumentNumber:", documentNumber)

    // Build payload for Courier Journey API
    const payload = {
      UserID: "CJEH065",
      Password: "CJEH@065",
      CustomerCode: "CJEH065",
      CustomerRefNo: awb.trackingNumber,
      OriginName: "BOM",
      DestinationName: countryCode,
      ShipperName: awb.sender?.name,
      ShipperContact: awb.sender?.name,
      ShipperAdd1: awb.sender?.address,
      ShipperCity: awb.sender?.city || "-",
      ShipperPin: awb.sender?.zip,
      ShipperTelno: awb.sender?.contact?.replace(/\D/g, ""),
      ShipperMobile: awb.sender?.contact?.replace(/\D/g, ""),
      ShipperEmail: awb.sender?.email,
      DocumentType: documentType,
      DocumentNumber: documentNumber,
      ConsigneeName: awb.receiver?.name,
      ConsigneeContact: awb.receiver?.name,
      ConsigneeAdd1: awb.receiver?.address,
      ConsigneeCity: awb.receiver?.city || "-",
      ConsigneePin: awb.receiver?.zip,
      ConsigneeTelno: awb.receiver?.contact?.replace(/\D/g, ""),
      ConsigneeMobile: awb.receiver?.contact?.replace(/\D/g, ""),
      ConsigneeEmail: awb.receiver?.email,
      VendorName: "CJ",
      ServiceName: service,
      ProductCode: "SPX",
      Dox_Spx: "SPX",
      Pieces: awb.boxes?.length?.toString() || "1",
      Weight:
        awb.boxes
          ?.reduce((sum, box) => sum + Number.parseFloat(box.actualWeight || 0), 0)
          .toFixed(2) || "1.00",
      Content: awb.boxes
        ?.map((box) => box.items?.map((item) => item.name).join(","))
        .join("; "),
      Currency: "INR",
      ShipmentValue: totalShippingValue?.toString(),
      RequiredPerforma: "Y",
      RequiredLable: "Y",
      Dimensions:
        awb.boxes?.map((box) => ({
          ActualWeight: box.actualWeight,
          Vol_WeightL: box.length,
          Vol_WeightW: box.breadth,
          Vol_WeightH: box.height,
        })) || [],
      Performa:
        awb.boxes?.flatMap(
          (box, idx) =>
            box.items?.map((item) => ({
              BoxNo: `Box-${idx + 1}`,
              Description: item.name,
              HSNCode: item.hsnCode,
              Quantity: item.quantity?.toString(),
              Rate: item.price?.toString(),
              Amount: (
                Number.parseFloat(item.price || 0) *
                Number.parseFloat(item.quantity || 1)
              ).toString(),
            })) || [],
        ) || [],
    }

    console.log("Payload sent to Courier Journey:", JSON.stringify(payload, null, 2))

    // Send to Courier Journey API
    const response = await fetch(COURIER_JOURNEY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Courier Journey API error: ${response.statusText}`)
    }

    const apiResponse = await response.json()

    if (apiResponse.Response?.Status === "Fail") {
      const errorMessages =
        apiResponse.Response?.Error?.map((err) => err.Description).filter(Boolean) || []
      const errorMessage =
        errorMessages.length > 0 ? errorMessages.join("; ") : "Failed to generate AWB"

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          apiResponse: apiResponse.Response,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    if (
      apiResponse.Response?.ResponseCode !== "RT01" ||
      apiResponse.Response?.Status !== "Success"
    ) {
      const errorMessage = apiResponse.Response?.APIError || "Failed to generate AWB"
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          apiResponse: apiResponse.Response,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Update AWB
    awb.cNoteNumber = apiResponse.Response?.AWBNo
    awb.cNoteVendorName = "Courier Journey"
    awb.awbLabel = apiResponse.Response?.Pdfdownload
    awb.boxLabel = apiResponse.Response?.PdfLabel

    await awb.save()

    return new Response(
      JSON.stringify({
        success: true,
        message: "AWB successfully sent to Courier Journey",
        updatedAwb: awb,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Error sending to Courier Journey:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send to Courier Journey",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}