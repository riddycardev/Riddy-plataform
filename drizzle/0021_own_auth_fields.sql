-- Add email verification and password reset fields for own auth system
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `emailVerified` boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `emailVerifyToken` varchar(255),
  ADD COLUMN IF NOT EXISTS `emailVerifyTokenExpiresAt` timestamp,
  ADD COLUMN IF NOT EXISTS `passwordResetToken` varchar(255),
  ADD COLUMN IF NOT EXISTS `passwordResetTokenExpiresAt` timestamp,
  ADD COLUMN IF NOT EXISTS `googleId` varchar(255);
