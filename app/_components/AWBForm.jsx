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
  Globe,
  Scale,
  Landmark,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertCircle,
  X
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

const mockHsnData = [
  { code: "482030", item: "Document" },
  { code: "630790", item: "Textile articles" },
]

// --- Validation Helper Functions ---
const validateEmail = (email) => {
  if (!email) return true // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone, isSender = true, country = "India") => {
  if (!phone) return { valid: false, message: "Phone number is required" }
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "")
  
  if (isSender) {
    // Sender must have exactly 10 digits
    if (digitsOnly.length !== 10) {
      return { valid: false, message: "Sender phone must be exactly 10 digits" }
    }
  } else {
    // Receiver can have 5-15 digits (international numbers vary)
    if (digitsOnly.length < 5) {
      return { valid: false, message: "Receiver phone must be at least 5 digits" }
    }
    if (digitsOnly.length > 15) {
      return { valid: false, message: "Receiver phone must be at most 15 digits" }
    }
  }
  
  return { valid: true, message: "" }
}

const validateZipCode = (zipCode, country) => {
  if (!zipCode) return { valid: false, message: "Zip code is required" }
  
  // Remove spaces for validation
  const cleanZip = zipCode.replace(/\s/g, "")
  
  // Country-specific validation
  const zipPatterns = {
    "India": { pattern: /^\d{6}$/, message: "Indian PIN code must be 6 digits" },
    "United States": { pattern: /^\d{5}(-\d{4})?$/, message: "US ZIP code must be 5 digits (or 5+4 format)" },
    "United Kingdom": { pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, message: "Invalid UK postcode format" },
    "Canada": { pattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, message: "Invalid Canadian postal code format" },
    "Australia": { pattern: /^\d{4}$/, message: "Australian postcode must be 4 digits" },
  }
  
  if (zipPatterns[country]) {
    if (!zipPatterns[country].pattern.test(cleanZip)) {
      return { valid: false, message: zipPatterns[country].message }
    }
  } else {
    // Generic validation for other countries - at least 3 characters
    if (cleanZip.length < 3) {
      return { valid: false, message: "Zip code must be at least 3 characters" }
    }
  }
  
  return { valid: true, message: "" }
}

const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return { valid: false, message: `${fieldName} is required` }
  }
  return { valid: true, message: "" }
}

const validateGST = (gst) => {
  if (!gst) return { valid: true, message: "" } // GST is optional
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  if (!gstRegex.test(gst.toUpperCase())) {
    return { valid: false, message: "Invalid GST format (e.g., 22AAAAA0000A1Z5)" }
  }
  return { valid: true, message: "" }
}

const validateKYC = (kycType, kycValue) => {
  if (!kycValue) return { valid: false, message: "KYC number is required" }
  
  const patterns = {
    "Aadhaar No -": { pattern: /^\d{12}$/, message: "Aadhaar must be 12 digits" },
    "Pan No -": { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Invalid PAN format (e.g., ABCDE1234F)" },
    "Passport No -": { pattern: /^[A-Z]\d{7}$/, message: "Invalid Passport format (e.g., A1234567)" },
    "Driving License No -": { pattern: /^[A-Z]{2}\d{13}$/, message: "Invalid DL format" },
    "Voter ID Card No -": { pattern: /^[A-Z]{3}\d{7}$/, message: "Invalid Voter ID format" },
    "GST No -": { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: "Invalid GST format" },
  }
  
  if (patterns[kycType]) {
    if (!patterns[kycType].pattern.test(kycValue.toUpperCase())) {
      return { valid: false, message: patterns[kycType].message }
    }
  }
  
  return { valid: true, message: "" }
}

// --- Helper Components ---
const FormSection = ({ title, description, icon, children, className }) => (
  <Card className={cn("overflow-hidden shadow-sm h-full", className)}>
    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
      <div className="flex items-start gap-3">
        {icon && <div className="bg-primary/10 text-primary p-2.5 rounded-lg">{icon}</div>}
        <div className="flex-1">
          <CardTitle className="text-lg text-primary">{title}</CardTitle>
          {description && <CardDescription className="mt-1 text-sm">{description}</CardDescription>}
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-5">{children}</CardContent>
  </Card>
)

const FormInput = ({ id, label, children, required, hint, error }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="font-medium text-sm">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {hint && !error && (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Info className="h-3 w-3" />
        {hint}
      </p>
    )}
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
)

const StepIndicator = ({ steps, currentStep }) => {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-3">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 text-sm",
                index < currentStep && "bg-green-500 text-white shadow-md",
                index === currentStep && "bg-primary text-white ring-4 ring-primary/20 shadow-lg scale-110",
                index > currentStep && "bg-gray-200 text-gray-400"
              )}
            >
              {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
            </div>
            <span
              className={cn(
                "text-xs mt-2 text-center font-medium hidden sm:block transition-colors",
                index === currentStep ? "text-primary" : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}

// --- Main Form Component ---
export default function AWBForm({ isEdit = false, awb }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

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

  const [senderCountryOpen, setSenderCountryOpen] = useState(false)
  const [receiverCountryOpen, setReceiverCountryOpen] = useState(false)

  // Rate fetching state
  const [fetchingRates, setFetchingRates] = useState(false)
  const [rates, setRates] = useState(null)
  const [selectedRate, setSelectedRate] = useState(null)
  const [selectedCourier, setSelectedCourier] = useState(null)
  const [includeGST, setIncludeGST] = useState(true)

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

  const [forwardingNumber, setForwardingNumber] = useState(awb?.forwardingNumber || "")
  const [forwardingLink, setForwardingLink] = useState(awb?.forwardingLink || "")
  const [cNoteNumber, setCNoteNumber] = useState(awb?.cNoteNumber || "")
  const [cNoteVendorName, setCNoteVendorName] = useState(awb?.cNoteVendorName || "")
  const [awbNumber, setAwbNumber] = useState(awb?.awbNumber || "")

  const [shippingCurrency, setShippingCurrency] = useState(awb?.shippingCurrency || "₹")
  const [totalShippingValue, setTotalShippingValue] = useState(awb?.totalShippingValue || 0)

  // Export Details
  const [bankADCode, setBankADCode] = useState(awb?.exportDetails?.bankADCode || "")
  const [bankAccount, setBankAccount] = useState(awb?.exportDetails?.bankAccount || "")
  const [bankIFSC, setBankIFSC] = useState(awb?.exportDetails?.bankIFSC || "")
  const [consignorGSTIN, setConsignorGSTIN] = useState(awb?.exportDetails?.consignorGSTIN || "")
  const [consignorIEC, setConsignorIEC] = useState(awb?.exportDetails?.consignorIEC || "")
  const [csbSelection, setCsbSelection] = useState(awb?.exportDetails?.csbSelection || "CSB V")
  const [termOfInvoice, setTermOfInvoice] = useState(awb?.exportDetails?.termOfInvoice || "FOB")
  const [underMEISScheme, setUnderMEISScheme] = useState(awb?.exportDetails?.underMEISScheme || false)
  const [gstInvoiceNo, setGstInvoiceNo] = useState(awb?.exportDetails?.gstInvoiceNo || "")
  const [gstInvoiceDate, setGstInvoiceDate] = useState(
    awb?.exportDetails?.gstInvoiceDate ? new Date(awb.exportDetails.gstInvoiceDate) : new Date()
  )
  const [againstBondOrLUT, setAgainstBondOrLUT] = useState(awb?.exportDetails?.againstBondOrLUT || false)
  const [igstPaymentStatus, setIgstPaymentStatus] = useState(awb?.exportDetails?.igstPaymentStatus || false)

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

  const [totalChargeableWeight, setTotalChargeableWeight] = useState("")
  const [error, setError] = useState(null)

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})

  // Refs to track if postal data was fetched
  const senderPostalFetched = useRef(false)
  const receiverPostalFetched = useRef(false)

  // Define steps - Combined Box & Weight with Shipping Rates
  const steps = useMemo(() => {
    const baseSteps = [
      { id: "basic", title: "Basic Details", icon: FileText },
      { id: "boxes-rates", title: "Box & Rates", icon: Package },
      { id: "parties", title: "Sender & Receiver", icon: Users },
      { id: "items", title: "Shipping Items", icon: FileText },
    ]

    if (parcelType === "Ecommerce") {
      baseSteps.push({ id: "export", title: "Export Details", icon: Globe })
    }

    return baseSteps
  }, [parcelType])

  // Check if current step is the last step
  const isLastStep = currentStep === steps.length - 1

  const getCallingCode = (countryName) => countryCodeMap[countryName]?.callingCode || ""

  // Mark field as touched
  const markFieldTouched = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
  }

  // Validate a single field
  const validateField = useCallback((fieldName, value, extraParams = {}) => {
    let result = { valid: true, message: "" }

    switch (fieldName) {
      case "senderName":
        result = validateRequired(value, "Sender name")
        break
      case "senderAddress":
        result = validateRequired(value, "Sender address")
        break
      case "senderZipCode":
        result = validateZipCode(value, senderCountry)
        break
      case "senderContact":
        result = validatePhone(value, true, senderCountry)
        break
      case "senderEmail":
        if (value && !validateEmail(value)) {
          result = { valid: false, message: "Invalid email format" }
        }
        break
      case "kyc":
        result = validateKYC(kycType, value)
        break
      case "gst":
        result = validateGST(value)
        break
      case "receiverName":
        result = validateRequired(value, "Receiver name")
        break
      case "receiverAddress":
        result = validateRequired(value, "Receiver address")
        break
      case "receiverZipCode":
        result = validateZipCode(value, receiverCountry)
        break
      case "receiverContact":
        result = validatePhone(value, false, receiverCountry)
        break
      case "receiverEmail":
        if (value && !validateEmail(value)) {
          result = { valid: false, message: "Invalid email format" }
        }
        break
      case "receiverCountry":
        result = validateRequired(value, "Destination country")
        break
      default:
        break
    }

    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: result.valid ? "" : result.message
    }))

    return result.valid
  }, [senderCountry, receiverCountry, kycType])

  // Validate all fields for a step
  const validateAllFieldsForStep = useCallback((stepIndex) => {
    let allValid = true
    const errors = {}

    switch (stepIndex) {
      case 0: // Basic Details
        if (!receiverCountry) {
          errors.receiverCountry = "Destination country is required"
          allValid = false
        }
        break

      case 1: // Box & Weight + Rates
        if (boxes.length === 0) {
          toast.error("Please add at least one box")
          allValid = false
        } else {
          for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i]
            if (!box.actualWeight || Number(box.actualWeight) <= 0) {
              toast.error(`Box ${i + 1}: Actual weight is required and must be greater than 0`)
              allValid = false
              break
            }
            if (!box.length || Number(box.length) <= 0) {
              toast.error(`Box ${i + 1}: Length is required and must be greater than 0`)
              allValid = false
              break
            }
            if (!box.breadth || Number(box.breadth) <= 0) {
              toast.error(`Box ${i + 1}: Breadth is required and must be greater than 0`)
              allValid = false
              break
            }
            if (!box.height || Number(box.height) <= 0) {
              toast.error(`Box ${i + 1}: Height is required and must be greater than 0`)
              allValid = false
              break
            }
          }
        }
        break

      case 2: // Sender & Receiver
        // Sender validations
        const senderNameValid = validateRequired(senderName, "Sender name")
        if (!senderNameValid.valid) {
          errors.senderName = senderNameValid.message
          allValid = false
        }

        const senderAddressValid = validateRequired(senderAddress, "Sender address")
        if (!senderAddressValid.valid) {
          errors.senderAddress = senderAddressValid.message
          allValid = false
        }

        const senderZipValid = validateZipCode(senderZipCode, senderCountry)
        if (!senderZipValid.valid) {
          errors.senderZipCode = senderZipValid.message
          allValid = false
        }

        const senderPhoneValid = validatePhone(senderContact, true, senderCountry)
        if (!senderPhoneValid.valid) {
          errors.senderContact = senderPhoneValid.message
          allValid = false
        }

        if (senderEmail && !validateEmail(senderEmail)) {
          errors.senderEmail = "Invalid email format"
          allValid = false
        }

        const kycValid = validateKYC(kycType, kyc)
        if (!kycValid.valid) {
          errors.kyc = kycValid.message
          allValid = false
        }

        if (gst) {
          const gstValid = validateGST(gst)
          if (!gstValid.valid) {
            errors.gst = gstValid.message
            allValid = false
          }
        }

        // Receiver validations
        const receiverNameValid = validateRequired(receiverName, "Receiver name")
        if (!receiverNameValid.valid) {
          errors.receiverName = receiverNameValid.message
          allValid = false
        }

        const receiverAddressValid = validateRequired(receiverAddress, "Receiver address")
        if (!receiverAddressValid.valid) {
          errors.receiverAddress = receiverAddressValid.message
          allValid = false
        }

        const receiverZipValid = validateZipCode(receiverZipCode, receiverCountry)
        if (!receiverZipValid.valid) {
          errors.receiverZipCode = receiverZipValid.message
          allValid = false
        }

        const receiverPhoneValid = validatePhone(receiverContact, false, receiverCountry)
        if (!receiverPhoneValid.valid) {
          errors.receiverContact = receiverPhoneValid.message
          allValid = false
        }

        if (receiverEmail && !validateEmail(receiverEmail)) {
          errors.receiverEmail = "Invalid email format"
          allValid = false
        }
        break

      case 3: // Items
        for (let boxIdx = 0; boxIdx < boxes.length; boxIdx++) {
          const box = boxes[boxIdx]
          for (let itemIdx = 0; itemIdx < box.items.length; itemIdx++) {
            const item = box.items[itemIdx]
            if (!item.name || !item.name.trim()) {
              toast.error(`Box ${boxIdx + 1}, Item ${itemIdx + 1}: Item name is required`)
              allValid = false
              break
            }
            if (!item.quantity || Number(item.quantity) <= 0) {
              toast.error(`Box ${boxIdx + 1}, Item ${itemIdx + 1}: Quantity must be greater than 0`)
              allValid = false
              break
            }
            if (!item.price || Number(item.price) < 0) {
              toast.error(`Box ${boxIdx + 1}, Item ${itemIdx + 1}: Price is required`)
              allValid = false
              break
            }
          }
          if (!allValid) break
        }
        break

      case 4: // Export Details (Ecommerce only)
        // Export details are mostly optional, but we can add specific validations if needed
        break

      default:
        break
    }

    setValidationErrors(prev => ({ ...prev, ...errors }))
    return allValid
  }, [boxes, senderName, senderAddress, senderZipCode, senderContact, senderEmail, senderCountry, kyc, kycType, gst, receiverName, receiverAddress, receiverZipCode, receiverContact, receiverEmail, receiverCountry])

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

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers
    return customers.filter((customer) => customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [customers, searchTerm])

  // Fixed generateBoxes function - preserves existing boxes
  const generateBoxes = () => {
    const count = Number.parseInt(boxCount, 10)
    if (isNaN(count) || count <= 0) {
      toast.error("Please enter a valid number of boxes")
      return
    }

    if (count > 50) {
      toast.error("Maximum 50 boxes allowed")
      return
    }

    setBoxes(prevBoxes => {
      const currentCount = prevBoxes.length
      
      if (count > currentCount) {
        // Add new boxes while preserving existing ones
        const newBoxes = Array.from({ length: count - currentCount }, () => ({
          length: "",
          breadth: "",
          height: "",
          actualWeight: "",
          dimensionalWeight: "",
          chargeableWeight: "",
          items: [{ name: "", quantity: "", price: "", hsnCode: "" }],
        }))
        return [...prevBoxes, ...newBoxes]
      } else if (count < currentCount) {
        // Remove extra boxes from the end
        return prevBoxes.slice(0, count)
      }
      return prevBoxes
    })
    
    toast.success(`Box count set to ${count}`)
  }

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

  useEffect(() => {
    fetchCustomers()
    if (!isEdit) getInvoiceNumber()
  }, [isEdit])

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

  // Sender postal code auto-fill
  useEffect(() => {
    const updateSenderAddress = async () => {
      if (senderZipCode && senderZipCode.length >= 4 && senderCountry) {
        const countryCode = getCountryCode(senderCountry)
        if (!countryCode) return
        const postalData = await fetchPostalData(senderZipCode, countryCode)
        if (postalData) {
          const { postalLocation, province, district, state } = postalData
          const formattedAddress = [postalLocation, province].filter(Boolean).join(", ")
          setSenderCity(district || "")
          setSenderState(state || "")
          if (!senderAddress2) setSenderAddress2(formattedAddress)
          senderPostalFetched.current = true
        }
      }
    }
    updateSenderAddress()
  }, [senderZipCode, senderCountry])

  // Receiver postal code auto-fill
  useEffect(() => {
    const updateReceiverAddress = async () => {
      if (receiverZipCode && receiverZipCode.length >= 4 && receiverCountry) {
        const countryCode = getCountryCode(receiverCountry)
        if (!countryCode) return
        const postalData = await fetchPostalData(receiverZipCode, countryCode)
        if (postalData) {
          const { postalLocation, province, district, state } = postalData
          const formattedAddress = [postalLocation, province].filter(Boolean).join(", ")
          setReceiverCity(district || "")
          setReceiverState(state || "")
          if (!receiverAddress2) setReceiverAddress2(formattedAddress)
          receiverPostalFetched.current = true
        }
      }
    }
    updateReceiverAddress()
  }, [receiverZipCode, receiverCountry])

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

  // Fixed addBox function - creates a deep copy of new box
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
    toast.success("New box added")
  }, [])

  // Fixed removeBox function - properly removes only the specified box
  const removeBox = useCallback((boxIndex) => {
    setBoxes((prevBoxes) => {
      if (prevBoxes.length <= 1) {
        toast.error("At least one box is required")
        return prevBoxes
      }
      
      // Create a new array without the removed box
      const newBoxes = prevBoxes.filter((_, index) => index !== boxIndex)
      toast.success(`Box ${boxIndex + 1} removed`)
      return newBoxes
    })
  }, [])

  // Fixed handleBoxChange function - uses proper immutable update
  const handleBoxChange = useCallback(
    (index, field, value) => {
      setBoxes((prevBoxes) => {
        // Create a deep copy of the boxes array
        const updatedBoxes = prevBoxes.map((box, i) => {
          if (i !== index) return box
          
          let newValue = value

          if (field === "actualWeight" && shipmentType === "Document") {
            const limit = parcelType === "Ecommerce" ? 3000 : 3
            if (Number.parseFloat(value) > limit) {
              toast.error(
                `For Document shipment, actual weight cannot exceed ${limit} ${parcelType === "Ecommerce" ? "g" : "kg"}.`
              )
              newValue = ""
            }
          }

          const updatedBox = { ...box, [field]: newValue }

          if (["length", "breadth", "height", "actualWeight"].includes(field)) {
            const length = Number(updatedBox.length) || 0
            const breadth = Number(updatedBox.breadth) || 0
            const height = Number(updatedBox.height) || 0
            const actualWeight = Number(updatedBox.actualWeight) || 0

            let dimensionalWeight = ""
            let chargeableWeight = ""

            if (parcelType === "Ecommerce") {
              const volInGrams = ((length * breadth * height) / 5000) * 1000
              dimensionalWeight = volInGrams.toFixed(0)

              const chargeableRaw = Math.max(actualWeight, volInGrams)
              chargeableWeight = Math.ceil(chargeableRaw).toString()
            } else {
              const volInKg = (length * breadth * height) / 5000
              dimensionalWeight = volInKg.toFixed(3)

              const chargeableRaw = Math.max(actualWeight, volInKg)

              let chg = 0
              if (chargeableRaw < 20) {
                chg = Math.ceil(chargeableRaw * 2) / 2
              } else {
                chg = Math.ceil(chargeableRaw)
              }
              chargeableWeight = chg.toString()
            }

            updatedBox.dimensionalWeight = dimensionalWeight
            updatedBox.chargeableWeight = chargeableWeight
          }

          return updatedBox
        })

        return updatedBoxes
      })
    },
    [shipmentType, parcelType]
  )

  // Fixed addItem function - properly adds item to specific box
  const addItem = useCallback((boxIndex) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, index) => {
        if (index !== boxIndex) return box
        return {
          ...box,
          items: [...box.items, { name: "", quantity: "", price: "", hsnCode: "" }],
        }
      })
    })
  }, [])

  // Fixed removeItem function - properly removes item from specific box
  const removeItem = useCallback((boxIndex, itemIndex) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, index) => {
        if (index !== boxIndex) return box
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

  // Fixed handleItemChange function - properly updates item in specific box
  const handleItemChange = useCallback((boxIndex, itemIndex, field, value) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, bIndex) => {
        if (bIndex !== boxIndex) return box
        return {
          ...box,
          items: box.items.map((item, iIndex) => {
            if (iIndex !== itemIndex) return item
            return { ...item, [field]: value }
          }),
        }
      })
    })
  }, [])

  const openHsnSearch = (boxIndex, itemIndex) => {
    setCurrentItemIndex({ boxIndex, itemIndex })
    setShowHsnSearchDialog(true)
  }

  const handleSelectHsn = (hsnItem) => {
    const { boxIndex, itemIndex } = currentItemIndex
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, bIndex) => {
        if (bIndex !== boxIndex) return box
        return {
          ...box,
          items: box.items.map((item, iIndex) => {
            if (iIndex !== itemIndex) return item
            const updatedItem = { ...item, hsnCode: hsnItem.code }
            if (!item.name) {
              updatedItem.name = hsnItem.item
            }
            return updatedItem
          }),
        }
      })
    })
  }

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

  const fetchRates = async () => {
    if (!canFetchRates) {
      toast.error("Please fill in all required fields to fetch rates")
      return
    }
    setFetchingRates(true)
    try {
      // Filter available types based on parcelType
      const relevantTypes =
        parcelType === "Ecommerce"
          ? availableTypes.filter((service) => service.type === "ecommerce")
          : availableTypes.filter((service) => service.type !== "ecommerce")

      if (relevantTypes.length === 0) {
        toast.error(`No ${parcelType === "Ecommerce" ? "ecommerce" : "standard"} rates available`)
        setFetchingRates(false)
        return
      }

      const ratePromises = relevantTypes.map((serviceObj) =>
        axios
          .get("/api/rate", {
            params: {
              type: serviceObj.originalName,
              weight: totalChargeableWeight,
              country: receiverCountry,
              zipCode: receiverZipCode,
              rateCategory: "sales",
              parcelType: parcelType,
              weightUnit: parcelType === "Ecommerce" ? "grams" : "kg",
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
              weightUnit: salesData.weightUnit || "kg",
              rates: {
                ratePerUnit: salesData.perUnitRate || (salesData.baseRate / salesData.calculatedWeight),
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
                    parcelType: parcelType,
                    weightUnit: parcelType === "Ecommerce" ? "grams" : "kg",
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
                  weightUnit: purchaseData.weightUnit || "kg",
                  rates: {
                    ratePerUnit: purchaseData.perUnitRate || (purchaseData.baseRate / purchaseData.calculatedWeight),
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
          .catch((error) => {
            console.error(`Rate fetch error for ${serviceObj.originalName}:`, error.response?.data || error.message)
            return {
              originalName: serviceObj.originalName,
              type: serviceObj.originalName,
              error: error.response?.data?.error || "Failed to fetch rate",
              success: false,
            }
          })
      )

      const results = await Promise.all(ratePromises)
      setRates(results)
      const successCount = results.filter((r) => r.success).length
      if (successCount > 0) {
        toast.success(`Found ${successCount} available rate${successCount > 1 ? "s" : ""}`)
      } else {
        const errors = results.filter(r => !r.success).map(r => r.error).join("; ")
        toast.error(`No rates available: ${errors || "Unknown error"}`)
      }
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
    toast.success(`Selected ${rate.type} rate: ₹${price.toLocaleString()}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Only submit if we're on the last step
    if (!isLastStep) {
      return
    }

    // Final validation before submit
    let allValid = true
    for (let i = 0; i <= currentStep; i++) {
      if (!validateAllFieldsForStep(i)) {
        allValid = false
        toast.error(`Please fix errors in step ${i + 1}`)
        setCurrentStep(i)
        return
      }
    }

    if (!allValid) return

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
        exportDetails: {
          bankADCode,
          bankAccount,
          bankIFSC,
          consignorGSTIN,
          consignorIEC,
          csbSelection,
          termOfInvoice,
          underMEISScheme,
          gstInvoiceNo,
          gstInvoiceDate,
          againstBondOrLUT,
          igstPaymentStatus,
        },
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

  const handleHsnCodeChange = async (boxIndex, itemIndex, hsnCode) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, bIndex) => {
        if (bIndex !== boxIndex) return box
        return {
          ...box,
          items: box.items.map((item, iIndex) => {
            if (iIndex !== itemIndex) return item
            return { ...item, hsnCode: hsnCode }
          }),
        }
      })
    })
    
    if (hsnCode && hsnCode.length >= 4) {
      try {
        const mockItem = mockHsnData.find((item) => item.code === hsnCode)
        if (mockItem) {
          setBoxes((prevBoxes) => {
            return prevBoxes.map((box, bIndex) => {
              if (bIndex !== boxIndex) return box
              return {
                ...box,
                items: box.items.map((item, iIndex) => {
                  if (iIndex !== itemIndex) return item
                  if (!item.name) {
                    return { ...item, name: mockItem.item }
                  }
                  return item
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
            return prevBoxes.map((box, bIndex) => {
              if (bIndex !== boxIndex) return box
              return {
                ...box,
                items: box.items.map((item, iIndex) => {
                  if (iIndex !== itemIndex) return item
                  if (!item.name) {
                    return { ...item, name: hsnItem.item }
                  }
                  return item
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

  // Handle sender phone input - only allow digits and max 10
  const handleSenderPhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
    setSenderContact(value)
    if (touchedFields.senderContact) {
      validateField("senderContact", value)
    }
  }

  // Handle receiver phone input - allow digits and max 15
  const handleReceiverPhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 15)
    setReceiverContact(value)
    if (touchedFields.receiverContact) {
      validateField("receiverContact", value)
    }
  }

  // Validation for each step
  const validateStep = (stepIndex) => {
    return validateAllFieldsForStep(stepIndex)
  }

  const handleNext = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = (e) => {
    e.preventDefault()
    e.stopPropagation()

    setCurrentStep((prev) => Math.max(prev - 1, 0))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()

    if (isLastStep) {
      handleSubmit(e)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Details
        return (
          <FormSection
            title="Basic Details"
            description="Provide the core information for this shipment."
            icon={<FileText className="h-5 w-5" />}
          >
            <div className="space-y-6">
              {/* Parcel Type Selection - Card Style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Parcel Type <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "International", label: "International", icon: Globe, description: "Cross-border shipments" },
                  ].map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setParcelType(option.value)}
                      className={cn(
                        "relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                        parcelType === option.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      {parcelType === option.value && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <option.icon
                        className={cn(
                          "h-8 w-8 mb-2",
                          parcelType === option.value ? "text-primary" : "text-gray-400"
                        )}
                      />
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          parcelType === option.value ? "text-primary" : "text-gray-700"
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 text-center">{option.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FormInput label="Sr No:" id="invoiceNumber">
                  <Input id="invoiceNumber" value={invoiceNumber} readOnly disabled className="bg-gray-50" />
                </FormInput>
                <FormInput label="AWB No:" id="trackingNumber">
                  <Input id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                </FormInput>
                <FormInput label="Date" id="date">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </FormInput>

                <FormInput label="Destination Country" required error={validationErrors.receiverCountry}>
                  <CountryCombobox
                    value={receiverCountry}
                    onSelect={(country) => {
                      setReceiverCountry(country)
                      setValidationErrors(prev => ({ ...prev, receiverCountry: "" }))
                    }}
                    open={receiverCountryOpen}
                    onOpenChange={setReceiverCountryOpen}
                  />
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
                      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" onOpenAutoFocus={(e) => e.preventDefault()}>
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

                {isEdit && (
                  <>
                    <FormInput label="Forwarding No:" id="forwardingNo">
                      <Input id="forwardingNo" value={forwardingNumber} onChange={(e) => setForwardingNumber(e.target.value)} />
                    </FormInput>
                    <FormInput label="Forwarding Link:" id="forwardingLink">
                      <Input id="forwardingLink" value={forwardingLink} onChange={(e) => setForwardingLink(e.target.value)} />
                    </FormInput>
                  </>
                )}
              </div>
            </div>
          </FormSection>
        )

      case 1: // Box & Weight + Shipping Rates (Combined - Side by Side)
        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Side - Box & Weight Details (3 columns) */}
            <div className="lg:col-span-3">
              <FormSection
                title="Box & Weight Details"
                description="Enter box dimensions and weight information."
                icon={<Package className="h-5 w-5" />}
              >
                <div className="space-y-5">
                  {parcelType === "Ecommerce" && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <Scale className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 ml-2">
                        <strong>E-commerce Mode:</strong> Enter Actual Weight in <strong>Grams</strong>.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex-1">
                      <FormInput label="Number of Boxes" id="boxCount" hint="Enter total boxes needed (existing data will be preserved)">
                        <Input
                          id="boxCount"
                          type="number"
                          placeholder="e.g., 3"
                          value={boxCount}
                          onChange={(e) => setBoxCount(e.target.value)}
                          min="1"
                          max="50"
                        />
                      </FormInput>
                    </div>
                    <Button type="button" onClick={generateBoxes} className="sm:self-end" size="lg">
                      <Package className="mr-2 h-4 w-4" />
                      {boxes.length > 0 ? "Update Count" : "Generate"}
                    </Button>
                  </div>

                  {boxes.length > 0 && (
                    <div className="space-y-4">
                      <div className="w-full overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold w-16">Box</TableHead>
                              <TableHead className="font-semibold">
                                Wt. {parcelType === "Ecommerce" ? "(g)" : "(kg)"} *
                              </TableHead>
                              <TableHead className="font-semibold">L (cm) *</TableHead>
                              <TableHead className="font-semibold">B (cm) *</TableHead>
                              <TableHead className="font-semibold">H (cm) *</TableHead>
                              <TableHead className="font-semibold">Vol.</TableHead>
                              <TableHead className="font-semibold">Chg.</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {boxes.map((box, index) => (
                              <TableRow key={`box-${index}`} className="hover:bg-muted/30">
                                <TableCell>
                                  <Badge variant="outline" className="font-mono">
                                    {index + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={box.actualWeight}
                                    onChange={(e) => handleBoxChange(index, "actualWeight", e.target.value)}
                                    className={cn("w-20", !box.actualWeight && "border-amber-300")}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={box.length}
                                    onChange={(e) => handleBoxChange(index, "length", e.target.value)}
                                    className={cn("w-16", !box.length && "border-amber-300")}
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={box.breadth}
                                    onChange={(e) => handleBoxChange(index, "breadth", e.target.value)}
                                    className={cn("w-16", !box.breadth && "border-amber-300")}
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={box.height}
                                    onChange={(e) => handleBoxChange(index, "height", e.target.value)}
                                    className={cn("w-16", !box.height && "border-amber-300")}
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                  />
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{box.dimensionalWeight || "-"}</TableCell>
                                <TableCell className="font-bold text-primary">{box.chargeableWeight || "-"}</TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeBox(index)}
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    disabled={boxes.length <= 1}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                        <div className="text-center">
                          <Label className="text-xs text-muted-foreground">Actual</Label>
                          <div className="font-bold text-lg text-primary">
                            {totalWeights.actual}
                          </div>
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-muted-foreground">Volumetric</Label>
                          <div className="font-bold text-lg text-primary">
                            {totalWeights.dimensional}
                          </div>
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-muted-foreground">Chargeable</Label>
                          <div className="font-bold text-xl text-primary">
                            {totalWeights.chargeable} {parcelType === "Ecommerce" ? "g" : "kg"}
                          </div>
                        </div>
                      </div>

                      <Button type="button" onClick={addBox} variant="outline" className="w-full" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Box
                      </Button>
                    </div>
                  )}
                </div>
              </FormSection>
            </div>

            {/* Right Side - Shipping Rates (2 columns) */}
            <div className="lg:col-span-2">
              <FormSection
                title="Shipping Rates"
                description="Select a courier rate (optional)."
                icon={<TruckIcon className="h-5 w-5" />}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <Switch id="gst-toggle" checked={includeGST} onCheckedChange={setIncludeGST} />
                      <Label htmlFor="gst-toggle" className="text-sm cursor-pointer">
                        Include GST
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={fetchRates}
                    disabled={fetchingRates || !canFetchRates}
                    className="w-full"
                    size="lg"
                  >
                    <TruckIcon className="mr-2 h-4 w-4" />
                    {fetchingRates ? "Fetching..." : "Get Rates"}
                  </Button>

                  {!canFetchRates && boxes.length === 0 && (
                    <Alert className="bg-gray-50">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Add boxes first to fetch rates.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!selectedRate && !rates && canFetchRates && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-800">
                        Rate selection is optional. You can proceed without selecting a rate.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {fetchingRates &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3 border rounded-lg animate-pulse bg-slate-100">
                          <div className="h-4 bg-slate-300 rounded mb-2 w-3/4"></div>
                          <div className="h-3 bg-slate-300 rounded w-1/2"></div>
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
                          const weightUnit = rate.weightUnit || (parcelType === "Ecommerce" ? "g" : "kg")
                          const pricePerUnit = (price / Number.parseFloat(totalChargeableWeight || 1)).toFixed(2)

                          return (
                            <Card
                              key={`rate-${rate.type}-${index}`}
                              onClick={() => handleSelectRate(rate)}
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-md hover:border-primary",
                                selectedCourier === rate.type && "border-2 border-primary ring-2 ring-primary/20 shadow-md"
                              )}
                            >
                              <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                      selectedCourier === rate.type
                                        ? "border-primary bg-primary"
                                        : "border-gray-300 bg-white"
                                    )}
                                  >
                                    {selectedCourier === rate.type && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm">{rate.type}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{rate.service}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg text-primary">₹{price.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ₹{pricePerUnit}/{weightUnit}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}

                    {selectedRate && !rates && (
                      <Card className="border-2 border-primary ring-2 ring-primary/20">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <span className="font-semibold text-sm">{selectedCourier}</span>
                              <div className="text-xs text-muted-foreground">{selectedRate.service}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-primary">
                              ₹
                              {(includeGST
                                ? selectedRate.sales?.grandTotal
                                : selectedRate.sales?.subTotal
                              )?.toLocaleString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {rates && !fetchingRates && rates.filter((r) => r.success).length === 0 && (
                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm text-amber-800">
                          No rates available for this destination.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </FormSection>
            </div>
          </div>
        )

      case 2: // Sender & Receiver - Receiver Zip First
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormSection title="Sender Details" icon={<Users className="h-5 w-5" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormInput label="Sender Name" id="senderName" required error={validationErrors.senderName}>
                    <div className="flex gap-2">
                      <Input
                        id="senderName"
                        placeholder="John Doe"
                        value={senderName}
                        onChange={(e) => {
                          setSenderName(e.target.value)
                          if (touchedFields.senderName) validateField("senderName", e.target.value)
                        }}
                        onBlur={() => {
                          markFieldTouched("senderName")
                          validateField("senderName", senderName)
                        }}
                        disabled={isClient}
                        className={cn(validationErrors.senderName && "border-destructive")}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => openSearch("sender")}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormInput>
                </div>
                <FormInput label="Company Name" id="senderCompanyName">
                  <Input value={senderCompanyName} onChange={(e) => setSenderCompanyName(e.target.value)} disabled={isClient} />
                </FormInput>
                <FormInput label="Email" id="senderEmail" error={validationErrors.senderEmail}>
                  <Input 
                    type="email" 
                    value={senderEmail} 
                    onChange={(e) => {
                      setSenderEmail(e.target.value)
                      if (touchedFields.senderEmail) validateField("senderEmail", e.target.value)
                    }}
                    onBlur={() => {
                      markFieldTouched("senderEmail")
                      validateField("senderEmail", senderEmail)
                    }}
                    className={cn(validationErrors.senderEmail && "border-destructive")}
                  />
                </FormInput>
                
                {/* Sender Country first */}
                <FormInput label="Country" id="senderCountry" required>
                  <CountryCombobox
                    value={senderCountry}
                    onSelect={setSenderCountry}
                    open={senderCountryOpen}
                    onOpenChange={setSenderCountryOpen}
                  />
                </FormInput>
                
                {/* Then Zip Code for auto-fill */}
                <FormInput label="Zip Code" id="senderZipCode" required error={validationErrors.senderZipCode} hint="Enter zip to auto-fill city & state">
                  <Input
                    value={senderZipCode}
                    onChange={(e) => {
                      setSenderZipCode(e.target.value.replace(/\s/g, ""))
                      if (touchedFields.senderZipCode) validateField("senderZipCode", e.target.value.replace(/\s/g, ""))
                    }}
                    onBlur={() => {
                      markFieldTouched("senderZipCode")
                      validateField("senderZipCode", senderZipCode)
                    }}
                    disabled={isClient}
                    className={cn(validationErrors.senderZipCode && "border-destructive")}
                    placeholder={senderCountry === "India" ? "e.g., 400001" : "Enter postal code"}
                  />
                </FormInput>
                
                <FormInput label="City" id="senderCity">
                  <Input value={senderCity} onChange={(e) => setSenderCity(e.target.value)} />
                </FormInput>
                <FormInput label="State" id="senderState">
                  <Input value={senderState} onChange={(e) => setSenderState(e.target.value)} />
                </FormInput>
                
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 1" id="senderAddress" required error={validationErrors.senderAddress}>
                    <Textarea
                      rows={2}
                      maxLength={30}
                      value={senderAddress}
                      onChange={(e) => {
                        setSenderAddress(e.target.value)
                        if (touchedFields.senderAddress) validateField("senderAddress", e.target.value)
                      }}
                      onBlur={() => {
                        markFieldTouched("senderAddress")
                        validateField("senderAddress", senderAddress)
                      }}
                      disabled={isClient}
                      className={cn(validationErrors.senderAddress && "border-destructive")}
                    />
                    <div className="text-xs text-muted-foreground text-right mt-1">{senderAddress.length}/30</div>
                  </FormInput>
                </div>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 2" id="senderAddress2">
                    <Textarea rows={2} value={senderAddress2} onChange={(e) => setSenderAddress2(e.target.value)} disabled={isClient} />
                  </FormInput>
                </div>
                
                <FormInput 
                  label="Contact Number" 
                  id="senderContact" 
                  required 
                  error={validationErrors.senderContact}
                  hint="Must be exactly 10 digits"
                >
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-slate-50 text-sm text-muted-foreground">
                      {getCallingCode(senderCountry) || "+"}
                    </span>
                    <Input
                      type="text"
                      className={cn("rounded-l-none", validationErrors.senderContact && "border-destructive")}
                      value={senderContact}
                      onChange={handleSenderPhoneChange}
                      onBlur={() => {
                        markFieldTouched("senderContact")
                        validateField("senderContact", senderContact)
                      }}
                      disabled={isClient}
                      placeholder="10 digit number"
                      maxLength={10}
                    />
                  </div>
                  {senderContact && (
                    <div className={cn(
                      "text-xs mt-1",
                      senderContact.length === 10 ? "text-green-600" : "text-amber-600"
                    )}>
                      {senderContact.length}/10 digits
                    </div>
                  )}
                </FormInput>
                <FormInput label="GST" id="gst" error={validationErrors.gst} hint="Format: 22AAAAA0000A1Z5">
                  <Input 
                    value={gst} 
                    onChange={(e) => {
                      setGst(e.target.value.toUpperCase())
                      if (touchedFields.gst) validateField("gst", e.target.value.toUpperCase())
                    }}
                    onBlur={() => {
                      markFieldTouched("gst")
                      validateField("gst", gst)
                    }}
                    disabled={isClient}
                    className={cn(validationErrors.gst && "border-destructive")}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </FormInput>
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
                <FormInput label="KYC Number" id="kyc" required error={validationErrors.kyc}>
                  <Input 
                    value={kyc} 
                    onChange={(e) => {
                      setKyc(e.target.value.toUpperCase())
                      if (touchedFields.kyc) validateField("kyc", e.target.value.toUpperCase())
                    }}
                    onBlur={() => {
                      markFieldTouched("kyc")
                      validateField("kyc", kyc)
                    }}
                    disabled={isClient}
                    className={cn(validationErrors.kyc && "border-destructive")}
                    placeholder={
                      kycType === "Aadhaar No -" ? "12 digit Aadhaar" :
                      kycType === "Pan No -" ? "e.g., ABCDE1234F" :
                      "Enter KYC number"
                    }
                  />
                </FormInput>
              </div>
            </FormSection>

            <FormSection title="Receiver Details" icon={<Users className="h-5 w-5" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Note about Zip Code first */}
                <div className="sm:col-span-2">
                  <Alert className="bg-blue-50 border-blue-200 mb-4">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      <strong>Tip:</strong> Enter the destination country and zip code first to auto-fill city and state.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Destination country is already set in Step 1, show it here for reference */}
                <FormInput label="Country" required>
                  <CountryCombobox
                    value={receiverCountry}
                    onSelect={setReceiverCountry}
                    open={receiverCountryOpen}
                    onOpenChange={setReceiverCountryOpen}
                  />
                </FormInput>
                
                {/* Zip Code FIRST for auto-fill */}
                <FormInput 
                  label="Zip Code" 
                  id="receiverZipCode" 
                  required 
                  error={validationErrors.receiverZipCode}
                  hint="Enter to auto-fill city & state"
                >
                  <Input 
                    value={receiverZipCode} 
                    onChange={(e) => {
                      setReceiverZipCode(e.target.value.replace(/\s/g, ""))
                      if (touchedFields.receiverZipCode) validateField("receiverZipCode", e.target.value.replace(/\s/g, ""))
                    }}
                    onBlur={() => {
                      markFieldTouched("receiverZipCode")
                      validateField("receiverZipCode", receiverZipCode)
                    }}
                    className={cn(validationErrors.receiverZipCode && "border-destructive")}
                    placeholder="Enter postal code"
                  />
                </FormInput>
                
                <FormInput label="City" id="receiverCity">
                  <Input value={receiverCity} onChange={(e) => setReceiverCity(e.target.value)} />
                </FormInput>
                <FormInput label="State" id="receiverState">
                  <Input value={receiverState} onChange={(e) => setReceiverState(e.target.value)} />
                </FormInput>

                <div className="sm:col-span-2">
                  <FormInput label="Receiver Name" id="receiverName" required error={validationErrors.receiverName}>
                    <div className="flex gap-2">
                      <Input
                        id="receiverName"
                        placeholder="Jane Smith"
                        value={receiverName}
                        onChange={(e) => {
                          setReceiverName(e.target.value)
                          if (touchedFields.receiverName) validateField("receiverName", e.target.value)
                        }}
                        onBlur={() => {
                          markFieldTouched("receiverName")
                          validateField("receiverName", receiverName)
                        }}
                        className={cn(validationErrors.receiverName && "border-destructive")}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => openSearch("receiver")}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormInput>
                </div>
                <FormInput label="Company Name" id="receiverCompanyName">
                  <Input value={receiverCompanyName} onChange={(e) => setReceiverCompanyName(e.target.value)} />
                </FormInput>
                <FormInput label="Email" id="receiverEmail" error={validationErrors.receiverEmail}>
                  <Input 
                    type="email" 
                    value={receiverEmail} 
                    onChange={(e) => {
                      setReceiverEmail(e.target.value)
                      if (touchedFields.receiverEmail) validateField("receiverEmail", e.target.value)
                    }}
                    onBlur={() => {
                      markFieldTouched("receiverEmail")
                      validateField("receiverEmail", receiverEmail)
                    }}
                    className={cn(validationErrors.receiverEmail && "border-destructive")}
                  />
                </FormInput>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 1" id="receiverAddress" required error={validationErrors.receiverAddress}>
                    <Textarea
                      rows={2}
                      maxLength={30}
                      value={receiverAddress}
                      onChange={(e) => {
                        setReceiverAddress(e.target.value)
                        if (touchedFields.receiverAddress) validateField("receiverAddress", e.target.value)
                      }}
                      onBlur={() => {
                        markFieldTouched("receiverAddress")
                        validateField("receiverAddress", receiverAddress)
                      }}
                      className={cn(validationErrors.receiverAddress && "border-destructive")}
                    />
                    <div className="text-xs text-muted-foreground text-right mt-1">{receiverAddress.length}/30</div>
                  </FormInput>
                </div>
                <div className="sm:col-span-2">
                  <FormInput label="Address Line 2" id="receiverAddress2">
                    <Textarea rows={2} value={receiverAddress2} onChange={(e) => setReceiverAddress2(e.target.value)} />
                  </FormInput>
                </div>
                
                <div className="sm:col-span-2">
                  <FormInput 
                    label="Contact Number" 
                    id="receiverContact" 
                    required 
                    error={validationErrors.receiverContact}
                    hint="5-15 digits for international numbers"
                  >
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-slate-50 text-sm text-muted-foreground">
                        {getCallingCode(receiverCountry) || "+"}
                      </span>
                      <Input
                        type="text"
                        className={cn("rounded-l-none", validationErrors.receiverContact && "border-destructive")}
                        value={receiverContact}
                        onChange={handleReceiverPhoneChange}
                        onBlur={() => {
                          markFieldTouched("receiverContact")
                          validateField("receiverContact", receiverContact)
                        }}
                        placeholder="Phone number"
                        maxLength={15}
                      />
                    </div>
                    {receiverContact && (
                      <div className={cn(
                        "text-xs mt-1",
                        receiverContact.length >= 5 && receiverContact.length <= 15 ? "text-green-600" : "text-amber-600"
                      )}>
                        {receiverContact.length} digits (5-15 required)
                      </div>
                    )}
                  </FormInput>
                </div>
              </div>
            </FormSection>
          </div>
        )

      case 3: // Shipping Items
        return (
          <FormSection
            title="Shipping Items Details"
            description="Detail the items within each box for customs purposes."
            icon={<FileText className="h-5 w-5" />}
          >
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-4">
                  <FormInput label="Currency">
                    <Select value={shippingCurrency} onValueChange={setShippingCurrency}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="₹">₹ INR</SelectItem>
                        <SelectItem value="$">$ USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormInput>
                </div>
                <div className="text-right">
                  <Label className="text-sm text-muted-foreground">Total Invoice Value</Label>
                  <div className="font-bold text-2xl text-primary mt-1">
                    {shippingCurrency} {totalShippingValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {boxes.length > 0 && (
                <div className="space-y-5">
                  {boxes.map((box, boxIndex) => (
                    <div key={`box-items-${boxIndex}`} className="p-4 border-2 rounded-lg bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          Box {boxIndex + 1} Items
                          <Badge variant="secondary" className="ml-2">
                            {box.chargeableWeight} {parcelType === "Ecommerce" ? "g" : "kg"}
                          </Badge>
                        </h4>
                        <Badge variant="outline">
                          {box.items.length} item{box.items.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {box.items.map((item, itemIndex) => (
                          <div
                            key={`item-${boxIndex}-${itemIndex}`}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-gray-50"
                          >
                            <div className="md:col-span-4">
                              <FormInput label="Item Name" required>
                                <ItemNameAutocomplete
                                  id={`itemName-${boxIndex}-${itemIndex}`}
                                  value={item.name || ""}
                                  onChange={(value) => handleItemChange(boxIndex, itemIndex, "name", value)}
                                  onHsnSelect={(hsnItem) => {
                                    handleItemChange(boxIndex, itemIndex, "hsnCode", hsnItem.code)
                                    if (!item.name) handleItemChange(boxIndex, itemIndex, "name", hsnItem.item)
                                  }}
                                  required={true}
                                />
                              </FormInput>
                            </div>
                            <div className="md:col-span-2">
                              <FormInput label="Qty" required>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(boxIndex, itemIndex, "quantity", e.target.value)}
                                  min="1"
                                  className={cn(!item.quantity && "border-amber-300")}
                                />
                              </FormInput>
                            </div>
                            <div className="md:col-span-2">
                              <FormInput label={`Price (${shippingCurrency})`} required>
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => handleItemChange(boxIndex, itemIndex, "price", e.target.value)}
                                  min="0"
                                  step="0.01"
                                  className={cn(!item.price && "border-amber-300")}
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
                                    size="icon"
                                    onClick={() => openHsnSearch(boxIndex, itemIndex)}
                                  >
                                    <Search className="h-4 w-4" />
                                  </Button>
                                </div>
                              </FormInput>
                            </div>
                            <div className="md:col-span-1 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 h-9 w-9"
                                onClick={() => removeItem(boxIndex, itemIndex)}
                                disabled={box.items.length <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem(boxIndex)} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item to Box {boxIndex + 1}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {boxes.length === 0 && (
                <Alert className="bg-gray-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Please add boxes in the previous step to add items.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </FormSection>
        )

      case 4: // Export Details (only for Ecommerce)
        if (parcelType !== "Ecommerce") return null
        return (
          <FormSection
            title="Export & Customs Details"
            description="Additional information required for international clearance."
            icon={<Globe className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormInput label="Term of Invoice">
                <Select value={termOfInvoice} onValueChange={setTermOfInvoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {["FOB", "CFR", "CIF", "DAT", "DDP", "EXW", "FCA", "CIP", "CPT", "DAP", "C/F"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormInput>

              <FormInput label="CSB Selection">
                <Select value={csbSelection} onValueChange={setCsbSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select CSB" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSB IV">CSB IV (Commercial &lt; 50k)</SelectItem>
                    <SelectItem value="CSB V">CSB V (Commercial &gt; 50k)</SelectItem>
                  </SelectContent>
                </Select>
              </FormInput>

              <FormInput label="Bank AD Code" hint="Authorized Dealer Code">
                <Input value={bankADCode} onChange={(e) => setBankADCode(e.target.value)} placeholder="e.g., 0123456" />
              </FormInput>
              <FormInput label="Bank Account No">
                <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
              </FormInput>
              <FormInput label="Bank IFSC">
                <Input 
                  value={bankIFSC} 
                  onChange={(e) => setBankIFSC(e.target.value.toUpperCase())} 
                  placeholder="e.g., SBIN0001234"
                  maxLength={11}
                />
              </FormInput>
              <FormInput label="Consignor GSTIN">
                <Input 
                  value={consignorGSTIN} 
                  onChange={(e) => setConsignorGSTIN(e.target.value.toUpperCase())}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </FormInput>
              <FormInput label="Consignor IEC" hint="Import Export Code">
                <Input 
                  value={consignorIEC} 
                  onChange={(e) => setConsignorIEC(e.target.value.toUpperCase())} 
                  placeholder="10-digit IEC"
                  maxLength={10}
                />
              </FormInput>

              <FormInput label="GST Invoice No">
                <Input value={gstInvoiceNo} onChange={(e) => setGstInvoiceNo(e.target.value)} />
              </FormInput>
              <FormInput label="GST Invoice Date">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !gstInvoiceDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {gstInvoiceDate ? format(gstInvoiceDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={gstInvoiceDate} onSelect={setGstInvoiceDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </FormInput>

              <div className="flex items-center space-x-3 border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <Switch id="meis" checked={underMEISScheme} onCheckedChange={setUnderMEISScheme} />
                <Label htmlFor="meis" className="cursor-pointer text-sm">
                  Under MEIS Scheme?
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                <Switch id="lut" checked={againstBondOrLUT} onCheckedChange={setAgainstBondOrLUT} />
                <Label htmlFor="lut" className="cursor-pointer text-sm">
                  Against Bond/LUT?
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                <Switch id="igst" checked={igstPaymentStatus} onCheckedChange={setIgstPaymentStatus} />
                <Label htmlFor="igst" className="cursor-pointer text-sm">
                  Export on Payment of IGST?
                </Label>
              </div>
            </div>
          </FormSection>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent sm:text-4xl">
            {isEdit ? "Edit Booking" : "Create New Booking"}
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl mx-auto">
            Complete the steps below to {isEdit ? "update your" : "create a new"} airway bill.
          </p>
        </header>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <StepIndicator steps={steps} currentStep={currentStep} />

          <div className="min-h-[500px]">{renderStepContent()}</div>

          <div className="flex justify-between items-center pt-6 border-t-2 border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              size="lg"
              className="min-w-[120px]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground font-medium">
              Step {currentStep + 1} of {steps.length}
            </div>

            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNext}
                size="lg"
                className="min-w-[120px]"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                type="submit"
                className="bg-gradient-to-r from-[#E31E24] to-[#C71D23] hover:from-[#C71D23] hover:to-[#A01A1F] text-white min-w-[160px]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isEdit ? "Update" : "Create"} Booking
                  </>
                )}
              </Button>
            )}
          </div>
        </form>

        <Dialog open={success} onOpenChange={setSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <DialogTitle className="text-xl">{`AWB ${isEdit ? "Updated" : "Created"} Successfully`}</DialogTitle>
              </div>
              <DialogDescription className="text-base">
                The AWB has been {isEdit ? "updated" : "created"} successfully. You can now print the shipping label or return to the
                AWB table.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-3">
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 flex-1"
                onClick={() => router.push(`/shipping-and-label/${trackingNumber}`)}
                size="lg"
              >
                <FileText className="mr-2 h-4 w-4" />
                Print Label
              </Button>
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 flex-1"
                onClick={() => router.push(`/awb`)}
                size="lg"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                View AWB Table
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
                      <Users className="mr-2 h-4 w-4" />
                      {customer.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <DialogFooter className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSearchDialog(false)}>
                Cancel
              </Button>
              <Button
                type="button"
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