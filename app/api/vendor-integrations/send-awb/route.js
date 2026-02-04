// app/api/vendor-integrations/send-awb/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import Awb from "@/models/Awb"
import iso from "iso-3166-1-alpha-2"

// ----------------------------------------------------------------------
// HELPER: KYC Mappings
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// HELPER: ITD Token Management
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// INTEGRATION: Xpression
// ----------------------------------------------------------------------
async function sendToXpression(awb, vendor, serviceData, customSender) {
  const creds = vendor.xpressionCredentials
  const sender = customSender || awb.sender
  
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
    
    ShipperName: sender?.name,
    ShipperContact: sender?.name,
    ShipperAdd1: sender?.address,
    ShipperAdd2: sender?.address2 || "-",
    ShipperCity: sender?.city || "-",
    ShipperState: sender?.state || "-",
    ShipperPin: sender?.zip,
    ShipperTelno: sender?.contact ? cleanPhone(sender.contact) : cleanPhone(awb.sender?.contact),
    ShipperMobile: sender?.contact ? cleanPhone(sender.contact) : cleanPhone(awb.sender?.contact),
    ShipperEmail: sender?.email || awb.sender?.email || "info@kargoone.com",
    
    DocumentType: documentType,
    DocumentNumber: documentNumber,
    
    ConsigneeName: awb.receiver?.name,
    ConsigneeContact: awb.receiver?.name,
    ConsigneeAdd1: awb.receiver?.address,
    ConsigneeAdd2: awb.receiver?.address2 || "-",
    ConsigneeCity: awb.receiver?.city || "-",
    ConsigneeState: awb.receiver?.state || "-",
    ConsigneePin: awb.receiver?.zip,
    ConsigneeTelno: cleanPhone(awb.receiver?.contact),
    ConsigneeMobile: cleanPhone(awb.receiver?.contact),
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
  
  const labels = []
  if (responseData.Pdfdownload) labels.push({ type: "awb_label", name: "AWB Label", filename: "awb_label.pdf", data: responseData.Pdfdownload })
  if (responseData.BoxLabel) labels.push({ type: "box_label", name: "Box Label", filename: "box_label.pdf", data: responseData.BoxLabel })
  if (responseData.Label) labels.push({ type: "shipping_label", name: "Shipping Label", filename: "shipping_label.pdf", data: responseData.Label })
  if (responseData.Performa) labels.push({ type: "performa", name: "Performa Invoice", filename: "performa_invoice.pdf", data: responseData.Performa })
  if (responseData.AuxLbl) labels.push({ type: "aux_label", name: "Auxiliary Label", filename: "auxiliary_label.pdf", data: responseData.AuxLbl })
  
  return { awbNumber: responseData.AWBNo, refNo: responseData.RefNo, labels: labels }
}

// ----------------------------------------------------------------------
// INTEGRATION: ITD (Express Impex)
// ----------------------------------------------------------------------
async function sendToITD(awb, vendor, serviceData, customSender) {
  const creds = vendor.itdCredentials
  const { token, customerId } = await getITDToken(creds, vendor._id)
  const sender = customSender || awb.sender

  const totalShippingValue = Number.parseFloat(
    awb?.boxes.reduce((acc, box) => {
      return acc + box.items.reduce((itemAcc, item) => {
        return itemAcc + (Number.parseFloat(item.price) || 0) * (Number.parseInt(item.quantity, 10) || 0)
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
  
  const originCountry = sender?.country?.trim() || awb.sender?.country?.trim() || "India"
  const originCountryCode = iso.getCode(originCountry) || "IN"
  
  if (!destCountryCode) {
    throw new Error(`Destination country "${destCountry}" not recognized.`)
  }
  
  const rawKycType = (awb.sender?.kyc?.type || "").toString().trim()
  const documentNumber = (awb.sender?.kyc?.kyc && String(awb.sender.kyc.kyc).trim()) || "000000000000"
  const documentType = ITD_KYC_TYPE_MAP[rawKycType] || (awb.sender?.gst ? "GSTIN (Normal)" : "Aadhaar Number")
  
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
        hscode: String(item.hsnCode || "00000000").padStart(8, "0"),
        description: item.name || "Item",
        unit_of_measurement: "Pcs",
        unit_weight: String(unitWeight.toFixed(2)),
        igst_amount: "0.00",
      }
    }) || []
  ) || []
  
  const kycDetails = []
  if (documentNumber && documentNumber !== "000000000000") {
    kycDetails.push({ document_type: documentType, document_no: documentNumber, document_sub_type: "doc_1", document_name: "", file_path: "" })
  }
  
  const needsFreeFormInvoice = freeFormLineItems.length > 0 ? "1" : "0"
  
  const payload = {
    tracking_no: awb.trackingNumber,
    reference_name: sender?.name || "Reference",
    customer_id: parseInt(customerId, 10),
    origin_code: sender?.zip || awb.sender?.zip || originCountryCode,
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
    
    shipper_name: (sender?.name || "Shipper").substring(0, 50),
    shipper_company_name: (sender?.company || sender?.name || "Company").substring(0, 50),
    shipper_contact_no: sender?.contact ? cleanPhone(sender.contact) : cleanPhone(awb.sender?.contact),
    shipper_email: sender?.email || awb.sender?.email || "info@kargoone.com",
    shipper_address_line_1: (sender?.address || "Address Line 1").substring(0, 100),
    shipper_address_line_2: (sender?.address2 || "-").substring(0, 100),
    shipper_address_line_3: "",
    shipper_city: (sender?.city || "Mumbai").substring(0, 50),
    shipper_state: (sender?.state || "Maharashtra").substring(0, 50),
    shipper_country: originCountryCode,
    shipper_zip_code: sender?.zip || awb.sender?.zip || "400001",
    shipper_gstin_type: documentType,
    shipper_gstin_no: documentNumber,
    
    consignee_name: (awb.receiver?.name || "Consignee").substring(0, 50),
    consignee_company_name: (awb.receiver?.company || awb.receiver?.name).substring(0, 50),
    consignee_contact_no: cleanPhone(awb.receiver?.contact),
    consignee_email: awb.receiver?.email || "consignee@email.com",
    consignee_address_line_1: (awb.receiver?.address || "Addr").substring(0, 100),
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

  console.log("ITD Docket Payload:", payload)
  
  const createDocketUrl = `${creds.apiUrl}/create_docket`
  const response = await fetch(createDocketUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  
  const responseText = await response.text()

  console.log("ITD Docket Response:", responseText)
  let apiResponse
  try {
    apiResponse = JSON.parse(responseText)
  } catch (parseError) {
    throw new Error(`Invalid response from ITD: ${responseText.substring(0, 200)}`)
  }
  
  if (!apiResponse.success) {
    throw new Error(Array.isArray(apiResponse.errors) ? apiResponse.errors.join("; ") : apiResponse.message || "Failed to create docket")
  }
  
  const awbNumber = apiResponse.data?.awb_no || apiResponse.data?.docket_no || apiResponse.data?.entry_number
  const labels = []
  
  if (apiResponse.labels && Array.isArray(apiResponse.labels)) {
    apiResponse.labels.forEach((labelItem, index) => {
      if (labelItem.label) {
        let type = "label"
        let name = "Label"
        const filename = (labelItem.filename || "").toLowerCase()
        if (filename.includes("shipper") || filename.includes("awb")) { type = "awb_label"; name = "AWB / Shipper Copy" }
        else if (filename.includes("box")) { type = "box_label"; name = "Box Label" }
        else if (filename.includes("invoice")) { type = "invoice"; name = "Invoice" }
        labels.push({ type, name, filename: labelItem.filename || `label_${index}.pdf`, data: labelItem.label })
      }
    })
  }
  
  return { awbNumber: String(awbNumber), labels }
}

// ----------------------------------------------------------------------
// INTEGRATION: Tech440 (TransitPL)
// ----------------------------------------------------------------------
async function sendToTech440(awb, vendor, serviceData, customSender) {
  const creds = vendor.tech440Credentials
  const sender = customSender || awb.sender
  
  // 1. Sanitize API URL (Remove trailing slash if present)
  const baseUrl = creds.apiUrl.replace(/\/$/, "")
  const endpoint = `${baseUrl}/labels/create`
  const zipLookupEndpoint = `${baseUrl}/location/zipcode`

  const authHeader = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`
  const destCountry = iso.getCode(awb.receiver.country) || "US"

  // --- START: ZIPCODE LOOKUP LOGIC ---
  const rawZip = awb.receiver.zip || ""
  
  // 1. Remove spaces, 2. Take first 3 characters
  const searchZip = rawZip.replace(/\s+/g, '').substring(0, 3)

  let finalZipcodeId = rawZip // Default fallback to full zip if lookup fails or returns empty
  
  try {
    console.log(`[Tech440 Label] Looking up zipcode ID for search term: "${searchZip}" (Original: "${rawZip}")`)
    
    const lookupPayload = {
      api_key: creds.apiKey,
      country: destCountry,
      search: searchZip
    }

    // Using POST because we are sending a JSON body
    const lookupResponse = await fetch(zipLookupEndpoint, {
      method: "POST", 
      headers: { 
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "Accept": "application/json"
      },
      body: JSON.stringify(lookupPayload)
    })

    if (lookupResponse.ok) {
      const lookupData = await lookupResponse.json()
      
      // Check if data array exists and has items
      if (lookupData.status === "success" && Array.isArray(lookupData.data) && lookupData.data.length > 0) {
        // Use the zipcode_id from the first result
        finalZipcodeId = lookupData.data[0].zipcode_id
        console.log(`[Tech440 Label] Zipcode Lookup Success. Mapped "${searchZip}" to ID: ${finalZipcodeId}`)
      } else {
        console.log("[Tech440 Label] Zipcode Lookup: No data found for search term, using original zip.")
      }
    } else {
      console.warn(`[Tech440 Label] Zipcode Lookup API returned status: ${lookupResponse.status}`)
    }
  } catch (zipError) {
    console.error("[Tech440 Label] Zipcode Lookup Failed (falling back to original zip):", zipError)
  }
  // --- END: ZIPCODE LOOKUP LOGIC ---

  const totalWeight = awb.boxes?.reduce((sum, box) => sum + Number(box.actualWeight || 0), 0) || 1
  
  // Dimensions
  const dimensions = awb.boxes?.map(box => ({
      units: "cm",
      length: String(Number(box.length) || 1),
      width: String(Number(box.breadth) || 1),
      height: String(Number(box.height) || 1),
      weightb: String(Number(box.actualWeight) || 1)
  })) || []

  // Invoice Items
  const customInvoice = []
  awb.boxes?.forEach((box, boxIdx) => {
    box.items?.forEach(item => {
      customInvoice.push({
        box_no: String(boxIdx + 1),
        nondg: "0",
        product_name: item.name,
        quantity: String(item.quantity),
        price: String(item.price), 
        hsn_code: item.hsnCode || "000000",
        units: "INR", 
        p_weight: "0.000"
      })
    })
  })

  // Date
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const yyyy = today.getFullYear()
  const shipDate = `${dd}-${mm}-${yyyy}`

  const payload = {
    api_key: creds.apiKey,
    label_request: {
      awb_no: awb.trackingNumber, 
      ship_date: shipDate,
      package_code: serviceData.packageCode || "NDX",
      to_country: destCountry,
      zipcode_id: finalZipcodeId, // Used the resolved ID
      service_code: serviceData.serviceCode, 
      branch_name: serviceData.branchName || "DELHI",
      invoice_date: shipDate,
      invoice_currency: "INR",
      invoice_no: awb.invoiceNumber || awb.trackingNumber,
      advanced_options: {
         custom_field1: awb.trackingNumber,
         custom_field2: ""
      },
      ship_to: {
        company: awb.receiver.company || awb.receiver.name,
        name: awb.receiver.name,
        phone: awb.receiver.contact,
        street1: (awb.receiver.address || ".").substring(0, 40),
        street2: "",
        street3: "",
        city: awb.receiver.city || "City",
        state: awb.receiver.state || "",
        postal_code: awb.receiver.zip,
        country: awb.receiver.country
      },
      ship_from: {
        company: sender.company || sender.name,
        name: sender.name,
        phone: sender.contact,
        street1: (sender.address || ".").substring(0, 40),
        street2: (sender.address2 || ""),
        street3: "",
        city: sender.city || "Mumbai",
        state: sender.state || "MH",
        postal_code: sender.zip,
        country: sender.country,
        document_type: sender.kyc?.type || "aadhar no",
        document_no: sender.kyc?.number || "000000000000",
      },
      weight: {
        value: String(totalWeight),
        units: "KG"
      },
      dimensions: dimensions,
      custom_invoice: customInvoice
    }
  }

  console.log("Tech440 Label Payload:", JSON.stringify(payload))

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": authHeader },
    body: JSON.stringify(payload)
  })

  const responseText = await response.text()
  let result
  try {
    result = JSON.parse(responseText)
  } catch (e) {
    throw new Error(`Invalid JSON from Tech440: ${responseText}`)
  }

  console.log("Tech440 Label Response:", result)

  if (!response.ok || result.status !== "success") {
    throw new Error(result.message || "Failed to create label with Tech440")
  }

  const data = result.data || {}
  const labels = []
  if (data.label) labels.push({ type: "shipping_label", name: "Shipping Label", filename: "label.pdf", data: data.label })
  if (data.awb) labels.push({ type: "awb_label", name: "AWB Copy", filename: "awb.pdf", data: data.awb })
  if (data.invoice) labels.push({ type: "invoice", name: "Invoice", filename: "invoice.pdf", data: data.invoice })

  return {
    awbNumber: String(data.awb_no || awb.trackingNumber),
    labels: labels
  }
}

// ----------------------------------------------------------------------
// MAIN POST HANDLER
// ----------------------------------------------------------------------
export async function POST(request) {
  try {
    await connectToDB()
    
    // !!! HERE WAS THE FIX: Destructure customSenderDetails !!!
    const { awbId, vendorId, serviceData, productCode, customSenderDetails } = await request.json()
    
    if (!awbId || !vendorId || !serviceData) {
      return new Response(JSON.stringify({ success: false, error: "Required fields missing" }), { status: 400 })
    }
    
    const awb = await Awb.findById(awbId)
    if (!awb) return new Response(JSON.stringify({ success: false, error: "AWB not found" }), { status: 404 })
    
    if (awb.cNoteNumber && awb.cNoteVendorName) {
      return new Response(JSON.stringify({ success: false, error: "AWB already integrated" }), { status: 400 })
    }
    
    const vendor = await VendorIntegration.findById(vendorId)
    if (!vendor || !vendor.isActive) {
      return new Response(JSON.stringify({ success: false, error: "Vendor not found/inactive" }), { status: 404 })
    }
    
    let result
    
    // Pass customSenderDetails to all functions
    if (vendor.softwareType === "xpression") {
      result = await sendToXpression(awb, vendor, {
        ...serviceData,
        productCode: productCode || serviceData.productCode || "SPX",
      }, customSenderDetails)
    } 
    else if (vendor.softwareType === "itd") {
      result = await sendToITD(awb, vendor, {
        ...serviceData,
        productCode: vendor.vendorCode === "BOMBINO" ? "SPX" : productCode || serviceData.productCode || "NONDOX",
      }, customSenderDetails)
    } 
    else if (vendor.softwareType === "tech440") {
      // Tech440 Logic
      const selectedService = vendor.tech440Credentials.services.find(s => s.serviceName === serviceData.serviceName)
      
      result = await sendToTech440(awb, vendor, {
        serviceCode: serviceData.serviceCode, // Comes from frontend selection
        branchName: serviceData.branchName,   // Comes from frontend selection
        packageCode: serviceData.packageCode || productCode || "NDX"
      }, customSenderDetails)
    } 
    else {
      return new Response(JSON.stringify({ success: false, error: `Unknown software type: ${vendor.softwareType}` }), { status: 400 })
    }
    
    // Update AWB
    awb.cNoteNumber = result.awbNumber
    awb.cNoteVendorName = vendor.vendorName
    awb.integratedVendorId = vendor._id
    awb.integratedService = serviceData.serviceName || serviceData.serviceCode
    
    await awb.save()
    
    await VendorIntegration.findByIdAndUpdate(vendorId, {
      $inc: { usageCount: 1 },
      lastUsedAt: new Date(),
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `AWB sent to ${vendor.vendorName}`,
        awbNumber: result.awbNumber,
        vendorName: vendor.vendorName,
        serviceName: serviceData.serviceName || serviceData.serviceCode,
        softwareType: vendor.softwareType,
        labels: result.labels,
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