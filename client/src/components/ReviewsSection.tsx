/**
 * ReviewsSection - Seção de avaliações do Host Dashboard
 * Extraído como componente separado para evitar hooks condicionais
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ReviewsSection() {
  const { data: hostReviews, isLoading: loadingReviews } = trpc.review.getHostReviews.useQuery();

  const averageRating =
    hostReviews && hostReviews.length > 0
      ? (hostReviews.reduce((acc, r) => acc + r.rating, 0) / hostReviews.length).toFixed(1)
      : "0.0";

  return (
    <Card className="bg-slate-900/50 border-emerald-500/20">
      <CardHeader>
        <CardTitle className="text-white">Avaliações dos Locatários</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingReviews ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : hostReviews && hostReviews.length > 0 ? (
          <>
            <div className="text-center py-8 mb-6 border-b border-emerald-500/20">
              <div className="flex justify-center mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        i < Math.floor(parseFloat(averageRating)) ? "bg-yellow-400" : "bg-gray-700"
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-2">{averageRating} de 5.0</p>
              <p className="text-gray-400">Baseado em {hostReviews.length} avaliações</p>
            </div>

            <div className="space-y-4">
              {hostReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-slate-800/50 rounded-lg border border-emerald-500/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-600"}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {review.comment && <p className="text-gray-300 text-sm">{review.comment}</p>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma avaliação recebida ainda</p>
            <p className="text-sm text-gray-500 mt-2">
              Suas avaliações aparecerão aqui após viagens completadas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
