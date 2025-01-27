"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export default function SignInForm() {
  const [userType, setUserType] = useState("customer");
  const [returnUrl, setReturnUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const rawReturnUrl = searchParams.get("redirect_url") || "/";
    if (typeof window !== "undefined") {
      const returnUrlPath = new URL(rawReturnUrl, window.location.origin)
        .pathname;
      setReturnUrl(returnUrlPath);
    }
  }, [searchParams]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setIsLoading(true);

    if (userType === "admin") {
      try {
        const response = await fetch("/api/admin-signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values), // Pass email and password
        });

        const data = await response.json(); // Parse response as JSON

        if (response.ok) {
          console.log("Admin signed in:", data.admin);
          const authExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
          localStorage.setItem("id", data.admin._id);
          localStorage.setItem("userType", "admin");
          localStorage.setItem("name", data.admin.name);
          localStorage.setItem("authExpiry", authExpiry);
          router.push(returnUrl);
        } else {
          console.error("Error:", data.error);
          // Optionally, show an error message to the user
        }
      } catch (error) {
        console.error("Error during sign-in:", error);
      }
    } else {
      try {
        const response = await fetch("/api/client-signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values), // Pass email and password
        });

        const data = await response.json(); // Parse response as JSON

        if (response.ok) {
          console.log("Client signed in:", data.client);
          const authExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
          localStorage.setItem("id", data.client._id);
          localStorage.setItem("userType", "client");
          localStorage.setItem("name", data.client.name);
          localStorage.setItem("authExpiry", authExpiry);
          router.push(returnUrl);
        } else {
          console.error("Error:", data.error);
          // Optionally, show an error message to the user
        }
      } catch (error) {
        console.error("Error during sign-in:", error);
      }
    }

    setIsLoading(false);
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center">
          <Image
            src={"/logo.jpg"}
            alt="Express Hub"
            width={200}
            height={60}
            className=""
          />
        </div>
        <CardTitle className="text-2xl font-bold text-[#232C65]">
          Sign In
        </CardTitle>
        <CardDescription className="text-center">
          Enter your details to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={userType} onValueChange={(value) => setUserType(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </Tabs>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
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
                        placeholder="Enter your password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
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
                  Please wait
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
