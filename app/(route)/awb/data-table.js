import {
  getSortedRowModel,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useMediaQuery } from "react-responsive";
import { DataTablePagination } from "./data-table-pagination";
import { useRouter } from "next/navigation";

export function DataTable({ columns, data }) {
  const router = useRouter();
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  // Our additional filters
  const [awbFilter, setAwbFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [clientFilter, setClientFilter] = useState(""); // stores CODE for filtering
  const [clientNameInput, setClientNameInput] = useState(""); // displays NAME in input
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  // For autocomplete
  const [clientOptions, setClientOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch clients and franchises
  useEffect(() => {
    const fetchClientsAndFranchises = async () => {
      try {
        const [clientsRes, franchisesRes] = await Promise.all([
          fetch("/api/clients").then((r) => r.json()),
          fetch("/api/franchises").then((r) => r.json()),
        ]);

        const combined = [
          ...(clientsRes.map((c) => ({
            label: c.companyName || c.name,
            value: c.code || c.id, // Use whatever unique code field exists
            type: "client",
          })) || []),
          ...(franchisesRes.map((f) => ({
            label: f.firmName || f.name,
            value: f.code || f.id,
            type: "franchise",
          })) || []),
        ];

        setClientOptions(combined);
      } catch (error) {
        console.error("Failed to fetch clients or franchises:", error);
      }
    };

    fetchClientsAndFranchises();
  }, []);

  // Filter options based on input
  const filteredOptions = clientOptions.filter((option) =>
    option.label.toLowerCase().includes(clientNameInput.toLowerCase())
  );

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...data];

    if (awbFilter.trim()) {
      filtered = filtered.filter((row) =>
        row.trackingNumber.toLowerCase().includes(awbFilter.trim().toLowerCase())
      );
    }

    if (countryFilter.trim()) {
      filtered = filtered.filter((row) =>
        row.receiver?.country
          ?.toLowerCase()
          .includes(countryFilter.trim().toLowerCase())
      );
    }

    if (clientFilter.trim()) {
      filtered = filtered.filter((row) =>
        row.refCode?.toLowerCase().includes(clientFilter.trim().toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (row) => new Date(row.date) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (row) => new Date(row.date) <= new Date(endDate)
      );
    }

    setFilteredData(filtered);
  }, [awbFilter, countryFilter, clientFilter, startDate, endDate, data]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const handleSelectClient = (option) => {
    setClientNameInput(option.label); // Show name in input
    setClientFilter(option.value); // Set code for actual filtering
    setShowDropdown(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center flex-wrap gap-2 py-1">
        <Input
          placeholder="Filter by AWB No..."
          value={awbFilter}
          onChange={(e) => setAwbFilter(e.target.value)}
          className="max-w-40"
        />

        <Input
          placeholder="Filter by Receiver Country"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="max-w-40"
        />

        {/* Client RefCode Filter with Autocomplete */}
        <div className="relative max-w-40" ref={dropdownRef}>
          <Input
            placeholder="Filter by Client Name"
            value={clientNameInput}
            onChange={(e) => {
              setClientNameInput(e.target.value);
              setShowDropdown(true);
              // Optional: Clear filter if input is cleared
              if (!e.target.value) setClientFilter("");
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full"
          />
          {showDropdown && filteredOptions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
              {filteredOptions.map((option, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectClient(option)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 text-sm"
                >
                  {option.label}{" "}
                  <span className="text-xs text-gray-500">({option.type})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="text-sm block">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="text-sm block">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-full text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-2 py-2 whitespace-nowrap"
                  >
                    {!header.isPlaceholder &&
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-2 py-2 whitespace-nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}