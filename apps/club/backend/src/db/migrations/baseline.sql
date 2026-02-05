# ************************************************************
# Sequel Ace SQL dump
# Version 20096
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# Host: 127.0.0.1 (MySQL 5.7.44)
# Database: tennisclub
# Generation Time: 2026-01-31 21:21:02 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table actions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `actions`;

CREATE TABLE `actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tableId` int(11) NOT NULL DEFAULT '0',
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `payload` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `actions_OnInsert` BEFORE INSERT ON `actions` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `actions_OnUpdate` BEFORE UPDATE ON `actions` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table badges
# ------------------------------------------------------------

DROP TABLE IF EXISTS `badges`;

CREATE TABLE `badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `code` varchar(255) NOT NULL,
  `achievedAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `badges_user_id_code` (`userId`,`code`),
  CONSTRAINT `badges_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `badges_OnInsert` BEFORE INSERT ON `badges` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `badges_OnUpdate` BEFORE UPDATE ON `badges` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table comments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `comments`;

CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `photoId` int(11) DEFAULT NULL,
  `message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `photoId` (`photoId`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`photoId`) REFERENCES `photos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `comments_OnInsert` BEFORE INSERT ON `comments` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `comments_OnUpdate` BEFORE UPDATE ON `comments` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table complaints
# ------------------------------------------------------------

DROP TABLE IF EXISTS `complaints`;

CREATE TABLE `complaints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `opponentId` int(11) DEFAULT NULL,
  `reason` varchar(255) NOT NULL DEFAULT '0',
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `opponentId` (`opponentId`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`opponentId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `complaints_OnInsert` BEFORE INSERT ON `complaints` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `complaints_OnUpdate` BEFORE UPDATE ON `complaints` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table config
# ------------------------------------------------------------

DROP TABLE IF EXISTS `config`;

CREATE TABLE `config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `closeRegistrationWeeks` int(11) DEFAULT NULL,
  `googleAnalyticsTag` varchar(255) DEFAULT NULL,
  `isRaleigh` tinyint(1) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `sentryDsn` varchar(255) DEFAULT NULL,
  `canRegister` int(11) NOT NULL DEFAULT '1',
  `otherCities` varchar(255) DEFAULT NULL,
  `latitude` float DEFAULT '35.868',
  `longitude` float DEFAULT '-78.611',
  `minPlayersForTeams` int(11) NOT NULL DEFAULT '25',
  `url` varchar(255) DEFAULT NULL,
  `override` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;

INSERT INTO `config` (`id`, `closeRegistrationWeeks`, `googleAnalyticsTag`, `isRaleigh`, `city`, `state`, `sentryDsn`, `canRegister`, `otherCities`, `latitude`, `longitude`, `minPlayersForTeams`, `url`, `override`)
VALUES
	(1,2,'',0,'Raleigh','NC',NULL,1,NULL,35.868,-78.611,25,'raleigh',NULL);

/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table emails
# ------------------------------------------------------------

DROP TABLE IF EXISTS `emails`;

CREATE TABLE `emails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to` mediumtext COLLATE utf8mb4_unicode_ci,
  `cc` mediumtext COLLATE utf8mb4_unicode_ci,
  `bcc` mediumtext COLLATE utf8mb4_unicode_ci,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` mediumtext COLLATE utf8mb4_unicode_ci,
  `html` mediumtext COLLATE utf8mb4_unicode_ci,
  `replyTo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipientEmail` mediumtext COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `variables` mediumtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `emails_OnInsert` BEFORE INSERT ON `emails` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `emails_OnUpdate` BEFORE UPDATE ON `emails` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table feedbacks
# ------------------------------------------------------------

DROP TABLE IF EXISTS `feedbacks`;

CREATE TABLE `feedbacks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `feedbacks_OnInsert` BEFORE INSERT ON `feedbacks` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `feedbacks_OnUpdate` BEFORE UPDATE ON `feedbacks` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table levels
# ------------------------------------------------------------

DROP TABLE IF EXISTS `levels`;

CREATE TABLE `levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `position` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'single',
  `baseTlr` int(11) DEFAULT NULL,
  `minTlr` int(11) DEFAULT NULL,
  `maxTlr` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `levels_position` (`position`),
  KEY `levels_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `levels_OnInsert` BEFORE INSERT ON `levels` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `levels_OnUpdate` BEFORE UPDATE ON `levels` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `logs`;

CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `tableId` int(11) DEFAULT NULL,
  `code` varchar(255) NOT NULL,
  `payload` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `logs_OnInsert` BEFORE INSERT ON `logs` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `logs_OnUpdate` BEFORE UPDATE ON `logs` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table matches
# ------------------------------------------------------------

DROP TABLE IF EXISTS `matches`;

CREATE TABLE `matches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `initial` int(11) NOT NULL,
  `challengerId` int(11) DEFAULT NULL,
  `acceptorId` int(11) DEFAULT NULL,
  `winner` int(11) DEFAULT NULL,
  `score` varchar(255) DEFAULT NULL,
  `wonByDefault` tinyint(1) NOT NULL DEFAULT '0',
  `challengerElo` int(11) DEFAULT NULL,
  `acceptorElo` int(11) DEFAULT NULL,
  `challengerEloChange` int(11) DEFAULT NULL,
  `acceptorEloChange` int(11) DEFAULT NULL,
  `challengerMatches` int(11) NOT NULL DEFAULT '0',
  `acceptorMatches` int(11) NOT NULL DEFAULT '0',
  `challengerRank` int(11) DEFAULT NULL,
  `acceptorRank` int(11) DEFAULT NULL,
  `challengerPoints` int(11) DEFAULT NULL,
  `acceptorPoints` int(11) DEFAULT NULL,
  `place` varchar(255) DEFAULT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `youtube` varchar(255) DEFAULT NULL,
  `stat` text,
  `note` varchar(255) DEFAULT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'regular',
  `finalSpot` int(11) DEFAULT NULL,
  `acceptedAt` datetime DEFAULT NULL,
  `rejectedAt` datetime DEFAULT NULL,
  `playedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `same` varchar(255) NOT NULL DEFAULT '',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `challengerSeed` int(11) NOT NULL DEFAULT '0',
  `acceptorSeed` int(11) NOT NULL DEFAULT '0',
  `challenger2Id` int(11) DEFAULT NULL,
  `challenger2Elo` int(11) DEFAULT NULL,
  `challenger2EloChange` int(11) DEFAULT NULL,
  `challenger2Matches` int(11) NOT NULL DEFAULT '0',
  `challenger2Rank` int(11) DEFAULT NULL,
  `challenger2Points` int(11) DEFAULT NULL,
  `acceptor2Id` int(11) DEFAULT NULL,
  `acceptor2Elo` int(11) DEFAULT NULL,
  `acceptor2EloChange` int(11) DEFAULT NULL,
  `acceptor2Matches` int(11) NOT NULL DEFAULT '0',
  `acceptor2Rank` int(11) DEFAULT NULL,
  `acceptor2Points` int(11) DEFAULT NULL,
  `wonByInjury` tinyint(1) NOT NULL DEFAULT '0',
  `swingMatchId` varchar(255) DEFAULT NULL,
  `statAddedBy` int(11) DEFAULT NULL,
  `isCompetitive` tinyint(1) NOT NULL DEFAULT '0',
  `isAgeCompatible` tinyint(1) NOT NULL DEFAULT '0',
  `challengerRd` int(11) DEFAULT NULL,
  `acceptorRd` int(11) DEFAULT NULL,
  `sameAs` int(11) DEFAULT NULL,
  `isProposalSent` tinyint(1) NOT NULL DEFAULT '0',
  `practiceType` int(11) NOT NULL DEFAULT '0',
  `matchFormat` int(11) NOT NULL DEFAULT '0',
  `duration` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challengerId` (`challengerId`),
  KEY `acceptorId` (`acceptorId`),
  KEY `matches_challenger2Id_foreign_idx` (`challenger2Id`),
  KEY `matches_acceptor2Id_foreign_idx` (`acceptor2Id`),
  KEY `matches_statAddedBy_foreign_idx` (`statAddedBy`),
  KEY `matches_created_at` (`createdAt`),
  KEY `matches_accepted_at` (`acceptedAt`),
  KEY `matches_played_at` (`playedAt`),
  KEY `matches_same_as` (`sameAs`),
  CONSTRAINT `matches_acceptor2Id_foreign_idx` FOREIGN KEY (`acceptor2Id`) REFERENCES `players` (`id`),
  CONSTRAINT `matches_challenger2Id_foreign_idx` FOREIGN KEY (`challenger2Id`) REFERENCES `players` (`id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`challengerId`) REFERENCES `players` (`id`),
  CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`acceptorId`) REFERENCES `players` (`id`),
  CONSTRAINT `matches_statAddedBy_foreign_idx` FOREIGN KEY (`statAddedBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `matches_OnInsert` BEFORE INSERT ON `matches` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `matches_OnUpdate` BEFORE UPDATE ON `matches` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table messages
# ------------------------------------------------------------

DROP TABLE IF EXISTS `messages`;

CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `senderId` int(11) DEFAULT NULL,
  `recipientId` int(11) DEFAULT NULL,
  `message` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `senderId` (`senderId`),
  KEY `recipientId` (`recipientId`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`),
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`recipientId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `messages_OnInsert` BEFORE INSERT ON `messages` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `messages_OnUpdate` BEFORE UPDATE ON `messages` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table news
# ------------------------------------------------------------

DROP TABLE IF EXISTS `news`;

CREATE TABLE `news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `content` text NOT NULL,
  `isManual` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `news_OnInsert` BEFORE INSERT ON `news` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `news_OnUpdate` BEFORE UPDATE ON `news` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table photos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `photos`;

CREATE TABLE `photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url400` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url800` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url1200` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url1600` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url2400` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allowShare` tinyint(1) DEFAULT '1',
  `allowComments` tinyint(1) DEFAULT '1',
  `isApproved` tinyint(1) DEFAULT NULL,
  `moderationInfo` text COLLATE utf8mb4_unicode_ci,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `photos_key` (`key`),
  CONSTRAINT `photos_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `photos_OnInsert` BEFORE INSERT ON `photos` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `photos_OnUpdate` BEFORE UPDATE ON `photos` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table players
# ------------------------------------------------------------

DROP TABLE IF EXISTS `players`;

CREATE TABLE `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `tournamentId` int(11) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `readyForFinal` int(11) NOT NULL DEFAULT '0',
  `changedCount` int(11) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `addressVerification` text,
  `rewardType` varchar(255) DEFAULT NULL,
  `joinAnyTeam` tinyint(1) NOT NULL DEFAULT '0',
  `joinAnyTeamComment` varchar(255) DEFAULT NULL,
  `joinReason` text,
  `prediction` text,
  `joinForFree` tinyint(1) NOT NULL DEFAULT '0',
  `partnerId` int(11) DEFAULT NULL,
  `partnerInfo` varchar(255) DEFAULT NULL,
  `teamName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `players_user_id_tournament_id` (`userId`,`tournamentId`),
  KEY `tournamentId` (`tournamentId`),
  CONSTRAINT `players_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `players_ibfk_2` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `players_OnInsert` BEFORE INSERT ON `players` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `players_OnUpdate` BEFORE UPDATE ON `players` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table reactions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `reactions`;

CREATE TABLE `reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `photoId` int(11) DEFAULT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `photoId` (`photoId`),
  CONSTRAINT `reactions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `reactions_ibfk_2` FOREIGN KEY (`photoId`) REFERENCES `photos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `reactions_OnInsert` BEFORE INSERT ON `reactions` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `reactions_OnUpdate` BEFORE UPDATE ON `reactions` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table reports
# ------------------------------------------------------------

DROP TABLE IF EXISTS `reports`;

CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `commentId` int(11) DEFAULT NULL,
  `message` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `reports_OnInsert` BEFORE INSERT ON `reports` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `reports_OnUpdate` BEFORE UPDATE ON `reports` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table seasons
# ------------------------------------------------------------

DROP TABLE IF EXISTS `seasons`;

CREATE TABLE `seasons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `year` int(11) NOT NULL,
  `season` varchar(255) NOT NULL,
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `hasFinalTournament` tinyint(1) NOT NULL DEFAULT '1',
  `closeReason` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seasons_year_season` (`year`,`season`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `seasons_OnInsert` BEFORE INSERT ON `seasons` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `seasons_OnUpdate` BEFORE UPDATE ON `seasons` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `settings`;

CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `changeLevelNotification` varchar(255) NOT NULL DEFAULT '',
  `newFeedbackNotification` varchar(255) NOT NULL DEFAULT '',
  `global` text NOT NULL,
  `weather` text NOT NULL,
  `wordcloudUrl` varchar(255) DEFAULT NULL,
  `wordcloudCreatedAt` datetime DEFAULT NULL,
  `newComplaintNotification` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;

INSERT INTO `settings` (`id`, `createdAt`, `updatedAt`, `changeLevelNotification`, `newFeedbackNotification`, `global`, `weather`, `wordcloudUrl`, `wordcloudCreatedAt`, `newComplaintNotification`)
VALUES
	(1,'2026-01-18 21:57:13','2026-01-18 21:57:19','','','','',NULL,NULL,'');

/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `settings_OnInsert` BEFORE INSERT ON `settings` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `settings_OnUpdate` BEFORE UPDATE ON `settings` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table shortlinks
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shortlinks`;

CREATE TABLE `shortlinks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `shortlinks_name` (`name`),
  KEY `shortlinks_code` (`code`),
  KEY `shortlinks_url` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `shortlinks_OnInsert` BEFORE INSERT ON `shortlinks` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `shortlinks_OnUpdate` BEFORE UPDATE ON `shortlinks` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table tournaments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `tournaments`;

CREATE TABLE `tournaments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seasonId` int(11) DEFAULT NULL,
  `levelId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `botPrediction` text,
  `predictionWinner` int(11) DEFAULT NULL,
  `predictionWonAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seasonId` (`seasonId`),
  KEY `levelId` (`levelId`),
  KEY `tournaments_predictionWinner_foreign_idx` (`predictionWinner`),
  CONSTRAINT `tournaments_ibfk_1` FOREIGN KEY (`seasonId`) REFERENCES `seasons` (`id`),
  CONSTRAINT `tournaments_ibfk_2` FOREIGN KEY (`levelId`) REFERENCES `levels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `tournaments_OnInsert` BEFORE INSERT ON `tournaments` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `tournaments_OnUpdate` BEFORE UPDATE ON `tournaments` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table userrelations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `userrelations`;

CREATE TABLE `userrelations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `opponentId` int(11) DEFAULT NULL,
  `avoid` tinyint(1) NOT NULL DEFAULT '0',
  `avoidedOnce` tinyint(1) NOT NULL DEFAULT '0',
  `note` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `opponentId` (`opponentId`),
  CONSTRAINT `userrelations_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `userrelations_ibfk_2` FOREIGN KEY (`opponentId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `userrelations_OnInsert` BEFORE INSERT ON `userrelations` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `userrelations_OnUpdate` BEFORE UPDATE ON `userrelations` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `roles` varchar(255) NOT NULL DEFAULT 'player',
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `banDate` datetime DEFAULT NULL,
  `banReason` varchar(255) DEFAULT NULL,
  `gender` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(255) DEFAULT NULL,
  `avatar` text,
  `avatarObject` text,
  `dominantHand` varchar(255) DEFAULT NULL,
  `forehandStyle` varchar(255) DEFAULT NULL,
  `backhandStyle` varchar(255) DEFAULT NULL,
  `playerType` varchar(255) DEFAULT NULL,
  `shot` varchar(255) DEFAULT NULL,
  `racquet` varchar(255) DEFAULT NULL,
  `strings` varchar(255) DEFAULT NULL,
  `shoes` varchar(255) DEFAULT NULL,
  `bag` varchar(255) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `overgrip` varchar(255) DEFAULT NULL,
  `balls` varchar(255) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `height` varchar(255) DEFAULT NULL,
  `weight` varchar(255) DEFAULT NULL,
  `subscribeForProposals` tinyint(1) NOT NULL DEFAULT '1',
  `subscribeForNews` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `comeFrom` int(11) NOT NULL DEFAULT '0',
  `comeFromOther` varchar(255) DEFAULT NULL,
  `newEmail` varchar(255) NOT NULL DEFAULT '',
  `newEmailCode` varchar(255) NOT NULL DEFAULT '',
  `loggedAt` datetime DEFAULT NULL,
  `subscribeForReminders` tinyint(1) NOT NULL DEFAULT '1',
  `personalInfo` text,
  `isWrongEmail` tinyint(1) NOT NULL DEFAULT '0',
  `changelogSeenAt` datetime DEFAULT NULL,
  `referralCode` varchar(255) NOT NULL DEFAULT '',
  `referrerUserId` int(11) NOT NULL DEFAULT '0',
  `badgesStats` text,
  `subscribeForBadges` tinyint(1) NOT NULL DEFAULT '1',
  `avatarCreatedAt` datetime DEFAULT NULL,
  `profileCompletedAt` datetime DEFAULT NULL,
  `information` text,
  `salt` varchar(255) DEFAULT NULL,
  `appearance` varchar(255) NOT NULL DEFAULT 'light',
  `isPhoneVerified` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` datetime DEFAULT NULL,
  `refPercent` int(11) DEFAULT NULL,
  `refYears` int(11) DEFAULT NULL,
  `refStartedAt` datetime DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `isSoftBan` tinyint(1) NOT NULL DEFAULT '0',
  `showAge` tinyint(1) NOT NULL DEFAULT '0',
  `cheatingAttempts` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `slug` (`slug`),
  KEY `users_avatar_created_at` (`avatarCreatedAt`),
  KEY `users_profile_completed_at` (`profileCompletedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `users_OnInsert` BEFORE INSERT ON `users` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `users_OnUpdate` BEFORE UPDATE ON `users` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table views
# ------------------------------------------------------------

DROP TABLE IF EXISTS `views`;

CREATE TABLE `views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `photoId` int(11) DEFAULT NULL,
  `count` int(11) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `views_photo_id` (`photoId`),
  CONSTRAINT `views_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `views_OnInsert` BEFORE INSERT ON `views` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `views_OnUpdate` BEFORE UPDATE ON `views` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
