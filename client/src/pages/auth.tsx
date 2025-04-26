import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, UserIcon } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Log authentication state
  useEffect(() => {
    console.log("AuthPage: Authentication state", { 
      isAuthenticated: !!user, 
      user: user ? { id: user.id, username: user.username } : null 
    });
  }, [user]);
  
  // Check if user already in localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('reelytics_user');
      if (savedUser) {
        // User is already logged in
        console.log("User found in localStorage, redirecting to home page");
        setLocation("/");
      }
    } catch (e) {
      console.error('Error reading from localStorage', e);
    }
  }, [setLocation]);

  // Use useEffect for redirection instead of conditional rendering
  // This avoids the React hooks error
  useEffect(() => {
    if (user) {
      console.log("User authenticated via API, redirecting to home page");
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleLoginSubmit = async (values: LoginFormValues) => {
    console.log("Submitting login form with:", { username: values.username });
    try {
      await login(values);
      console.log("Login function completed successfully");
    } catch (error: any) {
      console.error("Login error in form handler:", error);
      
      // Handle invalid credentials
      loginForm.setError("password", {
        type: "manual",
        message: "Invalid credentials"
      });
      
      loginForm.setError("username", {
        type: "manual",
        message: " " // Just add a space to trigger the error state without text
      });
      
      // Show a toast with the error
      toast({
        title: "Login failed",
        description: error.message || "Could not log in with those credentials",
        variant: "destructive"
      });
    }
  };

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  const handleRegisterSubmit = async (values: RegisterFormValues) => {
    console.log("Submitting registration form with:", { username: values.username, email: values.email });
    try {
      await register(values);
      console.log("Registration function completed successfully");
      
      // Show success toast
      toast({
        title: "Account created",
        description: `Welcome to Reelytics, ${values.username}!`,
      });
    } catch (error: any) {
      console.error("Registration error in form handler:", error);
      
      // Handle specific error types
      if (error.message.includes("username")) {
        registerForm.setError("username", { 
          type: "manual", 
          message: "Username already taken" 
        });
      } else if (error.message.includes("email")) {
        registerForm.setError("email", { 
          type: "manual", 
          message: "Email already registered" 
        });
      } else {
        // Set a general form error
        registerForm.setError("root", {
          type: "manual",
          message: error.message || "Registration failed"
        });
      }
      
      // Show a toast with the error
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Forms */}
      <div className="flex w-full flex-col justify-center px-4 py-12 md:w-1/2 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Film className="h-10 w-10 text-primary mr-2" />
            <h1 className="text-2xl font-bold">Reelytics</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                        {loginForm.formState.isSubmitting ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="link" onClick={() => setActiveTab("register")}>
                    Don't have an account? Register
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Enter your details to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                        {registerForm.formState.isSubmitting ? "Creating account..." : "Create account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="link" onClick={() => setActiveTab("login")}>
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden bg-gray-900 md:flex md:w-1/2 md:flex-col md:items-center md:justify-center p-12">
        <div className="max-w-md text-center text-white">
          <Film className="h-12 w-12 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Welcome to Reelytics</h2>
          <p className="mb-6">
            Your personal movie diary. Track films you've watched, rate them, write reviews, and discover new movies tailored to your taste.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-gray-800 p-3">
              <div className="font-medium mb-1">Rate Movies</div>
              <div className="text-gray-400">Share your opinion with ratings and reviews</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <div className="font-medium mb-1">Track Progress</div>
              <div className="text-gray-400">Keep a log of your watching history</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <div className="font-medium mb-1">View Stats</div>
              <div className="text-gray-400">See insights about your watching habits</div>
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <div className="font-medium mb-1">Create Lists</div>
              <div className="text-gray-400">Organize movies into custom collections</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}