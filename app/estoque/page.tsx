'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProtectedLayout } from '@/components/protected-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { movimentacoesApi, type MovimentacaoEstoqueDto } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

type TipoMovimentacao = 'Entrada' | 'Saida' | 'Ajuste' | 'Venda'

const tipoStyles: Record<TipoMovimentacao, string> = {
  Entrada: 'border-success/30 bg-success/20 text-success',
  Saida: 'border-destructive/30 bg-destructive/20 text-destructive',
  Ajuste: 'border-warning/30 bg-warning/20 text-warning',
  Venda: 'border-primary/30 bg-primary/20 text-primary',
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatQuantidade(tipo: TipoMovimentacao, quantidade: number) {
  if (tipo === 'Entrada' || (tipo === 'Ajuste' && quantidade > 0)) {
    return `+${quantidade}`
  }
  if (tipo === 'Saida' || tipo === 'Venda' || (tipo === 'Ajuste' && quantidade < 0)) {
    return `-${Math.abs(quantidade)}`
  }
  return `${quantidade}`
}

function truncateText(text: string | null, maxLength: number) {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export default function EstoquePage() {
  const { toast } = useToast()
  const [pagina, setPagina] = useState(1)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [tipo, setTipo] = useState<string>('all')
  const [produto, setProduto] = useState('')
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: 'all',
    produto: '',
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['movimentacoes', pagina, filtrosAplicados],
    queryFn: async () => {
      const response = await movimentacoesApi.listar({
        pagina,
        tamanhoPagina: 15,
        dataInicio: filtrosAplicados.dataInicio || undefined,
        dataFim: filtrosAplicados.dataFim || undefined,
        tipo: filtrosAplicados.tipo !== 'all' ? filtrosAplicados.tipo : undefined,
        produto: filtrosAplicados.produto || undefined,
      })
      if (!response.data.sucesso) {
        toast({
          title: 'Erro',
          description: response.data.erros[0] || 'Erro ao carregar movimentações',
          variant: 'destructive',
        })
        throw new Error(response.data.erros[0])
      }
      return response.data.dados
    },
  })

  const handleBuscar = () => {
    setPagina(1)
    setFiltrosAplicados({ dataInicio, dataFim, tipo, produto })
  }

  const movimentacoes = data?.itens ?? []
  const totalPaginas = data?.totalPaginas ?? 1
  const totalRegistros = data?.totalRegistros ?? 0
  const resumo = data?.resumo ?? { totalEntradas: 0, totalSaidas: 0, totalAjustes: 0, totalVendas: 0 }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimentações de Estoque</h1>
          <p className="text-muted-foreground">
            Registro cronológico de todas as alterações de estoque
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <ArrowUpCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Entradas</p>
                  <p className="text-xl font-bold text-card-foreground">{resumo.totalEntradas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <ArrowDownCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Saídas</p>
                  <p className="text-xl font-bold text-card-foreground">{resumo.totalSaidas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <RefreshCw className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Ajustes</p>
                  <p className="text-xl font-bold text-card-foreground">{resumo.totalAjustes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Vendas</p>
                  <p className="text-xl font-bold text-card-foreground">{resumo.totalVendas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">De</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Até</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saida">Saída</SelectItem>
                    <SelectItem value="Ajuste">Ajuste</SelectItem>
                    <SelectItem value="Venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="produto">Produto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="produto"
                    placeholder="Buscar por nome do produto..."
                    value={produto}
                    onChange={(e) => setProduto(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                  />
                </div>
              </div>
              <Button onClick={handleBuscar}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Movimentacoes Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : movimentacoes.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">Nenhuma movimentação encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Data/Hora</TableHead>
                    <TableHead className="text-muted-foreground">Produto</TableHead>
                    <TableHead className="text-muted-foreground">Tipo</TableHead>
                    <TableHead className="text-muted-foreground text-right">Quantidade</TableHead>
                    <TableHead className="text-muted-foreground">Observação</TableHead>
                    <TableHead className="text-muted-foreground">Responsável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.map((mov: MovimentacaoEstoqueDto) => (
                    <TableRow key={mov.id} className="border-border">
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(mov.dataMovimentacao)}
                      </TableCell>
                      <TableCell className="font-medium text-card-foreground">
                        {mov.produtoNome}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={tipoStyles[mov.tipo]}
                        >
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          mov.tipo === 'Entrada' || (mov.tipo === 'Ajuste' && mov.quantidade > 0)
                            ? 'text-success'
                            : 'text-destructive'
                        }`}
                      >
                        {formatQuantidade(mov.tipo, mov.quantidade)}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        title={mov.observacao || undefined}
                      >
                        {truncateText(mov.observacao, 40)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {mov.responsavelNome || 'Sistema'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalRegistros > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Exibindo {movimentacoes.length} de {totalRegistros} movimentações - Página {pagina} de {totalPaginas}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                  >
                    Próxima
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
