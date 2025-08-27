'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/contexts/ToastContext'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
  image?: string
  minOrderQuantity?: number
}

export const useCartSimple = () => {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)
  const { showToast } = useToast()

  // Only run on client side
  useEffect(() => {
    setMounted(true)
    
    // Clear any stale cache and force fresh data
    console.log('🧹 Cart initialized - ensuring fresh data')
    
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem('circle-kitchen-cart')
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('📦 Loaded cart from storage:', parsed)
        setItems(parsed)
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
    }
  }, [])

  // Save to localStorage when items change
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('circle-kitchen-cart', JSON.stringify(items))
      } catch (error) {
        console.error('Failed to save cart:', error)
      }
    }
  }, [items, mounted])

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantityToAdd: number = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === newItem.id)
      if (existing) {
        // Item already exists, increment quantity
        const newQuantity = existing.quantity + quantityToAdd
        const updatedItems = prev.map(item => 
          item.id === newItem.id 
            ? { ...item, quantity: newQuantity }
            : item
        )
        
        // Show toast for quantity update
        const quantityText = quantityToAdd === 1 
          ? `quantity increased to ${newQuantity}`
          : `${quantityToAdd} more added (total: ${newQuantity})`
          
        showToast({
          title: 'Item Updated',
          description: `${newItem.name} ${quantityText}`,
          type: 'success',
          duration: 3000
        })
        
        return updatedItems
      } else {
        // New item, add to cart
        const updatedItems = [...prev, { ...newItem, quantity: quantityToAdd }]
        
        // Show toast for new item
        const quantityText = quantityToAdd === 1 
          ? 'has been added to your cart'
          : `(${quantityToAdd} items) has been added to your cart`
          
        showToast({
          title: 'Added to Cart',
          description: `${newItem.name} ${quantityText}`,
          type: 'success',
          duration: 3000
        })
        
        return updatedItems
      }
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
    } else {
      setItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const fixMinimumQuantities = () => {
    setItems(prev => 
      prev.map(item => {
        const minQty = item.minOrderQuantity || 1
        if (item.quantity < minQty) {
          return { ...item, quantity: minQty }
        }
        return item
      })
    )
  }

  // Prevent hydration mismatch by returning empty state until mounted
  if (!mounted) {
    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      getTotalItems: () => 0,
      getTotalPrice: () => 0,
      fixMinimumQuantities: () => {},
      mounted: false
    }
  }

  const clearAllData = () => {
    // Clear cart and any cached data
    localStorage.removeItem('circle-kitchen-cart')
    setItems([])
    console.log('🧹 Cleared all cart data and cache')
  }

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearAllData,
    getTotalItems,
    getTotalPrice,
    fixMinimumQuantities,
    mounted: true
  }
}
