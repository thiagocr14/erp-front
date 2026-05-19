'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProtectedLayout } from '@/components/protected-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Plus, Search, ArrowLeftRight, Trash2, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  produtosApi,
  estoqueApi,
  type Produto,
  type CriarProdutoDto,
  type EntradaEstoqueDto,
  type AjusteEstoqueDto,
  type ApiResponse,
} from '@/lib/api'
import { AxiosError } from 'axios'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Form validation types
interface FormErrors {
  [key: string]: string | undefined
}

// New Product Modal Component
function NovoProdutoModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<CriarProdutoDto>({
    nome: '',
    precoCusto: 0,
    precoVenda: 0,
    estoqueMinimo: 0,
    estoqueIdeal: 0,
    quantidadeInicial: 0,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const mutation = useMutation({
    mutationFn: (dto: CriarProdutoDto) => produtosApi.criar(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({ title: 'Sucesso', description: 'Produto criado com sucesso!' })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: AxiosError<ApiResponse<unknown>>) => {
      const errorMessage = error.response?.data?.erros?.[0] || 'Erro ao criar produto'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      precoCusto: 0,
      precoVenda: 0,
      estoqueMinimo: 0,
      estoqueIdeal: 0,
      quantidadeInicial: 0,
    })
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }
    if (formData.precoCusto < 0) {
      newErrors.precoCusto = 'Preço de custo não pode ser negativo'
    }
    if (formData.precoVenda < 0) {
      newErrors.precoVenda = 'Preço de venda não pode ser negativo'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      mutation.mutate(formData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo produto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do produto"
              />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precoCusto">Preço de Custo (R$)</Label>
                <Input
                  id="precoCusto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precoCusto}
                  onChange={(e) => setFormData({ ...formData, precoCusto: parseFloat(e.target.value) || 0 })}
                />
                {errors.precoCusto && <p className="text-sm text-destructive">{errors.precoCusto}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoVenda">Preço de Venda (R$)</Label>
                <Input
                  id="precoVenda"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precoVenda}
                  onChange={(e) => setFormData({ ...formData, precoVenda: parseFloat(e.target.value) || 0 })}
                />
                {errors.precoVenda && <p className="text-sm text-destructive">{errors.precoVenda}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                <Input
                  id="estoqueMinimo"
                  type="number"
                  min="0"
                  value={formData.estoqueMinimo}
                  onChange={(e) => setFormData({ ...formData, estoqueMinimo: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoqueIdeal">Estoque Ideal</Label>
                <Input
                  id="estoqueIdeal"
                  type="number"
                  min="0"
                  value={formData.estoqueIdeal}
                  onChange={(e) => setFormData({ ...formData, estoqueIdeal: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidadeInicial">Quantidade Inicial</Label>
              <Input
                id="quantidadeInicial"
                type="number"
                min="0"
                value={formData.quantidadeInicial}
                onChange={(e) => setFormData({ ...formData, quantidadeInicial: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Entry Stock Modal Component
function EntradaEstoqueModal({
  open,
  onOpenChange,
  produto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
}) {
  const queryClient = useQueryClient()
  const [quantidade, setQuantidade] = useState(0)
  const [observacao, setObservacao] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const mutation = useMutation({
    mutationFn: (dto: EntradaEstoqueDto) => estoqueApi.entrada(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({ title: 'Sucesso', description: 'Entrada de estoque registrada!' })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: AxiosError<ApiResponse<unknown>>) => {
      const errorMessage = error.response?.data?.erros?.[0] || 'Erro ao registrar entrada'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setQuantidade(0)
    setObservacao('')
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (quantidade <= 0) {
      newErrors.quantidade = 'Quantidade deve ser maior que zero'
    }
    if (observacao.trim().length < 3) {
      newErrors.observacao = 'Observação deve ter pelo menos 3 caracteres'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!produto) return
    if (validate()) {
      mutation.mutate({
        produtoId: produto.id,
        quantidade,
        observacao,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrada de Estoque</DialogTitle>
          <DialogDescription>
            {produto?.nome}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Estoque atual: <span className="font-medium text-foreground">{produto?.quantidadeAtual}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="entrada-quantidade">Quantidade *</Label>
              <Input
                id="entrada-quantidade"
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
              />
              {errors.quantidade && <p className="text-sm text-destructive">{errors.quantidade}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="entrada-observacao">Observação *</Label>
              <Input
                id="entrada-observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Motivo da entrada"
              />
              {errors.observacao && <p className="text-sm text-destructive">{errors.observacao}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Confirmar Entrada'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Adjustment Stock Modal Component
function AjusteEstoqueModal({
  open,
  onOpenChange,
  produto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
}) {
  const queryClient = useQueryClient()
  const [quantidade, setQuantidade] = useState(0)
  const [observacao, setObservacao] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const mutation = useMutation({
    mutationFn: (dto: AjusteEstoqueDto) => estoqueApi.ajuste(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({ title: 'Sucesso', description: 'Ajuste de estoque registrado!' })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: AxiosError<ApiResponse<unknown>>) => {
      const errorMessage = error.response?.data?.erros?.[0] || 'Erro ao registrar ajuste'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setQuantidade(0)
    setObservacao('')
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (quantidade === 0) {
      newErrors.quantidade = 'Quantidade não pode ser zero'
    }
    if (observacao.trim().length < 3) {
      newErrors.observacao = 'Observação deve ter pelo menos 3 caracteres'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!produto) return
    if (validate()) {
      mutation.mutate({
        produtoId: produto.id,
        quantidade,
        observacao,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuste de Estoque</DialogTitle>
          <DialogDescription>
            {produto?.nome}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Estoque atual: <span className="font-medium text-foreground">{produto?.quantidadeAtual}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="ajuste-quantidade">Quantidade * (positivo ou negativo)</Label>
              <Input
                id="ajuste-quantidade"
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
              />
              {errors.quantidade && <p className="text-sm text-destructive">{errors.quantidade}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ajuste-observacao">Observação *</Label>
              <Input
                id="ajuste-observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Motivo do ajuste"
              />
              {errors.observacao && <p className="text-sm text-destructive">{errors.observacao}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Confirmar Ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Confirmation Dialog Component
function DesativarProdutoDialog({
  open,
  onOpenChange,
  produto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number) => produtosApi.desativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({ title: 'Sucesso', description: 'Produto desativado com sucesso!' })
      onOpenChange(false)
    },
    onError: (error: AxiosError<ApiResponse<unknown>>) => {
      const errorMessage = error.response?.data?.erros?.[0] || 'Erro ao desativar produto'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    },
  })

  const handleConfirm = () => {
    if (produto) {
      mutation.mutate(produto.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Desativar Produto</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja desativar <span className="font-medium">{produto?.nome}</span>? Esta ação pode ser revertida pelo administrador.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? 'Desativando...' : 'Desativar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ProdutosPage() {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [apenasAtivos, setApenasAtivos] = useState(true)
  const [pagina, setPagina] = useState(1)
  const tamanhoPagina = 10

  // Modal states
  const [novoProdutoOpen, setNovoProdutoOpen] = useState(false)
  const [entradaOpen, setEntradaOpen] = useState(false)
  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [desativarOpen, setDesativarOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce the search term
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPagina(1)
    }, 300)
    return () => clearTimeout(timer)
  })

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['produtos', pagina, tamanhoPagina, debouncedSearch, apenasAtivos],
    queryFn: async () => {
      const response = await produtosApi.listar({
        pagina,
        tamanhoPagina,
        nome: debouncedSearch || undefined,
        apenasAtivos,
      })
      return response.data.dados
    },
  })

  const produtos = data?.itens || []
  const totalRegistros = data?.totalRegistros || 0
  const totalPaginas = data?.totalPaginas || 1

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setDebouncedSearch(value)
    setPagina(1)
  }

  const handleApenasAtivosChange = (checked: boolean) => {
    setApenasAtivos(checked)
    setPagina(1)
  }

  const openEntrada = (produto: Produto) => {
    setSelectedProduto(produto)
    setEntradaOpen(true)
  }

  const openAjuste = (produto: Produto) => {
    setSelectedProduto(produto)
    setAjusteOpen(true)
  }

  const openDesativar = (produto: Produto) => {
    setSelectedProduto(produto)
    setDesativarOpen(true)
  }

  const exibindoInicio = (pagina - 1) * tamanhoPagina + 1
  const exibindoFim = Math.min(pagina * tamanhoPagina, totalRegistros)

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie o catálogo de produtos
            </p>
          </div>
          <Button onClick={() => setNovoProdutoOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Package className="h-5 w-5" />
                Lista de Produtos
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="apenas-ativos"
                    checked={apenasAtivos}
                    onCheckedChange={handleApenasAtivosChange}
                  />
                  <Label htmlFor="apenas-ativos" className="text-sm text-muted-foreground cursor-pointer">
                    Mostrar apenas ativos
                  </Label>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : produtos.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhum produto encontrado</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Nome</TableHead>
                      <TableHead className="text-muted-foreground text-right">Preço Custo</TableHead>
                      <TableHead className="text-muted-foreground text-right">Preço Venda</TableHead>
                      <TableHead className="text-muted-foreground text-right">Qtd Atual</TableHead>
                      <TableHead className="text-muted-foreground text-right">Est. Mínimo</TableHead>
                      <TableHead className="text-muted-foreground text-right">Est. Ideal</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => (
                      <TableRow key={produto.id} className="border-border">
                        <TableCell className="font-medium text-card-foreground">
                          {produto.nome}
                        </TableCell>
                        <TableCell className="text-right text-card-foreground">
                          {formatCurrency(produto.precoCusto)}
                        </TableCell>
                        <TableCell className="text-right text-card-foreground">
                          {formatCurrency(produto.precoVenda)}
                        </TableCell>
                        <TableCell className="text-right text-card-foreground">
                          {produto.quantidadeAtual}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {produto.estoqueMinimo}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {produto.estoqueIdeal}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              produto.ativo
                                ? 'border-success/30 bg-success/20 text-success'
                                : 'border-destructive/30 bg-destructive/20 text-destructive'
                            }
                          >
                            {produto.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Entrada de Estoque"
                              onClick={() => openEntrada(produto)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Ajuste de Estoque"
                              onClick={() => openAjuste(produto)}
                            >
                              <ArrowLeftRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Desativar"
                              onClick={() => openDesativar(produto)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Exibindo {exibindoInicio} de {totalRegistros} produtos &middot; Página {pagina} de {totalPaginas}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={pagina >= totalPaginas}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <NovoProdutoModal open={novoProdutoOpen} onOpenChange={setNovoProdutoOpen} />
      <EntradaEstoqueModal open={entradaOpen} onOpenChange={setEntradaOpen} produto={selectedProduto} />
      <AjusteEstoqueModal open={ajusteOpen} onOpenChange={setAjusteOpen} produto={selectedProduto} />
      <DesativarProdutoDialog open={desativarOpen} onOpenChange={setDesativarOpen} produto={selectedProduto} />
    </ProtectedLayout>
  )
}
