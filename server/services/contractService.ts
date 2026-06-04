/**
 * Contract PDF Generation Service
 * Generates RIDDY rental contracts with dynamic data from bookings
 */

import PDFDocument from 'pdfkit';
import { Booking, User, Vehicle } from '../../drizzle/schema';
import { storagePut } from '../storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import crypto from 'crypto';

/** Generate SHA-256 hash of contract content for integrity verification */
function generateContractHash(data: ContractData): string {
  const b = data.booking as any;
  const content = [
    `booking:${b.id}`,
    `renter:${b.renterFullName || data.renter.name}`,
    `cpf:${b.renterCpf || data.renter.cpf || ''}`,
    `vehicle:${data.vehicle.licensePlate}`,
    `start:${b.startDate}`,
    `end:${b.endDate}`,
    `total:${b.totalAmount}`,
    `accepted_at:${b.contractAcceptedAt || ''}`,
    `accepted_ip:${b.contractAcceptedIp || ''}`,
    `otp_channel:${b.contractOtpChannel || 'checkbox'}`,
    `otp_verified_at:${b.contractOtpVerifiedAt || ''}`,
  ].join('|');
  return crypto.createHash('sha256').update(content).digest('hex');
}

interface ContractData {
  booking: Booking;
  vehicle: Vehicle;
  renter: User;
  host: User;
}

const RIDDY_CNPJ = '65.901.010/0001-43';
const RIDDY_ADDRESS = 'São Paulo, SP';
const RIDDY_COMPANY = 'RIDDY TECNOLOGIA LTDA';

/**
 * Generate rental contract PDF with dynamic data
 */
export async function generateContractPDF(data: ContractData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      let buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(buffers);
        
        // Upload to S3
        const fileName = `contracts/booking-${data.booking.id}-${Date.now()}.pdf`;
        const { url } = await storagePut(fileName, pdfBuffer, 'application/pdf');
        
        resolve(url);
      });
      doc.on('error', reject);

      // Generate PDF content
      generateContractContent(doc, data);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function generateContractContent(doc: PDFKit.PDFDocument, data: ContractData): void {
  const { booking, vehicle, renter, host } = data;

  // Helper functions
  const addTitle = (text: string, size = 14) => {
    doc.fontSize(size).font('Helvetica-Bold').text(text, { align: 'center' });
    doc.moveDown(0.5);
  };

  const addSection = (title: string) => {
    doc.fontSize(12).font('Helvetica-Bold').text(title);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
  };

  const addField = (label: string, value: string | null | undefined) => {
    doc.fontSize(10).font('Helvetica-Bold').text(label + ':', { continued: true });
    doc.font('Helvetica').text(' ' + (value || '___________________________'));
    doc.moveDown(0.3);
  };

  const addParagraph = (text: string) => {
    doc.fontSize(10).font('Helvetica').text(text, { align: 'justify' });
    doc.moveDown(0.5);
  };

  // ============================================================
  // HEADER
  // ============================================================
  
  addTitle('CONTRATO PARTICULAR DE INTERMEDIAÇÃO E LOCAÇÃO DE VEÍCULO', 16);
  addTitle(RIDDY_COMPANY, 12);
  doc.moveDown(1);

  // ============================================================
  // DAS PARTES
  // ============================================================

  addSection('DAS PARTES');

  addParagraph(
    `${RIDDY_COMPANY}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${RIDDY_CNPJ}, com sede em ${RIDDY_ADDRESS}, doravante denominada simplesmente RIDDY, plataforma tecnológica de intermediação de locação de veículos peer-to-peer.`
  );

  doc.fontSize(11).font('Helvetica-Bold').text('ANFITRIÃO / LOCADOR');
  doc.moveDown(0.3);
  addField('Nome', host.name);
  addField('CPF/CNPJ', host.cpf || '');
  addField('Endereço', '');
  addField('Telefone', host.phone || '');
  addField('E-mail', host.email);
  doc.moveDown(0.5);

  doc.fontSize(11).font('Helvetica-Bold').text('LOCATÁRIO');
  doc.moveDown(0.3);
  addField('Nome', booking.renterFullName || renter.name);
  addField('CPF', booking.renterCpf || renter.cpf || '');
  addField('CNH nº', renter.cnhNumber || '');
  addField('Categoria', renter.cnhCategory || '');
  addField('Validade da CNH', renter.cnhExpiresAt ? format(new Date(renter.cnhExpiresAt), 'dd/MM/yyyy', { locale: ptBR }) : '');
  // Address — composed from booking fields
  const b = booking as any;
  const addressParts = [
    b.renterAddressStreet,
    b.renterAddressNumber ? `nº ${b.renterAddressNumber}` : null,
    b.renterAddressComplement || null,
    b.renterAddressNeighborhood,
    b.renterAddressCity,
    b.renterAddressState,
    b.renterAddressZipCode ? `CEP ${b.renterAddressZipCode}` : null,
  ].filter(Boolean).join(', ');
  addField('Endereço', addressParts || '');
  addField('Telefone', booking.renterPhone || renter.phone || '');
  addField('E-mail', booking.renterEmail || renter.email || '');
  doc.moveDown(1);

  // ============================================================
  // CLÁUSULA 1 - OBJETO
  // ============================================================

  addSection('CLÁUSULA 1 — OBJETO');

  addParagraph(
    '1.1. O presente contrato tem por objeto a locação temporária do veículo abaixo descrito, intermediada pela plataforma tecnológica da RIDDY:'
  );

  addField('Marca/Modelo', vehicle.model);
  addField('Ano/Modelo', vehicle.year ? vehicle.year.toString() : '');
  addField('Placa', vehicle.licensePlate);
  addField('Cor', vehicle.color || '');
  doc.moveDown(0.5);

  addParagraph(
    '1.2. A RIDDY atua exclusivamente como plataforma tecnológica de intermediação entre LOCADOR e LOCATÁRIO, não sendo proprietária do veículo, transportadora, seguradora ou responsável pela condução do automóvel.'
  );

  addParagraph(
    '1.3. O LOCATÁRIO declara estar plenamente apto para condução do veículo, possuindo CNH válida, regular e compatível com a categoria exigida.'
  );
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 2 - PRAZO DA LOCAÇÃO
  // ============================================================

  addSection('CLÁUSULA 2 — PRAZO DA LOCAÇÃO');

  const startDate = booking.startDate ? format(new Date(booking.startDate), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '';
  const endDate = booking.endDate ? format(new Date(booking.endDate), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '';

  addParagraph(
    `2.1. A locação terá início em ${startDate} e término em ${endDate}.`
  );

  addParagraph(
    '2.2. A devolução fora do prazo implicará cobrança proporcional de diária adicional, multa contratual e demais encargos previstos neste contrato.'
  );

  addParagraph(
    '2.3. O atraso superior a 3 (três) horas poderá caracterizar retenção indevida do veículo, autorizando medidas administrativas, bloqueios de plataforma, acionamento de rastreamento e medidas judiciais cabíveis.'
  );
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 3 - VALORES E PAGAMENTOS
  // ============================================================

  addSection('CLÁUSULA 3 — VALORES E PAGAMENTOS');

  const totalAmount = booking.totalAmount ? `R$ ${parseFloat(booking.totalAmount.toString()).toFixed(2).replace('.', ',')}` : 'R$ 0,00';
  addParagraph(`3.1. O LOCATÁRIO pagará pela locação o valor total de ${totalAmount}.`);

  addParagraph('3.2. Poderão ser adicionados:');
  const charges = [
    '• taxa de serviço da plataforma;',
    '• caução/deposito de segurança;',
    '• taxas administrativas;',
    '• multas;',
    '• pedágios;',
    '• avarias;',
    '• lavagem;',
    '• combustível;',
    '• franquias de seguro;',
    '• custos operacionais;',
    '• diárias excedentes.',
  ];
  charges.forEach(charge => {
    doc.fontSize(10).font('Helvetica').text(charge);
  });
  doc.moveDown(0.5);

  addParagraph(
    '3.3. O pagamento poderá ocorrer via cartão, PIX, split payment, carteira digital ou outro meio disponibilizado pela RIDDY.'
  );

  addParagraph('3.4. O LOCATÁRIO autoriza desde já cobranças complementares posteriores relacionadas a:');
  const additionalCharges = [
    '• danos identificados após devolução;',
    '• multas de trânsito;',
    '• custos administrativos;',
    '• despesas operacionais;',
    '• indenizações;',
    '• inadimplência;',
    '• sinistros;',
    '• acionamentos jurídicos.',
  ];
  additionalCharges.forEach(charge => {
    doc.fontSize(10).font('Helvetica').text(charge);
  });
  doc.moveDown(0.5);

  addParagraph(
    '3.5. A caução poderá permanecer retida por até 90 (noventa) dias após encerramento da locação para análise de multas, avarias ocultas, sinistros ou responsabilidades posteriores.'
  );
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 4 - RESPONSABILIDADE DO LOCATÁRIO
  // ============================================================

  addSection('CLÁUSULA 4 — RESPONSABILIDADE DO LOCATÁRIO');

  addParagraph(
    '4.1. O LOCATÁRIO assume integral responsabilidade civil, administrativa, financeira e criminal pela posse e utilização do veículo durante todo o período da locação.'
  );

  addParagraph('4.2. O LOCATÁRIO compromete-se a:');
  const commitments = [
    '• utilizar o veículo conforme legislação brasileira;',
    '• preservar o bem;',
    '• não dirigir sob efeito de álcool, drogas ou substâncias ilícitas;',
    '• não praticar direção perigosa;',
    '• não participar de corridas, manobras, competições ou atos ilícitos;',
    '• não transportar cargas ilícitas;',
    '• não sublocar;',
    '• não emprestar a terceiros;',
    '• não utilizar para transporte remunerado sem autorização expressa;',
    '• não sair do território autorizado pela plataforma.',
  ];
  commitments.forEach(commitment => {
    doc.fontSize(10).font('Helvetica').text(commitment);
  });
  doc.moveDown(0.5);

  addParagraph('4.3. O LOCATÁRIO responderá integralmente por:');
  const responsibilities = [
    '• colisões; • perda total; • danos mecânicos por mau uso; • danos internos;',
    '• danos elétricos; • motor; • câmbio; • suspensão; • pneus; • rodas;',
    '• lataria; • acessórios; • multas; • apreensões; • guinchos;',
    '• despesas judiciais; • honorários advocatícios; • lucros cessantes;',
    '• desvalorização do veículo; • indisponibilidade operacional.',
  ];
  responsibilities.forEach(resp => {
    doc.fontSize(10).font('Helvetica').text(resp);
  });
  doc.moveDown(0.5);

  addParagraph(
    '4.4. Caso o veículo permaneça indisponível para novas locações em razão de danos causados pelo LOCATÁRIO, este deverá indenizar o LOCADOR e a RIDDY pelos lucros cessantes correspondentes ao período de paralisação.'
  );
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 5 - MULTAS E INFRAÇÕES
  // ============================================================

  addSection('CLÁUSULA 5 — MULTAS E INFRAÇÕES');

  addParagraph(
    '5.1. Todas as multas ocorridas durante o período da locação serão integralmente de responsabilidade do LOCATÁRIO.'
  );

  addParagraph('5.2. O LOCATÁRIO autoriza a identificação de condutor junto aos órgãos competentes.');

  addParagraph('5.3. Além da multa original, poderá ser cobrada taxa administrativa operacional.');
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 6 - SINISTROS E ACIDENTES
  // ============================================================

  addSection('CLÁUSULA 6 — SINISTROS E ACIDENTES');

  addParagraph('6.1. Em caso de acidente, roubo, furto, colisão ou qualquer sinistro, o LOCATÁRIO deverá:');
  const sinisterActions = [
    '• comunicar imediatamente a RIDDY;',
    '• registrar boletim de ocorrência;',
    '• preservar provas;',
    '• enviar fotos e vídeos;',
    '• colaborar integralmente com seguradora e auditoria.',
  ];
  sinisterActions.forEach(action => {
    doc.fontSize(10).font('Helvetica').text(action);
  });
  doc.moveDown(0.5);

  addParagraph('6.2. O descumprimento poderá acarretar perda de qualquer proteção contratual eventualmente existente.');

  addParagraph('6.3. Em casos de:');
  const exceptionCases = [
    '• dolo; • fraude; • embriaguez; • direção perigosa; • omissão; • fuga;',
    '• uso indevido; • condutor não autorizado;',
  ];
  exceptionCases.forEach(exc => {
    doc.fontSize(10).font('Helvetica').text(exc);
  });
  addParagraph('o LOCATÁRIO responderá integralmente pelos prejuízos sem limitação de responsabilidade.');
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 7 - LIMITAÇÃO DE RESPONSABILIDADE DA RIDDY
  // ============================================================

  addSection('CLÁUSULA 7 — LIMITAÇÃO DE RESPONSABILIDADE DA RIDDY');

  addParagraph('7.1. A RIDDY atua exclusivamente como intermediadora tecnológica.');

  addParagraph('7.2. A RIDDY não responde por:');
  const riddyExemptions = [
    '• conduta do LOCADOR; • conduta do LOCATÁRIO; • acidentes; • danos morais;',
    '• lucros cessantes; • falhas mecânicas preexistentes; • vícios ocultos;',
    '• indisponibilidade do veículo; • objetos deixados no automóvel;',
    '• perdas indiretas; • eventos de força maior.',
  ];
  riddyExemptions.forEach(exemption => {
    doc.fontSize(10).font('Helvetica').text(exemption);
  });
  doc.moveDown(0.5);

  addParagraph('7.3. A responsabilidade operacional principal pela locação é das partes diretamente envolvidas.');

  addParagraph(
    '7.4. A RIDDY poderá suspender usuários, bloquear contas, reter valores, cancelar reservas ou negar operações por critérios internos de segurança, compliance e prevenção a fraudes.'
  );
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 8 - MONITORAMENTO E PRIVACIDADE
  // ============================================================

  addSection('CLÁUSULA 8 — MONITORAMENTO E PRIVACIDADE');

  addParagraph('8.1. O LOCATÁRIO autoriza utilização de:');
  const monitoringTypes = [
    '• geolocalização; • telemetria; • monitoramento; • rastreamento;',
    '• biometria; • validação facial; • auditoria digital; • inteligência antifraude.',
  ];
  monitoringTypes.forEach(type => {
    doc.fontSize(10).font('Helvetica').text(type);
  });
  doc.moveDown(0.5);

  addParagraph('8.2. Os dados poderão ser compartilhados com:');
  const dataSharing = [
    '• seguradoras; • autoridades; • parceiros; • gateways de pagamento;',
    '• escritórios jurídicos; • órgãos de trânsito; • empresas de compliance.',
  ];
  dataSharing.forEach(share => {
    doc.fontSize(10).font('Helvetica').text(share);
  });
  doc.moveDown(0.5);

  addParagraph('8.3. O tratamento de dados seguirá a legislação aplicável, especialmente a LGPD.');
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 9 - INADIMPLEMENTO
  // ============================================================

  addSection('CLÁUSULA 9 — INADIMPLEMENTO');

  addParagraph('9.1. O inadimplemento autoriza:');
  const defaultConsequences = [
    '• cobrança automática; • protesto; • negativação; • bloqueio de conta;',
    '• suspensão da plataforma; • cobrança judicial; • execução contratual.',
  ];
  defaultConsequences.forEach(consequence => {
    doc.fontSize(10).font('Helvetica').text(consequence);
  });
  doc.moveDown(0.5);

  addParagraph('9.2. O LOCATÁRIO responderá por:');
  const defaultPenalties = [
    '• juros de 1% ao mês;',
    '• correção monetária;',
    '• multa de 10%;',
    '• honorários advocatícios;',
    '• custas judiciais.',
  ];
  defaultPenalties.forEach(penalty => {
    doc.fontSize(10).font('Helvetica').text(penalty);
  });
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 10 - RESCISÃO
  // ============================================================

  addSection('CLÁUSULA 10 — RESCISÃO');

  addParagraph('10.1. O contrato poderá ser rescindido imediatamente em caso de:');
  const rescisionCases = [
    '• fraude; • falsidade documental; • inadimplência; • risco operacional;',
    '• violação contratual; • uso ilícito; • ameaça; • má-fé.',
  ];
  rescisionCases.forEach(case_ => {
    doc.fontSize(10).font('Helvetica').text(case_);
  });
  doc.moveDown(0.5);

  addParagraph('10.2. A RIDDY poderá cancelar reservas unilateralmente por critérios de segurança e compliance.');
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 11 - ASSINATURA ELETRÔNICA
  // ============================================================

  addSection('CLÁUSULA 11 — ASSINATURA ELETRÔNICA');

  addParagraph('11.1. As partes reconhecem validade jurídica de:');
  const electronicSignatures = [
    '• assinatura eletrônica; • aceite digital; • biometria; • IP; • logs;',
    '• token; • selfie; • validações realizadas pela plataforma.',
  ];
  electronicSignatures.forEach(sig => {
    doc.fontSize(10).font('Helvetica').text(sig);
  });
  doc.moveDown(0.5);

  addParagraph('11.2. Este contrato possui força executiva extrajudicial, nos termos da legislação brasileira.');
  doc.moveDown(0.5);

  // ============================================================
  // CLÁUSULA 12 - FORO
  // ============================================================

  addSection('CLÁUSULA 12 — FORO');

  const foroCity = vehicle.pickupCity ? `${vehicle.pickupCity}/${vehicle.pickupState || 'BR'}` : 'São Paulo/SP';
  addParagraph(`12.1. Fica eleito o foro da comarca de ${foroCity}, com renúncia de qualquer outro, por mais privilegiado que seja.`);
  doc.moveDown(1);

  // ============================================================
  // DECLARAÇÃO FINAL
  // ============================================================

  addSection('DECLARAÇÃO FINAL');

  addParagraph('O LOCATÁRIO declara:');
  const declarations = [
    '• ter lido integralmente o presente contrato;',
    '• concordar com todas as cláusulas;',
    '• possuir capacidade civil;',
    '• assumir integral responsabilidade pelo veículo durante a locação.',
  ];
  declarations.forEach(decl => {
    doc.fontSize(10).font('Helvetica').text(decl);
  });
  doc.moveDown(1);

  // ============================================================
  // ASSINATURA ELETRÔNICA
  // ============================================================

  // Helper: mask CPF (XXX.XXX.***-**)
  const maskCpf = (cpf: string | null | undefined): string => {
    if (!cpf) return 'Não informado';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.***-**`;
  };

  // Helper: parse User-Agent into device/browser strings
  const parseUserAgent = (ua: string | null | undefined): { device: string; browser: string } => {
    if (!ua) return { device: 'Não registrado', browser: 'Não registrado' };
    let browser = 'Outro';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Google Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';
    let device = 'Desktop';
    if (/iPhone|iPad|iPod/.test(ua)) device = 'iOS';
    else if (/Android/.test(ua)) device = 'Android';
    return { device, browser };
  };

  const renterUA = parseUserAgent((booking as any).contractAcceptedUserAgent);
  const hostUA = parseUserAgent((booking as any).hostContractAcceptedUserAgent);

  const renterAcceptedAt = (booking as any).contractAcceptedAt
    ? format(new Date((booking as any).contractAcceptedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : 'Não registrado';
  const hostAcceptedAt = (booking as any).hostContractAcceptedAt
    ? format(new Date((booking as any).hostContractAcceptedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : 'Pendente';

  const contractVersion = (booking as any).contractVersion || '1.0';
  const bookingRef = `#RDY-${String(booking.id).padStart(6, '0')}`;

  // Section divider
  doc.moveDown(1);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
  doc.strokeColor('#000000').lineWidth(1);
  doc.moveDown(0.8);

  // Section title
  doc.fontSize(13).font('Helvetica-Bold').text('ASSINATURA ELETRÔNICA', { align: 'center' });
  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
  doc.strokeColor('#000000').lineWidth(1);
  doc.moveDown(0.8);

  // RIDDY block
  doc.fontSize(10).font('Helvetica-Bold').text('RIDDY TECNOLOGIA LTDA');
  doc.fontSize(9).font('Helvetica').fillColor('#555555').text('Documento validado eletronicamente pela plataforma Riddy.');
  doc.fillColor('#000000');
  doc.moveDown(0.8);

  // LOCADOR block
  doc.fontSize(10).font('Helvetica-Bold').text('LOCADOR');
  doc.fontSize(9).font('Helvetica').text(host.name || 'Não informado');
  doc.fontSize(9).fillColor('#555555').text(`CPF: ${maskCpf(host.cpf)}`);
  if ((booking as any).hostContractAccepted) {
    doc.fillColor('#000000').fontSize(9).text('Aceite eletrônico registrado via aprovação da reserva.');
    doc.fontSize(8).fillColor('#555555').text(`Data/Hora: ${hostAcceptedAt}`);
    doc.fontSize(8).text(`IP registrado: ${(booking as any).hostContractAcceptedIp || 'Não registrado'}`);
    doc.fontSize(8).text(`Dispositivo: ${hostUA.device}   |   Navegador: ${hostUA.browser}`);
  } else {
    doc.fillColor('#888888').fontSize(9).text('Aceite pendente — aguardando aprovação do anfitrião.');
  }
  doc.fillColor('#000000');
  doc.moveDown(0.8);

  // LOCATÁRIO block
  const bk = booking as any;
  const otpChannel = bk.contractOtpChannel;
  const otpVerifiedAt = bk.contractOtpVerifiedAt
    ? format(new Date(bk.contractOtpVerifiedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    : null;
  const otpChannelLabel = otpChannel === 'sms' ? 'SMS' : otpChannel === 'email' ? 'E-mail' : null;

  doc.fontSize(10).font('Helvetica-Bold').text('LOCATÁRIO');
  doc.fontSize(9).font('Helvetica').text(booking.renterFullName || renter.name || 'Não informado');
  doc.fontSize(9).fillColor('#555555').text(`CPF: ${maskCpf(booking.renterCpf || renter.cpf)}`);
  if (otpChannelLabel && otpVerifiedAt) {
    doc.fillColor('#000000').fontSize(9).text(`Identidade verificada por código OTP via ${otpChannelLabel}.`);
    doc.fontSize(8).fillColor('#555555').text(`Código verificado em: ${otpVerifiedAt}`);
  } else {
    doc.fillColor('#000000').fontSize(9).text('Aceite eletrônico validado pela plataforma.');
  }
  doc.fontSize(8).fillColor('#555555').text(`Data/Hora do aceite: ${renterAcceptedAt}`);
  doc.fontSize(8).text(`IP registrado: ${bk.contractAcceptedIp || 'Não registrado'}`);
  doc.fontSize(8).text(`Dispositivo: ${renterUA.device}   |   Navegador: ${renterUA.browser}`);
  doc.fillColor('#000000');
  doc.moveDown(1);

  // Compute SHA-256 hash for document integrity
  const contractHash = generateContractHash(data);

  // DADOS DE VALIDAÇÃO block
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
  doc.strokeColor('#000000').lineWidth(1);
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica-Bold').text('DADOS DE VALIDAÇÃO');
  doc.moveDown(0.3);
  const validationLines = [
    `• Booking ID: ${bookingRef}`,
    `• Versão do contrato: ${contractVersion}`,
    `• Método de autenticação: ${otpChannelLabel ? `Código OTP via ${otpChannelLabel}` : 'Aceite eletrônico'}`,
    `• Hash SHA-256 (integridade): ${contractHash}`,
    `• Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })} (UTC-3)`,
  ];
  validationLines.forEach(line => {
    doc.fontSize(9).font('Helvetica').fillColor('#333333').text(line);
  });
  doc.fillColor('#000000');
  doc.moveDown(1);

  // VALIDADE JURÍDICA block
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
  doc.strokeColor('#000000').lineWidth(1);
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica-Bold').text('VALIDADE JURÍDICA');
  doc.moveDown(0.3);
  doc.fontSize(9).font('Helvetica').fillColor('#333333').text(
    'Este documento foi assinado eletronicamente conforme:'
  );
  const legalBases = [
    '• MP 2.200-2/2001 — Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil)',
    '• Lei 12.965/2014 — Marco Civil da Internet',
    '• Art. 107 do Código Civil Brasileiro — Liberdade de forma',
  ];
  legalBases.forEach(line => {
    doc.fontSize(9).font('Helvetica').fillColor('#333333').text(line);
  });
  doc.fillColor('#000000');
  doc.moveDown(1.5);

  // Footer
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
  doc.strokeColor('#000000').lineWidth(1);
  doc.moveDown(0.4);
  doc.fontSize(7).font('Helvetica').fillColor('#888888').text(
    `Contrato gerado digitalmente em ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })} | ${bookingRef} | RIDDY TECNOLOGIA LTDA — CNPJ ${RIDDY_CNPJ}`,
    { align: 'center' }
  );
  doc.fillColor('#000000');
}

/**
 * Wrapper: fetch booking data and generate contract PDF
 * Returns { success, pdfUrl, error }
 */
export async function generateContractForBooking(bookingId: number): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    const { getBookingById, getUserById, getVehicleById } = await import("../db");
    
    const booking = await getBookingById(bookingId);
    if (!booking) return { success: false, error: "Reserva não encontrada" };
    
    const renter = await getUserById(booking.renterId);
    const host = await getUserById(booking.hostId);
    const vehicle = await getVehicleById(booking.vehicleId);
    
    if (!renter || !host || !vehicle) {
      return { success: false, error: "Dados incompletos para gerar contrato" };
    }
    
    const pdfUrl = await generateContractPDF({ booking, vehicle, renter, host });
    return { success: true, pdfUrl };
  } catch (err) {
    console.error("[ContractService] Error generating contract for booking:", err);
    return { success: false, error: String(err) };
  }
}
