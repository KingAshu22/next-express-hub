/* eslint-disable react/no-unknown-property */
"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"

// react-barcode needs DOM, load client-side only
const Barcode = dynamic(() => import("react-barcode"), { ssr: false })

// Utility: safely join address lines
function joinAddress(lines) {
  return (lines || []).filter(Boolean).join(", ")
}

// Utility: format number with 3 decimals like " 23.000"
function fmt3(num) {
  if (num === null || num === undefined || isNaN(Number(num))) return ""
  return Number(num).toFixed(3)
}

// Utility: derive basic dimension string from boxes if present
function buildDimensionString(awb) {
  try {
    if (!awb?.boxes?.length) return awb?.dimensions || ""
    // Expecting boxes with length, width, height, quantity, and maybe volWeight
    const parts = awb.boxes.map((b) => {
      const qty = b?.quantity ?? 1
      const L = b?.length ?? 0
      const W = b?.width ?? 0
      const H = b?.height ?? 0
      // compute DIM WT if missing (L*W*H)/5000
      const dim = L && W && H ? ((L * W * H * qty) / 5000).toFixed(3) : ""
      return `${L}*${W}*${H}*${qty}${dim ? "=" + dim : ""}`
    })
    return parts.join("; ")
  } catch {
    return awb?.dimensions || ""
  }
}

// Core: A single half-sheet block that maps AWB fields to the WorldFirst-like layout
function AWBCopy({ awb, copyLabel = "ADMIN COPY" }) {
  const tracking = awb?.trackingNumber || awb?.airwayBillNo || awb?.invoiceNo || ""
  const routeOrigin = awb?.originCity || awb?.origin || awb?.sender?.city || ""
  const routeDestination = awb?.destinationCity || awb?.destination || awb?.receiver?.city || ""
  const service = awb?.service || "WORLDWIDE EXPRESS SAVER"
  const pieces = awb?.pieces ?? awb?.noOfPieces ?? awb?.boxes?.length ?? ""
  const weightActual = awb?.actualWeight ?? awb?.totalActualWeight ?? awb?.chargeableWeight ?? ""
  const volWeight = awb?.volumetricWeight ?? awb?.totalVolWeight ?? ""
  const chargeable = awb?.chargeableWeight ?? (Math.max(Number(weightActual || 0), Number(volWeight || 0)) || "")
  const dimensionStr = buildDimensionString(awb)
  const dateStr = awb?.date || awb?.bookingDate || awb?.createdAt || ""
  const shipperCompany = awb?.sender?.company || awb?.shipperCompany || ""
  const shipperName = awb?.sender?.name || awb?.shipperName || ""
  const shipperPhone = awb?.sender?.phone || awb?.sender?.tel || ""
  const shipperPin = awb?.sender?.pincode || awb?.sender?.pinCode || ""
  const shipperState = awb?.sender?.state || ""
  const shipperCity = awb?.sender?.city || ""
  const shipperCountry = awb?.sender?.country || "INDIA"
  const shipperAddress = joinAddress([awb?.sender?.addressLine1, awb?.sender?.addressLine2, awb?.sender?.addressLine3])

  const recvCompany = awb?.receiver?.company || awb?.consigneeCompany || ""
  const recvName = awb?.receiver?.name || awb?.consigneeName || ""
  const recvPhone = awb?.receiver?.phone || awb?.receiver?.tel || ""
  const recvPin = awb?.receiver?.pincode || awb?.receiver?.pinCode || ""
  const recvState = awb?.receiver?.state || ""
  const recvCity = awb?.receiver?.city || ""
  const recvCountry = awb?.receiver?.country || "UNITED STATES OF AMERICA"
  const recvAddress = joinAddress([
    awb?.receiver?.addressLine1,
    awb?.receiver?.addressLine2,
    awb?.receiver?.addressLine3,
  ])

  const routingCode = awb?.routingCode || awb?.zone || ""
  const invoiceNo = awb?.invoiceNo || ""
  const ewayBill = awb?.ewayBillNo || ""
  const paymentMethod = awb?.paymentMethod || "CREDIT"
  const bookingDate = awb?.bookingDate || dateStr || ""
  const shipmentValue = awb?.shipmentValue || awb?.declaredValue || ""

  const goodsDescription = awb?.description || awb?.goodsDescription || ""

  return (
    <section className="awb-half">
      <header className="awb-header">
        <div className="brand">
          <div className="brand-top">
            <span className="brand-code">WF691</span>
            <span className="brand-name">Express Hub PRIVATE LIMITED</span>
          </div>
          <div className="routing">
            <div className="routing-row">
              <div className="routing-item">
                <div className="label">ROUTING CODE</div>
                <div className="value">{routingCode || "-"}</div>
              </div>
              <div className="copy-label">{copyLabel}</div>
            </div>
          </div>
        </div>
        <div className="barcode-block">
          {tracking ? (
            <>
              <div className="barcode-wrap">
                <Barcode value={tracking} height={40} displayValue={false} margin={0} />
              </div>
              <div className="tracking-text">*{tracking}*</div>
              <div className="tracking-value">{tracking}</div>
            </>
          ) : (
            <div className="tracking-empty">NO TRACKING</div>
          )}
        </div>
      </header>

      <div className="meta-grid">
        <div className="meta-item">
          <div className="label">ACCOUNT CUSTOMER</div>
          <div className="value">{awb?.accountCustomer || "-"}</div>
        </div>
        <div className="meta-item">
          <div className="label">ORIGIN</div>
          <div className="value">{routeOrigin || "-"}</div>
        </div>
        <div className="meta-item">
          <div className="label">DESTINATION</div>
          <div className="value">{routeDestination || "-"}</div>
        </div>
        <div className="meta-item">
          <div className="label">COUNTRY :</div>
          <div className="value">{shipperCountry}</div>
        </div>
        <div className="meta-item">
          <div className="label">COUNTRY :</div>
          <div className="value">{recvCountry}</div>
        </div>
      </div>

      <div className="ship-grid">
        <div className="col">
          <div className="block">
            <div className="label">SENDER&apos;S COMPANY</div>
            <div className="value">{shipperCompany}</div>
          </div>
          <div className="block">
            <div className="label">SENDER&apos;S NAME</div>
            <div className="value">{shipperName}</div>
          </div>
          <div className="block">
            <div className="label">ADDRESS</div>
            <div className="value">{shipperAddress}</div>
          </div>
          <div className="row-3">
            <div className="block">
              <div className="label">PIN CODE :</div>
              <div className="value">{shipperPin}</div>
            </div>
            <div className="block">
              <div className="label">TEL NO. :</div>
              <div className="value">{shipperPhone}</div>
            </div>
          </div>
          <div className="row-3">
            <div className="block">
              <div className="label">CITY :</div>
              <div className="value">{shipperCity}</div>
            </div>
            <div className="block">
              <div className="label">STATE :</div>
              <div className="value">{shipperState}</div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="block">
            <div className="label">RECIPIENT&apos;S COMPANY</div>
            <div className="value">{recvCompany}</div>
          </div>
          <div className="block">
            <div className="label">RECIPIENT&apos;S NAME</div>
            <div className="value">{recvName}</div>
          </div>
          <div className="block">
            <div className="label">ADDRESS</div>
            <div className="value">{recvAddress}</div>
          </div>
          <div className="row-3">
            <div className="block">
              <div className="label">PIN CODE :</div>
              <div className="value">{recvPin}</div>
            </div>
            <div className="block">
              <div className="label">TEL NO. :</div>
              <div className="value">{recvPhone}</div>
            </div>
          </div>
          <div className="row-3">
            <div className="block">
              <div className="label">CITY :</div>
              <div className="value">{recvCity}</div>
            </div>
            <div className="block">
              <div className="label">STATE :</div>
              <div className="value">{recvState}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="shipment-grid">
        <div className="block">
          <div className="label">DIMESION IN CM</div>
          <div className="value">{dimensionStr}</div>
        </div>
        <div className="row-4">
          <div className="block">
            <div className="label">PIECES</div>
            <div className="value">{pieces}</div>
          </div>
          <div className="block">
            <div className="label">SERVICE</div>
            <div className="value">{service}</div>
          </div>
          <div className="block">
            <div className="label">WEIGHT</div>
            <div className="value">{fmt3(weightActual)}</div>
          </div>
        </div>

        <div className="row-4">
          <div className="block">
            <div className="label">VOL.WT</div>
            <div className="value">{fmt3(volWeight)}</div>
          </div>
          <div className="block">
            <div className="label">CHARGEABLE WT</div>
            <div className="value">{fmt3(chargeable)}</div>
          </div>
          <div className="block">
            <div className="label">METHORD OF PAYMENT</div>
            <div className="value">{paymentMethod}</div>
          </div>
        </div>

        <div className="block">
          <div className="label">DESCRIPTION OF GOODS</div>
          <div className="value multiline">{goodsDescription}</div>
        </div>
      </div>

      <div className="footer-grid">
        <div className="left">
          <div className="row-3">
            <div className="block">
              <div className="label">SHIPMENT VALUE</div>
              <div className="value">{shipmentValue || "-"}</div>
            </div>
            <div className="block">
              <div className="label">BOOKING DATE</div>
              <div className="value">{bookingDate || "-"}</div>
            </div>
          </div>

          <div className="row-3">
            <div className="block">
              <div className="label">INVOICE NO :</div>
              <div className="value">{invoiceNo || "-"}</div>
            </div>
            <div className="block">
              <div className="label">EWAY BILL NO :</div>
              <div className="value">{ewayBill || "-"}</div>
            </div>
          </div>

          <div className="agreement">
            <div className="label">SHIPPER AGREEMENT</div>
            <div className="small">SHIPPER AGREES TO STANDARD TERM AND CONDITIONS OF CARRIAGE.</div>
            <div className="sign-row">
              <div className="block">
                <div className="label">DATE</div>
                <div className="value">{dateStr || "-"}</div>
              </div>
              <div className="block">
                <div className="label">SHIPPER&apos;S SIGNATURE</div>
                <div className="sign-line" />
              </div>
            </div>
            <div className="sign-row">
              <div className="block">
                <div className="label">PICK UP</div>
                <div className="subrow">
                  <div className="sub">
                    <div className="label">NAME</div>
                    <div className="sign-line" />
                  </div>
                  <div className="sub">
                    <div className="label">SIGN</div>
                    <div className="sign-line" />
                  </div>
                </div>
              </div>
            </div>
            <div className="small">
              ALL CHEQUES SHOULD BE DRAWN IN FAVOUR OF <b>WF691 Express Hub PRIVATE LIMITED</b>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="terms">
            <div className="label">Terms &amp; Conditions :</div>
            <ol>
              <li>
                No Claims would be entertained for any damage during transit &amp; delay in delivery due to any reason.
              </li>
              <li>
                Maximum claims for loss of parcel would be USD 50 upto 10 Kgs &amp; USD 100 above 10 kgs or the declared
                value whichever is lower.
              </li>
              <li>
                This AWB is for the account holder and it is not transferable. This receipt does not imply we have
                physically received the parcel in our hub.
              </li>
            </ol>
            <div className="juris">*** Subject to Mumbai Jurisdiction***</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function PrintAWBPage({ searchParams }) {
  const awb = useMemo(() => {
    // You can hydrate this from your DB or route params. Example values here mirror your sample.
    return {
      trackingNumber: "MH1074676",
      accountCustomer: "WF691",
      originCity: "MUMBAI",
      destinationCity: "United States of America",
      service: "WORLDWIDE EXPRESS SAVER",
      pieces: 2,
      actualWeight: 23.0,
      volumetricWeight: 23.0,
      chargeableWeight: 23.0,
      description: "SUIT, SAREE, DECORATIVE ITEM, STEEL BOX, CLOTH",
      routingCode: "",
      invoiceNo: "6410",
      ewayBillNo: "",
      paymentMethod: "CREDIT",
      bookingDate: "19/08/2025",
      date: "19/08/2025",
      sender: {
        company: "SANJAY SURESHDAS VAISHNAV",
        name: "SANJAY SURESHDAS VAISHNAV",
        addressLine1: "ROOM NO.2, NARESH CHAWL",
        addressLine2: "NEAR SIDDIVINAYAK TEMPLE, PUSHPA PARK MUMBAI",
        city: "MUMBAI",
        state: "MAHARASHTRA",
        pincode: "400097",
        phone: "8169155537",
        country: "INDIA",
      },
      receiver: {
        company: "PRAGNESH MISTRY",
        name: "PRAGNESH MISTRY",
        addressLine1: "304, S SALISBURY GQ AVE",
        addressLine2: "GRANITE QUARRY, NC 28146",
        city: "GRANITE QUARRY",
        state: "NC 28146",
        pincode: "",
        phone: "+1 7087454543",
        country: "UNITED STATES OF AMERICA",
      },
      boxes: [
        { length: 58, width: 40, height: 30, quantity: 1 },
        { length: 59, width: 24, height: 24, quantity: 1 },
      ],
    }
  }, [])

  return (
    <main className="page">
      <div className="toolbar no-print">
        <button onClick={() => window.print()} className="btn">
          Print
        </button>
      </div>

      {/* Top Half - Admin Copy */}
      <AWBCopy awb={awb} copyLabel="ADMIN COPY" />

      {/* Divider */}
      <div className="cut-line" aria-hidden="true">
        -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
      </div>

      {/* Bottom Half - Accounts Copy */}
      <AWBCopy awb={awb} copyLabel="ACCOUNTS COPY" />

      {/* Global print & layout styles */}
      <style jsx global>{`
        /* Page setup */
        @page {
          size: A4 portrait;
          margin: 0;
        }
        html, body {
          padding: 0;
          margin: 0;
          background: #fff;
        }
        .page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          background: #fff;
          color: #000;
          box-sizing: border-box;
          padding: 6mm;
          display: flex;
          flex-direction: column;
          gap: 2mm;
          font-family: Arial, Helvetica, sans-serif;
        }
        .no-print { display: block; }
        @media print {
          .no-print { display: none !important; }
          .page { padding: 6mm; }
        }

        .toolbar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 4mm;
        }
        .btn {
          border: 1px solid #000;
          background: #fff;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
        }

        /* Divider (cut line) */
        .cut-line {
          text-align: center;
          font-family: monospace;
          font-size: 8pt;
          line-height: 1;
          letter-spacing: -0.2px;
          color: #000;
        }

        /* Half-block sizing */
        .awb-half {
          height: calc((297mm - 12mm - 2mm) / 2); /* full height - padding - divider gap, split in half */
          border: 1px solid #000;
          box-sizing: border-box;
          padding: 5mm;
          display: flex;
          flex-direction: column;
          gap: 3mm;
          page-break-inside: avoid;
        }

        /* Header with brand and barcode */
        .awb-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 4mm;
        }
        .brand {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 2mm;
        }
        .brand-top {
          display: flex;
          gap: 3mm;
          align-items: baseline;
        }
        .brand-code {
          font-weight: 700;
          border: 1px solid #000;
          padding: 1mm 2mm;
          font-size: 10pt;
        }
        .brand-name {
          font-weight: 700;
          font-size: 11pt;
        }
        .routing {
          display: flex;
          flex-direction: column;
          gap: 2mm;
        }
        .routing-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .routing-item .label {
          font-size: 8pt;
          font-weight: 700;
        }
        .routing-item .value {
          border: 1px solid #000;
          min-width: 40mm;
          padding: 1mm 2mm;
          font-size: 10pt;
          min-height: 8mm;
        }
        .copy-label {
          border: 1px solid #000;
          padding: 1mm 3mm;
          font-size: 9pt;
          font-weight: 700;
        }
        .barcode-block {
          width: 62mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1mm;
        }
        .barcode-wrap {
          width: 100%;
        }
        .tracking-text {
          font-family: monospace;
          font-size: 10pt;
          letter-spacing: 1px;
        }
        .tracking-value {
          font-size: 11pt;
          font-weight: 700;
        }
        .tracking-empty {
          border: 1px dashed #000;
          width: 100%;
          text-align: center;
          font-size: 9pt;
          padding: 4mm 0;
        }

        /* Meta grid: account, origin, destination, countries */
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
          gap: 2mm;
        }
        .meta-item .label {
          font-size: 7.5pt;
          font-weight: 700;
        }
        .meta-item .value {
          border: 1px solid #000;
          min-height: 8mm;
          padding: 1mm 2mm;
          font-size: 9pt;
          display: flex;
          align-items: center;
        }

        /* Sender/Receiver columns */
        .ship-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3mm;
        }
        .col {
          display: flex;
          flex-direction: column;
          gap: 2mm;
        }
        .block .label {
          font-size: 7.5pt;
          font-weight: 700;
        }
        .block .value {
          border: 1px solid #000;
          min-height: 8mm;
          padding: 1mm 2mm;
          font-size: 9pt;
          display: flex;
          align-items: center;
        }
        .row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2mm;
        }
        .row-4 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2mm;
        }
        .multiline {
          align-items: flex-start !important;
          line-height: 1.2;
          padding-top: 1.5mm;
          min-height: 14mm;
        }

        /* Shipment spec grid */
        .shipment-grid {
          display: flex;
          flex-direction: column;
          gap: 2mm;
        }

        /* Footer grid: left info and right terms */
        .footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3mm;
          margin-top: auto;
        }
        .agreement .small {
          font-size: 7.5pt;
          margin-top: 1mm;
        }
        .sign-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2mm;
          margin-top: 2mm;
        }
        .sign-line {
          border-bottom: 1px solid #000;
          height: 7mm;
        }
        .subrow {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2mm;
          margin-top: 1mm;
        }
        .sub .label {
          font-size: 7.5pt;
          font-weight: 700;
        }
        .terms .label {
          font-size: 8pt;
          font-weight: 700;
          margin-bottom: 1mm;
        }
        .terms ol {
          margin: 0 0 2mm 4mm;
          padding: 0;
          font-size: 7.5pt;
        }
        .juris {
          font-size: 7.5pt;
          font-weight: 700;
          margin-top: 1mm;
        }
      `}</style>
    </main>
  )
}
