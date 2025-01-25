"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
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
  const [step, setStep] = useState("email");
  const [userType, setUserType] = useState("customer");
  const [returnUrl, setReturnUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        const response = await fetch("/api/signin", {
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
            {step === "email" && (
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
            )}
            {step === "password" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button
              type={step === "email" ? "button" : "submit"}
              className="w-full bg-[#E31E24] hover:bg-[#C71D23] text-white"
              onClick={() => {
                if (step === "email") {
                  form.trigger("email").then((isValid) => {
                    if (isValid) setStep("password");
                  });
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : step === "email" ? (
                "Next"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          Don't have an account?{" "}
          <a href="#" className="text-[#E31E24] hover:underline">
            Sign up
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
