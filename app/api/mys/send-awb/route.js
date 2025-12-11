import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import iso from "iso-3166-1-alpha-2"
import { getExpressImpexToken } from "../get-token/route"

const EXPRESS_IMPEX_CREATE_DOCKET_URL = "http://admin.myslogistics.online//docket_api/create_docket"

// KYC document type mapping (your system → Express Impex)
const KYC_TYPE_MAP = {
  "Aadhaar No -": "Aadhaar Number",
  "Pan No -": "PAN Number",
  "Passport No -": "Passport Number",
  "Driving License No -": "DRIVING LICENCE",
  "Voter ID Card No -": "Voter Id",
  "GST No -": "GSTIN (Normal)",
}

// Service to Product Code mapping
// Based on the documentation, product_code might need to match the service
const SERVICE_PRODUCT_MAP = {
  "DPD CLASSIC": {
    service_code: "DPD CLASSIC",
    product_code: "NONDOX", // Non-Document Express (for parcels with items)
  },
  "DPD UK": {
    service_code: "DPD UK",
    product_code: "NONDOX",
  },
}

// Available product codes (adjust based on Express Impex's actual codes)
// Common codes: DOX (Documents), NDX (Non-Documents/Parcels), SPX (Special)
const DEFAULT_PRODUCT_CODE = "NONDOX" // Non-Document for shipments with items

export async function POST(request) {
  try {
    await connectToDB()
    const { awbId, service, vendorCode, productCode } = await request.json()

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
        }
      )
    }

    // Get Express Impex token
    const { token, customerId } = await getExpressImpexToken()

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
      }, 0)
    ) || 0

    // Calculate total actual weight
    const totalActualWeight = awb.boxes
      ?.reduce((sum, box) => sum + Number.parseFloat(box.actualWeight || 0), 0)
      .toFixed(2) || "1.00"

    // --- Country Code using iso-3166-1-alpha-2 ---
    const destCountry = awb.receiver?.country?.trim()
    const destCountryCode = iso.getCode(destCountry)

    const originCountry = awb.sender?.country?.trim() || "India"
    const originCountryCode = iso.getCode(originCountry) || "IN"

    if (!destCountryCode) {
      return new Response(
        JSON.stringify({
          error: `Destination country "${destCountry}" not recognized or supported by ISO-3166-1.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
      "000000000000"

    // Final document type
    const documentType =
      mappedDocumentType ||
      (awb.sender?.gst ? "GSTIN (Normal)" : "Aadhaar Number")

    // Get current date and time
    const now = new Date()
    const bookingDate = now.toISOString().split("T")[0] // YYYY-MM-DD
    const bookingTime = now.toTimeString().split(" ")[0] // HH:MM:SS

    // Generate invoice number - FIX for NaN issue
    const invoiceNumber = awb.invoiceNumber || 
                          awb.invoice_number || 
                          `INV-${awb.trackingNumber}-${Date.now()}`

    // Build shipment content from all items
    const shipmentContent = awb.boxes
      ?.map((box) => box.items?.map((item) => item.name).join(", "))
      .join("; ") || "General Goods"

    // Determine product code based on service or use provided/default
    const serviceMapping = SERVICE_PRODUCT_MAP[service] || {}
    const finalProductCode = productCode || serviceMapping.product_code || DEFAULT_PRODUCT_CODE
    const finalServiceCode = serviceMapping.service_code || service

    // Build docket_items array (one entry per box)
    const docketItems = awb.boxes?.map((box) => ({
      actual_weight: String(Number.parseFloat(box.actualWeight || 1).toFixed(2)),
      length: String(Number.parseFloat(box.length || 1).toFixed(2)),
      width: String(Number.parseFloat(box.breadth || box.width || 1).toFixed(2)),
      height: String(Number.parseFloat(box.height || 1).toFixed(2)),
      number_of_boxes: "1",
    })) || [
      {
        actual_weight: "1.00",
        length: "10.00",
        width: "10.00",
        height: "10.00",
        number_of_boxes: "1",
      },
    ]

    // Build free_form_line_items array (invoice line items)
    const freeFormLineItems = awb.boxes?.flatMap((box, boxIndex) =>
      box.items?.map((item) => {
        const quantity = Number.parseInt(item.quantity, 10) || 1
        const rate = Number.parseFloat(item.price) || 0
        const total = quantity * rate
        const itemCount = box.items?.length || 1
        const unitWeight = Number.parseFloat(box.actualWeight || 1) / itemCount

        return {
          total: String(total.toFixed(2)),
          no_of_packages: String(quantity),
          box_no: String(boxIndex + 1),
          rate: String(rate.toFixed(2)),
          hscode: String(item.hsnCode || item.hsn_code || "00000000").padStart(8, "0"),
          description: item.name || item.description || "Item",
          unit_of_measurement: "Pcs",
          unit_weight: String(unitWeight.toFixed(2)),
          igst_amount: "0.00",
        }
      }) || []
    ) || []

    // Build KYC details array
    const kycDetails = []
    if (documentNumber && documentNumber !== "000000000000") {
      kycDetails.push({
        document_type: documentType,
        document_no: documentNumber,
        document_sub_type: "doc_1",
        document_name: "",
        file_path: "",
      })
    }

    // Determine if we need free form invoice (for non-DOX shipments)
    const needsFreeFormInvoice = freeFormLineItems.length > 0 ? "1" : "0"

    // Clean phone numbers - remove non-digits and ensure proper format
    const cleanPhone = (phone) => {
      if (!phone) return "0000000000"
      const cleaned = phone.replace(/\D/g, "")
      // Return last 10 digits if longer, or pad if shorter
      if (cleaned.length > 10) {
        return cleaned.slice(-10)
      }
      return cleaned.padStart(10, "0")
    }

    // Build payload for Express Impex API
    const payload = {
      // Basic shipment info
      tracking_no: awb.trackingNumber,
      reference_name: awb.sender?.name || "Reference",
      customer_id: parseInt(customerId, 10),
      origin_code: awb.sender?.zip || originCountryCode,
      product_code: finalProductCode, // FIXED: Using proper product code
      destination_code: destCountryCode,
      booking_date: bookingDate,
      booking_time: bookingTime,
      pcs: String(awb.boxes?.length || 1),
      shipment_value: String(totalShippingValue.toFixed(2)),
      shipment_value_currency: "INR",
      actual_weight: totalActualWeight,
      shipment_invoice_no: invoiceNumber, // FIXED: Proper invoice number
      shipment_invoice_date: bookingDate,
      shipment_content: shipmentContent.substring(0, 200), // Limit content length
      remark: awb.remarks || "",
      entry_type: 2,
      api_service_code: finalServiceCode,
      api_vendor_code: vendorCode || "",

      // Free form invoice settings
      new_docket_free_form_invoice: needsFreeFormInvoice,
      free_form_currency: "INR",
      terms_of_trade: "FOB",
      free_form_note_master_code: "SAMPLE",

      // Shipper details
      shipper_name: (awb.sender?.name || "Shipper").substring(0, 50),
      shipper_company_name: (awb.sender?.company || awb.sender?.name || "Company").substring(0, 50),
      shipper_contact_no: cleanPhone(awb.sender?.contact),
      shipper_email: "info@kargoone.com",
      shipper_address_line_1: (awb.sender?.address || "Address Line 1").substring(0, 100),
      shipper_address_line_2: (awb.sender?.address2 || "-").substring(0, 100),
      shipper_address_line_3: "",
      shipper_city: (awb.sender?.city || "Mumbai").substring(0, 50),
      shipper_state: (awb.sender?.state || "Maharashtra").substring(0, 50),
      shipper_country: originCountryCode,
      shipper_zip_code: awb.sender?.zip || "400001",
      shipper_gstin_type: documentType,
      shipper_gstin_no: documentNumber,

      // Consignee details
      consignee_name: (awb.receiver?.name || "Consignee").substring(0, 50),
      consignee_company_name: (awb.receiver?.company || awb.receiver?.name || "Company").substring(0, 50),
      consignee_contact_no: cleanPhone(awb.receiver?.contact),
      consignee_email: awb.receiver?.email || "consignee@email.com",
      consignee_address_line_1: (awb.receiver?.address || "Address Line 1").substring(0, 100),
      consignee_address_line_2: (awb.receiver?.address2 || "-").substring(0, 100),
      consignee_address_line_3: "",
      consignee_city: (awb.receiver?.city || "City").substring(0, 50),
      consignee_state: (awb.receiver?.state || "").substring(0, 50),
      consignee_country: destCountryCode,
      consignee_zip_code: awb.receiver?.zip || "000000",
      consignee_gstin_type: "",
      consignee_gstin_no: "",

      // Docket items (boxes/pieces)
      docket_items: docketItems,

      // Invoice line items
      free_form_line_items: needsFreeFormInvoice === "1" ? freeFormLineItems : [],

      // KYC details
      kyc_details: kycDetails,
    }

    console.log("Payload sent to Express Impex:", JSON.stringify(payload, null, 2))

    // Send to Express Impex API
    const response = await fetch(EXPRESS_IMPEX_CREATE_DOCKET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("Express Impex Raw Response:", responseText)

    let apiResponse
    try {
      apiResponse = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse Express Impex response:", parseError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid response from Express Impex: ${responseText.substring(0, 200)}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log("Express Impex API Response:", JSON.stringify(apiResponse, null, 2))

    // Check for errors in response
    if (!apiResponse.success) {
      const errorMessages = Array.isArray(apiResponse.errors) && apiResponse.errors.length > 0
        ? apiResponse.errors.join("; ")
        : apiResponse.message || apiResponse.error || "Failed to create docket"

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessages,
          apiResponse: apiResponse,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Extract AWB number and labels from response
    const awbNumber = apiResponse.data?.awb_no || 
                      apiResponse.data?.docket_no || 
                      apiResponse.data?.tracking_no ||
                      apiResponse.data?.consignment_no

    const awbLabel = apiResponse.data?.label_pdf || 
                     apiResponse.data?.awb_label || 
                     apiResponse.data?.label_url ||
                     apiResponse.data?.pdf_url ||
                     null

    const boxLabel = apiResponse.data?.box_label || 
                     apiResponse.data?.box_label_url ||
                     null

    if (!awbNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No AWB number received from Express Impex",
          apiResponse: apiResponse,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Update AWB in database
    awb.cNoteNumber = awbNumber
    awb.cNoteVendorName = "MYS"
    awb.expressImpexService = service
    
    // Store labels if provided (check if they're base64 or URLs)
    if (awbLabel) {
      awb.awbLabel = awbLabel
    }
    if (boxLabel) {
      awb.boxLabel = boxLabel
    }

    // Store full API response for reference
    awb.expressImpexResponse = apiResponse.data

    await awb.save()

    return new Response(
      JSON.stringify({
        success: true,
        message: "AWB successfully sent to Express Impex",
        updatedAwb: awb,
        apiResponse: apiResponse.data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error sending to Express Impex:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send to Express Impex",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}