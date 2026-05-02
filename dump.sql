-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: kap_game
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `activity_type` varchar(50) NOT NULL,
  `reward_type` varchar(50) NOT NULL,
  `reward_value` varchar(500) DEFAULT NULL,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `sort_order` int DEFAULT '0',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` varchar(100) DEFAULT NULL,
  `last_modified_reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_activity_status` (`status`),
  KEY `idx_activity_time` (`start_time`,`end_time`),
  KEY `idx_activity_type` (`activity_type`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity`
--

LOCK TABLES `activity` WRITE;
/*!40000 ALTER TABLE `activity` DISABLE KEYS */;
INSERT INTO `activity` VALUES (1,'每日登录奖励','连续登录领取丰厚奖励',NULL,'SIGNIN','DIAMOND','{\"amount\": 10}','2026-03-31 16:00:00','2026-04-30 16:00:00','ACTIVE',0,'2026-04-13 01:59:28','2026-04-14 22:21:18',NULL,NULL),(2,'每周礼包','免费卡牌包等你来拿',NULL,'RECHARGE','CARD','{\"card_id\": 1, \"count\": 1}','2026-03-31 16:00:00','2026-04-07 16:00:00','INACTIVE',0,'2026-04-13 01:59:28','2026-04-15 01:00:00',NULL,NULL),(3,'新手福利','新手专属福利活动',NULL,'DOUBLE','GOLD','{\"amount\": 1000}','2026-03-31 16:00:00','2026-04-14 16:00:00','INACTIVE',0,'2026-04-13 01:59:28','2026-04-15 01:00:00',NULL,NULL);
/*!40000 ALTER TABLE `activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_reward`
--

DROP TABLE IF EXISTS `activity_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_reward` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `activity_id` bigint NOT NULL COMMENT '关联活动ID',
  `reward_type` varchar(50) NOT NULL COMMENT '奖励类型：DIAMOND/GOLD/CARD_SKIN/GIFT_BOX',
  `reward_value` int NOT NULL DEFAULT '0' COMMENT '奖励值（数量或物品ID）',
  `reward_desc` varchar(200) DEFAULT NULL COMMENT '奖励描述（用于显示）',
  `condition_type` varchar(50) NOT NULL COMMENT '条件类型：DAY/AMOUNT/PRICE',
  `condition_value` int NOT NULL DEFAULT '0' COMMENT '条件值（天数/金额）',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_activity` (`activity_id`),
  CONSTRAINT `fk_reward_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='活动奖励配置表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_reward`
--

LOCK TABLES `activity_reward` WRITE;
/*!40000 ALTER TABLE `activity_reward` DISABLE KEYS */;
INSERT INTO `activity_reward` VALUES (1,1,'GOLD',190,'','DAY',4,0,'2026-04-15 06:21:18'),(2,2,'DIAMOND',10,'','AMOUNT',10,0,'2026-04-15 06:23:16'),(3,3,'DIAMOND',0,'','PRICE',0,110,'2026-04-15 07:26:22');
/*!40000 ALTER TABLE `activity_reward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_permission`
--

DROP TABLE IF EXISTS `admin_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `type` varchar(20) DEFAULT 'PAGE' COMMENT 'ROOT/MENU/PAGE/FUNCTION',
  `order_num` int DEFAULT '0' COMMENT '排序号',
  `icon` varchar(50) DEFAULT NULL COMMENT '菜单图标',
  `route_path` varchar(100) DEFAULT NULL COMMENT '路由路径',
  `is_deletable` tinyint(1) DEFAULT '1' COMMENT '是否可删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_permission`
--

LOCK TABLES `admin_permission` WRITE;
/*!40000 ALTER TABLE `admin_permission` DISABLE KEYS */;
INSERT INTO `admin_permission` VALUES (1,'ROOT','后台管理',NULL,'2026-04-16 15:18:21','2026-04-16 15:18:21',NULL,NULL,NULL,'ROOT',0,NULL,NULL,0),(2,'MENU_MAIN','主菜单',NULL,'2026-04-16 15:18:21','2026-04-16 15:18:21',NULL,NULL,1,'MENU',1,NULL,NULL,0),(3,'MENU_SYSTEM','系统菜单',NULL,'2026-04-16 15:18:21','2026-04-16 15:18:21',NULL,NULL,1,'MENU',2,NULL,NULL,0),(4,'MODULE:USER','用户管理',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,2,'PAGE',1,'User','/users',1),(5,'MODULE:CARD','卡牌管理',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,2,'PAGE',2,'Postcard','/cards',1),(6,'MODULE:ACTIVITY','活动管理','','2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,'SYSTEM',2,'PAGE',3,'Calendar','/activities',1),(7,'MODULE:EARNINGS','收益查询',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,2,'PAGE',4,'Money','/earnings',1),(8,'MODULE:PUBLISH','发布管理',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,2,'PAGE',5,'Promotion','/publish',1),(9,'MODULE:MAIL','邮件管理',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,2,'PAGE',6,'Message','/mails',1),(10,'MODULE:ADMIN_USER','管理员',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,3,'PAGE',1,'UserFilled','/admin-users',1),(11,'MODULE:ROLE','角色管理',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,3,'PAGE',2,'Key','/roles',1),(12,'MODULE:PERMISSION','权限管理',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,3,'PAGE',3,'Lock','/permissions',1),(13,'MODULE:CONFIG','配置管理',NULL,'2026-04-16 15:18:32','2026-04-17 15:38:54',NULL,NULL,3,'PAGE',4,'Setting','/configs',1),(14,'USER:VIEW','查看用户',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,4,'FUNCTION',1,NULL,NULL,1),(15,'USER:CREATE','创建用户',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,4,'FUNCTION',2,NULL,NULL,1),(16,'USER:EDIT','编辑用户',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,4,'FUNCTION',3,NULL,NULL,1),(17,'USER:DELETE','删除用户',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,4,'FUNCTION',4,NULL,NULL,1),(18,'USER:STATUS','用户状态管理',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,4,'FUNCTION',5,NULL,NULL,1),(19,'CARD:VIEW','查看卡牌',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,5,'FUNCTION',1,NULL,NULL,1),(20,'CARD:CREATE','创建卡牌',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,5,'FUNCTION',2,NULL,NULL,1),(21,'CARD:EDIT','编辑卡牌',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,5,'FUNCTION',3,NULL,NULL,1),(22,'CARD:DELETE','删除卡牌',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,5,'FUNCTION',4,NULL,NULL,1),(23,'ACTIVITY:VIEW','查看活动',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,6,'FUNCTION',1,NULL,NULL,1),(24,'ACTIVITY:CREATE','创建活动',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,6,'FUNCTION',2,NULL,NULL,1),(25,'ACTIVITY:EDIT','编辑活动',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,6,'FUNCTION',3,NULL,NULL,1),(26,'ACTIVITY:DELETE','删除活动',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,6,'FUNCTION',4,NULL,NULL,1),(27,'EARNINGS:VIEW','查看收益',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,7,'FUNCTION',1,NULL,NULL,1),(28,'PUBLISH:VIEW','查看发布',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,8,'FUNCTION',1,NULL,NULL,1),(29,'PUBLISH:CREATE','创建发布',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,8,'FUNCTION',2,NULL,NULL,1),(30,'PUBLISH:MANAGE','发布管理',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,8,'FUNCTION',3,NULL,NULL,1),(31,'MAIL:VIEW','查看邮件',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,9,'FUNCTION',1,NULL,NULL,1),(32,'MAIL:CREATE','创建邮件',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,9,'FUNCTION',2,NULL,NULL,1),(33,'MAIL:EDIT','编辑邮件',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,9,'FUNCTION',3,NULL,NULL,1),(34,'MAIL:DELETE','删除邮件',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,9,'FUNCTION',4,NULL,NULL,1),(35,'ADMIN_USER:VIEW','查看管理员',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,10,'FUNCTION',1,NULL,NULL,1),(36,'ADMIN_USER:CREATE','创建管理员',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,10,'FUNCTION',2,NULL,NULL,1),(37,'ADMIN_USER:EDIT','编辑管理员',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,10,'FUNCTION',3,NULL,NULL,1),(38,'ADMIN_USER:DELETE','删除管理员',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,10,'FUNCTION',4,NULL,NULL,1),(39,'ROLE:VIEW','查看角色',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,11,'FUNCTION',1,NULL,NULL,1),(40,'ROLE:CREATE','创建角色',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,11,'FUNCTION',2,NULL,NULL,1),(41,'ROLE:EDIT','编辑角色',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,11,'FUNCTION',3,NULL,NULL,1),(42,'ROLE:DELETE','删除角色',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,11,'FUNCTION',4,NULL,NULL,1),(43,'PERMISSION:VIEW','查看权限',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,12,'FUNCTION',1,NULL,NULL,1),(44,'PERMISSION:CREATE','创建权限',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,12,'FUNCTION',2,NULL,NULL,1),(45,'PERMISSION:EDIT','编辑权限',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,12,'FUNCTION',3,NULL,NULL,1),(46,'PERMISSION:DELETE','删除权限',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,12,'FUNCTION',4,NULL,NULL,1),(47,'CONFIG:VIEW','查看配置',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,13,'FUNCTION',1,NULL,NULL,1),(48,'CONFIG:EDIT','编辑配置',NULL,'2026-04-16 15:18:48','2026-04-16 15:18:48',NULL,NULL,13,'FUNCTION',2,NULL,NULL,1);
/*!40000 ALTER TABLE `admin_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_role`
--

DROP TABLE IF EXISTS `admin_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_admin_role_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_role`
--

LOCK TABLES `admin_role` WRITE;
/*!40000 ALTER TABLE `admin_role` DISABLE KEYS */;
INSERT INTO `admin_role` VALUES (1,'SUPER_ADMIN','超级管理员，拥有所有权限','ACTIVE','2026-04-13 01:59:28','2026-04-17 07:57:08',NULL,'admin'),(2,'ADMIN','普通管理员，拥有部分权限','ACTIVE','2026-04-13 01:59:28','2026-04-17 06:06:42',NULL,'admin'),(3,'Test','测试','ACTIVE','2026-04-15 19:17:51','2026-04-17 04:51:19','SYSTEM','SYSTEM');
/*!40000 ALTER TABLE `admin_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_role_permission`
--

DROP TABLE IF EXISTS `admin_role_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_role_permission` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `idx_admin_role_permission_role` (`role_id`),
  KEY `idx_admin_role_permission_permission` (`permission_id`),
  CONSTRAINT `admin_role_permission_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `admin_role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admin_role_permission_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `admin_permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_role_permission`
--

LOCK TABLES `admin_role_permission` WRITE;
/*!40000 ALTER TABLE `admin_role_permission` DISABLE KEYS */;
INSERT INTO `admin_role_permission` VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),(1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27),(1,28),(1,29),(1,30),(1,31),(1,32),(1,33),(1,34),(1,35),(1,39),(1,40),(1,41),(1,42),(1,43),(1,44),(1,45),(1,46),(1,47),(1,48),(2,2),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,14),(2,15),(2,16),(2,17),(2,18),(2,19),(2,20),(2,21),(2,22),(2,23),(2,24),(2,25),(2,26),(2,27),(2,28),(2,29),(2,30),(2,31),(2,32),(2,33),(2,34),(3,1),(3,2),(3,3),(3,4),(3,5),(3,6),(3,7),(3,8),(3,9),(3,10),(3,11),(3,12),(3,13),(3,14),(3,15),(3,16),(3,17),(3,18),(3,19),(3,20),(3,21),(3,22),(3,23),(3,24),(3,25),(3,26),(3,27),(3,28),(3,29),(3,30),(3,31),(3,32),(3,33),(3,34),(3,35),(3,36),(3,37),(3,38),(3,39),(3,40),(3,41),(3,42),(3,43),(3,44),(3,45),(3,46),(3,47),(3,48);
/*!40000 ALTER TABLE `admin_role_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_user`
--

DROP TABLE IF EXISTS `admin_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` bigint DEFAULT NULL,
  `real_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `last_login_time` timestamp NULL DEFAULT NULL,
  `login_count` int DEFAULT '0',
  `status` varchar(20) DEFAULT 'ACTIVE',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `last_active_time` datetime DEFAULT NULL,
  `online_status` varchar(20) DEFAULT 'OFFLINE',
  `last_heartbeat_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_admin_status` (`status`),
  KEY `idx_admin_user_role_id` (`role_id`),
  CONSTRAINT `admin_user_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `admin_role` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_user`
--

LOCK TABLES `admin_user` WRITE;
/*!40000 ALTER TABLE `admin_user` DISABLE KEYS */;
INSERT INTO `admin_user` VALUES (1,'admin','$2a$10$NpPkmIE5er3moZdyQgjS8OWO.1soVKK50ArIMljPSH.1kjuln9gYm',1,'老大','test@gamil.com','18237561224','2026-04-17 07:57:16',40,'ACTIVE','2026-04-13 01:59:29','2026-04-17 07:57:16',NULL,'SYSTEM',NULL,'OFFLINE',NULL),(3,'test','$2a$10$DV.D.8i2hUflq2CTvckzPeTcmh8NBP3eRHXc9GuaeeJhM8D5VsJW.',2,'测试','3232414647@qq.com','18723332145','2026-04-17 09:10:00',4,'ACTIVE','2026-04-15 18:43:36','2026-04-17 09:10:00','SYSTEM','SYSTEM',NULL,'ONLINE','2026-04-17 17:10:00');
/*!40000 ALTER TABLE `admin_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `card_config`
--

DROP TABLE IF EXISTS `card_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(200) DEFAULT '',
  `type` varchar(20) NOT NULL,
  `rarity` varchar(20) DEFAULT 'COMMON',
  `image_url` varchar(500) DEFAULT NULL,
  `mana_cost` int DEFAULT '0',
  `power` int DEFAULT '0',
  `health` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` varchar(100) DEFAULT NULL,
  `last_modified_reason` varchar(500) DEFAULT NULL,
  `effects` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_card_config_type_rarity_active` (`type`,`rarity`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card_config`
--

LOCK TABLES `card_config` WRITE;
/*!40000 ALTER TABLE `card_config` DISABLE KEYS */;
INSERT INTO `card_config` VALUES (1,'Bomb','爆炸卡牌，触发后造成伤害','ATTACK','RARE',NULL,2,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"EXPLODE\"}]'),(2,'Defuse','拆除炸弹，保护自己','DEFENSE','RARE',NULL,2,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"DEFUSE_BOMB\"}]'),(3,'Transfer','转移卡牌给随机对手','DEFENSE','COMMON',NULL,1,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"TRANSFER_CARD\", \"target\": \"RANDOM_OPPONENT\"}]'),(4,'DrawTwo','从牌堆抽取两张卡牌','UTILITY','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"DRAW_CARD\", \"count\": 2}]'),(5,'Skip','跳过对手的回合','UTILITY','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"SKIP_TURN\"}]'),(6,'Peek','偷看牌堆顶部三张牌','UTILITY','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"PEEK_DECK\", \"count\": 3}]'),(7,'Shuffle','重新洗牌','UTILITY','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"SHUFFLE_DECK\"}]'),(8,'Block','阻挡一次攻击','DEFENSE','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"BLOCK_ATTACK\"}]'),(9,'Reverse','反转游戏顺序','UTILITY','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"REVERSE_ORDER\"}]'),(10,'Steal','偷取对手一张卡牌','ATTACK','COMMON',NULL,1,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"STEAL_CARD\", \"target\": \"RANDOM_OPPONENT\"}]'),(11,'Rainbow','彩虹卡，带来好运和随机效果','UTILITY','EPIC',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"RANDOM_EFFECT\"}]'),(12,'Swap','交换手牌与对手','UTILITY','RARE',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"SWAP_HAND\", \"target\": \"RANDOM_OPPONENT\"}]'),(13,'Mirror','镜像卡，复制对手最后一张卡牌','UTILITY','RARE',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"COPY_CARD\", \"target\": \"LAST_PLAYED\"}]'),(14,'Shield','护盾，抵挡下一次攻击','DEFENSE','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"ADD_SHIELD\", \"count\": 1}]'),(15,'Heal','治疗卡，恢复1点生命值','DEFENSE','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"HEAL\", \"amount\": 1}]'),(16,'DoubleDraw','双倍抽卡，抽卡数量翻倍','UTILITY','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"DOUBLE_DRAW\"}]'),(17,'TimeWarp','时间扭曲，再来一个回合','UTILITY','EPIC',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"EXTRA_TURN\"}]'),(18,'Jester','小丑卡，随机效果娱乐大家','UTILITY','LEGENDARY',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"RANDOM_JESTER\"}]'),(19,'Friendship','友谊卡，双方各抽一张牌','UTILITY','COMMON',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"DRAW_CARD\", \"count\": 1}, {\"type\": \"OPPONENT_DRAW\", \"count\": 1}]'),(20,'LuckyCoin','幸运硬币，50%几率抽卡或造成伤害','UTILITY','RARE',NULL,0,0,0,1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL,'[{\"type\": \"LUCKY_COIN\"}]');
/*!40000 ALTER TABLE `card_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `card_skin`
--

DROP TABLE IF EXISTS `card_skin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_skin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `card_id` int NOT NULL COMMENT '关联card_config.id',
  `skin_name` varchar(50) NOT NULL COMMENT '皮肤名称',
  `description` varchar(200) DEFAULT NULL COMMENT '皮肤描述',
  `cover_url` varchar(500) NOT NULL COMMENT '封面图片URL',
  `animation_url` varchar(500) DEFAULT NULL COMMENT '动画URL',
  `preview_url` varchar(500) DEFAULT NULL COMMENT '预览图URL',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否默认皮肤',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `price_diamond` int NOT NULL DEFAULT '0' COMMENT '钻石价格',
  `price_gold` int NOT NULL DEFAULT '0' COMMENT '金币价格',
  `display_order` int NOT NULL DEFAULT '0' COMMENT '显示顺序',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建者',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_card_skin_name` (`card_id`,`skin_name`),
  UNIQUE KEY `UKb5o8nvgqle7qj0ndpo1k96rf` (`card_id`,`skin_name`),
  KEY `idx_card_active` (`card_id`,`is_active`,`display_order`),
  KEY `idx_default_active` (`is_default`,`is_active`),
  KEY `idx_card_skin_card_id` (`card_id`),
  KEY `idx_card_skin_active` (`is_active`),
  KEY `idx_card_skin_default` (`is_default`),
  CONSTRAINT `fk_card_skin_card_config` FOREIGN KEY (`card_id`) REFERENCES `card_config` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='卡牌皮肤配置表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card_skin`
--

LOCK TABLES `card_skin` WRITE;
/*!40000 ALTER TABLE `card_skin` DISABLE KEYS */;
INSERT INTO `card_skin` VALUES (1,1,'经典炸弹','经典的炸弹皮肤','https://example.com/skins/bomb_classic.jpg',NULL,NULL,1,1,0,0,1,NULL,'2026-04-13 01:59:28','2026-04-13 01:59:28'),(2,1,'黄金炸弹','闪亮的黄金炸弹皮肤','https://example.com/skins/bomb_gold.jpg',NULL,NULL,0,1,100,1000,2,NULL,'2026-04-13 01:59:28','2026-04-13 01:59:28'),(3,2,'经典拆除','经典的拆除工具皮肤','https://example.com/skins/defuse_classic.jpg',NULL,NULL,1,1,0,0,1,NULL,'2026-04-13 01:59:28','2026-04-13 01:59:28'),(4,2,'钻石拆除','华丽的钻石拆除工具','https://example.com/skins/defuse_diamond.jpg',NULL,NULL,0,1,200,2000,2,NULL,'2026-04-13 01:59:28','2026-04-13 01:59:28'),(5,3,'经典转移','转移卡牌经典皮肤','https://example.com/skins/transfer_classic.jpg',NULL,NULL,1,1,0,0,1,NULL,'2026-04-13 01:59:28','2026-04-13 01:59:28'),(6,4,'经典抽卡','抽卡经典皮肤','https://example.com/skins/drawtwo_classic.jpg',NULL,NULL,1,1,0,0,1,NULL,'2026-04-13 01:59:28','2026-04-13 01:59:28'),(7,5,'经典跳过','跳过经典皮肤','https://example.com/skins/skip_classic.jpg',NULL,NULL,1,1,0,0,1,NULL,'2026-04-13 01:59:28','2026-04-13 01:59:28');
/*!40000 ALTER TABLE `card_skin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_message`
--

DROP TABLE IF EXISTS `chat_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `message_type` varchar(20) DEFAULT 'TEXT',
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_conversation` (`sender_id`,`receiver_id`,`create_time`),
  KEY `idx_chat_unread` (`receiver_id`,`is_read`,`create_time`),
  CONSTRAINT `chat_message_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_message_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_message`
--

LOCK TABLES `chat_message` WRITE;
/*!40000 ALTER TABLE `chat_message` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `earning_record`
--

DROP TABLE IF EXISTS `earning_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `earning_record` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` enum('SKIN_PURCHASE','AD_REVENUE','SPONSOR','TRAFFIC') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `order_no` varchar(64) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `earning_date` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `earning_record`
--

LOCK TABLES `earning_record` WRITE;
/*!40000 ALTER TABLE `earning_record` DISABLE KEYS */;
INSERT INTO `earning_record` VALUES (1,'SKIN_PURCHASE',68.00,'ORD20260416001',1001,'player_killer','购买传说皮肤-暗影刺客','2026-04-16 09:23:46','2026-04-16 09:23:46'),(2,'TRAFFIC',350.00,NULL,NULL,NULL,'流量分成收入','2026-04-16 09:23:46','2026-04-16 09:23:46'),(3,'AD_REVENUE',125.50,NULL,NULL,NULL,'激励视频广告收入','2026-04-16 09:23:46','2026-04-16 09:23:46'),(4,'SPONSOR',5000.00,'SPO20260416001',NULL,NULL,'王者荣耀赛事赞助费','2026-04-16 09:23:46','2026-04-16 09:23:46'),(5,'SKIN_PURCHASE',30.00,'ORD20260415001',1002,'nice_guy','购买史诗皮肤-冰雪女王','2026-04-15 09:23:46','2026-04-15 09:23:46'),(6,'SKIN_PURCHASE',88.00,'ORD20260415002',1003,'game_master','购买传说皮肤-龙魂战神','2026-04-15 09:23:46','2026-04-15 09:23:46'),(7,'AD_REVENUE',98.30,NULL,NULL,NULL,'插屏广告收入','2026-04-15 09:23:46','2026-04-15 09:23:46'),(8,'SPONSOR',3000.00,'SPO20260415001',NULL,NULL,'网易游戏联赛赞助','2026-04-15 09:23:46','2026-04-15 09:23:46'),(9,'SKIN_PURCHASE',45.00,'ORD20260414001',1004,'pro_player','购买稀有皮肤-机械战警','2026-04-14 09:23:46','2026-04-14 09:23:46'),(10,'AD_REVENUE',156.80,NULL,NULL,NULL,'开屏广告收入','2026-04-14 09:23:46','2026-04-14 09:23:46'),(11,'SPONSOR',8000.00,'SPO20260414001',NULL,NULL,'英雄联盟全球总决赛赞助','2026-04-14 09:23:46','2026-04-14 09:23:46'),(12,'SKIN_PURCHASE',18.00,'ORD20260413001',1005,'newbie_001','购买普通皮肤-新手礼包','2026-04-13 09:23:46','2026-04-13 09:23:46'),(13,'AD_REVENUE',210.00,NULL,NULL,NULL,'激励视频广告收入','2026-04-13 09:23:46','2026-04-13 09:23:46'),(14,'SKIN_PURCHASE',128.00,'ORD20260412001',1006,'vip_user','购买传说皮肤-齐天大圣','2026-04-12 09:23:46','2026-04-12 09:23:46'),(15,'AD_REVENUE',88.50,NULL,NULL,NULL,'Banner广告收入','2026-04-12 09:23:46','2026-04-12 09:23:46'),(16,'SPONSOR',2000.00,'SPO20260412001',NULL,NULL,'周末联赛赞助','2026-04-12 09:23:46','2026-04-12 09:23:46'),(17,'SKIN_PURCHASE',25.00,'ORD20260411001',1007,'casual_player','购买史诗皮肤-森林精灵','2026-04-11 09:23:46','2026-04-11 09:23:46'),(18,'SKIN_PURCHASE',68.00,'ORD20260411002',1008,'ranked_king','购买传说皮肤-银河战舰','2026-04-11 09:23:46','2026-04-11 09:23:46'),(19,'AD_REVENUE',175.20,NULL,NULL,NULL,'激励视频广告收入','2026-04-11 09:23:46','2026-04-11 09:23:46'),(20,'SKIN_PURCHASE',30.00,'ORD20260410001',1009,'legend_01','购买稀有皮肤-烈焰战神','2026-04-10 09:23:46','2026-04-10 09:23:46'),(21,'AD_REVENUE',132.40,NULL,NULL,NULL,'插屏广告收入','2026-04-10 09:23:46','2026-04-10 09:23:46'),(22,'SPONSOR',12000.00,'SPO20260410001',NULL,NULL,'年度赛事赞助','2026-04-10 09:23:46','2026-04-10 09:23:46'),(23,'SKIN_PURCHASE',88.00,'ORD20260409001',1010,'champion_001','购买传说皮肤-虚空之影','2026-04-09 09:23:46','2026-04-09 09:23:46'),(24,'AD_REVENUE',95.00,NULL,NULL,NULL,'开屏广告收入','2026-04-09 09:23:46','2026-04-09 09:23:46'),(25,'SKIN_PURCHASE',45.00,'ORD20260408001',1011,'diamond_user','购买史诗皮肤-深海巨兽','2026-04-08 09:23:46','2026-04-08 09:23:46'),(26,'SKIN_PURCHASE',68.00,'ORD20260408002',1012,'master_001','购买传说皮肤-暗夜收割者','2026-04-08 09:23:46','2026-04-08 09:23:46'),(27,'AD_REVENUE',188.60,NULL,NULL,NULL,'激励视频广告收入','2026-04-08 09:23:46','2026-04-08 09:23:46'),(28,'SPONSOR',6000.00,'SPO20260408001',NULL,NULL,'电竞俱乐部赞助','2026-04-08 09:23:46','2026-04-08 09:23:46'),(29,'SKIN_PURCHASE',18.00,'ORD20260401001',1013,'free_user','购买普通皮肤-新手剑士','2026-04-01 09:23:46','2026-04-01 09:23:46'),(30,'AD_REVENUE',245.00,NULL,NULL,NULL,'本月广告收入汇总','2026-04-01 09:23:46','2026-04-01 09:23:46'),(31,'SPONSOR',15000.00,'SPO20260401001',NULL,NULL,'春季赛赞助费','2026-04-01 09:23:46','2026-04-01 09:23:46'),(32,'SPONSOR',5.00,'',NULL,'','用户100赞助5','2026-04-16 02:01:44','2026-04-16 02:01:47');
/*!40000 ALTER TABLE `earning_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friend_relation`
--

DROP TABLE IF EXISTS `friend_relation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_relation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `friend_id` bigint NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_chat_time` datetime DEFAULT NULL,
  `remark` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_friend_relation` (`user_id`,`friend_id`),
  KEY `friend_id` (`friend_id`),
  KEY `idx_friend_status` (`status`),
  CONSTRAINT `friend_relation_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `friend_relation_ibfk_2` FOREIGN KEY (`friend_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_relation`
--

LOCK TABLES `friend_relation` WRITE;
/*!40000 ALTER TABLE `friend_relation` DISABLE KEYS */;
/*!40000 ALTER TABLE `friend_relation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game`
--

DROP TABLE IF EXISTS `game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(20) NOT NULL DEFAULT 'WAITING',
  `current_turn` int DEFAULT '0',
  `deck_cards` json DEFAULT (_utf8mb4'[]'),
  `discard_pile` json DEFAULT (_utf8mb4'[]'),
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `current_player_index` int DEFAULT NULL,
  `game_mode` varchar(20) DEFAULT NULL,
  `max_players` int DEFAULT NULL,
  `round_count` int DEFAULT NULL,
  `winner` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game`
--

LOCK TABLES `game` WRITE;
/*!40000 ALTER TABLE `game` DISABLE KEYS */;
/*!40000 ALTER TABLE `game` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mail_attachment`
--

DROP TABLE IF EXISTS `mail_attachment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_attachment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mail_id` bigint NOT NULL,
  `item_type` varchar(20) NOT NULL COMMENT 'DIAMOND/COIN/SKIN/ITEM',
  `item_code` varchar(50) NOT NULL COMMENT '物品编码或ID',
  `item_name` varchar(100) DEFAULT NULL COMMENT '物品名称',
  `quantity` int NOT NULL DEFAULT '1',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mail_attachment_mail_id` (`mail_id`),
  CONSTRAINT `fk_mail_attachment_mail` FOREIGN KEY (`mail_id`) REFERENCES `mail_config` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mail_attachment`
--

LOCK TABLES `mail_attachment` WRITE;
/*!40000 ALTER TABLE `mail_attachment` DISABLE KEYS */;
/*!40000 ALTER TABLE `mail_attachment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mail_config`
--

DROP TABLE IF EXISTS `mail_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `content` text,
  `status` varchar(20) DEFAULT 'DRAFT' COMMENT 'DRAFT/SENT/EXPIRED',
  `target_conditions` json DEFAULT NULL COMMENT 'JSON格式的收件人筛选条件',
  `send_time` datetime DEFAULT NULL,
  `expire_time` datetime DEFAULT NULL,
  `total_recipients` int DEFAULT '0',
  `sent_count` int DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mail_config`
--

LOCK TABLES `mail_config` WRITE;
/*!40000 ALTER TABLE `mail_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `mail_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `content` varchar(500) NOT NULL,
  `type` varchar(20) DEFAULT 'TEXT',
  `is_read` tinyint(1) DEFAULT '0',
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `message_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`),
  CONSTRAINT `message_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player`
--

DROP TABLE IF EXISTS `player`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `game_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `is_ai` tinyint(1) NOT NULL DEFAULT '0',
  `player_index` int NOT NULL,
  `hp` int NOT NULL DEFAULT '3',
  `hand_cards` json DEFAULT (_utf8mb4'[]'),
  `is_alive` tinyint(1) NOT NULL DEFAULT '1',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `game_id` (`game_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `player_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `game` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player`
--

LOCK TABLES `player` WRITE;
/*!40000 ALTER TABLE `player` DISABLE KEYS */;
/*!40000 ALTER TABLE `player` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publish_history`
--

DROP TABLE IF EXISTS `publish_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publish_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `version` varchar(50) NOT NULL,
  `publish_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `published_by` varchar(100) DEFAULT NULL,
  `admin_id` bigint DEFAULT NULL,
  `config_data` json NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `card_count` int DEFAULT '0',
  `activity_count` int DEFAULT '0',
  `config_count` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_publish_version` (`version`),
  KEY `idx_publish_time` (`publish_time`),
  KEY `idx_publish_admin` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publish_history`
--

LOCK TABLES `publish_history` WRITE;
/*!40000 ALTER TABLE `publish_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `publish_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rank_config`
--

DROP TABLE IF EXISTS `rank_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rank_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rank_code` varchar(50) NOT NULL,
  `rank_name` varchar(50) NOT NULL,
  `level` int NOT NULL,
  `min_exp` int NOT NULL DEFAULT '0',
  `max_exp` int NOT NULL,
  `icon_url` varchar(500) DEFAULT NULL,
  `reward_diamond` int DEFAULT '0',
  `reward_gold` int DEFAULT '0',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rank_code` (`rank_code`),
  KEY `idx_rank_config_level` (`level`),
  KEY `idx_rank_config_exp_range` (`min_exp`,`max_exp`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rank_config`
--

LOCK TABLES `rank_config` WRITE;
/*!40000 ALTER TABLE `rank_config` DISABLE KEYS */;
INSERT INTO `rank_config` VALUES (1,'BRONZE_III','青铜III',1,0,100,NULL,10,100,'2026-04-13 01:59:28'),(2,'BRONZE_II','青铜II',2,100,300,NULL,20,200,'2026-04-13 01:59:28'),(3,'BRONZE_I','青铜I',3,300,600,NULL,30,300,'2026-04-13 01:59:28'),(4,'SILVER_III','白银III',4,600,1000,NULL,40,400,'2026-04-13 01:59:28'),(5,'SILVER_II','白银II',5,1000,1500,NULL,50,500,'2026-04-13 01:59:28'),(6,'SILVER_I','白银I',6,1500,2100,NULL,60,600,'2026-04-13 01:59:28'),(7,'GOLD_III','黄金III',7,2100,2800,NULL,70,700,'2026-04-13 01:59:28'),(8,'GOLD_II','黄金II',8,2800,3600,NULL,80,800,'2026-04-13 01:59:28'),(9,'GOLD_I','黄金I',9,3600,4500,NULL,90,900,'2026-04-13 01:59:28'),(10,'PLATINUM_III','铂金III',10,4500,5500,NULL,100,1000,'2026-04-13 01:59:28'),(11,'PLATINUM_II','铂金II',11,5500,6600,NULL,110,1100,'2026-04-13 01:59:28'),(12,'PLATINUM_I','铂金I',12,6600,7800,NULL,120,1200,'2026-04-13 01:59:28'),(13,'DIAMOND_III','钻石III',13,7800,9100,NULL,130,1300,'2026-04-13 01:59:28'),(14,'DIAMOND_II','钻石II',14,9100,10500,NULL,140,1400,'2026-04-13 01:59:28'),(15,'DIAMOND_I','钻石I',15,10500,12000,NULL,150,1500,'2026-04-13 01:59:28'),(16,'MASTER','王者',16,12000,999999,NULL,200,2000,'2026-04-13 01:59:28');
/*!40000 ALTER TABLE `rank_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_dict`
--

DROP TABLE IF EXISTS `sys_dict`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_dict` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `category` varchar(100) NOT NULL COMMENT '分类编码',
  `code` varchar(50) NOT NULL COMMENT '码值',
  `value` varchar(200) NOT NULL COMMENT '显示值',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_code` (`category`,`code`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_dict`
--

LOCK TABLES `sys_dict` WRITE;
/*!40000 ALTER TABLE `sys_dict` DISABLE KEYS */;
INSERT INTO `sys_dict` VALUES (1,'yes_no','0','否',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(2,'yes_no','1','是',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(3,'activity_status','ACTIVE','进行中',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(4,'activity_status','INACTIVE','已结束',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(5,'activity_type','SIGNIN','签到活动',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(6,'activity_type','RECHARGE','充值活动',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(7,'activity_type','GIFT','限时礼包',2,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(8,'activity_type','DOUBLE','充值双倍',3,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(9,'reward_type','DIAMOND','钻石',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(10,'reward_type','GOLD','金币',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(11,'reward_type','CARD_SKIN','卡牌皮肤',2,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(12,'reward_type','GIFT_BOX','礼包',3,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(13,'user_status','NORMAL','正常',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(14,'user_status','BANNED','封禁',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(15,'role_status','ACTIVE','启用',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(16,'role_status','INACTIVE','禁用',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(17,'recharge_type','WECHAT','微信支付',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(18,'recharge_type','ALIPAY','支付宝',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(19,'audit_status','PENDING','待审核',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(20,'audit_status','APPROVED','已通过',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(21,'audit_status','REJECTED','已拒绝',2,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(22,'earning_type','SKIN_PURCHASE','皮肤购买',0,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(23,'earning_type','AD_REVENUE','广告收入',1,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(24,'earning_type','SPONSOR','赞助收入',2,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(25,'earning_type','TRAFFIC','流量收入',3,'2026-04-15 16:28:49','2026-04-15 16:28:49'),(26,'permission_type','ROOT','根目录',1,'2026-04-18 00:19:18','2026-04-18 00:19:18'),(27,'permission_type','MENU','菜单',2,'2026-04-18 00:19:18','2026-04-18 00:19:18'),(28,'permission_type','PAGE','页面',3,'2026-04-18 00:19:18','2026-04-18 00:19:18'),(29,'permission_type','FUNCTION','功能',4,'2026-04-18 00:19:18','2026-04-18 00:19:18');
/*!40000 ALTER TABLE `sys_dict` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_config`
--

DROP TABLE IF EXISTS `system_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `description` varchar(500) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '0',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` varchar(100) DEFAULT NULL,
  `last_modified_reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`),
  KEY `idx_config_key` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_config`
--

LOCK TABLES `system_config` WRITE;
/*!40000 ALTER TABLE `system_config` DISABLE KEYS */;
INSERT INTO `system_config` VALUES (1,'game_version','1.0.0','游戏版本号',1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL),(2,'maintenance_mode','false','维护模式开关',1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL),(3,'daily_login_reward','{\"diamond\": 10, \"gold\": 100}','每日登录奖励配置',0,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL),(4,'rank_thresholds','{\"bronze\": 0, \"silver\": 100, \"gold\": 500, \"platinum\": 1000, \"diamond\": 2000, \"master\": 5000}','段位阈值配置',0,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL),(5,'team_max_members','50','战队最大成员数',1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL),(6,'team_create_requirement','{\"min_level\": 5, \"min_diamond\": 100}','创建战队要求',1,'2026-04-13 01:59:28','2026-04-13 01:59:28',NULL,NULL);
/*!40000 ALTER TABLE `system_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `leader_id` bigint NOT NULL,
  `member_count` int DEFAULT '1',
  `total_score` int DEFAULT '0',
  `team_level` int DEFAULT '1',
  `logo_url` varchar(500) DEFAULT NULL,
  `max_members` int DEFAULT '50',
  `status` varchar(20) DEFAULT 'ACTIVE',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_team_status` (`status`),
  KEY `idx_team_score` (`total_score`),
  KEY `idx_team_level` (`team_level`),
  KEY `idx_team_leader` (`leader_id`),
  CONSTRAINT `team_ibfk_1` FOREIGN KEY (`leader_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
INSERT INTO `team` VALUES (1,'精英战士','高水平的竞技战队，追求胜利和荣誉',5,3,15000,5,'https://example.com/team1.jpg',50,'ACTIVE','2026-04-13 01:59:29','2026-04-13 01:59:29'),(2,'休闲玩家','以娱乐和社交为主的休闲战队',3,2,8000,3,'https://example.com/team2.jpg',30,'ACTIVE','2026-04-13 01:59:29','2026-04-13 01:59:29');
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_member`
--

DROP TABLE IF EXISTS `team_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_member` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `team_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role` varchar(20) DEFAULT 'MEMBER',
  `status` varchar(20) DEFAULT 'ACTIVE',
  `join_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `contribution` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_member` (`team_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_team_member_role` (`role`),
  KEY `idx_team_member_status` (`status`),
  KEY `idx_team_member_contribution` (`contribution`),
  CONSTRAINT `team_member_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_member_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_member`
--

LOCK TABLES `team_member` WRITE;
/*!40000 ALTER TABLE `team_member` DISABLE KEYS */;
INSERT INTO `team_member` VALUES (1,1,5,'LEADER','ACTIVE','2026-04-13 01:59:29',5000),(2,1,1,'DEPUTY','ACTIVE','2026-04-13 01:59:29',3000),(3,1,3,'MEMBER','ACTIVE','2026-04-13 01:59:29',2000),(4,2,3,'LEADER','ACTIVE','2026-04-13 01:59:29',3000),(5,2,2,'MEMBER','ACTIVE','2026-04-13 01:59:29',1500);
/*!40000 ALTER TABLE `team_member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `open_id` varchar(100) DEFAULT NULL,
  `nick_name` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `rank` varchar(50) DEFAULT '青铜 III',
  `rank_level` int DEFAULT '1',
  `diamond` int DEFAULT '0',
  `gold` int DEFAULT '0',
  `level` int DEFAULT '1',
  `exp` int DEFAULT '0',
  `total_games` int DEFAULT '0',
  `win_games` int DEFAULT '0',
  `friend_count` int DEFAULT '0',
  `last_login_time` timestamp NULL DEFAULT NULL,
  `total_online_time` int DEFAULT '0',
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `update_time` datetime(6) DEFAULT NULL,
  `sound_effects_enabled` tinyint(1) DEFAULT '1',
  `music_enabled` tinyint(1) DEFAULT '1',
  `vibration_enabled` tinyint(1) DEFAULT '1',
  `show_online_status` tinyint(1) DEFAULT '1',
  `show_last_active_time` tinyint(1) DEFAULT '1',
  `real_name` varchar(50) DEFAULT NULL,
  `id_card` varchar(20) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `last_active_time` datetime DEFAULT NULL,
  `online_status` varchar(20) DEFAULT 'OFFLINE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `open_id` (`open_id`),
  UNIQUE KEY `UK_ob8kqyqqgmefl0aco34akdtpe` (`email`),
  KEY `idx_user_level` (`level`),
  KEY `idx_user_rank` (`rank`),
  KEY `idx_user_rank_level` (`rank_level`),
  KEY `idx_user_total_games` (`total_games`),
  KEY `idx_user_win_games` (`win_games`),
  KEY `idx_user_exp` (`exp`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'player1','password1','2026-04-13 01:59:29',NULL,'游戏高手1','https://example.com/avatar1.jpg','黄金II',1,1501,50001,16,3202,0,0,45,NULL,0,NULL,NULL,NULL,'BANNED','2026-04-15 01:36:51.137755',1,1,1,1,1,NULL,NULL,0,NULL,'OFFLINE'),(2,'player2','password2','2026-04-13 01:59:29',NULL,'新手玩家','https://example.com/avatar2.jpg','白银I',6,300,15000,8,1600,50,25,12,NULL,0,NULL,NULL,NULL,NULL,NULL,1,1,1,1,1,NULL,NULL,0,NULL,'OFFLINE'),(3,'player3','password3','2026-04-13 01:59:29',NULL,'卡牌大师','https://example.com/avatar3.jpg','铂金III',10,2500,80000,22,4800,200,130,68,NULL,0,NULL,NULL,NULL,NULL,NULL,1,1,1,1,1,NULL,NULL,0,NULL,'OFFLINE'),(4,'player4','password4','2026-04-13 01:59:29',NULL,'休闲玩家','https://example.com/avatar4.jpg','青铜I',3,100,5000,5,400,30,15,8,NULL,0,NULL,NULL,NULL,NULL,NULL,1,1,1,1,1,NULL,NULL,0,NULL,'OFFLINE'),(5,'player5','password5','2026-04-13 01:59:29',NULL,'战队队长','https://example.com/avatar5.jpg','钻石I',15,5000,150000,30,11000,350,240,120,NULL,0,NULL,NULL,NULL,NULL,NULL,1,1,1,1,1,NULL,NULL,0,NULL,'OFFLINE');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_activity`
--

DROP TABLE IF EXISTS `user_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_activity` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '关联用户ID',
  `activity_id` bigint NOT NULL COMMENT '关联活动ID',
  `progress` int NOT NULL DEFAULT '0' COMMENT '当前进度（签到天数/累计充值金额）',
  `status` varchar(20) DEFAULT 'DOING' COMMENT '状态：DOING/COMPLETED',
  `start_time` datetime DEFAULT NULL COMMENT '参与时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_activity` (`user_id`,`activity_id`),
  UNIQUE KEY `UKc1qlacdl3vifbk0t6l4lmmkkw` (`user_id`,`activity_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_activity` (`activity_id`),
  CONSTRAINT `fk_ua_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户活动参与记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_activity`
--

LOCK TABLES `user_activity` WRITE;
/*!40000 ALTER TABLE `user_activity` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_checkin`
--

DROP TABLE IF EXISTS `user_checkin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_checkin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `checkin_date` date NOT NULL,
  `continuous_days` int DEFAULT '1',
  `reward_received` tinyint(1) DEFAULT '0',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_checkin` (`user_id`,`checkin_date`),
  KEY `idx_checkin_date` (`checkin_date`),
  CONSTRAINT `user_checkin_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_checkin`
--

LOCK TABLES `user_checkin` WRITE;
/*!40000 ALTER TABLE `user_checkin` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_checkin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_reward`
--

DROP TABLE IF EXISTS `user_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_reward` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '关联用户ID',
  `activity_id` bigint NOT NULL COMMENT '关联活动ID',
  `reward_id` bigint NOT NULL COMMENT '关联奖励ID',
  `claim_time` datetime DEFAULT NULL COMMENT '领取时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_reward` (`user_id`,`reward_id`),
  UNIQUE KEY `UKk3rij20x5yabadjgottn8n27y` (`user_id`,`reward_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_activity` (`activity_id`),
  KEY `fk_ur_reward` (`reward_id`),
  CONSTRAINT `fk_ur_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_reward` FOREIGN KEY (`reward_id`) REFERENCES `activity_reward` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户已领取奖励记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_reward`
--

LOCK TABLES `user_reward` WRITE;
/*!40000 ALTER TABLE `user_reward` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_reward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_skin`
--

DROP TABLE IF EXISTS `user_skin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_skin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '关联user.id',
  `skin_id` int NOT NULL COMMENT '关联card_skin.id',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '拥有数量',
  `is_equipped` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已装备',
  `purchase_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
  `purchase_type` varchar(20) DEFAULT NULL COMMENT '购买方式：DIAMOND, GOLD, FREE, GIFT',
  `purchase_price` int DEFAULT '0' COMMENT '实际购买价格',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_skin` (`user_id`,`skin_id`),
  UNIQUE KEY `UKrayp1bj6r1hvqfrw37wfa0umi` (`user_id`,`skin_id`),
  KEY `idx_user_equipped` (`user_id`,`is_equipped`),
  KEY `idx_skin_users` (`skin_id`,`user_id`),
  KEY `idx_user_skin_user_id` (`user_id`),
  KEY `idx_user_skin_skin_id` (`skin_id`),
  KEY `idx_user_skin_equipped` (`is_equipped`),
  CONSTRAINT `fk_user_skin_card_skin` FOREIGN KEY (`skin_id`) REFERENCES `card_skin` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_skin_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户拥有的皮肤表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_skin`
--

LOCK TABLES `user_skin` WRITE;
/*!40000 ALTER TABLE `user_skin` DISABLE KEYS */;
INSERT INTO `user_skin` VALUES (1,1,1,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(2,1,3,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(3,1,5,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(4,1,6,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(5,1,7,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(6,2,1,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(7,2,3,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(8,2,5,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(9,2,6,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(10,2,7,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(11,3,1,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(12,3,3,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(13,3,5,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(14,3,6,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(15,3,7,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(16,4,1,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(17,4,3,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(18,4,5,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(19,4,6,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(20,4,7,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(21,5,1,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(22,5,3,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(23,5,5,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(24,5,6,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29'),(25,5,7,1,1,'2026-04-13 01:59:29','FREE',0,'2026-04-13 01:59:29','2026-04-13 01:59:29');
/*!40000 ALTER TABLE `user_skin` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-21  9:50:28
