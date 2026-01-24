// app/api/vendor-integrations/send-awb/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import Awb from "@/models/Awb"
import iso from "iso-3166-1-alpha-2"

// KYC document type mapping
const KYC_TYPE_MAP = {
  "Aadhaar No -": "Aadhaar Number",
  "Pan No -": "PAN Number",
  "Passport No -": "Passport Number",
  "Driving License No -": "Driving License Number",
  "Voter ID Card No -": "Voter Id",
  "GST No -": "GSTIN (Normal)",
}

const ITD_KYC_TYPE_MAP = {
  "Aadhaar No -": "Aadhaar Number",
  "Pan No -": "PAN Number",
  "Passport No -": "Passport Number",
  "Driving License No -": "DRIVING LICENCE",
  "Voter ID Card No -": "Voter Id",
  "GST No -": "GSTIN (Normal)",
}

// Helper to get ITD token
async function getITDToken(credentials, vendorId) {
  const vendor = await VendorIntegration.findById(vendorId)
  const itdCreds = vendor.itdCredentials

  if (itdCreds.cachedToken &&
    itdCreds.tokenExpiresAt &&
    Date.now() < new Date(itdCreds.tokenExpiresAt).getTime() - 300000) {
    return {
      token: itdCreds.cachedToken,
      customerId: itdCreds.cachedCustomerId,
    }
  }

  const tokenUrl = `${credentials.apiUrl}/get_token`
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: credentials.companyId,
      email: credentials.email,
      password: credentials.password,
    }),
  })

  if (!response.ok) {
    throw new Error(`ITD Auth API error: ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success || !result.data?.token) {
    throw new Error(result.errors?.join(", ") || "Failed to get ITD token")
  }

  await VendorIntegration.findByIdAndUpdate(vendorId, {
    "itdCredentials.cachedToken": result.data.token,
    "itdCredentials.cachedCustomerId": result.data.customer_id,
    "itdCredentials.tokenExpiresAt": new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  return {
    token: result.data.token,
    customerId: result.data.customer_id,
  }
}

const cleanPhone = (phone) => {
  if (!phone) return "0000000000"
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length > 10) return cleaned.slice(-10)
  return cleaned.padStart(10, "0")
}

// Send to Xpression API
async function sendToXpression(awb, vendor, serviceData) {
  const creds = vendor.xpressionCredentials

  const totalShippingValue = Number.parseFloat(
    awb?.boxes.reduce((acc, box) => {
      return acc + box.items.reduce((itemAcc, item) => {
        const itemValue = Number.parseFloat(item.price) || 0
        const itemQuantity = Number.parseInt(item.quantity, 10) || 0
        return itemAcc + itemValue * itemQuantity
      }, 0)
    }, 0)
  )

  const destCountry = awb.receiver?.country?.trim()
  const countryCode = iso.getCode(destCountry)

  if (!countryCode) {
    throw new Error(`Country "${destCountry}" not recognized by ISO-3166-1.`)
  }

  const rawKycType = (awb.sender?.kyc?.type || "").toString().trim()
  const mappedDocumentType = KYC_TYPE_MAP[rawKycType] || null
  const documentNumber =
    (awb.sender?.kyc?.kyc && String(awb.sender.kyc.kyc).trim()) ||
    (awb.sender?.gst && String(awb.sender.gst).trim()) ||
    "00000000000000"
  const documentType = mappedDocumentType || (awb.sender?.gst ? "GSTIN (Normal)" : "Aadhaar Number")

  const payload = {
    UserID: creds.userId,
    Password: creds.password,
    CustomerCode: creds.customerCode,
    CustomerRefNo: awb.trackingNumber,
    OriginName: creds.originName || "BOM",
    DestinationName: countryCode,
    ShipperName: awb.sender?.name,
    ShipperContact: awb.sender?.name,
    ShipperAdd1: awb.sender?.address,
    ShipperAdd2: awb.sender?.address2 || "-",
    ShipperCity: awb.sender?.city || "-",
    ShipperState: awb.sender?.state || "-",
    ShipperPin: awb.sender?.zip,
    ShipperTelno: awb.sender?.contact?.replace(/\D/g, ""),
    ShipperMobile: awb.sender?.contact?.replace(/\D/g, ""),
    ShipperEmail: awb.sender?.email || "info@kargoone.com",
    DocumentType: documentType,
    DocumentNumber: documentNumber,
    ConsigneeName: awb.receiver?.name,
    ConsigneeContact: awb.receiver?.name,
    ConsigneeAdd1: awb.receiver?.address,
    ConsigneeAdd2: awb.receiver?.address2 || "-",
    ConsigneeCity: awb.receiver?.city || "-",
    ConsigneeState: awb.receiver?.state || "-",
    ConsigneePin: awb.receiver?.zip,
    ConsigneeTelno: awb.receiver?.contact?.replace(/\D/g, ""),
    ConsigneeMobile: awb.receiver?.contact?.replace(/\D/g, ""),
    ConsigneeEmail: awb.receiver?.email,
    VendorName: serviceData.vendorCode || "CJ",
    ServiceName: serviceData.serviceName,
    ProductCode: serviceData.productCode || "SPX",
    Dox_Spx: serviceData.productCode || "SPX",
    Pieces: awb.boxes?.length?.toString() || "1",
    Weight: awb.boxes
      ?.reduce((sum, box) => sum + Number.parseFloat(box.actualWeight || 0), 0)
      .toFixed(2) || "1.00",
    Content: awb.boxes
      ?.map((box) => box.items?.map((item) => item.name).join(","))
      .join("; "),
    Currency: "INR",
    ShipmentValue: totalShippingValue?.toString(),
    RequiredPerforma: "Y",
    RequiredLable: "Y",
    Dimensions: awb.boxes?.map((box) => ({
      ActualWeight: box.actualWeight,
      Vol_WeightL: box.length,
      Vol_WeightW: box.breadth,
      Vol_WeightH: box.height,
    })) || [],
    Performa: awb.boxes?.flatMap((box, idx) =>
      box.items?.map((item) => ({
        BoxNo: `Box-${idx + 1}`,
        Description: item.name,
        HSNCode: item.hsnCode,
        Quantity: item.quantity?.toString(),
        Rate: item.price?.toString(),
        Amount: (
          Number.parseFloat(item.price || 0) * Number.parseFloat(item.quantity || 1)
        ).toString(),
      })) || []
    ) || [],
  }

  const response = await fetch(creds.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Xpression API error: ${response.statusText}`)
  }

  const apiResponse = await response.json()

  console.log("Xpression API Response:", apiResponse)

  const responseData = apiResponse.Response || apiResponse

  // Handle errors
  if (responseData.Status === "Fail") {
    console.error("Xpression API Full Error:", JSON.stringify(responseData, null, 2))

    const errorMessage =
      responseData.Error?.[0]?.ErrorMessage ||
      responseData.Error?.[0]?.Message ||
      responseData.APIError ||
      `Xpression Error: ${responseData.Error[0]?.Description || "UNKNOWN"}`

    throw new Error(errorMessage)
  }

  if (responseData.ResponseCode !== "RT01" || responseData.Status !== "Success") {
    throw new Error(
      responseData.Error?.[0]?.ErrorMessage ||
      responseData.APIError ||
      "Failed to generate AWB"
    )
  }

  // Build labels array
  const labels = []

  if (responseData.Pdfdownload) {
    labels.push({
      type: "awb_label",
      name: "AWB Label",
      filename: "awb_label.pdf",
      data: responseData.Pdfdownload,
    })
  }

  if (responseData.BoxLabel) {
    labels.push({
      type: "box_label",
      name: "Box Label",
      filename: "box_label.pdf",
      data: responseData.BoxLabel,
    })
  }

  if (responseData.Label) {
    labels.push({
      type: "shipping_label",
      name: "Shipping Label",
      filename: "shipping_label.pdf",
      data: responseData.Label,
    })
  }

  if (responseData.Performa) {
    labels.push({
      type: "performa",
      name: "Performa Invoice",
      filename: "performa_invoice.pdf",
      data: responseData.Performa,
    })
  }

  if (responseData.AuxLbl) {
    labels.push({
      type: "aux_label",
      name: "Auxiliary Label",
      filename: "auxiliary_label.pdf",
      data: responseData.AuxLbl,
    })
  }

  return {
    awbNumber: responseData.AWBNo,
    refNo: responseData.RefNo,
    labels: labels,
  }
}

// Send to ITD API
async function sendToITD(awb, vendor, serviceData) {
  const creds = vendor.itdCredentials
  const { token, customerId } = await getITDToken(creds, vendor._id)

  const totalShippingValue = Number.parseFloat(
    awb?.boxes.reduce((acc, box) => {
      return acc + box.items.reduce((itemAcc, item) => {
        const itemValue = Number.parseFloat(item.price) || 0
        const itemQuantity = Number.parseInt(item.quantity, 10) || 0
        return itemAcc + itemValue * itemQuantity
      }, 0)
    }, 0)
  ) || 0

  const totalActualWeight = awb.boxes
    ?.reduce((sum, box) => sum + Number.parseFloat(box.actualWeight || 0), 0)
    .toFixed(2) || "1.00"

  const destCountry = awb.receiver?.country?.trim()
  let destCountryCode
  if (destCountry && destCountry.toLowerCase() === "united states of america") {
    destCountryCode = "US"
  } else {
    destCountryCode = iso.getCode(destCountry)
  }

  const originCountry = awb.sender?.country?.trim() || "India"
  const originCountryCode = iso.getCode(originCountry) || "IN"

  if (!destCountryCode) {
    throw new Error(`Destination country "${destCountry}" not recognized.`)
  }

  const rawKycType = (awb.sender?.kyc?.type || "").toString().trim()
  const mappedDocumentType = ITD_KYC_TYPE_MAP[rawKycType] || null
  const documentNumber =
    (awb.sender?.kyc?.kyc && String(awb.sender.kyc.kyc).trim()) ||
    (awb.sender?.gst && String(awb.sender.gst).trim()) ||
    "000000000000"
  const documentType = mappedDocumentType || (awb.sender?.gst ? "GSTIN (Normal)" : "Aadhaar Number")

  const now = new Date()
  const bookingDate = now.toISOString().split("T")[0]
  const bookingTime = now.toTimeString().split(" ")[0]

  const invoiceNumber = awb.invoiceNumber || awb.invoice_number || `INV-${awb.trackingNumber}-${Date.now()}`

  const shipmentContent = awb.boxes
    ?.map((box) => box.items?.map((item) => item.name).join(", "))
    .join("; ") || "General Goods"

  const docketItems = awb.boxes?.map((box) => ({
    actual_weight: String(Number.parseFloat(box.actualWeight || 1).toFixed(2)),
    length: String(Number.parseFloat(box.length || 1).toFixed(2)),
    width: String(Number.parseFloat(box.breadth || box.width || 1).toFixed(2)),
    height: String(Number.parseFloat(box.height || 1).toFixed(2)),
    number_of_boxes: "1",
  })) || [{ actual_weight: "1.00", length: "10.00", width: "10.00", height: "10.00", number_of_boxes: "1" }]

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

  const needsFreeFormInvoice = freeFormLineItems.length > 0 ? "1" : "0"

  const payload = {
    tracking_no: awb.trackingNumber,
    reference_name: awb.sender?.name || "Reference",
    customer_id: parseInt(customerId, 10),
    origin_code: awb.sender?.zip || originCountryCode,
    product_code: serviceData.productCode || "NONDOX",
    destination_code: destCountryCode,
    booking_date: bookingDate,
    booking_time: bookingTime,
    pcs: String(awb.boxes?.length || 1),
    shipment_value: String(totalShippingValue.toFixed(2)),
    shipment_value_currency: "INR",
    actual_weight: totalActualWeight,
    shipment_invoice_no: invoiceNumber,
    shipment_invoice_date: bookingDate,
    shipment_content: shipmentContent.substring(0, 200),
    remark: awb.remarks || "",
    entry_type: 2,
    api_service_code: serviceData.apiServiceCode || serviceData.serviceName,
    api_vendor_code: serviceData.vendorCode || "",
    new_docket_free_form_invoice: needsFreeFormInvoice,
    free_form_currency: "INR",
    terms_of_trade: "FOB",
    free_form_note_master_code: "SAMPLE",
    shipper_name: (awb.sender?.name || "Shipper").substring(0, 50),
    shipper_company_name: (awb.sender?.company || awb.sender?.name || "Company").substring(0, 50),
    shipper_contact_no: cleanPhone(awb.sender?.contact),
    shipper_email: awb.sender?.email || "info@kargoone.com",
    shipper_address_line_1: (awb.sender?.address || "Address Line 1").substring(0, 100),
    shipper_address_line_2: (awb.sender?.address2 || "-").substring(0, 100),
    shipper_address_line_3: "",
    shipper_city: (awb.sender?.city || "Mumbai").substring(0, 50),
    shipper_state: (awb.sender?.state || "Maharashtra").substring(0, 50),
    shipper_country: originCountryCode,
    shipper_zip_code: awb.sender?.zip || "400001",
    shipper_gstin_type: documentType,
    shipper_gstin_no: documentNumber,
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
    docket_items: docketItems,
    free_form_line_items: needsFreeFormInvoice === "1" ? freeFormLineItems : [],
    kyc_details: kycDetails,
  }

  const createDocketUrl = `${creds.apiUrl}/create_docket`
  const response = await fetch(createDocketUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let apiResponse
  try {
    apiResponse = JSON.parse(responseText)
  } catch (parseError) {
    throw new Error(`Invalid response from ITD: ${responseText.substring(0, 200)}`)
  }

  if (!apiResponse.success) {
    const errorMessages = Array.isArray(apiResponse.errors) && apiResponse.errors.length > 0
      ? apiResponse.errors.join("; ")
      : apiResponse.message || apiResponse.error || "Failed to create docket"
    throw new Error(errorMessages)
  }

  const awbNumber = apiResponse.data?.awb_no?.toString() ||
    apiResponse.data?.docket_no?.toString() ||
    apiResponse.data?.entry_number?.toString()

  if (!awbNumber) {
    throw new Error("No AWB number received from ITD")
  }

  // Build labels array from ITD response
  const labels = []

  if (apiResponse.labels && Array.isArray(apiResponse.labels)) {
    apiResponse.labels.forEach((labelItem, index) => {
      if (labelItem.label) {
        let type = "label"
        let name = "Label"

        if (labelItem.filename) {
          const filename = labelItem.filename.toLowerCase()
          if (filename.includes("shipper") || filename.includes("awb")) {
            type = "awb_label"
            name = "AWB / Shipper Copy"
          } else if (filename.includes("box")) {
            type = "box_label"
            name = "Box Label"
          } else if (filename.includes("invoice")) {
            type = "invoice"
            name = "Invoice"
          } else if (filename.includes("consignee")) {
            type = "consignee_label"
            name = "Consignee Copy"
          } else {
            name = labelItem.filename.replace(/_/g, " ").replace(".pdf", "")
            name = name.charAt(0).toUpperCase() + name.slice(1)
          }
        }

        labels.push({
          type: type,
          name: name,
          filename: labelItem.filename || `label_${index + 1}.pdf`,
          data: labelItem.label,
        })
      }
    })
  }

  return {
    awbNumber: awbNumber,
    docketId: apiResponse.data?.docket_id,
    entryNumber: apiResponse.data?.entry_number,
    labels: labels,
  }
}

export async function POST(request) {
  try {
    await connectToDB()

    const { awbId, vendorId, serviceData, productCode } = await request.json()

    if (!awbId || !vendorId || !serviceData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AWB ID, Vendor ID, and Service data are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const awb = await Awb.findById(awbId)
    if (!awb) {
      return new Response(
        JSON.stringify({ success: false, error: "AWB not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    if (awb.cNoteNumber && awb.cNoteVendorName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AWB already integrated with another vendor",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const vendor = await VendorIntegration.findById(vendorId)
    if (!vendor) {
      return new Response(
        JSON.stringify({ success: false, error: "Vendor not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!vendor.isActive) {
      return new Response(
        JSON.stringify({ success: false, error: "Vendor is not active" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    let result

    if (vendor.softwareType === "xpression") {
      result = await sendToXpression(awb, vendor, {
        ...serviceData,
        productCode: productCode || serviceData.productCode || "SPX",
      })
    } else if (vendor.softwareType === "itd") {
      result = await sendToITD(awb, vendor, {
        ...serviceData,
        productCode: productCode || "NONDOX",
      })
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unknown software type: ${vendor.softwareType}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Update AWB with basic info only (no labels saved)
    awb.cNoteNumber = result.awbNumber
    awb.cNoteVendorName = vendor.vendorName
    awb.integratedVendorId = vendor._id
    awb.integratedService = serviceData.serviceName

    await awb.save()

    // Update vendor usage count
    await VendorIntegration.findByIdAndUpdate(vendorId, {
      $inc: { usageCount: 1 },
      lastUsedAt: new Date(),
    })

    // Return labels in response for viewing (not saved to DB)
    return new Response(
      JSON.stringify({
        success: true,
        message: `AWB successfully sent to ${vendor.vendorName}`,
        awbNumber: result.awbNumber,
        vendorName: vendor.vendorName,
        serviceName: serviceData.serviceName,
        softwareType: vendor.softwareType,
        labels: result.labels, // Full labels with base64 data for viewing
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in unified send-awb:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send AWB",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}