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
import { Film, UserIcon, Star, TrendingUp, Users, PlayCircle } from "lucide-react";

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
    try {      const savedUser = localStorage.getItem('reelytics_user');
      if (savedUser) {
        console.log("Found user in localStorage, redirecting to home");
        setLocation('/');
      }
    } catch (e) {
      console.error('Error checking localStorage', e);
    }
  }, [setLocation]);

  // Redirect if authenticated
  useEffect(() => {
    if (user) {
      console.log("User authenticated, redirecting to home");
      setLocation('/');
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

  const onLogin = async (values: LoginFormValues) => {
    try {
      console.log("Login attempt with:", values.username);
      const result = await login(values.username, values.password);
      
      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in to your account.",
        });
        // Redirection handled in useEffect      } else {
        toast({
          title: "Login failed",
          description: result.error || "Invalid username or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onRegister = async (values: RegisterFormValues) => {
    try {
      console.log("Registration attempt:", { username: values.username, email: values.email });
      
      const result = await register({
        username: values.username,
        email: values.email,
        password: values.password,
        fullName: values.fullName || undefined,
      });

      if (result.success) {
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
        // Auto-login after registration
        const loginResult = await login(values.username, values.password);
        if (loginResult.success) {
          console.log("Auto-login successful after registration");
        }
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "Could not create account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({        title: "Registration failed", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="min-h-screen flex lg:hidden">
        <div className="w-full flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Film className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold">Reelytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Your personal movie tracking app
              </p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardHeader className="space-y-2 pb-8 text-center">
                <CardTitle className="text-2xl font-bold">
                  {activeTab === "login" ? "Welcome back" : "Create an account"}
                </CardTitle>
                <CardDescription className="text-base">
                  {activeTab === "login" 
                    ? "Enter your credentials to access your account" 
                    : "Start your movie tracking journey today"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-8 xl:p-16 text-white">
        <div className="w-full max-w-2xl mx-auto flex flex-col justify-center">
          <div className="mb-12">
            <Film className="h-20 w-20 mb-8" />
            <h1 className="text-4xl xl:text-6xl font-bold mb-6">Welcome to Reelytics</h1>
            <p className="text-xl xl:text-2xl text-blue-100 mb-12">
              Your personal movie diary. Track films you've watched, rate them, write reviews, 
              and discover new movies tailored to your taste.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <TrendingUp className="h-10 w-10 mb-4" />
              <h3 className="font-semibold text-xl mb-3">Track Progress</h3>
              <p className="text-base text-blue-100">
                Keep a log of your watching history
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Star className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Rate Movies</h3>
              <p className="text-sm text-blue-100">
                Share your opinion with ratings and reviews
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Users className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Connect</h3>
              <p className="text-sm text-blue-100">
                Follow friends and discover their favorites
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <PlayCircle className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Discover</h3>
              <p className="text-sm text-blue-100">
                Get personalized movie recommendations              </p>
            </div>
          </div>
          
          <div className="mt-auto">
            <p className="text-sm text-blue-200">
              Join thousands of movie enthusiasts tracking their film journey
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 xl:p-24 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-2xl">
          <div className="text-center mb-8 lg:hidden">
            <Film className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold">Reelytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Your personal movie tracking app
            </p>
          </div>

          <Card className="border-0 shadow-xl lg:shadow-2xl lg:p-8 xl:p-12">
            <CardHeader className="space-y-2 pb-8 lg:pb-12">
              <CardTitle className="text-3xl lg:text-4xl xl:text-5xl font-bold text-center">
                {activeTab === "login" ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription className="text-center text-lg lg:text-xl xl:text-2xl">
                {activeTab === "login" 
                  ? "Enter your credentials to access your account" 
                  : "Start your movie tracking journey today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 lg:mb-12 h-14 lg:h-16 text-lg lg:text-xl">
                  <TabsTrigger value="login" className="text-lg lg:text-xl">Login</TabsTrigger>
                  <TabsTrigger value="register" className="text-lg lg:text-xl">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-6 lg:space-y-8">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (                          <FormItem>
                            <FormLabel className="text-base lg:text-lg xl:text-xl font-medium">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                {...field} 
                                className="h-12 lg:h-16 xl:h-20 text-base lg:text-lg xl:text-xl"
                              />
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
                            <FormLabel className="text-base lg:text-lg xl:text-xl font-medium">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field}
                                className="h-12 lg:h-16 xl:h-20 text-base lg:text-lg xl:text-xl" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-12 lg:h-16 xl:h-20 text-lg lg:text-xl xl:text-2xl font-medium"
                        disabled={loginForm.formState.isSubmitting}
                      >
                        {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-6 lg:space-y-8">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base lg:text-lg xl:text-xl font-medium">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                {...field}
                                className="h-12 lg:h-16 xl:h-20 text-base lg:text-lg xl:text-xl" 
                              />
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
                            <FormLabel className="text-base lg:text-lg xl:text-xl font-medium">Full Name (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                {...field}
                                className="h-12 lg:h-16 xl:h-20 text-base lg:text-lg xl:text-xl" 
                              />
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
                            <FormLabel className="text-base lg:text-lg xl:text-xl font-medium">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field}
                                className="h-12 lg:h-16 xl:h-20 text-base lg:text-lg xl:text-xl" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit"                        className="w-full h-12 lg:h-16 xl:h-20 text-lg lg:text-xl xl:text-2xl font-medium"
                        disabled={registerForm.formState.isSubmitting}
                      >
                        {registerForm.formState.isSubmitting ? "Creating account..." : "Create account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="text-center text-sm text-gray-600 dark:text-gray-400">
              {activeTab === "login" ? (
                <p className="w-full">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setActiveTab("register")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="w-full">
                  Already have an account?{" "}
                  <button 
                    onClick={() => setActiveTab("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </CardFooter>
          </Card>
          
          <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
            By continuing, you agree to Reelytics' Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}