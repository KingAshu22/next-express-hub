"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export default function ShippingInvoicePage() {
  const { trackingNumber } = useParams()
  const [awbData, setAwbData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const printableAreaRef = useRef(null)
  const [copies, setCopies] = useState(1)

  useEffect(() => {
    const fetchAWBData = async () => {
      console.log(`AWB fetching data ${trackingNumber}`)
      setLoading(true)
      try {
        const response = await axios.get(`/api/awb/${trackingNumber}`)
        setAwbData(response.data[0])
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

    const convertLessThanOneThousand = (n) => {
      if (n === 0) return ""
      if (n < 20) return units[n]

      const digit = n % 10
      if (n < 100) return tens[Math.floor(n / 10)] + (digit ? " " + units[digit] : "")

      return (
        units[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convertLessThanOneThousand(n % 100) : "")
      )
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

  // Count total rows = box header rows + item rows
  const getRowCount = (boxes = []) => {
    let rows = 0
    boxes.forEach((box) => {
      rows += 1 // box header
      rows += Array.isArray(box.items) ? box.items.length : 0
    })
    return rows
  }

  const rowCount = getRowCount(awbData?.boxes || [])

  const totalAmount = calculateTotal()
  const amountInWords =
    numberToWords(Math.round(totalAmount)) +
    " " +
    (awbData?.shippingCurrency === "₹" ? "Rupees" : "Dollars") +
    " Only"

  // Build and print paginated HTML: first page = max 28 rows (including Box headers), rest on next page with signature section.
  const handlePrint = () => {
    if (!awbData) return
    const originalContent = document.body.innerHTML

    const rows = []
    awbData.boxes?.forEach((box, boxIndex) => {
      rows.push({ type: "boxHeader", boxIndex })
      box.items?.forEach((item, itemIndex) => {
        rows.push({ type: "item", boxIndex, itemIndex, item })
      })
    })

    // Split after 28 rows (including Box header rows).
    // If the split lands on a Box header, move it to the next page so it isn't orphaned at the bottom of page 1.
    const MAX_FIRST_PAGE_ROWS = 28
    let splitIndex = Math.min(MAX_FIRST_PAGE_ROWS, rows.length)
    if (splitIndex > 0 && rows[splitIndex - 1]?.type === "boxHeader") {
      if (splitIndex > 1) splitIndex -= 1
    }
    const page1Rows = rows.slice(0, splitIndex)
    const page2Rows = rows.slice(splitIndex)

    const currency = awbData.shippingCurrency || "₹"
    const fmtMoney = (val) =>
      `${currency}${Number(val).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`

    const safe = (s) => (s === undefined || s === null ? "" : String(s))

    const buildRowsHTML = (rowsArr) =>
      rowsArr
        .map((r) => {
          if (r.type === "boxHeader") {
            return `
              <tr class="row box-header">
                <td colspan="6" class="cell bc" style="background:#e5e7eb;font-weight:700;text-align:center;font-size:10px;padding:2px;">Box No ${r.boxIndex + 1}</td>
              </tr>
            `
          } else {
            const item = r.item
            const amount = Number(item.price) * Number(item.quantity)
            return `
              <tr class="row item">
                <td class="cell bc" style="width:16px;">${r.itemIndex + 1}</td>
                <td class="cell bc">${safe(item.name)}</td>
                <td class="cell bc center" style="width:80px;">${safe(item.hsnCode) || "N/A"}</td>
                <td class="cell bc" style="width:30px;">${safe(item.quantity)}</td>
                <td class="cell bc nowrap" style="width:60px;">${fmtMoney(item.price)}</td>
                <td class="cell bc nowrap" style="width:80px;">${fmtMoney(amount)}</td>
              </tr>
            `
          }
        })
        .join("")

    const tableHeadHTML = `
      <thead>
        <tr>
          <th class="cell header" style="width:16px;">Sr No.</th>
          <th class="cell header">Description of Goods</th>
          <th class="cell header" style="width:80px;">HSN Code</th>
          <th class="cell header" style="width:30px;">Quantity</th>
          <th class="cell header" style="width:60px;">Rate</th>
          <th class="cell header" style="width:80px;">Value</th>
        </tr>
      </thead>
    `

    const totalsHTML = `
      <tr class="row total">
        <td class="cell bc right tiny" colspan="5" style="font-weight:700;">Total Amount:</td>
        <td class="cell bc nowrap" style="font-weight:700;">${fmtMoney(totalAmount)}</td>
      </tr>
      <tr class="row words">
        <td class="cell bc center tiny" style="font-weight:700;">In Words:</td>
        <td class="cell bc" colspan="5" style="font-weight:700;">${safe(amountInWords)}</td>
      </tr>
    `

    const headerTopHTML = `
      <div class="invoice-title">SHIPPING INVOICE</div>
      <div class="info-grid">
        <div>
          <div><strong>Date:</strong> ${awbData.date ? format(new Date(awbData.date), "dd/MM/yyyy") : "N/A"}</div>
          <div><strong>Pre Carriage By:</strong> ${safe(awbData.via) || "N/A"}</div>
          <div><strong>Vessel/Flight No:</strong> ${safe(awbData.forwardingNo) || "N/A"}</div>
          <div><strong>Port of Discharge:</strong> ${safe(awbData.sender?.country) || "N/A"}</div>
          <div><strong>Country of Origin of Goods:</strong> ${safe(awbData.sender?.country) || "INDIA"}</div>
        </div>
        <div>
          <div><strong>EXP. REF-</strong> ${safe(awbData.trackingNumber)}</div>
          <div><strong>Place of Receipt by Pre-carrier:</strong></div>
          <div><strong>Port of Loading:</strong> ${safe(awbData.sender?.country) || "N/A"}</div>
          <div><strong>Final Destination:</strong> ${safe(awbData.receiver?.country) || "N/A"}</div>
          <div><strong>Country of Final Destination:</strong> ${safe(awbData.receiver?.country) || "N/A"}</div>
        </div>
      </div>

      <div class="addr-grid">
        <div class="address-box">
          <div class="addr-title">Sender:</div>
          <div class="bold up">${safe(awbData.sender?.name)}</div>
          ${awbData.sender?.companyName ? `<div class="bold up">C/O ${safe(awbData.sender?.companyName)}</div>` : ""}
          <div>${safe(awbData.sender?.address)}</div>
          <div><strong>Zip Code:</strong> ${safe(awbData.sender?.zip)} &nbsp;&nbsp; <strong>Country:</strong> ${safe(awbData.sender?.country)}</div>
          <div><strong>Cont No:</strong> ${safe(awbData.sender?.contact)}</div>
          <div><strong>Email:</strong> ${safe(awbData.sender?.email) || "yourship.sunexpress@gmail.com"}</div>
          ${
            awbData.sender?.kyc?.type || awbData.sender?.kyc?.kyc
              ? `<div><strong>${safe(awbData.sender?.kyc?.type)}</strong> ${safe(awbData.sender?.kyc?.kyc)}</div>`
              : ""
          }
        </div>
        <div class="address-box">
          <div class="addr-title">Receiver:</div>
          <div class="bold up">${safe(awbData.receiver?.name)}</div>
          ${awbData.receiver?.companyName ? `<div class="bold up">C/O ${safe(awbData.receiver?.companyName)}</div>` : ""}
          <div>${safe(awbData.receiver?.address)}</div>
          <div><strong>Zip Code:</strong> ${safe(awbData.receiver?.zip)} &nbsp;&nbsp; <strong>Country:</strong> ${safe(awbData.receiver?.country)}</div>
          <div><strong>Cont No:</strong> ${safe(awbData.receiver?.contact)}</div>
          <div><strong>Email:</strong> ${safe(awbData.receiver?.email) || "yourship.sunexpress@gmail.com"}</div>
        </div>
      </div>
    `

    const isSinglePage = page2Rows.length === 0
    const useFixedHeight580 = isSinglePage && rows.length < 28

    // Page 1 HTML
    const page1TableHTML = `
      <div class="table-wrap" style="${useFixedHeight580 ? "height:580px;" : ""}">
        <table class="inv-table">
          ${tableHeadHTML}
          <tbody>
            ${buildRowsHTML(page1Rows)}
            ${isSinglePage ? totalsHTML : ""}
          </tbody>
        </table>
      </div>
      ${
        !isSinglePage
          ? `<div class="continued">Continued on next page...</div>`
          : `
            <div class="declaration">
              <div class="bold">Declaration:</div>
              <div>We certify that the information given above is true and correct to the best of our knowledge</div>
            </div>
            <div class="signature-area">
              <div class="sign-label">Signature & Date</div>
              <div class="sign-line"></div>
            </div>
          `
      }
    `

    // Page 2 (only if there are remaining rows); includes totals + declaration + signature
    const page2TableHTML = `
      <table class="inv-table">
        ${tableHeadHTML}
        <tbody>
          ${buildRowsHTML(page2Rows)}
          ${totalsHTML}
        </tbody>
      </table>
      <div class="declaration">
        <div class="bold">Declaration:</div>
        <div>We certify that the information given above is true and correct to the best of our knowledge</div>
      </div>
      <div class="signature-area">
        <div class="sign-label">Signature & Date</div>
        <div class="sign-line"></div>
      </div>
    `

    // Build print HTML for all copies
    let allCopiesHTML = ""
    for (let i = 0; i < copies; i++) {
      const hasTwoPages = page2Rows.length > 0
      const isLastCopy = i === copies - 1

      const page1Break = hasTwoPages ? "always" : isLastCopy ? "auto" : "always"
      const page2Break = isLastCopy ? "auto" : "always"

      const page1HTML = `
        <div class="page" style="page-break-after:${page1Break};">
          <div class="printableArea">
            <div class="invoice-title-wrap">${headerTopHTML}</div>
            ${page1TableHTML}
          </div>
        </div>
      `
      const page2HTML = hasTwoPages
        ? `
          <div class="page" style="page-break-after:${page2Break};">
            <div class="printableArea">
              <div class="invoice-title continuation">SHIPPING INVOICE (Continued)</div>
              ${page2TableHTML}
            </div>
          </div>
        `
        : ""

      allCopiesHTML += page1HTML + page2HTML
    }

    const styleTag = `
      <style>
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; color: #111; }
        .page { width: 100%; }
        .printableArea {
          border: 1px solid grey;
          border-radius: 12px;
          padding: 8px;
        }
        .invoice-title { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 12px; }
        .invoice-title.continuation { margin-top: 8px; }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          margin-bottom: 10px;
          font-size: 12px;
        }
        .addr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 12px;
        }
        .address-box {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 6px;
        }
        .addr-title { font-weight: 700; margin-bottom: 4px; }
        .bold { font-weight: 700; }
        .up { text-transform: uppercase; }
        .inv-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .cell { border: 1px solid #ddd; padding: 2px 4px; font-size: 12px; }
        .header { background: #f2f2f2; text-align: left; }
        .bc { border-color: #ccc; }
        .center { text-align: center; }
        .right { text-align: right; }
        .nowrap { white-space: nowrap; }
        .tiny { font-size: 10px; }
        .continued { margin-top: 6px; font-style: italic; text-align: right; font-size: 11px; }
        .declaration { margin-top: 10px; font-style: italic; font-size: 12px; }
        .signature-area { margin-top: 18px; text-align: right; font-size: 12px; }
        .sign-label { margin-right: 24px; }
        .sign-line { margin-top: 28px; margin-left: auto; width: 160px; border-top: 1px solid #999; }
      </style>
    `

    document.body.innerHTML = styleTag + allCopiesHTML
    window.print()
    document.body.innerHTML = originalContent
    window.location.reload()
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

  return (
    <>
      <div className="container mx-auto px-2 py-1 bg-white">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#232C65]">Shipping Invoice</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="copies" className="text-sm font-medium">
                Copies:
              </label>
              <input
                id="copies"
                type="number"
                min="1"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Number.parseInt(e.target.value) || 1))}
                className="w-16 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={handlePrint} className="flex items-center gap-2 bg-[#232C65] hover:bg-[#1a2150]">
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
          </div>
        </div>

        <div
          ref={printableAreaRef}
          className="printableArea bg-white p-1 border border-gray-200 rounded-lg shadow-sm"
          style={{ maxWidth: "210mm", margin: "0 auto" }} // A4 width
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">SHIPPING INVOICE</h1>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-[12px]">
            <div>
              <p>
                <strong>Date:</strong>{" "}
                {awbData.date ? format(new Date(awbData.date), "dd/MM/yyyy") : "N/A"}
              </p>
              <p>
                <strong>Pre Carriage By:</strong> {awbData.via || "N/A"}
              </p>
              <p>
                <strong>Vessel/Flight No:</strong> {awbData.forwardingNo || "N/A"}
              </p>
              <p>
                <strong>Port of Discharge:</strong> {awbData.sender?.country || "N/A"}
              </p>
              <p>
                <strong>Country of Origin of Goods:</strong> {awbData.sender?.country || "INDIA"}
              </p>
            </div>
            <div>
              <p>
                <strong>EXP. REF-</strong> {awbData.trackingNumber}
              </p>
              <p>
                <strong>Place of Receipt by Pre-carrier:</strong>
              </p>
              <p>
                <strong>Port of Loading:</strong> {awbData.sender?.country || "N/A"}
              </p>
              <p>
                <strong>Final Destination:</strong> {awbData.receiver?.country || "N/A"}
              </p>
              <p>
                <strong>Country of Final Destination:</strong> {awbData.receiver?.country || "N/A"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 text-[12px]">
            <div className="border border-gray-300 p-1 rounded-lg">
              <h2 className="font-bold mb-2">Sender:</h2>
              <p className="font-bold uppercase">{awbData.sender?.name}</p>
              {awbData.sender?.companyName && (
                <p className="font-bold uppercase">C/O {awbData.sender?.companyName}</p>
              )}
              <p>{awbData.sender?.address}</p>
              <p className="flex flex-row gap-2">
                <strong>Zip Code:</strong> {awbData.sender?.zip}
                <strong>Country:</strong>
                {awbData.sender?.country}
              </p>
              <p>
                <strong>Cont No:</strong> {awbData.sender?.contact}
              </p>
              <p>
                <strong>Email:</strong> {awbData.sender?.email || "yourship.sunexpress@gmail.com"}
              </p>
              <p>
                <strong>{awbData.sender?.kyc?.type}</strong> {awbData.sender?.kyc?.kyc}
              </p>
            </div>
            <div className="border border-gray-300 rounded-lg p-1">
              <h2 className="font-bold mb-2">Receiver:</h2>
              <p className="font-bold uppercase">{awbData.receiver?.name}</p>
              {awbData.receiver?.companyName && (
                <p className="font-bold uppercase">C/O {awbData.receiver?.companyName}</p>
              )}
              <p>{awbData.receiver?.address}</p>
              <p className="flex flex-row gap-2">
                <strong>Zip Code:</strong> {awbData.receiver?.zip}
                <strong>Country:</strong>
                {awbData.receiver?.country}
              </p>
              <p>
                <strong>Cont No:</strong> {awbData.receiver?.contact}
              </p>
              <p>
                <strong>Email:</strong> {awbData.receiver?.email || "yourship.sunexpress@gmail.com"}
              </p>
            </div>
          </div>

          {/* Dynamic height: 580px if rows < 28 */}
          <div style={{ height: rowCount < 28 ? 580 : undefined }}>
            <table className="w-full border-collapse mb-2 text-[12px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 text-left w-[10px] whitespace-nowrap">Sr No.</th>
                  <th className="border border-gray-300 px-2 text-left">Description of Goods</th>
                  <th className="border border-gray-300 px-2 text-left w-[80px]">HSN Code</th>
                  <th className="border border-gray-300 px-2 text-left w-[20px]">Quantity</th>
                  <th className="border border-gray-300 px-2 text-left w-[40px]">Rate</th>
                  <th className="border border-gray-300 px-2 text-left w-[40px]">Value</th>
                </tr>
              </thead>
              <tbody>
                {awbData.boxes?.flatMap((box, boxIndex) => [
                  <tr key={`box-header-${boxIndex}`} className="bg-gray-200">
                    <td colSpan={6} className="border border-gray-300 py-0 font-bold text-center text-[10px]">
                      Box No {boxIndex + 1}
                    </td>
                  </tr>,
                  ...box.items.map((item, itemIndex) => (
                    <tr key={`box-${boxIndex}-item-${itemIndex}`}>
                      <td className="border border-gray-300 px-2 w-[10px]">{itemIndex + 1}</td>
                      <td className="border border-gray-300 px-2">{item.name}</td>
                      <td className="border border-gray-300 px-2 w-[80px] text-center">
                        {item.hsnCode || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-2 w-[20px]">{item.quantity}</td>
                      <td className="border border-gray-300 px-2 w-[40px] whitespace-nowrap">
                        {(awbData.shippingCurrency || "₹")}
                        {Number(item.price).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="border border-gray-300 px-2 w-[40px] whitespace-nowrap">
                        {(awbData.shippingCurrency || "₹")}
                        {(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  )),
                ])}
                <tr className="font-bold text-[12px]">
                  <td
                    colSpan={5}
                    className="border border-gray-300 p-0 text-[10px] whitespace-nowrap text-right pr-2"
                  >
                    Total Amount:
                  </td>
                  <td className="border border-gray-300 px-2 whitespace-nowrap">
                    {(awbData.shippingCurrency || "₹")}
                    {totalAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr className="font-bold text-[12px]">
                  <td className="border border-gray-300 p-0 text-[10px] whitespace-nowrap text-center">
                    In Words:
                  </td>
                  <td colSpan={5} className="border border-gray-300 px-2">
                    {amountInWords}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-2 pt-1 text-justify italic text-[12px] border-t border-gray-400">
            <p className="font-bold">Declaration:</p>
            <p>
              We certify that the information given above is true and correct to the best of our knowledge
            </p>
          </div>

          <div className="mt-2 mr-4 text-right text-[12px]">
            <p className="mr-12">Signature & Date</p>
            <div className="h-10"></div>
            <div className="border-t border-gray-400 w-48 ml-auto"></div>
          </div>
        </div>
      </div>
    </>
  )
}