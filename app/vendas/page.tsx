'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { ProtectedLayout } from '@/components/protected-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, ShoppingCart, Plus, Minus, X, FileText, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/use-cart'
import {
  produtosApi,
  vendasApi,
  orcamentosApi,
  type ApiResponse,
  type Produto,
} from '@/lib/api'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default function VendasPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemsCount,
  } = useCart()

  // Load all active products for selection
  const { data: produtosData, isLoading } = useQuery({
    queryKey: ['produtos-venda'],
    queryFn: async () => {
      const response = await produtosApi.listar({
        pagina: 1,
        tamanhoPagina: 100,
        apenasAtivos: true,
      })
      return response.data?.dados ?? {
  itens: [],
  pagina: 1,
  tamanhoPagina: 10,
  totalRegistros: 0,
  totalPaginas: 0,
}
    },
  })

  // Client-side filter by name
  const filteredProdutos = useMemo(() => {
    if (!produtosData?.itens) return []
    if (!searchTerm.trim()) return produtosData.itens
    return produtosData.itens.filter((p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [produtosData, searchTerm])

  // Realizar venda mutation
  const vendaMutation = useMutation({
    mutationFn: async () => {
      const dto = {
        itens: cartItems.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
        })),
      }
      return vendasApi.realizar(dto)
    },
    onSuccess: () => {
      clearCart()
      setConfirmDialogOpen(false)
      toast({
        title: 'Venda realizada',
        description: 'A venda foi finalizada com sucesso.',
      })
      queryClient.invalidateQueries({ queryKey: ['produtos-venda'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
    },
    onError: (error: AxiosError<ApiResponse<unknown>>) => {
      const message = error.response?.data?.erros?.[0] || 'Erro ao realizar venda'
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: message,
      })
    },
  })

  // Salvar como orçamento mutation
  const orcamentoMutation = useMutation({
    mutationFn: async () => {
      const dto = {
        itens: cartItems.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
        })),
      }
      return orcamentosApi.criar(dto)
    },
    onSuccess: () => {
      clearCart()
      toast({
        title: 'Orçamento salvo',
        description: 'O orçamento foi salvo com sucesso.',
      })
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
    },
    onError: (error: AxiosError<ApiResponse<unknown>>) => {
      const message = error.response?.data?.erros?.[0] || 'Erro ao salvar orçamento'
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: message,
      })
    },
  })

  const handleProductClick = (produto: Produto) => {
    if (produto.quantidadeAtual <= 0) return
    addToCart(produto)
  }

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-2rem)] flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Venda</h1>
          <p className="text-muted-foreground">
            Selecione os produtos e finalize a venda
          </p>
        </div>

        <div className="grid flex-1 grid-cols-[60%_40%] gap-4 overflow-hidden">
          {/* Left Column - Product Selection */}
          <Card className="flex flex-col overflow-hidden border-border bg-card">
            <CardHeader className="shrink-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <ShoppingCart className="h-5 w-5" />
                Produtos
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Carregando produtos...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredProdutos.map((produto) => {
                    const outOfStock = produto.quantidadeAtual <= 0
                    return (
                      <button
                        key={produto.id}
                        onClick={() => handleProductClick(produto)}
                        disabled={outOfStock}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          outOfStock
                            ? 'cursor-not-allowed border-destructive/50 bg-destructive/5 opacity-60'
                            : 'border-border bg-card hover:border-primary hover:bg-accent'
                        }`}
                      >
                        <p className="line-clamp-2 text-sm font-medium text-card-foreground">
                          {produto.nome}
                        </p>
                        <p className="mt-1 text-lg font-bold text-primary">
                          {formatCurrency(produto.precoVenda)}
                        </p>
                        <p
                          className={`text-xs ${
                            outOfStock
                              ? 'font-medium text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {outOfStock
                            ? 'Sem estoque'
                            : `Disponível: ${produto.quantidadeAtual}`}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Cart */}
          <Card className="flex flex-col overflow-hidden border-border bg-card">
            <CardHeader className="shrink-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <FileText className="h-5 w-5" />
                Carrinho
                {cartItemsCount > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden">
              {cartItems.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-muted-foreground">
                    Clique nos produtos para adicionar ao carrinho
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-2 overflow-auto">
                    {cartItems.map((item) => (
                      <div
                        key={item.produto.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-card-foreground">
                            {item.produto.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.produto.precoVenda)} cada
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.produto.id, item.quantidade - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium text-card-foreground">
                            {item.quantidade}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.produto.id, item.quantidade + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="w-24 text-right text-sm font-bold text-card-foreground">
                          {formatCurrency(item.produto.precoVenda * item.quantidade)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(item.produto.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-card-foreground">
                        Total:
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={cartItems.length === 0 || orcamentoMutation.isPending}
                        onClick={() => orcamentoMutation.mutate()}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Salvar como Orçamento
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={cartItems.length === 0}
                        onClick={() => setConfirmDialogOpen(true)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Finalizar Venda
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Venda</DialogTitle>
            <DialogDescription>
              Confirmar venda de {cartItemsCount}{' '}
              {cartItemsCount === 1 ? 'item' : 'itens'} no valor de{' '}
              {formatCurrency(cartTotal)}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={vendaMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => vendaMutation.mutate()}
              disabled={vendaMutation.isPending}
            >
              {vendaMutation.isPending ? 'Processando...' : 'Confirmar Venda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  )
}
