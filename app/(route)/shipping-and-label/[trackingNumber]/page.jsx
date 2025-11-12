"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Loader2, Printer, FileText, Package, FileCheck, Upload, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format } from "date-fns"
import JsBarcode from "jsbarcode"

export default function EnhancedShippingPage() {
  const { trackingNumber } = useParams()
  const [awbData, setAwbData] = useState(null)
  const [formattedKycType, setFormattedKycType] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const invoiceRef = useRef(null)
  const labelRef = useRef(null)
  const [invoiceCopies, setInvoiceCopies] = useState(1)
  const [totalBoxes, setTotalBoxes] = useState(1)
  const [authorizationType, setAuthorizationType] = useState("")
  const [authorizationCopies, setAuthorizationCopies] = useState(1)
  const [kycDocumentUrl, setKycDocumentUrl] = useState(null)
  const [kycLoading, setKycLoading] = useState(false)

  // New state for document selection and label options
  const [selectedDocuments, setSelectedDocuments] = useState({
    invoice: true,
    labels: true,
    authorization: true,
  })
  const [labelPrintOption, setLabelPrintOption] = useState("receiver-only") // "receiver-only" or "sender-receiver"

  useEffect(() => {
    const fetchAWBData = async () => {
      console.log(`AWB fetching data ${trackingNumber}`)
      setLoading(true)
      try {
        const response = await axios.get(`/api/awb/${trackingNumber}`)
        setAwbData(response.data[0])
        setTotalBoxes(response.data[0]?.boxes.length || 1)
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

        // Process KYC document URL if available
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

  // Function to convert number to words
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

  // Calculate total amount
  const calculateTotal = () => {
    if (!awbData || !awbData.boxes) return 0

    let total = 0
    awbData.boxes.forEach((box) => {
      box.items.forEach((item) => {
        total += Number(item.price) * Number(item.quantity)
      })
    })

    return total
  }

  const generateInvoiceHTML = () => {
    const totalAmount = calculateTotal()
    const amountInWords =
      numberToWords(Math.round(totalAmount)) + " " + (awbData.shippingCurrency === "₹" ? "Rupees" : "Dollars") + " Only"

    return `
          <div class="text-center mb-6">
              <h1 class="text-2xl font-bold">SHIPPING INVOICE</h1>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6 text-[12px]">
              <div>
                  <p><strong>Date:</strong> ${awbData.date ? format(new Date(awbData.date), "dd/MM/yyyy") : "N/A"}</p>
                  <p><strong>Pre Carriage By:</strong> ${awbData.via || "N/A"}</p>
                  <p><strong>Vessel/Flight No:</strong> ${awbData.forwardingNo || "N/A"}</p>
                  <p><strong>Port of Discharge:</strong> ${awbData.sender?.country || "N/A"}</p>
                  <p><strong>Country of Origin of Goods:</strong> ${awbData.sender?.country || "INDIA"}</p>
              </div>
              <div>
                  <p><strong>EXP. REF-</strong> ${awbData.trackingNumber}</p>
                  <p><strong>Place of Receipt by Pre-carrier:</strong></p>
                  <p><strong>Port of Loading:</strong> ${awbData.sender?.country || "N/A"}</p>
                  <p><strong>Final Destination:</strong> ${awbData.receiver?.country || "N/A"}</p>
                  <p><strong>Country of Final Destination:</strong> ${awbData.receiver?.country || "N/A"}</p>
              </div>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-6 text-[12px]">
              <div class="border border-gray-300 p-1 rounded-lg">
                  <h2 class="font-bold mb-2">Sender:</h2>
                  <p class="font-bold uppercase">${awbData.sender?.name}</p>
                  ${awbData.sender?.companyName ? `<p class="font-bold uppercase">C/O ${awbData.sender?.companyName}</p>` : ""}
                  <p>${awbData.sender?.address}</p>
                  <p class="flex flex-row gap-2">
                      <strong>Zip Code:</strong> ${awbData.sender?.zip}
                      <strong>Country:</strong>${awbData.sender?.country}
                  </p>
                  <p><strong>Cont No:</strong> ${awbData.sender?.contact}</p>
                  <p><strong>Email:</strong> ${awbData.sender?.email || "info@kargoone.com"}</p>
                  <p><strong>${awbData.sender.kyc.type}</strong> ${awbData.sender.kyc.kyc}</p>
              </div>
              <div class="border border-gray-300 rounded-lg p-1">
                  <h2 class="font-bold mb-2">Receiver:</h2>
                  <p class="font-bold uppercase">${awbData.receiver?.name}</p>
                  ${awbData.receiver?.companyName ? `<p class="font-bold uppercase">C/O ${awbData.receiver?.companyName}</p>` : ""}
                  <p>${awbData.receiver?.address}</p>
                  <p class="flex flex-row gap-2">
                      <strong>Zip Code:</strong> ${awbData.receiver?.zip}
                      <strong>Country:</strong>${awbData.receiver?.country}
                  </p>
                  <p><strong>Cont No:</strong> ${awbData.receiver?.contact}</p>
                  <p><strong>Email:</strong> ${awbData.receiver?.email || "info@kargoone.com"}</p>
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
                        Box No ${boxIndex + 1}
                    </td>
                </tr>`,
                ...box.items.map(
                  (item, itemIndex) => `
                    <tr>
                        <td class="border border-gray-300 px-2 w-[10px]">${itemIndex + 1}</td>
                        <td class="border border-gray-300 px-2">${item.name}</td>
                        <td class="border border-gray-300 px-2 w-[80px] text-center">${item.hsnCode || "N/A"}</td>
                        <td class="border border-gray-300 px-2 w-[20px]">${item.quantity}</td>
                        <td class="border border-gray-300 px-2 w-[40px] whitespace-nowrap">
                            ${awbData.shippingCurrency || "₹"}${item.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="border border-gray-300 px-2 w-[40px] whitespace-nowrap">
                            ${awbData.shippingCurrency || "₹"}${(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  const generateLabelHTML = (boxNumber, includeSender = false) => {
    if (includeSender) {
      return `
        <div class="barcode-top-right">
            <svg class="barcode-svg" data-box="${boxNumber}"></svg>
        </div>
        <div class="sender-receiver-section">
            <div class="sender-section">
                <h2 class="font-bold mb-2">Sender:</h2>
                <p class="font-bold uppercase">${awbData?.sender?.name || ""}</p>
                ${awbData?.sender?.companyName ? `<p class="font-bold uppercase">C/O ${awbData?.sender?.companyName}</p>` : ""}
                <p>${awbData?.sender?.address || ""}</p>
                <div class="contact-info">
                    <p><strong>Zip:</strong> ${awbData?.sender?.zip || ""}</p>
                    <p><strong>Country:</strong> ${awbData?.sender?.country || ""}</p>
                </div>
                <p>Cont: ${awbData?.sender?.contact || ""}</p>
            </div>
            <div class="receiver-section">
                <h2 class="font-bold mb-2">Receiver:</h2>
                <p class="font-bold uppercase">${awbData?.receiver?.name || ""}</p>
                ${awbData?.receiver?.companyName ? `<p class="font-bold uppercase">C/O ${awbData?.receiver?.companyName}</p>` : ""}
                <p>${awbData?.receiver?.address || ""}</p>
                <div class="contact-info">
                    <p><strong>Zip:</strong> ${awbData?.receiver?.zip || ""}</p>
                    <p><strong>Country:</strong> ${awbData?.receiver?.country || ""}</p>
                </div>
                <p>Cont: ${awbData?.receiver?.contact || ""}</p>
            </div>
        </div>
        <div class="barcode-bottom">
            <svg class="barcode-svg-bottom" data-box="${boxNumber}"></svg>
        </div>
      `
    } else {
      return `
        <div class="barcode-top-right">
            <svg class="barcode-svg" data-box="${boxNumber}"></svg>
        </div>
        <div class="address-section">
            <h2 class="font-bold mb-2">Receiver:</h2>
            <p class="font-bold uppercase">${awbData?.receiver?.name || ""}</p>
            ${awbData?.receiver?.companyName ? `<p class="font-bold uppercase">C/O ${awbData?.receiver?.companyName}</p>` : ""}
            <p>${awbData?.receiver?.address || ""}</p>
            <div class="contact-info">
                <p><strong>Zip Code:</strong> ${awbData?.receiver?.zip || ""}</p>
                <p><strong>Country:</strong> ${awbData?.receiver?.country || ""}</p>
            </div>
            <p>Cont No: ${awbData?.receiver?.contact || ""}</p>
        </div>
      `
    }
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
                        <p class="mb-2"><strong>GSTIN:${awbData?.sender?.companyName ? awbData?.sender?.kyc.kyc : "________________"}</strong></p>
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
                        <p class="mb-2"><strong>Mobile No:${awbData?.sender?.companyName ? awbData?.sender?.contact : "________________"}</strong></p>
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
                        <p class="mb-2"><strong>Name:</strong> ${awbData?.sender?.companyName ? "________________" : awbData?.sender?.name}</p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>KYC Document:</strong>  ${awbData?.sender?.companyName ? "________________" : formattedKycType}</p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>KYC Document No:</strong>${awbData?.sender?.companyName ? "________________" : awbData?.sender?.kyc?.kyc}</p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Signature:__________________</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-2"><strong>Date:<span class="underline underline-offset-2">${awbData?.sender?.companyName ? "________________" : format(new Date(), "dd/MM/yyyy")}</strong></p>
                    </div>
                    
                    <div class="mb-2">
                        <p class="mb-4"><strong>Mobile No:</strong>${awbData?.sender?.companyName ? "________________" : awbData?.sender?.contact}</p>
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

  const generatePageLayout = (boxesOnPage, startBox, includeSender = false) => {
    const boxCount = Math.min(boxesOnPage, 4)

    if (boxCount === 1) {
      if (includeSender) {
        return `
          <div class="page">
              <div class="label-full-sender">
                  <div class="sender-half">
                      ${generateLabelHTML(startBox, false).replace("Receiver:", "Sender:").replace(awbData?.receiver?.name, awbData?.sender?.name).replace(awbData?.receiver?.companyName, awbData?.sender?.companyName).replace(awbData?.receiver?.address, awbData?.sender?.address).replace(awbData?.receiver?.zip, awbData?.sender?.zip).replace(awbData?.receiver?.country, awbData?.sender?.country).replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                  </div>
                  <div class="receiver-half">
                      ${generateLabelHTML(startBox, false)}
                  </div>
              </div>
          </div>
        `
      } else {
        return `
          <div class="page">
              <div class="label-full">
                  ${generateLabelHTML(startBox)}
              </div>
          </div>
        `
      }
    } else if (boxCount === 2) {
      if (includeSender) {
        return `
          <div class="page">
              <div class="label-half-sender">
                  <div class="sender-quarter">
                      ${generateLabelHTML(startBox, false).replace("Receiver:", "Sender:").replace(awbData?.receiver?.name, awbData?.sender?.name).replace(awbData?.receiver?.companyName, awbData?.sender?.companyName).replace(awbData?.receiver?.address, awbData?.sender?.address).replace(awbData?.receiver?.zip, awbData?.sender?.zip).replace(awbData?.receiver?.country, awbData?.sender?.country).replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                  </div>
                  <div class="receiver-quarter">
                      ${generateLabelHTML(startBox, false)}
                  </div>
              </div>
              <div class="label-half-sender">
                  <div class="sender-quarter">
                      ${generateLabelHTML(startBox + 1, false)
                        .replace("Receiver:", "Sender:")
                        .replace(awbData?.receiver?.name, awbData?.sender?.name)
                        .replace(awbData?.receiver?.companyName, awbData?.sender?.companyName)
                        .replace(awbData?.receiver?.address, awbData?.sender?.address)
                        .replace(awbData?.receiver?.zip, awbData?.sender?.zip)
                        .replace(awbData?.receiver?.country, awbData?.sender?.country)
                        .replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                  </div>
                  <div class="receiver-quarter">
                      ${generateLabelHTML(startBox + 1, false)}
                  </div>
              </div>
          </div>
        `
      } else {
        return `
          <div class="page">
              <div class="label-half">
                  ${generateLabelHTML(startBox)}
              </div>
              <div class="label-half">
                  ${generateLabelHTML(startBox + 1)}
              </div>
          </div>
        `
      }
    } else if (boxCount === 3) {
      if (includeSender) {
        return `
          <div class="page">
              <div class="top-half">
                  <div class="label-quarter-sender">
                      <div class="sender-eighth">
                          ${generateLabelHTML(startBox, false).replace("Receiver:", "Sender:").replace(awbData?.receiver?.name, awbData?.sender?.name).replace(awbData?.receiver?.companyName, awbData?.sender?.companyName).replace(awbData?.receiver?.address, awbData?.sender?.address).replace(awbData?.receiver?.zip, awbData?.sender?.zip).replace(awbData?.receiver?.country, awbData?.sender?.country).replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                      </div>
                      <div class="receiver-eighth">
                          ${generateLabelHTML(startBox, false)}
                      </div>
                  </div>
                  <div class="label-quarter-sender">
                      <div class="sender-eighth">
                          ${generateLabelHTML(startBox + 1, false)
                            .replace("Receiver:", "Sender:")
                            .replace(awbData?.receiver?.name, awbData?.sender?.name)
                            .replace(awbData?.receiver?.companyName, awbData?.sender?.companyName)
                            .replace(awbData?.receiver?.address, awbData?.sender?.address)
                            .replace(awbData?.receiver?.zip, awbData?.sender?.zip)
                            .replace(awbData?.receiver?.country, awbData?.sender?.country)
                            .replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                      </div>
                      <div class="receiver-eighth">
                          ${generateLabelHTML(startBox + 1, false)}
                      </div>
                  </div>
              </div>
              <div class="bottom-half">
                  <div class="label-half-full">
                      ${generateLabelHTML(startBox + 2)}
                  </div>
              </div>
          </div>
        `
      } else {
        return `
          <div class="page">
              <div class="top-half">
                  <div class="label-quarter">
                      ${generateLabelHTML(startBox)}
                  </div>
                  <div class="label-quarter">
                      ${generateLabelHTML(startBox + 1)}
                  </div>
              </div>
              <div class="bottom-half">
                  <div class="label-half-full">
                      ${generateLabelHTML(startBox + 2)}
                  </div>
              </div>
          </div>
        `
      }
    } else if (boxCount === 4) {
      if (includeSender) {
        return `
          <div class="page">
              <div class="top-half">
                  <div class="label-quarter-sender">
                      <div class="sender-eighth">
                          ${generateLabelHTML(startBox, false).replace("Receiver:", "Sender:").replace(awbData?.receiver?.name, awbData?.sender?.name).replace(awbData?.receiver?.companyName, awbData?.sender?.companyName).replace(awbData?.receiver?.address, awbData?.sender?.address).replace(awbData?.receiver?.zip, awbData?.sender?.zip).replace(awbData?.receiver?.country, awbData?.sender?.country).replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                      </div>
                      <div class="receiver-eighth">
                          ${generateLabelHTML(startBox, false)}
                      </div>
                  </div>
                  <div class="label-quarter-sender">
                      <div class="sender-eighth">
                          ${generateLabelHTML(startBox + 1, false)
                            .replace("Receiver:", "Sender:")
                            .replace(awbData?.receiver?.name, awbData?.sender?.name)
                            .replace(awbData?.receiver?.companyName, awbData?.sender?.companyName)
                            .replace(awbData?.receiver?.address, awbData?.sender?.address)
                            .replace(awbData?.receiver?.zip, awbData?.sender?.zip)
                            .replace(awbData?.receiver?.country, awbData?.sender?.country)
                            .replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                      </div>
                      <div class="receiver-eighth">
                          ${generateLabelHTML(startBox + 1, false)}
                      </div>
                  </div>
              </div>
              <div class="bottom-half">
                  <div class="label-quarter-sender">
                      <div class="sender-eighth">
                          ${generateLabelHTML(startBox + 2, false)
                            .replace("Receiver:", "Sender:")
                            .replace(awbData?.receiver?.name, awbData?.sender?.name)
                            .replace(awbData?.receiver?.companyName, awbData?.sender?.companyName)
                            .replace(awbData?.receiver?.address, awbData?.sender?.address)
                            .replace(awbData?.receiver?.zip, awbData?.sender?.zip)
                            .replace(awbData?.receiver?.country, awbData?.sender?.country)
                            .replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                      </div>
                      <div class="receiver-eighth">
                          ${generateLabelHTML(startBox + 2, false)}
                      </div>
                  </div>
                  <div class="label-quarter-sender">
                      <div class="sender-eighth">
                          ${generateLabelHTML(startBox + 3, false)
                            .replace("Receiver:", "Sender:")
                            .replace(awbData?.receiver?.name, awbData?.sender?.name)
                            .replace(awbData?.receiver?.companyName, awbData?.sender?.companyName)
                            .replace(awbData?.receiver?.address, awbData?.sender?.address)
                            .replace(awbData?.receiver?.zip, awbData?.sender?.zip)
                            .replace(awbData?.receiver?.country, awbData?.sender?.country)
                            .replace(awbData?.receiver?.contact, awbData?.sender?.contact)}
                      </div>
                      <div class="receiver-eighth">
                          ${generateLabelHTML(startBox + 3, false)}
                      </div>
                  </div>
              </div>
          </div>
        `
      } else {
        return `
          <div class="page">
              <div class="top-half">
                  <div class="label-quarter">
                      ${generateLabelHTML(startBox)}
                  </div>
                  <div class="label-quarter">
                      ${generateLabelHTML(startBox + 1)}
                  </div>
              </div>
              <div class="bottom-half">
                  <div class="label-quarter">
                      ${generateLabelHTML(startBox + 2)}
                  </div>
                  <div class="label-quarter">
                      ${generateLabelHTML(startBox + 3)}
                  </div>
              </div>
          </div>
        `
      }
    }
  }

  const renderBarcodes = (includeSender = false) => {
    setTimeout(() => {
      const barcodeElements = document.querySelectorAll(".barcode-svg, .barcode-svg-bottom")
      barcodeElements.forEach((element) => {
        const boxNumber = element.getAttribute("data-box")

        let barcodeHeight = 40
        let barcodeWidth = 1.2

        const labelParent = element.closest(
          ".label-full, .label-half, .label-quarter, .label-half-full, .label-full-sender, .label-half-sender, .label-quarter-sender, .sender-half, .receiver-half, .sender-quarter, .receiver-quarter, .sender-eighth, .receiver-eighth",
        )

        if (
          labelParent?.classList.contains("label-full") ||
          labelParent?.classList.contains("sender-half") ||
          labelParent?.classList.contains("receiver-half")
        ) {
          barcodeHeight = 60
          barcodeWidth = 2
        } else if (
          labelParent?.classList.contains("label-half") ||
          labelParent?.classList.contains("label-half-full") ||
          labelParent?.classList.contains("sender-quarter") ||
          labelParent?.classList.contains("receiver-quarter")
        ) {
          barcodeHeight = 45
          barcodeWidth = 1.5
        } else if (
          labelParent?.classList.contains("label-quarter") ||
          labelParent?.classList.contains("sender-eighth") ||
          labelParent?.classList.contains("receiver-eighth")
        ) {
          barcodeHeight = 35
          barcodeWidth = 1
        }

        JsBarcode(element, awbData?.trackingNumber || "N/A", {
          format: "CODE128",
          width: barcodeWidth,
          height: barcodeHeight,
          displayValue: false,
          fontSize: 0,
          margin: 2,
        })
      })
    }, 200)
  }

  // Individual print functions
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
    const includeSender = labelPrintOption === "sender-receiver"

    const totalPages = Math.ceil(totalBoxes / 4)
    let allLabels = ""

    for (let page = 0; page < totalPages; page++) {
      const startBox = page * 4 + 1
      const boxesOnThisPage = Math.min(4, totalBoxes - page * 4)

      allLabels += generatePageLayout(boxesOnThisPage, startBox, includeSender)

      if (page < totalPages - 1) {
        allLabels += '<div class="page-break"></div>'
      }
    }

    document.body.innerHTML = `
      <style>
        ${getCommonStyles()}
      </style>
      ${allLabels}
    `

    renderBarcodes(includeSender)

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

  const handleCombinedPrint = () => {
    const originalContent = document.body.innerHTML
    const includeSender = labelPrintOption === "sender-receiver"

    let combinedContent = ""

    // Generate invoice copies if selected
    if (selectedDocuments.invoice && invoiceCopies > 0) {
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
      combinedContent += allInvoices
    }

    // Add page break between invoices and labels
    if (selectedDocuments.invoice && invoiceCopies > 0 && selectedDocuments.labels && totalBoxes > 0) {
      combinedContent += '<div class="page-break"></div>'
    }

    // Generate label pages if selected
    if (selectedDocuments.labels && totalBoxes > 0) {
      const totalPages = Math.ceil(totalBoxes / 4)
      let allLabels = ""

      for (let page = 0; page < totalPages; page++) {
        const startBox = page * 4 + 1
        const boxesOnThisPage = Math.min(4, totalBoxes - page * 4)

        allLabels += generatePageLayout(boxesOnThisPage, startBox, includeSender)

        if (page < totalPages - 1) {
          allLabels += '<div class="page-break"></div>'
        }
      }
      combinedContent += allLabels
    }

    // Add page break between labels and authorization
    if (
      ((selectedDocuments.invoice && invoiceCopies > 0) || (selectedDocuments.labels && totalBoxes > 0)) &&
      selectedDocuments.authorization &&
      authorizationType &&
      authorizationCopies > 0
    ) {
      combinedContent += '<div class="page-break"></div>'
    }

    // Generate authorization letters if selected
    if (selectedDocuments.authorization && authorizationType && authorizationCopies > 0) {
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
      combinedContent += allAuthorizations
    }

    if (!combinedContent) {
      alert("Please select at least one document type to print.")
      return
    }

    document.body.innerHTML = `
      <style>
        ${getCommonStyles()}
      </style>
      ${combinedContent}
    `

    renderBarcodes(includeSender)

    setTimeout(() => {
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }, 500)
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
  
  /* Invoice Styles */
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

  .invoice-page .text-center {
    text-align: center;
  }

  .invoice-page .grid {
    display: grid;
  }

  .invoice-page .grid-cols-2 {
    grid-template-columns: 1fr 1fr;
  }

  .invoice-page .gap-4 {
    gap: 12px;
  }

  .invoice-page .gap-2 {
    gap: 6px;
  }

  .invoice-page .mb-6 {
    margin-bottom: 16px;
  }

  .invoice-page .mb-2 {
    margin-bottom: 6px;
  }

  .invoice-page .mt-2 {
    margin-top: 6px;
  }

  .invoice-page .p-1 {
    padding: 3px;
  }

  .invoice-page .px-2 {
    padding-left: 6px;
    padding-right: 6px;
  }

  .invoice-page .border {
    border: 1px solid #d1d5db;
  }

  .invoice-page .border-gray-300 {
    border-color: #d1d5db;
  }

  .invoice-page .border-gray-400 {
    border-color: #9ca3af;
  }

  .invoice-page .rounded-lg {
    border-radius: 6px;
  }

  .invoice-page .font-bold {
    font-weight: bold;
  }

  .invoice-page .uppercase {
    text-transform: uppercase;
  }

  .invoice-page .text-right {
    text-align: right;
  }

  .invoice-page .text-center {
    text-align: center;
  }

  .invoice-page .text-justify {
    text-align: justify;
  }

  .invoice-page .italic {
    font-style: italic;
  }

  .invoice-page .flex {
    display: flex;
  }

  .invoice-page .flex-row {
    flex-direction: row;
  }

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

  .invoice-page .bg-gray-100 {
    background-color: #f3f4f6;
  }
  
  .invoice-page .bg-gray-200 {
    background-color: #e5e7eb;
  }
  
  .invoice-page .whitespace-nowrap {
    white-space: nowrap;
  }
  
  .invoice-page .border-t {
    border-top: 1px solid #9ca3af;
  }
  
  .invoice-page .ml-auto {
    margin-left: auto;
  }
  
  .invoice-page .mr-4 {
    margin-right: 12px;
  }
  
  .invoice-page .mr-12 {
    margin-right: 36px;
  }
  
  .invoice-page .pt-1 {
    padding-top: 3px;
  }
  
  .invoice-page .h-10 {
    height: 30px;
  }
  
  .invoice-page .w-48 {
    width: 144px;
  }

  .invoice-page .declaration-section {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #9ca3af;
  }

  .invoice-page .signature-section {
    margin-top: 8px;
  }
  
  /* Label Styles */
  .page {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    page-break-inside: avoid;
  }
  
  .label-full {
    width: 100%;
    height: 100%;
    border: 2px solid #000;
    border-radius: 15px;
    padding: 20px;
    position: relative;
    background: white;
  }

  .label-full-sender {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sender-half, .receiver-half {
    width: 100%;
    height: calc(50% - 5px);
    border: 2px solid #000;
    border-radius: 10px;
    padding: 15px;
    position: relative;
    background: white;
  }
  
  .label-half {
    width: 100%;
    height: calc(50% - 5px);
    border: 2px solid #000;
    border-radius: 10px;
    padding: 15px;
    position: relative;
    margin-bottom: 10px;
    background: white;
  }

  .label-half-sender {
    width: 100%;
    height: calc(50% - 5px);
    display: flex;
    flex-direction: row;
    gap: 10px;
    margin-bottom: 10px;
  }

  .sender-quarter, .receiver-quarter {
    width: calc(50% - 5px);
    height: 100%;
    border: 2px solid #000;
    border-radius: 8px;
    padding: 12px;
    position: relative;
    background: white;
  }
  
  .label-half:last-child {
    margin-bottom: 0;
  }
  
  .top-half, .bottom-half {
    width: 100%;
    height: calc(50% - 5px);
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
  
  .bottom-half {
    margin-top: 10px;
  }
  
  .label-quarter {
    width: calc(50% - 5px);
    height: 100%;
    border: 2px solid #000;
    border-radius: 8px;
    padding: 12px;
    position: relative;
    background: white;
  }

  .label-quarter-sender {
    width: calc(50% - 5px);
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .sender-eighth, .receiver-eighth {
    width: 100%;
    height: calc(50% - 2.5px);
    border: 2px solid #000;
    border-radius: 6px;
    padding: 8px;
    position: relative;
    background: white;
  }
  
  .label-half-full {
    width: 100%;
    height: 100%;
    border: 2px solid #000;
    border-radius: 10px;
    padding: 15px;
    position: relative;
    background: white;
  }
  
  .address-section {
    width: 70%;
    padding-top: 10px;
  }

  .sender-receiver-section {
    display: flex;
    flex-direction: column;
    height: calc(100% - 60px);
    gap: 10px;
  }

  .sender-section, .receiver-section {
    flex: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  .barcode-top-right {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 25%;
    text-align: right;
  }

  .barcode-bottom {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 25%;
    text-align: right;
  }
  
  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  /* Responsive font sizes for labels */
  .label-full h2 { font-size: 28pt; margin: 0 0 10px 0; }
  .label-full p { font-size: 24pt; margin: 4px 0; line-height: 1.2; }

  .sender-half h2, .receiver-half h2 { font-size: 20pt; margin: 0 0 8px 0; }
  .sender-half p, .receiver-half p { font-size: 18pt; margin: 3px 0; line-height: 1.2; }
  
  .label-half h2 { font-size: 20pt; margin: 0 0 8px 0; }
  .label-half p { font-size: 18pt; margin: 3px 0; line-height: 1.2; }

  .sender-quarter h2, .receiver-quarter h2 { font-size: 14pt; margin: 0 0 6px 0; }
  .sender-quarter p, .receiver-quarter p { font-size: 12pt; margin: 2px 0; line-height: 1.1; }
  
  .label-half-full h2 { font-size: 20pt; margin: 0 0 8px 0; }
  .label-half-full p { font-size: 18pt; margin: 3px 0; line-height: 1.2; }
  
  .label-quarter h2 { font-size: 14pt; margin: 0 0 6px 0; }
  .label-quarter p { font-size: 12pt; margin: 2px 0; line-height: 1.1; }

  .sender-eighth h2, .receiver-eighth h2 { font-size: 10pt; margin: 0 0 4px 0; }
  .sender-eighth p, .receiver-eighth p { font-size: 8pt; margin: 1px 0; line-height: 1.0; }
  
  .address-section p {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .address-section .font-bold {
    font-weight: bold;
  }
  
  .address-section .uppercase {
    text-transform: uppercase;
  }
  
  /* Authorization Letter Styles */
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
  
  .auth-page .text-center {
    text-align: center;
  }
  
  .auth-page .text-justify {
    text-align: justify;
  }
  
  .auth-page .text-right {
    text-align: right;
  }
  
  .auth-page .font-bold {
    font-weight: bold;
  }
  
  .auth-page .text-lg {
    font-size: 18px;
  }
  
  .auth-page .mb-2 {
    margin-bottom: 8px;
  }
  
  .auth-page .mb-4 {
    margin-bottom: 16px;
  }
  
  .auth-page .mb-6 {
    margin-bottom: 24px;
  }
  
  .auth-page .mb-8 {
    margin-bottom: 32px;
  }
  
  .auth-page .mt-2 {
    margin-top: 8px;
  }
  
  .auth-page .mt-8 {
    margin-top: 32px;
  }
  
  .auth-page .grid {
    display: grid;
  }
  
  .auth-page .grid-cols-2 {
    grid-template-columns: 1fr 1fr;
  }
  
  .auth-page .gap-8 {
    gap: 32px;
  }
  
  .auth-page .border {
    border: 1px solid #666;
  }
  
  .auth-page .border-b {
    border-bottom: 1px solid #666;
  }
  
  .auth-page .border-gray-400 {
    border-color: #9ca3af;
  }
  
  .auth-page .h-6 {
    height: 24px;
  }
  
  .auth-page .h-12 {
    height: 48px;
  }
  
  .auth-page .h-16 {
    height: 64px;
  }
  
  .auth-page .flex {
    display: flex;
  }
  
  .auth-page .items-center {
    align-items: center;
  }
  
  .auth-page .justify-center {
    justify-content: center;
  }
  
  .auth-page .text-gray-500 {
    color: #6b7280;
  }
  
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
  
  .auth-page .bg-gray-100 {
    background-color: #f3f4f6;
  }
  
  .auth-page .px-3 {
    padding-left: 12px;
    padding-right: 12px;
  }
  
  .auth-page .py-2 {
    padding-top: 8px;
    padding-bottom: 8px;
  }
`
  }

  const getLayoutDescription = () => {
    if (totalBoxes === 1) return "One full-page label"
    if (totalBoxes === 2) return "Two half-page labels (stacked vertically)"
    if (totalBoxes === 3) return "Two labels on top half (side by side), one full-width label on bottom half"
    if (totalBoxes === 4) return "Four quarter-page labels in a 2×2 grid"

    const pages = Math.ceil(totalBoxes / 4)
    return `${totalBoxes} labels across ${pages} page${pages > 1 ? "s" : ""} (max 4 labels per page)`
  }

  const handleDocumentSelection = (documentType, checked) => {
    setSelectedDocuments((prev) => ({
      ...prev,
      [documentType]: checked,
    }))
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
          {trackingNumber}
        </p>
      </div>

      {/* Document Selection Section */}
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
              Shipping Labels ({totalBoxes} labels)
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
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Invoice Section */}
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
            <div className="text-sm text-gray-600">
              <p>• Each copy will be printed on a separate page</p>
              <p>• Contains detailed item breakdown and pricing</p>
              <p>
                • Total Amount: {awbData.shippingCurrency || "₹"}
                {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
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

        {/* Labels Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipping Labels
            </CardTitle>
            <CardDescription>Configure and preview shipping label layout</CardDescription>
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
                <Label className="text-sm font-medium mb-2 block">Label Content:</Label>
                <RadioGroup value={labelPrintOption} onValueChange={setLabelPrintOption}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="receiver-only" id="receiver-only" />
                    <Label htmlFor="receiver-only" className="text-sm">
                      Receiver Details Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sender-receiver" id="sender-receiver" />
                    <Label htmlFor="sender-receiver" className="text-sm">
                      Sender + Receiver Details
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="text-sm text-gray-600 mt-4">
              <p>• Layout: {getLayoutDescription()}</p>
              <p>• Each label includes barcode and address details</p>
              <p>
                •{" "}
                {labelPrintOption === "sender-receiver" ? "Sender and receiver on each label" : "Receiver details only"}
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

        {/* Authorization Letters Section */}
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

        {/* KYC Document Section */}
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

      {/* Print Section */}
      <div className="text-center">
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3 text-[#232C65]">Print Summary</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div
              className={`p-3 rounded ${selectedDocuments.invoice ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"} border`}
            >
              <p className="font-medium">
                {selectedDocuments.invoice ? "✅" : "❌"} Invoices:{" "}
                {selectedDocuments.invoice ? `${invoiceCopies} copies` : "Not selected"}
              </p>
              <p className="text-gray-600">Each invoice on separate page</p>
            </div>
            <div
              className={`p-3 rounded ${selectedDocuments.labels ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"} border`}
            >
              <p className="font-medium">
                {selectedDocuments.labels ? "✅" : "❌"} Labels:{" "}
                {selectedDocuments.labels ? `${totalBoxes} labels` : "Not selected"}
              </p>
              <p className="text-gray-600">
                {selectedDocuments.labels
                  ? `${Math.ceil(totalBoxes / 4)} page${Math.ceil(totalBoxes / 4) > 1 ? "s" : ""} total`
                  : "No labels"}
              </p>
              <p className="text-xs text-blue-600">
                {labelPrintOption === "sender-receiver" ? "With sender + receiver" : "Receiver only"}
              </p>
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
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>Print order: Invoices → Labels → Authorization Letters</p>
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

      {/* Hidden preview areas */}
      <div className="hidden">
        <div ref={invoiceRef} className="printableArea bg-white p-1 border border-gray-200 rounded-lg shadow-sm">
          {/* Invoice preview content would go here */}
        </div>
        <div ref={labelRef}>{/* Label preview content would go here */}</div>
      </div>
    </div>
  )
}
