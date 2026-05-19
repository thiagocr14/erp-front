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
import { Label } from '@/components/ui/label'
import {
  FileText,
  Printer,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react'
import { relatoriosApi, type FechamentoDiaDto, type MovimentacaoDia } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

type TipoMovimentacao = 'Entrada' | 'Saida' | 'Ajuste' | 'Venda'

const tipoStyles: Record<TipoMovimentacao, string> = {
  Entrada: 'border-success/30 bg-success/20 text-success',
  Saida: 'border-destructive/30 bg-destructive/20 text-destructive',
  Ajuste: 'border-warning/30 bg-warning/20 text-warning',
  Venda: 'border-primary/30 bg-primary/20 text-primary',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDateBR(dateString: string) {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

function formatNow() {
  const now = new Date()
  return now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function getTodayISO() {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

export default function RelatoriosPage() {
  const { toast } = useToast()
  const [dataSelecionada, setDataSelecionada] = useState(getTodayISO())
  const [dataGerada, setDataGerada] = useState<string | null>(null)
  const [geradoEm, setGeradoEm] = useState<string | null>(null)

  const { data: relatorio, isLoading, refetch } = useQuery({
    queryKey: ['fechamento-dia', dataGerada],
    queryFn: async () => {
      if (!dataGerada) return null
      const response = await relatoriosApi.fechamentoDia(dataGerada)
      if (!response.data.sucesso) {
        toast({
          title: 'Erro',
          description: response.data.erros[0] || 'Erro ao gerar relatório',
          variant: 'destructive',
        })
        throw new Error(response.data.erros[0])
      }
      return response.data.dados
    },
    enabled: !!dataGerada,
  })

  const handleGerar = () => {
    setDataGerada(dataSelecionada)
    setGeradoEm(formatNow())
  }

  const handleImprimir = () => {
    window.print()
  }

  return (
    <ProtectedLayout>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
          }
          .print-area * {
            color: black !important;
            border-color: #e5e7eb !important;
          }
          .print-area .bg-card {
            background: white !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header - hidden on print */}
        <div className="no-print">
          <h1 className="text-2xl font-bold text-foreground">Relatório de Fechamento Diário</h1>
          <p className="text-muted-foreground">
            Resumo consolidado das operações do dia
          </p>
        </div>

        {/* Filter Bar - hidden on print */}
        <Card className="no-print border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="data"
                    type="date"
                    value={dataSelecionada}
                    onChange={(e) => setDataSelecionada(e.target.value)}
                    className="w-44 pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleGerar}>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
              {relatorio && (
                <Button variant="outline" onClick={handleImprimir}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="flex h-48 items-center justify-center">
            <p className="text-muted-foreground">Gerando relatório...</p>
          </div>
        )}

        {/* Report Content - visible area for print */}
        {relatorio && !isLoading && (
          <div className="print-area space-y-6">
            {/* Report Header */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-card-foreground">
                      ERP Acadêmico — Fechamento do Dia
                    </CardTitle>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatDateBR(relatorio.data)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Gerado em:</p>
                    <p>{geradoEm}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Vendas</p>
                      <p className="text-xl font-bold text-card-foreground">{relatorio.totalVendas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-success/10 p-2">
                      <DollarSign className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Faturamento do Dia</p>
                      <p className="text-xl font-bold text-card-foreground">
                        {formatCurrency(relatorio.faturamentoDia)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-chart-4/10 p-2">
                      <TrendingUp className="h-5 w-5 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Médio</p>
                      <p className="text-xl font-bold text-card-foreground">
                        {formatCurrency(relatorio.ticketMedio)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-chart-2/10 p-2">
                      <Package className="h-5 w-5 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Produtos Movimentados</p>
                      <p className="text-xl font-bold text-card-foreground">
                        {relatorio.produtosMovimentados}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vendas do Dia */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Vendas do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {relatorio.vendas.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Nenhuma venda registrada neste dia
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Horário</TableHead>
                        <TableHead className="text-muted-foreground text-right">Itens</TableHead>
                        <TableHead className="text-muted-foreground text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.vendas.map((venda, index) => (
                        <TableRow key={index} className="border-border">
                          <TableCell className="text-muted-foreground">
                            {venda.horario}
                          </TableCell>
                          <TableCell className="text-right text-card-foreground">
                            {venda.quantidadeItens}
                          </TableCell>
                          <TableCell className="text-right font-medium text-success">
                            {formatCurrency(venda.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Movimentações do Dia */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Movimentações do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {relatorio.movimentacoes.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Nenhuma movimentação registrada neste dia
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Horário</TableHead>
                        <TableHead className="text-muted-foreground">Produto</TableHead>
                        <TableHead className="text-muted-foreground">Tipo</TableHead>
                        <TableHead className="text-muted-foreground text-right">Quantidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.movimentacoes.map((mov: MovimentacaoDia, index: number) => (
                        <TableRow key={index} className="border-border">
                          <TableCell className="text-muted-foreground">
                            {mov.horario}
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
                            {mov.tipo === 'Entrada' || (mov.tipo === 'Ajuste' && mov.quantidade > 0)
                              ? `+${mov.quantidade}`
                              : `-${Math.abs(mov.quantidade)}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {!relatorio && !isLoading && (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Selecione uma data e clique em &quot;Gerar Relatório&quot; para visualizar o fechamento do dia.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  )
}
