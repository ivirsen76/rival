# ************************************************************
# Sequel Ace SQL dump
# Version 20096
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# Host: 127.0.0.1 (MySQL 5.7.44)
# Database: tennisladder
# Generation Time: 2026-01-19 02:40:53 +0000
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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `actions_OnInsert` BEFORE INSERT ON `actions` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `actions_OnUpdate` BEFORE UPDATE ON `actions` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table badges
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `badges_OnInsert` BEFORE INSERT ON `badges` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `badges_OnUpdate` BEFORE UPDATE ON `badges` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table battles
# ------------------------------------------------------------

CREATE TABLE `battles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team1` int(11) DEFAULT NULL,
  `team2` int(11) DEFAULT NULL,
  `week` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'regular',
  `finalSpot` int(11) DEFAULT NULL,
  `team1Seed` int(11) NOT NULL DEFAULT '0',
  `team2Seed` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `team1` (`team1`),
  KEY `team2` (`team2`),
  CONSTRAINT `battles_ibfk_1` FOREIGN KEY (`team1`) REFERENCES `teams` (`id`),
  CONSTRAINT `battles_ibfk_2` FOREIGN KEY (`team2`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `battles_OnInsert` BEFORE INSERT ON `battles` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `battles_OnUpdate` BEFORE UPDATE ON `battles` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table candidateroster
# ------------------------------------------------------------

CREATE TABLE `candidateroster` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidateId` int(11) DEFAULT NULL,
  `rosterId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `candidateId` (`candidateId`),
  KEY `rosterId` (`rosterId`),
  CONSTRAINT `candidateroster_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`),
  CONSTRAINT `candidateroster_ibfk_2` FOREIGN KEY (`rosterId`) REFERENCES `rosters` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table candidates
# ------------------------------------------------------------

CREATE TABLE `candidates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `address` varchar(255) NOT NULL,
  `messages` int(11) NOT NULL DEFAULT '0',
  `messageSentAt` datetime DEFAULT NULL,
  `hash` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hash` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `candidates_OnInsert` BEFORE INSERT ON `candidates` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table coaches
# ------------------------------------------------------------

CREATE TABLE `coaches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `bullets` text,
  `description` text,
  `locationImage` varchar(255) DEFAULT NULL,
  `locationName` varchar(255) DEFAULT NULL,
  `locationAddress` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '0',
  `activeTill` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `coaches_OnInsert` BEFORE INSERT ON `coaches` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `coaches_OnUpdate` BEFORE UPDATE ON `coaches` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table comments
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `comments_OnInsert` BEFORE INSERT ON `comments` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `comments_OnUpdate` BEFORE UPDATE ON `comments` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table complaints
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `complaints_OnInsert` BEFORE INSERT ON `complaints` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `complaints_OnUpdate` BEFORE UPDATE ON `complaints` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table config
# ------------------------------------------------------------

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


# Dump of table doublesmatches
# ------------------------------------------------------------

CREATE TABLE `doublesmatches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player1Id` int(11) DEFAULT NULL,
  `player2Id` int(11) DEFAULT NULL,
  `player3Id` int(11) DEFAULT NULL,
  `player4Id` int(11) DEFAULT NULL,
  `player1Seed` int(11) NOT NULL DEFAULT '0',
  `player2Seed` int(11) NOT NULL DEFAULT '0',
  `player3Seed` int(11) NOT NULL DEFAULT '0',
  `player4Seed` int(11) NOT NULL DEFAULT '0',
  `score1` varchar(255) DEFAULT NULL,
  `score2` varchar(255) DEFAULT NULL,
  `score3` varchar(255) DEFAULT NULL,
  `winner` int(11) NOT NULL DEFAULT '0',
  `finalSpot` int(11) DEFAULT NULL,
  `playedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `runnerUp` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `player1Id` (`player1Id`),
  KEY `player2Id` (`player2Id`),
  KEY `player3Id` (`player3Id`),
  KEY `player4Id` (`player4Id`),
  CONSTRAINT `doublesmatches_ibfk_1` FOREIGN KEY (`player1Id`) REFERENCES `players` (`id`),
  CONSTRAINT `doublesmatches_ibfk_2` FOREIGN KEY (`player2Id`) REFERENCES `players` (`id`),
  CONSTRAINT `doublesmatches_ibfk_3` FOREIGN KEY (`player3Id`) REFERENCES `players` (`id`),
  CONSTRAINT `doublesmatches_ibfk_4` FOREIGN KEY (`player4Id`) REFERENCES `players` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `doublesmatches_OnInsert` BEFORE INSERT ON `doublesmatches` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `doublesmatches_OnUpdate` BEFORE UPDATE ON `doublesmatches` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table emails
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `emails_OnInsert` BEFORE INSERT ON `emails` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `emails_OnUpdate` BEFORE UPDATE ON `emails` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table feedbacks
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `feedbacks_OnInsert` BEFORE INSERT ON `feedbacks` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `feedbacks_OnUpdate` BEFORE UPDATE ON `feedbacks` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table fingerprints
# ------------------------------------------------------------

CREATE TABLE `fingerprints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `whole` varchar(255) NOT NULL,
  `userAgent` varchar(255) NOT NULL,
  `screen` varchar(255) NOT NULL,
  `device` varchar(255) NOT NULL,
  `canvas` varchar(255) NOT NULL,
  `webgl` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fingerprints_user_id_whole` (`userId`,`whole`),
  CONSTRAINT `fingerprints_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `fingerprints_OnInsert` BEFORE INSERT ON `fingerprints` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table identifications
# ------------------------------------------------------------

CREATE TABLE `identifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `code` varchar(255) NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifications_user_id_code` (`userId`,`code`),
  CONSTRAINT `identifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table levels
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `levels_OnInsert` BEFORE INSERT ON `levels` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `levels_OnUpdate` BEFORE UPDATE ON `levels` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table logs
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `logs_OnInsert` BEFORE INSERT ON `logs` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `logs_OnUpdate` BEFORE UPDATE ON `logs` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table matches
# ------------------------------------------------------------

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
  `unavailable` tinyint(1) NOT NULL DEFAULT '0',
  `battleId` int(11) DEFAULT NULL,
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
  KEY `matches_battleId_foreign_idx` (`battleId`),
  KEY `matches_same_as` (`sameAs`),
  CONSTRAINT `matches_acceptor2Id_foreign_idx` FOREIGN KEY (`acceptor2Id`) REFERENCES `players` (`id`),
  CONSTRAINT `matches_battleId_foreign_idx` FOREIGN KEY (`battleId`) REFERENCES `battles` (`id`),
  CONSTRAINT `matches_challenger2Id_foreign_idx` FOREIGN KEY (`challenger2Id`) REFERENCES `players` (`id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`challengerId`) REFERENCES `players` (`id`),
  CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`acceptorId`) REFERENCES `players` (`id`),
  CONSTRAINT `matches_statAddedBy_foreign_idx` FOREIGN KEY (`statAddedBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `matches_OnInsert` BEFORE INSERT ON `matches` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `matches_OnUpdate` BEFORE UPDATE ON `matches` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table messages
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `messages_OnInsert` BEFORE INSERT ON `messages` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `messages_OnUpdate` BEFORE UPDATE ON `messages` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table news
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `news_OnInsert` BEFORE INSERT ON `news` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `news_OnUpdate` BEFORE UPDATE ON `news` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table orders
# ------------------------------------------------------------

CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `amount` int(11) NOT NULL,
  `payload` text NOT NULL,
  `sessionId` varchar(255) DEFAULT NULL,
  `processedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `orders_OnInsert` BEFORE INSERT ON `orders` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `orders_OnUpdate` BEFORE UPDATE ON `orders` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table payments
# ------------------------------------------------------------

CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `orderId` int(11) DEFAULT NULL,
  `refundForPaymentId` int(11) DEFAULT NULL,
  `tournamentId` int(11) DEFAULT NULL,
  `badgeId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `payments_orderId_foreign_idx` (`orderId`),
  KEY `payments_tournamentId_foreign_idx` (`tournamentId`),
  KEY `payments_badgeId_foreign_idx` (`badgeId`),
  CONSTRAINT `payments_badgeId_foreign_idx` FOREIGN KEY (`badgeId`) REFERENCES `badges` (`id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `payments_orderId_foreign_idx` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`),
  CONSTRAINT `payments_tournamentId_foreign_idx` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `payments_OnInsert` BEFORE INSERT ON `payments` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `payments_OnUpdate` BEFORE UPDATE ON `payments` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table payouts
# ------------------------------------------------------------

CREATE TABLE `payouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `amount` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `payouts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `payouts_OnInsert` BEFORE INSERT ON `payouts` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `payouts_OnUpdate` BEFORE UPDATE ON `payouts` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table photos
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `photos_OnInsert` BEFORE INSERT ON `photos` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `photos_OnUpdate` BEFORE UPDATE ON `photos` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table players
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `players_OnInsert` BEFORE INSERT ON `players` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `players_OnUpdate` BEFORE UPDATE ON `players` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table reactions
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `reactions_OnInsert` BEFORE INSERT ON `reactions` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `reactions_OnUpdate` BEFORE UPDATE ON `reactions` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table reports
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `reports_OnInsert` BEFORE INSERT ON `reports` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `reports_OnUpdate` BEFORE UPDATE ON `reports` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table rosters
# ------------------------------------------------------------

CREATE TABLE `rosters` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table seasons
# ------------------------------------------------------------

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
  `isFree` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `seasons_year_season` (`year`,`season`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `seasons_OnInsert` BEFORE INSERT ON `seasons` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `seasons_OnUpdate` BEFORE UPDATE ON `seasons` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table settings
# ------------------------------------------------------------

CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `signUpNotification` varchar(255) NOT NULL DEFAULT '',
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

INSERT INTO `settings` (`id`, `createdAt`, `updatedAt`, `signUpNotification`, `changeLevelNotification`, `newFeedbackNotification`, `global`, `weather`, `wordcloudUrl`, `wordcloudCreatedAt`, `newComplaintNotification`)
VALUES
	(1,'2026-01-18 21:57:13','2026-01-18 21:57:19','','','','','',NULL,NULL,'');

/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `settings_OnInsert` BEFORE INSERT ON `settings` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `settings_OnUpdate` BEFORE UPDATE ON `settings` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table shortlinks
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `shortlinks_OnInsert` BEFORE INSERT ON `shortlinks` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `shortlinks_OnUpdate` BEFORE UPDATE ON `shortlinks` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table teammembers
# ------------------------------------------------------------

CREATE TABLE `teammembers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playerId` int(11) DEFAULT NULL,
  `teamId` int(11) DEFAULT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'member',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `playerId` (`playerId`),
  KEY `teamId` (`teamId`),
  CONSTRAINT `teammembers_ibfk_1` FOREIGN KEY (`playerId`) REFERENCES `players` (`id`),
  CONSTRAINT `teammembers_ibfk_2` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `teammembers_OnInsert` BEFORE INSERT ON `teammembers` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `teammembers_OnUpdate` BEFORE UPDATE ON `teammembers` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table teams
# ------------------------------------------------------------

CREATE TABLE `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tournamentId` int(11) DEFAULT NULL,
  `name` int(11) NOT NULL,
  `customName` varchar(255) DEFAULT NULL,
  `invitedPlayers` varchar(255) DEFAULT NULL,
  `invitedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `playingNextWeek` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `tournamentId` (`tournamentId`),
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `teams_OnInsert` BEFORE INSERT ON `teams` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `teams_OnUpdate` BEFORE UPDATE ON `teams` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table tournaments
# ------------------------------------------------------------

CREATE TABLE `tournaments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seasonId` int(11) DEFAULT NULL,
  `levelId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `botPrediction` text,
  `predictionWinner` int(11) DEFAULT NULL,
  `predictionWonAt` datetime DEFAULT NULL,
  `isFree` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `seasonId` (`seasonId`),
  KEY `levelId` (`levelId`),
  KEY `tournaments_predictionWinner_foreign_idx` (`predictionWinner`),
  CONSTRAINT `tournaments_ibfk_1` FOREIGN KEY (`seasonId`) REFERENCES `seasons` (`id`),
  CONSTRAINT `tournaments_ibfk_2` FOREIGN KEY (`levelId`) REFERENCES `levels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `tournaments_OnInsert` BEFORE INSERT ON `tournaments` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `tournaments_OnUpdate` BEFORE UPDATE ON `tournaments` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table tracking
# ------------------------------------------------------------

CREATE TABLE `tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `opened` tinyint(1) NOT NULL DEFAULT '0',
  `clicked` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `tracking_OnInsert` BEFORE INSERT ON `tracking` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `tracking_OnUpdate` BEFORE UPDATE ON `tracking` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table userrelations
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `userrelations_OnInsert` BEFORE INSERT ON `userrelations` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `userrelations_OnUpdate` BEFORE UPDATE ON `userrelations` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table users
# ------------------------------------------------------------

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `isVerified` tinyint(1) NOT NULL DEFAULT '0',
  `verificationCode` varchar(255) DEFAULT NULL,
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
  `registerHistory` text,
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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `users_OnInsert` BEFORE INSERT ON `users` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `users_OnUpdate` BEFORE UPDATE ON `users` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table views
# ------------------------------------------------------------

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
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `views_OnInsert` BEFORE INSERT ON `views` FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
/*!50003 SET SESSION SQL_MODE="IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION" */;;
/*!50003 CREATE */ /*!50017 DEFINER=`root`@`localhost` */ /*!50003 TRIGGER `views_OnUpdate` BEFORE UPDATE ON `views` FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, 'America/New_York') */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
