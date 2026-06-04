/**
 * Identity Verification Page
 * Post-payment mandatory step: CNH photo + selfie with CNH
 * Uses native camera capture (no gallery upload allowed)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Camera,
  CheckCircle2,
  RefreshCw,
  Shield,
  AlertCircle,
  ChevronRight,
  Clock,
  FileText,
  User,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type VerificationStep = "intro" | "cnh" | "selfie" | "review" | "submitted";

interface CapturedImage {
  dataUrl: string;
}

export default function IdentityVerification() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = parseInt(params.bookingId || "0");
  const [, navigate] = useLocation();

  const [step, setStep] = useState<VerificationStep>("intro");
  const [cnhImage, setCnhImage] = useState<CapturedImage | null>(null);
  const [selfieImage, setSelfieImage] = useState<CapturedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch booking
  const { data: bookingData } = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: bookingId > 0 }
  );

  // Check if verification already exists
  const { data: verificationData } = trpc.bookingVerification.getByBooking.useQuery(
    { bookingId },
    { enabled: bookingId > 0 }
  );

  const submitVerification = trpc.bookingVerification.submit.useMutation({
    onSuccess: () => {
      setStep("submitted");
      setIsUploading(false);
      toast.success("Documentos enviados com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar documentos");
      setIsUploading(false);
    },
  });

  // Handle existing verification state
  useEffect(() => {
    if (!verificationData) return;
    if (verificationData.status === "approved") {
      setStep("submitted"); // will show approved state
    } else if (verificationData.status === "pending_review") {
      setStep("submitted"); // show pending state
    }
    // if rejected → stay on intro so user can resubmit
  }, [verificationData]);

  // Start camera
  const startCamera = useCallback(async (mode: "environment" | "user" = "environment") => {
    setCameraError(null);
    setCameraActive(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Permissão de câmera negada. Permita o acesso nas configurações do navegador."
          : "Não foi possível acessar a câmera. Verifique se ela está disponível."
      );
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Capture photo
  const capturePhoto = useCallback((): CapturedImage | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { dataUrl };
  }, [facingMode]);

  // Camera lifecycle with steps
  useEffect(() => {
    if (step === "cnh") {
      setFacingMode("environment");
      startCamera("environment");
    } else if (step === "selfie") {
      setFacingMode("user");
      startCamera("user");
    } else {
      stopCamera();
    }
  }, [step]);

  // Cleanup
  useEffect(() => () => stopCamera(), []);

  const handleCaptureCnh = () => {
    const photo = capturePhoto();
    if (photo) { setCnhImage(photo); stopCamera(); }
  };

  const handleCaptureSelfie = () => {
    const photo = capturePhoto();
    if (photo) { setSelfieImage(photo); stopCamera(); }
  };

  const handleRetake = (type: "cnh" | "selfie") => {
    if (type === "cnh") { setCnhImage(null); setStep("cnh"); }
    else { setSelfieImage(null); setStep("selfie"); }
  };

  const handleSubmit = async () => {
    if (!cnhImage || !selfieImage) {
      toast.error("Por favor, capture as duas fotos antes de enviar.");
      return;
    }
    setIsUploading(true);
    submitVerification.mutate({
      bookingId,
      cnhImageBase64: cnhImage.dataUrl,
      selfieImageBase64: selfieImage.dataUrl,
    });
  };

  const toggleCamera = () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <p className="text-white">Reserva não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />
      <main className="container max-w-2xl mx-auto py-12 px-4">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {step === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* Rejection banner */}
              {verificationData?.status === "rejected" && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-red-400 font-semibold mb-1">Verificação Rejeitada</p>
                      <p className="text-gray-300 text-sm">{verificationData.rejectionReason || "Seus documentos não foram aceitos."}</p>
                      <p className="text-gray-400 text-xs mt-2">Por favor, tire novas fotos seguindo as instruções abaixo.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-cyan-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {verificationData?.status === "rejected" ? "Reenviar Documentos" : "Último passo para confirmar sua locação"}
                </h1>
                <p className="text-gray-400">Para sua segurança e a do proprietário, precisamos verificar sua identidade.</p>
              </div>

              {bookingData && (
                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Reserva #RDY-{bookingId.toString().padStart(6, "0")}</p>
                      <p className="text-gray-400 text-sm">Aguardando verificação de identidade</p>
                    </div>
                    <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white/5 border-white/10 mb-6">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-white font-semibold">O que você vai precisar:</h3>
                  {[
                    { num: "1", title: "Foto da CNH", desc: "Tire uma foto clara da sua CNH (frente). A câmera traseira será usada automaticamente." },
                    { num: "2", title: "Selfie segurando a CNH", desc: "Tire uma selfie com seu rosto e a CNH visível ao lado. A câmera frontal será usada." },
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                        <span className="text-cyan-400 font-bold">{item.num}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.title}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                    <p className="text-cyan-400 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      Processo rápido — menos de 2 minutos. Revisão em até 24h.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {verificationData?.status === "rejected" && (
                <Card className="bg-red-500/10 border-red-500/30 mb-6">
                  <CardContent className="p-4">
                    <p className="text-red-400 font-semibold flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4" />Verificação Rejeitada
                    </p>
                    {verificationData.rejectionReason && (
                      <p className="text-gray-400 text-sm">Motivo: {verificationData.rejectionReason}</p>
                    )}
                    <p className="text-gray-400 text-sm mt-2">Por favor, envie novos documentos para continuar.</p>
                  </CardContent>
                </Card>
              )}

              <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold py-6 text-lg" onClick={() => setStep("cnh")}>
                Começar Verificação <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* ── CNH CAPTURE ── */}
          {step === "cnh" && (
            <motion.div key="cnh" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm">1</div>
                <div>
                  <h2 className="text-xl font-bold text-white">Foto da CNH</h2>
                  <p className="text-gray-400 text-sm">Etapa 1 de 2</p>
                </div>
                <Badge className="ml-auto bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Câmera Traseira</Badge>
              </div>

              {cameraError ? (
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white font-semibold mb-2">Câmera indisponível</p>
                    <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
                    <Button variant="outline" className="border-white/20 text-white" onClick={() => startCamera("environment")}>Tentar novamente</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative bg-black aspect-video">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      {!cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-2 border-cyan-400/70 rounded-xl w-4/5 h-3/5 flex items-center justify-center">
                          <p className="text-cyan-400/80 text-xs font-medium bg-black/50 px-2 py-1 rounded">Posicione a CNH aqui</p>
                        </div>
                      </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="p-4 space-y-3">
                      <p className="text-gray-400 text-sm text-center">CNH bem iluminada e dados legíveis.</p>
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" onClick={toggleCamera}>
                          <RefreshCw className="w-4 h-4 mr-2" />Trocar Câmera
                        </Button>
                        <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold" onClick={handleCaptureCnh} disabled={!cameraActive}>
                          <Camera className="w-4 h-4 mr-2" />Capturar Foto
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {cnhImage && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" />Foto capturada</p>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => { setCnhImage(null); startCamera("environment"); }}>
                          <X className="w-4 h-4 mr-1" />Refazer
                        </Button>
                      </div>
                      <img src={cnhImage.dataUrl} alt="CNH" className="w-full rounded-lg object-cover max-h-48" />
                      <Button className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold" onClick={() => setStep("selfie")}>
                        Continuar para Selfie <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── SELFIE CAPTURE ── */}
          {step === "selfie" && (
            <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm">2</div>
                <div>
                  <h2 className="text-xl font-bold text-white">Selfie com CNH</h2>
                  <p className="text-gray-400 text-sm">Etapa 2 de 2</p>
                </div>
                <Badge className="ml-auto bg-purple-500/20 text-purple-400 border-purple-500/30">Câmera Frontal</Badge>
              </div>

              {cameraError ? (
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white font-semibold mb-2">Câmera indisponível</p>
                    <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
                    <Button variant="outline" className="border-white/20 text-white" onClick={() => startCamera("user")}>Tentar novamente</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative bg-black aspect-video">
                      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
                      {!cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex flex-col items-center gap-2">
                          <div className="border-2 border-purple-400/70 rounded-full w-32 h-32 flex items-center justify-center">
                            <User className="w-8 h-8 text-purple-400/50" />
                          </div>
                          <p className="text-purple-400/80 text-xs font-medium bg-black/50 px-2 py-1 rounded">Rosto + CNH visível</p>
                        </div>
                      </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="p-4 space-y-3">
                      <p className="text-gray-400 text-sm text-center">Segure a CNH ao lado do rosto, ambos visíveis e nítidos.</p>
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" onClick={toggleCamera}>
                          <RefreshCw className="w-4 h-4 mr-2" />Trocar Câmera
                        </Button>
                        <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold" onClick={handleCaptureSelfie} disabled={!cameraActive}>
                          <Camera className="w-4 h-4 mr-2" />Capturar Selfie
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selfieImage && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" />Selfie capturada</p>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => { setSelfieImage(null); startCamera("user"); }}>
                          <X className="w-4 h-4 mr-1" />Refazer
                        </Button>
                      </div>
                      <img src={selfieImage.dataUrl} alt="Selfie" className="w-full rounded-lg object-cover max-h-48" />
                      <Button className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold" onClick={() => setStep("review")}>
                        Revisar e Enviar <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <Button variant="ghost" className="w-full mt-4 text-gray-400 hover:text-white" onClick={() => setStep("cnh")}>
                ← Voltar para foto da CNH
              </Button>
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Revisar Documentos</h2>
                <p className="text-gray-400">Confirme que as fotos estão nítidas antes de enviar.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "CNH", icon: FileText, image: cnhImage, type: "cnh" as const },
                  { label: "Selfie + CNH", icon: User, image: selfieImage, type: "selfie" as const },
                ].map(({ label, icon: Icon, image, type }) => (
                  <Card key={type} className="bg-white/5 border-white/10">
                    <CardContent className="p-3">
                      <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                        <Icon className="w-3 h-3" />{label}
                      </p>
                      {image && <img src={image.dataUrl} alt={label} className="w-full rounded-lg object-cover aspect-video" />}
                      <Button variant="ghost" size="sm" className="w-full mt-2 text-gray-400 hover:text-white text-xs" onClick={() => handleRetake(type)}>
                        <RefreshCw className="w-3 h-3 mr-1" />Refazer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-white/5 border-white/10 mb-6">
                <CardContent className="p-4">
                  <ul className="space-y-2 text-sm">
                    {["Foto da CNH nítida e legível", "Rosto visível na selfie", "CNH visível ao lado do rosto na selfie", "Boa iluminação em ambas as fotos"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold py-6 text-lg" onClick={handleSubmit} disabled={isUploading || submitVerification.isPending}>
                {isUploading || submitVerification.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Enviando documentos...</>
                ) : (
                  <><Shield className="w-5 h-5 mr-2" />Enviar para Verificação</>
                )}
              </Button>
            </motion.div>
          )}

          {/* ── SUBMITTED ── */}
          {step === "submitted" && (
            <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center">
                {verificationData?.status === "approved" ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12 text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Identidade Verificada!</h1>
                    <p className="text-gray-400 mb-2">Sua identidade foi confirmada com sucesso.</p>
                    <p className="text-green-400 font-medium mb-8">Sua reserva está confirmada e pronta para uso.</p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-12 h-12 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Documentos Enviados!</h1>
                    <p className="text-gray-400 mb-2">Sua verificação está sendo analisada pela nossa equipe.</p>
                    <p className="text-cyan-400 font-medium mb-8">Você receberá uma notificação em até 24 horas.</p>
                  </>
                )}

                <Card className="bg-white/5 border-white/10 mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-gray-400 text-sm">Reserva</p>
                      <p className="text-white font-mono font-bold">#RDY-{bookingId.toString().padStart(6, "0")}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-sm">Status da Verificação</p>
                      {verificationData?.status === "approved" ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprovada</Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Em Análise</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold" onClick={() => navigate("/my-bookings")}>
                    Ver Minhas Reservas
                  </Button>
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => navigate("/")}>
                    Voltar ao Início
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
