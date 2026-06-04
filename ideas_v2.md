# RIDDY Website V2 - Estilo Turo Premium Brasil

## Análise do Turo

O site da Turo possui uma estrutura focada em conversão e marketplace, com elementos principais como busca proeminente, carrosséis de veículos, trust signals e seções de como funciona. O design é clean, fundo claro, com foco em imagens de alta qualidade dos veículos.

## Nova Direção: Premium Dark Marketplace

Para a RIDDY, vamos criar uma versão **premium e melhorada**, mantendo a funcionalidade de marketplace mas elevando significativamente o design visual para transmitir exclusividade e sofisticação.

---

<response>
<text>
## Ideia Escolhida: Luxury Dark Marketplace

**Design Movement**: Luxury Automotive Branding + Modern Marketplace UX

**Core Principles**:
1. Dark mode premium como diferenciador - transmite exclusividade e sofisticação
2. Busca como elemento hero - funcionalidade acima de tudo
3. Imagens de veículos como protagonistas visuais
4. Trust signals brasileiros proeminentes (seguro, CNPJ, suporte 24h)

**Color Philosophy**:
- Fundo: Navy profundo (#0A0F1C) - luxo e profundidade
- Primária: Cyan elétrico (#22D3EE) - tecnologia e inovação
- Secundária: Teal (#0D9488) - confiança e estabilidade
- Acento: Emerald (#10B981) - sucesso e crescimento
- Destaque: Amber (#F59E0B) - urgência e promoções
- Cards: Slate escuro (#1E293B) com bordas sutis

**Layout Paradigm**:
- Hero full-width com busca centralizada e imagem de fundo premium
- Seções de categorias com pills/tabs horizontais
- Carrosséis de veículos com cards premium
- Seções alternadas de conteúdo institucional
- Footer mega completo estilo marketplace

**Signature Elements**:
1. Cards de veículos com glassmorphism sutil
2. Badges animados para promoções e novos listings
3. Rating stars com cor amber
4. Preços destacados com tipografia bold
5. Ícones de segurança brasileiros (seguro, verificação, suporte)

**Interaction Philosophy**:
- Busca responsiva com autocomplete
- Cards com hover elevation e scale sutil
- Carrosséis com navegação smooth
- CTAs com micro-animações
- Scroll reveal para seções

**Animation**:
- Hero com parallax sutil na imagem de fundo
- Cards que elevam no hover (translateY + shadow)
- Badges que pulsam para chamar atenção
- Números que contam para métricas
- Transições suaves entre seções

**Typography System**:
- Display: Sora Bold (headlines impactantes)
- Body: Plus Jakarta Sans (legibilidade premium)
- Preços: Tabular numbers com peso bold
- Badges: Uppercase tracking wide

</text>
<probability>0.95</probability>
</response>

---

## Estrutura de Seções

### 1. Header Fixo
- Logo RIDDY
- Navegação: Como Funciona | Para Proprietários | Segurança | Cidades
- CTA: "Liste seu Carro" + Login/Cadastro

### 2. Hero Section
- Background: Imagem premium de carro em cidade brasileira
- Headline: "Alugue o carro perfeito para sua próxima aventura"
- Subheadline: "Carros únicos de anfitriões locais em todo o Brasil"
- Formulário de Busca: Cidade | Data Início | Data Fim | Buscar
- Trust badges: "Seguro incluso" | "Verificação completa" | "Suporte 24h"

### 3. Categorias de Veículos
- Pills: Todos | SUVs | Sedans | Luxo | Elétricos | Populares
- Filtros adicionais: Preço | Ano | Transmissão

### 4. Carrosséis de Veículos
- "Carros em destaque em São Paulo"
- "SUVs populares no Rio de Janeiro"
- "Veículos de luxo disponíveis"
- Cards com: Imagem | Modelo | Ano | Rating | Preço/dia

### 5. Como Funciona
- 3 passos simples com ícones animados
- Para Locatários: Busque | Reserve | Dirija
- Para Proprietários: Cadastre | Aprove | Ganhe

### 6. Por que RIDDY
- Diferenciais competitivos
- Seguro completo | Verificação rigorosa | Suporte brasileiro
- Métricas de confiança

### 7. Seção Proprietários
- CTA para listar carro
- Calculadora de ganhos
- Depoimentos de anfitriões

### 8. Cidades Disponíveis
- Grid de cidades brasileiras
- São Paulo | Rio | BH | Brasília | etc.

### 9. Depoimentos
- Reviews de usuários reais
- Rating médio da plataforma

### 10. FAQ
- Perguntas frequentes expandíveis
- Categorias: Locatários | Proprietários | Segurança

### 11. CTA Final
- "Comece sua jornada com a RIDDY"
- Botões: Alugar Carro | Listar Carro

### 12. Footer Mega
- Links institucionais
- Categorias de veículos
- Cidades
- Redes sociais
- App stores (futuro)
- Informações legais brasileiras

---

## Implementação Técnica

- React 19 + Tailwind CSS 4
- Framer Motion para animações
- Shadcn/ui para componentes base
- Embla Carousel para carrosséis
- Tema dark como padrão
- Imagens otimizadas WebP
- Lazy loading para performance
