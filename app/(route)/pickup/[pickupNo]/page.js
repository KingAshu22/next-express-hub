"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import Link from "next/link"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function SinglePickupPage() {
  const { pickupNo } = useParams()
  const router = useRouter()
  const [pickup, setPickup] = useState(null)
  const [loading, setLoading] = useState(true)
  const pdfRef = useRef()
  const actionsRef = useRef() // 👈 Reference to action buttons container

  useEffect(() => {
    async function fetchPickup() {
      try {
        const res = await axios.get(`/api/pickup/${pickupNo}`)
        setPickup(res.data)
      } catch (error) {
        console.error("Error fetching pickup:", error)
        alert("Failed to load pickup data")
      } finally {
        setLoading(false)
      }
    }

    if (pickupNo) {
      fetchPickup()
    }
  }, [pickupNo])

  async function handleDelete() {
    if (
      confirm(
        "Are you sure you want to delete this pickup? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(`/api/pickup/${pickupNo}`)
        router.push("/pickup")
      } catch (error) {
        console.error("Error deleting pickup:", error)
        alert("Failed to delete pickup")
      }
    }
  }

  const handleDownloadPDF = () => {
    const input = pdfRef.current
    const actionsContainer = actionsRef.current

    // Temporarily hide action buttons
    if (actionsContainer) {
      actionsContainer.style.opacity = "0"
      actionsContainer.style.pointerEvents = "none"
    }

    html2canvas(input, { scale: 2 }).then((canvas) => {
      // Restore action buttons immediately after capture
      if (actionsContainer) {
        actionsContainer.style.opacity = "1"
        actionsContainer.style.pointerEvents = "auto"
      }

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Pickup-${pickup.pickupNo}.pdf`)
    })
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!pickup) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-xl font-semibold mb-4">Pickup Not Found</div>
          <Link
            href="/pickup"
            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            Back to Pickups
          </Link>
        </div>
      </div>
    )
  }

  // Extract or fallback values for header
  const callNumber = "+91 97699 93011 / +91 81691 55537"
  const website = "www.expresshub.in"
  const email = "expresshub555@gmail.com"

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div
        ref={pdfRef}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
      >
        {/* HEADER SECTION — Company + Contact Info */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 md:p-8">
          <div className="flex flex-col md:flex-col justify-between items-start md:items-center gap-4 text-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Kargo Onee
              </h1>
              <p className="text-blue-100 mt-1">International Courier & Cargo Services</p>
            </div>

            {/* Contact Info - Call, Website, Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm md:text-base">
              <div className="flex items-center space-x-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>{callNumber}</span>
              </div>
              <div className="flex items-center space-x-1">
                  {website}
              </div>
              <div className="flex items-center space-x-2">
                  {email}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BAR — Now wrapped with ref and will be hidden during PDF capture */}
        <div
          className="p-6 border-b border-gray-100 bg-gray-50 transition-opacity duration-150"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Pickup Details</h2>
              <p className="text-gray-600 mt-1">Pickup #{pickup.pickupNo}</p>
            </div>
            <div 
            ref={actionsRef} // 👈 Attach ref here
            className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadPDF}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Save as PDF
              </button>
              <Link
                href={`/edit-pickup/${pickup.pickupNo}`}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
              >
                Delete
              </button>
              <Link
                href="/pickup"
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
              >
                Back to List
              </Link>
            </div>
          </div>
        </div>

        {/* BASIC INFO GRID */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Basic Information
            </h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium">Pickup Number:</span>
                <span className="font-semibold text-gray-900">{pickup.pickupNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(pickup.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Pickup From:</span>
                <span className="font-semibold text-gray-900">{pickup.pickupFrom}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Client & Location
            </h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium">Client:</span>
                <span className="font-semibold text-gray-900">{pickup.pickupClient}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Location:</span>
                <span className="font-semibold text-gray-900">{pickup.pickupLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Boxes:</span>
                <span className="font-semibold text-blue-600">
                  {pickup.pickupBoxes?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOXES TABLE */}
        <div className="px-6 pb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 pt-2 border-t border-gray-200 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
              />
            </svg>
            Pickup Boxes
          </h3>

          {!pickup.pickupBoxes || pickup.pickupBoxes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                />
              </svg>
              <p className="text-gray-500 text-lg">No boxes recorded for this pickup.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-4 px-6 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider"
                    >
                      Box #
                    </th>
                    <th
                      scope="col"
                      className="py-4 px-6 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider"
                    >
                      Item Name
                    </th>
                    <th
                      scope="col"
                      className="py-4 px-6 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider"
                    >
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pickup.pickupBoxes.map((box, boxIndex) => {
                    let boxNumber, items

                    if (typeof box === "string") {
                      boxNumber = boxIndex + 1
                      items = [{ itemName: box, quantity: 1 }]
                    } else if (box && typeof box === "object") {
                      boxNumber = box.boxNumber || boxIndex + 1
                      items = box.items || []
                    } else {
                      boxNumber = boxIndex + 1
                      items = []
                    }

                    if (items.length === 0) {
                      return (
                        <tr key={boxIndex} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-medium text-gray-700">Box {boxNumber}</td>
                          <td className="py-4 px-6 text-gray-500 italic">No items listed</td>
                          <td className="py-4 px-6 text-gray-500">—</td>
                        </tr>
                      )
                    }

                    return items.map((item, itemIndex) => {
                      const itemName = item.itemName || item
                      const quantity = item.quantity || 1
                      const displayBoxNumber = itemIndex === 0 ? `Box ${boxNumber}` : ""

                      return (
                        <tr
                          key={`${boxIndex}-${itemIndex}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-6 font-medium text-gray-700 whitespace-nowrap">
                            {displayBoxNumber}
                          </td>
                          <td className="py-4 px-6 text-gray-800">• {itemName}</td>
                          <td className="py-4 px-6 text-blue-600 font-medium whitespace-nowrap">
                            Qty: {quantity}
                          </td>
                        </tr>
                      )
                    })
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER METADATA */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <p>
            Created:{" "}
            {new Date(pickup.createdAt || pickup._id).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {pickup.updatedAt && (
            <p className="mt-1">
              Last Updated:{" "}
              {new Date(pickup.updatedAt).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}