import axios, { AxiosError } from 'axios'

export interface ApiResponse<T> {
  sucesso: boolean
  mensagem: string
  dados: T
  erros: string[]
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5197/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to unwrap data
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export interface LoginCredentials {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  usuario: {
    id: number
    nome: string
    email: string
  }
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', credentials),
}

// Dashboard
export interface DashboardData {
  faturamentoTotal: number
  valorEstoque: number
  produtosAbaixoMinimo: number
  totalProdutos: number
  faturamentoMensal: { mes: string; valor: number }[]
}

export interface Movimentacao {
  id: number
  produto: string
  tipo: 'Entrada' | 'Saida' | 'Ajuste' | 'Venda'
  quantidade: number
  data: string
}

export const dashboardApi = {
  getDashboard: () => api.get<ApiResponse<DashboardData>>('/dashboard'),
  getMovimentacoes: () =>
    api.get<ApiResponse<Movimentacao[]>>('/estoque/movimentacoes'),
}

// Produtos
export interface Produto {
  id: number
  nome: string
  precoCusto: number
  precoVenda: number
  quantidadeAtual: number
  estoqueMinimo: number
  estoqueIdeal: number
  ativo: boolean
}

export interface ProdutosPaginados {
  itens: Produto[]
  pagina: number
  tamanhoPagina: number
  totalRegistros: number
  totalPaginas: number
}

export interface CriarProdutoDto {
  nome: string
  precoCusto: number
  precoVenda: number
  estoqueMinimo: number
  estoqueIdeal: number
  quantidadeInicial: number
}

export interface EntradaEstoqueDto {
  produtoId: number
  quantidade: number
  observacao: string
}

export interface AjusteEstoqueDto {
  produtoId: number
  quantidade: number
  observacao: string
}

export interface ProdutosFiltro {
  pagina?: number
  tamanhoPagina?: number
  nome?: string
  apenasAtivos?: boolean
}

export const produtosApi = {
  listar: (filtro: ProdutosFiltro) =>
    api.get<ApiResponse<ProdutosPaginados>>('/produtos/filtro', { params: filtro }),
  criar: (dto: CriarProdutoDto) =>
    api.post<ApiResponse<Produto>>('/produtos', dto),
  desativar: (id: number) =>
    api.delete<ApiResponse<void>>(`/produtos/${id}`),
}

export const estoqueApi = {
  entrada: (dto: EntradaEstoqueDto) =>
    api.post<ApiResponse<void>>('/estoque/entrada', dto),
  ajuste: (dto: AjusteEstoqueDto) =>
    api.post<ApiResponse<void>>('/estoque/ajuste', dto),
}

// Vendas
export interface ItemVendaDto {
  produtoId: number
  quantidade: number
}

export interface RealizarVendaDto {
  itens: ItemVendaDto[]
}

export const vendasApi = {
  realizar: (dto: RealizarVendaDto) =>
    api.post<ApiResponse<void>>('/vendas', dto),
}

// Orçamentos
export interface Orcamento {
  id: string
  data: string
  total: number
  itens: { produtoId: number; quantidade: number; precoUnitario: number }[]
}

export interface OrcamentosPaginados {
  itens: Orcamento[]
  pagina: number
  tamanhoPagina: number
  totalRegistros: number
  totalPaginas: number
}

export interface CriarOrcamentoDto {
  itens: ItemVendaDto[]
}

export const orcamentosApi = {
  listar: (pagina = 1, tamanhoPagina = 20) =>
    api.get<ApiResponse<OrcamentosPaginados>>('/orcamentos', {
      params: { pagina, tamanhoPagina },
    }),
  criar: (dto: CriarOrcamentoDto) =>
    api.post<ApiResponse<Orcamento>>('/orcamentos', dto),
  converter: (id: string) =>
    api.post<ApiResponse<void>>(`/orcamentos/${id}/converter`),
}

// Movimentações de Estoque (página dedicada)
export interface MovimentacaoEstoqueDto {
  id: number
  produtoNome: string
  tipo: 'Entrada' | 'Saida' | 'Ajuste' | 'Venda'
  quantidade: number
  dataMovimentacao: string
  observacao: string | null
  responsavelNome: string | null
}

export interface MovimentacoesPaginadas {
  itens: MovimentacaoEstoqueDto[]
  pagina: number
  tamanhoPagina: number
  totalRegistros: number
  totalPaginas: number
  resumo: {
    totalEntradas: number
    totalSaidas: number
    totalAjustes: number
    totalVendas: number
  }
}

export interface MovimentacoesFiltro {
  pagina?: number
  tamanhoPagina?: number
  dataInicio?: string
  dataFim?: string
  tipo?: string
  produto?: string
}

export const movimentacoesApi = {
  listar: (filtro: MovimentacoesFiltro) =>
    api.get<ApiResponse<MovimentacoesPaginadas>>('/estoque/movimentacoes', { params: filtro }),
}

// Relatórios
export interface VendaDia {
  horario: string
  quantidadeItens: number
  total: number
}

export interface MovimentacaoDia {
  horario: string
  produtoNome: string
  tipo: 'Entrada' | 'Saida' | 'Ajuste' | 'Venda'
  quantidade: number
}

export interface FechamentoDiaDto {
  data: string
  totalVendas: number
  faturamentoDia: number
  ticketMedio: number
  produtosMovimentados: number
  vendas: VendaDia[]
  movimentacoes: MovimentacaoDia[]
}

export const relatoriosApi = {
  fechamentoDia: (data: string) =>
    api.get<ApiResponse<FechamentoDiaDto>>('/relatorios/fechamento-dia', { params: { data } }),
}
