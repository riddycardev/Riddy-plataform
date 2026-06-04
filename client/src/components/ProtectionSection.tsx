/**
 * Protection Section Component
 * Displays "Proteção da Locação" (Security Deposit Protection) with slider and competitiveness indicator
 * Allows hosts to adjust guarantee amount and see impact on booking appeal
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

interface ProtectionSectionProps {
  dailyPrice: number;
  guaranteeAdjusted: number;
  onGuaranteeChange: (value: number) => void;
}

export default function ProtectionSection({
  dailyPrice,
  guaranteeAdjusted,
  onGuaranteeChange,
}: ProtectionSectionProps) {
  // Calculate the guarantee amount based on daily price and adjustment
  const calculateGuarantee = (dailyRate: number, adjustment: number) => {
    if (!dailyRate || dailyRate <= 0) return 0;
    
    // Default is 5x daily rate (adjustment = 100)
    const baseGuarantee = dailyRate * 5;
    const adjustedGuarantee = (baseGuarantee * adjustment) / 100;
    
    // Apply limits: R$500 - R$5000
    const MIN_GUARANTEE = 500;
    const MAX_GUARANTEE = 5000;
    
    return Math.max(MIN_GUARANTEE, Math.min(MAX_GUARANTEE, adjustedGuarantee));
  };

  const currentGuarantee = useMemo(
    () => calculateGuarantee(dailyPrice, guaranteeAdjusted),
    [dailyPrice, guaranteeAdjusted]
  );

  // Determine competitiveness indicator based on adjustment
  const getCompetitivenessIndicator = (adjustment: number) => {
    if (adjustment < 80) {
      return { emoji: "🟢", label: "Muito Competitivo", description: "Caução baixa = mais reservas" };
    } else if (adjustment <= 120) {
      return { emoji: "🟡", label: "Competitivo", description: "Caução equilibrada = bom balanço" };
    } else {
      return { emoji: "🔴", label: "Menos Competitivo", description: "Caução alta = menos reservas" };
    }
  };

  const competitiveness = getCompetitivenessIndicator(guaranteeAdjusted);

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          Proteção da Locação
        </CardTitle>
        <CardDescription>
          Ajuste o valor da garantia reembolsável para equilibrar proteção e competitividade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Guarantee Display */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Garantia Reembolsável</p>
              <p className="text-3xl font-bold text-cyan-400">
                R$ {currentGuarantee.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Baseado em R$ {dailyPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / dia
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl mb-2">{competitiveness.emoji}</p>
              <p className="text-sm font-semibold text-white">{competitiveness.label}</p>
              <p className="text-xs text-gray-400">{competitiveness.description}</p>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white font-semibold">Ajuste de Proteção</Label>
            <span className="text-sm text-cyan-400 font-medium">{guaranteeAdjusted}%</span>
          </div>
          
          <input
            type="range"
            min="0"
            max="200"
            value={guaranteeAdjusted}
            onChange={(e) => onGuaranteeChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            style={{
              background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${guaranteeAdjusted}%, rgba(255,255,255,0.1) ${guaranteeAdjusted}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Menor Proteção</span>
            <span>Padrão (5x)</span>
            <span>Maior Proteção</span>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Explanation Box */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-gray-300">
              <p className="font-semibold text-white">Como funciona a Garantia Reembolsável?</p>
              <ul className="space-y-1 text-xs">
                <li>• <span className="text-gray-400">Valor padrão:</span> 5x a diária (100%)</li>
                <li>• <span className="text-gray-400">Reduzir para &lt;100%:</span> Aumenta competitividade, mas reduz proteção</li>
                <li>• <span className="text-gray-400">Aumentar para &gt;100%:</span> Maior proteção, mas menos reservas</li>
                <li>• <span className="text-gray-400">Devolução:</span> Liberada em até 7 dias úteis após entrega sem avarias</li>
                <li>• <span className="text-gray-400">Retenção:</span> Apenas em caso de danos comprovados</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <p className="text-sm text-amber-100 font-semibold mb-2">💡 Dica para Hosts</p>
          <p className="text-xs text-amber-200/80">
            {guaranteeAdjusted < 80
              ? "Sua caução está baixa. Isso atrai mais locatários, mas oferece menos proteção. Considere aumentar se tiver histórico de danos."
              : guaranteeAdjusted <= 120
              ? "Sua caução está equilibrada. Oferece boa proteção mantendo competitividade no mercado."
              : "Sua caução está alta. Oferece máxima proteção, mas pode reduzir o número de reservas. Considere reduzir se tiver muitas cancelações."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
