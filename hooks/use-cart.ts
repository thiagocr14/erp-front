'use client'

import { useState, useCallback, useMemo } from 'react'
import type { Produto } from '@/lib/api'

export interface CartItem {
  produto: Produto
  quantidade: number
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = useCallback((produto: Produto) => {
    if (produto.quantidadeAtual <= 0) return

    setCartItems((prev) => {
      const existing = prev.find((item) => item.produto.id === produto.id)
      if (existing) {
        return prev.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      }
      return [...prev, { produto, quantidade: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((produtoId: number) => {
    setCartItems((prev) => prev.filter((item) => item.produto.id !== produtoId))
  }, [])

  const updateQuantity = useCallback((produtoId: number, quantidade: number) => {
    if (quantidade <= 0) {
      setCartItems((prev) => prev.filter((item) => item.produto.id !== produtoId))
      return
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.produto.id === produtoId ? { ...item, quantidade } : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.produto.precoVenda * item.quantidade,
      0
    )
  }, [cartItems])

  const cartItemsCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantidade, 0)
  }, [cartItems])

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemsCount,
  }
}
