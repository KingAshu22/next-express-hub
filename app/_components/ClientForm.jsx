"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Countries } from "../constants/country";

// KYC options
const KYC_TYPES = [
  "Aadhaar No",
  "Pan No",
  "Passport No",
  "Driving License No",
  "Voter ID Card No",
  "GST No",
];

const kycTypeEnum = z.enum(KYC_TYPES);

const rateItemSchema = z.object({
  country: z.string().min(1, { message: "Country is required" }),
  percent: z
    .number()
    .min(0, { message: "Percent must be 0 or greater" })
    .max(100, { message: "Percent cannot exceed 100" }),
});

const formSchema = z.object({
  owner: z.string().min(1, { message: "Owner is required" }),
  role: z.literal("client"),
  code: z.string().min(3, { message: "Code must be at least 3 characters long" }),

  // Login fields
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),

  // Profile fields
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  companyName: z.string().optional(),
  address: z.string().min(5, { message: "Address must be at least 5 characters long" }),
  country: z.string().min(1, { message: "Country is required" }),
  zip: z.string().min(3, { message: "ZIP/Postal code is required" }),
  contact: z
    .number()
    .min(1000000000, { message: "Contact number must be at least 10 digits" }),

  kyc: z.object({
    type: kycTypeEnum,
    kyc: z.string().min(3, { message: "KYC number is required" }),
    document: z.string().url({ message: "Document must be a valid URL" }),
  }),

  gstNo: z.string().optional(),

  // Rates the client should get (input as additional % over parent)
  rates: z
    .array(rateItemSchema)
    .min(1, { message: "At least one rate is required" }),
});

export default function ClientForm({
  isEdit = false,
  client,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Keep userType and current user code from localStorage (SSR-safe)
  const [userType, setUserType] = useState(null);
  const [currentUserCode, setCurrentUserCode] = useState(null);

  // Parent franchise rates to compute profitPercent (special + RoW)
  const [parentRates, setParentRates] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      owner: client?.owner || "",
      role: "client",
      code: client?.code || "",
      email: client?.email || "",
      password: client?.password || "",
      name: client?.name || "",
      companyName: client?.companyName || "",
      address: client?.address || "",
      country: client?.country || "",
      zip: client?.zip || "",
      contact: client?.contact || "",
      kyc: {
        type: client?.kyc?.type || undefined,
        kyc: client?.kyc?.kyc || "",
        document: client?.kyc?.document || "",
      },
      gstNo: client?.gstNo || "",
      rates:
        client?.rates?.length
          ? client.rates.map((r) => ({
            country: r.country,
            percent:
              typeof r.profitPercent === "number"
                ? r.profitPercent
                : 0,
          }))
          : [{ country: "Rest of World", percent: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rates",
  });

  // Helper: generate next client code
  const getCode = async () => {
    try {
      const response = await axios.get("/api/get-last-client");
      const lastCode = response?.data?.code || "0000";
      const incrementedNumber = (parseInt(lastCode, 10) + 1).toString();
      const newCode = incrementedNumber.padStart(4, "0");
      form.setValue("code", newCode);
    } catch (error) {
      console.error("Error fetching code:", error);
    }
  };

  // On mount: read userType/code and set owner based on the rules
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ut = localStorage.getItem("userType");
    const code = localStorage.getItem("code");

    setUserType(ut);
    setCurrentUserCode(code);

    // Set owner per rules
    const ownerVal =
      ut === "admin" ? "admin" : code ? code : client?.owner || "";

    if (!client?.owner) {
      form.setValue("owner", ownerVal);
    }

    if (!isEdit) {
      getCode();
    }
  }, [isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load parent franchise rates for computation
  // - franchise: parent = current user (franchise) code
  // - branch: parent = branchOf of the branch doc
  // - admin: no parent rates (assume base 0)
  const loadParentRates = async () => {
    try {
      if (!userType) return;

      if (userType === "admin") {
        setParentRates([]);
        return;
      }

      if (!currentUserCode) {
        setParentRates([]);
        return;
      }

      // Get the document for current user (franchise or branch)
      const currentResp = await axios.get(`/api/franchises/${currentUserCode}`);
      const currentDoc = currentResp?.data;

      if (!currentDoc) {
        setParentRates([]);
        return;
      }

      // If branch, resolve parent (branchOf) to get the franchise rates
      if (userType === "branch" && currentDoc?.branchOf) {
        const parentCode = currentDoc.branchOf;
        const parentResp = await axios.get(`/api/franchises/${parentCode}`);
        const parentDoc = parentResp?.data;
        setParentRates(parentDoc?.rates || []);
      } else {
        // franchise user: parent is self
        setParentRates(currentDoc?.rates || []);
      }
    } catch (err) {
      console.error("Error loading parent rates:", err);
      setParentRates([]);
    }
  };

  useEffect(() => {
    // Load parent rates whenever userType or code changes
    loadParentRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, currentUserCode]);

  // Country selector helpers for the rates builder
  const getAvailableCountries = (currentIndex) => {
    const usedCountries = form
      .getValues("rates")
      .map((rate, idx) => (idx !== currentIndex ? rate.country : null))
      .filter(Boolean);

    return Countries.filter((country) => !usedCountries.includes(country));
  };

  const addCountryRate = () => {
    append({ country: "", percent: "" });
  };

  const removeCountryRate = (index) => {
    if (fields.length > 1) remove(index);
  };

  // Helpers to compute base percent
  const parentRateMap = useMemo(() => {
    const map = new Map();
    for (const r of parentRates || []) {
      if (typeof r?.percent === "number") {
        map.set(r.country, r.percent);
      }
    }
    return map;
  }, [parentRates]);

  const getParentPercentForCountry = (country) => {
    if (!parentRates?.length) return 0;
    if (parentRateMap.has(country)) return parentRateMap.get(country) || 0;

    // Fallback to Rest of World if present
    return parentRateMap.get("Rest of World") || 0;
  };

  async function onSubmit(values) {
    try {
      setIsLoading(true);

      // Resolve owner per rules (ensure we set if not already)
      let resolvedOwner = values.owner;
      if (typeof window !== "undefined") {
        const ut = localStorage.getItem("userType");
        const code = localStorage.getItem("code");
        if (ut === "admin") resolvedOwner = "admin";
        else if (ut === "branch" || ut === "franchise") resolvedOwner = code || values.owner;
      }

      // Build rates payload with franchiseProfitPercent and profitPercent
      const utNow =
        typeof window !== "undefined" ? localStorage.getItem("userType") : userType;

      const ratesToSave = (values.rates || []).map((r, idx) => {
        const country = idx === 0 ? "Rest of World" : r.country;
        const clientPct = typeof r.percent === "number" ? r.percent : parseFloat(String(r.percent || 0)) || 0;

        if (utNow === "franchise" || utNow === "branch") {
          const base = getParentPercentForCountry(country);
          return {
            country,
            profitPercent: parseFloat((base + clientPct).toFixed(4)),
          };
        }

        return {
          country,
          profitPercent: clientPct,
        };
      });

      const payload = {
        ...values,
        owner: resolvedOwner,
        role: "client",
        // Save transformed rates instead of input shape
        rates: ratesToSave,
      };

      // Create or Edit
      const response = isEdit
        ? await axios.put(`/api/clients/${values.code}`, payload)
        : await axios.post("/api/clients", payload);

      if (response.status === 200) {
        alert(isEdit ? "Client edited successfully!" : "Client saved successfully!");
      } else {
        alert("Failed to save the client. Please try again.");
      }
    } catch (error) {
      console.error("Error saving client:", error?.response?.data || error?.message);
      alert("An error occurred while saving the client.");
    } finally {
      setIsLoading(false);
      // Reset and re-generate code for next create
      if (!isEdit) {
        form.reset({
          owner: form.getValues("owner"),
          role: "client",
          code: "",
          email: "",
          password: "",
          name: "",
          companyName: "",
          address: "",
          country: "",
          zip: "",
          contact: "",
          kyc: { type: undefined, kyc: "", document: "" },
          gstNo: "",
          rates: [{ country: "Rest of World", percent: "" }],
        });
        getCode();
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <Image src="/Sun.jpg" alt="Redly Express Logo" width={200} height={60} />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-[#232C65]">
          {isEdit ? "Edit Client" : "Client Registration"}
        </CardTitle>
        <CardDescription className="text-center">
          {isEdit ? "Edit Client Account" : "Create a new Client Account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            {/* Owner (auto-set) */}
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <Input readOnly placeholder="Owner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role (fixed to client) */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input readOnly value="client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input readOnly placeholder="Client code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Countries.map((c, idx) => (
                          <SelectItem key={idx} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ZIP */}
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP / Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ZIP/Postal code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact */}
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter contact number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : Number.parseInt(e.target.value, 10) || ""
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* KYC */}
            <div className="space-y-2">
              <FormLabel className="text-base font-semibold">KYC</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="kyc.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select KYC Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {KYC_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kyc.kyc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KYC Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter KYC number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kyc.document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* GST */}
            <FormField
              control={form.control}
              name="gstNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter GST number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password with toggle */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rates Section (like FranchiseForm) */}
            <div className="space-y-4">
              <FormLabel className="text-base font-semibold">Rates by Country</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {index === 0 ? "Default Rate" : `Country Rate ${index}`}
                    </span>
                    {fields.length > 1 && index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCountryRate(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`rates.${index}.country`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            {index === 0 ? (
                              <Input value="Rest of World" readOnly className="bg-gray-50" />
                            ) : (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableCountries(index).map((country, countryIndex) => (
                                    <SelectItem key={countryIndex} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`rates.${index}.percent`}
                      render={({ field }) => (
                        <FormItem className="w-28">
                          <FormLabel>Percent (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === "" ? "" : Number.parseFloat(e.target.value) || ""
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addCountryRate} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Country Rate
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E31E24] hover:bg-[#C71D23] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Registering..."}
                </>
              ) : isEdit ? (
                "Update Client"
              ) : (
                "Create Client"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}