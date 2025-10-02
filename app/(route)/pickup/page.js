"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Link from "next/link"

export default function PickupPage() {
  const [pickups, setPickups] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    pickupClient: "",
    pickupLocation: "",
    pickupFrom: "",
    dateFrom: "",
    dateTo: "",
  })

  // Sort states
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    fetchPickups()
  }, [page, filters, sortBy, sortOrder])

  async function fetchPickups() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== "")),
      })

      const res = await axios.get(`/api/pickup?${params}`)
      setPickups(res.data.pickups)
      setTotal(res.data.total)
    } catch (error) {
      console.error("Error fetching pickups:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(pickupNo) {
    if (confirm("Are you sure you want to delete this pickup?")) {
      try {
        await axios.delete(`/api/pickup/${pickupNo}`)
        fetchPickups() // Refresh the list
      } catch (error) {
        console.error("Error deleting pickup:", error)
        alert("Failed to delete pickup")
      }
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPage(1) // Reset to first page when filtering
  }

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
    setPage(1)
  }

  function clearFilters() {
    setFilters({
      pickupClient: "",
      pickupLocation: "",
      pickupFrom: "",
      dateFrom: "",
      dateTo: "",
    })
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  const getSortIcon = (field) => {
    if (sortBy !== field) return "↕️"
    return sortOrder === "asc" ? "↑" : "↓"
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Pickup Management</h1>
        <Link
          href="/pickup/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Create New Pickup
        </Link>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <input
            type="text"
            name="pickupClient"
            placeholder="Filter by Client"
            value={filters.pickupClient}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="pickupLocation"
            placeholder="Filter by Location"
            value={filters.pickupLocation}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="pickupFrom"
            placeholder="Filter by Pickup From"
            value={filters.pickupFrom}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="dateFrom"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="dateTo"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={clearFilters}
          className="mt-3 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {pickups.length} of {total} pickups
          {loading && <span className="ml-2 text-blue-600">Loading...</span>}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("pickupNo")}
                >
                  Pickup No {getSortIcon("pickupNo")}
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("date")}
                >
                  Date {getSortIcon("date")}
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("pickupClient")}
                >
                  Client {getSortIcon("pickupClient")}
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("pickupLocation")}
                >
                  Location {getSortIcon("pickupLocation")}
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("pickupFrom")}
                >
                  Pickup From {getSortIcon("pickupFrom")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Boxes</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pickups.map((pickup) => (
                <tr key={pickup._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{pickup.pickupNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{new Date(pickup.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{pickup.pickupClient}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{pickup.pickupLocation}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{pickup.pickupFrom}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{pickup.pickupBoxes?.length || 0} boxes</td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <Link href={`/pickup/${pickup.pickupNo}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      View
                    </Link>
                    <Link
                      href={`/edit-pickup/${pickup.pickupNo}`}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(pickup.pickupNo)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pickups.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">No pickups found matching your criteria.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
