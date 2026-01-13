/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.13-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: kalendar
-- ------------------------------------------------------
-- Server version	10.11.13-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `reminder_participants`
--

DROP TABLE IF EXISTS `reminder_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminder_participants` (
  `reminder_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`reminder_id`,`user_id`),
  KEY `FKvdbn1yfpk2lkm51v6aoa3bfu` (`user_id`),
  CONSTRAINT `FKf35q8ggmrq44501811enl8du5` FOREIGN KEY (`reminder_id`) REFERENCES `reminders` (`id`),
  CONSTRAINT `FKvdbn1yfpk2lkm51v6aoa3bfu` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminder_participants`
--

LOCK TABLES `reminder_participants` WRITE;
/*!40000 ALTER TABLE `reminder_participants` DISABLE KEYS */;
INSERT INTO `reminder_participants` VALUES
(3,2),
(4,2),
(5,3),
(7,1),
(8,1),
(9,1),
(10,1);
/*!40000 ALTER TABLE `reminder_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminders`
--

DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminders` (
  `is_all_day` bit(1) NOT NULL,
  `reminder_date` date NOT NULL,
  `reminder_time` time DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `color` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminders`
--

LOCK TABLES `reminders` WRITE;
/*!40000 ALTER TABLE `reminders` DISABLE KEYS */;
INSERT INTO `reminders` VALUES
('\0','2026-01-12','07:30:00',3,'#FF3B30','','studie'),
('\0','2026-01-14','16:00:00',4,'#34C759','','psycho'),
('\0','2026-01-14','17:00:00',5,'#34C759','nekomu rozbiju hlavu','trenink'),
('\0','2026-01-15','11:00:00',7,'#007AFF','','wwww'),
('\0','2026-01-17','13:22:00',8,'#FF3B30','','love love'),
('','2026-01-16',NULL,9,'#34C759','','was'),
('\0','2026-01-18','11:00:00',10,'#007AFF','','kam');
/*!40000 ALTER TABLE `reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(256) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin','$2a$10$M4Jtm4CfbWfGEnvQHF9AW.jMBKQoyMWbWiz2xh5ttb3Up9MeOpFHa'),
(2,'sofina','$2a$10$HD263lHSCFBb0pcpj6y0DOKwDwol/oJsjX7W5AZNPBzBnz0a797LK'),
(3,'zrzek','$2a$10$Nev5D8tZzPrRZEPLeqnvXO5lgAZmF8vVGsUc6n3vDMl6qs12tQ/tS');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-13 10:53:57
