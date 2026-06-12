"use client"

import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Loader2, Printer, FileText, Package, FileCheck, Upload, ExternalLink, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format } from "date-fns"
import JsBarcode from "jsbarcode"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

function EnhancedShippingPage(
  { trackingNumberOverride, hidden = false, onReady, printOptions, onCombinedPrint, onPrintOptionsChange } = {},
  ref,
) {
  const params = useParams()
  const trackingNumber = trackingNumberOverride || params.trackingNumber
  const [awbData, setAwbData] = useState(null)
  const [formattedKycType, setFormattedKycType] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const invoiceRef = useRef(null)
  const labelRef = useRef(null)
  const [invoiceCopies, setInvoiceCopies] = useState(2)
  const [totalBoxes, setTotalBoxes] = useState(1)
  const [authorizationType, setAuthorizationType] = useState("")
  const [authorizationCopies, setAuthorizationCopies] = useState(1)
  const [kycDocumentUrl, setKycDocumentUrl] = useState(null)
  const [kycLoading, setKycLoading] = useState(false)

  // Sender option states
  const [invoiceSenderOption, setInvoiceSenderOption] = useState("original")
  const [showCustomSenderDialog, setShowCustomSenderDialog] = useState(false)
  const [customSenderDetails, setCustomSenderDetails] = useState({
    name: "",
    companyName: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    contact: "",
    email: "",
    kycType: "",
    kycNumber: "",
  })

  // Document selection and label options
  const [selectedDocuments, setSelectedDocuments] = useState({
    invoice: true,
    labels: true,
    authorization: false,
    nonHazardous: false,
  })

  // Printer type selection
  const [printerType, setPrinterType] = useState("label")
  const [labelSenderOption, setLabelSenderOption] = useState("without")

  // Logo URL - Update this path to your actual logo
  const logoUrl = "/logo.jpg"

  useEffect(() => {
    const fetchAWBData = async () => {
      console.log(`AWB fetching data ${trackingNumber}`)
      setLoading(true)
      try {
        const response = await axios.get(`/api/awb/${trackingNumber}`)
        setAwbData(response.data[0])
        setTotalBoxes(response.data[0]?.boxes?.length || 1)

        const kycTypeMap = {
          "Aadhaar No - ": "Aadhaar Card",
          "Pan No - ": "Pan Card",
          "Passport No - ": "Passport",
          "Driving License No - ": "Driving License",
          "Voter ID Card No - ": "Voter ID Card",
          "GST No - ": "GST Certificate",
        }

        setFormattedKycType(
          kycTypeMap[response.data[0]?.sender?.kyc?.type] || response.data[0]?.sender?.kyc?.type || "",
        )

        if (response.data[0]?.sender) {
          setCustomSenderDetails({
            name: response.data[0].sender.name || "",
            companyName: response.data[0].sender.companyName || "",
            address: response.data[0].sender.address || "",
            city: response.data[0].sender.city || "",
            zip: response.data[0].sender.zip || "",
            country: response.data[0].sender.country || "",
            contact: response.data[0].sender.contact || "",
            email: response.data[0].sender.email || "",
            kycType: response.data[0].sender.kyc?.type || "",
            kycNumber: response.data[0].sender.kyc?.kyc || "",
          })
        }

        if (response.data[0]?.sender?.kyc?.document) {
          processKycDocumentUrl(response.data[0].sender.kyc.document)
        }

        setLoading(false)
      } catch (err) {
        setError("Failed to fetch AWB data")
        setLoading(false)
      }
    }

    if (trackingNumber) {
      fetchAWBData()
    }
  }, [trackingNumber])

  const processKycDocumentUrl = (documentUrl) => {
    setKycLoading(true)
    try {
      console.log("Original KYC document URL:", documentUrl)
      setKycDocumentUrl(documentUrl)
    } catch (error) {
      console.error("Error processing KYC document URL:", error)
    } finally {
      setKycLoading(false)
    }
  }

  const openKycDocument = () => {
    if (kycDocumentUrl) {
      window.open(kycDocumentUrl, "_blank")
    }
  }

  const numberToWords = (num) => {
    const units = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    if (num === 0) return "Zero"

    const convertLessThanOneThousand = (num) => {
      if (num === 0) return ""
      if (num < 20) return units[num]

      const digit = num % 10
      if (num < 100) return tens[Math.floor(num / 10)] + (digit ? " " + units[digit] : "")

      return units[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convertLessThanOneThousand(num % 100) : "")
    }

    let words = ""
    let chunk = 0

    chunk = Math.floor(num / 10000000)
    if (chunk > 0) {
      words += convertLessThanOneThousand(chunk) + " Crore "
      num %= 10000000
    }

    chunk = Math.floor(num / 100000)
    if (chunk > 0) {
      words += convertLessThanOneThousand(chunk) + " Lakh "
      num %= 100000
    }

    chunk = Math.floor(num / 1000)
    if (chunk > 0) {
      words += convertLessThanOneThousand(chunk) + " Thousand "
      num %= 1000
    }

    if (num > 0) {
      words += convertLessThanOneThousand(num)
    }

    return words.trim()
  }

  const calculateTotal = () => {
    if (!awbData || !awbData.boxes) return 0

    let total = 0
    awbData.boxes.forEach((box) => {
      if (box.items) {
        box.items.forEach((item) => {
          total += Number(item.price || 0) * Number(item.quantity || 0)
        })
      }
    })

    return total
  }

  const calculateBoxTotal = (box) => {
    if (!box || !box.items) return 0
    let total = 0
    box.items.forEach((item) => {
      total += Number(item.price || 0) * Number(item.quantity || 0)
    })
    return total
  }

  const getSenderDetails = () => {
    if (invoiceSenderOption === "custom") {
      return {
        name: customSenderDetails.name,
        companyName: customSenderDetails.companyName,
        address: customSenderDetails.address,
        city: customSenderDetails.city,
        zip: customSenderDetails.zip,
        country: customSenderDetails.country,
        contact: customSenderDetails.contact,
        email: customSenderDetails.email,
        kyc: {
          type: customSenderDetails.kycType,
          kyc: customSenderDetails.kycNumber,
        },
      }
    }
    return awbData?.sender
  }

  const getLabelSenderDetails = () => {
    const effectiveLabelSenderOption = printOptions?.labelSenderOption || labelSenderOption
    if (effectiveLabelSenderOption === "with") {
      return getSenderDetails()
    }
    return null
  }

  const getLabelCount = () => Math.max(totalBoxes || 1, awbData?.boxes?.length || 1)

  const safeText = (value, fallback = "N/A") => {
    if (value === undefined || value === null) return fallback
    const trimmed = String(value).trim()
    return trimmed || fallback
  }

  const escapeHtml = (value, fallback = "N/A") =>
    safeText(value, fallback)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")

  const getAddressLines = (party) => {
    if (!party) return []

    return [party.address, party.address2, party.city, party.state, party.country, party.zip]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
  }

  const getLabelSenderLine = (sender) => {
    if (!sender) return ""

    const name = String(sender.name || sender.companyName || "").trim()
    const city = String(sender.city || "").trim()
    const zip = String(sender.zip || "").trim()
    const location = [city, zip].filter(Boolean).join(" ")

    return [name, location].filter(Boolean).join(" - ")
  }

  const formatPartyBlock = (party) => {
    if (!party) return "N/A"

    return [
      party.companyName,
      party.name,
      ...getAddressLines(party),
      party.contact ? `Tel: ${party.contact}` : "",
      party.email ? `Email: ${party.email}` : "",
      party.kyc?.kyc ? `${party.kyc?.type || "KYC"} ${party.kyc.kyc}` : "",
      party.gst ? `GSTIN: ${party.gst}` : "",
    ]
      .filter(Boolean)
      .map((line) => escapeHtml(line, ""))
      .join("<br />")
  }

  const getReceiverCountry = () => safeText(awbData?.receiver?.country).toUpperCase()

  const getReceiverZip = () => safeText(awbData?.receiver?.zip)

  const handleInvoiceSenderOptionChange = (value) => {
    setInvoiceSenderOption(value)
    if (value === "custom") {
      setShowCustomSenderDialog(true)
    }
  }

  const handleCustomSenderChange = (field, value) => {
    setCustomSenderDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetCustomSenderDetails = () => {
    if (awbData?.sender) {
      setCustomSenderDetails({
        name: awbData.sender.name || "",
        companyName: awbData.sender.companyName || "",
        address: awbData.sender.address || "",
        city: awbData.sender.city || "",
        zip: awbData.sender.zip || "",
        country: awbData.sender.country || "",
        contact: awbData.sender.contact || "",
        email: awbData.sender.email || "",
        kycType: awbData.sender.kyc?.type || "",
        kycNumber: awbData.sender.kyc?.kyc || "",
      })
    }
  }

  const formatWeight = (weightInKg) => {
    const weight = Number(weightInKg) || 0
    if (weight < 1) {
      return `${Math.round(weight * 1000)} G`
    }
    return `${weight.toFixed(2)} KG`
  }

  const getTotalWeight = () => {
    if (!awbData?.boxes) return 0
    return awbData.boxes.reduce((sum, box) => sum + (Number(box.actualWeight) || 0), 0)
  }

  const getParcelTypeDisplay = () => {
    const parcelType = awbData?.parcelType?.toLowerCase() || ''
    if (parcelType === 'ecommerce') return 'E-Commerce'
    if (parcelType === 'domestic') return 'Domestic'
    if (parcelType === 'international') return 'International'
    return awbData?.parcelType || 'Standard'
  }

  const isEcommerce = () => {
    return awbData?.parcelType?.toLowerCase() === 'ecommerce'
  }

  const generateInvoiceHTML = () => {
    const totalAmount = calculateTotal()
    const amountInWords =
      numberToWords(Math.round(totalAmount)) + " " + (awbData.shippingCurrency === "₹" ? "Rupees" : "Dollars") + " Only"

    const sender = getSenderDetails()

    return `
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold">SHIPPING INVOICE</h1>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6 text-[12px]">
            <div>
                <p><strong>Date:</strong> ${awbData.date ? format(new Date(awbData.date), "dd/MM/yyyy") : "N/A"}</p>
                <p><strong>Pre Carriage By:</strong> ${awbData.via || "N/A"}</p>
                <p><strong>Vessel/Flight No:</strong> ${awbData.forwardingNumber || "N/A"}</p>
                <p><strong>Port of Discharge:</strong> ${sender?.country || "N/A"}</p>
                <p><strong>Country of Origin of Goods:</strong> ${sender?.country || "INDIA"}</p>
            </div>
            <div>
                <p><strong>EXP. REF-</strong> ${awbData.trackingNumber}</p>
                <p><strong>Place of Receipt by Pre-carrier:</strong></p>
                <p><strong>Port of Loading:</strong> ${sender?.country || "N/A"}</p>
                <p><strong>Final Destination:</strong> ${awbData.receiver?.country || "N/A"}</p>
                <p><strong>Country of Final Destination:</strong> ${awbData.receiver?.country || "N/A"}</p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-6 text-[12px]">
            <div class="border border-gray-300 p-1 rounded-lg">
                <h2 class="font-bold mb-2">Sender:</h2>
                <p class="font-bold uppercase">${sender?.name || ""}</p>
                ${sender?.companyName ? `<p class="font-bold uppercase">C/O ${sender?.companyName}</p>` : ""}
                <p>${sender?.address || ""} ${sender?.address2 || ""}</p>
                <p class="flex flex-row gap-2">
                    <strong>Zip Code:</strong> ${sender?.zip || ""}
                    <strong>Country:</strong>${sender?.country || ""}
                </p>
                <p><strong>Cont No:</strong> ${sender?.contact || ""}</p>
                <p><strong>Email:</strong> ${sender?.email || ""}</p>
                <p><strong>${sender?.kyc?.type || ""}</strong> ${sender?.kyc?.kyc || ""}</p>
            </div>
            <div class="border border-gray-300 rounded-lg p-1">
                <h2 class="font-bold mb-2">Receiver:</h2>
                <p class="font-bold uppercase">${awbData.receiver?.name}</p>
                ${awbData.receiver?.companyName ? `<p class="font-bold uppercase">C/O ${awbData.receiver?.companyName}</p>` : ""}
                <p>
                ${awbData.receiver?.address || ""}, ${awbData.receiver?.address2 || ""}
                ${awbData.receiver?.city && awbData.receiver.city.length > 1 ? `, ${awbData.receiver.city}` : ""}
                ${awbData.receiver?.state && awbData.receiver.state.length > 1 ? `, ${awbData.receiver.state}` : ""}
                </p>
                <p class="flex flex-row gap-2">
                    <strong>Zip Code:</strong> ${awbData.receiver?.zip || ""}
                    <strong>Country:</strong>${awbData.receiver?.country || ""}
                </p>
                <p><strong>Cont No:</strong> ${awbData.receiver?.contact || ""}</p>
                <p><strong>Email:</strong> ${awbData.receiver?.email || ""}</p>
            </div>
        </div>

        <div class="">
          <table class="w-full border-collapse mb-2 text-[12px]">
              <thead>
                  <tr class="bg-gray-100">
                      <th class="border border-gray-300 px-2 text-left w-[10px] whitespace-nowrap">Sr No.</th>
                      <th class="border border-gray-300 px-2 text-left">Description of Goods</th>
                      <th class="border border-gray-300 px-2 text-left w-[80px]">HSN Code</th>
                      <th class="border border-gray-300 px-2 text-left w-[20px]">Quantity</th>
                      <th class="border border-gray-300 px-2 text-left w-[40px]">Rate</th>
                      <th class="border border-gray-300 px-2 text-left w-[40px]">Value</th>
                  </tr>
              </thead>
              <tbody style="vertical-align: top;">
                  ${awbData.boxes
        ?.flatMap((box, boxIndex) => [
          `<tr class="bg-gray-200">
                          <td colspan="6" class="border border-gray-300 py-0 font-bold text-center text-[10px]">
                              | Box No ${boxIndex + 1} | Weight: ${box.actualWeight || "N/A"} kg | Dimensions: ${box.length || 0} x ${box.breadth || 0} x ${box.height || 0} cm |
                          </td>
                      </tr>`,
          ...(box.items || []).map(
            (item, itemIndex) => `
                          <tr>
                              <td class="border border-gray-300 px-2 w-[10px]">${itemIndex + 1}</td>
                              <td class="border border-gray-300 px-2">${item.name || "N/A"}</td>
                              <td class="border border-gray-300 px-2 w-[80px] text-center">${item.hsnCode || "N/A"}</td>
                              <td class="border border-gray-300 px-2 w-[20px]">${item.quantity || 0}</td>
                              <td class="border border-gray-300 px-2 w-[40px] whitespace-nowrap">
                                  ${awbData.shippingCurrency || "₹"}${(Number(item.price) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td class="border border-gray-300 px-2 w-[40px] whitespace-nowrap">
                                  ${awbData.shippingCurrency || "₹"}${(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                          </tr>
                      `,
          ),
        ])
        .join("")}
                  <tr class="font-bold text-[12px]">
                      <td colspan="5" class="border border-gray-300 p-0 text-[10px] whitespace-nowrap text-right pr-2">
                          Total Amount:
                      </td>
                      <td class="border border-gray-300 px-2 whitespace-nowrap">
                          ${awbData.shippingCurrency || "₹"}${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                  </tr>
                  <tr class="font-bold text-[12px]">
                      <td class="border border-gray-300 p-0 text-[10px] whitespace-nowrap text-center">In Words:</td>
                      <td colspan="5" class="border border-gray-300 px-2">${amountInWords}</td>
                  </tr>
              </tbody>
          </table>
        </div>

        <div class="declaration-section mt-2 pt-1 text-justify italic text-[12px] border-t border-gray-400">
            <p class="font-bold">Declaration:</p>
            <p>We certify that the information given above is true and correct to the best of our knowledge</p>
        </div>

        <div class="signature-section mt-2 mr-4 text-right text-[12px]">
            <p class="mr-12">Signature & Date</p>
            <div class="h-10"></div>
            <div class="border-t border-gray-400 w-48 ml-auto"></div>
        </div>
    `
  }

  const generateShippingLabelHTML = (boxIndex = 0, isLastLabel = false) => {
    const box = awbData.boxes?.[boxIndex] || awbData.boxes?.[0] || {}
    const totalWeight = getTotalWeight()
    const boxWeight = box?.actualWeight || totalWeight / (awbData.boxes?.length || 1)
    const weightDisplay = formatWeight(boxWeight)
    const formattedDate = awbData.date ? format(new Date(awbData.date), "dd-MMM-yyyy").toUpperCase() : "N/A"

    const shipmentType = getParcelTypeDisplay()

    let boxTotal = 0
    let itemRows = ""
    let srNo = 1

    const itemsToProcess = box?.items || []

    itemsToProcess.forEach((item) => {
      const amount = Number(item.price || 0) * Number(item.quantity || 0)
      boxTotal += amount

      const productDesc = (item.name || "N/A").length > 22
        ? (item.name || "N/A").substring(0, 22) + "..."
        : (item.name || "N/A")

      itemRows += `
        <tr>
          <td class="sr-no">${srNo++}</td>
          <td class="product-desc">${productDesc.toUpperCase()}</td>
          <td class="hsn-code">${item.hsnCode || "N/A"}</td>
          <td class="qty">${item.quantity || 0}</td>
          <td class="rate">${Number(item.price || 0).toFixed(2)}</td>
          <td class="amount">${amount.toFixed(2)}</td>
        </tr>
      `
    })

    if (itemsToProcess.length === 0) {
      boxTotal = awbData.parcelValue || 0
      itemRows = `
        <tr>
          <td class="sr-no">1</td>
          <td class="product-desc">GOODS AS PER INVOICE</td>
          <td class="hsn-code">N/A</td>
          <td class="qty">1</td>
          <td class="rate">${boxTotal.toFixed(2)}</td>
          <td class="amount">${boxTotal.toFixed(2)}</td>
        </tr>
      `
    }

    const amountInWords = numberToWords(Math.round(boxTotal))
    const currencyCode = awbData.shippingCurrency === "₹" ? "INR" : (awbData.shippingCurrency === "$" ? "USD" : awbData.shippingCurrency || "INR")
    const currencyWord = awbData.shippingCurrency === "₹" ? "Rupees" : (awbData.shippingCurrency === "$" ? "Dollars" : "")

    const awbNumber = awbData.awbNumber || awbData.cNoteNumber || awbData.forwardingNumber || awbData.trackingNumber || "N/A"
    const sender = getLabelSenderDetails()
    const receiverLines = getAddressLines(awbData.receiver)
    const receiverCountry = getReceiverCountry()
    const receiverZip = getReceiverZip()
    const receiverPhone = safeText(awbData.receiver?.contact)
    const labelCount = getLabelCount()

    const productSectionHTML = isEcommerce() ? `
      <div class="section product-section">
        <div class="section-header">PRODUCT DETAILS</div>
        <table class="product-table">
          <thead>
            <tr>
              <th class="col-sr">Sr.</th>
              <th class="col-desc">Product Desc</th>
              <th class="col-hsn">HSN</th>
              <th class="col-qty">Qty</th>
              <th class="col-rate">Rate</th>
              <th class="col-amt">Amt.</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr class="total-row">
              <td colspan="5" class="total-label">Total:</td>
              <td class="total-amount">${awbData.shippingCurrency || "₹"}${boxTotal.toFixed(2)}</td>
            </tr>
            <tr class="words-row">
              <td colspan="6" class="amount-words">${currencyCode}: ${amountInWords} ${currencyWord} Only</td>
            </tr>
          </tbody>
        </table>
      </div>
    ` : ''

    return `
      <div class="shipping-label${isLastLabel ? ' last-label' : ''}">
        <div class="label-header">
          <div class="header-brand">
          </div>
          <div class="header-destination">
            <div class="header-destination-label">Receiver Country</div>
            <div class="header-destination-main">${receiverCountry}</div>
            <div class="header-destination-zip">${receiverZip}</div>
          </div>
        </div>

        <div class="meta-pills">
          <span class="meta-pill">BOX ${boxIndex + 1} OF ${labelCount}</span>
          <span class="meta-pill">${safeText(shipmentType).toUpperCase()}</span>
        </div>

        <div class="awb-focus-card">
          <div class="awb-focus-label">Air Way Bill No.</div>
          <div class="awb-focus-value">${safeText(awbNumber)}</div>
        </div>
        
        <div class="section ship-to">
          <div class="section-header">RECEIVER</div>
          <div class="section-content">
            <div class="receiver-name">${safeText(awbData.receiver?.name)}</div>
            ${awbData.receiver?.companyName ? `<div class="receiver-company">${safeText(awbData.receiver.companyName)}</div>` : ""}
            <div class="receiver-address">
              ${receiverLines.map((line) => `<div class="address-line">${safeText(line, "")}</div>`).join("")}
            </div>
            <div class="receiver-phone-block">
              <div class="receiver-phone-label">Receiver Mobile</div>
              <div class="receiver-phone-value">${receiverPhone}</div>
            </div>
          </div>
        </div>

        <div class="section tracking-section">
          <div class="section-header">SHIPMENT DETAILS</div>
          <div class="section-content section-content-inline">
            <div class="tracking-row">
              <span class="tracking-label">Service</span>
              <span class="tracking-value"></span>
            </div>
            <div class="tracking-row">
              <span class="tracking-label">Mode</span>
              <span class="tracking-value">${safeText(getParcelTypeDisplay())}</span>
            </div>
          </div>
        </div>

        ${sender
        ? `
        <div class="section ship-from">
          <div class="section-header">SENDER</div>
          <div class="section-content section-content-compact sender-line-wrap">
            <div class="sender-line">${escapeHtml(getLabelSenderLine(sender), "")}</div>
          </div>
        </div>
        `
        : ""
      }

        <div class="barcode-section">
          <svg class="header-barcode-svg" data-value="${awbData.trackingNumber || awbNumber}"></svg>
          <div class="tracking-number-text">${safeText(awbData.trackingNumber || awbNumber)}</div>
        </div>
        
        ${productSectionHTML}

        <div class="label-footer">
          <div class="box-info">AIR WAY BILL</div>
          <div class="parcel-type"></div>
        </div>
      </div>
    `
  }

  const generateA4LabelHTML = (boxIndex = 0) => {
    const box = awbData.boxes?.[boxIndex] || awbData.boxes?.[0] || {}
    const totalWeight = getTotalWeight()
    const boxWeight = box?.actualWeight || totalWeight / (awbData.boxes?.length || 1)
    const weightDisplay = formatWeight(boxWeight)
    const formattedDate = awbData.date ? format(new Date(awbData.date), "dd-MMM-yyyy").toUpperCase() : "N/A"

    const shipmentType = getParcelTypeDisplay()

    let boxTotal = 0
    let itemRows = ""
    let srNo = 1

    const itemsToProcess = box?.items || []
    const maxItems = 3
    const displayItems = itemsToProcess.slice(0, maxItems)

    displayItems.forEach((item) => {
      const amount = Number(item.price || 0) * Number(item.quantity || 0)
      boxTotal += amount

      const productDesc = (item.name || "N/A").length > 18
        ? (item.name || "N/A").substring(0, 18) + "..."
        : (item.name || "N/A")

      itemRows += `
        <tr>
          <td class="sr-no">${srNo++}</td>
          <td class="product-desc">${productDesc.toUpperCase()}</td>
          <td class="hsn-code">${item.hsnCode || "N/A"}</td>
          <td class="qty">${item.quantity || 0}</td>
          <td class="rate">${Number(item.price || 0).toFixed(2)}</td>
          <td class="amount">${amount.toFixed(2)}</td>
        </tr>
      `
    })

    if (itemsToProcess.length > maxItems) {
      let remainingTotal = 0
      for (let i = maxItems; i < itemsToProcess.length; i++) {
        remainingTotal += Number(itemsToProcess[i].price || 0) * Number(itemsToProcess[i].quantity || 0)
      }
      boxTotal += remainingTotal
      itemRows += `
        <tr>
          <td class="sr-no">...</td>
          <td class="product-desc">+${itemsToProcess.length - maxItems} MORE ITEMS</td>
          <td class="hsn-code">-</td>
          <td class="qty">-</td>
          <td class="rate">-</td>
          <td class="amount">${remainingTotal.toFixed(2)}</td>
        </tr>
      `
    }

    if (itemsToProcess.length === 0) {
      boxTotal = awbData.parcelValue || 0
      itemRows = `
        <tr>
          <td class="sr-no">1</td>
          <td class="product-desc">GOODS AS PER INVOICE</td>
          <td class="hsn-code">N/A</td>
          <td class="qty">1</td>
          <td class="rate">${boxTotal.toFixed(2)}</td>
          <td class="amount">${boxTotal.toFixed(2)}</td>
        </tr>
      `
    }

    const amountInWords = numberToWords(Math.round(boxTotal))
    const currencyCode = awbData.shippingCurrency === "₹" ? "INR" : (awbData.shippingCurrency === "$" ? "USD" : awbData.shippingCurrency || "INR")
    const currencyWord = awbData.shippingCurrency === "₹" ? "Rupees" : (awbData.shippingCurrency === "$" ? "Dollars" : "")

    const awbNumber = awbData.awbNumber || awbData.cNoteNumber || awbData.forwardingNumber || awbData.trackingNumber || "N/A"
    const sender = getLabelSenderDetails()
    const receiverLines = getAddressLines(awbData.receiver)
    const receiverCountry = getReceiverCountry()
    const receiverZip = getReceiverZip()
    const receiverPhone = safeText(awbData.receiver?.contact)
    const labelCount = getLabelCount()

    const productSectionHTML = isEcommerce() ? `
      <div class="a4-product-section">
        <div class="a4-section-header">PRODUCTS</div>
        <table class="a4-product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amt</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr class="a4-total-row">
              <td colspan="5"><strong>Total:</strong></td>
              <td><strong>${awbData.shippingCurrency || "₹"}${boxTotal.toFixed(2)}</strong></td>
            </tr>
            <tr class="a4-words-row">
              <td colspan="6" class="a4-amount-words">${currencyCode}: ${amountInWords} ${currencyWord} Only</td>
            </tr>
          </tbody>
        </table>
      </div>
    ` : ''

    return `
      <div class="a4-label">
        <div class="a4-header">
          <div class="a4-header-destination">
            <div class="a4-header-destination-label">Receiver Country</div>
            <div class="a4-header-destination-main">${receiverCountry}</div>
            <div class="a4-header-destination-zip">${receiverZip}</div>
          </div>
        </div>

        <div class="a4-meta-pills">
          <span class="a4-meta-pill">BOX ${boxIndex + 1}/${labelCount}</span>
          <span class="a4-meta-pill">${safeText(shipmentType).toUpperCase()}</span>
        </div>

        <div class="a4-awb-focus-card">
          <div class="a4-awb-focus-label">Air Way Bill No.</div>
          <div class="a4-awb-focus-value">${safeText(awbNumber)}</div>
        </div>
        
        <div class="a4-section a4-to">
          <div class="a4-section-header">RECEIVER</div>
          <div class="a4-section-content">
            <div class="a4-name">${safeText(awbData.receiver?.name)}</div>
            ${awbData.receiver?.companyName ? `<div class="a4-receiver-company">${safeText(awbData.receiver.companyName)}</div>` : ""}
            ${receiverLines.map((line) => `<div class="a4-address">${safeText(line, "")}</div>`).join("")}
            <div class="a4-phone-block">
              <div class="a4-phone-label">Receiver Mobile</div>
              <div class="a4-phone-value">${receiverPhone}</div>
            </div>
          </div>
        </div>

        <div class="a4-section a4-awb">
          <div class="a4-section-header">SHIPMENT DETAILS</div>
          <div class="a4-section-content a4-section-content-inline">
            <div class="a4-inline-row">
              <span class="a4-inline-label">Service</span>
              <span class="a4-inline-value"></span>
            </div>
            <div class="a4-inline-row">
              <span class="a4-inline-label">Mode</span>
              <span class="a4-inline-value">${safeText(getParcelTypeDisplay())}</span>
            </div>
          </div>
        </div>

        <div class="a4-barcode-section">
          <svg class="a4-header-barcode" data-value="${awbData.trackingNumber || awbNumber}"></svg>
          <div class="a4-tracking-text">${safeText(awbData.trackingNumber || awbNumber)}</div>
        </div>
        
        ${sender
        ? `
        <div class="a4-section a4-from">
          <div class="a4-section-header">SENDER</div>
          <div class="a4-section-content a4-section-content-compact a4-sender-line-wrap">
            <div class="a4-sender-line">${escapeHtml(getLabelSenderLine(sender), "")}</div>
          </div>
        </div>
        `
        : ""
      }
        
        ${productSectionHTML}
        
        <div class="a4-footer">
          <span class="a4-box-info">AIR WAY BILL</span>
          <span class="a4-parcel-type"></span>
        </div>
      </div>
    `
  }

  const generateNonHazardousCertificateHTML = () => {
    const sender = awbData?.sender
    const receiver = awbData?.receiver
    const destinationAirport =
      awbData?.destinationAirport ||
      awbData?.airportOfDestination ||
      [receiver?.city, receiver?.country].filter(Boolean).join(", ") ||
      receiver?.country ||
      "N/A"
    const totalPackages = getLabelCount()
    const totalWeight = getTotalWeight()
    const formattedDate = awbData.date ? format(new Date(awbData.date), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")
    const items = (awbData.boxes || []).flatMap((box) => box.items || [])
    const groupedItems = items.reduce((acc, item) => {
      const name = safeText(item.name, "Goods as per invoice")
      const hsnCode = safeText(item.hsnCode, "-")
      const key = `${name}__${hsnCode}`
      const existing = acc.get(key) || { name, hsnCode, quantity: 0 }
      existing.quantity += Number(item.quantity || 0)
      acc.set(key, existing)
      return acc
    }, new Map())
    const printableItems = Array.from(groupedItems.values())
    const maxCertificateRows = 10
    const visibleItems = printableItems.slice(0, maxCertificateRows)
    const remainingItems = printableItems.slice(maxCertificateRows)
    const contentRows = printableItems.length
      ? visibleItems
        .map((item, index) => {
          return `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.name, "Goods as per invoice")}</td>
                <td>${escapeHtml(item.hsnCode, "-")}</td>
                <td>${escapeHtml(item.quantity || "0", "0")}</td>
              </tr>
            `
        })
        .join("") +
      (remainingItems.length
        ? `
              <tr>
                <td>+</td>
                <td colspan="3">Additional contents: ${escapeHtml(
          remainingItems.map((item) => `${item.name} (${item.quantity || 0})`).join(", "),
          "",
        )}</td>
              </tr>
            `
        : "")
      : `
        <tr>
          <td>1</td>
          <td>${escapeHtml(awbData?.parcelType || "Goods as per invoice")}</td>
          <td>-</td>
          <td>1</td>
        </tr>
      `

    const shippingContent = items.length
      ? items.map((item) => safeText(item.name, "")).filter(Boolean).join(", ")
      : safeText(awbData?.parcelType || "Goods as per invoice")

    return `
      <div class="non-hazardous-page">
        <div class="nh-header">
          <div class="nh-title-wrap">
            <div class="nh-kicker">Declaration for Air Cargo Movement</div>
            <h1>NON-HAZARDOUS CARGO CERTIFICATE</h1>
          </div>
        </div>

        <div class="nh-meta-grid">
          <div class="nh-field"><span>Date</span><strong>${escapeHtml(formattedDate)}</strong></div>
          <div class="nh-field nh-manual-field"><span>Tracking No.</span><strong>&nbsp;</strong></div>
          <div class="nh-field nh-manual-field"><span>Air Waybill / Forwarding No.</span><strong>&nbsp;</strong></div>
          <div class="nh-field"><span>Mode / Carrier</span><strong></strong></div>
          <div class="nh-field"><span>Airport of Departure</span><strong>India</strong></div>
          <div class="nh-field"><span>Airport of Destination</span><strong>${escapeHtml(destinationAirport)}</strong></div>
        </div>

        <div class="nh-parties-grid">
          <section>
            <h2>Consignor Details</h2>
            <div>${formatPartyBlock(sender)}</div>
          </section>
          <section>
            <h2>Consignee Details</h2>
            <div>${formatPartyBlock(receiver)}</div>
          </section>
        </div>

        <div class="nh-shipment-strip">
          <div><span>No. of Packages</span><strong>${escapeHtml(totalPackages)}</strong></div>
          <div><span>Gross Weight</span><strong>${totalWeight ? `${totalWeight.toFixed(2)} KG` : "N/A"}</strong></div>
          <div><span>Shipping Content</span><strong>${escapeHtml(shippingContent)}</strong></div>
        </div>

        <table class="nh-content-table">
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Description of Goods / Shipping Content</th>
              <th>HSN</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>${contentRows}</tbody>
        </table>

        <div class="nh-declaration">
          <p>
            This is to certify that the above mentioned shipment contains non-hazardous, non-dangerous goods only. The cargo is not restricted, not prohibited, and does not contain any explosive, inflammable, radioactive, corrosive, toxic, infectious, magnetized, lithium battery, dry ice, chemical, liquid, aerosol, compressed gas, or any other dangerous goods as classified under IATA/ICAO regulations.
          </p>
          <p>
            We hereby declare that the description and details furnished above are true and correct to the best of our knowledge and that the shipment is safe for carriage by air.
          </p>
        </div>

        <div class="nh-signature-grid">
          <div>
            <span>Place</span>
            <strong>${escapeHtml(sender?.city || sender?.country || "India")}</strong>
          </div>
          <div>
            <span>Name of Declarant</span>
            <strong>${escapeHtml(sender?.name || sender?.companyName)}</strong>
          </div>
          <div class="nh-signature-box">
            <span>Signature & Stamp of Consignor</span>
          </div>
        </div>
      </div>
    `
  }

  const generateDHLAuthorizationHTML = () => {
    return `
        <div class="auth-header">
            <h1 class="text-center font-bold text-lg mb-4">Authorization for Export shipment</h1>
        </div>
        
        <div class="auth-content">
            <p class="font-bold mb-2">To whomsoever it may concern</p>
            
            <p class="mb-2 text-justify">
                I / we authorization to <strong>DHL Express (India) Pvt. Ltd. ('DHL')</strong>, including its group companies and their customs brokers 
                and agents, to act as our agent for the purpose of arranging customs clearance at various customs location within 
                India for all our Shipments, departing from India under the provisions of the various Acts, Rules, regulations and 
                procedure as laid down under the regulatory environment of India to enable DHL to arrange clearance of Export 
                shipment on my/our behalf.
            </p>
            
            <p class="mb-2 text-justify">
                I/We also give our consent and authorize DHL to generate, sign, submit and file on our behalf, in physical form or 
                digitally, the various forms like e-way bill, shipping bill, and other forms, as and when required, under various 
                statutes for undertaking the carriage, clearance or delivery of Shipment. I / we have been guided to abide by the 
                statutory requirements applicable for our Shipments and to keep myself / ourselves updated with all applicable acts 
                and regulations for my Shipments. I/We will be responsible for the declaration being made to regulators based on 
                our document / instructions.
            </p>
            
            <p class="mb-2 text-justify">
                I/We further declare that our GSTIN / Know Your Customer ("KYC") are valid and we authorize DHL to use the same 
                while undertaking transportation and clearance of our shipments on our behalf.
            </p>
            
            <p class="mb-2 text-justify">
                This authority letter shall hold good for all proceedings and can be produced before Customs and/or any statutory 
                authority to confirm the authorization hereby given to DHL. The above authorization to DHL supersedes all previous 
                authority letters issued in this behalf and shall remain valid, subsisting and continues until revoked in writing.
            </p>
            
            <p class="mb-2">Thanking you,</p>
            <p class="mb-2">Yours sincerely,</p>
        </div>
        
        <div class="signature-section">
            <div class="grid grid-cols-2 gap-4">
                <div class="company-section border-2 rounded-lg p-2">
                    <div class="mb-2">
                        <p class="mb-2"><strong>Company Name:${awbData?.sender?.companyName ? awbData?.sender?.companyName : "________________"}</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>GSTIN:${awbData?.sender?.companyName ? awbData?.sender?.kyc?.kyc || "________________" : "________________"}</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Signature:_________________</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Name:______________________</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Designation:________________</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Date:${awbData?.sender?.companyName ? format(new Date(), "dd/MM/yyyy") : "________________"}</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Mobile No:${awbData?.sender?.companyName ? awbData?.sender?.contact || "________________" : "________________"}</strong></p>
                    </div>
                    
                    <div class="mt-4">
                        <div class="border border-gray-400 h-16 text-center flex items-center justify-center">
                            <span class="text-gray-500">Company Stamp</span>
                        </div>
                    </div>
                </div>
                
                <div class="individual-section border-2 rounded-lg p-2">
                    <div class="mb-2">
                        <p class="font-bold mb-2">Individual Shipper</p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Name:</strong> ${awbData?.sender?.companyName ? "________________" : awbData?.sender?.name || "________________"}</p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>KYC Document:</strong>  ${awbData?.sender?.companyName ? "________________" : formattedKycType || "________________"}</p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>KYC Document No:</strong>${awbData?.sender?.companyName ? "________________" : awbData?.sender?.kyc?.kyc || "________________"}</p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Signature:__________________</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Date:<span class="underline underline-offset-2">${awbData?.sender?.companyName ? "________________" : format(new Date(), "dd/MM/yyyy")}</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-4"><strong>Mobile No:</strong>${awbData?.sender?.companyName ? "________________" : awbData?.sender?.contact || "________________"}</p>
                    </div>
                </div>
            </div>
        </div>
    `
  }

  const generateFedExAuthorizationHTML = () => {
    return `
    <span class="text-[12px]">
        <div class="auth-header mb-6">
            <div class="mb-2">
                <p><strong>Date:</strong> ${format(new Date(), "dd/MM/yyyy")}</p>
            </div>
            
            <div class="mb-2">
                <p><strong>To,</strong></p>
                <p class="mt-2">
                    <strong>FedEx Express Transportation and Supply Chain Services (India) Pvt. Ltd.</strong><br>
                    Boomerang, Unit 801, 8th Floor, A-Wing Chandivali Farm Road,<br>
                    Andheri (E) Mumbai – 400072
                </p>
            </div>
            
            <h1 class="text-center font-bold text-lg mb-4">Export authorization with Know Your Customer document</h1>
            
            <div class="mb-2 text-center text-lg">
                <p><strong>AWB #</strong>__________________________________</p>
            </div>
        </div>
        
        <div class="auth-content mb-2">
            <p class="mb-2 text-justify">
                We hereby authorize <strong>FedEx Express Transportation and Supply Chain Services (India) Pvt. Ltd</strong> 
                (hereinafter FedEx which expression shall include their respective holding companies and their 
                customs clearance agents) to:
            </p>
            
            <div class="mb-2">
                <p class="mb-2 text-justify">
                    <strong>1)</strong> act as our authorized courier and/or agent to do all necessary acts on our behalf for 
                    customs clearance including filing of documents, declarations and Shipping Bill for 
                    clearance of all export shipments shipped by us from time to time through the courier, 
                    express or formal customs clearance mode.
                </p>
                
                <p class="mb-2 text-justify">
                    <strong>2)</strong> file documents for export customs clearance of shipments based on the declaration and 
                    information regarding the shipments provided to FedEx by us or in the absence of the 
                    same, the information for import shipments provided to FedEx by the consignors for 
                    delivery in India.
                </p>
            </div>
            
            <p class="mb-2 text-justify">
                This authorization shall remain valid until revoked in writing and acknowledged by FedEx in 
                writing and shall cover all our shipments sent by or addressed to our various offices / branches 
                in India. This authorization may be produced and presented before any customs station in India 
                as a formal authorization to your company for customs clearance of our shipments by you or 
                your authorized agents.
            </p>
            
            <p class="mb-2 font-bold">Please provide the following Know Your Customer (KYC) document, as applicable.</p>
        </div>
        
        <div class="kyc-table mb-2">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border border-gray-400 px-3 py-2 text-left font-bold">#</th>
                        <th class="border border-gray-400 px-3 py-2 text-left font-bold">Category</th>
                        <th class="border border-gray-400 px-3 py-2 text-left font-bold">Documents Required</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="border border-gray-400 px-3 py-2">1.</td>
                        <td class="border border-gray-400 px-3 py-2">Individual</td>
                        <td class="border border-gray-400 px-3 py-2">
                            Any one of the following documents<br>
                            □ Passport Copy with address page.<br>
                            □ Adhaar Card<br>
                            □ PAN Card<br>
                            □ Voter ID Card
                        </td>
                    </tr>
                    <tr>
                        <td class="border border-gray-400 px-3 py-2">2.</td>
                        <td class="border border-gray-400 px-3 py-2">Firms, company, institution registered Under GST Laws</td>
                        <td class="border border-gray-400 px-3 py-2">
                            □ GSTIN registration copy<br>
                            □ IEC number
                        </td>
                    </tr>
                    <tr>
                        <td class="border border-gray-400 px-3 py-2">3.</td>
                        <td class="border border-gray-400 px-3 py-2">Exempted/ non-registered firms, company, institution under GST Laws</td>
                        <td class="border border-gray-400 px-3 py-2">
                            □ PAN Card<br>
                            □ IEC number
                        </td>
                    </tr>
                    <tr>
                        <td class="border border-gray-400 px-3 py-2">4.</td>
                        <td class="border border-gray-400 px-3 py-2">Embassy/ U.N. Bodies/ Government entities</td>
                        <td class="border border-gray-400 px-3 py-2">□ Unique Identification Number (UIN) copy</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="additional-info mb-2">
            <p class="mb-2 text-justify">
                <strong>IEC number is mandatory to file shipment for clearance.</strong> The name / branch address of company 
                as on the invoice should match as with that on shipping documents accompanying the shipment
            </p>
            
            <p class="mb-2 text-justify">
                We/ I duly declare that the above document is the true copy and verifiable with original KYC 
                document if called upon by customs / government authorities.
            </p>
        </div>
        
        <div class="signature-section">
            <div class="grid grid-cols-2 gap-8">
                <div>
                    <p class="mb-2"><strong>Company Name:</strong></p>
                    <p class="mb-2">${awbData?.sender?.companyName || ""}</p>
                </div>
                <div class="text-right">
                    <div class="border border-gray-400 h-16 flex items-center justify-center">
                        <span class="text-gray-500">Sign/Stamped by Authorized Signatory</span>
                    </div>
                </div>
            </div>
        </div>
        </span>
    `
  }

  const renderShippingBarcodes = () => {
    setTimeout(() => {
      const headerBarcodes = document.querySelectorAll(".header-barcode-svg")
      headerBarcodes.forEach((element) => {
        const value = element.getAttribute("data-value")
        if (value && value !== "N/A" && value !== "") {
          try {
            JsBarcode(element, value, {
              format: "CODE128",
              width: 1.55,
              height: 40,
              displayValue: false,
              margin: 0,
            })
          } catch (e) {
            console.error("Barcode error:", e)
          }
        }
      })
    }, 150)
  }

  const renderA4Barcodes = () => {
    setTimeout(() => {
      const headerBarcodes = document.querySelectorAll(".a4-header-barcode")
      headerBarcodes.forEach((element) => {
        const value = element.getAttribute("data-value")
        if (value && value !== "N/A" && value !== "") {
          try {
            JsBarcode(element, value, {
              format: "CODE128",
              width: 1.05,
              height: 28,
              displayValue: false,
              margin: 0,
            })
          } catch (e) {
            console.error("Barcode error:", e)
          }
        }
      })
    }, 150)
  }

  const getLabelPrinterStyles = () => {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      @page {
        size: 100mm 150mm;
        margin: 0;
      }
      
      @media print {
        html, body {
          width: 100mm;
          height: auto;
          margin: 0;
          padding: 0;
        }
      }
      
      body {
        font-family: 'Arial', 'Helvetica Neue', sans-serif;
        font-size: 8pt;
        line-height: 1.2;
        background: white;
        color: #000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .shipping-label {
        width: 100mm;
        height: 150mm;
        padding: 2mm;
        background: white;
        border: 0.5mm solid #000;
        box-sizing: border-box;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .shipping-label.last-label {
        page-break-after: avoid;
      }
      
      .label-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2mm;
        border-bottom: 0.5mm solid #000;
        margin-bottom: 1mm;
        min-height: 15mm;
      }
      
      .header-logo {
        flex: 0 0 auto;
        max-width: 30mm;
      }
      
      .logo-img {
        max-height: 16mm;
        max-width: 48mm;
        object-fit: contain;
      }
      
      .header-barcode {
        flex: 1;
        text-align: right;
        padding-left: 2mm;
      }
      
      .header-barcode-svg {
        max-width: 60mm;
        height: auto;
      }
      
      .tracking-number-text {
        font-size: 7pt;
        font-weight: bold;
        text-align: right;
        margin-top: 1mm;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.5mm;
      }
      
      .weight-date-row {
        display: flex;
        justify-content: space-between;
        padding: 1.5mm 2mm;
        background: #f0f0f0;
        border: 0.3mm solid #000;
        font-size: 8pt;
        font-weight: bold;
        margin-bottom: 1mm;
      }
      
      .section {
        margin-bottom: 1mm;
      }
      
      .section-header {
        background: #000;
        color: #fff;
        padding: 1mm 2mm;
        font-size: 7pt;
        font-weight: bold;
        letter-spacing: 0.3mm;
      }
      
      .section-content {
        border: 0.3mm solid #000;
        border-top: none;
        padding: 1.5mm 2mm;
        font-size: 7pt;
      }
      
      .ship-from .sender-name {
        font-size: 6pt;
        font-weight: 700;
        text-transform: uppercase;
      }
      
      .ship-from .sender-company {
        font-size: 4.8pt;
        color: #333;
      }
      
      .ship-to .section-content {
        background: #fafafa;
      }
      
      .ship-to .receiver-name {
        font-size: 18pt;
        font-weight: 900;
        margin-bottom: 1mm;
        text-transform: uppercase;
      }
      
      .ship-to .receiver-company {
        font-size: 13.5pt;
        font-weight: 800;
      }
      
      .ship-to .address-line,
      .ship-to .city-state-zip {
        font-size: 13pt;
        font-weight: 700;
        line-height: 1.2;
      }
      
      .country-badge {
        display: inline-block;
        font-size: 7pt;
        font-weight: bold;
        color: #000;
        padding: 0.5mm 2mm;
        margin-top: 1mm;
        border-radius: 1mm;
      }
      
      .tracking-section .tracking-grid {
        display: flex;
        flex-direction: column;
        gap: 1mm;
      }
      
      .tracking-row {
        display: flex;
        align-items: center;
      }
      
      .tracking-label {
        width: 20mm;
        font-weight: bold;
        font-size: 7pt;
      }
      
      .tracking-value {
        flex: 1;
        font-size: 8pt;
      }
      
      .awb-highlight {
        font-weight: bold;
        font-size: 10pt;
        letter-spacing: 0.5mm;
        color: #000;
      }
      
      .shipment-type-section {
        padding: 1mm 2mm;
        background: #e8e8e8;
        border: 0.3mm solid #000;
        margin-bottom: 1mm;
        font-size: 7pt;
      }
      
      .shipment-type-badge {
        font-weight: bold;
        background: #000;
        color: #fff;
        padding: 0.3mm 1.5mm;
        border-radius: 1mm;
      }
      
      .product-section .section-content {
        padding: 0;
      }
      
      .product-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 6pt;
      }
      
      .product-table th {
        background: #e0e0e0;
        border: 0.3mm solid #000;
        padding: 0.8mm 0.5mm;
        font-weight: bold;
        text-align: center;
        font-size: 5.5pt;
      }
      
      .product-table td {
        border: 0.3mm solid #000;
        padding: 0.6mm 0.5mm;
        vertical-align: top;
        font-size: 5.5pt;
      }
      
      .product-table .col-sr { width: 5mm; text-align: center; }
      .product-table .col-desc { text-align: left; }
      .product-table .col-hsn { width: 10mm; text-align: center; }
      .product-table .col-qty { width: 6mm; text-align: center; }
      .product-table .col-rate { width: 11mm; text-align: right; }
      .product-table .col-amt { width: 11mm; text-align: right; }
      
      .product-table .sr-no { text-align: center; }
      .product-table .product-desc { text-align: left; }
      .product-table .hsn-code { text-align: center; }
      .product-table .qty { text-align: center; }
      .product-table .rate { text-align: right; }
      .product-table .amount { text-align: right; font-weight: bold; }
      
      .product-table .total-row {
        background: #f0f0f0;
      }
      
      .product-table .total-row .total-label {
        text-align: right;
        font-weight: bold;
        padding-right: 2mm;
      }
      
      .product-table .total-row .total-amount {
        font-weight: bold;
        text-align: right;
        font-size: 6pt;
      }
      
      .product-table .words-row .amount-words {
        font-size: 5pt;
        font-style: italic;
        text-align: center;
        padding: 0.5mm;
      }
      
      .label-footer {
        margin-top: auto;
        border-top: 0.3mm dashed #000;
        padding-top: 1mm;
        display: flex;
        justify-content: space-between;
        font-size: 6pt;
        color: #666;
      }
      
      .box-info {
        font-weight: bold;
      }
      
      .parcel-type {
        font-weight: bold;
        text-transform: uppercase;
        color: #000;
      }

      .shipping-label {
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 2.4mm;
        border: 0.3mm solid #b9c3d6;
        border-radius: 4mm;
        background: #fff;
        overflow: hidden;
        isolation: isolate;
        gap: 1.2mm;
      }

      .shipping-label > * {
        position: relative;
        z-index: 1;
      }

      .label-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0 1.2mm;
        border-bottom: 0.25mm solid #d4dbe7;
        min-height: auto;
        gap: 2mm;
      }

      .header-brand {
        display: flex;
        align-items: center;
        gap: 1mm;
        flex: 0 0 34mm;
      }

      .header-logo-shell {
        width: 38mm;
        height: 20mm;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
      }

      .logo-img {
        max-width: 40mm;
        max-height: 19mm;
      }

      .header-destination {
        flex: 1;
        text-align: right;
      }

      .header-destination-label {
        font-size: 4.8pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1mm;
      }

      .header-destination-main {
        font-size: 13pt;
        font-weight: 900;
        line-height: 0.95;
      }

      .header-destination-zip {
        font-size: 11.5pt;
        font-weight: 900;
        line-height: 0.95;
        margin-top: 0.5mm;
      }

      .barcode-section {
        border: 0.28mm solid #b9c3d6;
        border-radius: 3.2mm;
        padding: 1.6mm 1.8mm 1.2mm;
        text-align: center;
        background: rgba(255, 255, 255, 0.94);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .header-barcode-svg {
        max-width: 64mm;
        width: 100%;
      }

      .tracking-number-text {
        margin-top: 0.6mm;
        font-size: 6.1pt;
        font-weight: 800;
        letter-spacing: 0.35mm;
        color: #000;
        text-align: center;
      }

      .meta-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8mm;
      }

      .meta-pill {
        border: 0.22mm solid #c6cfdd;
        background: #fff;
        color: #000;
        padding: 0.7mm 1.3mm;
        border-radius: 999px;
        font-size: 5.4pt;
        font-weight: 800;
        letter-spacing: 0.12mm;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.9mm;
      }

      .metric-card {
        border: 0.25mm solid #c6cfdd;
        border-radius: 3mm;
        background: rgba(255, 255, 255, 0.94);
        padding: 1.1mm 1.2mm;
        min-height: 12mm;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .metric-label {
        display: block;
        font-size: 4.9pt;
        text-transform: uppercase;
        letter-spacing: 0.1mm;
        color: #222;
        margin-bottom: 0.5mm;
      }

      .metric-value {
        display: block;
        font-size: 7.2pt;
        font-weight: 900;
        color: #000;
        line-height: 1.1;
      }

      .metric-value-tight {
        font-size: 7pt;
        word-break: break-word;
      }

      .awb-focus-card {
        border: 0.28mm solid #95a6c8;
        border-radius: 3.4mm;
        background: linear-gradient(180deg, rgba(246, 249, 255, 0.98), rgba(255, 255, 255, 0.96));
        padding: 1.6mm 1.8mm;
        text-align: center;
      }

      .awb-focus-label {
        font-size: 5pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.18mm;
        color: #334155;
      }

      .awb-focus-value {
        margin-top: 0.8mm;
        font-size: 10pt;
        line-height: 1.05;
        font-weight: 900;
        color: #111827;
        word-break: break-word;
      }

      .section {
        margin-bottom: 0;
      }

      .section-header {
        background: #fff;
        color: #000;
        border-radius: 3mm 3mm 0 0;
        border: 0.25mm solid #c6cfdd;
        border-bottom: none;
        padding: 0.8mm 1.2mm;
        font-size: 5.4pt;
        font-weight: 800;
        letter-spacing: 0.22mm;
        text-align: center;
      }

      .section-content {
        border: 0.25mm solid #c6cfdd;
        border-top: none;
        background: #fff;
        border-radius: 0 0 3mm 3mm;
        padding: 1.2mm;
        font-size: 6pt;
        text-align: center;
      }

      .section-content-compact {
        padding: 1mm 1.2mm;
      }

      .sender-line-wrap {
        padding: 0.8mm 1.2mm;
      }

      .sender-line {
        font-size: 5.6pt;
        font-weight: 700;
        text-transform: uppercase;
        color: #000;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .section-content-inline {
        display: grid;
        gap: 1mm;
      }

      .sender-name {
        font-size: 6pt;
        font-weight: 700;
        text-transform: uppercase;
        color: #000;
        line-height: 1.05;
        margin-bottom: 0.35mm;
      }

      .sender-company {
        font-size: 4.8pt;
        font-weight: 700;
        text-transform: uppercase;
        color: #222;
        margin-bottom: 0.35mm;
      }

      .receiver-name {
        font-size: 18pt;
        font-weight: 900;
        text-transform: uppercase;
        color: #000;
        line-height: 1.08;
        margin-bottom: 1mm;
      }

      .receiver-company {
        font-size: 13.5pt;
        font-weight: 800;
        text-transform: uppercase;
        color: #111;
        margin-bottom: 0.8mm;
      }

      .receiver-address {
        display: grid;
        gap: 0.5mm;
        margin-bottom: 0.8mm;
        justify-items: center;
      }

      .address-line {
        font-size: 5.8pt;
        line-height: 1.2;
        color: #000;
      }

      .ship-to .address-line {
        font-size: 13pt;
        font-weight: 700;
        line-height: 1.2;
      }

      .ship-from .address-line {
        font-size: 5pt;
        line-height: 1.15;
      }

      .address-line-muted {
        color: #222;
      }

      .contact-line {
        font-size: 5.6pt;
        font-weight: 700;
        color: #000;
        text-align: center;
      }

      .ship-from .contact-line {
        font-size: 4.8pt;
      }

      .receiver-phone-block {
        border: 0.22mm solid #c6cfdd;
        border-radius: 2.6mm;
        padding: 1mm 1.2mm;
        margin-top: 0.6mm;
      }

      .receiver-phone-label {
        font-size: 7pt;
        font-weight: 800;
        text-transform: uppercase;
      }

      .receiver-phone-value {
        font-size: 16pt;
        font-weight: 900;
        line-height: 1;
        margin-top: 0.4mm;
      }

      .tracking-row {
        display: flex;
        justify-content: space-between;
        gap: 1.6mm;
        border-bottom: 0.2mm dashed #cbd5e1;
        border-bottom-color: #aaa;
        padding-bottom: 0.7mm;
        align-items: center;
      }

      .tracking-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .tracking-label {
        font-size: 5.2pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1mm;
        color: #222;
      }

      .tracking-value {
        font-size: 5.8pt;
        font-weight: 700;
        color: #000;
        text-align: right;
      }

      .label-footer {
        border-top: 0.25mm solid #d4dbe7;
        padding-top: 0.9mm;
        font-size: 5.4pt;
        color: #000;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5mm;
      }

      .box-info,
      .parcel-type {
        font-weight: 800;
        color: #000;
      }
      
      @media print {
        .shipping-label {
          border: 0.3mm solid #000;
        }
        
        .section-header,
        .shipment-type-badge,
        .product-table th,
        .product-table .total-row {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `
  }

  const getA4PrinterStyles = () => {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      @page {
        size: A4;
        margin: 5mm;
      }
      
      body {
        font-family: 'Arial', 'Helvetica Neue', sans-serif;
        font-size: 7pt;
        line-height: 1.1;
        background: white;
        color: #000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .a4-page {
        width: 200mm;
        height: 287mm;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 3mm;
        padding: 2mm;
        page-break-inside: avoid;
      }
      
      .a4-page-break {
        page-break-after: always;
      }
      
      .a4-label {
        width: 97mm;
        height: 140mm;
        padding: 2mm;
        background: white;
        border: 0.4mm solid #000;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .a4-label.empty-placeholder {
        border: 0.4mm dashed #ccc;
        opacity: 0.3;
      }
      
      .a4-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1mm;
        border-bottom: 0.4mm solid #000;
        margin-bottom: 1mm;
        min-height: 12mm;
      }
      
      .a4-header-logo {
        flex: 0 0 auto;
        max-width: 22mm;
      }
      
      .a4-logo-img {
        max-height: 10mm;
        max-width: 20mm;
        object-fit: contain;
      }
      
      .a4-header-barcode-container {
        flex: 1;
        text-align: right;
        padding-left: 2mm;
      }
      
      .a4-header-barcode {
        max-width: 65mm;
        height: auto;
      }
      
      .a4-tracking-text {
        font-size: 5.5pt;
        font-weight: bold;
        text-align: right;
        margin-top: 0.5mm;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.3mm;
      }
      
      .a4-info-row {
        display: flex;
        justify-content: space-between;
        padding: 1mm 2mm;
        background: #f0f0f0;
        border: 0.3mm solid #000;
        font-size: 6pt;
        font-weight: bold;
        margin-bottom: 1mm;
      }
      
      .a4-section {
        margin-bottom: 1mm;
      }
      
      .a4-section-header {
        background: #000;
        color: #fff;
        padding: 0.5mm 2mm;
        font-size: 6pt;
        font-weight: bold;
      }
      
      .a4-section-content {
        border: 0.3mm solid #000;
        border-top: none;
        padding: 1mm 2mm;
        font-size: 6pt;
      }
      
      .a4-from .a4-name {
        font-size: 6pt;
        font-weight: 700;
        text-transform: uppercase;
      }
      
      .a4-from .a4-sender-company {
        font-size: 4.8pt;
        color: #333;
      }
      
      .a4-to .a4-section-content {
        background: #fafafa;
      }
      
      .a4-to .a4-name {
        font-size: 18pt;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 0.5mm;
      }
      
      .a4-to .a4-receiver-company {
        font-size: 13.5pt;
        font-weight: 800;
      }
      
      .a4-to .a4-address,
      .a4-to .a4-city {
        font-size: 13pt;
        font-weight: 700;
        line-height: 1.2;
      }
      
      .a4-to .a4-country {
        display: inline-block;
        font-size: 6pt;
        font-weight: bold;
        background: #000;
        color: #fff;
        padding: 0.3mm 1.5mm;
        margin-top: 0.5mm;
        border-radius: 0.5mm;
      }
      
      .a4-awb .a4-awb-number {
        font-size: 8pt;
        font-weight: bold;
        letter-spacing: 0.3mm;
      }
      
      .a4-awb .a4-service {
        font-size: 6pt;
        color: #333;
      }
      
      .a4-shipment-type {
        padding: 0.5mm 2mm;
        background: #e8e8e8;
        border: 0.3mm solid #000;
        margin-bottom: 1mm;
        font-size: 6pt;
      }
      
      .a4-shipment-type .shipment-badge {
        font-weight: bold;
        background: #000;
        color: #fff;
        padding: 0.2mm 1mm;
        border-radius: 0.5mm;
        font-size: 5.5pt;
      }
      
      .a4-product-section {
        flex-grow: 1;
        margin-bottom: 1mm;
        overflow: hidden;
      }
      
      .a4-product-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 5pt;
      }
      
      .a4-product-table th {
        background: #e0e0e0;
        border: 0.2mm solid #000;
        padding: 0.5mm;
        font-weight: bold;
        text-align: center;
        font-size: 5pt;
      }
      
      .a4-product-table td {
        border: 0.2mm solid #000;
        padding: 0.4mm;
        vertical-align: top;
        font-size: 5pt;
      }
      
      .a4-product-table .a4-total-row {
        background: #f0f0f0;
      }
      
      .a4-product-table .a4-total-row td {
        font-weight: bold;
      }
      
      .a4-product-table .a4-words-row .a4-amount-words {
        font-size: 4.5pt;
        font-style: italic;
        text-align: center;
      }
      
      .a4-footer {
        margin-top: auto;
        border-top: 0.2mm dashed #000;
        padding-top: 0.5mm;
        display: flex;
        justify-content: space-between;
        font-size: 5pt;
        color: #666;
      }
      
      .a4-box-info {
        font-weight: bold;
      }
      
      .a4-parcel-type {
        font-weight: bold;
        text-transform: uppercase;
        color: #000;
      }

      .a4-label {
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 2mm;
        border: 0.28mm solid #b9c3d6;
        border-radius: 3.2mm;
        background: #fff;
        overflow: hidden;
        isolation: isolate;
        gap: 0.9mm;
      }

      .a4-label > * {
        position: relative;
        z-index: 1;
      }

      .a4-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0 0.9mm;
        border-bottom: 0.2mm solid #d4dbe7;
        min-height: auto;
        gap: 1.4mm;
      }

      .a4-brand {
        display: flex;
        align-items: center;
        gap: 0.8mm;
        flex: 0 0 24mm;
      }

      .a4-header-logo {
        width: 30mm;
        height: 16mm;
        max-width: none;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
      }

      .a4-logo-img {
        max-width: 30mm;
        max-height: 16mm;
      }

      .a4-header-destination {
        flex: 1;
        text-align: right;
      }

      .a4-header-destination-label {
        font-size: 4.2pt;
        font-weight: 800;
        text-transform: uppercase;
      }

      .a4-header-destination-main {
        font-size: 9.2pt;
        font-weight: 900;
        line-height: 0.95;
      }

      .a4-header-destination-zip {
        font-size: 8pt;
        font-weight: 900;
        line-height: 0.95;
        margin-top: 0.3mm;
      }

      .a4-barcode-section {
        border: 0.22mm solid #b9c3d6;
        border-radius: 2.8mm;
        padding: 1.1mm 1.1mm 0.9mm;
        text-align: center;
        background: rgba(255, 255, 255, 0.94);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .a4-header-barcode {
        max-width: 52mm;
        width: 100%;
      }

      .a4-tracking-text {
        margin-top: 0.5mm;
        font-size: 4.7pt;
        font-weight: 800;
        color: #000;
        text-align: center;
      }

      .a4-meta-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8mm;
      }

      .a4-meta-pill {
        border: 0.2mm solid #c6cfdd;
        background: #fff;
        color: #000;
        padding: 0.6mm 1.2mm;
        border-radius: 999px;
        font-size: 4.9pt;
        font-weight: 800;
      }

      .a4-metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.9mm;
      }

      .a4-metric-card {
        border: 0.2mm solid #c6cfdd;
        border-radius: 2.5mm;
        background: rgba(255, 255, 255, 0.94);
        padding: 0.9mm 1mm;
        min-height: 10mm;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .a4-metric-label {
        display: block;
        font-size: 4.6pt;
        text-transform: uppercase;
        color: #222;
        margin-bottom: 0.4mm;
      }

      .a4-metric-value {
        display: block;
        font-size: 6.4pt;
        font-weight: 900;
        color: #000;
        line-height: 1.1;
      }

      .a4-metric-value-tight {
        font-size: 6pt;
        word-break: break-word;
      }

      .a4-awb-focus-card {
        border: 0.22mm solid #95a6c8;
        border-radius: 2.8mm;
        background: linear-gradient(180deg, rgba(246, 249, 255, 0.98), rgba(255, 255, 255, 0.96));
        padding: 1.1mm 1.3mm;
        text-align: center;
      }

      .a4-awb-focus-label {
        font-size: 4.5pt;
        font-weight: 800;
        text-transform: uppercase;
        color: #334155;
      }

      .a4-awb-focus-value {
        margin-top: 0.5mm;
        font-size: 7.5pt;
        font-weight: 900;
        line-height: 1.05;
        color: #111827;
        word-break: break-word;
      }

      .a4-section {
        margin-bottom: 0;
      }

      .a4-section-header {
        background: #fff;
        color: #000;
        border: 0.2mm solid #c6cfdd;
        border-bottom: none;
        border-radius: 2.6mm 2.6mm 0 0;
        padding: 0.6mm 1.3mm;
        font-size: 4.9pt;
        letter-spacing: 0.18mm;
        text-align: center;
      }

      .a4-section-content {
        border: 0.2mm solid #c6cfdd;
        border-top: none;
        border-radius: 0 0 2.6mm 2.6mm;
        background: #fff;
        padding: 1.1mm 1.3mm;
        text-align: center;
      }

      .a4-section-content-compact {
        padding: 0.9mm 1.3mm;
      }

      .a4-sender-line-wrap {
        padding: 0.7mm 1mm;
      }

      .a4-sender-line {
        font-size: 5.4pt;
        font-weight: 700;
        color: #000;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .a4-section-content-inline {
        display: grid;
        gap: 0.8mm;
      }

      .a4-from .a4-name {
        font-size: 6pt;
        font-weight: 700;
        color: #000;
        margin-bottom: 0.35mm;
      }

      .a4-to .a4-name {
        font-size: 18pt;
        font-weight: 900;
        color: #000;
        margin-bottom: 0.9mm;
        line-height: 1.08;
      }

      .a4-sender-company {
        font-size: 4.8pt;
        font-weight: 700;
        color: #222;
        margin-bottom: 0.35mm;
      }

      .a4-receiver-company {
        font-size: 13.5pt;
        font-weight: 800;
        color: #111;
        margin-bottom: 0.7mm;
        line-height: 1.12;
      }

      .a4-address,
      .a4-contact {
        font-size: 4.8pt;
        line-height: 1.18;
        color: #000;
        text-align: center;
      }

      .a4-to .a4-address {
        font-size: 13pt;
        font-weight: 700;
        line-height: 1.18;
      }

      .a4-from .a4-address,
      .a4-from .a4-contact {
        font-size: 4.8pt;
        line-height: 1.15;
      }

      .a4-phone-block {
        border: 0.2mm solid #c6cfdd;
        border-radius: 2.2mm;
        padding: 0.8mm 1mm;
        margin-top: 0.5mm;
      }

      .a4-phone-label {
        font-size: 7pt;
        font-weight: 800;
        text-transform: uppercase;
      }

      .a4-phone-value {
        font-size: 16pt;
        font-weight: 900;
        line-height: 1;
        margin-top: 0.3mm;
      }

      .a4-address-muted {
        color: #222;
      }

      .a4-inline-row {
        display: flex;
        justify-content: space-between;
        gap: 1mm;
        border-bottom: 0.2mm dashed #cbd5e1;
        padding-bottom: 0.5mm;
        align-items: center;
      }

      .a4-inline-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .a4-inline-label {
        font-size: 4.6pt;
        font-weight: 800;
        text-transform: uppercase;
        color: #222;
      }

      .a4-inline-value {
        font-size: 5pt;
        font-weight: 700;
        color: #000;
        text-align: right;
      }

      .a4-footer {
        border-top: 0.2mm solid #d4dbe7;
        padding-top: 0.7mm;
        color: #000;
        text-align: center;
      }

      .a4-box-info,
      .a4-parcel-type {
        font-weight: 800;
        color: #000;
      }
      
      @media print {
        .a4-label {
          border: 0.28mm solid #b9c3d6;
        }
        
        .a4-section-header,
        .a4-product-table th,
        .a4-product-table .a4-total-row {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `
  }

  const getCommonStyles = () => {
    return `
      @page {
        size: A4;
        margin: 15mm;
      }
      
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        line-height: 1.4;
        font-size: 14px;
      }
      
      .page-break {
        page-break-after: always;
        height: 0;
        margin: 0;
        padding: 0;
      }
      
      .invoice-page {
        width: 100%;
        height: 100vh;
        border: 1px solid #666;
        border-radius: 8px;
        padding: 12px;
        margin: 0;
        background: white;
        page-break-inside: avoid;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }

      .invoice-page .text-center { text-align: center; }
      .invoice-page .grid { display: grid; }
      .invoice-page .grid-cols-2 { grid-template-columns: 1fr 1fr; }
      .invoice-page .gap-4 { gap: 12px; }
      .invoice-page .gap-2 { gap: 6px; }
      .invoice-page .mb-6 { margin-bottom: 16px; }
      .invoice-page .mb-2 { margin-bottom: 6px; }
      .invoice-page .mt-2 { margin-top: 6px; }
      .invoice-page .p-1 { padding: 3px; }
      .invoice-page .px-2 { padding-left: 6px; padding-right: 6px; }
      .invoice-page .border { border: 1px solid #d1d5db; }
      .invoice-page .border-gray-300 { border-color: #d1d5db; }
      .invoice-page .border-gray-400 { border-color: #9ca3af; }
      .invoice-page .rounded-lg { border-radius: 6px; }
      .invoice-page .font-bold { font-weight: bold; }
      .invoice-page .uppercase { text-transform: uppercase; }
      .invoice-page .text-right { text-align: right; }
      .invoice-page .text-justify { text-align: justify; }
      .invoice-page .italic { font-style: italic; }
      .invoice-page .flex { display: flex; }
      .invoice-page .flex-row { flex-direction: row; }

      .invoice-page table {
        width: 100%;
        border-collapse: collapse;
        height: 100%;
      }

      .invoice-page th,
      .invoice-page td {
        border: 1px solid #d1d5db;
        padding: 3px 6px;
        text-align: left;
        font-size: 11px;
        line-height: 1.2;
        vertical-align: top;
      }

      .invoice-page th {
        background-color: #f3f4f6;
        font-weight: bold;
      }

      .invoice-page .bg-gray-100 { background-color: #f3f4f6; }
      .invoice-page .bg-gray-200 { background-color: #e5e7eb; }
      .invoice-page .whitespace-nowrap { white-space: nowrap; }
      .invoice-page .border-t { border-top: 1px solid #9ca3af; }
      .invoice-page .ml-auto { margin-left: auto; }
      .invoice-page .mr-4 { margin-right: 12px; }
      .invoice-page .mr-12 { margin-right: 36px; }
      .invoice-page .pt-1 { padding-top: 3px; }
      .invoice-page .h-10 { height: 30px; }
      .invoice-page .w-48 { width: 144px; }

      .invoice-page .declaration-section {
        margin-top: auto;
        padding-top: 8px;
        border-top: 1px solid #9ca3af;
      }

      .invoice-page .signature-section {
        margin-top: 8px;
      }

      .non-hazardous-page {
        width: 100%;
        min-height: calc(297mm - 30mm);
        max-height: calc(297mm - 30mm);
        padding: 10mm;
        margin: 0;
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 8mm;
        page-break-inside: avoid;
        overflow: hidden;
        font-family: Arial, sans-serif;
        color: #111827;
        font-size: 11px;
        line-height: 1.25;
      }

      .non-hazardous-page * {
        box-sizing: border-box;
      }

      .nh-header {
        text-align: center;
        border: 1px solid #cbd5e1;
        border-radius: 5mm;
        background: #f8fafc;
        padding: 5mm;
        padding-bottom: 5mm;
        margin-bottom: 5mm;
      }

      .nh-kicker {
        text-transform: uppercase;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 1px;
        color: #475569;
        margin-bottom: 2mm;
      }

      .nh-title-wrap h1 {
        margin: 0;
        font-size: 22px;
        line-height: 1;
        letter-spacing: 0;
      }

      .nh-meta-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2mm;
        margin-bottom: 4mm;
      }

      .nh-field {
        min-height: 13mm;
        border: 1px solid #cbd5e1;
        border-radius: 3.5mm;
        padding: 2mm;
      }

      .nh-manual-field strong {
        min-height: 5mm;
      }

      .nh-field span,
      .nh-shipment-strip span,
      .nh-signature-grid span {
        display: block;
        text-transform: uppercase;
        font-size: 7px;
        font-weight: 700;
        color: #475569;
        margin-bottom: 1mm;
      }

      .nh-field strong,
      .nh-shipment-strip strong,
      .nh-signature-grid strong {
        display: block;
        font-size: 11px;
        line-height: 1.2;
        word-break: break-word;
      }

      .nh-parties-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4mm;
        margin-bottom: 4mm;
      }

      .nh-parties-grid section {
        border: 1px solid #cbd5e1;
        border-radius: 4mm;
        min-height: 39mm;
        overflow: hidden;
      }

      .nh-parties-grid h2 {
        margin: 0;
        padding: 1.5mm 2mm;
        background: #f1f5f9;
        border-bottom: 1px solid #cbd5e1;
        font-size: 10px;
        text-transform: uppercase;
      }

      .nh-parties-grid div {
        padding: 2mm;
        font-size: 10px;
        line-height: 1.28;
      }

      .nh-shipment-strip {
        display: grid;
        grid-template-columns: 27mm 30mm 1fr;
        gap: 2mm;
        margin-bottom: 4mm;
      }

      .nh-shipment-strip div {
        min-height: 14mm;
        padding: 2mm;
        border: 1px solid #cbd5e1;
        border-radius: 3.5mm;
      }

      .nh-content-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border: 1px solid #cbd5e1;
        border-radius: 4mm;
        overflow: hidden;
        margin-bottom: 4mm;
        table-layout: fixed;
      }

      .nh-content-table th,
      .nh-content-table td {
        border: none;
        border-right: 1px solid #cbd5e1;
        border-bottom: 1px solid #cbd5e1;
        padding: 1.4mm 1.8mm;
        font-size: 9px;
        line-height: 1.2;
        vertical-align: top;
      }

      .nh-content-table th:last-child,
      .nh-content-table td:last-child {
        border-right: none;
      }

      .nh-content-table tbody tr:last-child td {
        border-bottom: none;
      }

      .nh-content-table th {
        background: #f1f5f9;
        text-transform: uppercase;
        font-size: 8px;
      }

      .nh-content-table th:nth-child(1),
      .nh-content-table td:nth-child(1) {
        width: 11mm;
        text-align: center;
      }

      .nh-content-table th:nth-child(3),
      .nh-content-table td:nth-child(3) {
        width: 24mm;
        text-align: center;
      }

      .nh-content-table th:nth-child(4),
      .nh-content-table td:nth-child(4) {
        width: 16mm;
        text-align: center;
      }

      .nh-declaration {
        border: 1px solid #cbd5e1;
        border-radius: 4mm;
        padding: 3mm;
        margin-bottom: 5mm;
        text-align: justify;
        font-size: 10px;
      }

      .nh-declaration p {
        margin: 0 0 2mm;
      }

      .nh-declaration p:last-child {
        margin-bottom: 0;
      }

      .nh-signature-grid {
        display: grid;
        grid-template-columns: 32mm 1fr 55mm;
        gap: 4mm;
        align-items: end;
      }

      .nh-signature-grid > div {
        min-height: 16mm;
        border-bottom: 1px solid #94a3b8;
        padding-bottom: 1mm;
      }

      .nh-signature-box {
        height: 23mm;
        border: 1px solid #cbd5e1;
        border-radius: 4mm;
        border-bottom: 1px solid #cbd5e1 !important;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 2mm;
        text-align: center;
      }
      
      .auth-page {
        width: 100%;
        min-height: 100vh;
        padding: 20px;
        margin: 0;
        background: white;
        page-break-inside: avoid;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .auth-page .text-center { text-align: center; }
      .auth-page .text-justify { text-align: justify; }
      .auth-page .text-right { text-align: right; }
      .auth-page .font-bold { font-weight: bold; }
      .auth-page .text-lg { font-size: 18px; }
      .auth-page .mb-2 { margin-bottom: 8px; }
      .auth-page .mb-4 { margin-bottom: 16px; }
      .auth-page .mb-6 { margin-bottom: 24px; }
      .auth-page .mb-8 { margin-bottom: 32px; }
      .auth-page .mt-2 { margin-top: 8px; }
      .auth-page .mt-4 { margin-top: 16px; }
      .auth-page .mt-8 { margin-top: 32px; }
      .auth-page .grid { display: grid; }
      .auth-page .grid-cols-2 { grid-template-columns: 1fr 1fr; }
      .auth-page .gap-4 { gap: 16px; }
      .auth-page .gap-8 { gap: 32px; }
      .auth-page .border { border: 1px solid #666; }
      .auth-page .border-2 { border: 2px solid #666; }
      .auth-page .border-b { border-bottom: 1px solid #666; }
      .auth-page .border-gray-400 { border-color: #9ca3af; }
      .auth-page .rounded-lg { border-radius: 8px; }
      .auth-page .p-2 { padding: 8px; }
      .auth-page .h-6 { height: 24px; }
      .auth-page .h-12 { height: 48px; }
      .auth-page .h-16 { height: 64px; }
      .auth-page .flex { display: flex; }
      .auth-page .items-center { align-items: center; }
      .auth-page .justify-center { justify-content: center; }
      .auth-page .text-gray-500 { color: #6b7280; }
      
      .auth-page table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .auth-page th,
      .auth-page td {
        border: 1px solid #9ca3af;
        padding: 8px 12px;
        text-align: left;
        vertical-align: top;
      }
      
      .auth-page th {
        background-color: #f3f4f6;
        font-weight: bold;
      }
      
      .auth-page .bg-gray-100 { background-color: #f3f4f6; }
      .auth-page .px-3 { padding-left: 12px; padding-right: 12px; }
      .auth-page .py-2 { padding-top: 8px; padding-bottom: 8px; }
    `
  }

  const handleInvoicePrint = () => {
    const originalContent = document.body.innerHTML

    let allInvoices = ""
    for (let i = 0; i < invoiceCopies; i++) {
      allInvoices += `
        <div class="invoice-page">
          ${generateInvoiceHTML()}
        </div>
      `
      if (i < invoiceCopies - 1) {
        allInvoices += '<div class="page-break"></div>'
      }
    }

    document.body.innerHTML = `
      <style>
        ${getCommonStyles()}
      </style>
      ${allInvoices}
    `

    setTimeout(() => {
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }, 300)
  }

  const handleLabelsPrint = () => {
    const originalContent = document.body.innerHTML
    const boxCount = getLabelCount()

    if (printerType === "label") {
      let allLabels = ""

      for (let i = 0; i < boxCount; i++) {
        const isLastLabel = i === boxCount - 1
        allLabels += generateShippingLabelHTML(i, isLastLabel)
      }

      document.body.innerHTML = `
        <style>
          ${getLabelPrinterStyles()}
        </style>
        ${allLabels}
      `

      renderShippingBarcodes()
    } else {
      let allContent = ""
      const labelsPerPage = 4
      const totalPages = Math.ceil(boxCount / labelsPerPage)

      for (let page = 0; page < totalPages; page++) {
        const isLastPage = page === totalPages - 1
        let pageContent = `<div class="a4-page${!isLastPage ? ' a4-page-break' : ''}">`

        for (let i = 0; i < labelsPerPage; i++) {
          const boxIndex = page * labelsPerPage + i
          if (boxIndex < boxCount) {
            pageContent += generateA4LabelHTML(boxIndex)
          } else {
            pageContent += '<div class="a4-label empty-placeholder"></div>'
          }
        }

        pageContent += '</div>'
        allContent += pageContent
      }

      document.body.innerHTML = `
        <style>
          ${getA4PrinterStyles()}
        </style>
        ${allContent}
      `

      renderA4Barcodes()
    }

    setTimeout(() => {
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }, 500)
  }

  const handleAuthorizationPrint = () => {
    if (!authorizationType || authorizationCopies === 0) return

    const originalContent = document.body.innerHTML

    let allAuthorizations = ""
    for (let i = 0; i < authorizationCopies; i++) {
      allAuthorizations += `
        <div class="auth-page">
          ${authorizationType === "dhl" ? generateDHLAuthorizationHTML() : generateFedExAuthorizationHTML()}
        </div>
      `
      if (i < authorizationCopies - 1) {
        allAuthorizations += '<div class="page-break"></div>'
      }
    }

    document.body.innerHTML = `
      <style>
        ${getCommonStyles()}
      </style>
      ${allAuthorizations}
    `

    setTimeout(() => {
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }, 300)
  }

  const handleNonHazardousPrint = () => {
    const originalContent = document.body.innerHTML

    document.body.innerHTML = `
      <style>
        ${getCommonStyles()}
      </style>
      ${generateNonHazardousCertificateHTML()}
    `

    setTimeout(() => {
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }, 300)
  }

  const handleCombinedPrint = () => {
    if (onCombinedPrint) {
      onCombinedPrint()
      return
    }

    const originalContent = document.body.innerHTML
    const payload = buildCombinedPrintPayload()

    if (!payload.combinedContent) {
      alert("Please select at least one document type to print.")
      return
    }

    document.body.innerHTML = `
      <style>
        ${payload.stylesContent}
      </style>
      ${payload.combinedContent}
    `

    renderCombinedPrintBarcodes()

    setTimeout(() => {
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }, 500)
  }

  const getEffectivePrintOptions = () => ({
    selectedDocuments: printOptions?.selectedDocuments || selectedDocuments,
    invoiceCopies: printOptions?.invoiceCopies ?? invoiceCopies,
    printerType: printOptions?.printerType || printerType,
    labelSenderOption: printOptions?.labelSenderOption || labelSenderOption,
    authorizationType: printOptions?.authorizationType ?? authorizationType,
    authorizationCopies: printOptions?.authorizationCopies ?? authorizationCopies,
  })

  const buildCombinedPrintPayload = () => {
    const boxCount = getLabelCount()
    const effectiveOptions = getEffectivePrintOptions()
    const effectiveSelectedDocuments = effectiveOptions.selectedDocuments

    let combinedContent = ""
    let stylesContent = getCommonStyles()
    let hasPreviousDocument = false

    if (effectiveSelectedDocuments.labels) {
      if (effectiveOptions.printerType === "label") {
        stylesContent += getLabelPrinterStyles()
      } else {
        stylesContent += getA4PrinterStyles()
      }
    }

    if (effectiveSelectedDocuments.invoice && effectiveOptions.invoiceCopies > 0) {
      let allInvoices = ""
      for (let i = 0; i < effectiveOptions.invoiceCopies; i++) {
        allInvoices += `
          <div class="invoice-page">
            ${generateInvoiceHTML()}
          </div>
        `
        if (i < effectiveOptions.invoiceCopies - 1) {
          allInvoices += '<div class="page-break"></div>'
        }
      }
      combinedContent += allInvoices
      hasPreviousDocument = true
    }

    if (effectiveSelectedDocuments.invoice && effectiveOptions.invoiceCopies > 0 && effectiveSelectedDocuments.labels && boxCount > 0) {
      combinedContent += '<div class="page-break"></div>'
    }

    if (effectiveSelectedDocuments.labels && boxCount > 0) {
      if (effectiveOptions.printerType === "label") {
        let allLabels = ""
        for (let i = 0; i < boxCount; i++) {
          const isLastLabel = i === boxCount - 1
          allLabels += generateShippingLabelHTML(i, isLastLabel)
        }
        combinedContent += allLabels
      } else {
        let allPages = ""
        const labelsPerPage = 4
        const totalPages = Math.ceil(boxCount / labelsPerPage)

        for (let page = 0; page < totalPages; page++) {
          const isLastPage = page === totalPages - 1
          let pageContent = `<div class="a4-page${!isLastPage ? ' a4-page-break' : ''}">`

          for (let i = 0; i < labelsPerPage; i++) {
            const boxIndex = page * labelsPerPage + i
            if (boxIndex < boxCount) {
              pageContent += generateA4LabelHTML(boxIndex)
            } else {
              pageContent += '<div class="a4-label empty-placeholder"></div>'
            }
          }

          pageContent += '</div>'
          allPages += pageContent
        }
        combinedContent += allPages
      }
      hasPreviousDocument = true
    }

    if (
      hasPreviousDocument &&
      effectiveSelectedDocuments.authorization &&
      effectiveOptions.authorizationType &&
      effectiveOptions.authorizationCopies > 0
    ) {
      combinedContent += '<div class="page-break"></div>'
    }

    if (effectiveSelectedDocuments.authorization && effectiveOptions.authorizationType && effectiveOptions.authorizationCopies > 0) {
      let allAuthorizations = ""
      for (let i = 0; i < effectiveOptions.authorizationCopies; i++) {
        allAuthorizations += `
          <div class="auth-page">
            ${effectiveOptions.authorizationType === "dhl" ? generateDHLAuthorizationHTML() : generateFedExAuthorizationHTML()}
          </div>
        `
        if (i < effectiveOptions.authorizationCopies - 1) {
          allAuthorizations += '<div class="page-break"></div>'
        }
      }
      combinedContent += allAuthorizations
      hasPreviousDocument = true
    }

    if (hasPreviousDocument && effectiveSelectedDocuments.nonHazardous) {
      combinedContent += '<div class="page-break"></div>'
    }

    if (effectiveSelectedDocuments.nonHazardous) {
      combinedContent += generateNonHazardousCertificateHTML()
      hasPreviousDocument = true
    }

    return {
      combinedContent,
      stylesContent,
      labelsSelected: effectiveSelectedDocuments.labels,
      printerType: effectiveOptions.printerType,
    }
  }

  const renderCombinedPrintBarcodes = () => {
    const effectiveOptions = getEffectivePrintOptions()
    if (effectiveOptions.selectedDocuments.labels) {
      if (effectiveOptions.printerType === "label") {
        renderShippingBarcodes()
      } else {
        renderA4Barcodes()
      }
    }
  }

  useImperativeHandle(ref, () => ({
    isReady: !loading && !!awbData,
    buildCombinedPrintPayload,
    renderCombinedPrintBarcodes,
  }))

  useEffect(() => {
    if (!loading && awbData && onReady) {
      onReady(trackingNumber)
    }
  }, [awbData, loading, onReady, trackingNumber])

  useEffect(() => {
    if (onPrintOptionsChange) {
      onPrintOptionsChange({
        selectedDocuments,
        invoiceCopies,
        printerType,
        labelSenderOption,
        authorizationType,
        authorizationCopies,
      })
    }
  }, [
    authorizationCopies,
    authorizationType,
    invoiceCopies,
    labelSenderOption,
    onPrintOptionsChange,
    printerType,
    selectedDocuments,
  ])

  const getLayoutDescription = () => {
    const boxCount = awbData?.boxes?.length || totalBoxes
    if (printerType === "label") {
      return `${boxCount} label${boxCount > 1 ? 's' : ''} (4x6 inch thermal format)`
    } else {
      const pages = Math.ceil(boxCount / 4)
      return `${boxCount} label${boxCount > 1 ? 's' : ''} on ${pages} A4 page${pages > 1 ? 's' : ''} (4 per page)`
    }
  }

  const handleDocumentSelection = (documentType, checked) => {
    setSelectedDocuments((prev) => ({
      ...prev,
      [documentType]: checked,
    }))
  }

  if (hidden) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-indigo-50 to-white min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center text-red-600">Error</h1>
        <p className="text-center text-xl">{error}</p>
      </div>
    )
  }

  if (!awbData) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-indigo-50 to-white min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center text-indigo-800">No Data Found</h1>
        <p className="text-center text-xl">No tracking information found for the given tracking number.</p>
      </div>
    )
  }

  const totalAmount = calculateTotal()

  return (
    <div className="container mx-auto px-4 py-6 bg-gradient-to-b from-indigo-50 to-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-[#232C65] mb-2">Enhanced Shipping Documents</h1>
        <p className="text-center text-gray-600">
          Generate and print shipping invoices, labels, authorization letters, and KYC documents for tracking number:{" "}
          <span className="font-semibold">{trackingNumber}</span>
        </p>
        <div className="flex justify-center gap-2 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${awbData?.parcelType?.toLowerCase() === 'ecommerce'
            ? 'bg-green-100 text-green-800'
            : awbData?.parcelType?.toLowerCase() === 'international'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-orange-100 text-orange-800'
            }`}>
            {getParcelTypeDisplay()}
          </span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-[#232C65]">Select Documents to Print</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-invoice"
              checked={selectedDocuments.invoice}
              onCheckedChange={(checked) => handleDocumentSelection("invoice", checked)}
            />
            <Label htmlFor="select-invoice" className="text-sm font-medium">
              Shipping Invoice ({invoiceCopies} copies)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-labels"
              checked={selectedDocuments.labels}
              onCheckedChange={(checked) => handleDocumentSelection("labels", checked)}
            />
            <Label htmlFor="select-labels" className="text-sm font-medium">
              Shipping Labels ({getLabelCount()} labels)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-authorization"
              checked={selectedDocuments.authorization}
              onCheckedChange={(checked) => handleDocumentSelection("authorization", checked)}
            />
            <Label htmlFor="select-authorization" className="text-sm font-medium">
              Authorization Letter ({authorizationType ? `${authorizationCopies} copies` : "Not configured"})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-non-hazardous"
              checked={selectedDocuments.nonHazardous}
              onCheckedChange={(checked) => handleDocumentSelection("nonHazardous", checked)}
            />
            <Label htmlFor="select-non-hazardous" className="text-sm font-medium">
              Non-Hazardous Cargo Certificate
            </Label>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Shipping Invoice
            </CardTitle>
            <CardDescription>Configure and preview shipping invoice copies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <label htmlFor="invoiceCopies" className="text-sm font-medium">
                Number of Copies:
              </label>
              <input
                id="invoiceCopies"
                type="number"
                min="1"
                max="10"
                value={invoiceCopies}
                onChange={(e) => setInvoiceCopies(Math.max(1, Math.min(10, Number.parseInt(e.target.value) || 1)))}
                className="w-16 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Sender Details:</Label>
              <RadioGroup value={invoiceSenderOption} onValueChange={handleInvoiceSenderOptionChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="original" id="sender-original" />
                  <Label htmlFor="sender-original" className="text-sm">
                    Print with Original Sender
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="sender-custom" />
                  <Label htmlFor="sender-custom" className="text-sm">
                    Print with Custom Sender Details
                  </Label>
                </div>
              </RadioGroup>
              {invoiceSenderOption === "custom" && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 p-0 h-auto text-blue-600"
                  onClick={() => setShowCustomSenderDialog(true)}
                >
                  Edit Custom Sender Details
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <p>• Each copy will be printed on a separate page</p>
              <p>• Contains detailed item breakdown and pricing</p>
              <p>
                • Total Amount: {awbData.shippingCurrency || "₹"}
                {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {invoiceSenderOption === "custom" && (
                <p className="text-blue-600 font-medium">• Using custom sender: {customSenderDetails.name}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleInvoicePrint}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Print Invoice Only
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipping Labels
            </CardTitle>
            <CardDescription>Design the label layout and control sender visibility before printing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label htmlFor="totalBoxes" className="text-sm font-medium">
                  Total Boxes:
                </label>
                <input
                  id="totalBoxes"
                  type="number"
                  min="1"
                  max="100"
                  value={totalBoxes}
                  onChange={(e) => setTotalBoxes(Math.max(1, Math.min(100, Number.parseInt(e.target.value) || 1)))}
                  className="w-16 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Printer Type:</Label>
                <RadioGroup value={printerType} onValueChange={setPrinterType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="label" id="printer-label" />
                    <Label htmlFor="printer-label" className="text-sm">
                      Label Printer (4x6 inch)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="a4" id="printer-a4" />
                    <Label htmlFor="printer-a4" className="text-sm">
                      A4 Printer (4 labels/page)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <Label className="text-sm font-medium mb-2 block">Sender Visibility on Label:</Label>
                <RadioGroup value={labelSenderOption} onValueChange={setLabelSenderOption}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="without" id="label-sender-without" />
                    <Label htmlFor="label-sender-without" className="text-sm">
                      Without sender details
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with" id="label-sender-with" />
                    <Label htmlFor="label-sender-with" className="text-sm">
                      With sender details
                    </Label>
                  </div>
                </RadioGroup>
                <p className="mt-2 text-xs text-slate-600">
                  Default is without sender. Turn it on only when the full sender block should appear on the printed label.
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600 mt-4">
              <p>• {getLayoutDescription()}</p>
              <p>• Includes logo and barcode</p>
              {isEcommerce() && <p>• Product details with HSN codes</p>}
            </div>

            <div className="mt-3 rounded-lg border p-2">
              <p className="text-xs text-slate-700">
                {printerType === "label" ? "Thermal label format (4x6 inch)" : "A4 format with 4 labels per page"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleLabelsPrint}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Print Labels Only
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Authorization Letter
            </CardTitle>
            <CardDescription>Select courier authorization letter type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="authorizationType" className="text-sm font-medium mb-2 block">
                  Letter Type:
                </label>
                <Select value={authorizationType} onValueChange={setAuthorizationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authorization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dhl">DHL Authorization Letter</SelectItem>
                    <SelectItem value="fedex">FedEx Authorization Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authorizationType && (
                <div className="flex items-center gap-2">
                  <label htmlFor="authorizationCopies" className="text-sm font-medium">
                    Number of Copies:
                  </label>
                  <input
                    id="authorizationCopies"
                    type="number"
                    min="1"
                    max="10"
                    value={authorizationCopies}
                    onChange={(e) =>
                      setAuthorizationCopies(Math.max(1, Math.min(10, Number.parseInt(e.target.value) || 1)))
                    }
                    className="w-16 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-4">
              <p>
                •{" "}
                {authorizationType === "dhl"
                  ? "DHL Express India authorization"
                  : authorizationType === "fedex"
                    ? "FedEx Express authorization"
                    : "Select a courier service"}
              </p>
              <p>• Required for customs clearance</p>
              <p>• Each copy on separate page</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleAuthorizationPrint}
              disabled={!authorizationType || authorizationCopies === 0}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Print Authorization Only
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Non-Hazardous Certificate
            </CardTitle>
            <CardDescription>One-page A4 declaration for air cargo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-900">Route</p>
                <p>{[awbData?.sender?.city, awbData?.sender?.country].filter(Boolean).join(", ") || "India"} to {[awbData?.receiver?.city, awbData?.receiver?.country].filter(Boolean).join(", ") || awbData?.receiver?.country || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Content</p>
                <p>{(awbData?.boxes || []).flatMap((box) => box.items || []).map((item) => item.name).filter(Boolean).slice(0, 3).join(", ") || awbData?.parcelType || "Goods as per invoice"}</p>
              </div>
              <p>Auto-fills consignor, consignee, airport route, AWB, package count, weight, and item details.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleNonHazardousPrint}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Print Certificate Only
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              KYC Document
            </CardTitle>
            <CardDescription>View and print KYC verification document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">{formattedKycType || "KYC Document"}</p>
                <p className="text-gray-600">{awbData?.sender?.kyc?.kyc || "No KYC Number"}</p>
              </div>

              {kycLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading KYC document...
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-4">
              <p>
                • Status:{" "}
                {kycDocumentUrl
                  ? "✅ Document available"
                  : awbData?.sender?.kyc?.document
                    ? "⚠️ Loading..."
                    : "❌ No document"}
              </p>
              <p>• PDF format from Google Drive</p>
              <p>• Opens in a new window for printing</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={openKycDocument}
              disabled={!kycDocumentUrl}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <ExternalLink className="h-4 w-4" />
              View & Print KYC Document
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-6" />

      <div className="text-center">
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3 text-[#232C65]">Print Summary</h2>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div
              className={`p-3 rounded ${selectedDocuments.invoice ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"} border`}
            >
              <p className="font-medium">
                {selectedDocuments.invoice ? "✅" : "❌"} Invoices:{" "}
                {selectedDocuments.invoice ? `${invoiceCopies} copies` : "Not selected"}
              </p>
              <p className="text-gray-600">A4 format, each on separate page</p>
            </div>
            <div
              className={`p-3 rounded ${selectedDocuments.labels ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"} border`}
            >
              <p className="font-medium">
                {selectedDocuments.labels ? "✅" : "❌"} Labels:{" "}
                {selectedDocuments.labels ? `${getLabelCount()} labels` : "Not selected"}
              </p>
              <p className="text-gray-600">
                {printerType === 'label' ? '4x6 inch thermal format' : `A4 format (${Math.ceil(getLabelCount() / 4)} pages)`}
              </p>
              {isEcommerce() && selectedDocuments.labels && (
                <p className="text-xs text-purple-600">With product details</p>
              )}
            </div>
            <div
              className={`p-3 rounded ${selectedDocuments.authorization && authorizationType ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"} border`}
            >
              <p className="font-medium">
                {selectedDocuments.authorization && authorizationType ? "✅" : "❌"} Authorization:{" "}
                {selectedDocuments.authorization && authorizationType
                  ? `${authorizationCopies} copies`
                  : "Not selected"}
              </p>
              <p className="text-gray-600">
                {selectedDocuments.authorization && authorizationType
                  ? `${authorizationType.toUpperCase()} letter`
                  : "No authorization letter"}
              </p>
            </div>
            <div
              className={`p-3 rounded ${selectedDocuments.nonHazardous ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"} border`}
            >
              <p className="font-medium">
                {selectedDocuments.nonHazardous ? "Ready" : "Not selected"} Non-Hazardous Certificate
              </p>
              <p className="text-gray-600">One A4 page, auto-filled shipment details</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>Print order: Invoices, Labels, Authorization Letters, Non-Hazardous Certificate</p>
            <p className="mt-1 font-medium text-sm text-blue-600">
              Note: KYC Document must be printed separately using the "View & Print KYC Document" button
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            onClick={handleCombinedPrint}
            size="lg"
            className="flex items-center gap-2 bg-[#232C65] hover:bg-[#1a2150] px-8 py-3"
          >
            <Printer className="h-5 w-5" />
            Print Selected Documents
          </Button>

          <Button
            onClick={openKycDocument}
            disabled={!kycDocumentUrl}
            size="lg"
            variant="outline"
            className="flex items-center gap-2 px-8 py-3"
          >
            <ExternalLink className="h-5 w-5" />
            Open KYC Document
          </Button>
        </div>
      </div>

      <div className="hidden">
        <div ref={invoiceRef} className="printableArea bg-white p-1 border border-gray-200 rounded-lg shadow-sm">
        </div>
        <div ref={labelRef}></div>
      </div>

      <Dialog open={showCustomSenderDialog} onOpenChange={setShowCustomSenderDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Sender Details</DialogTitle>
            <DialogDescription>
              Enter the sender details you want to use for the invoice. These details will replace the original sender information.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Sender Name *</Label>
                <Input
                  id="custom-name"
                  value={customSenderDetails.name}
                  onChange={(e) => handleCustomSenderChange("name", e.target.value)}
                  placeholder="Enter sender name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-company">Company Name</Label>
                <Input
                  id="custom-company"
                  value={customSenderDetails.companyName}
                  onChange={(e) => handleCustomSenderChange("companyName", e.target.value)}
                  placeholder="Enter company name (optional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-address">Address *</Label>
              <Textarea
                id="custom-address"
                value={customSenderDetails.address}
                onChange={(e) => handleCustomSenderChange("address", e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-city">City</Label>
                <Input
                  id="custom-city"
                  value={customSenderDetails.city}
                  onChange={(e) => handleCustomSenderChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-zip">Zip Code *</Label>
                <Input
                  id="custom-zip"
                  value={customSenderDetails.zip}
                  onChange={(e) => handleCustomSenderChange("zip", e.target.value)}
                  placeholder="Enter zip code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-country">Country *</Label>
                <Input
                  id="custom-country"
                  value={customSenderDetails.country}
                  onChange={(e) => handleCustomSenderChange("country", e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-contact">Contact Number *</Label>
                <Input
                  id="custom-contact"
                  value={customSenderDetails.contact}
                  onChange={(e) => handleCustomSenderChange("contact", e.target.value)}
                  placeholder="Enter contact number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-email">Email *</Label>
                <Input
                  id="custom-email"
                  type="email"
                  value={customSenderDetails.email}
                  onChange={(e) => handleCustomSenderChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-kyc-type">KYC Document Type</Label>
                <Select
                  value={customSenderDetails.kycType}
                  onValueChange={(value) => handleCustomSenderChange("kycType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select KYC type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aadhaar No - ">Aadhaar Card</SelectItem>
                    <SelectItem value="Pan No - ">PAN Card</SelectItem>
                    <SelectItem value="Passport No - ">Passport</SelectItem>
                    <SelectItem value="Driving License No - ">Driving License</SelectItem>
                    <SelectItem value="Voter ID Card No - ">Voter ID Card</SelectItem>
                    <SelectItem value="GST No - ">GST Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-kyc-number">KYC Number *</Label>
                <Input
                  id="custom-kyc-number"
                  value={customSenderDetails.kycNumber}
                  onChange={(e) => handleCustomSenderChange("kycNumber", e.target.value)}
                  placeholder="Enter KYC number"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={resetCustomSenderDetails}>
              Reset to Original
            </Button>
            <Button onClick={() => setShowCustomSenderDialog(false)}>
              Save Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default forwardRef(EnhancedShippingPage)
