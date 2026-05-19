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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  FileText,
  ArrowRightLeft,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/use-cart'
import {
  produtosApi,
  orcamentosApi,
  type ApiResponse,
  type Produto,
  type Orcamento,
} from '@/lib/api'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export default function OrcamentosPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(
    null
  )

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
  const { data: produtosData, isLoading: isLoadingProdutos } = useQuery({
    queryKey: ['produtos-orcamento'],
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

  // Load orçamentos list
  const { data: orcamentosData, isLoading: isLoadingOrcamentos } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      const response = await orcamentosApi.listar(1, 20)
      return response.data.dados
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

  // Create orçamento mutation
  const criarOrcamentoMutation = useMutation({
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
        description: 'O orçamento foi criado com sucesso.',
      })
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
    },
    onError: (error: AxiosError<ApiResponse<unknown>>) => {
      const message =
        error.response?.data?.erros?.[0] || 'Erro ao criar orçamento'
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: message,
      })
    },
  })

  // Convert orçamento to venda mutation
  const converterMutation = useMutation({
    mutationFn: async (id: string) => {
      return orcamentosApi.converter(id)
    },
    onSuccess: () => {
      setConvertDialogOpen(false)
      setSelectedOrcamento(null)
      toast({
        title: 'Orçamento convertido',
        description: 'O orçamento foi convertido em venda com sucesso.',
      })
      queryClient.invalidateQueries({ queryKey: ['produtos-orcamento'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
    },
    onError: (error: AxiosError<ApiResponse<unknown>>) => {
      const message =
        error.response?.data?.erros?.[0] || 'Erro ao converter orçamento'
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

  const handleConvertClick = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento)
    setConvertDialogOpen(true)
  }

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">
            Crie e gerencie orçamentos
          </p>
        </div>

        {/* Top Section - New Orçamento */}
        <div className="grid flex-1 grid-cols-[60%_40%] gap-4 overflow-hidden">
          {/* Left Column - Product Selection */}
          <Card className="flex flex-col overflow-hidden border-border bg-card">
            <CardHeader className="shrink-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <ShoppingCart className="h-5 w-5" />
                Novo Orçamento - Produtos
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
              {isLoadingProdutos ? (
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
                Itens do Orçamento
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
                    Clique nos produtos para adicionar ao orçamento
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
                        <div className="min-w-0 flex-1">
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

                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={
                        cartItems.length === 0 || criarOrcamentoMutation.isPending
                      }
                      onClick={() => criarOrcamentoMutation.mutate()}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {criarOrcamentoMutation.isPending
                        ? 'Salvando...'
                        : 'Salvar Orçamento'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Saved Orçamentos */}
        <Card className="shrink-0 border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <FileText className="h-5 w-5" />
              Orçamentos Salvos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrcamentos ? (
              <p className="text-center text-muted-foreground">
                Carregando orçamentos...
              </p>
            ) : !orcamentosData?.itens?.length ? (
              <p className="text-center text-muted-foreground">
                Nenhum orçamento encontrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Data</TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      Total
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      Itens
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentosData.itens.map((orcamento) => (
                    <TableRow key={orcamento.id} className="border-border">
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {orcamento.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(orcamento.data)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-card-foreground">
                        {formatCurrency(orcamento.total)}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        {orcamento.itens.length}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleConvertClick(orcamento)}
                        >
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Converter em Venda
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Convert Confirmation Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter Orçamento em Venda</DialogTitle>
            <DialogDescription>
              Converter orçamento em venda? O estoque será baixado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
              disabled={converterMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() =>
                selectedOrcamento && converterMutation.mutate(selectedOrcamento.id)
              }
              disabled={converterMutation.isPending}
            >
              {converterMutation.isPending ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  )
}
