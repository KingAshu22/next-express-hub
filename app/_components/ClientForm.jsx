"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Eye, EyeOff } from "lucide-react" // Import eye icons
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
    code: z.string().min(3, { message: "Code must be at least 3 characters long" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
})

export default function ClientRegisterForm({ isEdit = false, client }) {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false) // State to toggle password visibility

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: client?.name || "",
            code: client?.code || "",
            email: client?.email || "",
            password: client?.password || "",
        },
    });

    const getCode = async () => {
        try {
            const response = await axios.get("/api/get-last-client");
            const lastCode = response.data.code; // Assume the last code is a string like "0001"
            const incrementedNumber = (parseInt(lastCode, 10) + 1).toString(); // Increment the code
            const newCode = incrementedNumber.padStart(4, "0"); // Pad with leading zeros to make it 4 digits

            // Update the form field for code
            form.setValue("code", newCode); // Set the code in the form state
        } catch (error) {
            console.error("Error fetching code:", error);
        }
    };

    useEffect(() => {
        !isEdit &&
            getCode();
    }, [])

    async function onSubmit(values) {
        try {
            setIsLoading(true)
            console.log("Inside Save Client Function")
            const response = await axios.post("/api/clients", values)

            if (response.status === 200) {
                console.log("Client saved successfully:", response.data)
                alert("Client saved successfully!")
            } else {
                console.error("Failed to save client:", response.data)
                alert("Failed to save the client. Please try again.")
            }
        } catch (error) {
            console.error("Error saving client:", error.response?.data || error.message)
            alert("An error occurred while saving the client.")
        } finally {
            console.log(values)
            setIsLoading(false)
            form.reset()
        }
    }

    async function editSubmit(values) {
        try {
            setIsLoading(true)
            console.log("Inside Edit Client Function")
            const response = await axios.put(`/api/clients/${values.code}`, values)

            if (response.status === 200) {
                console.log("Client edited successfully:", response.data)
                alert("Client edited successfully!")
            } else {
                console.error("Failed to edit client:", response.data)
                alert("Failed to edit the client. Please try again.")
            }
        } catch (error) {
            console.error("Error editing client:", error.response?.data || error.message)
            alert("An error occurred while editing the client.")
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
                    <Image src="/logo.jpg" alt="Redly Express Logo" width={200} height={60} />
                </div>
                <CardTitle className="text-2xl font-bold text-center text-[#232C65]">{isEdit ? "Edit Client" : "Client Registration"}</CardTitle>
                <CardDescription className="text-center">{isEdit ? "Edit Client Account" : "Create a new Client Account"}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={isEdit ? form.handleSubmit(editSubmit) : form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter client code" autoComplete="off" readOnly={true}  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter client name" autoComplete="off" {...field} />
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
                                                {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full bg-[#E31E24] hover:bg-[#C71D23] text-white" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEdit ? "Updating..." : "Registering..."}
                                </>
                            ) : (
                                isEdit ? "Update Client" : "Create Client"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
