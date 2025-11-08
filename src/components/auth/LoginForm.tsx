"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function LoginForm() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-red-700">
        {/* Diagonal pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.1) 20px,
              rgba(255,255,255,0.1) 40px
            )`,
          }}
        />

        {/* Background decorative elements */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/3 translate-x-1/4 opacity-30">
          <div className="relative">
            <div>
              <img src="logo.png" alt="" className="w-5xl h-5xl" />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex min-h-screen">
          <div className="flex-1 flex items-center justify-start px-16">
            <div className="w-full max-w-md">
              {/* Logo and title */}
              <div className="mb-12">
                <h1 className="text-6xl font-bold text-white mb-2">BestLoan</h1>
                <p className="text-xl text-white">Finance and Leasing Inc.</p>
              </div>

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="block text-white mb-2">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 bg-white border-0 rounded-md px-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="block text-white mb-2">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 bg-white border-0 rounded-md px-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]"
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="text-red-200 bg-red-700 rounded px-3 py-2 text-sm">
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="bg-[#0D92F4] hover:bg-[#0620ac] text-white px-8 py-3 rounded-md font-bold cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
