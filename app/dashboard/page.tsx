'use client'

import { useQuery } from '@tanstack/react-query'
import { ProtectedLayout } from '@/components/protected-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, Package, AlertTriangle, Boxes } from 'lucide-react'
import { dashboardApi, DashboardData, Movimentacao } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { RevenueChart } from '@/components/revenue-chart'


function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const movementTypeStyles: Record<Movimentacao['tipo'], string> = {
  Entrada: 'bg-success/20 text-success border-success/30',
  Saida: 'bg-destructive/20 text-destructive border-destructive/30',
  Ajuste: 'bg-warning/20 text-warning border-warning/30',
  Venda: 'bg-primary/20 text-primary border-primary/30',
}

export default function DashboardPage() {
  const { toast } = useToast()

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['dashboard'],
   queryFn: async () => {
  const response = await dashboardApi.getDashboard()
  if (!response.data.sucesso) {
    toast({
      variant: 'destructive',
      title: 'Erro',
      description: response.data.erros[0],
    })
    return null
  }
  const d = response.data.dados as any
  return {
    faturamentoTotal: d.faturamentoTotal ?? d.FaturamentoTotal ?? 0,
    valorEstoque: d.valorTotalEstoque ?? d.ValorTotalEstoque ?? d.valorEstoque ?? 0,
    produtosAbaixoMinimo: d.produtosAbaixoMinimo?.length ?? d.ProdutosAbaixoMinimo?.length ?? d.produtosAbaixoMinimo ?? 0,
    totalProdutos: d.quantidadeProdutos ?? d.QuantidadeProdutos ?? d.totalProdutos ?? 0,
    faturamentoMensal: d.faturamentoMensal ?? [],
  } as DashboardData
},
  })

  const { data: movimentacoes, isLoading: isLoadingMovimentacoes } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async () => {
  const response = await dashboardApi.getMovimentacoes()
  if (!response.data.sucesso) {
    toast({
      variant: 'destructive',
      title: 'Erro',
      description: response.data.erros[0],
    })
    return []
  }
  const dados = response.data.dados as any
  const lista = Array.isArray(dados) ? dados : dados?.dados ?? dados?.itens ?? []
  return lista.slice(0, 5).map((m: any) => ({
    id: m.id,
    produto: m.produtoNome ?? m.produto ?? '',
    tipo: m.tipo,
    quantidade: m.quantidade,
    data: m.dataMovimentacao ?? m.data,
  })) as Movimentacao[]
},
  })

  const kpiCards = [
    {
      title: 'Faturamento Total',
      value: formatCurrency(dashboardData?.faturamentoTotal ?? 0),
      icon: DollarSign,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Valor em Estoque',
      value: formatCurrency(dashboardData?.valorEstoque ?? 0),
      icon: Boxes,
      iconBg: 'bg-chart-2/10',
      iconColor: 'text-chart-2',
    },
    {
      title: 'Produtos Abaixo do Mínimo',
      value: dashboardData?.produtosAbaixoMinimo ?? 0,
      icon: AlertTriangle,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      badge: true,
    },
    {
      title: 'Total de Produtos',
      value: dashboardData?.totalProdutos ?? 0,
      icon: Package,
      iconBg: 'bg-chart-3/10',
      iconColor: 'text-chart-3',
    },
  ]

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <Card key={card.title} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.iconBg}`}>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <Skeleton className="h-8 w-24" />
                ) : card.badge ? (
                  <Badge variant="destructive" className="text-lg font-bold">
                    {card.value}
                  </Badge>
                ) : (
                  <p className="text-2xl font-bold text-card-foreground">
                    {card.value}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Faturamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <RevenueChart data={dashboardData?.faturamentoMensal ?? []} />
              )}
            </CardContent>
          </Card>

          {/* Recent Movements Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Últimas Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMovimentacoes ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Produto</TableHead>
                      <TableHead className="text-muted-foreground">Tipo</TableHead>
                      <TableHead className="text-muted-foreground text-right">Qtd</TableHead>
                      <TableHead className="text-muted-foreground text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes?.map((mov) => (
                      <TableRow key={mov.id} className="border-border">
                        <TableCell className="font-medium text-card-foreground">
                          {mov.produto}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={movementTypeStyles[mov.tipo]}
                          >
                            {mov.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-card-foreground">
                          {mov.quantidade}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(mov.data)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
