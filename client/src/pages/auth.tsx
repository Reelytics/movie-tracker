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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

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

  useEffect(() => {
    if (user) setLocation('/');
  }, [user, setLocation]);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('reelytics_user');
      if (savedUser) setLocation('/');
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
  }, [setLocation]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", fullName: "" },
  });
  const onLogin = async (values: LoginFormValues) => {
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        setLocation('/');
      } else {
        toast({ variant: "destructive", title: "Login failed", description: result.error || "Invalid credentials." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Login error", description: "An unexpected error occurred." });
    }
  };

  const onRegister = async (values: RegisterFormValues) => {
    try {
      const result = await register(values.username, values.username, values.password, values.fullName);
      if (result.success) {
        toast({ title: "Account created!", description: "Welcome to Reelytics!" });
        setLocation('/');
      } else {
        toast({ variant: "destructive", title: "Registration failed", description: result.error || "Failed to create account." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Registration error", description: "An unexpected error occurred." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-4xl">
        
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="text-center mb-8">
            <Film className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold">Reelytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Your personal movie tracking app</p>
          </div>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {activeTab === "login" ? "Welcome back" : "Create an account"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField control={loginForm.control} name="username" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl><Input placeholder="Enter your username" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={loginForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" placeholder="Enter your password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                        {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField control={registerForm.control} name="username" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="Enter your email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={registerForm.control} name="fullName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (Optional)</FormLabel>
                          <FormControl><Input placeholder="Enter your full name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={registerForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" placeholder="Create a password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                        {registerForm.formState.isSubmitting ? "Creating account..." : "Create account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Film className="h-16 w-16 mb-6 text-primary" />
              <h1 className="text-4xl xl:text-5xl font-bold mb-6">Welcome to Reelytics</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Your personal movie diary. Track films, rate them, write reviews, and discover new movies.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Track your movie watching history</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Rate and review movies</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Scan movie tickets automatically</span>
                </div>
              </div>
            </div>
            
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">
                  {activeTab === "login" ? "Welcome back" : "Create an account"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
                    <TabsTrigger value="login" className="text-base">Login</TabsTrigger>
                    <TabsTrigger value="register" className="text-base">Register</TabsTrigger>
                  </TabsList>                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                        <FormField control={loginForm.control} name="username" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Username</FormLabel>
                            <FormControl><Input placeholder="Enter your username" {...field} className="h-12 text-base" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={loginForm.control} name="password" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Password</FormLabel>
                            <FormControl><Input type="password" placeholder="Enter your password" {...field} className="h-12 text-base" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="submit" className="w-full h-12 text-base" disabled={loginForm.formState.isSubmitting}>
                          {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                        <FormField control={registerForm.control} name="username" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Email</FormLabel>
                            <FormControl><Input type="email" placeholder="Enter your email" {...field} className="h-12 text-base" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={registerForm.control} name="fullName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Full Name (Optional)</FormLabel>
                            <FormControl><Input placeholder="Enter your full name" {...field} className="h-12 text-base" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={registerForm.control} name="password" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Password</FormLabel>
                            <FormControl><Input type="password" placeholder="Create a password" {...field} className="h-12 text-base" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="submit" className="w-full h-12 text-base" disabled={registerForm.formState.isSubmitting}>
                          {registerForm.formState.isSubmitting ? "Creating account..." : "Create account"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}