-- Create notification_reads table to track which notifications a user has read
CREATE TABLE IF NOT EXISTS `notification_reads` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `notification_id` VARCHAR(255) NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_notification` (`user_id`, `notification_id`),
  KEY `user_id_index` (`user_id`),
  KEY `notification_id_index` (`notification_id`),
  CONSTRAINT `fk_notification_reads_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
