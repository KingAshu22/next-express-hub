"use client"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
  AlertCircle,
  Loader2,
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
]

// --- Validation Helper Functions ---

const validateEmail = (email) => {
  if (!email) return true // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateSenderMobile = (mobile) => {
  if (!mobile) return false
  const cleanMobile = mobile.replace(/[^\d]/g, "")
  return cleanMobile.length === 10
}

const validateReceiverMobile = (mobile) => {
  if (!mobile) return false
  const cleanMobile = mobile.replace(/[^\d]/g, "")
  return cleanMobile.length >= 5 && cleanMobile.length <= 15
}

const validateZipCode = (zipCode) => {
  if (!zipCode) return false
  return zipCode.length >= 3 && zipCode.length <= 10
}

const validateRequired = (value) => {
  if (typeof value === "string") return value.trim().length > 0
  return value !== null && value !== undefined
}

const validateName = (name) => {
  if (!name) return false
  return name.trim().length >= 2 && name.trim().length <= 100
}

const validateAddress = (address) => {
  if (!address) return false
  return address.trim().length >= 5 && address.trim().length <= 200
}

const validateKYC = (kycType, kyc) => {
  if (!kyc) return false
  const cleanKyc = kyc.replace(/[^\w]/g, "")

  switch (kycType) {
    case "Aadhaar No -":
      return /^\d{12}$/.test(cleanKyc)
    case "Pan No -":
      return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(cleanKyc)
    case "Passport No -":
      return cleanKyc.length >= 6 && cleanKyc.length <= 20
    case "Driving License No -":
      return cleanKyc.length >= 10 && cleanKyc.length <= 20
    case "Voter ID Card No -":
      return cleanKyc.length >= 10 && cleanKyc.length <= 20
    case "GST No -":
      return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(cleanKyc)
    default:
      return cleanKyc.length >= 5
  }
}

const validateGST = (gst) => {
  if (!gst) return true // Optional field
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst)
}

const validateBoxDimensions = (box) => {
  const errors = []
  if (!box.actualWeight || Number(box.actualWeight) <= 0) {
    errors.push("Actual weight is required and must be greater than 0")
  }
  if (!box.length || Number(box.length) <= 0) {
    errors.push("Length is required and must be greater than 0")
  }
  if (!box.breadth || Number(box.breadth) <= 0) {
    errors.push("Breadth is required and must be greater than 0")
  }
  if (!box.height || Number(box.height) <= 0) {
    errors.push("Height is required and must be greater than 0")
  }
  return errors
}

const validateItem = (item, showItemDetails) => {
  if (!showItemDetails) return []
  const errors = []
  if (!item.name || item.name.trim().length === 0) {
    errors.push("Item name is required")
  }
  if (!item.quantity || Number(item.quantity) <= 0) {
    errors.push("Quantity is required and must be greater than 0")
  }
  if (!item.price || Number(item.price) <= 0) {
    errors.push("Price is required and must be greater than 0")
  }
  return errors
}

// --- Debounce Hook ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// --- Helper Components ---

const FormSection = ({ title, description, icon, children, className }) => (
  <Card className={cn("overflow-hidden", className)}>
    <CardHeader className="py-1 px-2">
      <div className="flex items-start gap-1">
        {icon && <div className="bg-primary/10 text-primary p-0.5 rounded text-xs">{icon}</div>}
        <div>
          <CardTitle className="text-xs text-primary">{title}</CardTitle>
          {description && <CardDescription className="mt-0 text-xs">{description}</CardDescription>}
        </div>
      </div>
    </CardHeader>
    <CardContent className="py-1 px-2">{children}</CardContent>
  </Card>
)

const FormInput = ({ id, label, children, required, error, helperText, isLoading, className }) => (
  <div className={cn("space-y-0.5", className)}>
    <Label htmlFor={id} className="font-medium flex items-center gap-0.5 text-xs">
      {label} {required && <span className="text-destructive">*</span>}
      {isLoading && <Loader2 className="h-2 w-2 animate-spin text-muted-foreground" />}
    </Label>
    {children}
    {error && (
      <div className="flex items-center gap-0.5 text-destructive text-xs">
        <AlertCircle className="h-2 w-2" />
        <span>{error}</span>
      </div>
    )}
    {helperText && !error && <div className="text-muted-foreground text-xs">{helperText}</div>}
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

  // Separate state for each country dropdown
  const [senderCountryOpen, setSenderCountryOpen] = useState(false)
  const [receiverCountryOpen, setReceiverCountryOpen] = useState(false)
  const [destinationCountryOpen, setDestinationCountryOpen] = useState(false)

  // Validation errors state
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Rate fetching state
  const [fetchingRates, setFetchingRates] = useState(false)
  const [rates, setRates] = useState(null)
  const [selectedRate, setSelectedRate] = useState(null)
  const [selectedCourier, setSelectedCourier] = useState(null)
  const [includeGST, setIncludeGST] = useState(false)

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

  // Forwarding Details
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

  // Loading state for postal API
  const [loadingReceiverPostal, setLoadingReceiverPostal] = useState(false)
  const [loadingSenderPostal, setLoadingSenderPostal] = useState(false)

  // Track if postal data was fetched to avoid overwriting manual edits
  const [receiverPostalFetched, setReceiverPostalFetched] = useState(false)
  const [senderPostalFetched, setSenderPostalFetched] = useState(false)

  // Box details
  const [boxes, setBoxes] = useState(awb?.boxes || [])
  const [availableTypes, setAvailableTypes] = useState([])
  const userType = typeof window !== "undefined" ? localStorage.getItem("userType") : ""
  const [isClient, setIsClient] = useState(userType === "client")

  // Derived state
  const [totalChargeableWeight, setTotalChargeableWeight] = useState("")
  const [error, setError] = useState(null)

  // Debounced values for postal lookup
  const debouncedReceiverZipCode = useDebounce(receiverZipCode, 500)
  const debouncedSenderZipCode = useDebounce(senderZipCode, 500)

  // Refs to track previous values and avoid unnecessary API calls
  const prevReceiverZipRef = useRef("")
  const prevReceiverCountryRef = useRef("")
  const prevSenderZipRef = useRef("")
  const prevSenderCountryRef = useRef("")

  // Get calling code
  const getCallingCode = (countryName) => countryCodeMap[countryName]?.callingCode || ""

  // Get country code (ISO 2-letter code)
  const getCountryCode = (countryName) => {
    const mapping = countryCodeMap[countryName]
    if (mapping) {
      return mapping.code || ""
    }
    // Fallback: try to find by partial match
    const keys = Object.keys(countryCodeMap)
    const found = keys.find(key => key.toLowerCase() === countryName?.toLowerCase())
    return found ? countryCodeMap[found].code : ""
  }

  // Fetch postal data from API
  const fetchPostalData = async (postalCode, countryCode, countryName) => {
    console.log("Fetching postal data for:", { postalCode, countryCode, countryName })
    
    try {
      const postalApiKey = process.env.NEXT_PUBLIC_POSTAL_API_KEY
      
      if (!postalApiKey) {
        console.warn("Postal API key not found. Please set NEXT_PUBLIC_POSTAL_API_KEY in your environment.")
        return null
      }

      if (!postalCode || !countryCode) {
        console.warn("Missing postal code or country code")
        return null
      }

      const response = await axios.get(`https://api.worldpostallocations.com/pincode`, {
        params: { 
          apikey: postalApiKey, 
          postalcode: postalCode, 
          countrycode: countryCode 
        },
        timeout: 10000, // 10 second timeout
      })

      console.log("Postal API response:", response.data)

      if (response.data?.status === true && response.data?.result?.length > 0) {
        const result = response.data.result[0]
        return {
          city: result.district || result.city || result.postalLocation || "",
          state: result.state || result.province || result.region || "",
          address: [result.postalLocation, result.province].filter(Boolean).join(", "),
          raw: result
        }
      }
      
      console.log("No postal data found for:", postalCode)
      return null
    } catch (error) {
      console.error("Error fetching postal data:", error.message)
      if (error.response) {
        console.error("Response error:", error.response.data)
      }
      return null
    }
  }

  // Alternative postal lookup using a backup API (India specific)
  const fetchIndiaPostalData = async (pincode) => {
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, {
        timeout: 10000,
      })
      
      console.log("India Postal API response:", response.data)
      
      if (response.data?.[0]?.Status === "Success" && response.data?.[0]?.PostOffice?.length > 0) {
        const postOffice = response.data[0].PostOffice[0]
        return {
          city: postOffice.District || postOffice.Name || "",
          state: postOffice.State || "",
          address: postOffice.Name || "",
          raw: postOffice
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching India postal data:", error.message)
      return null
    }
  }

  // Combined postal lookup function
  const lookupPostalData = async (postalCode, countryCode, countryName) => {
    // First try the world postal locations API
    let result = await fetchPostalData(postalCode, countryCode, countryName)
    
    // If no result and it's India, try the India-specific API
    if (!result && (countryCode === "IN" || countryName === "India")) {
      console.log("Trying India-specific postal API...")
      result = await fetchIndiaPostalData(postalCode)
    }
    
    return result
  }

  // Mark field as touched
  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }))
    validateField(fieldName)
  }

  // Validate single field
  const validateField = (fieldName) => {
    let error = ""

    switch (fieldName) {
      case "senderName":
        if (!validateName(senderName)) error = "Name must be between 2 and 100 characters"
        break
      case "senderEmail":
        if (!validateEmail(senderEmail)) error = "Please enter a valid email address"
        break
      case "senderAddress":
        if (!validateAddress(senderAddress)) error = "Address must be between 5 and 200 characters"
        break
      case "senderZipCode":
        if (!validateZipCode(senderZipCode)) error = "Please enter a valid zip code"
        break
      case "senderContact":
        if (!validateSenderMobile(senderContact)) error = "Sender mobile number must be exactly 10 digits"
        break
      case "senderCountry":
        if (!validateRequired(senderCountry)) error = "Please select a country"
        break
      case "kyc":
        if (!validateKYC(kycType, kyc)) error = `Please enter a valid ${kycType.replace(" -", "")}`
        break
      case "gst":
        if (!validateGST(gst)) error = "Please enter a valid GST number"
        break
      case "receiverName":
        if (!validateName(receiverName)) error = "Name must be between 2 and 100 characters"
        break
      case "receiverEmail":
        if (!validateEmail(receiverEmail)) error = "Please enter a valid email address"
        break
      case "receiverAddress":
        if (!validateAddress(receiverAddress)) error = "Address must be between 5 and 200 characters"
        break
      case "receiverZipCode":
        if (!validateZipCode(receiverZipCode)) error = "Please enter a valid zip code"
        break
      case "receiverContact":
        if (!validateReceiverMobile(receiverContact)) error = "Receiver mobile number must be between 5 and 15 digits"
        break
      case "receiverCountry":
        if (!validateRequired(receiverCountry)) error = "Please select a country"
        break
      case "receiverCity":
        if (!validateRequired(receiverCity)) error = "City is required"
        break
      case "receiverState":
        if (!validateRequired(receiverState)) error = "State is required"
        break
      default:
        break
    }

    setErrors((prev) => ({ ...prev, [fieldName]: error }))
    return error === ""
  }

  // Validate all fields before submit
  const validateAllFields = () => {
    const fieldsToValidate = [
      "senderName",
      "senderAddress",
      "senderZipCode",
      "senderContact",
      "senderCountry",
      "kyc",
      "receiverName",
      "receiverAddress",
      "receiverZipCode",
      "receiverContact",
      "receiverCountry",
      "receiverCity",
      "receiverState",
    ]

    // Mark all fields as touched
    const newTouched = {}
    fieldsToValidate.forEach((field) => {
      newTouched[field] = true
    })
    setTouched(newTouched)

    // Validate all fields
    let allValid = true
    fieldsToValidate.forEach((field) => {
      if (!validateField(field)) {
        allValid = false
      }
    })

    // Validate boxes
    if (boxes.length === 0) {
      toast.error("Please add at least one box")
      allValid = false
    } else {
      boxes.forEach((box, boxIndex) => {
        const boxErrors = validateBoxDimensions(box)
        if (boxErrors.length > 0) {
          toast.error(`Box ${boxIndex + 1}: ${boxErrors[0]}`)
          allValid = false
        }

        if (showItemDetails) {
          box.items.forEach((item, itemIndex) => {
            const itemErrors = validateItem(item, showItemDetails)
            if (itemErrors.length > 0) {
              toast.error(`Box ${boxIndex + 1}, Item ${itemIndex + 1}: ${itemErrors[0]}`)
              allValid = false
            }
          })
        }
      })
    }

    // Shipping rate selection is optional
    // Users can submit without selecting a rate

    return allValid
  }

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

  // Filtered customers for search
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers
    return customers.filter((customer) => customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [customers, searchTerm])

  // Box Logic - Fixed to preserve existing data
  const generateBoxes = () => {
    const count = Number.parseInt(boxCount, 10)
    if (isNaN(count) || count <= 0) {
      toast.error("Please enter a valid number of boxes")
      return
    }

    setBoxes((prevBoxes) => {
      const newBoxes = [...prevBoxes]
      const currentCount = newBoxes.length

      if (count > currentCount) {
        // Add new boxes without affecting existing ones
        for (let i = currentCount; i < count; i++) {
          newBoxes.push({
            length: "",
            breadth: "",
            height: "",
            actualWeight: "",
            dimensionalWeight: "",
            chargeableWeight: "",
            items: [{ name: "", quantity: "", price: "", hsnCode: "" }],
          })
        }
      } else if (count < currentCount) {
        // Remove boxes from the end
        newBoxes.splice(count)
      }

      return newBoxes
    })
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
            code: f.code,
            name: f.name,
            type: "franchise",
          }))
          const clients = (Array.isArray(clientRes.data) ? clientRes.data : [clientRes.data]).map((c) => ({
            code: c.code,
            name: c.name,
            type: "client",
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
            code: c.code,
            name: c.name,
            type: "client",
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

  // Auto-fill SENDER address from zip - using debounced value
  useEffect(() => {
    const updateSenderAddress = async () => {
      // Check if we should fetch - minimum length and country selected
      if (!debouncedSenderZipCode || debouncedSenderZipCode.length < 4 || !senderCountry) {
        return
      }

      // Check if values actually changed to avoid duplicate calls
      if (
        debouncedSenderZipCode === prevSenderZipRef.current &&
        senderCountry === prevSenderCountryRef.current
      ) {
        return
      }

      // Update refs
      prevSenderZipRef.current = debouncedSenderZipCode
      prevSenderCountryRef.current = senderCountry

      const countryCode = getCountryCode(senderCountry)
      console.log("Sender postal lookup:", { zip: debouncedSenderZipCode, countryCode, country: senderCountry })

      if (!countryCode) {
        console.warn("No country code found for:", senderCountry)
        return
      }

      setLoadingSenderPostal(true)

      try {
        const postalData = await lookupPostalData(debouncedSenderZipCode, countryCode, senderCountry)
        
        if (postalData) {
          console.log("Sender postal data found:", postalData)
          
          // Only update if fields are empty or if postal data was previously fetched
          if (!senderCity || senderPostalFetched) {
            setSenderCity(postalData.city)
          }
          if (!senderState || senderPostalFetched) {
            setSenderState(postalData.state)
          }
          if (!senderAddress2 && postalData.address) {
            setSenderAddress2(postalData.address)
          }
          
          setSenderPostalFetched(true)
          toast.success("Sender address auto-filled from pin code")
        } else {
          console.log("No postal data found for sender zip code")
        }
      } catch (error) {
        console.error("Error in sender postal lookup:", error)
      } finally {
        setLoadingSenderPostal(false)
      }
    }

    updateSenderAddress()
  }, [debouncedSenderZipCode, senderCountry])

  // Auto-fill RECEIVER address from zip - using debounced value
  useEffect(() => {
    const updateReceiverAddress = async () => {
      // Check if we should fetch - minimum length and country selected
      if (!debouncedReceiverZipCode || debouncedReceiverZipCode.length < 4 || !receiverCountry) {
        return
      }

      // Check if values actually changed to avoid duplicate calls
      if (
        debouncedReceiverZipCode === prevReceiverZipRef.current &&
        receiverCountry === prevReceiverCountryRef.current
      ) {
        return
      }

      // Update refs
      prevReceiverZipRef.current = debouncedReceiverZipCode
      prevReceiverCountryRef.current = receiverCountry

      const countryCode = getCountryCode(receiverCountry)
      console.log("Receiver postal lookup:", { zip: debouncedReceiverZipCode, countryCode, country: receiverCountry })

      if (!countryCode) {
        console.warn("No country code found for:", receiverCountry)
        return
      }

      setLoadingReceiverPostal(true)

      try {
        const postalData = await lookupPostalData(debouncedReceiverZipCode, countryCode, receiverCountry)
        
        if (postalData) {
          console.log("Receiver postal data found:", postalData)
          
          // Only update if fields are empty or if postal data was previously fetched
          if (!receiverCity || receiverPostalFetched) {
            setReceiverCity(postalData.city)
          }
          if (!receiverState || receiverPostalFetched) {
            setReceiverState(postalData.state)
          }
          if (!receiverAddress2 && postalData.address) {
            setReceiverAddress2(postalData.address)
          }
          
          setReceiverPostalFetched(true)
          toast.success("Receiver address auto-filled from pin code")
        } else {
          console.log("No postal data found for receiver zip code")
          // Don't show error toast - user can fill manually
        }
      } catch (error) {
        console.error("Error in receiver postal lookup:", error)
      } finally {
        setLoadingReceiverPostal(false)
      }
    }

    updateReceiverAddress()
  }, [debouncedReceiverZipCode, receiverCountry])

  // Manual trigger for postal lookup
  const handleManualPostalLookup = async (type) => {
    if (type === "sender") {
      if (!senderZipCode || senderZipCode.length < 4) {
        toast.error("Please enter a valid pin code (minimum 4 characters)")
        return
      }
      if (!senderCountry) {
        toast.error("Please select a country first")
        return
      }

      const countryCode = getCountryCode(senderCountry)
      if (!countryCode) {
        toast.error("Country code not found. Please select a valid country.")
        return
      }

      setLoadingSenderPostal(true)
      try {
        const postalData = await lookupPostalData(senderZipCode, countryCode, senderCountry)
        if (postalData) {
          setSenderCity(postalData.city)
          setSenderState(postalData.state)
          if (postalData.address) setSenderAddress2(postalData.address)
          setSenderPostalFetched(true)
          toast.success("Address auto-filled successfully!")
        } else {
          toast.error("Could not find address for this pin code. Please enter manually.")
        }
      } catch (error) {
        toast.error("Failed to lookup address. Please enter manually.")
      } finally {
        setLoadingSenderPostal(false)
      }
    } else if (type === "receiver") {
      if (!receiverZipCode || receiverZipCode.length < 4) {
        toast.error("Please enter a valid pin code (minimum 4 characters)")
        return
      }
      if (!receiverCountry) {
        toast.error("Please select a country first")
        return
      }

      const countryCode = getCountryCode(receiverCountry)
      if (!countryCode) {
        toast.error("Country code not found. Please select a valid country.")
        return
      }

      setLoadingReceiverPostal(true)
      try {
        const postalData = await lookupPostalData(receiverZipCode, countryCode, receiverCountry)
        if (postalData) {
          setReceiverCity(postalData.city)
          setReceiverState(postalData.state)
          if (postalData.address) setReceiverAddress2(postalData.address)
          setReceiverPostalFetched(true)
          toast.success("Address auto-filled successfully!")
        } else {
          toast.error("Could not find address for this pin code. Please enter manually.")
        }
      } catch (error) {
        toast.error("Failed to lookup address. Please enter manually.")
      } finally {
        setLoadingReceiverPostal(false)
      }
    }
  }

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
        originalName: awb.rateInfo.service,
        service: awb.rateInfo.courier,
        sales: awb.financials?.sales,
        purchase: awb.financials?.purchase,
        netProfit: awb.financials?.netProfit,
        type: awb.rateInfo.courier,
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

  // Box/Item Handlers - Fixed to preserve data
  const addBox = useCallback(() => {
    setBoxes((prevBoxes) => [
      ...prevBoxes,
      {
        length: "",
        breadth: "",
        height: "",
        actualWeight: "",
        dimensionalWeight: "",
        chargeableWeight: "",
        items: [{ name: "", quantity: "", price: "", hsnCode: "" }],
      },
    ])
  }, [])

  const removeBox = useCallback((boxIndex) => {
    setBoxes((prevBoxes) => {
      if (prevBoxes.length <= 1) {
        toast.error("At least one box is required")
        return prevBoxes
      }
      // Create a new array without the removed box
      // This preserves all other boxes' data
      return prevBoxes.filter((_, index) => index !== boxIndex)
    })
  }, [])

  const handleBoxChange = useCallback(
    (index, field, value) => {
      setBoxes((prevBoxes) => {
        const updatedBoxes = prevBoxes.map((box, i) => {
          if (i !== index) return box

          let newValue = value
          if (field === "actualWeight" && shipmentType === "Document") {
            if (Number.parseFloat(value) > 3) {
              toast.error("For Document shipment, actual weight cannot exceed 3 kg.")
              newValue = ""
            }
          }

          const updatedBox = { ...box, [field]: newValue }

          if (["length", "breadth", "height", "actualWeight"].includes(field)) {
            const length = Number(updatedBox.length) || 0
            const breadth = Number(updatedBox.breadth) || 0
            const height = Number(updatedBox.height) || 0
            const actualWeight = Number(updatedBox.actualWeight) || 0
            const dimensionalWeight = ((length * breadth * height) / 5000).toFixed(3)
            const chargeableWeightRaw = Math.max(actualWeight, Number(dimensionalWeight))
            let chargeableWeight
            if (chargeableWeightRaw < 20) {
              chargeableWeight = Math.ceil(chargeableWeightRaw * 2) / 2
            } else {
              chargeableWeight = Math.ceil(chargeableWeightRaw)
            }
            updatedBox.dimensionalWeight = dimensionalWeight
            updatedBox.chargeableWeight = chargeableWeight
          }

          return updatedBox
        })
        return updatedBoxes
      })
    },
    [shipmentType]
  )

  const addItem = useCallback((boxIndex) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, i) => {
        if (i !== boxIndex) return box
        return {
          ...box,
          items: [...box.items, { name: "", quantity: "", price: "", hsnCode: "" }],
        }
      })
    })
  }, [])

  const removeItem = useCallback((boxIndex, itemIndex) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, i) => {
        if (i !== boxIndex) return box
        if (box.items.length <= 1) {
          toast.error("At least one item is required per box")
          return box
        }
        return {
          ...box,
          items: box.items.filter((_, idx) => idx !== itemIndex),
        }
      })
    })
  }, [])

  const handleItemChange = useCallback((boxIndex, itemIndex, field, value) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, i) => {
        if (i !== boxIndex) return box
        return {
          ...box,
          items: box.items.map((item, idx) => (idx === itemIndex ? { ...item, [field]: value } : item)),
        }
      })
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
      return prevBoxes.map((box, i) => {
        if (i !== boxIndex) return box
        return {
          ...box,
          items: box.items.map((item, idx) => {
            if (idx !== itemIndex) return item
            return {
              ...item,
              hsnCode: hsnItem.code,
              name: item.name || hsnItem.item,
            }
          }),
        }
      })
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
        grandTotal: data.subtotalBeforeGST,
      }
    }

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
                otherCharges: Object.entries(salesData.chargesBreakdown || {}).map(([name, amount]) => ({
                  name,
                  amount,
                })),
                awbCharge: 0,
                fuelSurcharge: salesData.chargesBreakdown?.["Fuel Surcharge"] || 0,
                fuelAmount: salesData.chargesBreakdown?.["Fuel Surcharge"] || 0,
                ...salesGST,
              },
              subTotal: salesGST.subTotal,
              grandTotal: salesGST.grandTotal,
            }

            let purchaseFinancials = null

            if (salesData.ratePurchaseId) {
              try {
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
                    otherCharges: Object.entries(purchaseData.chargesBreakdown || {}).map(([name, amount]) => ({
                      name,
                      amount,
                    })),
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
          }))
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
    setSelectedCourier(rate.type)
    const price = includeGST ? rate.sales.grandTotal : rate.sales.subTotal
    toast.success(`Selected ${rate.type} rate: ₹${price}`)
  }

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all fields before submitting
    if (!validateAllFields()) {
      toast.error("Please fix all validation errors before submitting")
      return
    }

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

      let formattedReceiverContact = receiverContact.replace(/[^\d]/g, "")

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
        ...(selectedRate && {
          rateInfo: {
            courier: selectedCourier,
            service: selectedRate.originalName,
            zone: selectedRate.sales?.zone || "",
            weight: totalChargeableWeight,
            rate: (selectedRate.sales?.rates?.ratePerKg || 0).toString(),
            baseCharge: (selectedRate.sales?.rates?.baseTotal || 0).toString(),
            fuelSurcharge: (selectedRate.sales?.charges?.fuelAmount || 0).toString(),
            otherCharges: (selectedRate.sales?.charges?.otherCharges || [])
              .reduce((sum, c) => sum + c.amount, 0)
              .toFixed(2),
            GST: (selectedRate.sales?.charges?.gstAmount || 0).toString(),
            totalWithGST: (selectedRate.sales?.grandTotal || 0).toString(),
          },
          financials: {
            sales: selectedRate.sales,
            purchase: selectedRate.purchase,
            netProfit: selectedRate.netProfit,
            internalCosts: [],
            payments: [],
          },
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
      return prevBoxes.map((box, i) => {
        if (i !== boxIndex) return box
        return {
          ...box,
          items: box.items.map((item, idx) => (idx === itemIndex ? { ...item, hsnCode: hsnCode } : item)),
        }
      })
    })

    if (hsnCode && hsnCode.length >= 4) {
      try {
        const mockItem = mockHsnData.find((item) => item.code === hsnCode)
        if (mockItem) {
          setBoxes((prevBoxes) => {
            return prevBoxes.map((box, i) => {
              if (i !== boxIndex) return box
              return {
                ...box,
                items: box.items.map((item, idx) => {
                  if (idx !== itemIndex) return item
                  return {
                    ...item,
                    name: item.name || mockItem.item,
                  }
                }),
              }
            })
          })
          return
        }
        const response = await axios.get(`/api/hsn?code=${encodeURIComponent(hsnCode)}`)
        if (response.data && response.data.length > 0) {
          const hsnItem = response.data[0]
          setBoxes((prevBoxes) => {
            return prevBoxes.map((box, i) => {
              if (i !== boxIndex) return box
              return {
                ...box,
                items: box.items.map((item, idx) => {
                  if (idx !== itemIndex) return item
                  return {
                    ...item,
                    name: item.name || hsnItem.item,
                  }
                }),
              }
            })
          })
        }
      } catch (error) {
        console.error("Error fetching item by HSN code:", error)
      }
    }
  }

  // Country Combobox Component
  const CountryCombobox = ({ value, onSelect, open, onOpenChange, disabled = false }) => {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
            onClick={() => onOpenChange(!open)}
          >
            {value || "Select country..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {Countries.map((country) => (
                  <CommandItem
                    key={country}
                    value={country}
                    onSelect={() => {
                      onSelect(country)
                      onOpenChange(false)
                    }}
                  >
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
  }

  return (
    <div className="bg-slate-50/50 min-h-screen">
      <div className="container mx-auto max-w-7xl p-2">
        <header className="mb-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-2xl">
            {isEdit ? "Edit Booking" : "Create New Booking"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the details below to {isEdit ? "update the" : "create a new"} airway bill.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-2">
          <FormSection
            title="Basic Details"
            description="Provide the core information for this shipment."
            icon={<FileText className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
              <FormInput label="Sr No:" id="invoiceNumber" className="hidden">
                <Input id="invoiceNumber" value={invoiceNumber} readOnly disabled />
              </FormInput>
              <FormInput label="AWB No:" id="trackingNumber" className="hidden">
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value)
                  }}
                />
              </FormInput>
              <FormInput label="Date" id="date">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal h-8 text-xs", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {date ? format(date, "PPP") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </FormInput>

              {/* Destination Country - Using separate state */}
              <FormInput label="Destination Country" required error={touched.receiverCountry && errors.receiverCountry}>
                <CountryCombobox
                  value={receiverCountry}
                  onSelect={(country) => {
                    setReceiverCountry(country)
                    setReceiverPostalFetched(false) // Reset to allow new postal lookup
                    handleBlur("receiverCountry")
                  }}
                  open={destinationCountryOpen}
                  onOpenChange={setDestinationCountryOpen}
                />
              </FormInput>

              {/* Destination Pin Code in Basic Details */}
              <FormInput
                label="Destination Pin Code"
                id="destinationZipCode"
                required
                error={touched.receiverZipCode && errors.receiverZipCode}
                helperText="Enter pin code to auto-fill city & state"
                isLoading={loadingReceiverPostal}
              >
                <div className="flex gap-2">
                  <Input
                    id="destinationZipCode"
                    placeholder="Enter destination pin code"
                    value={receiverZipCode}
                    onChange={(e) => {
                      setReceiverZipCode(e.target.value.replace(/\s/g, ""))
                      setReceiverPostalFetched(false) // Allow new lookup on change
                    }}
                    onBlur={() => handleBlur("receiverZipCode")}
                    className={cn(touched.receiverZipCode && errors.receiverZipCode && "border-destructive")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => handleManualPostalLookup("receiver")}
                    disabled={loadingReceiverPostal}
                    title="Lookup address from pin code"
                  >
                    {loadingReceiverPostal ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Search className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </FormInput>

              {/* Destination City in Basic Details */}
              <FormInput
                label="Destination City"
                id="destinationCity"
                required
                error={touched.receiverCity && errors.receiverCity}
                isLoading={loadingReceiverPostal}
              >
                <Input
                  id="destinationCity"
                  placeholder={loadingReceiverPostal ? "Loading..." : "Enter city"}
                  value={receiverCity}
                  onChange={(e) => setReceiverCity(e.target.value)}
                  onBlur={() => handleBlur("receiverCity")}
                  className={cn(touched.receiverCity && errors.receiverCity && "border-destructive")}
                />
              </FormInput>

              {/* Destination State in Basic Details */}
              <FormInput
                label="Destination State"
                id="destinationState"
                required
                error={touched.receiverState && errors.receiverState}
                isLoading={loadingReceiverPostal}
              >
                <Input
                  id="destinationState"
                  placeholder={loadingReceiverPostal ? "Loading..." : "Enter state"}
                  value={receiverState}
                  onChange={(e) => setReceiverState(e.target.value)}
                  onBlur={() => handleBlur("receiverState")}
                  className={cn(touched.receiverState && errors.receiverState && "border-destructive")}
                />
              </FormInput>

              <FormInput label="Parcel Type">
                <Select value={parcelType} onValueChange={setParcelType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="International">International</SelectItem>
                    <SelectItem value="Domestic">Domestic</SelectItem>
                  </SelectContent>
                </Select>
              </FormInput>
              <FormInput label="Via">
                <Select value={via} onValueChange={setVia}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                        <Input
                          id="refCode"
                          placeholder="Search Franchise/Client..."
                          value={refSearchTerm}
                          onChange={(e) => {
                            setRefSearchTerm(e.target.value)
                            setIsRefDropdownOpen(true)
                          }}
                          onFocus={() => setIsRefDropdownOpen(true)}
                          autoComplete="off"
                        />
                      </PopoverAnchor>
                      <PopoverContent
                        className="p-0 w-[--radix-popover-trigger-width]"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Command>
                          <CommandList>
                            <CommandEmpty>No options found</CommandEmpty>
                            <CommandGroup>
                              {filteredRefOptions.map((option) => (
                                <CommandItem
                                  key={`${option.type}-${option.code}`}
                                  onSelect={() => handleRefOptionSelect(option)}
                                  className="flex justify-between cursor-pointer"
                                >
                                  <span>{option.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {option.type.charAt(0).toUpperCase()}-{option.code}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input
                      id="refCode"
                      placeholder="Reference Code"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                      autoComplete="off"
                      disabled={isClient}
                    />
                  )}
                </FormInput>
              </div>

              {isEdit && (
                <>
                  <FormInput label="Forwarding No:" id="forwardingNo">
                    <Input
                      id="forwardingNo"
                      value={forwardingNumber}
                      onChange={(e) => setForwardingNumber(e.target.value)}
                    />
                  </FormInput>
                  <FormInput label="Forwarding Link:" id="forwardingLink">
                    <Input
                      id="forwardingLink"
                      value={forwardingLink}
                      onChange={(e) => setForwardingLink(e.target.value)}
                    />
                  </FormInput>
                </>
              )}
            </div>
          </FormSection>

          <div className="grid grid-cols-1 gap-1 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <FormSection
                title="Box & Weight Details"
                description="Enter box dimensions to calculate weight and fetch shipping rates."
                icon={<Package className="h-4 w-4" />}
              >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 items-end border-b pb-1 mb-1">
                  <FormInput label="How many boxes?" id="boxCount">
                    <Input
                      id="boxCount"
                      type="number"
                      placeholder="e.g., 3"
                      value={boxCount}
                      onChange={(e) => setBoxCount(e.target.value)}
                      min="1"
                    />
                  </FormInput>
                  <Button type="button" onClick={generateBoxes} className="w-full sm:w-auto sm:self-end h-7 text-xs" size="sm">
                    Generate Boxes
                  </Button>
                  <Button type="button" onClick={addBox} variant="outline" className="w-full sm:w-auto sm:self-end h-7 text-xs" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Single Box
                  </Button>
                </div>

                {boxes.length > 0 && (
                  <div className="space-y-2">
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-100">
                          <TableRow className="h-6">
                            <TableHead className="p-1 text-xs">Box</TableHead>
                            <TableHead className="p-1 text-xs">Actual Wt.</TableHead>
                            <TableHead className="p-1 text-xs">L</TableHead>
                            <TableHead className="p-1 text-xs">B</TableHead>
                            <TableHead className="p-1 text-xs">H</TableHead>
                            <TableHead className="p-1 text-xs">Dim. Wt.</TableHead>
                            <TableHead className="p-1 text-xs">Chargeable</TableHead>
                            <TableHead className="p-1 text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {boxes.map((box, index) => (
                            <TableRow key={`box-${index}`} className="h-6">
                              <TableCell className="p-1 font-xs text-xs">{index + 1}</TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="number"
                                  value={box.actualWeight}
                                  onChange={(e) => handleBoxChange(index, "actualWeight", e.target.value)}
                                  className="min-w-[60px] h-6 text-xs p-1"
                                  min="0"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="number"
                                  value={box.length}
                                  onChange={(e) => handleBoxChange(index, "length", e.target.value)}
                                  className="min-w-[60px] h-6 text-xs p-1"
                                  min="0"
                                />
                              </TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="number"
                                  value={box.breadth}
                                  onChange={(e) => handleBoxChange(index, "breadth", e.target.value)}
                                  className="min-w-[60px] h-6 text-xs p-1"
                                  min="0"
                                />
                              </TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="number"
                                  value={box.height}
                                  onChange={(e) => handleBoxChange(index, "height", e.target.value)}
                                  className="min-w-[60px] h-6 text-xs p-1"
                                  min="0"
                                />
                              </TableCell>
                              <TableCell className="p-1 text-xs">{box.dimensionalWeight || "0.00"}</TableCell>
                              <TableCell className="p-1 text-xs font-semibold">{box.chargeableWeight || "0.0"}</TableCell>
                              <TableCell className="p-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 text-destructive hover:bg-destructive/10"
                                  onClick={() => removeBox(index)}
                                  disabled={boxes.length <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1 border-t">
                      <div>
                        <Label>Total Actual</Label>
                        <div className="font-bold text-lg">{totalWeights.actual} kg</div>
                      </div>
                      <div>
                        <Label>Total Dimensional</Label>
                        <div className="font-bold text-lg">{totalWeights.dimensional} kg</div>
                      </div>
                      <div>
                        <Label>Total Chargeable</Label>
                        <div className="font-bold text-lg text-primary">{totalWeights.chargeable} kg</div>
                      </div>
                    </div>
                  </div>
                )}
              </FormSection>
            </div>

            <div className="lg:col-span-2">
              <FormSection
                title="Shipping Rates"
                description="Fetch and select the best courier rate for your shipment."
                icon={<TruckIcon className="h-4 w-4" />}
              >
                <div className="space-y-2">
                <div className="flex justify-between items-center mb-1 px-0 gap-1">
                    <Label htmlFor="gst-toggle" className="text-sm font-medium">
                      Show Price Including GST
                    </Label>
                    <Switch id="gst-toggle" checked={includeGST} onCheckedChange={setIncludeGST} />
                  </div>
                  <Button
                    type="button"
                    onClick={fetchRates}
                    className="w-full"
                    disabled={fetchingRates || !canFetchRates}
                  >
                    <TruckIcon className="mr-2 h-4 w-4" />
                    {fetchingRates ? "Fetching Rates..." : "Get Available Rates"}
                  </Button>
                  <div className="space-y-1">
                    {fetchingRates &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-1 border rounded-lg animate-pulse bg-slate-100">
                          <div className="h-2 bg-slate-300 rounded mb-1 w-3/4"></div>
                          <div className="h-2 bg-slate-300 rounded w-1/2"></div>
                        </div>
                      ))}
                    {rates &&
                      !fetchingRates &&
                      rates
                        .filter((r) => r.success)
                        .map((rate, index) => {
                          const info = getCourierInfo(rate.type)
                          const salesRate = rate.sales
                          const price = includeGST ? salesRate.grandTotal : salesRate.subTotal
                          const pricePerKg = (price / Number.parseFloat(totalChargeableWeight || 1)).toFixed(2)

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
                              ₹
                              {(
                                (includeGST ? selectedRate.sales?.grandTotal : selectedRate.sales?.subTotal) /
                                Number.parseFloat(totalChargeableWeight || 1)
                              ).toFixed(2)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
            <FormSection title="Sender Details" icon={<Users className="h-4 w-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="sm:col-span-2">
                  <FormInput
                    label="Sender Name"
                    id="senderName"
                    required
                    error={touched.senderName && errors.senderName}
                  >
                    <div className="flex gap-2">
                      <Input
                        id="senderName"
                        placeholder="John Doe"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        onBlur={() => handleBlur("senderName")}
                        disabled={isClient}
                        className={cn(touched.senderName && errors.senderName && "border-destructive")}
                      />
                      <Button type="button" variant="outline" size="sm" className="h-6 px-2" onClick={() => openSearch("sender")}>
                        <Search className="h-3 w-3" />
                      </Button>
                    </div>
                  </FormInput>
                </div>
                <FormInput label="Company Name" id="senderCompanyName">
                  <Input
                    value={senderCompanyName}
                    onChange={(e) => setSenderCompanyName(e.target.value)}
                    disabled={isClient}
                  />
                </FormInput>
                <FormInput label="Email" id="senderEmail" error={touched.senderEmail && errors.senderEmail}>
                  <Input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    onBlur={() => handleBlur("senderEmail")}
                    className={cn(touched.senderEmail && errors.senderEmail && "border-destructive")}
                  />
                </FormInput>
                <div className="sm:col-span-2">
                  <FormInput
                    label="Address Line 1"
                    id="senderAddress"
                    required
                    error={touched.senderAddress && errors.senderAddress}
                  >
                    <Input
                      maxLength={200}
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value)}
                      onBlur={() => handleBlur("senderAddress")}
                      disabled={isClient}
                      className={cn("text-xs", touched.senderAddress && errors.senderAddress && "border-destructive")}
                    />
                    <div className="text-xs text-muted-foreground text-right">{senderAddress.length}/200</div>
                  </FormInput>
                </div>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 2" id="senderAddress2">
                    <Input
                      value={senderAddress2}
                      onChange={(e) => setSenderAddress2(e.target.value)}
                      disabled={isClient}
                      className="text-xs"
                    />
                  </FormInput>
                </div>
                <FormInput
                  label="Zip Code"
                  id="senderZipCode"
                  required
                  error={touched.senderZipCode && errors.senderZipCode}
                  helperText="Enter zip code to auto-fill city & state"
                  isLoading={loadingSenderPostal}
                >
                  <div className="flex gap-2">
                    <Input
                      value={senderZipCode}
                      onChange={(e) => {
                        setSenderZipCode(e.target.value.replace(/\s/g, ""))
                        setSenderPostalFetched(false)
                      }}
                      onBlur={() => handleBlur("senderZipCode")}
                      disabled={isClient}
                      className={cn(touched.senderZipCode && errors.senderZipCode && "border-destructive")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleManualPostalLookup("sender")}
                      disabled={loadingSenderPostal || isClient}
                      title="Lookup address from pin code"
                    >
                      {loadingSenderPostal ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </FormInput>
                <FormInput
                  label="Country"
                  id="senderCountry"
                  required
                  error={touched.senderCountry && errors.senderCountry}
                >
                  <CountryCombobox
                    value={senderCountry}
                    onSelect={(country) => {
                      setSenderCountry(country)
                      setSenderPostalFetched(false)
                      handleBlur("senderCountry")
                    }}
                    open={senderCountryOpen}
                    onOpenChange={setSenderCountryOpen}
                    disabled={isClient}
                  />
                </FormInput>
                <FormInput label="City" id="senderCity" isLoading={loadingSenderPostal}>
                  <Input
                    value={senderCity}
                    onChange={(e) => setSenderCity(e.target.value)}
                    placeholder={loadingSenderPostal ? "Loading..." : "Enter city"}
                  />
                </FormInput>
                <FormInput label="State" id="senderState" isLoading={loadingSenderPostal}>
                  <Input
                    value={senderState}
                    onChange={(e) => setSenderState(e.target.value)}
                    placeholder={loadingSenderPostal ? "Loading..." : "Enter state"}
                  />
                </FormInput>
                <FormInput
                  label="Contact"
                  id="senderContact"
                  required
                  error={touched.senderContact && errors.senderContact}
                  helperText="Must be exactly 10 digits"
                >
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-slate-50 text-sm text-muted-foreground">
                      {getCallingCode(senderCountry) || "+"}
                    </span>
                    <Input
                      type="text"
                      className={cn(
                        "rounded-l-none",
                        touched.senderContact && errors.senderContact && "border-destructive"
                      )}
                      value={senderContact}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/[^\d]/g, "")
                        setSenderContact(value)
                      }}
                      onBlur={() => handleBlur("senderContact")}
                      disabled={isClient}
                      maxLength={10}
                      placeholder="10 digit mobile number"
                    />
                  </div>
                </FormInput>
                <FormInput label="GST" id="gst" error={touched.gst && errors.gst}>
                  <Input
                    value={gst}
                    onChange={(e) => setGst(e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("gst")}
                    disabled={isClient}
                    className={cn(touched.gst && errors.gst && "border-destructive")}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                  />
                </FormInput>
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="KYC Type" required>
                    <Select value={kycType} onValueChange={setKycType} disabled={isClient}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Aadhaar No -",
                          "Pan No -",
                          "Passport No -",
                          "Driving License No -",
                          "Voter ID Card No -",
                          "GST No -",
                        ].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormInput>
                  <FormInput label="KYC Number" id="kyc" required error={touched.kyc && errors.kyc}>
                    <Input
                      value={kyc}
                      onChange={(e) => setKyc(e.target.value.toUpperCase())}
                      onBlur={() => handleBlur("kyc")}
                      disabled={isClient}
                      className={cn(touched.kyc && errors.kyc && "border-destructive")}
                      placeholder={
                        kycType === "Aadhaar No -"
                          ? "12 digit Aadhaar"
                          : kycType === "Pan No -"
                            ? "e.g., ABCDE1234F"
                            : "Enter KYC number"
                      }
                    />
                  </FormInput>
                </div>
              </div>
            </FormSection>

            <FormSection title="Receiver Details" icon={<Users className="h-4 w-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Country First - needed for postal lookup */}
                <FormInput
                  label="Country"
                  id="receiverCountry"
                  required
                  error={touched.receiverCountry && errors.receiverCountry}
                >
                  <CountryCombobox
                    value={receiverCountry}
                    onSelect={(country) => {
                      setReceiverCountry(country)
                      setReceiverPostalFetched(false)
                      handleBlur("receiverCountry")
                    }}
                    open={receiverCountryOpen}
                    onOpenChange={setReceiverCountryOpen}
                  />
                </FormInput>

                {/* Zip Code - for Auto-fill */}
                <FormInput
                  label="Zip Code"
                  id="receiverZipCode"
                  required
                  error={touched.receiverZipCode && errors.receiverZipCode}
                  helperText="Enter zip code to auto-fill city & state"
                  isLoading={loadingReceiverPostal}
                >
                  <div className="flex gap-2">
                    <Input
                      value={receiverZipCode}
                      onChange={(e) => {
                        setReceiverZipCode(e.target.value.replace(/\s/g, ""))
                        setReceiverPostalFetched(false)
                      }}
                      onBlur={() => handleBlur("receiverZipCode")}
                      className={cn(touched.receiverZipCode && errors.receiverZipCode && "border-destructive")}
                      placeholder="Enter zip code"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleManualPostalLookup("receiver")}
                      disabled={loadingReceiverPostal}
                      title="Lookup address from pin code"
                    >
                      {loadingReceiverPostal ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </FormInput>

                {/* City - Auto-filled but editable */}
                <FormInput
                  label="City"
                  id="receiverCity"
                  required
                  error={touched.receiverCity && errors.receiverCity}
                  isLoading={loadingReceiverPostal}
                >
                  <Input
                    value={receiverCity}
                    onChange={(e) => setReceiverCity(e.target.value)}
                    onBlur={() => handleBlur("receiverCity")}
                    placeholder={loadingReceiverPostal ? "Loading..." : "Enter city"}
                    className={cn(touched.receiverCity && errors.receiverCity && "border-destructive")}
                  />
                </FormInput>

                {/* State - Auto-filled but editable */}
                <FormInput
                  label="State"
                  id="receiverState"
                  required
                  error={touched.receiverState && errors.receiverState}
                  isLoading={loadingReceiverPostal}
                >
                  <Input
                    value={receiverState}
                    onChange={(e) => setReceiverState(e.target.value)}
                    onBlur={() => handleBlur("receiverState")}
                    placeholder={loadingReceiverPostal ? "Loading..." : "Enter state"}
                    className={cn(touched.receiverState && errors.receiverState && "border-destructive")}
                  />
                </FormInput>

                <div className="sm:col-span-2">
                  <FormInput
                    label="Receiver Name"
                    id="receiverName"
                    required
                    error={touched.receiverName && errors.receiverName}
                  >
                    <div className="flex gap-2">
                      <Input
                        id="receiverName"
                        placeholder="Jane Smith"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        onBlur={() => handleBlur("receiverName")}
                        className={cn(touched.receiverName && errors.receiverName && "border-destructive")}
                      />
                      <Button type="button" variant="outline" size="sm" className="h-6 px-2" onClick={() => openSearch("receiver")}>
                        <Search className="h-3 w-3" />
                      </Button>
                    </div>
                  </FormInput>
                </div>
                <FormInput label="Company Name" id="receiverCompanyName">
                  <Input value={receiverCompanyName} onChange={(e) => setReceiverCompanyName(e.target.value)} />
                </FormInput>
                <FormInput label="Email" id="receiverEmail" error={touched.receiverEmail && errors.receiverEmail}>
                  <Input
                    type="email"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    onBlur={() => handleBlur("receiverEmail")}
                    className={cn(touched.receiverEmail && errors.receiverEmail && "border-destructive")}
                  />
                </FormInput>
                <div className="sm:col-span-2">
                  <FormInput
                    label="Address Line 1"
                    id="receiverAddress"
                    required
                    error={touched.receiverAddress && errors.receiverAddress}
                  >
                    <Input
                      maxLength={200}
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      onBlur={() => handleBlur("receiverAddress")}
                      className={cn("text-xs", touched.receiverAddress && errors.receiverAddress && "border-destructive")}
                    />
                    <div className="text-xs text-muted-foreground text-right">{receiverAddress.length}/200</div>
                  </FormInput>
                </div>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 2" id="receiverAddress2">
                    <Input value={receiverAddress2} onChange={(e) => setReceiverAddress2(e.target.value)} className="text-xs" />
                  </FormInput>
                </div>
                <FormInput
                  label="Contact"
                  id="receiverContact"
                  required
                  error={touched.receiverContact && errors.receiverContact}
                  helperText="Must be between 5 and 15 digits"
                >
                  <Input
                    type="text"
                    className={cn(
                      "text-xs",
                      touched.receiverContact && errors.receiverContact && "border-destructive"
                    )}
                    value={receiverContact}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/[^\d]/g, "")
                      setReceiverContact(value)
                    }}
                    onBlur={() => handleBlur("receiverContact")}
                    maxLength={15}
                    placeholder="5-15 digit phone number"
                  />
                </FormInput>
              </div>
            </FormSection>
          </div>

          {boxes.length > 0 && (
            <FormSection
              title="Shipping Invoice"
              description="Detail the items within each box for customs purposes."
              icon={<FileText className="h-4 w-4" />}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-1 sm:space-y-0 sm:space-x-1 mb-1 pb-1 border-b">
                <div className="flex items-center gap-1">
                  <FormInput label="Currency">
                    <Select value={shippingCurrency} onValueChange={setShippingCurrency}>
                      <SelectTrigger className="w-[60px] h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="₹">₹</SelectItem>
                        <SelectItem value="$">$</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormInput>
                  <div className="text-right">
                    <Label className="text-xs">Total Value</Label>
                    <div className="font-bold text-xs">
                      {shippingCurrency} {totalShippingValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                  {boxes.map((box, boxIndex) => (
                    <div key={`box-items-${boxIndex}`} className="p-1 border rounded-lg bg-white">
                      <h4 className="font-semibold mb-1 text-xs">Box {boxIndex + 1}</h4>
                      <div className="space-y-1">
                        {box.items.map((item, itemIndex) => (
                          <div
                            key={`item-${boxIndex}-${itemIndex}`}
                            className="grid grid-cols-1 md:grid-cols-12 gap-x-1 gap-y-0.5 items-end border-b pb-1"
                          >
                            <div className="md:col-span-3">
                              <FormInput label="Item Name" required>
                                <ItemNameAutocomplete
                                  id={`itemName-${boxIndex}-${itemIndex}`}
                                  value={item.name || ""}
                                  onChange={(value) => handleItemChange(boxIndex, itemIndex, "name", value)}
                                  onHsnSelect={(hsnItem) => {
                                    handleItemChange(boxIndex, itemIndex, "hsnCode", hsnItem.code)
                                    if (!item.name) handleItemChange(boxIndex, itemIndex, "name", hsnItem.item)
                                  }}
                                  required={showItemDetails}
                                />
                              </FormInput>
                            </div>
                            <div className="md:col-span-2">
                              <FormInput label="Quantity" required>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(boxIndex, itemIndex, "quantity", e.target.value)}
                                  min="1"
                                />
                              </FormInput>
                            </div>
                            <div className="md:col-span-2">
                              <FormInput label="Price" required>
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => handleItemChange(boxIndex, itemIndex, "price", e.target.value)}
                                  min="0"
                                  step="0.01"
                                />
                              </FormInput>
                            </div>
                            <div className="md:col-span-3">
                              <FormInput label="HSN Code">
                                <div className="flex gap-2">
                                  <Input
                                    value={item.hsnCode}
                                    onChange={(e) => handleHsnCodeChange(boxIndex, itemIndex, e.target.value)}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => openHsnSearch(boxIndex, itemIndex)}
                                  >
                                    <Search className="h-3 w-3" />
                                  </Button>
                                </div>
                              </FormInput>
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                              {box.items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 text-destructive hover:bg-destructive/10 text-xs"
                                  onClick={() => removeItem(boxIndex, itemIndex)}
                                >
                                  <Minus className="h-3 w-3 mr-0.5" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem(boxIndex)} className="h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Item to Box {boxIndex + 1}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </FormSection>
          )}

          <div className="flex justify-end pt-2">
            <Button size="sm" type="submit" className="bg-[#E31E24] hover:bg-[#C71D23] text-white h-8" disabled={loading}>
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
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => router.push(`/shipping-and-label/${trackingNumber}`)}
              >
                Print
              </Button>
              <Button className="bg-green-600 hover:bg-green-800" onClick={() => router.push(`/awb`)}>
                Back to AWB Table
              </Button>
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
              <CommandInput
                placeholder={`Search ${searchType === "sender" ? "sender" : "receiver"} name...`}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>No customers found. You can add a new one.</CommandEmpty>
                <CommandGroup heading="Customers">
                  {filteredCustomers.map((customer) => (
                    <CommandItem
                      key={customer._id || customer.name}
                      onSelect={() => handleSelectCustomer(customer)}
                      className="cursor-pointer"
                    >
                      {customer.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowSearchDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (searchType === "sender") setSenderName(searchTerm)
                  else if (searchType === "receiver") setReceiverName(searchTerm)
                  setShowSearchDialog(false)
                }}
                disabled={!searchTerm}
              >
                Use New Name
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <HsnSearchDialog open={showHsnSearchDialog} onOpenChange={setShowHsnSearchDialog} onSelect={handleSelectHsn} />
      </div>
    </div>
  )
}