'use client'

import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      // Reset form
      setFormData({ email: '', password: '' })
      // Redirect to home or previous page
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/'
      router.push(redirectTo)
    } else {
      setError(result.error || 'Login failed')
    }

    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your password"
                      className="pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {/* Benefits */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <h3 className="text-sm font-medium text-green-800 mb-2">✅ Benefits of having an account:</h3>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Auto-fill your delivery address</li>
                    <li>• Save your favorite orders</li>
                    <li>• Track order history</li>
                    <li>• Faster checkout process</li>
                  </ul>
                </div>

                {/* Switch to Register */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Don&#39;t have an account?{' '}
                    <Link
                      href="/register"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create one now
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
