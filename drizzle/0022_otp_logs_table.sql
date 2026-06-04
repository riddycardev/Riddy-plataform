-- Tabela de histórico de OTP (SMS e e-mail)
-- Registra cada evento: envio (sent), verificação bem-sucedida (verified) e falha (failed)
CREATE TABLE IF NOT EXISTS `otp_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bookingId` int NOT NULL,
  `channel` enum('sms','email') NOT NULL,
  `event` enum('sent','verified','failed') NOT NULL,
  `recipient` varchar(320),
  `otpCode` varchar(20),
  `providerStatus` varchar(50),
  `providerRef` varchar(128),
  `ipAddress` varchar(45),
  `userAgent` varchar(512),
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `otp_logs_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_otp_logs_bookingId` ON `otp_logs` (`bookingId`);
CREATE INDEX `idx_otp_logs_channel` ON `otp_logs` (`channel`);
CREATE INDEX `idx_otp_logs_event` ON `otp_logs` (`event`);
CREATE INDEX `idx_otp_logs_createdAt` ON `otp_logs` (`createdAt`);
