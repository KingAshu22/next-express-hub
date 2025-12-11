"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import {
  CalendarIcon,
  Plus,
  Minus,
  Search,
  TruckIcon,
  CheckCircle,
  ChevronDown,
  FileText,
  Package,
  Users,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Countries, countryCodeMap } from "@/app/constants/country"
import axios from "axios"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import HsnSearchDialog from "./HsnSearchDialog"
import toast from "react-hot-toast"
import { Checkbox } from "@/components/ui/checkbox"
import ItemNameAutocomplete from "./ItemNameAutoComplete"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

const mockHsnData = [
  { code: "482030", item: "Document" },
  { code: "630790", item: "Textile articles" },
  // ... rest of mock data
]

// --- Helper Components ---

const FormSection = ({ title, description, icon, children, className }) => (
  <Card className={cn("overflow-hidden", className)}>
    <CardHeader>
      <div className="flex items-start gap-4">
        {icon && <div className="bg-primary/10 text-primary p-2 rounded-lg">{icon}</div>}
        <div>
          <CardTitle className="text-lg text-primary">{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

const FormInput = ({ id, label, children, required }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="font-medium">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
  </div>
)

// --- Main Form Component ---

export default function AWBForm({ isEdit = false, awb }) {
  const router = useRouter()

  // State
  const [success, setSuccess] = useState(false)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState(null)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [showHsnSearchDialog, setShowHsnSearchDialog] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState({ boxIndex: 0, itemIndex: 0 })
  const [boxCount, setBoxCount] = useState("")
  const [showItemDetails, setShowItemDetails] = useState(false)

  const [senderCountryOpen, setSenderCountryOpen] = useState(false)
  const [receiverCountryOpen, setReceiverCountryOpen] = useState(false)

  // Rate fetching state
  const [fetchingRates, setFetchingRates] = useState(false)
  const [rates, setRates] = useState(null)
  const [selectedRate, setSelectedRate] = useState(null)
  const [selectedCourier, setSelectedCourier] = useState(null)
  const [includeGST, setIncludeGST] = useState(false) // Default: Excl GST

  // Form state
  const [date, setDate] = useState(awb?.date ? new Date(awb.date) : new Date())
  const [parcelType, setParcelType] = useState(awb?.parcelType || "International")
  const [staffId, setStaffId] = useState(awb?.staffId || "")
  const [invoiceNumber, setInvoiceNumber] = useState(awb?.invoiceNumber || "")
  const [trackingNumber, setTrackingNumber] = useState(awb?.trackingNumber || "")
  const [via, setVia] = useState(awb?.via || "Air Shipment")
  const [shipmentType, setShipmentType] = useState(awb?.shipmentType || "Non Document")

  const [refCode, setRefCode] = useState(awb?.refCode || "")
  const [refOptions, setRefOptions] = useState([])
  const [refSearchTerm, setRefSearchTerm] = useState("")
  const [isRefDropdownOpen, setIsRefDropdownOpen] = useState(false)
  const [selectedRefOption, setSelectedRefOption] = useState(null)

  //Forwarding Details
  const [forwardingNumber, setForwardingNumber] = useState(awb?.forwardingNumber || "")
  const [forwardingLink, setForwardingLink] = useState(awb?.forwardingLink || "")
  const [cNoteNumber, setCNoteNumber] = useState(awb?.cNoteNumber || "")
  const [cNoteVendorName, setCNoteVendorName] = useState(awb?.cNoteVendorName || "")
  const [awbNumber, setAwbNumber] = useState(awb?.awbNumber || "")

  const [shippingCurrency, setShippingCurrency] = useState(awb?.shippingCurrency || "₹")
  const [totalShippingValue, setTotalShippingValue] = useState(awb?.totalShippingValue || 0)

  // Sender details
  const [senderName, setSenderName] = useState(awb?.sender?.name || "")
  const [senderCompanyName, setSenderCompanyName] = useState(awb?.sender?.companyName || "")
  const [senderEmail, setSenderEmail] = useState(awb?.sender?.email || "")
  const [senderAddress, setSenderAddress] = useState(awb?.sender?.address || "")
  const [senderAddress2, setSenderAddress2] = useState(awb?.sender?.address2 || "")
  const [senderCity, setSenderCity] = useState(awb?.sender?.city || "")
  const [senderState, setSenderState] = useState(awb?.sender?.state || "")
  const [senderCountry, setSenderCountry] = useState(awb?.sender?.country || "India")
  const [senderZipCode, setSenderZipCode] = useState(awb?.sender?.zip || "")
  const [senderContact, setSenderContact] = useState(awb?.sender?.contact || "")
  const [kycType, setKycType] = useState(awb?.sender?.kyc?.type || "Aadhaar No -")
  const [kyc, setKyc] = useState(awb?.sender?.kyc?.kyc || "")
  const [kycDocument, setKycDocument] = useState(awb?.sender?.kyc?.document || "")
  const [gst, setGst] = useState(awb?.gst || "")

  // Receiver details
  const [receiverName, setReceiverName] = useState(awb?.receiver?.name || "")
  const [receiverCompanyName, setReceiverCompanyName] = useState(awb?.receiver?.companyName || "")
  const [receiverEmail, setReceiverEmail] = useState(awb?.receiver?.email || "")
  const [receiverAddress, setReceiverAddress] = useState(awb?.receiver?.address || "")
  const [receiverAddress2, setReceiverAddress2] = useState(awb?.receiver?.address2 || "")
  const [receiverCity, setReceiverCity] = useState(awb?.receiver?.city || "")
  const [receiverState, setReceiverState] = useState(awb?.receiver?.state || "")
  const [receiverCountry, setReceiverCountry] = useState(awb?.receiver?.country || "")
  const [receiverZipCode, setReceiverZipCode] = useState(awb?.receiver?.zip || "")
  const [receiverContact, setReceiverContact] = useState(awb?.receiver?.contact || "")

  // Box details
  const [boxes, setBoxes] = useState(awb?.boxes || [])
  const [availableTypes, setAvailableTypes] = useState([])
  const userType = typeof window !== "undefined" ? localStorage.getItem("userType") : ""
  const [isClient, setIsClient] = useState(userType === "client")

  // Derived state
  const [totalChargeableWeight, setTotalChargeableWeight] = useState("")
  const [error, setError] = useState(null)

  // Get calling code
  const getCallingCode = (countryName) => countryCodeMap[countryName]?.callingCode || ""

  // Clean contact on edit
  useEffect(() => {
    if (isEdit && awb) {
      const cleanContact = (contact, country) => {
        if (!contact || !country) return contact
        const callingCode = getCallingCode(country)
        if (callingCode && contact.startsWith(callingCode)) {
          return contact.substring(callingCode.length).trim()
        }
        return contact
      }
      setSenderContact(cleanContact(awb.sender?.contact, awb.sender?.country))
      setReceiverContact(cleanContact(awb.receiver?.contact, awb.receiver?.country))
    }
  }, [isEdit, awb])

  // Weights
  const totalWeights = useMemo(() => {
    const totalActual = boxes.reduce((acc, box) => acc + (Number.parseFloat(box.actualWeight) || 0), 0)
    const totalDimensional = boxes.reduce((acc, box) => acc + (Number.parseFloat(box.dimensionalWeight) || 0), 0)
    const totalChargeable = boxes.reduce((acc, box) => acc + (Number.parseFloat(box.chargeableWeight) || 0), 0)
    return {
      actual: totalActual.toFixed(2),
      dimensional: totalDimensional.toFixed(3),
      chargeable: totalChargeable.toFixed(2),
    }
  }, [boxes])

  const canFetchRates = useMemo(() => {
    return boxes.length > 0 && totalChargeableWeight && Number(totalChargeableWeight) > 0 && receiverCountry
  }, [boxes, totalChargeableWeight, receiverCountry])

  // Filtered customers for search (Fixed ReferenceError)
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers
    return customers.filter((customer) => customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [customers, searchTerm])

  // Box Logic
  const generateBoxes = () => {
    const count = Number.parseInt(boxCount, 10)
    if (isNaN(count) || count <= 0) {
      toast.error("Please enter a valid number of boxes")
      return
    }
    const newBoxes = Array.from({ length: count }, () => ({
      length: "",
      breadth: "",
      height: "",
      actualWeight: "",
      dimensionalWeight: "",
      chargeableWeight: "",
      items: [{ name: "", quantity: "", price: "", hsnCode: "" }],
    }))
    setBoxes(newBoxes)
  }

  // Ref Code Fetching
  useEffect(() => {
    fetchServices()
    const fetchRefOptions = async () => {
      const userType = localStorage.getItem("userType") || ""
      const code = localStorage.getItem("code") || ""

      if (!awb?.refCode) {
        if (userType === "franchise" || userType === "branch" || userType === "client") {
          setRefCode(code)
        }
      }

      try {
        if (userType === "admin" || userType === "branch") {
          const [franchiseRes, clientRes] = await Promise.all([axios.get("/api/franchises"), axios.get("/api/clients")])
          const franchises = (Array.isArray(franchiseRes.data) ? franchiseRes.data : [franchiseRes.data]).map((f) => ({
            code: f.code, name: f.name, type: "franchise",
          }))
          const clients = (Array.isArray(clientRes.data) ? clientRes.data : [clientRes.data]).map((c) => ({
            code: c.code, name: c.name, type: "client",
          }))
          const allOptions = [...franchises, ...clients]
          setRefOptions(allOptions)
          if (userType === "branch" && code) {
            const matchingOption = allOptions.find((option) => option.code === code)
            if (matchingOption) setSelectedRefOption(matchingOption)
          }
        } else if (userType === "franchise") {
          const clientRes = await axios.get("/api/clients", { headers: { userType, userId: code } })
          const clients = (Array.isArray(clientRes.data) ? clientRes.data : [clientRes.data]).map((c) => ({
            code: c.code, name: c.name, type: "client",
          }))
          setRefOptions(clients)
        }
      } catch (error) {
        console.error("Error fetching ref options:", error)
      }
    }
    fetchRefOptions()
  }, [])

  // Auto-fill client sender info
  useEffect(() => {
    const userType = localStorage.getItem("userType")
    const code = localStorage.getItem("code")
    if (userType === "client" && code) {
      const fetchClientData = async () => {
        try {
          const res = await axios.get(`/api/clients/${code}`)
          const client = Array.isArray(res.data) ? res.data[0] : res.data
          if (client) {
            setSenderName(client.name || "")
            setSenderCompanyName(client.companyName || "")
            setSenderZipCode(client.zip || "")
            setSenderCountry(client.country || "India")
            setSenderContact(client.contact?.toString() || "")
            setSenderAddress(client.address || "")
            setSenderAddress2(client.address2 || "")
            setSenderCity(client.city || "")
            setSenderState(client.state || "")
            setKycType(client.kyc?.type || "Aadhaar No")
            setKyc(client.kyc?.kyc || "")
            setKycDocument(client.kyc?.document || "")
            setGst(client.gstNo || "")
          }
        } catch (err) {
          console.error(err)
        }
      }
      fetchClientData()
    }
  }, [])

  const filteredRefOptions = refOptions.filter(
    (option) =>
      option.name.toLowerCase().includes(refSearchTerm.toLowerCase()) ||
      option.code.toLowerCase().includes(refSearchTerm.toLowerCase())
  )

  const handleRefOptionSelect = (option) => {
    setRefCode(option.code)
    setSelectedRefOption(option)
    setRefSearchTerm(option.name)
    setIsRefDropdownOpen(false)
  }

  // Invoice Number
  const getInvoiceNumber = async () => {
    try {
      const response = await axios.get("/api/get-last-awb")
      const lastInvoiceNumber = response.data.invoiceNumber
      const incrementedNumber = (Number.parseInt(lastInvoiceNumber) + 1).toString()
      setInvoiceNumber(incrementedNumber)
      setTrackingNumber(response.data.trackingNumber)
    } catch (error) {
      console.error(error)
    }
  }

  // Init
  useEffect(() => {
    fetchCustomers()
    if (!isEdit) getInvoiceNumber()
  }, [isEdit])

  // Sender/Receiver Auto-fill from Customers
  useEffect(() => {
    if (senderName && !isEdit) {
      const customer = customers.find((c) => c.name === senderName)
      if (customer) {
        setSenderCompanyName(customer.companyName || "")
        setSenderEmail(customer.email || "")
        setSenderAddress(customer.address || "")
        setSenderAddress2(customer.address2 || "")
        setSenderCity(customer.city || "")
        setSenderState(customer.state || "")
        setSenderCountry(customer.country || "India")
        setSenderZipCode(customer.zip || "")
        setSenderContact(customer.contact ? customer.contact.replace(/^\+\d+\s+/, "") : "")
        setKycType(customer.kyc?.type || "Aadhaar No -")
        setKyc(customer.kyc?.kyc || "")
        setKycDocument(customer.kyc?.document || "")
        setGst(customer.gst || "")
      }
    }
  }, [senderName, customers, isEdit])

  useEffect(() => {
    if (receiverName && !isEdit) {
      const customer = customers.find((c) => c.name === receiverName)
      if (customer) {
        setReceiverCompanyName(customer.companyName || "")
        setReceiverEmail(customer.email || "")
        setReceiverAddress(customer.address || "")
        setReceiverAddress2(customer.address2 || "")
        setReceiverCity(customer.city || "")
        setReceiverState(customer.state || "")
        setReceiverCountry(customer.country || "")
        setReceiverZipCode(customer.zip || "")
        setReceiverContact(customer.contact ? customer.contact.replace(/^\+\d+\s+/, "") : "")
      }
    }
  }, [receiverName, customers, isEdit])

  // Postal Data Logic
  const getCountryCode = (countryName) => countryCodeMap[countryName]?.code || ""

  const fetchPostalData = async (postalCode, countryCode) => {
    try {
      const postalApiKey = process.env.NEXT_PUBLIC_POSTAL_API_KEY
      if (!postalApiKey) return null
      const response = await axios.get(`https://api.worldpostallocations.com/pincode`, {
        params: { apikey: postalApiKey, postalcode: postalCode, countrycode: countryCode },
      })
      if (response.data?.status === true && response.data?.result?.length > 0) {
        return response.data.result[0]
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Auto-fill address from zip
  useEffect(() => {
    const updateSenderAddress = async () => {
      if (senderZipCode && senderZipCode.length >= 4 && senderCountry) {
        const countryCode = getCountryCode(senderCountry)
        if (!countryCode) return
        const postalData = await fetchPostalData(senderZipCode, countryCode)
        if (postalData) {
          const { postalLocation, province, district, state } = postalData
          const formattedAddress = [postalLocation, province, district, state].filter(Boolean).join(", ")
          if (!senderAddress2) setSenderAddress2(formattedAddress)
        }
      }
    }
    updateSenderAddress()
  }, [senderZipCode, senderCountry, senderAddress2])

  useEffect(() => {
    const updateReceiverAddress = async () => {
      if (receiverZipCode && receiverZipCode.length >= 4 && receiverCountry) {
        const countryCode = getCountryCode(receiverCountry)
        if (!countryCode) return
        const postalData = await fetchPostalData(receiverZipCode, countryCode)
        if (postalData) {
          const { postalLocation, province, district, state } = postalData
          const formattedAddress = [postalLocation, province, district, state].filter(Boolean).join(", ")
          if (!receiverAddress2) setReceiverAddress2(formattedAddress)
        }
      }
    }
    updateReceiverAddress()
  }, [receiverZipCode, receiverCountry, receiverAddress2])

  // Update totals
  useEffect(() => {
    const totalWeight = boxes.reduce((acc, box) => acc + (Number.parseFloat(box.chargeableWeight) || 0), 0)
    setTotalChargeableWeight(totalWeight.toFixed(2).toString())
    const totalShippingValue = boxes.reduce(
      (acc, box) =>
        acc +
        box.items.reduce((itemAcc, item) => {
          const itemValue = Number.parseFloat(item.price) || 0
          const itemQuantity = Number.parseInt(item.quantity, 10) || 0
          return itemAcc + itemValue * itemQuantity
        }, 0),
      0
    )
    setTotalShippingValue(Number.parseFloat(totalShippingValue))
  }, [boxes])

  // Reset rate if inputs change
  useEffect(() => {
    setSelectedRate(null)
    setSelectedCourier(null)
    setRates(null)
  }, [totalChargeableWeight, receiverCountry])

  useEffect(() => {
    if (isEdit && awb?.rateInfo) {
      setSelectedRate({
        // Minimal structure to satisfy submit logic if editing
        originalName: awb.rateInfo.service,
        service: awb.rateInfo.courier,
        sales: awb.financials?.sales,
        purchase: awb.financials?.purchase,
        netProfit: awb.financials?.netProfit,
        type: awb.rateInfo.courier // Ensure type is set for UI logic
      })
      setSelectedCourier(awb.rateInfo.courier)
    }
  }, [isEdit, awb])

  useEffect(() => {
    if (boxes.length > 0) {
      const hasItems = boxes.some(
        (box) => box.items && box.items.some((item) => item.name && item.quantity && item.price)
      )
      if (hasItems) setShowItemDetails(true)
    }
  }, [boxes])

  const fetchCustomers = async () => {
    try {
      const userType = localStorage.getItem("userType")
      const userId = localStorage.getItem("id")
      setLoading(true)
      const response = await axios.get("/api/customer", { headers: { userType, userId } })
      setCustomers(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Box/Item Handlers
  const addBox = useCallback(() => {
    setBoxes((prevBoxes) => [
      ...prevBoxes,
      {
        length: "", breadth: "", height: "", actualWeight: "",
        dimensionalWeight: "", chargeableWeight: "",
        items: [{ name: "", quantity: "", price: "", hsnCode: "" }],
      },
    ])
  }, [])

  const removeBox = useCallback((boxIndex) => {
    setBoxes((prevBoxes) => prevBoxes.filter((_, index) => index !== boxIndex))
  }, [])

  const handleBoxChange = useCallback((index, field, value) => {
    setBoxes((prevBoxes) => {
      const updatedBoxes = [...prevBoxes]
      let newValue = value
      if (field === "actualWeight" && shipmentType === "Document") {
        if (Number.parseFloat(value) > 3) {
          toast.error("For Document shipment, actual weight cannot exceed 3 kg.")
          newValue = ""
        }
      }
      updatedBoxes[index] = { ...updatedBoxes[index], [field]: newValue }
      if (["length", "breadth", "height", "actualWeight"].includes(field)) {
        const box = updatedBoxes[index]
        const length = Number(box.length) || 0
        const breadth = Number(box.breadth) || 0
        const height = Number(box.height) || 0
        const actualWeight = Number(box.actualWeight) || 0
        const dimensionalWeight = ((length * breadth * height) / 5000).toFixed(3)
        const chargeableWeightRaw = Math.max(actualWeight, dimensionalWeight)
        let chargeableWeight
        if (chargeableWeightRaw < 20) {
          chargeableWeight = Math.ceil(chargeableWeightRaw * 2) / 2
        } else {
          chargeableWeight = Math.ceil(chargeableWeightRaw)
        }
        updatedBoxes[index].dimensionalWeight = dimensionalWeight
        updatedBoxes[index].chargeableWeight = chargeableWeight
      }
      return updatedBoxes
    })
  }, [shipmentType])

  const addItem = useCallback((boxIndex) => {
    setBoxes((prevBoxes) => {
      const updatedBoxes = [...prevBoxes]
      updatedBoxes[boxIndex] = {
        ...updatedBoxes[boxIndex],
        items: [...updatedBoxes[boxIndex].items, { name: "", quantity: "", price: "", hsnCode: "" }],
      }
      return updatedBoxes
    })
  }, [])

  const removeItem = useCallback((boxIndex, itemIndex) => {
    setBoxes((prevBoxes) => {
      const updatedBoxes = [...prevBoxes]
      updatedBoxes[boxIndex] = {
        ...updatedBoxes[boxIndex],
        items: updatedBoxes[boxIndex].items.filter((_, idx) => idx !== itemIndex),
      }
      return updatedBoxes
    })
  }, [])

  const handleItemChange = useCallback((boxIndex, itemIndex, field, value) => {
    setBoxes((prevBoxes) => {
      const updatedBoxes = [...prevBoxes]
      updatedBoxes[boxIndex] = {
        ...updatedBoxes[boxIndex],
        items: updatedBoxes[boxIndex].items.map((item, idx) =>
          idx === itemIndex ? { ...item, [field]: value } : item
        ),
      }
      return updatedBoxes
    })
  }, [])

  // HSN
  const openHsnSearch = (boxIndex, itemIndex) => {
    setCurrentItemIndex({ boxIndex, itemIndex })
    setShowHsnSearchDialog(true)
  }

  const handleSelectHsn = (hsnItem) => {
    const { boxIndex, itemIndex } = currentItemIndex
    setBoxes((prevBoxes) => {
      const updatedBoxes = [...prevBoxes]
      const currentItem = updatedBoxes[boxIndex].items[itemIndex]
      if (!currentItem.name) {
        updatedBoxes[boxIndex].items[itemIndex] = { ...currentItem, name: hsnItem.item, hsnCode: hsnItem.code }
      } else {
        updatedBoxes[boxIndex].items[itemIndex] = { ...currentItem, hsnCode: hsnItem.code }
      }
      return updatedBoxes
    })
  }

  // Customer Search
  const openSearch = (type) => {
    setSearchType(type)
    setSearchTerm("")
    setShowSearchDialog(true)
  }

  const handleSelectCustomer = (customer) => {
    if (searchType === "sender") setSenderName(customer.name)
    else if (searchType === "receiver") setReceiverName(customer.name)
    setShowSearchDialog(false)
  }

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services", {
        headers: { userType: localStorage.getItem("userType"), userId: localStorage.getItem("code") },
      })
      const data = await response.json()
      setAvailableTypes(data)
    } catch (error) {
      console.error(error)
    }
  }

  const applyGST = (data, includeGST) => {
    if (!includeGST) {
      return {
        cgstPercent: 0,
        cgstAmount: 0,
        sgstPercent: 0,
        sgstAmount: 0,
        igstPercent: 0,
        igstAmount: 0,
        gstAmount: 0,
        subTotal: data.subtotalBeforeGST,
        grandTotal: data.subtotalBeforeGST, // No GST added
      }
    }

    // IF includeGST = true → keep original GST logic
    return {
      cgstPercent: 9,
      cgstAmount: (data.gstAmount || 0) / 2,
      sgstPercent: 9,
      sgstAmount: (data.gstAmount || 0) / 2,
      igstPercent: 0,
      igstAmount: 0,
      gstAmount: data.gstAmount || 0,
      subTotal: data.subtotalBeforeGST,
      grandTotal: data.total,
    }
  }

  // --- MAIN RATE FETCHING ---
  const fetchRates = async () => {
    if (!canFetchRates) {
      toast.error("Please fill in all required fields to fetch rates")
      return
    }
    setFetchingRates(true)
    try {
      const ratePromises = availableTypes.map((serviceObj) =>
        axios
          .get("/api/rate", {
            params: {
              type: serviceObj.originalName,
              weight: totalChargeableWeight,
              country: receiverCountry,
              zipCode: receiverZipCode,
              rateCategory: "sales",
            },
            headers: {
              userType: localStorage.getItem("userType"),
              userId: localStorage.getItem("code"),
            },
          })
          .then(async (response) => {
            const salesData = response.data

            const salesGST = applyGST(salesData, includeGST)

            const salesFinancials = {
              companyName: salesData.vendorName,
              serviceType: salesData.service,
              weight: {
                actual: salesData.inputWeight,
                volume: 0,
                chargeable: salesData.calculatedWeight,
              },
              rates: {
                ratePerKg: salesData.baseRate / salesData.calculatedWeight,
                baseTotal: salesData.baseRate,
              },
              charges: {
                otherCharges: Object.entries(salesData.chargesBreakdown || {}).map(([name, amount]) => ({ name, amount })),
                awbCharge: 0,
                fuelSurcharge: salesData.chargesBreakdown?.["Fuel Surcharge"] || 0,
                fuelAmount: salesData.chargesBreakdown?.["Fuel Surcharge"] || 0,
                ...salesGST, // ⬅ MERGE GST LOGIC HERE
              },
              subTotal: salesGST.subTotal,
              grandTotal: salesGST.grandTotal,
            }


            let purchaseFinancials = null

            // Fetch purchase rate if available (using the sales rate's purchaseRateId)
            if (salesData.ratePurchaseId) {
              try {
                // First, get the purchase rate details to extract service info
                const purchaseRateDetailsResponse = await axios.get(`/api/rates/${salesData.ratePurchaseId}`)
                const purchaseRateDetails = purchaseRateDetailsResponse.data

                const purchaseRateResponse = await axios.get("/api/rate", {
                  params: {
                    type: purchaseRateDetails.originalName || purchaseRateDetails.service,
                    weight: totalChargeableWeight,
                    country: receiverCountry,
                    zipCode: receiverZipCode,
                    rateCategory: "purchase",
                  },
                  headers: {
                    userType: localStorage.getItem("userType"),
                    userId: localStorage.getItem("code"),
                  },
                })

                const purchaseData = purchaseRateResponse.data

                const purchaseGST = applyGST(purchaseData, includeGST)

                purchaseFinancials = {
                  companyName: purchaseData.vendorName,
                  serviceType: purchaseData.service,
                  weight: {
                    actual: purchaseData.inputWeight,
                    volume: 0,
                    chargeable: purchaseData.calculatedWeight,
                  },
                  rates: {
                    ratePerKg: purchaseData.baseRate / purchaseData.calculatedWeight,
                    baseTotal: purchaseData.baseRate,
                  },
                  charges: {
                    otherCharges: Object.entries(purchaseData.chargesBreakdown || {}).map(([name, amount]) => ({ name, amount })),
                    awbCharge: 0,
                    fuelSurcharge: purchaseData.chargesBreakdown?.["Fuel Surcharge"] || 0,
                    fuelAmount: purchaseData.chargesBreakdown?.["Fuel Surcharge"] || 0,
                    ...purchaseGST,
                  },
                  subTotal: purchaseGST.subTotal,
                  grandTotal: purchaseGST.grandTotal,
                }
              } catch (error) {
                console.error("[v0] Error fetching purchase rate:", error.message)
                // Continue without purchase data if it fails
              }
            }

            const netProfit = purchaseFinancials ? salesFinancials.grandTotal - purchaseFinancials.grandTotal : 0

            return {
              ...salesData,
              success: true,
              type: serviceObj.originalName,
              sales: salesFinancials,
              purchase: purchaseFinancials,
              netProfit: netProfit,
            }
          })
          .catch((error) => ({
            originalName: serviceObj.originalName,
            type: serviceObj.originalName,
            error: error.response?.data?.error || "Failed to fetch rate",
            success: false,
          })),
      )

      const results = await Promise.all(ratePromises)
      setRates(results)
    } catch (error) {
      console.error("Error fetching rates:", error)
      toast.error("Failed to fetch rates. Please try again.")
    } finally {
      setFetchingRates(false)
    }
  }

  const handleSelectRate = (rate) => {
    setSelectedRate(rate)
    // Map originalName to courier for compatibility
    setSelectedCourier(rate.type)
    const price = includeGST ? rate.sales.grandTotal : rate.sales.subTotal;
    toast.success(`Selected ${rate.type} rate: ₹${price}`)
  }

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userType = localStorage.getItem("userType")
      const userId = localStorage.getItem("id")

      const senderCountryCode = getCallingCode(senderCountry)
      const receiverCountryCode = getCallingCode(receiverCountry)

      let formattedSenderContact = senderContact
      if (senderCountryCode && !formattedSenderContact.startsWith(senderCountryCode)) {
        formattedSenderContact = `${senderCountryCode} ${senderContact.replace(/[^\d]/g, "")}`
      }

      let formattedReceiverContact = receiverContact
      if (receiverCountryCode && !formattedReceiverContact.startsWith(receiverCountryCode)) {
        formattedReceiverContact = `${receiverCountryCode} ${receiverContact.replace(/[^\d]/g, "")}`
      }

      const parcelData = {
        parcelType,
        staffId: userType === "admin" ? "admin" : userId,
        invoiceNumber,
        date,
        trackingNumber,
        via,
        shipmentType,
        refCode,
        forwardingNumber,
        forwardingLink,
        cNoteNumber,
        cNoteVendorName,
        awbNumber,
        shippingCurrency,
        sender: {
          name: senderName,
          companyName: senderCompanyName,
          email: senderEmail,
          address: senderAddress,
          address2: senderAddress2,
          city: senderCity,
          state: senderState,
          country: senderCountry,
          zip: senderZipCode,
          contact: formattedSenderContact,
          kyc: { type: kycType, kyc, document: kycDocument },
          owner: localStorage.getItem("id"),
          gst,
        },
        receiver: {
          name: receiverName,
          companyName: receiverCompanyName,
          email: receiverEmail,
          address: receiverAddress,
          address2: receiverAddress2,
          city: receiverCity,
          state: receiverState,
          country: receiverCountry,
          zip: receiverZipCode,
          contact: formattedReceiverContact,
          owner: localStorage.getItem("id"),
        },
        boxes,
        ...(isEdit
          ? {}
          : {
            parcelStatus: [{ status: "Shipment AWB Prepared", timestamp: new Date(), comment: "" }],
            ourBoxes: boxes,
            vendorBoxes: boxes,
          }),
        // Map the selected Rate into the AWB structure
        ...(selectedRate && {
          rateInfo: {
            courier: selectedCourier,
            service: selectedRate.originalName,
            zone: selectedRate.sales?.zone || "",
            weight: totalChargeableWeight,
            // Display Sales values in rateInfo for quick view
            rate: (selectedRate.sales?.rates?.ratePerKg || 0).toString(),
            baseCharge: (selectedRate.sales?.rates?.baseTotal || 0).toString(),
            fuelSurcharge: (selectedRate.sales?.charges?.fuelAmount || 0).toString(),
            otherCharges: (selectedRate.sales?.charges?.otherCharges || []).reduce((sum, c) => sum + c.amount, 0).toFixed(2),
            GST: (selectedRate.sales?.charges?.gstAmount || 0).toString(),
            totalWithGST: (selectedRate.sales?.grandTotal || 0).toString(),
          },
          financials: {
            sales: selectedRate.sales,
            purchase: selectedRate.purchase,
            netProfit: selectedRate.netProfit,
            internalCosts: [],
            payments: []
          }
        }),
      }

      const response = isEdit
        ? await axios.put(`/api/awb/${trackingNumber}`, parcelData)
        : await axios.post("/api/awb", parcelData)

      if (response.status === 200) {
        setSuccess(true)
      } else {
        toast.error(`Failed to ${isEdit ? "update" : "save"} the parcel.`)
      }
    } catch (error) {
      console.error(error)
      toast.error(`An error occurred.`)
    } finally {
      setLoading(false)
    }
  }

  const getCourierInfo = (type) => {
    return { name: type, color: "bg-blue-600", textColor: "text-blue-50" }
  }

  // HSN Auto-fill
  const handleHsnCodeChange = async (boxIndex, itemIndex, hsnCode) => {
    setBoxes((prevBoxes) => {
      const updatedBoxes = [...prevBoxes]
      updatedBoxes[boxIndex].items[itemIndex] = { ...updatedBoxes[boxIndex].items[itemIndex], hsnCode: hsnCode }
      return updatedBoxes
    })
    if (hsnCode && hsnCode.length >= 4) {
      try {
        const mockItem = mockHsnData.find((item) => item.code === hsnCode)
        if (mockItem) {
          setBoxes((prevBoxes) => {
            const updatedBoxes = [...prevBoxes]
            if (!updatedBoxes[boxIndex].items[itemIndex].name) {
              updatedBoxes[boxIndex].items[itemIndex] = { ...updatedBoxes[boxIndex].items[itemIndex], name: mockItem.item }
            }
            return updatedBoxes
          })
          return
        }
        const response = await axios.get(`/api/hsn?code=${encodeURIComponent(hsnCode)}`)
        if (response.data && response.data.length > 0) {
          const hsnItem = response.data[0]
          setBoxes((prevBoxes) => {
            const updatedBoxes = [...prevBoxes]
            if (!updatedBoxes[boxIndex].items[itemIndex].name) {
              updatedBoxes[boxIndex].items[itemIndex] = { ...updatedBoxes[boxIndex].items[itemIndex], name: hsnItem.item }
            }
            return updatedBoxes
          })
        }
      } catch (error) {
        console.error("Error fetching item by HSN code:", error)
      }
    }
  }

  const CountryCombobox = ({ value, onSelect, open, onOpenChange }) => (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {value || "Select country..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {Countries.map((country) => (
                <CommandItem key={country} value={country} onSelect={() => { onSelect(country); onOpenChange(false) }}>
                  <Check className={cn("mr-2 h-4 w-4", value === country ? "opacity-100" : "opacity-0")} />
                  {country}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="bg-slate-50/50 min-h-screen">
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            {isEdit ? "Edit Booking" : "Create New Booking"}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Fill in the details below to {isEdit ? "update the" : "create a new"} airway bill.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <FormSection title="Basic Details" description="Provide the core information for this shipment." icon={<FileText className="h-6 w-6" />}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FormInput label="Sr No:" id="invoiceNumber">
                <Input id="invoiceNumber" value={invoiceNumber} readOnly disabled />
              </FormInput>
              <FormInput label="AWB No:" id="trackingNumber">
                <Input id="trackingNumber" value={trackingNumber} onChange={(e) => { setTrackingNumber(e.target.value) }} />
              </FormInput>
              <FormInput label="Date" id="date">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                </Popover>
              </FormInput>
              <FormInput label="Destination Country" required>
                <CountryCombobox value={receiverCountry} onSelect={setReceiverCountry} open={receiverCountryOpen} onOpenChange={setReceiverCountryOpen} />
              </FormInput>
              <FormInput label="Parcel Type">
                <Select value={parcelType} onValueChange={setParcelType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="International">International</SelectItem>
                    <SelectItem value="Domestic">Domestic</SelectItem>
                  </SelectContent>
                </Select>
              </FormInput>
              <FormInput label="Via">
                <Select value={via} onValueChange={setVia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Air Shipment">Air Shipment</SelectItem>
                    <SelectItem value="Cargo">Cargo</SelectItem>
                    <SelectItem value="Roadways">Roadways</SelectItem>
                    <SelectItem value="Railways">Railways</SelectItem>
                  </SelectContent>
                </Select>
              </FormInput>
              <FormInput label="Shipment Type">
                <Select value={shipmentType} onValueChange={setShipmentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Non Document">Non Document</SelectItem>
                  </SelectContent>
                </Select>
              </FormInput>

              <div className="lg:col-span-1">
                <FormInput label="Reference Code" id="refCode">
                  {userType === "admin" || userType === "branch" || userType === "franchise" ? (
                    <Popover open={isRefDropdownOpen} onOpenChange={setIsRefDropdownOpen}>
                      <PopoverAnchor>
                        <Input id="refCode" placeholder="Search Franchise/Client..." value={refSearchTerm} onChange={(e) => { setRefSearchTerm(e.target.value); setIsRefDropdownOpen(true); }} onFocus={() => setIsRefDropdownOpen(true)} autoComplete="off" />
                      </PopoverAnchor>
                      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Command>
                          <CommandList>
                            <CommandEmpty>No options found</CommandEmpty>
                            <CommandGroup>
                              {filteredRefOptions.map((option) => (
                                <CommandItem key={`${option.type}-${option.code}`} onSelect={() => handleRefOptionSelect(option)} className="flex justify-between cursor-pointer">
                                  <span>{option.name}</span>
                                  <span className="text-xs text-muted-foreground">{option.type.charAt(0).toUpperCase()}-{option.code}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input id="refCode" placeholder="Reference Code" value={refCode} onChange={(e) => setRefCode(e.target.value)} autoComplete="off" disabled={isClient} />
                  )}
                </FormInput>
              </div>

              {isEdit && (
                <>
                  <FormInput label="Forwarding No:" id="forwardingNo"><Input id="forwardingNo" value={forwardingNumber} onChange={(e) => setForwardingNumber(e.target.value)} /></FormInput>
                  <FormInput label="Forwarding Link:" id="forwardingLink"><Input id="forwardingLink" value={forwardingLink} onChange={(e) => setForwardingLink(e.target.value)} /></FormInput>
                </>
              )}
            </div>
          </FormSection>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <FormSection title="Box & Weight Details" description="Enter box dimensions to calculate weight and fetch shipping rates." icon={<Package className="h-6 w-6" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end border-b pb-6 mb-6">
                  <FormInput label="How many boxes?" id="boxCount">
                    <Input id="boxCount" type="number" placeholder="e.g., 3" value={boxCount} onChange={(e) => setBoxCount(e.target.value)} />
                  </FormInput>
                  <Button type="button" onClick={generateBoxes} className="w-full sm:w-auto sm:self-end">Generate Boxes</Button>
                </div>

                {boxes.length > 0 && (
                  <div className="space-y-4">
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Box</TableHead>
                            <TableHead>Actual Wt. (kg)</TableHead>
                            <TableHead>L (cm)</TableHead>
                            <TableHead>B (cm)</TableHead>
                            <TableHead>H (cm)</TableHead>
                            <TableHead>Dim. Wt.</TableHead>
                            <TableHead>Chargeable Wt.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {boxes.map((box, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell><Input type="number" value={box.actualWeight} onChange={(e) => handleBoxChange(index, "actualWeight", e.target.value)} className="min-w-[80px]" /></TableCell>
                              <TableCell><Input type="number" value={box.length} onChange={(e) => handleBoxChange(index, "length", e.target.value)} className="min-w-[80px]" /></TableCell>
                              <TableCell><Input type="number" value={box.breadth} onChange={(e) => handleBoxChange(index, "breadth", e.target.value)} className="min-w-[80px]" /></TableCell>
                              <TableCell><Input type="number" value={box.height} onChange={(e) => handleBoxChange(index, "height", e.target.value)} className="min-w-[80px]" /></TableCell>
                              <TableCell>{box.dimensionalWeight || "0.00"}</TableCell>
                              <TableCell className="font-semibold">{box.chargeableWeight || "0.0"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                      <div><Label>Total Actual</Label><div className="font-bold text-lg">{totalWeights.actual} kg</div></div>
                      <div><Label>Total Dimensional</Label><div className="font-bold text-lg">{totalWeights.dimensional} kg</div></div>
                      <div><Label>Total Chargeable</Label><div className="font-bold text-lg text-primary">{totalWeights.chargeable} kg</div></div>
                    </div>
                  </div>
                )}
              </FormSection>
            </div>

            <div className="lg:col-span-2">
              <FormSection title="Shipping Rates" description="Fetch and select the best courier rate for your shipment." icon={<TruckIcon className="h-6 w-6" />}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <Label htmlFor="gst-toggle" className="text-sm font-medium">Show Price Including GST</Label>
                    <Switch id="gst-toggle" checked={includeGST} onCheckedChange={setIncludeGST} />
                  </div>
                  <Button type="button" onClick={fetchRates} className="w-full" disabled={fetchingRates || !canFetchRates}>
                    <TruckIcon className="mr-2 h-4 w-4" />
                    {fetchingRates ? "Fetching Rates..." : "Get Available Rates"}
                  </Button>
                  <div className="space-y-3">
                    {fetchingRates && Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg animate-pulse bg-slate-100">
                        <div className="h-4 bg-slate-300 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-slate-300 rounded w-1/2"></div>
                      </div>
                    ))}
                    {rates && !fetchingRates && rates.filter((r) => r.success).map((rate, index) => {
                      const info = getCourierInfo(rate.type)
                      const salesRate = rate.sales;
                      const price = includeGST ? salesRate.grandTotal : salesRate.subTotal;
                      const pricePerKg = (price / Number.parseFloat(totalChargeableWeight || 1)).toFixed(2);

                      return (
                        <Card
                          key={rate.type || index}
                          onClick={() => handleSelectRate(rate)}
                          className={cn(
                            "cursor-pointer transition-all hover:border-primary",
                            selectedCourier === rate.type && "border-primary ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {selectedCourier === rate.type ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2"></div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge className={cn(info.color, info.textColor)}>{info.name}</Badge>
                                  <span className="font-semibold">{rate.type}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">{rate.service}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">₹{price}</div>
                              <div className="text-xs text-muted-foreground">
                                ₹{pricePerKg}/kg {includeGST ? "(Inc. GST)" : "(Excl. GST)"}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                    {selectedRate && !rates && (
                      <Card className="border-primary ring-2 ring-primary ring-offset-2">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <Badge
                                className={cn(
                                  getCourierInfo(selectedCourier).color,
                                  getCourierInfo(selectedCourier).textColor
                                )}
                              >
                                {getCourierInfo(selectedCourier).name}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground ml-8">{selectedRate.service}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              ₹{includeGST ? selectedRate.sales?.grandTotal : selectedRate.sales?.subTotal}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ₹{((includeGST ? selectedRate.sales?.grandTotal : selectedRate.sales?.subTotal) / Number.parseFloat(totalChargeableWeight || 1)).toFixed(2)}
                              /kg {includeGST ? "(Inc. GST)" : "(Excl. GST)"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </FormSection>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormSection title="Sender Details" icon={<Users className="h-6 w-6" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormInput label="Sender Name" id="senderName" required>
                    <div className="flex gap-2">
                      <Input id="senderName" placeholder="John Doe" value={senderName} onChange={(e) => setSenderName(e.target.value)} disabled={isClient} />
                      <Button type="button" variant="outline" size="icon" onClick={() => openSearch("sender")}><Search className="h-4 w-4" /></Button>
                    </div>
                  </FormInput>
                </div>
                <FormInput label="Company Name" id="senderCompanyName"><Input value={senderCompanyName} onChange={(e) => setSenderCompanyName(e.target.value)} disabled={isClient} /></FormInput>
                <FormInput label="Email" id="senderEmail"><Input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} /></FormInput>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 1" id="senderAddress" required>
                    <Textarea rows={2} maxLength={30} value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} disabled={isClient} />
                    <div className="text-xs text-muted-foreground text-right">{senderAddress.length}/20</div>
                  </FormInput>
                </div>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 2" id="senderAddress2"><Textarea rows={2} value={senderAddress2} onChange={(e) => setSenderAddress2(e.target.value)} disabled={isClient} /></FormInput>
                </div>
                <FormInput label="City" id="senderCity"><Input value={senderCity} onChange={(e) => setSenderCity(e.target.value)} /></FormInput>
                <FormInput label="State" id="senderState"><Input value={senderState} onChange={(e) => setSenderState(e.target.value)} /></FormInput>
                <FormInput label="Zip Code" id="senderZipCode" required><Input value={senderZipCode} onChange={(e) => setSenderZipCode(e.target.value.replace(/\s/g, ""))} disabled={isClient} /></FormInput>
                <FormInput label="Country" id="senderCountry" required><CountryCombobox value={senderCountry} onSelect={setSenderCountry} open={senderCountryOpen} onOpenChange={setSenderCountryOpen} /></FormInput>
                <FormInput label="Contact" id="senderContact" required>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-slate-50 text-sm text-muted-foreground">{getCallingCode(senderCountry) || "+"}</span>
                    <Input type="text" className="rounded-l-none" value={senderContact} onChange={(e) => setSenderContact(e.target.value)} disabled={isClient} />
                  </div>
                </FormInput>
                <FormInput label="GST" id="gst"><Input value={gst} onChange={(e) => setGst(e.target.value)} disabled={isClient} /></FormInput>
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="KYC Type" required>
                    <Select value={kycType} onValueChange={setKycType} disabled={isClient}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Aadhaar No -", "Pan No -", "Passport No -", "Driving License No -", "Voter ID Card No -", "GST No -"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormInput>
                  <FormInput label="KYC Number" id="kyc" required><Input value={kyc} onChange={(e) => setKyc(e.target.value)} disabled={isClient} /></FormInput>
                </div>
              </div>
            </FormSection>

            <FormSection title="Receiver Details" icon={<Users className="h-6 w-6" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormInput label="Receiver Name" id="receiverName" required>
                    <div className="flex gap-2">
                      <Input id="receiverName" placeholder="Jane Smith" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                      <Button type="button" variant="outline" size="icon" onClick={() => openSearch("receiver")}><Search className="h-4 w-4" /></Button>
                    </div>
                  </FormInput>
                </div>
                <FormInput label="Company Name" id="receiverCompanyName"><Input value={receiverCompanyName} onChange={(e) => setReceiverCompanyName(e.target.value)} /></FormInput>
                <FormInput label="Email" id="receiverEmail"><Input type="email" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} /></FormInput>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 1" id="receiverAddress" required>
                    <Textarea rows={2} maxLength={30} value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} />
                    <div className="text-xs text-muted-foreground text-right">{receiverAddress.length}/20</div>
                  </FormInput>
                </div>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 2" id="receiverAddress2"><Textarea rows={2} value={receiverAddress2} onChange={(e) => setReceiverAddress2(e.target.value)} /></FormInput>
                </div>
                <FormInput label="City" id="receiverCity"><Input value={receiverCity} onChange={(e) => setReceiverCity(e.target.value)} /></FormInput>
                <FormInput label="State" id="receiverState"><Input value={receiverState} onChange={(e) => setReceiverState(e.target.value)} /></FormInput>
                <FormInput label="Zip Code" id="receiverZipCode" required><Input value={receiverZipCode} onChange={(e) => setReceiverZipCode(e.target.value.replace(/\s/g, ""))} /></FormInput>
                <FormInput label="Contact" id="receiverContact" required>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-slate-50 text-sm text-muted-foreground">{getCallingCode(receiverCountry) || "+"}</span>
                    <Input type="text" className="rounded-l-none" value={receiverContact} onChange={(e) => setReceiverContact(e.target.value)} />
                  </div>
                </FormInput>
              </div>
            </FormSection>
          </div>

          {boxes.length > 0 && (
            <FormSection title="Shipping Invoice" description="Detail the items within each box for customs purposes." icon={<FileText className="h-6 w-6" />}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 mb-6 pb-6 border-b">
                <div className="flex items-center space-x-2">
                  <Checkbox id="createShippingInvoice" checked={showItemDetails} onCheckedChange={setShowItemDetails} />
                  <Label htmlFor="createShippingInvoice" className="font-medium text-sm">Create Shipping Invoice?</Label>
                </div>
                <div className="flex items-center gap-4">
                  <FormInput label="Currency">
                    <Select value={shippingCurrency} onValueChange={setShippingCurrency}>
                      <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="₹">₹</SelectItem><SelectItem value="$">$</SelectItem></SelectContent>
                    </Select>
                  </FormInput>
                  <div className="text-right"><Label>Total Value</Label><div className="font-bold text-lg">{shippingCurrency} {totalShippingValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div></div>
                </div>
              </div>

              {showItemDetails && (
                <div className="space-y-6">
                  {boxes.map((box, boxIndex) => (
                    <div key={`box-items-${boxIndex}`} className="p-4 border rounded-lg bg-white">
                      <h4 className="font-semibold mb-4">Box {boxIndex + 1} Items</h4>
                      <div className="space-y-4">
                        {box.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end border-b pb-3">
                            <div className="md:col-span-3">
                              <FormInput label="Item Name" required>
                                <ItemNameAutocomplete
                                  id={`itemName-${boxIndex}-${itemIndex}`}
                                  value={item.name || ""}
                                  onChange={(value) => handleItemChange(boxIndex, itemIndex, "name", value)}
                                  onHsnSelect={(hsnItem) => {
                                    handleItemChange(boxIndex, itemIndex, "hsnCode", hsnItem.code);
                                    if (!item.name) handleItemChange(boxIndex, itemIndex, "name", hsnItem.item);
                                  }}
                                  required={showItemDetails}
                                />
                              </FormInput>
                            </div>
                            <div className="md:col-span-2"><FormInput label="Quantity" required><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(boxIndex, itemIndex, "quantity", e.target.value)} /></FormInput></div>
                            <div className="md:col-span-2"><FormInput label="Price" required><Input type="number" value={item.price} onChange={(e) => handleItemChange(boxIndex, itemIndex, "price", e.target.value)} /></FormInput></div>
                            <div className="md:col-span-3">
                              <FormInput label="HSN Code">
                                <div className="flex gap-2">
                                  <Input value={item.hsnCode} onChange={(e) => handleHsnCodeChange(boxIndex, itemIndex, e.target.value)} />
                                  <Button type="button" variant="outline" size="icon" onClick={() => openHsnSearch(boxIndex, itemIndex)}><Search className="h-4 w-4" /></Button>
                                </div>
                              </FormInput>
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                              {box.items.length > 1 && (<Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => removeItem(boxIndex, itemIndex)}><Minus className="h-4 w-4 mr-1" />Remove</Button>)}
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem(boxIndex)}><Plus className="h-4 w-4 mr-2" />Add Item to Box {boxIndex + 1}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>
          )}

          <div className="flex justify-end pt-8">
            <Button size="lg" type="submit" className="bg-[#E31E24] hover:bg-[#C71D23] text-white" disabled={loading}>
              {loading ? "Processing..." : isEdit ? "Update Booking" : "Create Booking"}
            </Button>
          </div>
        </form>

        <Dialog open={success} onOpenChange={setSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{`AWB ${isEdit ? "Updated" : "Created"} Successfully`}</DialogTitle>
              <DialogDescription>{`The AWB has been ${isEdit ? "updated" : "created"} successfully. Click the button below to view AWB or go back to AWB Table.`}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-center gap-2 sm:justify-center">
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push(`/shipping-and-label/${trackingNumber}`)}>Print</Button>
              <Button className="bg-green-600 hover:bg-green-800" onClick={() => router.push(`/awb`)}>Back to AWB Table</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Search {searchType === "sender" ? "Sender" : "Receiver"}</DialogTitle>
              <DialogDescription>Search for existing customers or enter a new name</DialogDescription>
            </DialogHeader>
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder={`Search ${searchType === "sender" ? "sender" : "receiver"} name...`} value={searchTerm} onValueChange={setSearchTerm} />
              <CommandList>
                <CommandEmpty>No customers found. You can add a new one.</CommandEmpty>
                <CommandGroup heading="Customers">
                  {filteredCustomers.map((customer) => (
                    <CommandItem key={customer._id || customer.name} onSelect={() => handleSelectCustomer(customer)} className="cursor-pointer">
                      {customer.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowSearchDialog(false)}>Cancel</Button>
              <Button onClick={() => { if (searchType === "sender") setSenderName(searchTerm); else if (searchType === "receiver") setReceiverName(searchTerm); setShowSearchDialog(false); }} disabled={!searchTerm}>Use New Name</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <HsnSearchDialog open={showHsnSearchDialog} onOpenChange={setShowHsnSearchDialog} onSelect={handleSelectHsn} />
      </div>
    </div>
  )
}