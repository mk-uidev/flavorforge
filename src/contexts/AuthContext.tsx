'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  defaultAddress?: {
    street: string
    area: string
    city: string
    postalCode?: string
  }
}

interface AuthContextType {
  customer: Customer | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (customerData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateCustomer: (customerData: Partial<Customer>) => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  defaultAddress?: {
    street: string
    area: string
    city: string
    postalCode?: string
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedCustomer = localStorage.getItem('customer_data')
    
    if (savedToken && savedCustomer) {
      try {
        setToken(savedToken)
        setCustomer(JSON.parse(savedCustomer))
      } catch (error) {
        console.error('Error parsing saved customer data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('customer_data')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const { token: authToken, user } = result
        
        setToken(authToken)
        setCustomer(user)
        
        // Save to localStorage
        localStorage.setItem('auth_token', authToken)
        localStorage.setItem('customer_data', JSON.stringify(user))
        
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const register = async (customerData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const { token: authToken, user } = result
        
        setToken(authToken)
        setCustomer(user)
        
        // Save to localStorage
        localStorage.setItem('auth_token', authToken)
        localStorage.setItem('customer_data', JSON.stringify(user))
        
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    setCustomer(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('customer_data')
  }

  const updateCustomer = (customerData: Partial<Customer>) => {
    if (customer) {
      const updatedCustomer = { ...customer, ...customerData }
      setCustomer(updatedCustomer)
      localStorage.setItem('customer_data', JSON.stringify(updatedCustomer))
    }
  }

  const value: AuthContextType = {
    customer,
    token,
    isAuthenticated: !!customer && !!token,
    isLoading,
    login,
    register,
    logout,
    updateCustomer,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
