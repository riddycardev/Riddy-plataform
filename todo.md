# RIDDY - Project TODO

## Fase 1: Upgrade para Full-Stack
- [x] Executar webdev_add_feature para adicionar backend, database e autenticação
- [x] Configurar estrutura de banco de dados (MySQL/TiDB)
- [x] Criar schemas para usuários, veículos, reservas, documentos, pagamentos

## Fase 2: Sistema de Autenticação com KYC
- [x] Implementar login/cadastro com Manus OAuth
- [x] Criar fluxo de verificação de identidade (KYC) - schema e routers
- [x] Integrar reconhecimento facial para validação - schema pronto
- [x] Verificação de CNH com OCR - schema pronto
- [x] Sistema de níveis de verificação (básico, verificado, premium)

## Fase 3: Gestão de Documentos
- [x] Upload e validação de CNH (frente e verso)
- [x] Upload de documento de identidade (RG/CPF)
- [x] Comprovante de residência
- [x] Selfie para reconhecimento facial
- [x] Status de aprovação de documentos

## Fase 4: Sistema de Reservas com Quilometragem
- [x] Fluxo completo de reserva (busca → seleção → checkout)
- [x] Cálculo de preços dinâmico
- [x] Limite de quilômetros por dia (configurável pelo proprietário)
- [x] Cálculo de km adicional (R$/km excedente)
- [x] Registro de km inicial e final da viagem
- [x] Validação com fotos do odômetro

## Fase 5: Pagamentos e Multas
- [x] Integração com Mercado Pago (cartão de crédito, PIX)
- [x] Caução/depósito de segurança
- [x] Split de pagamentos (plataforma + proprietário)
- [x] Histórico de transações
- [x] Reembolsos automáticos
- [x] Multas por atraso na devolução

## Fase 6: Checkout Transparente Mercado Pago
- [x] Pagamento com cartão de crédito (tokenização via SDK MP)
- [x] Pagamento com PIX (QR Code nativo)
- [x] Seletor de parcelas com juros reais
- [x] Webhook de confirmação de pagamento
- [x] Cancelamento com reembolso automático

## Fase 7: Novo Fluxo de Locação (Entrada Simples + Verificação Pós-Pagamento)
- [x] Simplificar BookingFlow: 3 steps (dados → pagamento → confirmação)
- [x] Adicionar campos: nome, CPF, e-mail, telefone no step 1
- [x] Verificação de identidade pós-pagamento (CNH + selfie via câmera)
- [x] Painel admin de verificação (aprovar/rejeitar com motivo)
- [x] Reenvio de documentos em caso de rejeição

## Fase 8: Política de Privacidade (LGPD)
- [x] Escrever Política de Privacidade completa e adaptada à LGPD
- [x] Criar página /privacy no frontend
- [x] Adicionar link de Privacidade no footer
- [x] Incluir seções: dados coletados, finalidades, compartilhamento, direitos, segurança

## Fase 9: Expansão para Motos (Fluxo Completo)

### Etapa 1: Preparação do Banco de Dados
- [x] Adicionar coluna `vehicle_type` (enum: 'car', 'motorcycle') na tabela vehicles
- [x] Criar tabela `motorcycle_specs` com campos:
  - cilindrada (125cc, 250cc, 600cc, 1200cc+)
  - tipo_moto (street, sport, naked, cruiser, adventure, scooter)
  - combustivel (gasolina, eletrica)
  - cambio (manual, automatico, cvt)
  - capacete_disponivel (boolean)
  - taxa_capacete (decimal, configurável pelo proprietário)
  - limite_km_diario (integer, mínimo 100, configurável)
- [x] Atualizar relacionamentos: vehicles → motorcycle_specs (1:1)
- [x] Adicionar campos na tabela vehicles:
  - motorcycle_id (FK para motorcycle_specs, nullable)

### Etapa 2: Backend - Procedures tRPC
- [x] Criar procedure `motorcycle.create` (cadastro com validações)
- [x] Criar procedure `motorcycle.getById` (buscar com specs)
- [x] Criar procedure `motorcycle.list` (listar com filtros: cilindrada, tipo, combustível)
- [x] Criar procedure `motorcycle.update` (editar dados)
- [x] Criar procedure `motorcycle.delete` (remover)
- [x] Criar procedure `motorcycle.search` (busca avançada: localização, preço, cilindrada, disponibilidade)
- [x] Atualizar procedure `vehicle.search` para retornar tipo de veículo
- [x] Criar database helpers para motorcycle_specs (create, get, update, delete, search)

### Etapa 3: Página de Cadastro de Motos (Frontend)
- [x] Criar página `/add-motorcycle` com formulário multi-etapas
- [x] Campos de moto: cilindrada, tipo, combustível, câmbio
- [x] Capacete disponível? (toggle) + taxa configurável pelo proprietário
- [x] Limite de km/dia (mínimo 100, configurável)
- [x] Upload de fotos e CRLV
- [x] Validação completa de todos os campos

### Etapa 4: Página de Listagem de Motos (Frontend)
- [x] Criar página `/motorcycles` com grid de cards
- [x] Filtros: cilindrada, tipo, combustível, preço, localização
- [x] Cards com foto, specs, preço, badge "Capacete Incluído"
- [x] Página de detalhes `/motorcycles/:id` com galeria, specs, calendário e botão Alugar

### Etapa 5: Navegação Principal (Frontend)
- [x] Header desktop: links "Carros" e "Motos" com ícones
- [x] Header mobile: Carros e Motos no menu mobile
- [x] Footer: links para /search e /motorcycles

### Etapa 6: Fluxo de Booking para Motos (Frontend)
- [x] BookingFlow detecta vehicleType e exibe ícone de moto no resumo
- [x] Aviso de CNH categoria A/AB no checkout de motos
- [x] Página de detalhes da moto com aviso CNH e opção de capacete

### Etapa 7: Calculadora Inteligente com Motos
- [ ] Atualizar componente de cálculo de preço para incluir:
  - Preço base/dia (conforme cilindrada, geralmente menor que carros)
  - Taxa de capacete (se selecionado)
  - Cálculo de km adicional (se exceder limite)
  - Caução/depósito de segurança
  - Taxa de plataforma (%)
  - Total final
- [ ] Mostrar breakdown detalhado:
  - "Aluguel: R$ X"
  - "Capacete: R$ X"
  - "Km adicional: R$ X"
  - "Taxa de plataforma: R$ X"
  - "TOTAL: R$ X"
- [ ] Atualizar em tempo real conforme usuário muda datas/km

### Etapa 8: Host Dashboard - Gestão de Motos
- [x] Seção "Minha Frota" com Carros e Motos separados
- [x] Botões "Adicionar Carro" e "Adicionar Moto" no dashboard
- [x] Cards de moto com ícone Bike, cor cyan, botões Ver/Editar/Deletar
- [x] Estado vazio para motos com CTA para cadastrar primeira moto

### Etapa 9: Admin Dashboard - Moderação de Motos
- [ ] Criar aba "Motos Pendentes de Aprovação"
- [ ] Listar motos aguardando aprovação com:
  - Proprietário
  - Cilindrada
  - Fotos
  - Specs
- [ ] Botões: Aprovar / Rejeitar (com campo de motivo)
- [ ] Notificação automática ao proprietário quando aprovada/rejeitada
- [ ] Filtro por status: Pendente / Aprovada / Rejeitada

### Etapa 10: Testes e Refinamento
- [ ] Testar fluxo completo de cadastro de moto
- [ ] Testar busca e filtros de motos
- [ ] Testar booking de moto com validação de CNH
- [ ] Testar calculadora inteligente com motos
- [ ] Testar host dashboard com motos
- [ ] Testar admin dashboard com motos
- [ ] Validar responsividade em mobile
- [ ] Testar performance com 100+ motos
- [ ] Testar proprietário com carros E motos

### Etapa 11: Publicação e Monitoramento
- [ ] Criar checkpoint com feature de motos
- [ ] Publicar versão com suporte a motos
- [ ] Monitorar métricas: aluguéis de motos vs carros
- [ ] Coletar feedback de usuários
- [ ] Planejar melhorias futuras (scooters, bicicletas, rastreamento GPS)

## Fase 10: Refatoração Arquitetural — Separação Completa Carros/Motos

- [x] Home: seletor de categoria Carros/Motos com hero sections distintas (removido seletor, criadas duas páginas separadas)
- [x] Home: busca de carros direciona para /cars, busca de motos para /motorcycles
- [x] Criar rota /cars (renomear /search para /cars, manter /search como alias)
- [x] /cars: filtros exclusivos (categoria, câmbio, combustível, assentos, preço)
- [x] /motorcycles: filtros exclusivos (cilindrada, tipo, combustível, câmbio, preço)
- [x] Backend: adicionar vehicleType em vehicle.search procedure
- [x] Backend: searchVehicles sempre filtra por vehicleType quando fornecido
- [x] Backend: getVehicles (homepage) filtra apenas carros por padrão
- [x] Header: navegação com Carros → /cars e Motos → /motorcycles
- [x] Isolamento total: nenhuma moto aparece em /cars e vice-versa

## Fase 11: Refatoração de Homepages — Duas Páginas Distintas

- [x] Criar HomeMotorcycles.tsx com tema orange/black
- [x] Refatorar Home.tsx para ser exclusivamente de carros (tema cyan/blue)
- [x] Adicionar rota /motos-home para HomeMotorcycles
- [x] Atualizar Header para links: Carros → / e Motos → /motos-home
- [x] Remover seletor de categoria do header
- [x] Testar navegação entre as duas homepages
- [x] Verificar isolamento completo: nenhuma moto na homepage de carros

## Fase 12: Refatoração de Homepages — Modelo de Abas (Revisão)

- [x] Reverter separação em duas páginas (/motos-home removida)
- [x] Criar componente Home.tsx com seletor de abas (Carros | Motos)
- [x] Implementar estado de categoria ativa (carros/motos)
- [x] Renderizar HeroSection com tema dinâmico (cyan para carros, orange para motos)
- [x] Renderizar filtros específicos por categoria
- [x] Renderizar FeaturedCarsSection ou FeaturedMotorcyclesSection conforme aba
- [x] Testar alternância de abas sem recarregar página
- [x] Atualizar Header para links: Carros → / e Motos → /
- [x] Remover rota /motos-home de App.tsx
- [x] Remover arquivo HomeMotorcycles.tsx
- [x] Testar isolamento: nenhuma moto em aba de carros e vice-versa

## Fase 13: Refatoração de Conteúdo — Seletor Acima do Hero + Seções Específicas por Categoria

- [x] Mover seletor de abas para acima do HeroSection (não sticky)
- [x] Criar HowItWorksMotorcyclesSection com processo específico de motos
- [x] Criar WhyRiddyMotorcyclesSection com benefícios específicos de motos
- [ ] Criar CalculadoraMotoSection.tsx (Calculadora Inteligente para motos)
- [x] Refatorar Home.tsx para renderizar seções diferentes por categoria
- [x] Aba de Motos: remover seções de carros, adicionar seções de motos
- [x] Aba de Carros: manter seções atuais voltadas para carros
- [x] Testar que aba de motos não mostra conteúdo de carros
- [x] Testar que aba de carros não mostra conteúdo de motos
- [x] Remover links "Carros" e "Motos" do Header
- [x] Validar alternancia de abas funcionando perfeitamente

## Fase 14: Corrigir Posição do Seletor de Abas

- [x] Criar seção CategorySelector.tsx com botões Carros/Motos
- [x] Posicionar seletor ACIMA do hero (antes do badge)
- [x] Adicionar border-bottom para separação visual
- [x] Garantir que botões sejam clicáveis e visíveis
- [x] Testar alternância de abas
- [x] Validar que seletor não fica escondido atrás de nada
- [x] Adicionar pt-20/sm:pt-24 ao main para dar espaço do header fixo
- [x] Adicionar sticky top-20/sm:top-24 z-40 ao seletor
- [x] Validar isolamento completo: nenhuma moto em aba de carros

## Fase 15: Calculadora de Ganhos para Proprietários de Motos

- [x] Criar CalculadoraMotoSection.tsx com seletor de cilindradas
- [x] Implementar preços variáveis por cilindrada (125, 150, 160, 300, 600, 1000, 1200cc)
- [x] Adicionar slider de dias (5-25 dias por mês)
- [x] Implementar lógica de cálculo: dias × preço = ganho mensal
- [x] Adicionar CalculadoraMotoSection na aba de motos (mesma posição de carros)
- [x] Testar cálculos com diferentes cilindradas (125cc, 600cc, 1200cc)
- [x] Validar que aparece APENAS na aba de motos
- [x] Validar cálculos: 125cc R$80/dia, 600cc R$180/dia, 1200cc R$300/dia

## Fase 16: Sistema de Busca com Datas e Mapa para Motos

- [x] Adicionar seletor de datas (Data início + Data fim) na aba de motos
- [x] Integrar busca de motos com todas as cidades do banco
- [x] Criar rota /motorcycles para exibir resultados com mapa
- [x] Testar fluxo completo: busca com datas → mapa com motos
- [x] Validar que motos aparecem no mapa com informações corretas

## Fase 17: Corrigir Autocomplete de Cidades na Busca Principal

- [x] Verificar componente de busca em HeroSection
- [x] Implementar dropdown com lista de cidades
- [x] Mostrar cidades quando usuário digita (filtro em tempo real)
- [x] Aplicar mesmo autocomplete em HeroMotorcycles
- [x] Testar autocomplete em ambas as abas (Carros e Motos)
- [x] Validar que cidades aparecem ao digitar
- [x] Corrigir propriedade de cidades: c.name → c.label

## Fase 19: Fluxo de Verificação Documental da Reserva

- [x] Backend: listAllVerifications inclui dados do veículo (brand, model, year, plate, city) e locatário (name, email, phone, cpf)
- [x] Admin painel: painel de detalhes da verificação exibe veículo, locatário, dados da reserva e data/hora de envio
- [x] Backend: bloqueio de check-in (recordMileage start) quando verificationStatus !== "approved"
- [x] Frontend: IdentityVerification já implementado com câmera, upload CNH + selfie, estados pending/approved/rejected
- [x] Backend: submit de documentos atualiza verificationStatus para "pending_review" automaticamente
- [x] Backend: adminApprove atualiza verificationStatus="approved" e booking.status="confirmed"
- [x] Backend: adminReject atualiza verificationStatus="rejected" e permite reenvio pelo usuário

## Fase 20: Aba de Reservas no Painel Admin

- [x] Backend: procedure adminListBookings com dados completos (veículo, locatário, host, valores, documentos)
- [x] Admin painel: nova aba "Reservas" com lista paginada e filtros por status
- [x] Admin painel: painel de detalhes da reserva com veículo, locatário, valores, documentos e histórico
- [x] Admin painel: ações rápidas (confirmar, cancelar, alterar status)

## Fase 21: Integração de Mapa com Busca por Datas e Disponibilidade

- [x] Adicionar parâmetros startDate e endDate à função searchVehicles no backend
- [x] Implementar filtragem de veículos por datas disponíveis (excluindo bookings conflitantes)
- [x] Filtrar apenas bookings com status confirmed/in_progress/completed
- [x] Página /cars: mapa centraliza automaticamente na cidade buscada
- [x] Página /cars: marcadores mostram preço mínimo por cidade
- [x] Página /cars: apenas veículos disponíveis nas datas aparecem no mapa e lista
- [x] Criar testes unitários para filtragem por datas (11 testes passando)
- [x] Testar fluxo completo: busca com cidade + datas → mapa + lista de veículos disponíveis
- [x] Validar que veículos com bookings conflitantes não aparecem

## Fase 22: Corrigir Integração Mapa com Busca (Bugs)

- [x] Corrigir parâmetros de URL: home envia startDate/endDate mas Cars.tsx lê start/end
- [x] Corrigir normalização de cidade: "Porto Velho - RO" → "Porto Velho" para lookup no cityCoordinates
- [x] Corrigir handleMapReady: useEffect separado recentraliza mapa quando cidade muda
- [x] Garantir que mapa recentraliza quando cidade muda (não só na inicialização)
- [x] Aplicar mesma correção em Motorcycles.tsx
- [x] Testar fluxo completo: busca com cidade + datas → mapa centralizado + veículos disponíveis

## Fase 23: Layout Split — Lista ao Lado do Mapa em /cars e /motorcycles

- [x] Layout: h-screen com flex-col + overflow-hidden; lista (45%) com scroll independente + mapa (flex-1) fixo à direita
- [x] Header de busca e filtros com shrink-0 ficam acima do split, ocupando 100% da largura
- [x] MapView usa absolute inset-0 para preencher 100% da altura disponível
- [x] Em mobile (< lg): toggle mapa/lista mantido com hidden/lg:block correto
- [x] Aplicar mesmo layout em Motorcycles.tsx
- [x] Corrigir visibilidade do mapa: mostrar sempre em lg+, esconder apenas em mobile

## Fase 24: Corrigir Comportamento de Scroll — ScrollToTop Global

- [x] Criar componente ScrollToTop que observa pathname e executa window.scrollTo(0, 0)
- [x] Integrar ScrollToTop no App.tsx acima do Router (dentro do fragment <>)
- [x] Resetar scroll de containers internos com overflow (Cars.tsx, Motorcycles.tsx, etc)
- [x] Testar navegação entre páginas: Home → Cars → Motorcycles
- [x] Verificar que scroll reseta em containers com overflow-y-auto

## Fase 25: Sistema de Notificações e Recibos
- [x] Criar tabelas: receipts, emailLogs (notifications já existia)
- [x] Implementar helpers no db.ts: createReceipt, getUserReceipts, getReceiptById, logEmail, getEmailLogs
- [x] Criar receiptRouter com procedures: getReceipts, getReceipt, resendByEmail
- [x] notificationRouter já existia com: getMyNotifications, markAsRead, markAllAsRead
- [ ] Frontend: Componente NotificationCenter (lista de notificações)
- [ ] Frontend: Componente NotificationBell (ícone com contador)
- [ ] Frontend: Toast automático para eventos (booking, pagamento, cancelamento)
- [ ] Frontend: Página /receipts com lista de recibos
- [ ] Frontend: Componente ReceiptViewer (visualização do recibo)
- [ ] Frontend: Botão de download PDF para cada recibo
- [ ] Frontend: Botão de reenviar por email
- [ ] Backend: Criar notificações automaticamente em eventos (nova reserva, pagamento, cancelamento)
- [ ] Backend: Criar recibos automaticamente após pagamento confirmado
- [ ] Backend: Enviar emails de notificação e recibos


## Fase 26: Página de Recibos /receipts (com CUIDADO)
- [ ] Criar componente Receipts.tsx em client/src/pages/
- [ ] Implementar lista paginada de recibos (20 por página)
- [ ] Filtros: tipo (pagamento/cancelamento), data, status
- [ ] Componente ReceiptCard com resumo (data, valor, tipo, status)
- [ ] Componente ReceiptViewer para visualização detalhada
- [ ] Botão de download PDF para cada recibo
- [ ] Botão de reenviar por email
- [ ] Registrar rota /receipts em App.tsx
- [ ] Testar navegação e lista de recibos

## Fase 27: Centro de Notificações (com CUIDADO)
- [ ] Criar componente NotificationBell em Header (ícone + contador)
- [ ] Criar componente NotificationCenter (dropdown/modal com lista)
- [ ] Listar notificações com paginação
- [ ] Marcar notificação como lida (visual + backend)
- [ ] Marcar todas como lidas
- [ ] Excluir notificações
- [ ] Toast automático para notificações novas
- [ ] Testar integração com Header

## Fase 28: Automação de Eventos (com MUITO CUIDADO)
- [ ] Helper: createNotificationForBooking (nova reserva)
- [ ] Helper: createNotificationForPayment (pagamento confirmado)
- [ ] Helper: createNotificationForCancellation (reserva cancelada)
- [ ] Helper: createReceiptForPayment (recibo de pagamento)
- [ ] Helper: createReceiptForCancellation (recibo de cancelamento)
- [ ] Disparar notificações em bookingRouter.create
- [ ] Disparar notificações em paymentRouter.confirmPayment
- [ ] Disparar notificações em bookingRouter.cancel
- [ ] Testar fluxo: criar booking → ver notificação → ver recibo


## Fase 27: Email Templates com Branding RIDDY

- [ ] Criar arquivo server/email-templates.ts com templates HTML (booking, pagamento, cancelamento)
- [ ] Implementar função renderTemplate para substituir variáveis dinâmicas
- [ ] Integrar com email service (SendGrid ou similar)
- [ ] Criar procedure tRPC para enviar emails
- [ ] Automação: disparar email ao confirmar booking
- [ ] Automação: disparar email ao confirmar pagamento
- [ ] Automação: disparar email ao cancelar reserva
- [ ] Testar fluxo completo de emails

## Fase 28: Sistema Completo de Notificações Automáticas

### Etapa 1: Notificações de Pagamento (Mercado Pago)
- [x] Adicionar notificação `payment_received` quando pagamento Mercado Pago é confirmado
- [x] Adicionar notificação `payment_failed` quando pagamento Mercado Pago falha
- [x] Notificar locatário quando pagamento é confirmado
- [x] Notificar proprietário quando pagamento é recebido
- [x] Webhook do Mercado Pago com notificações integradas

### Etapa 2: Notificações de Cancelamento de Reserva
- [x] Adicionar notificação `booking_cancelled` quando reserva é cancelada pelo locatário
- [x] Notificar ambas as partes quando cancelamento ocorre
- [x] Incluir motivo do cancelamento na mensagem
- [x] Mostrar percentual de reembolso na notificação

### Etapa 3: Notificações de Mensagens
- [x] Adicionar notificação `message_received` quando nova mensagem é enviada
- [x] Notificar apenas o destinatário (não o remetente)
- [x] Incluir preview da mensagem na notificação
- [x] Notificações em ambas as funções (send e startConversation)

### Etapa 4: Feedback Visual (Loading State)
- [x] Adicionar loading state quando usuário clica em notificação
- [x] Mostrar ícone de carregamento (Loader2) durante navegação
- [x] Desabilitar botão durante navegação
- [x] Reduzir opacidade durante navegação
- [x] Testar feedback visual em diferentes tipos de notificação

### Etapa 5: Testes End-to-End
- [ ] Testar fluxo completo de pagamento com notificação
- [ ] Testar cancelamento com notificação para ambas as partes
- [ ] Testar mensagem com notificação
- [ ] Testar clique em notificação com navegação e loading state
- [ ] Testar múltiplas notificações simultâneas
- [ ] Validar que notificações aparecem no dropdown

### Etapa 6: Checkpoint e Entrega
- [ ] Criar checkpoint com todas as notificações implementadas
- [ ] Documentar tipos de notificação disponíveis
- [ ] Testar em produção
- [ ] Entregar ao usuário

## Fase 29: Chat Premium Stripe-Inspired (Mandamento)

### Etapa 1: Análise e Planejamento
- [x] Analisar estrutura atual do Messages.tsx
- [x] Mapear procedures tRPC existentes (getConversations, getMessages, send)
- [x] Planejar design system (navy/slate/grafite + blue accents)

### Etapa 2: Redesign Visual Premium
- [x] Reescrever Messages.tsx com design Stripe-inspired
- [x] Sidebar com ConversationItem (avatar, nome, preview, timestamp)
- [x] ChatArea com MessageBubble (azul=usuário, grafite=host)
- [x] Mensagens do sistema com ícones e cores (verde=confirmado, vermelho=cancelado, azul=info)
- [x] MessageComposer elegante com input + botão Send + ícone Paperclip
- [x] TripDetailsPanel (coluna direita) com badge Pagamento Protegido + CTA Ver Reserva
- [x] Estado vazio premium (ícone + texto)
- [x] Responsivo: mobile (1 coluna), tablet (2 colunas), desktop (3 colunas)
- [x] Scroll automático para última mensagem
- [x] Polling a cada 5s (mensagens) e 10s (conversas)

### Etapa 3: Mensagens Automáticas do Sistema
- [x] Adicionar helper sendSystemMessage em db.ts
- [x] Adicionar helper getOrCreateConversationForBooking em db.ts
- [x] Mensagem automática quando booking é criado (pagamento pendente)
- [x] Mensagem automática quando PIX é confirmado
- [x] Mensagem automática quando reserva é aprovada/cancelada pelo host
- [x] Mensagem automática quando reserva é cancelada pelo locatário

### Etapa 4: Validação de Segurança (Frontend)
- [x] Detector de mensagens do sistema (SYSTEM_PATTERNS com regex)
- [x] Renderização diferenciada: sistema vs usuário vs host
- [x] Ícones contextuais por tipo de evento

### Etapa 5: Checkpoint e Entrega
- [ ] Criar checkpoint final
- [ ] Testar fluxo completo
- [ ] Entregar ao usuário

## Fase 30: Botão "Falar com Proprietário"

- [ ] Analisar página de detalhes do veículo (CarDetails.tsx ou similar)
- [ ] Verificar procedure startConversation existente no routers.ts
- [ ] Adicionar botão "Falar com Proprietário" na página de detalhes
- [ ] Ao clicar: criar ou recuperar conversa pré-reserva (listing_id)
- [ ] Redirecionar para /messages?conversationId=X após criar conversa
- [ ] Bloquear botão se usuário for o próprio proprietário
- [ ] Exigir login antes de iniciar conversa
- [ ] Testar fluxo completo: detalhe → chat → mensagem

## Fase 20: Chat Premium e Segurança

- [x] Testar botão "Falar com Proprietário" em VehicleDetails e MotorcycleDetails
- [x] Verificar redirecionamento correto para /messages?conversation={id}
- [x] Implementar validação de segurança no backend (procedure message.send):
  - Bloquear números de telefone (regex: \d[\d\s\-().]{8,}\d)
  - Bloquear endereços de email (regex: \S+@\S+\.\S+)
  - Bloquear links externos (regex: https?://|www.)
  - Bloquear contatos WhatsApp (regex: whatsapp|wpp|zap|+55|(XX))
- [x] Exibir toast de erro amigável quando mensagem é bloqueada (sonner)
- [x] Melhorar sistema de mensagens do sistema com badges visuais:
  - Badge colorido com label (SOLICITAÇÃO, PAGAMENTO, RESERVA, etc.)
  - Ícones contextuais por tipo de evento
  - Timestamp no canto superior direito
  - Cores distintas: âmbar (solicitação), verde (aprovado), vermelho (cancelado), azul (info)
- [x] Adicionar indicador de segurança abaixo do compositor de mensagens
- [x] Expandir padrões de detecção de mensagens do sistema (emoji-prefixed, PIX, etc.)


## Fase 21: Bug Fix - Especificações do Veículo

- [x] Diagnosticar erro React #185 ao selecionar especificações (ar condicionado, vidro elétrico, etc.)
- [x] Identificar causa: Checkbox sem handler `onCheckedChange` 
- [x] Adicionar `onCheckedChange={() => toggleFeature(feature.id)}` ao componente Checkbox
- [x] Remover `onClick` do container div (evitar duplicação de handlers)
- [x] Testar marcar/desmarcar especificações - funcionando perfeitamente
- [x] Validar múltiplas seleções simultâneas - OK
- [x] Testar toggle (marcar/desmarcar) - OK


## Fase 22: Customização Completa do Formulário de Cadastro de Motos

- [x] Atualizar lista de marcas de motos com 32 marcas populares (Premium + Brasil)
- [x] Adicionar marcas brasileiras: Bajaj, Hero, Mahindra, Piaggio, Vespa, Peugeot, Kymco, Sundown, Esmak, Malaguti, Italika, Zongshen
- [x] Melhorar placeholders de modelo: "Ex: CB 500F, MT-07, Street 750"
- [x] Melhorar placeholders de cor: "Ex: Preta, Vermelha, Prata, Azul"
- [x] Atualizar labels de features com descrições: "ABS (Sistema de Freios)", "Quickshifter", "GPS Integrado"
- [x] Validar que todas as especificações são 100% focadas em motos
- [x] Testar formulário completo: Dados da Moto → Especificações → Preço & Local → Fotos & Docs
- [x] Verificar que não há referências a carros no formulário de motos

## Fase 20: Plano de Correção Sistemática (12 Steps)

### STEP 1 — Fix Booking Creation Logic
- [x] Add overlap check: prevent double-booking for same vehicle and dates
- [x] Block host from booking their own vehicle
- [x] Validate vehicle status is "active" before creating booking
- [x] Remove console.log with sensitive booking data

### STEP 2 — Fix Broken Routes
- [x] Create ReviewPage.tsx with real 1-5 star rating form connected to trpc.review.create
- [x] Register /bookings/:id/review route in App.tsx
- [x] Remove orphan imports (SearchResults, Signup) from App.tsx

### STEP 3 — Fix Admin Approval/Rejection Logic
- [x] Fix reject button calling approveVehicleMutation instead of rejectVehicleMutation in AdminDashboardNew.tsx
- [x] Add rejection reason input dialog before rejecting a vehicle
- [x] Notify vehicle owner on approval and rejection via notifyOwner
- [x] Fix same bug in AdminVerificationPanel.tsx if present

### STEP 4 — Fix Auth & Protected Routes
- [x] Fix ProtectedRoute: redirect to /login?returnUrl=<path> instead of returning null
- [x] Add ProtectedRoute to /my-bookings, /bookings/:id, /booking/:vehicleId, /payments, /receipts, /profile, /documents, /messages
- [x] Login.tsx already reads ?returnUrl= param — standardized ProtectedRoute to use same param
- [x] Validate no blank screens remain for unauthenticated users on protected pages
- [x] Confirm role-based access (admin/host/user) still works correctly

### STEP 5 — Implement Real Document Upload
- [x] Audit current Documents.tsx to identify all fake logic
- [x] Create /api/upload/document Express endpoint with multer + S3 + database persistence
- [x] Implement S3 storage via storagePut for document files
- [x] Add file type validation (JPEG, PNG, WEBP, PDF only)
- [x] Add file size validation (max 10MB)
- [x] Return real states: uploading, success, error, failed
- [x] Associate documents with authenticated user (sdk.authenticateRequest)
- [x] Documents start with status: pending (never auto-approved)
- [x] Uploaded files retrievable via trpc.user.getDocuments
- [x] Remove all alert(), console.log() fake success patterns
- [x] Write 33 unit tests for document upload validation logic

### STEP 6 — Remove Fake OCR / Validation
- [ ] Audit AddVehicle.tsx for all setTimeout/fake OCR patterns
- [ ] Audit AddMotorcycle.tsx for all setTimeout/fake OCR patterns
- [ ] Remove all fake validation logic (setTimeout, forced success)
- [ ] Ensure document upload always sets status: pending
- [ ] Add OCR-ready fields to schema (extracted_data JSON column)
- [ ] Frontend shows real document status (pending/approved/rejected)
- [ ] User sees "Em análise" message after upload (no fake success)
- [ ] Write unit tests for document status lifecycle

### STEP 6 — Remove Fake OCR / Validation (COMPLETED)
- [x] Audit AddVehicle.tsx for all setTimeout/fake OCR patterns
- [x] Remove all fake validation logic (setTimeout, forced success)
- [x] Ensure document upload always sets status: pending
- [x] Frontend shows real document status (pending/approved/rejected)
- [x] User sees Em analise message after upload (no fake success)
- [x] Write unit tests for document status lifecycle (document.lifecycle.test.ts)

### STEP 7 — Remove Hardcoded Fake Data (COMPLETED)
- [x] Add getPlatformStats public endpoint (real DB counts)
- [x] Add getPublicReviews public endpoint (real reviews)
- [x] Update TestimonialsSection.tsx to use real reviews from DB
- [x] Update AppDownloadSection.tsx to use real platform stats
- [x] Update BrandSection.tsx to use real platform stats
- [x] Replace hardcoded 4.8/4.9 ratings with real averages
- [x] Write 11 unit tests for platform stats (platform.stats.test.ts)

### STEP 8 — Replace alert()/confirm() with Proper UI (COMPLETED)
- [x] Create reusable ConfirmDialog.tsx component
- [x] Replace window.confirm() in HostDashboardNew.tsx with ConfirmDialog
- [x] Replace alert()/confirm()/prompt() in AdminDashboard.tsx
- [x] Replace all alert() in VerificationQueue.tsx with toast
- [x] Replace all alert() in BookingFlow.tsx with toast
- [x] Replace confirm() in MyBookings.tsx with ConfirmDialog
- [x] Write 13 unit tests for UI dialog patterns (ui-dialogs.test.ts)

### STEP 9 — Fix Enum Mismatch: cilindradas (COMPLETED)
- [x] Expand cilindrada enum in drizzle/schema.ts from 4 to 18 values
- [x] Apply ALTER TABLE to expand enum in database
- [x] Write 9 unit tests for enum consistency (enum.consistency.test.ts)

### STEP 10 — Code Quality Cleanup (COMPLETED)
- [x] Remove all console.log with sensitive data
- [x] Remove dead code: Signup.tsx, SearchResults.tsx, HostDashboard.tsx (old)
- [x] Remove StripeCheckout.tsx orphan (never imported)
- [x] Fix LocationDetector.tsx: replace console.log with real navigation
- [x] Fix const.ts: remove orphaned console.log arguments
- [x] Write 13 unit tests for code quality (code.quality.test.ts)

### ETAPA 6 — Índices Secundários no Banco de Dados (COMPLETED)
- [x] Analisar queries frequentes em server/db.ts para mapear índices necessários
- [x] Adicionar 17 índices em 7 tabelas no schema Drizzle (drizzle/schema.ts)
  - user_documents: userId
  - vehicles: hostId, (status+pickupCity), vehicleType
  - bookings: renterId, hostId, (vehicleId+startDate+endDate), status
  - payments: userId, bookingId, stripeSessionId
  - conversations: participant1Id, participant2Id
  - messages: conversationId, (conversationId+isRead)
  - reviews: vehicleId, isPublic
- [x] Aplicar índices no banco via MySQL direto (pnpm db:push bloqueado por snapshot desatualizado)
- [x] Criar migration 0018_etapa6_indexes.sql e registrar no __drizzle_migrations
- [x] Sincronizar snapshots Drizzle (0017 e 0018) com estado real do banco
- [x] Verificar TypeScript sem erros (tsc --noEmit → 0 erros)
- [x] Escrever 51 testes automatizados (db.indexes.test.ts) — 51/51 passando

### ETAPA 7 — Auditoria de Autorização em Procedures tRPC (COMPLETED)
- [x] Auditar todos os routers tRPC (routers.ts + motorcycle.ts) para mapear falhas de ownership
- [x] Corrigir IDOR em user.markNotificationRead: adicionar markNotificationAsReadForUser com filtro AND(id, userId) no db.ts
- [x] Corrigir review.create: adicionar verificação de que o avaliador é renter ou host da reserva
- [x] Corrigir review.create: validar reviewType vs papel do usuário (renter/host)
- [x] Corrigir review.create: exigir booking.status === "completed" para avaliar
- [x] Confirmar ownership checks existentes: booking.getById, booking.updateStatus, vehicle.update, vehicle.deleteVehicle, vehicle.uploadImage, vehicle.deleteImage, vehicle.blockDates, message.getMessages, message.send, payment.processBookingPayment, payment.cancelWithRefund
- [x] Verificar TypeScript sem erros (tsc --noEmit → 0 erros)
- [x] Escrever 49 testes automatizados (authorization.test.ts) — 49/49 passando

### ETAPA 8 — Sanitização de Uploads (Magic Bytes) (COMPLETED)
- [x] Auditar 5 superfícies de ataque: /api/upload/document, user.uploadDocumentBase64, vehicle.uploadFile, vehicle.uploadImage, vehicle.create, motorcycle.create, booking.submitVerification
- [x] Criar módulo centralizado server/_core/uploadValidator.ts com magic bytes detection (JPEG, PNG, WEBP, PDF, GIF, HEIC)
- [x] Implementar 5 contextos de upload com políticas de tamanho e MIME: user_document (10MB), vehicle_image (8MB), vehicle_document (10MB), verification_image (5MB), generic_file (10MB)
- [x] Integrar validateMulterFile em POST /api/upload/document (Express/multer)
- [x] Integrar validateBase64 em user.uploadDocumentBase64 (tRPC)
- [x] Integrar validateBase64 em vehicle.uploadFile (tRPC) — contentType do cliente cross-checado
- [x] Integrar validateBase64 em vehicle.uploadImage (tRPC) — antes de enviar ao Cloudinary
- [x] Integrar validateBase64 em vehicle.create CRLV + insurance (tRPC)
- [x] Integrar validateBase64 em motorcycle.create CRLV + seguro (tRPC)
- [x] Integrar validateBase64 em booking.submitVerification CNH + selfie (tRPC)
- [x] Usar safeExtension() para derivar extensão de arquivo do MIME verificado (nunca do cliente)
- [x] Verificar TypeScript sem erros (tsc --noEmit → 0 erros)
- [x] Escrever 62 testes automatizados (upload.validation.test.ts) — 62/62 passando

### ETAPA 9 — Rate Limiting Expandido (COMPLETED)
- [x] Auditar rate limiter existente e mapear endpoints sem proteção (search, payments, admin, webhooks)
- [x] Criar searchLimiter: 30 req/min — previne scraping do catálogo de veículos
- [x] Criar publicReadLimiter: 60 req/min — browsing legítimo, bloqueia bots
- [x] Criar paymentLimiter: 10 req/min — previne card testing e payment flooding
- [x] Criar adminLimiter: 60 req/min — previne enumeração do painel admin
- [x] Criar webhookLimiter: 100 req/min — DDoS protection para Stripe e Mercado Pago
- [x] Exportar helpers: getTrpcProcedure, getClientIp, trpcRateLimitHandler
- [x] Adicionar conjuntos de classificação: PAYMENT_PROCEDURES (7), SEARCH_PROCEDURES (2), PUBLIC_READ_PROCEDURES (13), ADMIN_PREFIXES
- [x] Expandir trpcAuthRateLimiter para rotear 5 categorias de procedure ao limiter correto
- [x] Aplicar webhookLimiter em /api/stripe e /api/mercadopago no index.ts
- [x] Todos os limiters têm skip: NODE_ENV=test para não bloquear testes
- [x] Verificar TypeScript sem erros (tsc --noEmit → 0 erros)
- [x] Escrever 31 testes automatizados (rate.limiting.test.ts) — 31/31 passando
### ETAPA 10 — Logs de Segurança (COMPLETED)
- [x] Criar tabela security_audit_logs no schema Drizzle com 5 índices (eventType, userId, ipAddress, createdAt, severity)
- [x] Aplicar migration diretamente no MySQL (CREATE TABLE security_audit_logs)
- [x] Criar módulo server/_core/securityLogger.ts com helpers: logSecurityEvent, logForbidden, logAuthFailure, logUploadRejected, logAdminAction
- [x] Padrão fire-and-forget: logging nunca bloqueia a request
- [x] Middleware tRPC onError em index.ts captura automaticamente todos os FORBIDDEN (severity: high) e UNAUTHORIZED (severity: medium)
- [x] documentUpload.router.ts: loga falhas de autenticação (AUTH_FAILURE) e rejeições de upload (UPLOAD_REJECTED)
- [x] auth.login: loga tentativas com credenciais inválidas (user not found, wrong password, oauth user)
- [x] vehicle.getOwnerDocuments: loga acesso não autorizado com resourceType/resourceId
- [x] Procedures admin.getSecurityLogs (filtros: eventType, severity, userId, ipAddress, datas, paginação) e admin.getSecurityStats
- [x] Helpers db.getSecurityLogs e db.getSecurityStats exportados de server/db.ts
- [x] Verificar TypeScript sem erros (tsc --noEmit → 0 erros)
- [x] Escrever 49 testes automatizados (security.logging.test.ts) — 49/49 passando

### ETAPA 12 — Validação de Placa Veicular Brasileira (COMPLETED)
- [x] Criar módulo shared/licensePlate.ts com regex MERCOSUL (ABC1D23) e antigo (ABC1234/ABC-1234)
- [x] Funções: isValidBrazilianPlate, normalizePlate, detectPlateFormat, INVALID_PLATE_MESSAGE
- [x] Backend: vehicle.create, vehicle.update — Zod .refine(isValidBrazilianPlate) + normalizePlate antes do DB insert
- [x] Backend: motorcycle.create, motorcycle.update — mesma validação
- [x] Frontend AddVehicle.tsx: estado plateError, feedback visual em tempo real (borda verde/vermelha + ícone CheckCircle/XCircle)
- [x] Frontend AddMotorcycle.tsx: mesma integração visual
- [x] Frontend EditVehicle.tsx: mesma integração visual
- [x] Verificar TypeScript sem erros (tsc --noEmit → 0 erros)
- [x] Escrever 37 testes automatizados (license.plate.test.ts) — 37/37 passando

### ETAPA 13 — Proteção CSRF (Cross-Site Request Forgery) (COMPLETED)
- [x] Módulo server/_core/csrf.ts com Double Submit Cookie (HMAC-SHA256, TTL 4h)
- [x] Funções: generateCsrfToken, isValidCsrfToken, csrfTokenHandler, csrfMiddleware
- [x] Rota GET /api/csrf-token registrada no Express (index.ts)
- [x] csrfMiddleware aplicado em 7 procedures sensíveis: booking.create, payment.cancelWithRefund, payment.processMPCreditCard, payment.processMPPix, payment.processBookingPayment, vehicle.deleteVehicle, admin.deleteUser
- [x] Hook client/src/hooks/useCsrf.ts criado para uso no frontend
- [x] Injeção global do token CSRF via httpBatchLink headers em main.tsx
- [x] Verificar TypeScript sem erros (tsc --noEmit → 0 erros)
- [x] Escrever 34 testes automatizados (csrf.protection.test.ts) — 34/34 passando

### Correção Fluxo de Pagamento MP (COMPLETED)
- [x] Parcelamento: 1x e 2x sem juros; 3x-12x com juros compostos do MP (~2.99% a.m.) no fallback; API real do MP usada quando disponível
- [x] Fluxo host approval: booking.create → pending_host_approval → host aprova → pending_payment → locatário paga
- [x] Novas procedures: booking.approveForPayment e booking.rejectBooking
- [x] Dashboard host: filtro pending_host_approval, botões Aprovar/Rejeitar com mutations corretas
- [x] Notificação ao host quando nova reserva aguarda aprovação (booking_request)
- [x] Notificação ao locatário quando host aprova (booking_confirmed) ou rejeita (booking_cancelled)
- [x] MyBookings.tsx: badges para pending_host_approval e pending_payment; botão "Realizar Pagamento"
- [x] Verificar TypeScript sem erros (0 erros confirmados)

### Correção Bug Pagamento in_process + Dashboard Host (COMPLETED)
- [x] Investigar: pagamentos do amigo falhando — 7 tentativas com status "failed" na tabela payments
- [x] Root cause: MP retornava in_process/pending (análise antifraude) mas código marcava como "failed" e mudava reserva para "payment_failed"
- [x] Fix processMPCreditCard: in_process/pending → payment record "processing", reserva permanece em pending_payment
- [x] Fix frontend BookingFlow.tsx: isProcessing → mostrar tela de sucesso com toast "em análise"
- [x] Fix MyBookings.tsx: badge "Pagamento recusado" para payment_failed; incluir no filtro de reservas ativas
- [x] Fix HostDashboardNew.tsx: adicionar seção "Todas as Reservas" com todos os status visíveis
- [x] TypeScript: 0 erros confirmados

### 3DS 2.0 + Webhook MP (Em andamento)
- [ ] 3DS: backend desabilita binary_mode e retorna three_ds_info.external_resource_url quando status=pending
- [ ] 3DS: frontend abre modal com iframe para URL de desafio do banco
- [ ] 3DS: após autenticação, webhook confirma automaticamente
- [ ] Webhook MP: endpoint /api/mercadopago/webhook processa payment.updated e atualiza status da reserva
- [ ] Webhook MP: registrar URL no painel do MP
- [ ] Verificar TypeScript sem erros

### Suporte a Cartão de Terceiro (COMPLETED)
- [x] Adicionar checkbox "Estou pagando com cartão de outra pessoa" no formulário de pagamento
- [x] Adicionar campo CPF do titular do cartão (exibido apenas quando checkbox marcado)
- [x] Usar CPF do titular na tokenização do cartão (MP SDK) e no payer do backend
- [x] Validação: exigir CPF do titular quando cartão de terceiro está marcado
- [x] Verificar TypeScript sem erros (0 erros confirmados)

### Correção Pagamento Travado em "Processando"
- [ ] Investigar fluxo in_process: frontend fica travado, nunca mostra resultado
- [ ] Corrigir: após in_process, mostrar tela "Pagamento em análise" com polling automático
- [ ] Garantir que webhook MP confirma/rejeita e atualiza status da reserva
- [ ] Verificar TypeScript sem erros

### Checkout Pro MP como Alternativa (Em andamento)
- [ ] Criar procedure createMPCheckoutPro no backend para gerar preferência MP com dados da reserva
- [ ] Adicionar botão "Pagar com Mercado Pago" no BookingFlow (na tela de erro e como opção alternativa)
- [ ] Webhook MP já existente confirma pagamentos do Checkout Pro automaticamente
- [ ] Verificar TypeScript sem erros

## Auditoria Completa do Fluxo de Pagamento MP (Apr 17)
- [x] Separar fluxo de criação de reserva do fluxo de pagamento
- [x] /booking/:vehicleId cria reserva e redireciona para My Bookings (aguarda aprovação do host)
- [x] /pay/:bookingId inicia no step 2 (formulário de pagamento) em vez do step 3
- [x] Botão "Confirmar e Pagar" aparece corretamente no step 2 quando existingBookingId está definido
- [x] Pré-preenchimento de CPF e dados pessoais do existingBooking no formulário
- [x] handleBack no /pay/:bookingId redireciona para My Bookings
- [x] Fallback card "Pagamento em Processamento" só aparece com bookingId real (sem #RDY-000000)
- [x] Botões de navegação ocultados após pagamento aprovado ou PIX gerado
- [x] notifyPaymentConfirmed usa bookingIdRef.current como fallback
- [x] Webhook MP: MP_WEBHOOK_SECRET configurado, processa payment.updated corretamente
- [x] CSP atualizada para permitir SDK e API do Mercado Pago
- [x] Token CSRF inicializado no startup do app

## Remoção do Stripe

- [x] Remover todos os arquivos server/stripe/ (routes.ts, webhook.ts, products.ts, etc.)
- [x] Remover procedures Stripe de routers.ts (createCheckoutSession, getByStripeSession, processBookingPayment)
- [x] Remover getPaymentByStripeSession de db.ts
- [x] Remover colunas Stripe de drizzle/schema.ts (stripePaymentMethodId, stripeSessionId, stripeChargeId, stripeCustomerId)
- [x] Remover variáveis Stripe de server/_core/env.ts
- [x] Remover rota /api/stripe e CSP Stripe de server/_core/index.ts
- [x] Reescrever BookingSuccess.tsx sem dependência do Stripe session
- [x] Atualizar BookingCancel.tsx (remover comentário Stripe)
- [x] Atualizar testes: db.indexes, security.headers, rate.limiting, csrf.protection, code.quality, auth
- [x] Atualizar rateLimiter.ts (remover comentário Stripe)
- [x] TypeScript: 0 erros | Testes: 931 passando

### Correção Definitiva Fluxo de Pagamento (COMPLETED 2026-04-18)
- [x] Remover aprovação manual do host: booking.create agora cria com status pending_payment diretamente
- [x] FLOW A corrigido: após criar reserva, processa pagamento imediatamente na mesma tela (sem redirecionar)
- [x] Validação de cartão no FLOW A antes de criar a reserva (evita reserva sem pagamento)
- [x] Webhook: live_mode=false → bypass de assinatura (eventos de teste aceitos)
- [x] Webhook: live_mode=true → verificação HMAC obrigatória com secret correto
- [x] Idempotência no webhook para evitar processamento duplicado
- [x] TypeScript: 0 erros | Testes: 931/931 passando

## Fase N: Hierarquia Visual do Fluxo de Pagamento (Step 3)

- [x] Estado de decisão (pré-pagamento): card grande e dominante com todos os detalhes da reserva
- [x] Estado de processamento: interface mínima e limpa (status + código + resumo básico)
- [x] Estado de resultado: card médio focado (sucesso ou erro, nunca ambos)
- [x] Lógica de layout próprio para cada estado (decisão / processando / resultado)

## Fase N+1: Correção do Fluxo "Pagamento em Análise"

- [x] Webhook: consultar API MP com payment_id e obter status real
- [x] Webhook: atualizar status da reserva no banco (approved/rejected/pending)
- [x] Webhook: adicionar logs completos (recebido, payment_id, resposta MP, atualização banco)
- [x] Frontend: polling automático do status da reserva quando em análise
- [x] Frontend: transição automática para sucesso (approved) ou erro (rejected)
- [x] Frontend: garantir que a tela nunca fique travada indefinidamente

## Fase N+2: Polling Direto na API MP (sem depender do webhook)

- [x] Criar procedure booking.pollMPPaymentStatus que consulta API MP diretamente
- [x] Frontend: polling usa a nova procedure para obter status real do MP
- [x] Atualizar banco quando status muda (approved/rejected)
- [x] Instruções para configurar webhook de produção no painel MP

## Fase N+3: Correção do Fallback Checkout Pro

- [x] Auditar botão "Pagar via Checkout Pro" no card de erro do BookingFlow
- [x] Corrigir geração da URL do Checkout Pro (createMPCheckoutProPreference)
- [x] Garantir window.open com a URL correta ao clicar no botão

## Fase N+4: Página de Retorno do Checkout Pro

- [x] Criar página /booking/success com polling de status da reserva
- [x] Exibir confirmação (aprovado), análise (pendente) ou erro (recusado)
- [x] Registrar rota /booking/success no App.tsx
- [x] Registrar rota /booking/pending no App.tsx (retorno pendente do MP)

## Fase N+5: Correção de Bloqueio de Datas por Reservas Não Pagas

- [x] Auditar query de disponibilidade de datas em db.ts e routers.ts
- [x] Corrigir query para ignorar reservas com status pending_payment e payment_failed
- [x] Implementar limpeza automática de reservas pending_payment expiradas (>30min)
- [x] Garantir que apenas reservas confirmed bloqueiam datas

## Fase N+6: Timer PIX + E-mail + Avaliações

- [x] Timer de expiração do PIX (10 min) com contagem regressiva no card do QR Code
- [x] E-mail automático de confirmação ao locatário após pagamento aprovado
- [x] Schema de avaliações (tabela reviews) no banco
- [x] Procedures backend: criar avaliação, listar avaliações por veículo/host
- [x] Notificação ao locatário após devolução do carro para avaliar
- [x] Página/modal de avaliação pós-reserva no frontend
- [x] Exibir média de avaliações no card do veículo e perfil do host

## Fase N+7: Estrelas + E-mail Host + Perfil Público Host

- [x] Incluir média de avaliações e total na procedure vehicle.getById e vehicle.search
- [x] Exibir estrelas e contagem nos cards de veículos (busca de carros e motos)
- [x] Exibir estrelas e contagem na página de detalhes do veículo
- [x] E-mail automático ao host quando reserva for confirmada (webhook MP)
- [x] Criar página /hosts/:id com perfil público do host
- [x] Perfil do host: foto, bio, avaliações recebidas, veículos disponíveis
- [x] Link para perfil do host na página de detalhes do veículo
- [x] Registrar rota /hosts/:id no App.tsx

## Fase N+8: Remoção de Dados Falsos

- [ ] Mapear todas as seções com dados hardcoded (viagens, cidades, depoimentos)
- [ ] Remover ou substituir números falsos de viagens/usuários por dados reais do banco
- [ ] Remover seção de depoimentos/testimonials falsos
- [ ] Remover ou atualizar lista de cidades operantes hardcoded
- [ ] Remover qualquer contador fake (estrelas, avaliações, stats)
- [ ] Garantir que stats exibidos são reais ou removidos

## Fase N: Correção do Mapa de Busca

- [x] Fix /cars map: pins não apareciam para cidades fora da lista hardcoded (ex: Ji-Paraná/RO)
- [x] Fix /cars map: mapa centralizava em São Paulo quando cidade não estava na lista
- [x] Fix /cars: usar pickupLatitude/pickupLongitude reais do banco como fallback para pins e center
- [x] Fix /motorcycles map: mesmos problemas de pins/center + campos errados (moto.cidade → vehicle.pickupCity, moto.preco_diario → vehicle.dailyPrice)

## Fase N+1: GPS e Geocodificação de Veículos

- [x] Confirmar que vehicle.create já geocodifica o endereço ao cadastrar (estava implementado no backend)
- [x] Adicionar Ji-Paraná e todas as cidades de Rondônia à lista hardcoded de coordenadas em Cars.tsx
- [x] Adicionar Ji-Paraná e todas as cidades de Rondônia à lista hardcoded de coordenadas em Motorcycles.tsx
- [x] Expandir lista hardcoded para cobrir todas as capitais + 200+ cidades do interior do Brasil
- [x] Criar script server/scripts/geocodeVehicles.ts para geocodificar veículos existentes sem GPS
- [x] Executar script: todos os veículos agora têm coordenadas GPS (0 veículos sem coords)
- [x] Verificar: Nissan Sentra e VW Polo de Ji-Paraná têm lat/lng corretos (-10.89, -61.96)


## Fase N+3: Implementação de Contrato em PDF (NOVO - CRÍTICO)

- [x] Criar serviço de geração de PDF com template RIDDY novo
- [x] Mapear dados de booking para campos do contrato
- [x] Preencher CNPJ da RIDDY (65901010000143) no contrato
- [x] Gerar PDF dinamicamente no ato da assinatura
- [x] Enviar PDF por email para locatário
- [x] Enviar PDF por email para proprietário
- [x] Armazenar PDF em S3
- [x] Linkar PDF ao registro de booking no banco (campo contractPdfUrl adicionado)
- [x] Integrar chamada de generateAndSendContract no booking.create (via payment webhook)
- [x] Implementar download de contrato no dashboard (botão em BookingDetails)

## Fase N+4: Pagamento, Geocodificação e Recibos

- [x] Re-geocodificar endereço no vehicle.update
- [x] Gerar PDF de recibo de pagamento
- [x] Criar página de recibos com download
- [x] Testar fluxo completo de pagamento + geração de contrato PDF

## Fase N+5: Novo Contrato Robusto (12 Cláusulas) — CONCLUÍDO

- [x] Atualizar RentalContract.tsx com novo contrato de 12 cláusulas
- [x] Implementar cláusulas coloridas e interativas (accordion + cores por tipo)
- [x] Atualizar contractService.ts com novo template de PDF
- [x] Preencher todos os campos dinâmicos (CNPJ, partes, veículo, datas, valores)
- [x] Usar dados reais de CNH do locatário (cnhNumber, cnhCategory, cnhExpiresAt)
- [x] Usar foro dinâmico baseado na cidade do veículo
- [x] Testar geração de PDF com novo contrato (PDF gerado com sucesso em S3)

## Mobile UX Improvements (May 2026)
- [x] Fix viewport meta: remove maximum-scale=1
- [x] Add loading="lazy" to all img tags across the site
- [x] Fix DateRangePicker width (w-[180px] → flex-1)
- [x] Add sticky mobile CTA bar to VehicleDetails
- [x] Fix RentalContract ScrollArea height for small screens
- [x] Add React.lazy code splitting to App.tsx

## Premium Mobile UI Audit & Redesign (May 2026)
- [x] Standardize vehicle card images (16:9 aspect ratio, object-cover, consistent crop)
- [x] Implement 1-card-per-line layout on mobile (remove 2-column grid)
- [x] Increase image height on mobile for premium feel
- [x] Fix duplicate/incorrect vehicle titles (e.g., "Honda Honda city")
- [x] Implement proper text capitalization and ellipsis handling
- [x] Standardize card padding and internal spacing
- [x] Enhance badges with backdrop blur and transparency
- [x] Improve price/rating alignment and hierarchy
- [x] Add consistent gap between cards
- [x] Refine overall visual hierarchy and balance

## Turo-Inspired Premium Redesign (May 2026)
- [x] Implement 2-column grid layout on mobile (grid-cols-2)
- [x] Change image aspect ratio to 4:3 (more cinematographic)
- [x] Increase rounded corners (rounded-lg) for premium feel
- [x] Simplify card content (remove features, location, badges)
- [x] Keep only: image, title, year/rating, price
- [x] Improve grid gap spacing (gap-2.5 mobile, gap-4 desktop)
- [x] Add heart/favorite icon discretely on image
- [x] Refine price typography (larger, more prominent)
- [x] Remove "Diária a partir de" label (keep just price)
- [x] Add subtle hover scale animation (scale-105)
- [x] Ensure perfect alignment across all cards
- [x] Add smooth transitions and premium feel
- [x] Test on actual iPhone for native app feel

## Premium Mobile Features (May 13, 2026)
- [x] Bottom navigation bar (Home, Buscar, Favoritos, Reservas, Perfil) — Turo-style
- [x] Real favorites functionality with Heart button (filled/empty, optimistic updates)
- [x] Skeleton loaders for vehicle cards (shimmer animation, matches card dimensions)
- [x] FavoriteButton component integrated in Cars.tsx, FeaturedCarsSection, FeaturedMotorcyclesSection
- [x] VehicleDetails sticky CTA moved above bottom nav
- [x] Home.tsx pb-20 lg:pb-0 to avoid bottom nav overlap

## Fase N: Correção de Datas e Congelamento no Fluxo de Reserva

- [x] Corrigir bug UTC: isoToBR usa new Date() que interpreta YYYY-MM-DD como UTC, causando 1 dia a menos no fuso UTC-4
- [x] Salvar datas no sessionStorage ao clicar em "Reservar" no VehicleDetails
- [x] BookingFlow lê datas do sessionStorage como strings YYYY-MM-DD (sem conversão UTC)
- [x] Datas exibidas como read-only no BookingFlow (card informativo, não inputs editáveis)
- [x] Link "Alterar datas" no BookingFlow volta para VehicleDetails
- [x] Limpar sessionStorage após booking confirmado ou cancelado

## Fase O: Lazy Loading Resiliente (Chunk Error Recovery)

- [x] Criar lazyWithRetry helper com retry automático (3 tentativas + cache-bust)
- [x] Criar ChunkErrorBoundary especializado para erros de dynamic import
- [x] Criar PageLoader premium com skeleton animado
- [x] Atualizar App.tsx para usar lazyWithRetry em todos os lazy imports
- [x] Atualizar ErrorBoundary para detectar chunk errors e mostrar UI de atualização
- [x] Configurar Vite com chunk naming por hash para cache-safe deploys
- [x] Garantir estabilidade no Safari/iOS

## Fase R: Sistema de Caução Inteligente (5× diária)
- [ ] Frontend: calcular caução como 5× o valor da diária do veículo
- [ ] Frontend: exibir caução no breakdown de preços (linha separada, destacada)
- [ ] Frontend: adicionar tooltip/card explicativo sobre a caução
- [ ] Frontend: mostrar caução no resumo lateral (step 3 — sidebar)
- [ ] Backend: calcular e salvar caução como 5× dailyRate no createBooking
- [ ] Backend: atualizar testes para refletir novo cálculo de caução

## Fase S: Caução incluída no total cobrado
- [ ] Frontend: incluir securityDeposit no finalTotal (total + caução)
- [ ] Frontend: atualizar UI para mostrar caução como linha do total, não separada
- [ ] Frontend: atualizar valor enviado ao MP (amount = finalTotal com caução)
- [ ] Backend: incluir caução no totalAmount salvo e enviado ao MP

## Fase T: Sistema de Garantia Reembolsável Premium
- [ ] Adicionar campos ao schema: guaranteeMultiplier, guaranteeCalculated, guaranteeAdjusted, guaranteeRetainedAt, guaranteeReleaseStatus
- [ ] Implementar lógica escalonada: 1d=2x, 2-3d=3x, 4-6d=4x, 7+d=5x com limites R$500-R$5.000
- [ ] Salvar todos os campos de garantia no createBooking
- [ ] Renomear "Caução" para "Garantia Reembolsável" em toda a UI
- [ ] UI premium no checkout: valor escalonado, separação visual, modal "Saiba mais"
- [ ] Adicionar seção "Proteção da Locação" no formulário do host com slider + indicador de competitividade
- [ ] Adicionar cláusula de garantia no contrato

## Fase N: Coleta de Endereço + Assinatura OTP (SMS/Email)

### Etapa 1: Schema e Backend
- [x] Adicionar campos de endereço na tabela bookings (renterAddressStreet, renterAddressNumber, renterAddressComplement, renterAddressNeighborhood, renterAddressCity, renterAddressState, renterAddressZipCode)
- [x] Adicionar campos OTP na tabela bookings (contractOtpCode, contractOtpExpiresAt, contractOtpChannel, contractOtpVerifiedAt)
- [x] Migrar banco de dados com pnpm db:push
- [x] Criar procedure booking.sendContractOtp (envia código por SMS via Twilio ou email via Resend)
- [x] Criar procedure booking.verifyContractOtp (verifica código e registra aceite)
- [x] Instalar SDK Twilio no projeto

### Etapa 2: Frontend — Step 1 (Endereço)
- [x] Adicionar bloco "Endereço" no Step 1 do BookingFlow após campos de CNH
- [x] Campo CEP com autocomplete via API ViaCEP (preenche rua, bairro, cidade, UF)
- [x] Campos: CEP, Rua (auto), Número (manual), Complemento (opcional), Bairro (auto), Cidade (auto), UF (auto)
- [x] Validação de endereço no handleNext do Step 1
- [x] Pre-fill endereço do perfil do usuário se disponível

### Etapa 3: Frontend — Step 2 (OTP em vez de checkbox)
- [x] Substituir checkbox de aceite por botão "Assinar Contrato"
- [x] Modal de escolha de canal: SMS (número mascarado) ou Email (email mascarado)
- [x] Campo de digitação do código de 6 dígitos
- [x] Botão "Reenviar código" com cooldown de 60 segundos
- [x] Ao verificar código com sucesso: marcar contrato como aceito e liberar pagamento
- [x] Tratamento de erro: código inválido ou expirado

### Etapa 4: Contrato PDF
- [x] Incluir endereço completo do locatário na qualificação do contrato
- [x] Incluir método de autenticação OTP no bloco de assinatura eletrônica
- [x] Adicionar hash SHA-256 do conteúdo do contrato no rodapé

### Etapa 5: Testes e Checkpoint
- [x] Testes unitários: hash SHA-256, geração de código OTP, formatação de endereço
- [x] Todos os 944 testes passando
- [x] Salvar checkpoint

## Fase N+1: Banco de Dados de OTP (SMS e E-mail)
- [x] Criar tabela otp_logs no schema Drizzle (bookingId, channel, event, recipient mascarado, otpCode, providerStatus, providerRef, ipAddress, userAgent, errorMessage, createdAt)
- [x] Aplicar migração 0022_otp_logs_table no banco de dados
- [x] Adicionar helper logOtpEvent e getOtpLogsByBookingId no server/db.ts
- [x] Atualizar otpService.ts: sendOtpViaSms, verifyOtpViaTwilio, sendOtpViaEmail, logEmailOtpVerified, logEmailOtpFailed agora recebem bookingId e registram cada evento
- [x] Atualizar routers.ts: sendContractOtp e verifyContractOtp passam bookingId e IP/UserAgent para o serviço OTP
- [x] Testes unitários: 15 testes cobrindo schema, mascaramento de telefone/email, estrutura de eventos
- [x] 962 testes passando
- [x] Salvar checkpoint

## Correção: Bug OTP SMS — Endpoint Twilio Verify Incorreto
- [x] Diagnosticar: endpoint `/VerificationChecks` (com 's') retornava 404 mesmo com código correto
- [x] Corrigir: endpoint correto é `/VerificationCheck` (sem 's') conforme documentação Twilio
- [x] Adicionar testes unitários verificando o endpoint correto
- [x] 964 testes passando

### Reestruturação de Dashboards — Arquitetura de Modo Dual
- [x] Fase 1: Banco — adicionar `activeMode` em users e `contextMode` em notifications
- [x] Fase 2: UserModeContext + hook useUserMode + lógica de persistência
- [x] Fase 3: Correção do bug do header sobrepondo o sidebar nos dashboards
- [x] Fase 4: Bottom Navigation contextual por modo (Locatário/Anfitrião/Admin)
- [x] Fase 5: Header com switcher de modo contextual no dropdown
- [x] Fase 6: Modal de onboarding de primeiro acesso + proteção anti-self-booking
- [x] Fase 7: Aba Reservas contextual (locatário → /my-bookings, anfitrião → /host?section=bookings)
- [x] Fase 8: Admin — menu reestruturado em 4 grupos operacionais
- [x] 959 testes passando (5 falhas são de integração externa: Cloudinary/IBGE)

## Revisão Completa — Correções Identificadas

### Correção Fase 1: Erros Críticos
- [ ] Erro 1: Helper updateActiveMode dedicado no db.ts (CRÍTICO)
- [ ] Erro 2: try/catch nas procedures updateActiveMode e activateHostMode
- [ ] Erro 3: Validação de retorno nas procedures de modo
- [ ] Erro 10: adminProcedure no trpc.ts (CRÍTICO)

### Correção Fase 2: Erros de UI
- [ ] Erro 5: Switcher de modo no menu mobile do Header
- [ ] Erro 6: MobileBottomNav ocultar com query strings (/host?section=...)
- [ ] Erro 7: Cores dinâmicas no MobileBottomNav

### Correção Fase 3: Erros de Validação
- [ ] Erro 4: ModeSelectionModal validar role antes de permitir "host"
- [ ] Erro 8: activateHostMode validar sucesso antes de retornar
- [ ] Erro 9: Validação de role em procedures de host (vehicle.create)

### Correção Fase 4: Testes
- [ ] Erro 11: Testes para updateActiveMode e activateHostMode (CRÍTICO)
- [ ] Erro 12: Testes para ModeSelectionModal
- [ ] Erro 13: Testes para UserModeContext
- [ ] Erro 14: Testes para Header com switcher
- [ ] Erro 15: Testes para MobileBottomNav contextual

## Fase 2 de Correções — UI Contextual + Navegação Dinâmica

### ERRO 5: Switcher mobile no Header
- [x] Adicionar switcher de modo no dropdown mobile do Header (avatar dropdown)
- [x] Adicionar switcher no menu mobile drawer (lista de links)
- [x] Validar role: USER → fluxo de ativação host; HOST/BOTH → alternância renter↔host; ADMIN → sem switch
- [x] Testar persistência após reload

### ERRO 6: MobileBottomNav + query strings
- [x] Corrigir detecção de rota ativa para rotas com query strings (/host?section=bookings)
- [x] Garantir active state correto para todos os itens do HOST_NAV e ADMIN_NAV
- [x] Sem flickering, sem inconsistência

### ERRO 7: Cores contextuais dinâmicas
- [x] MobileBottomNav: active icons com cores por modo (cyan/emerald/red)
- [x] Badges e highlights contextuais
- [x] Indicadores e switchers com cores corretas

### Testes Fase 2
- [x] Testes para switcher mobile
- [x] Testes para rotas com query string
- [x] Testes para active state
- [x] Testes para cores contextuais
- [x] Testes para persistência

## Fase 3 de Correções — Hardening de Segurança Backend (PRIORIDADE MÁXIMA)

### Mapeamento de Procedures Sensíveis
- [ ] Auditar routers.ts: mapear todas as procedures com gaps de validação de role
- [ ] Auditar motorcycle.ts: mapear todas as procedures host sem verificação de role
- [ ] Auditar trpc.ts: verificar se adminProcedure existe e está correto
- [ ] Auditar db.ts: verificar se updateActiveMode é helper dedicado

### ERRO 1: Helper updateActiveMode dedicado no db.ts
- [ ] Criar helper updateActiveMode(userId, mode) no db.ts com validação
- [ ] Garantir que a função valida o userId antes de persistir
- [ ] Retornar erro tipado se userId inválido

### ERRO 2: try/catch nas procedures de modo
- [ ] Adicionar try/catch em user.updateActiveMode procedure
- [ ] Adicionar try/catch em user.activateHostMode procedure
- [ ] Retornar TRPCError com código correto em caso de falha

### ERRO 3: Validação de retorno nas procedures de modo
- [ ] Validar que activateHostMode retornou sucesso antes de confirmar ao cliente
- [ ] Validar que updateActiveMode retornou sucesso antes de confirmar ao cliente

### ERRO 4: ModeSelectionModal validar role antes de permitir "host"
- [ ] Backend: procedure setMode deve validar role antes de aceitar mode="host"### ERRO 7: Validação de role no backend
- [x] Backend: role=user não pode definir mode=host sem ativação prévia
- [x] Frontend: ModeSelectionModal usa activateHostMode vs setMode baseado em canSwitchToHost

### ERRO 8: activateHostMode validar sucesso antes de retornar
- [x] Verificar que a atualização do banco foi bem-sucedida
- [x] Verificar que o role foi atualizado para host/both
- [x] Retornar erro se qualquer etapa falhar

### ERRO 9: Validação de role em procedures de host
- [x] vehicle.create: migrado para hostProcedure
- [x] vehicle.update: migrado para hostProcedure
- [x] vehicle.delete: migrado para hostProcedure
- [x] vehicle.uploadImage: migrado para hostProcedure
- [x] vehicle.uploadFile: migrado para hostProcedure
- [x] vehicle.deleteImage: migrado para hostProcedure
- [x] vehicle.blockDates: migrado para hostProcedure
- [x] vehicle.unblockDates: migrado para hostProcedure
- [x] motorcycle.create: migrado para hostProcedure
- [x] motorcycle.update: migrado para hostProcedure
- [x] motorcycle.delete: migrado para hostProcedure
- [x] booking.approveForPayment: migrado para hostProcedure
- [x] booking.rejectBooking: migrado para hostProcedure
- [x] booking.recordMileage: migrado para hostProcedure

### ERRO 10: adminProcedure no trpc.ts
- [x] adminProcedure já existe e verifica ctx.user.role === 'admin'
- [x] Procedures admin.* já usam adminProcedure

### Proteção de activeMode
- [x] user.updateActiveMode: bloqueia mode=host para role=user com log de bypass
- [x] user.updateActiveMode: mode=admin não é aceito (enum só permite renter|host)
- [x] Bypass manual via request forjado é bloqueado com log de segurança

### Testes de Segurança
- [x] 57 testes em security.permissions.test.ts
- [x] Testes para role enforcement (hostProcedure, adminProcedure)
- [x] Testes para bypass prevention em activeMode
- [x] Testes para activateHostMode validation
- [x] Testes para ownership verification
- [x] Testes para UserModeContext permissions
- [x] Testes para integridade do sistema de roles
- [x] 1.063 testes passando no total, TypeScript sem erros
## Fase 4 de Correções — Testes Críticos de Contexto [CONCLUÍDA]

### Testes updateActiveMode e activateHostMode
- [x] mode=host + role=user → FORBIDDEN com mensagem correta
- [x] mode=host + role=host → sucesso
- [x] mode=host + role=both → sucesso
- [x] mode=host + role=admin → sucesso
- [x] mode=renter → sempre sucesso
- [x] activateHostMode role=user → converte para both
- [x] activateHostMode role=host → mantém host
- [x] activateHostMode DB falha → INTERNAL_SERVER_ERROR

### Testes UserModeContext
- [x] canSwitchToHost true para host/both/admin
- [x] canSwitchToHost false para user
- [x] needsModeSelection true quando sem modo salvo
- [x] setMode("host") chama updateActiveMode
- [x] activateHostMode() atualiza estado para host
- [x] Persistência: modo sobrevive a reload
- [x] Admin: modo definido automaticamente

### Testes ModeSelectionModal
- [x] role=user + seleciona host → chama activateHostMode
- [x] role=host + seleciona host → chama setMode
- [x] role=both alternando → chama setMode
- [x] role=admin → sem switch renter/host

### Testes Header switcher mobile
- [x] Switcher aparece para role=host/both
- [x] Switcher NÃO aparece para role=admin
- [x] role=user → botão "Tornar-se Anfitrião"
- [x] Badge cor correta (cyan=renter, emerald=host)

### Testes MobileBottomNav
- [x] /host?section=bookings → item Reservas ativo
- [x] /host?section=vehicles → item Veículos ativo
- [x] /administrator NÃO ativa /admin
- [x] Cores: renter=cyan, host=emerald, admin=red
- [x] Nav admin não vaza itens host/renter

**Total: 1.257 testes passando (67 arquivos), TypeScript sem erros**

## Correções Urgentes — Modo e Bottom Nav

- [ ] Corrigir "Acesso Negado" ao trocar de modo: guard de rota deve verificar mode ativo, não role
- [ ] Atualizar RENTER_NAV: remover Buscar, adicionar Inbox (Início-Favoritos-Reservas-Inbox-Menu)
- [ ] Atualizar testes para refletir nova nav e correção do guard

## Menu Contextual por Modo (Estilo Turo)

- [ ] Reescrever Profile.tsx com menu contextual por modo
- [ ] Modo Locatário: Avatar + card "Torne-se Anfitrião" (role=user) ou "Alternar para Anfitrião" (role=both) + Conta + Geral + Sair
- [ ] Modo Anfitrião: Avatar + card "Alternar para Locatário" (role=both) + Seção Anfitrião + Conta + Geral + Sair
- [ ] Modo Admin: Avatar + badge Admin + Seção Admin + Conta + Sair
- [ ] Atualizar testes para refletir nova estrutura

## Fase: Otimização de Performance — Eliminar Telas de Carregamento Excessivas

- [ ] Configurar staleTime e gcTime no QueryClient (cache agressivo)
- [ ] Adicionar staleTime: Infinity para auth.me (não re-buscar a cada página)
- [ ] Remover SplashScreen repetida: exibir apenas no carregamento inicial (sessionStorage flag)
- [ ] Corrigir ProtectedRoute: usar isFetching em vez de isLoading para evitar loading bloqueante
- [ ] Substituir loading spinner de página inteira em MyBookings por skeleton de componente
- [ ] Substituir loading spinner de página inteira em HostDashboardNew por skeleton de componente
- [ ] Substituir loading spinner de página inteira em Messages por skeleton de componente
- [ ] MenuPage: não tem loading — já carrega instantaneamente (OK)
- [ ] Adicionar placeholderData: keepPreviousData nas queries de listagem
- [x] Corrigir window.location.reload() no HostDashboardNew (causa reinício completo do app)
- [x] Usar trpc.useUtils().invalidate() em vez de window.location.reload()
- [x] Criar testes para comportamento de cache e transições
- [x] Executar suíte completa de testes anti-regressão
- [x] Salvar checkpoint final

## Fase: RBAC e Permissões (Mai/2026)
- [x] Corrigir /dashboard: remover requiredRole="user" (locatário, host e both devem acessar)
- [ ] Corrigir ProtectedRoute: remover verificação de mode (modo deve ser verificado dentro da página)
- [ ] Invalidar auth.me após activateHostMode para atualizar role no frontend
- [ ] Invalidar auth.me após updateActiveMode para sincronizar activeMode
- [ ] Corrigir UserModeContext: sincronizar modo com banco ao montar (não apenas no useEffect)
- [ ] Corrigir App.tsx: rotas host não devem verificar mode, apenas role
- [ ] Garantir que usuário role=both veja navegação correta por modo ativo
- [ ] Corrigir MyBookings: mostrar reservas como locatário (getMyBookings) e como anfitrião (getHostBookings) baseado no mode ativo
- [ ] Corrigir Inbox: garantir que conversas filtram corretamente por userId
- [ ] Revisar hostProcedure: garantir que role=both tem acesso correto

## Fase: Chat Redesign Airbnb (Mai/2026)
- [x] Backend: getConversationContext, getUnreadPerConversation, uploadChatImage procedures
- [x] Backend: getUnreadCountForConversation helper em db.ts
- [x] Frontend: Messages.tsx completamente redesenhado (estilo Airbnb)
- [x] Envio otimista de mensagens (feedback instantâneo)
- [x] Card de contexto da reserva (foto do veículo, datas, status, CTA)
- [x] Upload de imagem base64 → S3
- [x] Unread badges por conversa
- [x] Respostas rápidas para anfitriões
- [x] Indicadores de leitura (✓/✓✓)
- [x] Polling inteligente (3s visível / pausado em background)
- [x] Bug fix: input bar cortado pela nav mobile (pb-16 lg:pb-0)
- [x] Bug fix: mensagens não scrollam (overflow-y-auto nativo + setTimeout)
- [x] Bug fix: duplicação de mensagens (tempId negativo + deduplicação melhorada)
- [x] Bug fix: botão de lista de conversas no mobile (painel overlay com showConvPanel)

## Fase: Chat Redesign Premium Airbnb-style (Mai/2026)
- [x] Lista de conversas: thumbnail quadrada do veículo + avatar sobreposto no canto inferior direito
- [x] Lista de conversas: 3 linhas (nome + preview + veículo/cidade)
- [x] Lista de conversas: filtros pill (Todas / Sou locatário / Sou anfitrião)
- [x] Lista de conversas: busca sempre visível
- [x] Header do chat: avatares sobrepostos (thumbnail veículo + avatar usuário)
- [x] Header do chat: botão "Detalhes" pill no canto direito
- [x] Header do chat: botão de chamada de voz (placeholder)
- [x] Bolhas: avatar só na primeira mensagem do grupo (Airbnb-style)
- [x] Bolhas: label "Nome · Papel · HH:MM" acima do grupo de mensagens recebidas
- [x] Bolhas: agrupamento por remetente com border-radius adaptativo
- [x] Bolhas: timestamp + read receipt abaixo do grupo enviado
- [x] Separadores de data entre grupos (Hoje / Ontem / data completa)
- [x] Aviso de fuso horário do anfitrião ("São HH:MM para seu anfitrião")
- [x] Botão scroll-to-bottom flutuante (aparece quando distância > 200px)
- [x] Composer: botão "+" Airbnb-style + botão envio branco com seta
- [x] Backend: getConversations enriquecido com vehicle info (thumbnail, nome, cidade)

## Fase: Ajustes Inbox (Mai/2026)
- [x] Remover botão de configurações não implementado do header do inbox
- [x] Filtros pill funcionais: "Sou locatário" filtra conversas onde usuário é locatário, "Sou anfitrião" onde é proprietário
- [x] Backend: getConversations retorna campo isRenter/isHost por conversa
- [ ] Regra de chat: canal com anfitrião só liberado após reserva confirmada/paga (a implementar)

## Fase: Calendário de Bloqueio de Datas (Mai/2026)
- [x] Corrigir blockVehicleDates para evitar duplicatas (check existência antes de inserir)
- [x] Corrigir unblockVehicleDates para normalizar datas UTC e incluir data final
- [x] Corrigir getAvailability para normalizar datas ao agrupar períodos consecutivos
- [x] Corrigir VehicleCalendar: clicar em data bloqueada desbloqueia diretamente
- [x] Melhorar feedback visual: highlight do range de bloqueio no hover
- [x] Tooltip "Clique para desbloquear" para datas bloqueadas (owner)
- [x] Data inicial de bloqueio destacada em amarelo sólido com ring
- [x] Chat híbrido IA + Anfitrião: tabelas vehicle_chats e chat_messages no banco
- [x] Chat híbrido: helper OpenAI com baseURL direto (contorna proxy Manus)
- [x] Chat híbrido: system prompts para modo veículo e suporte geral
- [x] Chat híbrido: procedures tRPC (getOrCreate, sendMessage, hostReply, getMessages, listHostChats)
- [x] Chat híbrido: componente HybridChat com perguntas rápidas e indicador de digitação
- [x] Chat híbrido: widget SupportWidget flutuante em todas as páginas
- [x] Chat híbrido: integrado na página do veículo (VehicleDetails)
- [x] Chat híbrido: testes unitários passando (5/5)
- [x] Chat híbrido: chave OpenAI validada e funcionando (1263 testes passando)
- [x] Riddy Care: tabelas support_tickets, ticket_messages criadas
- [x] Riddy Care: procedures tRPC (createTicket, getTicket, sendTicketMessage, adminListTickets, adminReply, adminUpdateTicket)
- [x] Riddy Care: página /riddy-care com Central de Ajuda, categorias, criação de tickets e histórico
- [x] Riddy Care: widget flutuante RiddyCareWidget em todas as páginas
- [x] Riddy Care: painel admin com filtros por status/prioridade e resposta de agente
- [x] VehicleDetails: botão Falar com proprietário vinculado ao Riddy Care
- [x] VehicleOwnerChat: componente drawer com perguntas rápidas, chat aberto e Lumi com contexto do veículo
- [x] VehicleOwnerChat: backend quickChat atualizado para aceitar vehicleId e enriquecer system prompt com dados do veículo
- [x] VehicleOwnerChat: botão "Falar com proprietário" no desktop e mobile abre drawer (não redireciona para /riddy-care)
- [x] VehicleOwnerChat: escalação para ticket formal com botão "Abrir ticket de suporte"

## Fase: Sistema Premium de Níveis, Conquistas e Metas

- [x] Schema DB: tabela user_levels (locatários e anfitriões)
- [x] Schema DB: tabela user_achievements (conquistas desbloqueadas)
- [x] Schema DB: tabela platform_goals (metas do admin)
- [x] pnpm db:push com as novas tabelas
- [x] Servidor: constantes de níveis com critérios e benefícios (locatário e anfitrião)
- [x] Servidor: função calculateUserLevel() chamada após locação concluída
- [x] Servidor: aplicar desconto automático no checkout conforme nível do locatário
- [x] Servidor: aplicar taxa de serviço reduzida para anfitriões por nível
- [x] Servidor: aplicar política de garantia reduzida por nível
- [x] Servidor: tRPC procedures para buscar nível, conquistas e progresso
- [x] UI: badge de nível no perfil (uma linha, glassmorphism, não polui)
- [x] UI: tela premium de Conquistas/Nível (locatário) com progresso e benefícios ativos
- [x] UI: tela premium de Conquistas/Nível (anfitrião) com progresso e benefícios ativos
- [x] UI: modal de Level Up com animação de partículas ao subir de nível
- [x] UI: cartão compartilhável gerado com dados reais do usuário (PNG download)
- [x] UI: painel de Metas premium para o Admin (visual único, não são níveis)
- [x] Testes vitest para lógica de cálculo de nível e benefícios

## Fase: Ecossistema de Reputação — Score Riddy, Ranking e Social Proof

### Backend — Score e Benefícios
- [x] shared/levels.ts: rebalancear descontos (2%, 3%, 5%, 7%) e atualizar benefícios dos anfitriões
- [x] shared/levels.ts: implementar Score Riddy multidimensional (pontos positivos e negativos)
- [x] server/routers/levels.ts: procedure calculateRiddyScore() com pesos por métrica
- [x] server/routers/levels.ts: procedure getMyScore() retornando score, breakdown e posição
- [x] drizzle/schema.ts: adicionar campos score_renter e score_host em user_levels
- [x] drizzle/schema.ts: adicionar campos negativos (cancelamentos, disputas, denúncias) em user_levels
- [x] pnpm db:push com novos campos

### Backend — Ranking Regional
- [x] server/routers/levels.ts: procedure getRanking(type, scope) — cidade/estado/nacional
- [x] server/routers/levels.ts: procedure getMyRanking() — posição do usuário nos 3 escopos
- [x] Otimizar queries com índices em user_levels (score, city, state)

### Backend — Conquistas Expandidas
- [x] shared/levels.ts: adicionar conquistas Primeiras (primeira reserva, primeiro anúncio, primeiro check-in)
- [x] shared/levels.ts: adicionar conquistas Crescimento (10, 25, 50, 100, 500 reservas)
- [x] shared/levels.ts: adicionar conquistas Reputação (nota 5★, 10/50/100 avaliações positivas)
- [x] shared/levels.ts: adicionar conquistas Fidelidade (6 meses, 1 ano, 2 anos na plataforma)
- [x] shared/levels.ts: adicionar conquistas Especiais (Membro Fundador, Early Adopter, Top Região, Top Brasil)
- [x] server/routers/levels.ts: verificar e desbloquear conquistas de fidelidade e especiais

### UI — Ranking Regional (/riddy-ranking)
- [x] Criar página RiddyRanking.tsx com filtros cidade/estado/nacional
- [x] Tabs locatários/anfitriões com leaderboard premium
- [x] Posição do usuário logado destacada no ranking
- [x] Adicionar rota /riddy-ranking no App.tsx

### UI — Perfil Evoluído
- [x] Atualizar UserProfile.tsx com score, ranking, conquistas e social proof
- [x] Social proof automático: "Você está entre os X% melhores da sua região"
- [x] Barra de progresso para próximo nível com mensagem motivacional
- [x] Histórico de atividade no perfil

### UI — Riddy Legend Premium
- [x] Criar tela exclusiva /riddy-legend com identidade visual dourada
- [x] Badge dourado animado com efeito de brilho
- [x] Seção de benefícios exclusivos futuros
- [x] Destaque visual diferenciado no perfil e nos cards de veículo

### UI — Analytics Admin
- [x] Criar seção "analytics" no AdminDashboardNew.tsx
- [x] Gráfico de usuários por nível (locatários e anfitriões)
- [x] Top 10 anfitriões e top 10 locatários
- [x] Métricas de retenção por nível
- [x] Receita por nível de usuário
- [x] Conquistas mais desbloqueadas
- [x] Adicionar item "Analytics de Níveis" no menu admin

### Testes
- [x] Testes vitest para calculateRiddyScore()
- [x] Testes para getRanking()
- [x] Testes para novas conquistas

## Stories Automáticos com Toast Premium

- [x] Criar StoryEventContext — contexto global para emitir eventos de Story
- [x] Criar hook useStoryTrigger — consome eventos e exibe toast premium com miniatura
- [x] Toast premium: miniatura do Story gerado + botão "Ver Story" + botão "Baixar"
- [x] Integrar trigger level_up no LevelUpModal
- [x] Integrar trigger km_milestone nos marcos de km (500, 1000, 5000, 10000)
- [x] Integrar trigger first_rental na confirmação da primeira locação
- [x] Integrar trigger welcome no primeiro login do usuário
- [x] Polling periódico via getMyLevel para detectar mudanças de nível e marcos de km

## Redesign Cinematográfico das Stories (Sessão 2)
- [x] Reescrever generateRiddyStory.ts — engine Canvas 2D com 6 formatos cinematográficos premium
- [x] Formato 1 "welcome": foto de carro noturno, tipografia massiva "BEM-VINDO À RIDDY", identidade do usuário
- [x] Formato 2 "first_rental": carro ao pôr do sol, troféu dourado, "PRIMEIRA LOCAÇÃO CONCLUÍDA"
- [x] Formato 3 "level_up": carro noturno com luzes, hexágono, nome do nível em destaque máximo
- [x] Formato 4 "km_milestone": estrada com Via Láctea, número de km em 270px com glow cyan
- [x] Formato 5 "motivational": carro azul urbano, "QUAL SERÁ SEU PRÓXIMO DESTINO?"
- [x] Formato 6 "explorer": fundo escuro sólido, logo RIDDY grande, 3 pilares da marca
- [x] Atualizar RiddyStory.tsx para 6 formatos com seletor visual premium
- [x] TypeScript sem erros após reescrita completa
