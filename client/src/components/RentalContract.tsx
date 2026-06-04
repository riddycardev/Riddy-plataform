/**
 * Contrato de Locação RIDDY — Versão 2.0
 * Contrato Particular de Intermediação e Locação de Veículo
 * 12 cláusulas com cores interativas por tipo
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Car,
  Clock,
  DollarSign,
  Shield,
  AlertTriangle,
  Zap,
  Eye,
  Ban,
  RotateCcw,
  PenLine,
  MapPin,
} from "lucide-react";

interface RentalContractProps {
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  ownerName?: string;
  ownerCpf?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  renterName?: string;
  renterCpf?: string;
  renterCnh?: string;
  renterCnhCategory?: string;
  renterCnhExpiry?: string;
  renterEmail?: string;
  renterPhone?: string;
  startDate?: string;
  endDate?: string;
  dailyRate?: string;
  totalAmount?: string;
  vehicleCity?: string;
  vehicleState?: string;
  dailyKmLimit?: number;
  extraKmPrice?: number;
  securityDeposit?: string;
  serviceFee?: string;
}

// Color scheme per clause type
const clauseStyles = {
  info: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    header: "text-cyan-400",
    badge: "bg-cyan-500/20 text-cyan-300",
    icon: "text-cyan-400",
    bullet: "bg-cyan-500",
    badgeLabel: "Informativo",
  },
  warning: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    header: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-300",
    icon: "text-yellow-400",
    bullet: "bg-yellow-500",
    badgeLabel: "Atenção",
  },
  danger: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    header: "text-red-400",
    badge: "bg-red-500/20 text-red-300",
    icon: "text-red-400",
    bullet: "bg-red-500",
    badgeLabel: "Crítico",
  },
  success: {
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    header: "text-green-400",
    badge: "bg-green-500/20 text-green-300",
    icon: "text-green-400",
    bullet: "bg-green-500",
    badgeLabel: "Proteção",
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    header: "text-purple-400",
    badge: "bg-purple-500/20 text-purple-300",
    icon: "text-purple-400",
    bullet: "bg-purple-500",
    badgeLabel: "Legal",
  },
};

type ClauseType = keyof typeof clauseStyles;

interface ClauseProps {
  number: number;
  title: string;
  type: ClauseType;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Clause({ number, title, type, icon, children, defaultOpen = false }: ClauseProps) {
  const [open, setOpen] = useState(defaultOpen);
  const style = clauseStyles[type];

  return (
    <section
      className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all duration-200`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:brightness-110 transition-all"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${style.border} ${style.bg} ${style.header}`}
          >
            {number}
          </span>
          <span className={`font-bold text-sm ${style.header}`}>{title}</span>
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
            {style.badgeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`${style.icon}`}>{icon}</span>
          {open ? (
            <ChevronUp className={`w-4 h-4 ${style.icon}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${style.icon}`} />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 text-sm text-gray-300 space-y-2 border-t border-white/5">
          {children}
        </div>
      )}
    </section>
  );
}

function BulletItem({ type, children }: { type: ClauseType; children: React.ReactNode }) {
  const style = clauseStyles[type];
  return (
    <li className="flex items-start gap-2 py-0.5">
      <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${style.bullet}`} />
      <span>{children}</span>
    </li>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-1 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-xs min-w-[140px]">{label}:</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

export default function RentalContract({
  vehicleModel = "[MODELO DO VEÍCULO]",
  vehiclePlate = "[PLACA]",
  vehicleYear = "[ANO]",
  vehicleColor = "[COR]",
  ownerName = "[PROPRIETÁRIO]",
  ownerCpf = "[CPF/CNPJ]",
  ownerEmail = "[EMAIL]",
  ownerPhone = "[TELEFONE]",
  renterName = "[LOCATÁRIO]",
  renterCpf = "[CPF]",
  renterCnh = "[CNH]",
  renterCnhCategory = "[CATEGORIA]",
  renterCnhExpiry = "[VALIDADE]",
  renterEmail = "[EMAIL]",
  renterPhone = "[TELEFONE]",
  startDate = "[DATA INÍCIO]",
  endDate = "[DATA FIM]",
  dailyRate = "R$ [DIÁRIA]",
  totalAmount = "R$ [VALOR TOTAL]",
  vehicleCity = "São Paulo",
  vehicleState = "SP",
  dailyKmLimit = 100,
  extraKmPrice = 0.5,
  securityDeposit = "R$ [CAUÇÃO]",
  serviceFee = "R$ [TAXA]",
}: RentalContractProps) {
  return (
    <Card className="w-full bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20">
      <CardHeader className="border-b border-cyan-500/20 pb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <FileText className="w-7 h-7 text-cyan-400" />
          </div>
        </div>
        <CardTitle className="text-center text-xl font-bold text-white leading-tight">
          CONTRATO PARTICULAR DE INTERMEDIAÇÃO<br />E LOCAÇÃO DE VEÍCULO
        </CardTitle>
        <p className="text-center text-sm text-cyan-400 mt-1 font-semibold">
          RIDDY TECNOLOGIA LTDA — CNPJ 65.901.010/0001-43
        </p>
        <p className="text-center text-xs text-gray-500 mt-1">
          Versão 2.0 — Válido para todas as locações intermediadas pela plataforma RIDDY
        </p>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {Object.entries(clauseStyles).map(([key, val]) => (
            <span key={key} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${val.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${val.bullet}`} />
              {val.badgeLabel}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <ScrollArea className="h-[calc(100svh-320px)] max-h-[560px] min-h-[280px] w-full rounded-lg border border-cyan-500/20 bg-slate-950/50 p-4">
          <div className="space-y-3 text-sm">

            {/* ─── DAS PARTES ─── */}
            <Clause number={0} title="DAS PARTES" type="info" icon={<Users className="w-4 h-4" />} defaultOpen={true}>
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-2">RIDDY TECNOLOGIA LTDA</p>
                  <DataRow label="CNPJ" value="65.901.010/0001-43" />
                  <p className="text-gray-400 text-xs mt-1">
                    Plataforma tecnológica de intermediação de locação de veículos peer-to-peer. Não é proprietária do veículo, transportadora, seguradora ou responsável pela condução.
                  </p>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-2">ANFITRIÃO / LOCADOR</p>
                  <DataRow label="Nome" value={ownerName} />
                  <DataRow label="CPF/CNPJ" value={ownerCpf} />
                  <DataRow label="E-mail" value={ownerEmail} />
                  <DataRow label="Telefone" value={ownerPhone} />
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-2">LOCATÁRIO</p>
                  <DataRow label="Nome" value={renterName} />
                  <DataRow label="CPF" value={renterCpf} />
                  <DataRow label="CNH nº" value={renterCnh} />
                  <DataRow label="Categoria" value={renterCnhCategory} />
                  <DataRow label="Validade CNH" value={renterCnhExpiry} />
                  <DataRow label="E-mail" value={renterEmail} />
                  <DataRow label="Telefone" value={renterPhone} />
                </div>
              </div>
            </Clause>

            {/* ─── CLÁUSULA 1 — OBJETO ─── */}
            <Clause number={1} title="OBJETO" type="info" icon={<Car className="w-4 h-4" />} defaultOpen={true}>
              <p className="mt-2 text-gray-300">
                O presente contrato tem por objeto a locação temporária do veículo abaixo descrito, intermediada pela plataforma RIDDY:
              </p>
              <div className="mt-3 bg-slate-900/60 rounded-lg p-3 border border-cyan-500/20">
                <DataRow label="Marca/Modelo" value={vehicleModel} />
                <DataRow label="Ano/Modelo" value={vehicleYear} />
                <DataRow label="Placa" value={vehiclePlate} />
                <DataRow label="Cor" value={vehicleColor} />
              </div>
              <p className="mt-2 text-gray-400 text-xs">
                1.2. A RIDDY atua exclusivamente como plataforma tecnológica de intermediação, não sendo proprietária do veículo, transportadora, seguradora ou responsável pela condução.
              </p>
              <p className="text-gray-400 text-xs">
                1.3. O LOCATÁRIO declara estar plenamente apto para condução do veículo, possuindo CNH válida, regular e compatível com a categoria exigida.
              </p>
            </Clause>

            {/* ─── CLÁUSULA 2 — PRAZO ─── */}
            <Clause number={2} title="PRAZO DA LOCAÇÃO" type="warning" icon={<Clock className="w-4 h-4" />}>
              <div className="mt-3 bg-slate-900/60 rounded-lg p-3 border border-yellow-500/20">
                <DataRow label="Início" value={startDate} />
                <DataRow label="Término" value={endDate} />
              </div>
              <ul className="mt-2 space-y-1">
                <BulletItem type="warning">
                  2.2. A devolução fora do prazo implicará cobrança proporcional de diária adicional, multa contratual e demais encargos previstos neste contrato.
                </BulletItem>
                <BulletItem type="warning">
                  2.3. O atraso superior a 3 (três) horas poderá caracterizar retenção indevida do veículo, autorizando medidas administrativas, bloqueios de plataforma, acionamento de rastreamento e medidas judiciais cabíveis.
                </BulletItem>
              </ul>
            </Clause>

            {/* ─── CLÁUSULA 3 — VALORES ─── */}
            <Clause number={3} title="VALORES E PAGAMENTOS" type="info" icon={<DollarSign className="w-4 h-4" />}>
              <div className="mt-3 bg-slate-900/60 rounded-lg p-3 border border-cyan-500/20">
                <DataRow label="Valor Total" value={totalAmount} />
                <DataRow label="Diária" value={dailyRate} />
                <DataRow label="Taxa de Serviço" value={serviceFee} />
                <DataRow label="Caução/Depósito" value={securityDeposit} />
              </div>
              <p className="mt-2 text-gray-400 text-xs">3.2. Poderão ser adicionados:</p>
              <ul className="mt-1 space-y-0.5">
                {["taxa de serviço da plataforma", "caução/depósito de segurança", "taxas administrativas", "multas", "pedágios", "avarias", "lavagem", "combustível", "franquias de seguro", "diárias excedentes"].map((item) => (
                  <BulletItem key={item} type="info">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs">
                3.3. O pagamento poderá ocorrer via cartão, PIX, split payment, carteira digital ou outro meio disponibilizado pela RIDDY.
              </p>
              <p className="mt-1 text-gray-400 text-xs">
                3.4. A caução/depósito será devolvida ao LOCATÁRIO em até <strong className="text-white">7 (sete) dias úteis</strong> após a devolução do veículo em bom estado, sem avarias, multas pendentes ou responsabilidades abertas.
              </p>
              <p className="mt-1 text-gray-400 text-xs">
                3.5. A caução poderá permanecer retida por até 90 (noventa) dias após encerramento da locação para análise de multas, avarias ocultas, sinistros ou responsabilidades posteriores.
              </p>
            </Clause>

            {/* ─── CLÁUSULA 4 — RESPONSABILIDADE DO LOCATÁRIO ─── */}
            <Clause number={4} title="RESPONSABILIDADE DO LOCATÁRIO" type="danger" icon={<AlertTriangle className="w-4 h-4" />}>
              <p className="mt-2 text-gray-300">
                4.1. O LOCATÁRIO assume <strong className="text-red-300">integral responsabilidade civil, administrativa, financeira e criminal</strong> pela posse e utilização do veículo durante todo o período da locação.
              </p>
              <p className="mt-2 text-gray-400 text-xs font-semibold">4.2. O LOCATÁRIO compromete-se a NÃO:</p>
              <ul className="mt-1 space-y-0.5">
                {[
                  "dirigir sob efeito de álcool, drogas ou substâncias ilícitas",
                  "praticar direção perigosa",
                  "participar de corridas, manobras, competições ou atos ilícitos",
                  "transportar cargas ilícitas",
                  "sublocar ou emprestar a terceiros",
                  "utilizar para transporte remunerado sem autorização expressa",
                  "sair do território autorizado pela plataforma",
                ].map((item) => (
                  <BulletItem key={item} type="danger">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs font-semibold">4.3. O LOCATÁRIO responderá integralmente por:</p>
              <ul className="mt-1 space-y-0.5">
                {[
                  "colisões e perda total",
                  "danos mecânicos por mau uso (motor, câmbio, suspensão)",
                  "danos internos, elétricos, lataria e acessórios",
                  "pneus e rodas",
                  "multas, apreensões e guinchos",
                  "despesas judiciais e honorários advocatícios",
                  "lucros cessantes e desvalorização do veículo",
                  "indisponibilidade operacional",
                ].map((item) => (
                  <BulletItem key={item} type="danger">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs">
                4.4. Caso o veículo permaneça indisponível para novas locações em razão de danos causados pelo LOCATÁRIO, este deverá indenizar o LOCADOR e a RIDDY pelos lucros cessantes correspondentes ao período de paralisação.
              </p>
            </Clause>

            {/* ─── CLÁUSULA 5 — MULTAS E INFRAÇÕES ─── */}
            <Clause number={5} title="MULTAS E INFRAÇÕES" type="danger" icon={<Ban className="w-4 h-4" />}>
              <ul className="mt-2 space-y-1">
                <BulletItem type="danger">
                  5.1. Todas as multas ocorridas durante o período da locação serão integralmente de responsabilidade do LOCATÁRIO.
                </BulletItem>
                <BulletItem type="danger">
                  5.2. O LOCATÁRIO autoriza a identificação de condutor junto aos órgãos competentes.
                </BulletItem>
                <BulletItem type="danger">
                  5.3. Além da multa original, poderá ser cobrada taxa administrativa operacional.
                </BulletItem>
              </ul>
            </Clause>

            {/* ─── CLÁUSULA 6 — SINISTROS E ACIDENTES ─── */}
            <Clause number={6} title="SINISTROS E ACIDENTES" type="warning" icon={<Zap className="w-4 h-4" />}>
              <p className="mt-2 text-gray-300">6.1. Em caso de acidente, roubo, furto, colisão ou qualquer sinistro, o LOCATÁRIO deverá:</p>
              <ul className="mt-1 space-y-0.5">
                {[
                  "comunicar imediatamente a RIDDY",
                  "registrar boletim de ocorrência",
                  "preservar provas",
                  "enviar fotos e vídeos",
                  "colaborar integralmente com seguradora e auditoria",
                ].map((item) => (
                  <BulletItem key={item} type="warning">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs">
                6.2. O descumprimento poderá acarretar perda de qualquer proteção contratual eventualmente existente.
              </p>
              <p className="mt-1 text-gray-400 text-xs">
                6.3. Em casos de dolo, fraude, embriaguez, direção perigosa, omissão, fuga, uso indevido ou condutor não autorizado, o LOCATÁRIO responderá integralmente pelos prejuízos <strong className="text-red-300">sem limitação de responsabilidade</strong>.
              </p>
            </Clause>

            {/* ─── CLÁUSULA 7 — LIMITAÇÃO DE RESPONSABILIDADE DA RIDDY ─── */}
            <Clause number={7} title="LIMITAÇÃO DE RESPONSABILIDADE DA RIDDY" type="success" icon={<Shield className="w-4 h-4" />}>
              <p className="mt-2 text-gray-300">
                7.1. A RIDDY atua exclusivamente como intermediadora tecnológica e <strong className="text-green-300">não responde por</strong>:
              </p>
              <ul className="mt-1 space-y-0.5">
                {[
                  "conduta do LOCADOR ou do LOCATÁRIO",
                  "acidentes, danos morais ou lucros cessantes",
                  "falhas mecânicas preexistentes ou vícios ocultos",
                  "indisponibilidade do veículo",
                  "objetos deixados no automóvel",
                  "perdas indiretas ou eventos de força maior",
                ].map((item) => (
                  <BulletItem key={item} type="success">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs">
                7.4. A RIDDY poderá suspender usuários, bloquear contas, reter valores, cancelar reservas ou negar operações por critérios internos de segurança, compliance e prevenção a fraudes.
              </p>
            </Clause>

            {/* ─── CLÁUSULA 8 — MONITORAMENTO E PRIVACIDADE ─── */}
            <Clause number={8} title="MONITORAMENTO E PRIVACIDADE" type="purple" icon={<Eye className="w-4 h-4" />}>
              <p className="mt-2 text-gray-300">8.1. O LOCATÁRIO autoriza utilização de:</p>
              <ul className="mt-1 space-y-0.5">
                {[
                  "geolocalização e telemetria",
                  "monitoramento e rastreamento",
                  "biometria e validação facial",
                  "auditoria digital e inteligência antifraude",
                ].map((item) => (
                  <BulletItem key={item} type="purple">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs">8.2. Os dados poderão ser compartilhados com seguradoras, autoridades, parceiros, gateways de pagamento, escritórios jurídicos, órgãos de trânsito e empresas de compliance.</p>
              <p className="mt-1 text-gray-400 text-xs">8.3. O tratamento de dados seguirá a legislação aplicável, especialmente a <strong className="text-purple-300">LGPD</strong>.</p>
            </Clause>

            {/* ─── CLÁUSULA 9 — INADIMPLEMENTO ─── */}
            <Clause number={9} title="INADIMPLEMENTO" type="danger" icon={<AlertTriangle className="w-4 h-4" />}>
              <p className="mt-2 text-gray-300">9.1. O inadimplemento autoriza:</p>
              <ul className="mt-1 space-y-0.5">
                {[
                  "cobrança automática e protesto",
                  "negativação e bloqueio de conta",
                  "suspensão da plataforma",
                  "cobrança judicial e execução contratual",
                ].map((item) => (
                  <BulletItem key={item} type="danger">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs">9.2. O LOCATÁRIO responderá por juros de 1% ao mês, correção monetária, multa de 10%, honorários advocatícios e custas judiciais.</p>
            </Clause>

            {/* ─── CLÁUSULA 10 — RESCISÃO ─── */}
            <Clause number={10} title="RESCISÃO" type="warning" icon={<RotateCcw className="w-4 h-4" />}>
              <p className="mt-2 text-gray-300">10.1. O contrato poderá ser rescindido imediatamente em caso de:</p>
              <ul className="mt-1 space-y-0.5">
                {[
                  "fraude ou falsidade documental",
                  "inadimplência ou risco operacional",
                  "violação contratual ou uso ilícito",
                  "ameaça ou má-fé",
                ].map((item) => (
                  <BulletItem key={item} type="warning">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs">10.2. A RIDDY poderá cancelar reservas unilateralmente por critérios de segurança e compliance.</p>
            </Clause>

            {/* ─── CLÁUSULA 11 — ASSINATURA ELETRÔNICA ─── */}
            <Clause number={11} title="ASSINATURA ELETRÔNICA" type="success" icon={<PenLine className="w-4 h-4" />}>
              <p className="mt-2 text-gray-300">11.1. As partes reconhecem validade jurídica de:</p>
              <ul className="mt-1 space-y-0.5">
                {[
                  "assinatura eletrônica e aceite digital",
                  "biometria, IP, logs e token",
                  "selfie e validações realizadas pela plataforma",
                ].map((item) => (
                  <BulletItem key={item} type="success">{item}</BulletItem>
                ))}
              </ul>
              <p className="mt-2 text-gray-400 text-xs">
                11.2. Este contrato possui <strong className="text-green-300">força executiva extrajudicial</strong>, nos termos da legislação brasileira.
              </p>
            </Clause>

            {/* ─── CLÁUSULA 12 — FORO ─── */}
            <Clause number={12} title="FORO" type="purple" icon={<MapPin className="w-4 h-4" />}>
              <p className="mt-2 text-gray-300">
                12.1. Fica eleito o foro da comarca de <strong className="text-purple-300">{vehicleCity}/{vehicleState}</strong>, com renúncia de qualquer outro, por mais privilegiado que seja.
              </p>
            </Clause>

            <Separator className="bg-cyan-500/20 my-2" />

            {/* ─── DECLARAÇÃO FINAL ─── */}
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4">
              <p className="text-cyan-400 font-bold text-sm mb-2">DECLARAÇÃO FINAL DO LOCATÁRIO</p>
              <ul className="space-y-1">
                {[
                  "Declaro ter lido integralmente o presente contrato",
                  "Concordo com todas as cláusulas e condições",
                  "Possuo capacidade civil plena",
                  "Assumo integral responsabilidade pelo veículo durante a locação",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-300 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-cyan-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
