"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react"; // Import eye icons
import Image from "next/image";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import PhotoUploader from "./PhotoUploader";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  address: z.string().min(3, { message: "Address must be at least 3 characters long" }),
  country: z.string(),
  zip: z.string(),
  contact: z.string(),
  kyc: z.object({
    type: z.string().min(1, { message: "KYC Type is required" }),
    kyc: z.string().min(1, { message: "KYC Number is required" }),
    link: z.string().min(1, { message: "KYC Number is required" }),
  }),
  gst: z.string(),
  owner: z.string(),
  role: z.string().optional(), // role was missing from schema
});

export default function CustomerRegistrationForm({ isEdit = false, customer }) {
  const [isLoading, setIsLoading] = useState(false);
  const [profileLink, setProfileLink] = useState(customer?.kyc?.link || "");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer?.name || "",
      address: customer?.address || "",
      country: customer?.country || "",
      zip: customer?.zip || "",
      contact: customer?.contact || "",
      kyc: {
        type: customer?.kyc?.type || "",
        kyc: customer?.kyc?.kyc || "",
        link: customer?.kyc?.link || "",
      },
      gst: customer?.gst || "",
      owner: customer?.owner || "",
      role: customer?.role || "",
    },
  });

  useEffect(() => {
    form.setValue("kyc.link", profileLink); // Update form when profileLink changes
  }, [profileLink, form]);

  async function onSubmit(values) {
    try {
      setIsLoading(true);
      console.log("Inside Save Customer Function");
      const response = await axios.post("/api/customer", values);

      if (response.status === 200) {
        console.log("Customer saved successfully:", response.data);
        toast.success("Customer saved successfully!");
      } else {
        console.error("Failed to save customer:", response.data);
        toast.error("Failed to save the customer. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error saving customer:",
        error.response?.data || error.message
      );
      toast.error("An error occurred while saving the customer.");
    } finally {
      console.log(values);
      setIsLoading(false);
      form.reset();
    }
  }

  async function editSubmit(values) {
    try {
      setIsLoading(true);
      console.log("Inside Edit Customer Function");
      const response = await axios.put(`/api/customer/${customer._id}`, values);

      if (response.status === 200) {
        console.log("Customer edited successfully:", response.data);
        toast.success("Customer edited successfully!");
      } else {
        console.error("Failed to edit customer:", response.data);
        toast.error("Failed to edit the customer. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error editing customer:",
        error.response?.data || error.message
      );
      toast.error("An error occurred while editing the customer.");
    } finally {
      console.log(values);
      setIsLoading(false);
      form.reset();
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.jpg"
            alt="Kargo Onee Logo"
            width={200}
            height={60}
          />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-[#232C65]">
          {isEdit ? "Edit Customer" : "Customer Registration"}
        </CardTitle>
        <CardDescription className="text-center">
          {isEdit ? "Edit Customer Account" : "Create a new Customer Account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={
              isEdit
                ? form.handleSubmit(editSubmit)
                : form.handleSubmit(onSubmit)
            }
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
                    <Input
                      placeholder="Enter Customer name"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter Customer Address"
                      autoComplete="off"
                      {...field}
                      rows="4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Customer Country"
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
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Zip"
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
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Contact"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kyc.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KYC Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select KYC Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aadhaar No -">Aadhaar No -</SelectItem>
                        <SelectItem value="Pan No -">Pan No -</SelectItem>
                        <SelectItem value="Passport No -">Passport No -</SelectItem>
                        <SelectItem value="Driving License No -">Driving License No -</SelectItem>
                        <SelectItem value="Voter ID Card No -">Voter ID Card No -</SelectItem>
                        <SelectItem value="GST No -">GST No -</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input
                        placeholder="Enter KYC Number"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <PhotoUploader
              clientName={customer?.name}
              setProfilePic={setProfileLink}
              initialImageLink={customer?.kyc?.link}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Role"
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
              name="gst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter GST"
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
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Owner"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
