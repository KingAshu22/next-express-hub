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
import toast from "react-hot-toast";
import { saveProfile } from "@/lib/auth/client";

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
    const rawReturnUrl = searchParams.get("redirect_url") || "/dashboard";
    if (typeof window !== "undefined") {
      const parsed = new URL(rawReturnUrl, window.location.origin);
      // Never redirect to another site after login (open-redirect protection)
      setReturnUrl(
        parsed.origin === window.location.origin ? parsed.pathname + parsed.search : "/dashboard"
      );
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
    const endpoint =
      userType === "admin"
        ? "/api/admin-signin"
        : userType === "franchise"
          ? "/api/franchise-signin"
          : "/api/client-signin";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.user) {
        // The session itself is an HttpOnly cookie set by the server;
        // only display info is kept in the browser.
        saveProfile(data.user);
        router.push(returnUrl || "/dashboard");
      } else {
        toast.error(data.error || "Sign in failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      toast.error("Could not reach the server. Please try again.");
    }

    setIsLoading(false);
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center">
          <Image
            src={"/logo.jpg"}
            alt="Kargo One"
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="franchise">Franchise</TabsTrigger>
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
