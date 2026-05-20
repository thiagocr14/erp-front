'use client'

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
import { DollarSign, Package, AlertTriangle, Boxes } from 'lucide-react'
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

const movementTypeStyles: Record<string, string> = {
  Entrada: 'bg-success/20 text-success border-success/30',
  Saida: 'bg-destructive/20 text-destructive border-destructive/30',
  Ajuste: 'bg-warning/20 text-warning border-warning/30',
  Venda: 'bg-primary/20 text-primary border-primary/30',
}

export default function DashboardPage() {
  
  // 🎭 DADOS MAQUIADOS (MOCKADOS) PARA A APRESENTAÇÃO
  const dashboardData = {
    faturamentoTotal: 48950.00,
    valorEstoque: 24310.50,
    produtosAbaixoMinimo: 1,
    totalProdutos: 5,
    faturamentoMensal: [
      { mes: 'Jan', valor: 10000 },
      { mes: 'Fev', valor: 9500 },
      { mes: 'Mar', valor: 12000 },
      { mes: 'Abr', valor: 11000 },
      { mes: 'Mai', valor: 8450 },
    ]
  }

  const movimentacoes = [
    { id: '1', produto: 'Câmara de Ar Aro 29', tipo: 'Venda', quantidade: 1, data: new Date().toISOString() },
    { id: '2', produto: 'Jogo de Pastilhas de Freio a Disco', tipo: 'Entrada', quantidade: 15, data: new Date().toISOString() },
    { id: '3', produto: 'Par de Pneus Aro 29', tipo: 'Saida', quantidade: 2, data: new Date(Date.now() - 86400000).toISOString() },
    { id: '4', produto: 'Câmara de Ar Aro 29', tipo: 'Ajuste', quantidade: 1, data: new Date(Date.now() - 172800000).toISOString() },
    { id: '5', produto: 'Quadro Aro 26', tipo: 'Entrada', quantity: 5, data: new Date(Date.now() - 172800000).toISOString() }
  ]

  const kpiCards = [
    {
      title: 'Faturamento Total',
      value: formatCurrency(dashboardData.faturamentoTotal),
      icon: DollarSign,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      badge: false,
    },
    {
      title: 'Valor em Estoque',
      value: formatCurrency(dashboardData.valorEstoque),
      icon: Boxes,
      iconBg: 'bg-chart-2/10',
      iconColor: 'text-chart-2',
      badge: false,
    },
    {
      title: 'Produtos Abaixo do Mínimo',
      value: String(dashboardData.produtosAbaixoMinimo),
      icon: AlertTriangle,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      badge: true,
    },
    {
      title: 'Total de Produtos',
      value: String(dashboardData.totalProdutos),
      icon: Package,
      iconBg: 'bg-chart-3/10',
      iconColor: 'text-chart-3',
      badge: false,
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
                {card.badge ? (
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
              <RevenueChart data={dashboardData.faturamentoMensal} />
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
                  {movimentacoes.map((mov) => (
                    <TableRow key={mov.id} className="border-border">
                      <TableCell className="font-medium text-card-foreground">
                        {mov.produto}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={movementTypeStyles[mov.tipo] ?? 'bg-muted text-muted-foreground'}
                        >
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        {mov.quantidade ?? 1}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(mov.data)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}