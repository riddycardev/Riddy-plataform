/**
 * ReviewPage — Real review submission form
 * Route: /bookings/:id/review
 * Connects to trpc.review.create (backend already implemented)
 */

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Star, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hovered || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const bookingId = parseInt(id || "0", 10);

  // Fetch booking details to get vehicleId, hostId, and status
  const { data, isLoading, error } = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: !!bookingId && !!user }
  );

  // Rating state
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const utils = trpc.useUtils();

  const createReviewMutation = trpc.review.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.booking.getById.invalidate({ id: bookingId });
      toast.success("Avaliação enviada! Obrigado pelo seu feedback.");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar avaliação. Tente novamente.");
    },
  });

  const handleSubmit = () => {
    if (overallRating === 0) {
      toast.error("Por favor, selecione pelo menos a nota geral (1 a 5 estrelas).");
      return;
    }

    if (!data) return;
    const booking = data as any;

    createReviewMutation.mutate({
      bookingId,
      vehicleId: booking.vehicleId,
      revieweeId: booking.hostId,
      reviewType: "renter_to_vehicle",
      rating: overallRating,
      comment: comment.trim() || undefined,
      cleanlinessRating: cleanlinessRating > 0 ? cleanlinessRating : undefined,
      communicationRating: communicationRating > 0 ? communicationRating : undefined,
      accuracyRating: accuracyRating > 0 ? accuracyRating : undefined,
      valueRating: valueRating > 0 ? valueRating : undefined,
    });
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-gray-400">Reserva não encontrada ou acesso negado.</p>
        <Button variant="outline" onClick={() => navigate("/my-bookings")}>
          Voltar para Minhas Reservas
        </Button>
      </div>
    );
  }

  const booking = data as any;
  const vehicle = (data as any).vehicle;

  // ── Only completed bookings can be reviewed ──────────────────────────────────
  if (booking.status !== "completed") {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center gap-4 text-white px-4">
        <p className="text-gray-400 text-center">
          Você só pode avaliar reservas que já foram concluídas.
        </p>
        <Button variant="outline" onClick={() => navigate(`/bookings/${bookingId}`)}>
          Ver Reserva
        </Button>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center gap-6 px-4">
        <CheckCircle2 className="w-16 h-16 text-green-400" />
        <h2 className="text-2xl font-bold text-white text-center">Avaliação enviada!</h2>
        <p className="text-gray-400 text-center max-w-sm">
          Obrigado pelo seu feedback. Ele ajuda outros locatários e melhora a comunidade RIDDY.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => navigate("/my-bookings")}
          >
            Minhas Reservas
          </Button>
          <Button
            className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold"
            onClick={() => navigate("/")}
          >
            Explorar Veículos
          </Button>
        </div>
      </div>
    );
  }

  // ── Review form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0F1C] py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(`/bookings/${bookingId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a reserva
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Avaliar Experiência</h1>
          {vehicle && (
            <p className="text-gray-400 text-sm">
              {vehicle.brand} {vehicle.model} {vehicle.year} · Reserva #{String(bookingId).padStart(6, "0")}
            </p>
          )}
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-base">Sua avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall rating — required */}
            <div>
              <StarRating
                label="Nota geral *"
                value={overallRating}
                onChange={setOverallRating}
              />
              {overallRating > 0 && (
                <p className="text-xs text-cyan-400 mt-1">
                  {["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"][overallRating]}
                </p>
              )}
            </div>

            {/* Sub-ratings — optional */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <StarRating
                label="Limpeza"
                value={cleanlinessRating}
                onChange={setCleanlinessRating}
              />
              <StarRating
                label="Comunicação"
                value={communicationRating}
                onChange={setCommunicationRating}
              />
              <StarRating
                label="Precisão do anúncio"
                value={accuracyRating}
                onChange={setAccuracyRating}
              />
              <StarRating
                label="Custo-benefício"
                value={valueRating}
                onChange={setValueRating}
              />
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Comentário (opcional)</label>
              <Textarea
                placeholder="Conte como foi sua experiência com este veículo e anfitrião..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 resize-none min-h-[100px]"
                maxLength={1000}
              />
              <p className="text-xs text-gray-600 text-right">{comment.length}/1000</p>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={createReviewMutation.isPending || overallRating === 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold disabled:opacity-50"
            >
              {createReviewMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Avaliação"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
