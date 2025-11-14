"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, RotateCcw, ChevronLeft, ChevronRight, Loader2, Settings2, Download } from "lucide-react"
import { generateManifestPDF } from "@/app/_utils/pdf-manifest"
import axios from "axios"
import toast from "react-hot-toast"

const DEFAULT_PAGE_SIZE = 20
const DEBOUNCE_DELAY = 500

export function DataTableOptimized({ columns, userType, userId }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [clientNameInput, setClientNameInput] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [visibleColumns, setVisibleColumns] = useState({})
  const [clientOptions, setClientOptions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showClientFilter, setShowClientFilter] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const dropdownRef = useRef(null)
  const debounceTimer = useRef(null)

  const fetchData = useCallback(
    async (currentPage, currentSearch, currentCountry, currentClientCode, currentStartDate, currentEndDate) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          search: currentSearch,
          country: currentCountry,
          clientCode: currentClientCode,
          startDate: currentStartDate,
          endDate: currentEndDate,
        })
        const response = await axios.get(`/api/awb?${params.toString()}`, {
          headers: { userType, userId },
        })
        setData(response.data.data)
        setTotalPages(response.data.pagination?.totalPages || 1)
        setTotalCount(response.data.pagination?.totalCount || response.data.totalCount || 0)
        setPage(response.data.pagination?.page || currentPage)
        setSelectedRows(new Set())
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to fetch data. Please try again.")
        setData([])
      } finally {
        setLoading(false)
      }
    },
    [pageSize, userType, userId],
  )

  useEffect(() => {
    const initialVisibility = {}
    columns?.forEach((col) => {
      initialVisibility[col.accessorKey || col.id] = true
    })
    setVisibleColumns(initialVisibility)
  }, [columns])

  useEffect(() => {
    fetchData(1, "", "", "", "", "")
  }, [])

  useEffect(() => {
    const fetchRefOptions = async () => {
      try {
        if (userType === "admin" || userType === "branch") {
          const [franchiseRes, clientRes] = await Promise.all([
            axios.get("/api/franchises").catch(() => ({ data: [] })),
            axios.get("/api/clients").catch(() => ({ data: [] })),
          ])
          const franchises = (franchiseRes.data || []).map((f) => ({
            value: f.code || f.id,
            label: f.firmName || f.name,
            type: "franchise",
          }))
          const clients = (clientRes.data || []).map((c) => ({
            value: c.code || c.id,
            label: c.companyName || c.name,
            type: "client",
          }))
          setClientOptions([...franchises, ...clients])
          setShowClientFilter(true)
        } else if (userType === "franchise") {
          const clientRes = await axios.get("/api/clients", { headers: { userType, userId } })
          const clients = (clientRes.data || []).map((c) => ({
            value: c.code || c.id,
            label: c.companyName || c.name,
            type: "client",
          }))
          if (clients.length > 0) {
            setClientOptions(clients)
            setShowClientFilter(true)
          } else {
            setShowClientFilter(false)
          }
        } else if (userType === "client") {
          setShowClientFilter(false)
        }
      } catch (error) {
        console.error("Error fetching ref options:", error)
        setShowClientFilter(false)
      }
    }

    if (userType) {
      fetchRefOptions()
    }
  }, [userType, userId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setPage(1)
      fetchData(1, value, countryFilter, clientFilter, startDate, endDate)
    }, DEBOUNCE_DELAY)
  }

  const applyFilters = () => {
    setPage(1)
    fetchData(1, searchTerm, countryFilter, clientFilter, startDate, endDate)
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setCountryFilter("")
    setClientFilter("")
    setClientNameInput("")
    setStartDate("")
    setEndDate("")
    setPage(1)
    fetchData(1, "", "", "", "", "")
  }

  const handleSelectClient = (option) => {
    setClientNameInput(option.label)
    setClientFilter(option.value)
    setShowDropdown(false)
  }

  const handleRowSelect = (rowId) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId)
    } else {
      newSelected.add(rowId)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRows.size === data.length && data.length > 0) {
      setSelectedRows(new Set())
    } else {
      const allIds = new Set(data.map((row, idx) => idx))
      setSelectedRows(allIds)
    }
  }

  const handleExportManifest = async () => {
    if (selectedRows.size === 0) {
      toast.error("Please select at least one AWB")
      return
    }

    try {
      setIsGeneratingPdf(true)
      const selectedAwbs = data.filter((_, idx) => selectedRows.has(idx))
      await generateManifestPDF(selectedAwbs)
      toast.success(`Manifest generated for ${selectedAwbs.length} shipments`)
    } catch (err) {
      console.error("Error generating manifest:", err)
      toast.error("Failed to generate manifest PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const filteredClientOptions = clientOptions.filter((opt) =>
    opt.label.toLowerCase().includes(clientNameInput.toLowerCase()),
  )

  const CellRenderer = ({ row, column }) => {
    if (column.cell) return column.cell({ row: { original: row } })
    const colKey = column.accessorKey || column.id
    if (colKey.includes(".")) {
      const keys = colKey.split(".")
      let value = row
      for (const key of keys) {
        value = value?.[key]
      }
      return value || "-"
    }
    return row[colKey] || "-"
  }

  return (
    <div className="w-full space-y-4">
      <div className="p-3 border bg-muted/50 rounded-lg">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="text-sm font-medium mb-1.5 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tracking #, sender, receiver..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-1.5 block">Country</label>
            <Input
              placeholder="Country code..."
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="h-9"
            />
          </div>
          {showClientFilter && (
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-1.5 block">Client / Franchise</label>
              <div className="relative" ref={dropdownRef}>
                <Input
                  placeholder="Client name..."
                  value={clientNameInput}
                  onChange={(e) => {
                    setClientNameInput(e.target.value)
                    setShowDropdown(true)
                    if (!e.target.value) setClientFilter("")
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="h-9"
                />
                {showDropdown && filteredClientOptions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg mt-1 max-h-40 overflow-auto z-20">
                    {filteredClientOptions.map((opt, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelectClient(opt)}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                      >
                        {opt.label} <span className="text-xs text-muted-foreground">({opt.type})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm font-medium mb-1.5 block">Date Range</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-2 py-1 border rounded-md text-sm bg-background"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-2 py-1 border rounded-md text-sm bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={applyFilters}>
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetFilters} title="Reset Filters">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleExportManifest}
              disabled={selectedRows.size === 0 || isGeneratingPdf}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              title="Export selected AWBs as manifest"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? "Generating..." : `Manifest (${selectedRows.size})`}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" title="Toggle Columns">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns?.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.accessorKey || col.id}
                    checked={visibleColumns[col.accessorKey || col.id] ?? true}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, [col.accessorKey || col.id]: checked }))
                    }
                    className="capitalize"
                  >
                    {typeof col.header === "function" ? col.id : col.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm text-muted-foreground flex-wrap gap-2">
        <span>
          Showing {data.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of{" "}
          {totalCount} results
        </span>
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newPageSize = Number(e.target.value)
              setPageSize(newPageSize)
              setPage(1)
              fetchData(1, searchTerm, countryFilter, clientFilter, startDate, endDate)
            }}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedRows.size === data.length && data.length > 0}
                  indeterminate={selectedRows.size > 0 && selectedRows.size < data.length ? true : undefined}
                  onCheckedChange={handleSelectAll}
                  title="Select all"
                />
              </TableHead>
              {columns?.map((col) => {
                const key = col.accessorKey || col.id
                if (visibleColumns[key] === false) return null
                return (
                  <TableHead key={key} className="font-semibold">
                    {typeof col.header === "function" ? col.id : col.header}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading initial data...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  className={`hover:bg-muted/50 ${selectedRows.has(idx) ? "bg-blue-50" : ""}`}
                >
                  <TableCell className="w-10">
                    <Checkbox checked={selectedRows.has(idx)} onCheckedChange={() => handleRowSelect(idx)} />
                  </TableCell>
                  {columns?.map((col) => {
                    const key = col.accessorKey || col.id
                    if (visibleColumns[key] === false) return null
                    return (
                      <TableCell key={key} className="py-3">
                        <CellRenderer row={row} column={col} />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns?.filter((c) => visibleColumns[c.accessorKey || c.id] !== false).length + 1}
                  className="text-center py-8 text-muted-foreground"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  ) : (
                    "No results found"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(page - 1, searchTerm, countryFilter, clientFilter, startDate, endDate)}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(page + 1, searchTerm, countryFilter, clientFilter, startDate, endDate)}
            disabled={page === totalPages || loading}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
