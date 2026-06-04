ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `emailVerified` boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `emailVerifyToken` varchar(128),
  ADD COLUMN IF NOT EXISTS `emailVerifyTokenExpiresAt` timestamp,
  ADD COLUMN IF NOT EXISTS `passwordResetToken` varchar(128),
  ADD COLUMN IF NOT EXISTS `passwordResetTokenExpiresAt` timestamp,
  ADD COLUMN IF NOT EXISTS `googleId` varchar(128);
