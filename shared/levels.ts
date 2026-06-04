/**
 * RIDDY Ranks — Sistema de Níveis, Score e Conquistas
 * Ecossistema completo de reputação inspirado em Airbnb, Uber, Turo e Mercado Livre.
 * Versão 2.0 — Score Riddy multidimensional, benefícios rebalanceados, conquistas expandidas.
 */

// ─── LOCATÁRIO (RIDER) ────────────────────────────────────────────────────────

export interface RiderLevelConfig {
  level: number;
  name: string;
  subtitle: string;
  /** Score mínimo para atingir este nível (0-1000) */
  minScore: number;
  /** Número mínimo de locações concluídas */
  minRentals: number;
  /** Nota mínima média (0 = sem requisito) */
  minRating: number;
  /** Desconto percentual sobre o total da locação (0.02 = 2%) */
  rentalDiscount: number;
  /** Multiplicador da garantia (1.0 = sem redução, 0.5 = 50% de redução) */
  depositMultiplier: number;
  /** Horas de antecedência para cancelamento gratuito */
  freeCancelHours: number;
  /** Suporte prioritário */
  prioritySupport: boolean;
  /** Acesso antecipado a veículos novos */
  earlyAccess: boolean;
  /** Aprovação automática de reserva */
  instantBook: boolean;
  /** Cor do badge (hex) */
  color: string;
  /** Gradiente do cartão compartilhável */
  gradient: string;
  /** Ícone lucide */
  icon: string;
  /** Descrição dos benefícios para exibição */
  benefits: string[];
  /** Se é o nível lendário (experiência premium especial) */
  isLegend?: boolean;
}

export const RIDER_LEVELS: RiderLevelConfig[] = [
  {
    level: 1,
    name: "Explorer",
    subtitle: "Sua jornada começa aqui",
    minScore: 0,
    minRentals: 0,
    minRating: 0,
    rentalDiscount: 0,
    depositMultiplier: 1.0,
    freeCancelHours: 24,
    prioritySupport: false,
    earlyAccess: false,
    instantBook: false,
    color: "#8B9BB4",
    gradient: "linear-gradient(135deg, #1a2332 0%, #2d3f55 50%, #1a2332 100%)",
    icon: "Compass",
    benefits: [
      "Acesso completo ao marketplace",
      "Suporte via chat",
      "Cancelamento gratuito com 24h de antecedência",
    ],
  },
  {
    level: 2,
    name: "Road Rider",
    subtitle: "Você já conhece o caminho",
    minScore: 150,
    minRentals: 5,
    minRating: 0,
    rentalDiscount: 0.02,
    depositMultiplier: 1.0,
    freeCancelHours: 24,
    prioritySupport: false,
    earlyAccess: false,
    instantBook: false,
    color: "#00D4FF",
    gradient: "linear-gradient(135deg, #0a1628 0%, #0d2a4a 50%, #0a1628 100%)",
    icon: "Map",
    benefits: [
      "2% de desconto em todas as locações",
      "Badge Road Rider no perfil",
      "Cancelamento gratuito com 24h de antecedência",
    ],
  },
  {
    level: 3,
    name: "Riddy Pro",
    subtitle: "Cada viagem é uma conquista",
    minScore: 350,
    minRentals: 15,
    minRating: 4.3,
    rentalDiscount: 0.03,
    depositMultiplier: 0.9,
    freeCancelHours: 12,
    prioritySupport: true,
    earlyAccess: false,
    instantBook: false,
    color: "#00E5A0",
    gradient: "linear-gradient(135deg, #0a1a14 0%, #0d3326 50%, #0a1a14 100%)",
    icon: "Mountain",
    benefits: [
      "3% de desconto em todas as locações",
      "Badge exclusivo no perfil",
      "Prioridade moderada no suporte",
      "Cancelamento gratuito com 12h de antecedência",
    ],
  },
  {
    level: 4,
    name: "Elite Driver",
    subtitle: "Você dirige no nível mais alto",
    minScore: 600,
    minRentals: 30,
    minRating: 4.7,
    rentalDiscount: 0.05,
    depositMultiplier: 0.75,
    freeCancelHours: 6,
    prioritySupport: true,
    earlyAccess: true,
    instantBook: false,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #1a1400 0%, #332800 50%, #1a1400 100%)",
    icon: "Steering",
    benefits: [
      "5% de desconto em todas as locações",
      "Caução reduzida em 25%",
      "Prioridade alta no suporte",
      "Destaque visual no perfil",
      "Cancelamento gratuito com 6h de antecedência",
    ],
  },
  {
    level: 5,
    name: "Riddy Legend",
    subtitle: "Status. Não é um nível — é uma identidade.",
    minScore: 850,
    minRentals: 75,
    minRating: 4.9,
    rentalDiscount: 0.07,
    depositMultiplier: 0.5,
    freeCancelHours: 2,
    prioritySupport: true,
    earlyAccess: true,
    instantBook: true,
    color: "#A855F7",
    gradient: "linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 30%, #2d1060 70%, #0f0a1a 100%)",
    icon: "Crown",
    isLegend: true,
    benefits: [
      "7% de desconto em todas as locações",
      "Caução reduzida em 50%",
      "Acesso antecipado a novidades",
      "Suporte VIP dedicado 24h",
      "Badge dourado exclusivo",
      "Perfil destacado na plataforma",
      "Benefícios exclusivos futuros",
    ],
  },
];

// ─── ANFITRIÃO (HOST) ─────────────────────────────────────────────────────────

export interface HostLevelConfig {
  level: number;
  name: string;
  subtitle: string;
  minScore: number;
  minRentals: number;
  minRating: number;
  /** Taxa de serviço da plataforma (0.12 = 12%) */
  platformFeeRate: number;
  /** Taxa máxima de cancelamento permitida (0.05 = 5%) */
  maxCancellationRate: number;
  /** Horas máximas de resposta para manter o nível */
  maxResponseHours: number | null;
  /** Destaque na busca */
  searchBoost: boolean;
  /** Gerente de conta dedicado */
  dedicatedManager: boolean;
  /** Relatório mensal de performance */
  monthlyReport: boolean;
  color: string;
  gradient: string;
  icon: string;
  benefits: string[];
  isLegend?: boolean;
}

export const HOST_LEVELS: HostLevelConfig[] = [
  {
    level: 1,
    name: "Anfitrião Iniciante",
    subtitle: "Bem-vindo à frota RIDDY",
    minScore: 0,
    minRentals: 0,
    minRating: 0,
    platformFeeRate: 0.12,
    maxCancellationRate: 1.0,
    maxResponseHours: null,
    searchBoost: false,
    dedicatedManager: false,
    monthlyReport: false,
    color: "#8B9BB4",
    gradient: "linear-gradient(135deg, #1a2332 0%, #2d3f55 50%, #1a2332 100%)",
    icon: "Key",
    benefits: [
      "Listagem no marketplace",
      "Taxa de serviço: 12%",
      "Suporte via chat",
      "Painel de gestão completo",
    ],
  },
  {
    level: 2,
    name: "Anfitrião Verificado",
    subtitle: "Confiança que gera reservas",
    minScore: 150,
    minRentals: 10,
    minRating: 4.0,
    platformFeeRate: 0.115,
    maxCancellationRate: 0.10,
    maxResponseHours: null,
    searchBoost: false,
    dedicatedManager: false,
    monthlyReport: false,
    color: "#00D4FF",
    gradient: "linear-gradient(135deg, #0a1628 0%, #0d2a4a 50%, #0a1628 100%)",
    icon: "ShieldCheck",
    benefits: [
      "Redução de 0,5% na taxa (11,5%)",
      "Badge Verificado no perfil",
      "Suporte prioritário",
    ],
  },
  {
    level: 3,
    name: "Anfitrião Pro",
    subtitle: "Referência em hospitalidade",
    minScore: 350,
    minRentals: 30,
    minRating: 4.7,
    platformFeeRate: 0.11,
    maxCancellationRate: 0.05,
    maxResponseHours: 12,
    searchBoost: false,
    dedicatedManager: false,
    monthlyReport: false,
    color: "#00E5A0",
    gradient: "linear-gradient(135deg, #0a1a14 0%, #0d3326 50%, #0a1a14 100%)",
    icon: "Star",
    benefits: [
      "Redução de 1% na taxa (11%)",
      "Badge Pro no perfil",
      "Suporte prioritário 24h",
    ],
  },
  {
    level: 4,
    name: "Anfitrião Elite",
    subtitle: "Performance de alto nível",
    minScore: 600,
    minRentals: 100,
    minRating: 4.85,
    platformFeeRate: 0.105,
    maxCancellationRate: 0.03,
    maxResponseHours: 4,
    searchBoost: true,
    dedicatedManager: false,
    monthlyReport: true,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #1a1400 0%, #332800 50%, #1a1400 100%)",
    icon: "Trophy",
    benefits: [
      "Redução de 1,5% na taxa (10,5%)",
      "Destaque nas buscas",
      "Badge Elite no perfil",
      "Relatório mensal de performance",
    ],
  },
  {
    level: 5,
    name: "Lenda Riddy",
    subtitle: "O anfitrião que define o padrão",
    minScore: 850,
    minRentals: 300,
    minRating: 4.95,
    platformFeeRate: 0.095,
    maxCancellationRate: 0.01,
    maxResponseHours: 1,
    searchBoost: true,
    dedicatedManager: true,
    monthlyReport: true,
    color: "#A855F7",
    gradient: "linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 30%, #2d1060 70%, #0f0a1a 100%)",
    icon: "Gem",
    isLegend: true,
    benefits: [
      "Redução de 2,5% na taxa (9,5%)",
      "Destaque máximo nas buscas",
      "Suporte dedicado",
      "Badge especial exclusivo",
      "Perfil premium em destaque",
    ],
  },
];

// ─── CONQUISTAS ───────────────────────────────────────────────────────────────

export interface AchievementConfig {
  key: string;
  title: string;
  description: string;
  context: "renter" | "host" | "both";
  icon: string;
  color: string;
  /** Critério de desbloqueio (para exibição) */
  criteria: string;
  /** Categoria da conquista */
  category: "primeiras" | "crescimento" | "reputacao" | "fidelidade" | "especiais";
  /** Raridade */
  rarity: "comum" | "raro" | "epico" | "lendario";
}

export const ACHIEVEMENTS: AchievementConfig[] = [
  // ─── PRIMEIRAS CONQUISTAS ─────────────────────────────────────────────────
  {
    key: "first_rental",
    title: "Primeira Viagem",
    description: "Completou sua primeira locação na RIDDY",
    context: "renter",
    icon: "Rocket",
    color: "#00D4FF",
    criteria: "1 locação concluída",
    category: "primeiras",
    rarity: "comum",
  },
  {
    key: "first_host",
    title: "Primeiro Hóspede",
    description: "Completou sua primeira locação como anfitrião",
    context: "host",
    icon: "Home",
    color: "#00D4FF",
    criteria: "1ª locação como anfitrião",
    category: "primeiras",
    rarity: "comum",
  },
  {
    key: "first_checkin",
    title: "Check-in Perfeito",
    description: "Realizou o primeiro check-in com sucesso",
    context: "renter",
    icon: "CheckCircle",
    color: "#00E5A0",
    criteria: "1 check-in concluído",
    category: "primeiras",
    rarity: "comum",
  },
  {
    key: "first_listing",
    title: "Primeiro Anúncio",
    description: "Publicou seu primeiro veículo na plataforma",
    context: "host",
    icon: "PlusCircle",
    color: "#00E5A0",
    criteria: "1 veículo publicado",
    category: "primeiras",
    rarity: "comum",
  },

  // ─── CRESCIMENTO ──────────────────────────────────────────────────────────
  {
    key: "rentals_10",
    title: "10 Viagens",
    description: "Completou 10 locações na plataforma",
    context: "renter",
    icon: "TrendingUp",
    color: "#00D4FF",
    criteria: "10 locações concluídas",
    category: "crescimento",
    rarity: "comum",
  },
  {
    key: "rentals_25",
    title: "25 Viagens",
    description: "Completou 25 locações na plataforma",
    context: "renter",
    icon: "BarChart2",
    color: "#00E5A0",
    criteria: "25 locações concluídas",
    category: "crescimento",
    rarity: "raro",
  },
  {
    key: "rentals_50",
    title: "50 Viagens",
    description: "Completou 50 locações — você é um verdadeiro viajante",
    context: "renter",
    icon: "Heart",
    color: "#FF6B6B",
    criteria: "50 locações concluídas",
    category: "crescimento",
    rarity: "raro",
  },
  {
    key: "rentals_100",
    title: "100 Viagens",
    description: "Centenário da estrada — 100 locações concluídas",
    context: "renter",
    icon: "Award",
    color: "#FFD700",
    criteria: "100 locações concluídas",
    category: "crescimento",
    rarity: "epico",
  },
  {
    key: "rentals_500",
    title: "500 Viagens",
    description: "Lendário das estradas — 500 locações concluídas",
    context: "renter",
    icon: "Crown",
    color: "#A855F7",
    criteria: "500 locações concluídas",
    category: "crescimento",
    rarity: "lendario",
  },
  {
    key: "road_warrior",
    title: "Guerreiro da Estrada",
    description: "Rodou mais de 1.000 km na plataforma",
    context: "renter",
    icon: "Route",
    color: "#00E5A0",
    criteria: "1.000 km rodados",
    category: "crescimento",
    rarity: "raro",
  },
  {
    key: "city_explorer",
    title: "Explorador de Cidades",
    description: "Alugou em 3 cidades diferentes",
    context: "renter",
    icon: "MapPin",
    color: "#FFD700",
    criteria: "3 cidades diferentes",
    category: "crescimento",
    rarity: "raro",
  },
  {
    key: "luxury_taste",
    title: "Gosto Refinado",
    description: "Alugou um veículo da categoria Luxo",
    context: "renter",
    icon: "Diamond",
    color: "#A855F7",
    criteria: "1 locação de veículo Luxo",
    category: "crescimento",
    rarity: "raro",
  },
  {
    key: "host_rentals_10",
    title: "10 Locações",
    description: "Completou 10 locações como anfitrião",
    context: "host",
    icon: "TrendingUp",
    color: "#00D4FF",
    criteria: "10 locações como anfitrião",
    category: "crescimento",
    rarity: "comum",
  },
  {
    key: "host_rentals_50",
    title: "50 Locações",
    description: "Completou 50 locações como anfitrião",
    context: "host",
    icon: "BarChart2",
    color: "#00E5A0",
    criteria: "50 locações como anfitrião",
    category: "crescimento",
    rarity: "raro",
  },
  {
    key: "top_earner",
    title: "Top Faturamento",
    description: "Faturou mais de R$ 10.000 na plataforma",
    context: "host",
    icon: "DollarSign",
    color: "#00E5A0",
    criteria: "R$ 10.000 em faturamento",
    category: "crescimento",
    rarity: "epico",
  },
  {
    key: "fleet_builder",
    title: "Construtor de Frota",
    description: "Cadastrou 3 ou mais veículos ativos",
    context: "host",
    icon: "Car",
    color: "#FF6B35",
    criteria: "3+ veículos ativos",
    category: "crescimento",
    rarity: "raro",
  },

  // ─── REPUTAÇÃO ────────────────────────────────────────────────────────────
  {
    key: "perfect_score",
    title: "Nota Perfeita",
    description: "Recebeu avaliação 5 estrelas",
    context: "renter",
    icon: "Star",
    color: "#FFD700",
    criteria: "1 avaliação 5★",
    category: "reputacao",
    rarity: "comum",
  },
  {
    key: "reviews_10",
    title: "10 Avaliações Positivas",
    description: "Recebeu 10 avaliações com nota ≥ 4.5",
    context: "renter",
    icon: "ThumbsUp",
    color: "#00E5A0",
    criteria: "10 avaliações ≥ 4.5★",
    category: "reputacao",
    rarity: "raro",
  },
  {
    key: "reviews_50",
    title: "50 Avaliações Positivas",
    description: "Recebeu 50 avaliações com nota ≥ 4.5",
    context: "renter",
    icon: "Medal",
    color: "#FFD700",
    criteria: "50 avaliações ≥ 4.5★",
    category: "reputacao",
    rarity: "epico",
  },
  {
    key: "reviews_100",
    title: "100 Avaliações Positivas",
    description: "Recebeu 100 avaliações com nota ≥ 4.5",
    context: "renter",
    icon: "Award",
    color: "#A855F7",
    criteria: "100 avaliações ≥ 4.5★",
    category: "reputacao",
    rarity: "lendario",
  },
  {
    key: "five_star_host",
    title: "Anfitrião 5 Estrelas",
    description: "Manteve nota 5.0 por 30 locações consecutivas",
    context: "host",
    icon: "Star",
    color: "#FFD700",
    criteria: "5.0 em 30 locações seguidas",
    category: "reputacao",
    rarity: "epico",
  },
  {
    key: "zero_cancel",
    title: "Tolerância Zero",
    description: "30 locações sem nenhum cancelamento",
    context: "host",
    icon: "ShieldCheck",
    color: "#00E5A0",
    criteria: "30 locações sem cancelamento",
    category: "reputacao",
    rarity: "raro",
  },
  {
    key: "fast_responder",
    title: "Resposta Relâmpago",
    description: "Respondeu em menos de 30 minutos por 20 vezes",
    context: "host",
    icon: "Zap",
    color: "#FFD700",
    criteria: "20 respostas em < 30min",
    category: "reputacao",
    rarity: "raro",
  },
  {
    key: "early_bird",
    title: "Madrugador",
    description: "Fez reserva com mais de 7 dias de antecedência",
    context: "renter",
    icon: "Sunrise",
    color: "#FF9500",
    criteria: "Reserva com 7+ dias de antecedência",
    category: "reputacao",
    rarity: "comum",
  },

  // ─── FIDELIDADE ───────────────────────────────────────────────────────────
  {
    key: "loyalty_6months",
    title: "6 Meses RIDDY",
    description: "Membro ativo há 6 meses na plataforma",
    context: "renter",
    icon: "Calendar",
    color: "#00D4FF",
    criteria: "6 meses de conta ativa",
    category: "fidelidade",
    rarity: "raro",
  },
  {
    key: "loyalty_1year",
    title: "1 Ano RIDDY",
    description: "Membro ativo há 1 ano na plataforma",
    context: "renter",
    icon: "CalendarCheck",
    color: "#FFD700",
    criteria: "1 ano de conta ativa",
    category: "fidelidade",
    rarity: "epico",
  },
  {
    key: "loyalty_2years",
    title: "2 Anos RIDDY",
    description: "Veterano da plataforma — 2 anos de fidelidade",
    context: "renter",
    icon: "Crown",
    color: "#A855F7",
    criteria: "2 anos de conta ativa",
    category: "fidelidade",
    rarity: "lendario",
  },
  {
    key: "host_loyalty_6months",
    title: "6 Meses Anfitrião",
    description: "Anfitrião ativo há 6 meses na plataforma",
    context: "host",
    icon: "Calendar",
    color: "#00D4FF",
    criteria: "6 meses como anfitrião ativo",
    category: "fidelidade",
    rarity: "raro",
  },
  {
    key: "host_loyalty_1year",
    title: "1 Ano Anfitrião",
    description: "Anfitrião ativo há 1 ano na plataforma",
    context: "host",
    icon: "CalendarCheck",
    color: "#FFD700",
    criteria: "1 ano como anfitrião ativo",
    category: "fidelidade",
    rarity: "epico",
  },
  {
    key: "host_loyalty_2years",
    title: "2 Anos Anfitrião",
    description: "Veterano da plataforma — 2 anos como anfitrião",
    context: "host",
    icon: "Crown",
    color: "#A855F7",
    criteria: "2 anos como anfitrião ativo",
    category: "fidelidade",
    rarity: "lendario",
  },

  // ─── ESPECIAIS ────────────────────────────────────────────────────────────
  {
    key: "founding_member",
    title: "Membro Fundador",
    description: "Faz parte dos primeiros membros da RIDDY",
    context: "renter",
    icon: "Gem",
    color: "#A855F7",
    criteria: "Conta criada nos primeiros 90 dias",
    category: "especiais",
    rarity: "lendario",
  },
  {
    key: "early_adopter",
    title: "Early Adopter",
    description: "Adotou a RIDDY antes de todo mundo",
    context: "renter",
    icon: "Zap",
    color: "#FFD700",
    criteria: "Conta criada nos primeiros 180 dias",
    category: "especiais",
    rarity: "epico",
  },
  {
    key: "top_region",
    title: "Top da Região",
    description: "Está entre os top 10% da sua cidade",
    context: "renter",
    icon: "MapPin",
    color: "#FF6B35",
    criteria: "Top 10% da cidade por score",
    category: "especiais",
    rarity: "epico",
  },
  {
    key: "top_brazil",
    title: "Top do Brasil",
    description: "Está entre os top 1% da plataforma nacional",
    context: "renter",
    icon: "Globe",
    color: "#A855F7",
    criteria: "Top 1% nacional por score",
    category: "especiais",
    rarity: "lendario",
  },
  {
    key: "host_top_region",
    title: "Top Anfitrião da Região",
    description: "Está entre os top 10% anfitriões da sua cidade",
    context: "host",
    icon: "MapPin",
    color: "#FF6B35",
    criteria: "Top 10% anfitriões da cidade",
    category: "especiais",
    rarity: "epico",
  },
  {
    key: "host_top_brazil",
    title: "Top Anfitrião do Brasil",
    description: "Está entre os top 1% anfitriões da plataforma",
    context: "host",
    icon: "Globe",
    color: "#A855F7",
    criteria: "Top 1% anfitriões nacional",
    category: "especiais",
    rarity: "lendario",
  },
];

// ─── SCORE RIDDY ─────────────────────────────────────────────────────────────

/**
 * Pesos do Score Riddy para locatários.
 * Score máximo: 1000 pontos.
 */
export const RENTER_SCORE_WEIGHTS = {
  // Positivos
  completedRentals: 8,      // por locação concluída (max 400)
  avgRating: 100,           // multiplicador da nota média (4.9 * 100 = 490)
  accountAgeDays: 0.1,      // por dia de conta (max 100)
  verifiedProfile: 50,      // perfil verificado (KYC aprovado)
  totalKm: 0.02,            // por km rodado (max 100)
  // Negativos
  cancellation: -30,        // por cancelamento
  lateReturn: -20,          // por devolução atrasada
  dispute: -50,             // por disputa aberta
  report: -80,              // por denúncia
} as const;

/**
 * Pesos do Score Riddy para anfitriões.
 * Score máximo: 1000 pontos.
 */
export const HOST_SCORE_WEIGHTS = {
  // Positivos
  completedRentals: 6,      // por locação concluída (max 300)
  avgRating: 120,           // multiplicador da nota média (4.9 * 120 = 588)
  responseTime: 40,         // resposta rápida (< 1h = 40, < 4h = 20, < 12h = 10)
  acceptanceRate: 50,       // taxa de aceitação alta (> 90% = 50)
  calendarAvailability: 30, // calendário bem preenchido
  verifiedProfile: 50,      // perfil completo e verificado
  // Negativos
  cancellation: -40,        // por cancelamento
  complaint: -60,           // por reclamação formal
  report: -100,             // por denúncia
  lowResponseRate: -30,     // taxa de resposta < 70%
} as const;

/**
 * Calcula o Score Riddy de um locatário (0-1000).
 */
export function calculateRenterScore(params: {
  totalRentals: number;
  avgRating: number;
  accountAgeDays: number;
  isVerified: boolean;
  totalKm: number;
  cancellations: number;
  lateReturns: number;
  disputes: number;
  reports: number;
}): number {
  const { totalRentals, avgRating, accountAgeDays, isVerified, totalKm,
    cancellations, lateReturns, disputes, reports } = params;

  let score = 0;

  // Positivos
  score += Math.min(totalRentals * RENTER_SCORE_WEIGHTS.completedRentals, 400);
  score += Math.min(avgRating * RENTER_SCORE_WEIGHTS.avgRating, 490);
  score += Math.min(accountAgeDays * RENTER_SCORE_WEIGHTS.accountAgeDays, 100);
  if (isVerified) score += RENTER_SCORE_WEIGHTS.verifiedProfile;
  score += Math.min(totalKm * RENTER_SCORE_WEIGHTS.totalKm, 100);

  // Negativos
  score += cancellations * RENTER_SCORE_WEIGHTS.cancellation;
  score += lateReturns * RENTER_SCORE_WEIGHTS.lateReturn;
  score += disputes * RENTER_SCORE_WEIGHTS.dispute;
  score += reports * RENTER_SCORE_WEIGHTS.report;

  return Math.max(0, Math.min(1000, Math.round(score)));
}

/**
 * Calcula o Score Riddy de um anfitrião (0-1000).
 */
export function calculateHostScore(params: {
  totalRentals: number;
  avgRating: number;
  avgResponseHours: number | null;
  isVerified: boolean;
  cancellations: number;
  complaints: number;
  reports: number;
}): number {
  const { totalRentals, avgRating, avgResponseHours, isVerified,
    cancellations, complaints, reports } = params;

  let score = 0;

  // Positivos
  score += Math.min(totalRentals * HOST_SCORE_WEIGHTS.completedRentals, 300);
  score += Math.min(avgRating * HOST_SCORE_WEIGHTS.avgRating, 588);

  // Tempo de resposta
  if (avgResponseHours !== null) {
    if (avgResponseHours <= 1) score += HOST_SCORE_WEIGHTS.responseTime;
    else if (avgResponseHours <= 4) score += 20;
    else if (avgResponseHours <= 12) score += 10;
  }

  if (isVerified) score += HOST_SCORE_WEIGHTS.verifiedProfile;

  // Negativos
  score += cancellations * HOST_SCORE_WEIGHTS.cancellation;
  score += complaints * HOST_SCORE_WEIGHTS.complaint;
  score += reports * HOST_SCORE_WEIGHTS.report;

  return Math.max(0, Math.min(1000, Math.round(score)));
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getRiderLevelConfig(level: number): RiderLevelConfig {
  return RIDER_LEVELS[Math.min(Math.max(level, 1), 5) - 1];
}

export function getHostLevelConfig(level: number): HostLevelConfig {
  return HOST_LEVELS[Math.min(Math.max(level, 1), 5) - 1];
}

/**
 * Determina o nível do locatário baseado no score e número de locações.
 * Ambos os critérios devem ser atendidos.
 */
export function calculateRiderLevel(totalRentals: number, avgRating: number, score?: number): number {
  const effectiveScore = score ?? 0;
  for (let i = RIDER_LEVELS.length - 1; i >= 0; i--) {
    const cfg = RIDER_LEVELS[i];
    const meetsRentals = totalRentals >= cfg.minRentals;
    const meetsRating = cfg.minRating === 0 || avgRating >= cfg.minRating;
    const meetsScore = effectiveScore >= cfg.minScore;
    if (meetsRentals && meetsRating && meetsScore) {
      return cfg.level;
    }
  }
  return 1;
}

/**
 * Determina o nível do anfitrião baseado no score e critérios.
 */
export function calculateHostLevel(
  totalRentals: number,
  avgRating: number,
  cancellationRate: number,
  avgResponseHours: number | null,
  score?: number
): number {
  const effectiveScore = score ?? 0;
  for (let i = HOST_LEVELS.length - 1; i >= 0; i--) {
    const cfg = HOST_LEVELS[i];
    const meetsRentals = totalRentals >= cfg.minRentals;
    const meetsRating = cfg.minRating === 0 || avgRating >= cfg.minRating;
    const meetsCancellation = cancellationRate <= cfg.maxCancellationRate;
    const meetsResponse =
      cfg.maxResponseHours === null ||
      avgResponseHours === null ||
      avgResponseHours <= cfg.maxResponseHours;
    const meetsScore = effectiveScore >= cfg.minScore;
    if (meetsRentals && meetsRating && meetsCancellation && meetsResponse && meetsScore) {
      return cfg.level;
    }
  }
  return 1;
}

/** Retorna o progresso percentual (0–100) para o próximo nível */
export function getRiderProgress(totalRentals: number, avgRating: number, score?: number): {
  currentLevel: number;
  nextLevel: number | null;
  progressPercent: number;
  rentalsToNext: number | null;
  scoreToNext: number | null;
} {
  const currentLevel = calculateRiderLevel(totalRentals, avgRating, score);
  if (currentLevel === 5) {
    return { currentLevel, nextLevel: null, progressPercent: 100, rentalsToNext: null, scoreToNext: null };
  }
  const nextCfg = RIDER_LEVELS[currentLevel]; // índice = level (0-based)
  const currentCfg = RIDER_LEVELS[currentLevel - 1];
  const rentalsToNext = Math.max(0, nextCfg.minRentals - totalRentals);
  const scoreToNext = score !== undefined ? Math.max(0, nextCfg.minScore - score) : null;
  const range = nextCfg.minRentals - currentCfg.minRentals;
  const done = totalRentals - currentCfg.minRentals;
  const progressPercent = range > 0 ? Math.min(100, Math.round((done / range) * 100)) : 100;
  return { currentLevel, nextLevel: currentLevel + 1, progressPercent, rentalsToNext, scoreToNext };
}

export function getHostProgress(totalRentals: number, avgRating: number, cancellationRate: number, avgResponseHours: number | null, score?: number): {
  currentLevel: number;
  nextLevel: number | null;
  progressPercent: number;
  rentalsToNext: number | null;
  scoreToNext: number | null;
} {
  const currentLevel = calculateHostLevel(totalRentals, avgRating, cancellationRate, avgResponseHours, score);
  if (currentLevel === 5) {
    return { currentLevel, nextLevel: null, progressPercent: 100, rentalsToNext: null, scoreToNext: null };
  }
  const nextCfg = HOST_LEVELS[currentLevel];
  const currentCfg = HOST_LEVELS[currentLevel - 1];
  const rentalsToNext = Math.max(0, nextCfg.minRentals - totalRentals);
  const scoreToNext = score !== undefined ? Math.max(0, nextCfg.minScore - score) : null;
  const range = nextCfg.minRentals - currentCfg.minRentals;
  const done = totalRentals - currentCfg.minRentals;
  const progressPercent = range > 0 ? Math.min(100, Math.round((done / range) * 100)) : 100;
  return { currentLevel, nextLevel: currentLevel + 1, progressPercent, rentalsToNext, scoreToNext };
}

/**
 * Gera mensagem de social proof baseada no ranking do usuário.
 */
export function getSocialProofMessage(params: {
  context: "renter" | "host";
  rankCity?: number | null;
  rankState?: number | null;
  rankNational?: number | null;
  totalUsersCity?: number;
  totalUsersNational?: number;
  currentLevel?: number;
  nextLevel?: number | null;
  scoreToNext?: number | null;
}): string | null {
  const { context, rankCity, rankNational, totalUsersCity, totalUsersNational,
    currentLevel, nextLevel, scoreToNext } = params;

  const role = context === "renter" ? "locatário" : "anfitrião";

  // Top 1% nacional
  if (rankNational && totalUsersNational && rankNational <= Math.ceil(totalUsersNational * 0.01)) {
    return `🏆 Você está entre os top 1% ${role}s do Brasil!`;
  }

  // Top 5% nacional
  if (rankNational && totalUsersNational && rankNational <= Math.ceil(totalUsersNational * 0.05)) {
    return `⭐ Você está entre os top 5% ${role}s do Brasil.`;
  }

  // Top 10% da cidade
  if (rankCity && totalUsersCity && rankCity <= Math.ceil(totalUsersCity * 0.10)) {
    return `📍 Você está entre os top 10% ${role}s da sua cidade!`;
  }

  // Próximo nível
  if (nextLevel && scoreToNext && scoreToNext <= 50) {
    return `🚀 Você está a apenas ${scoreToNext} pontos do nível ${RIDER_LEVELS[nextLevel - 1]?.name ?? nextLevel}!`;
  }

  // Nível 5
  if (currentLevel === 5) {
    return `👑 Você atingiu o status máximo da plataforma!`;
  }

  return null;
}
