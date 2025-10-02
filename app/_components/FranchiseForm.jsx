"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Eye, EyeOff, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"
import { Countries } from "../constants/country"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  firmName: z.string().optional(),
  contact: z.number().min(10, { message: "Contact number must be at least 10 digits long" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters long" }),
  isBranch: z.string().optional(),
  branchOf: z.string().optional(),
  panNo: z.string().optional(),
  aadhaarNo: z.string().optional(),
  gstNo: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  code: z.string().min(3, { message: "Code must be at least 3 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  rates: z
    .array(
      z.object({
        country: z.string().min(1, { message: "Country is required" }),
        percent: z
          .number()
          .min(0, { message: "Percent must be 0 or greater" })
          .max(100, { message: "Percent cannot exceed 100" }),
      }),
    )
    .min(1, { message: "At least one rate is required" }),
})

export default function FranchiseForm({ isEdit = false, franchise }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: franchise?.name || "",
      code: franchise?.code || "",
      firmName: franchise?.firmName || "",
      contact: franchise?.contact || "",
      address: franchise?.address || "",
      isBranch: franchise?.isBranch || "",
      branchOf: franchise?.branchOf || "",
      panNo: franchise?.panNo || "",
      aadhaarNo: franchise?.aadhaarNo || "",
      gstNo: franchise?.gstNo || "",
      bankAccountName: franchise?.bankAccountName || "",
      bankAccountNumber: franchise?.bankAccountNumber || "",
      bankIfscCode: franchise?.bankIfscCode || "",
      email: franchise?.email || "",
      password: franchise?.password || "",
      rates: franchise?.rates || [{ country: "Rest of World", percent: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rates",
  })

  const getCode = async () => {
    try {
      const response = await axios.get("/api/get-last-franchise")
      const lastCode = response.data.code
      const incrementedNumber = (Number.parseInt(lastCode, 10) + 1).toString()
      const newCode = incrementedNumber.padStart(4, "0")
      form.setValue("code", newCode)
    } catch (error) {
      console.error("Error fetching code:", error)
    }
  }

  useEffect(() => {
    !isEdit && getCode()
  }, [])

  const addCountryRate = () => {
    append({ country: "", percent: "" })
  }

  const removeCountryRate = (index) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const getAvailableCountries = (currentIndex) => {
    const usedCountries = form
      .getValues("rates")
      .map((rate, index) => (index !== currentIndex ? rate.country : null))
      .filter(Boolean)

    return Countries.filter((country) => !usedCountries.includes(country))
  }

  async function onSubmit(values) {
    try {
      setIsLoading(true)
      console.log("Inside Save Franchise Function")
      const response = await axios.post("/api/franchises", values)

      if (response.status === 200) {
        console.log("Franchise saved successfully:", response.data)
        alert("Franchise saved successfully!")
      } else {
        console.error("Failed to save Franchise:", response.data)
        alert("Failed to save the Franchise. Please try again.")
      }
    } catch (error) {
      console.error("Error saving Franchise:", error.response?.data || error.message)
      alert("An error occurred while saving the Franchise.")
    } finally {
      console.log(values)
      setIsLoading(false)
      form.reset()
    }
  }

  async function editSubmit(values) {
    try {
      setIsLoading(true)
      console.log("Inside Edit Franchise Function")
      const response = await axios.put(`/api/franchises/${values.code}`, values)

      if (response.status === 200) {
        console.log("Franchise edited successfully:", response.data)
        alert("Franchise edited successfully!")
      } else {
        console.error("Failed to edit Franchise:", response.data)
        alert("Failed to edit the Franchise. Please try again.")
      }
    } catch (error) {
      console.error("Error editing Franchise:", error.response?.data || error.message)
      alert("An error occurred while editing the Franchise.")
    } finally {
      console.log(values)
      setIsLoading(false)
      form.reset()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <Image src="/Sun.jpg" alt="Redly Express Logo" width={200} height={60} />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-[#232C65]">
          {isEdit ? "Edit Franchise" : "Franchise Registration"}
        </CardTitle>
        <CardDescription className="text-center">
          {isEdit ? "Edit Franchise Account" : "Create a new Franchise Account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={isEdit ? form.handleSubmit(editSubmit) : form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Franchise name" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Franchise code" autoComplete="off" readOnly={true} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firmName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firm Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Firm name" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      autoComplete="off"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? "" : Number.parseInt(e.target.value, 10) || "")
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isBranch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Is Branch?</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Branch Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("isBranch") === "Yes" && (
              <FormField
                control={form.control}
                name="branchOf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Of</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter parent franchise code" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="panNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter PAN number" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aadhaarNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhaar Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Aadhaar number" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gstNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter GST number" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bank account name" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter bank account number"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankIfscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank IFSC Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bank IFSC code" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        autoComplete="off"
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

            {/* Rates Section */}
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
                        <FormItem className="w-24">
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
                                field.onChange(e.target.value === "" ? "" : Number.parseFloat(e.target.value) || "")
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

            <Button type="submit" className="w-full bg-[#E31E24] hover:bg-[#C71D23] text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Registering..."}
                </>
              ) : isEdit ? (
                "Update Franchise"
              ) : (
                "Create Franchise"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
