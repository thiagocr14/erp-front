'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, LoginCredentials, LoginResponse } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: number
  nome: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials)
      const { dados, sucesso, erros } = response.data

      if (!sucesso) {
        toast({
          variant: 'destructive',
          title: 'Erro ao fazer login',
          description: erros[0] || 'Credenciais inválidas',
        })
        return
      }

      localStorage.setItem('token', dados.token)
      localStorage.setItem('user', JSON.stringify(dados.usuario))
      setToken(dados.token)
      setUser(dados.usuario)
      router.push('/dashboard')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { erros?: string[] } } }
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: err.response?.data?.erros?.[0] || 'Erro de conexão',
      })
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
