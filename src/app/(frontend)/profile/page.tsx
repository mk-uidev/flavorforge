'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Loader2, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import Link from 'next/link'

export default function ProfilePage() {
  const { customer, isAuthenticated, isLoading: authLoading, updateCustomer } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    defaultAddress: {
      street: '',
      area: '',
      city: 'Muscat',
      postalCode: '',
    }
  })

  // Redirect if not logged in (but wait for auth to load first)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile')
    }
  }, [authLoading, isAuthenticated, router])

  // Initialize form data
  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        defaultAddress: {
          street: customer.defaultAddress?.street || '',
          area: customer.defaultAddress?.area || '',
          city: customer.defaultAddress?.city || 'Muscat',
          postalCode: customer.defaultAddress?.postalCode || '',
        }
      })
    }
  }, [customer])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.startsWith('defaultAddress.')) {
      const addressField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        defaultAddress: {
          ...prev.defaultAddress,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Here you would typically make an API call to update the user profile
      // For now, we'll just update the local auth context
      updateCustomer({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        defaultAddress: formData.defaultAddress
      })

      showToast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
        type: 'success',
        duration: 3000
      })

      setIsEditing(false)
    } catch (error) {
      showToast({
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
        type: 'error',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        defaultAddress: {
          street: customer.defaultAddress?.street || '',
          area: customer.defaultAddress?.area || '',
          city: customer.defaultAddress?.city || 'Muscat',
          postalCode: customer.defaultAddress?.postalCode || '',
        }
      })
    }
    setIsEditing(false)
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirecting message only after auth has loaded and user is not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Store
            </Link>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.firstName} ${customer.lastName}`} alt={customer.firstName} />
                  <AvatarFallback className="bg-green-100 text-green-700 text-xl font-medium">
                    {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{customer.firstName} {customer.lastName}</CardTitle>
                <p className="text-sm text-gray-600">{customer.email}</p>
              </CardHeader>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/order-history">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Order History
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    View Cart
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled={true} // Email should not be editable
                    className="mt-1 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Default Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Default Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultAddress.street">Street Address</Label>
                  <Input
                    id="defaultAddress.street"
                    name="defaultAddress.street"
                    value={formData.defaultAddress.street}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="House/Building number, street name"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultAddress.area">Area/District</Label>
                    <Input
                      id="defaultAddress.area"
                      name="defaultAddress.area"
                      value={formData.defaultAddress.area}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Area or district"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultAddress.city">City</Label>
                    <Input
                      id="defaultAddress.city"
                      name="defaultAddress.city"
                      value={formData.defaultAddress.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="defaultAddress.postalCode">Postal Code (Optional)</Label>
                  <Input
                    id="defaultAddress.postalCode"
                    name="defaultAddress.postalCode"
                    value={formData.defaultAddress.postalCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Postal code"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex space-x-3">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
