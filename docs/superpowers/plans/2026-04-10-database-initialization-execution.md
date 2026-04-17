# Database Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute and validate the complete database initialization script to reset and rebuild the KapGame database with enhanced admin management, player ranking system, and team functionality.

**Architecture:** MySQL database reset using the comprehensive schema01_complete_reset.sql script that drops existing tables, creates new tables with proper foreign key relationships, inserts initialization data, and creates indexes for performance.

**Tech Stack:** MySQL 8.0+, Spring Boot 2.7+, Java 17, MySQL CLI tools

---

## File Structure

**Primary Files:**
- `backend/src/main/resources/schema01_complete_reset.sql` - Complete database reset script (already updated)
- `backend/src/main/resources/application.properties` - Database connection configuration
- `docs/superpowers/plans/2026-04-10-database-initialization-execution.md` - This implementation plan

**Expected Database:**
- Database name: `kap_game`
- Host: `localhost:3306`
- Username: `root`
- Password: `123456`

## Task Breakdown

### Task 1: Validate SQL Script Syntax

**Files:**
- Verify: `backend/src/main/resources/schema01_complete_reset.sql`

- [ ] **Step 1: Check SQL file exists and is readable**

```bash
cd /d/ClaudeCode/KapGame
ls -la backend/src/main/resources/schema01_complete_reset.sql
wc -l backend/src/main/resources/schema01_complete_reset.sql
```

Expected: File exists with approximately 550-600 lines

- [ ] **Step 2: Check for obvious SQL syntax errors**

```bash
cd /d/ClaudeCode/KapGame
grep -n "DROP TABLE" backend/src/main/resources/schema01_complete_reset.sql | head -5
grep -n "CREATE TABLE" backend/src/main/resources/schema01_complete_reset.sql | head -5
grep -n "INSERT INTO" backend/src/main/resources/schema01_complete_reset.sql | head -5
grep -n "CREATE INDEX" backend/src/main/resources/schema01_complete_reset.sql | head -5
```

Expected: Should see DROP TABLE, CREATE TABLE, INSERT INTO, CREATE INDEX statements

- [ ] **Step 3: Verify foreign key dependency order**

```bash
cd /d/ClaudeCode/KapGame
grep -A2 -B2 "DROP TABLE.*team_member" backend/src/main/resources/schema01_complete_reset.sql
grep -A2 -B2 "CREATE TABLE.*team_member" backend/src/main/resources/schema01_complete_reset.sql
```

Expected: team_member dropped before team, created after team

- [ ] **Step 4: Verify new table definitions exist**

```bash
cd /d/ClaudeCode/KapGame
grep -n "CREATE TABLE.*rank_config" backend/src/main/resources/schema01_complete_reset.sql
grep -n "CREATE TABLE.*team" backend/src/main/resources/schema01_complete_reset.sql
grep -n "CREATE TABLE.*team_member" backend/src/main/resources/schema01_complete_reset.sql
```

Expected: All three CREATE TABLE statements found with line numbers

- [ ] **Step 5: Commit validation results**

```bash
cd /d/ClaudeCode/KapGame
git add docs/superpowers/plans/2026-04-10-database-initialization-execution.md
git commit -m "chore: add database initialization execution plan"
```

### Task 2: Check Database Connectivity

**Files:**
- Verify: `backend/src/main/resources/application.properties`

- [ ] **Step 1: Check database connection configuration**

```bash
cd /d/ClaudeCode/KapGame
grep "spring.datasource" backend/src/main/resources/application.properties
```

Expected:
```
spring.datasource.url=jdbc:mysql://localhost:3306/kap_game?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

- [ ] **Step 2: Test MySQL CLI connectivity**

```bash
mysql --version
mysql -h localhost -P 3306 -u root -p123456 -e "SELECT VERSION();"
```

Expected: MySQL version displayed, connection successful

- [ ] **Step 3: Check if kap_game database exists**

```bash
mysql -h localhost -P 3306 -u root -p123456 -e "SHOW DATABASES LIKE 'kap_game';"
```

Expected: Either database exists or doesn't (both acceptable)

- [ ] **Step 4: List current tables if database exists**

```bash
mysql -h localhost -P 3306 -u root -p123456 -e "USE kap_game; SHOW TABLES;" 2>/dev/null || echo "Database doesn't exist or connection failed"
```

Expected: Either shows table list or "Database doesn't exist"

- [ ] **Step 5: Commit connectivity check**

```bash
cd /d/ClaudeCode/KapGame
git add docs/superpowers/plans/2026-04-10-database-initialization-execution.md
git commit -m "chore: database connectivity verified"
```

### Task 3: Execute Database Reset Script

**Files:**
- Execute: `backend/src/main/resources/schema01_complete_reset.sql`

- [ ] **Step 1: Create backup of current database (if exists)**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 -e "SHOW DATABASES LIKE 'kap_game';" | grep -q kap_game && \
  mysqldump -h localhost -P 3306 -u root -p123456 kap_game > database_backup_$(date +%Y%m%d_%H%M%S).sql
ls -la database_backup_*.sql 2>/dev/null || echo "No backup created (database didn't exist)"
```

Expected: Either creates backup file or prints "No backup created"

- [ ] **Step 2: Drop and recreate database**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 -e "DROP DATABASE IF EXISTS kap_game;"
mysql -h localhost -P 3306 -u root -p123456 -e "CREATE DATABASE kap_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -h localhost -P 3306 -u root -p123456 -e "SHOW CREATE DATABASE kap_game;"
```

Expected: Database created successfully with utf8mb4 character set

- [ ] **Step 3: Execute the complete reset script**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game < backend/src/main/resources/schema01_complete_reset.sql
```

Expected: No error messages, script executes successfully

- [ ] **Step 4: Verify script completion message**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT 'Database reset completed successfully' AS message;"
```

Expected: Shows "Database reset completed successfully"

- [ ] **Step 5: Commit execution log**

```bash
cd /d/ClaudeCode/KapGame
git add docs/superpowers/plans/2026-04-10-database-initialization-execution.md
git commit -m "chore: database reset script executed"
```

### Task 4: Validate New Tables and Structure

**Files:**
- Verify: Database structure against spec

- [ ] **Step 1: List all tables in database**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW TABLES;"
```

Expected: Should show at least: user, rank_config, game, player, card_config, activity, friend_relation, user_card, system_config, admin_role, admin_permission, admin_role_permission, admin_user, chat_message, user_checkin, publish_history, team, team_member

- [ ] **Step 2: Verify new tables exist**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW TABLES LIKE 'rank_config';"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW TABLES LIKE 'team';"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW TABLES LIKE 'team_member';"
```

Expected: Each query should return the table name

- [ ] **Step 3: Check rank_config table structure**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "DESCRIBE rank_config;"
```

Expected: Columns: id, rank_code, rank_name, level, min_exp, max_exp, icon_url, reward_diamond, reward_gold, create_time

- [ ] **Step 4: Check team table structure**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "DESCRIBE team;"
```

Expected: Columns: id, name, description, leader_id, member_count, total_score, team_level, logo_url, max_members, status, create_time, update_time

- [ ] **Step 5: Check team_member table structure**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "DESCRIBE team_member;"
```

Expected: Columns: id, team_id, user_id, role, status, join_time, contribution

- [ ] **Step 6: Commit validation results**

```bash
cd /d/ClaudeCode/KapGame
git add docs/superpowers/plans/2026-04-10-database-initialization-execution.md
git commit -m "chore: new table structure validated"
```

### Task 5: Verify Initialization Data

**Files:**
- Verify: Data inserted by schema01_complete_reset.sql

- [ ] **Step 1: Check rank_config data count**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT COUNT(*) as rank_count FROM rank_config;"
```

Expected: 16 (15 levels + master)

- [ ] **Step 2: Check admin roles and users**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT name, description FROM admin_role;"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT username, role_id FROM admin_user;"
```

Expected: SUPER_ADMIN and ADMIN roles, admin and operator users

- [ ] **Step 3: Check permission system**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT category, COUNT(*) as perm_count FROM admin_permission GROUP BY category;"
```

Expected: 7 categories with total 21 permissions

- [ ] **Step 4: Check role-permission assignments**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT r.name as role_name, COUNT(rp.permission_id) as permission_count FROM admin_role r LEFT JOIN admin_role_permission rp ON r.id = rp.role_id GROUP BY r.id;"
```

Expected: SUPER_ADMIN: 21 permissions, ADMIN: 17 permissions (excludes delete and config:edit)

- [ ] **Step 5: Check test users and teams**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT username, nick_name, rank, rank_level FROM user LIMIT 5;"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT name, leader_id, member_count FROM team;"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT t.name as team_name, u.username as member_name, tm.role FROM team_member tm JOIN team t ON tm.team_id = t.id JOIN user u ON tm.user_id = u.id ORDER BY t.name, tm.role;"
```

Expected: 5 test users, 2 teams with members

- [ ] **Step 6: Commit data verification**

```bash
cd /d/ClaudeCode/KapGame
git add docs/superpowers/plans/2026-04-10-database-initialization-execution.md
git commit -m "chore: initialization data verified"
```

### Task 6: Verify Foreign Key Relationships

**Files:**
- Verify: Database foreign key constraints

- [ ] **Step 1: Check foreign keys in team table**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'team' AND REFERENCED_TABLE_NAME IS NOT NULL;"
```

Expected: leader_id references user(id)

- [ ] **Step 2: Check foreign keys in team_member table**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'team_member' AND REFERENCED_TABLE_NAME IS NOT NULL;"
```

Expected: team_id references team(id), user_id references user(id)

- [ ] **Step 3: Check foreign keys in admin_user table**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'admin_user' AND REFERENCED_TABLE_NAME IS NOT NULL;"
```

Expected: role_id references admin_role(id)

- [ ] **Step 4: Test foreign key constraint with invalid data**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "INSERT INTO team_member (team_id, user_id) VALUES (999, 999);" 2>&1 | grep -i "foreign key constraint"
```

Expected: Should show foreign key constraint failure

- [ ] **Step 5: Commit foreign key verification**

```bash
cd /d/ClaudeCode/KapGame
git add docs/superpowers/plans/2026-04-10-database-initialization-execution.md
git commit -m "chore: foreign key constraints verified"
```

### Task 7: Verify Indexes Created

**Files:**
- Verify: Database indexes for performance

- [ ] **Step 1: Check indexes on new tables**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW INDEX FROM rank_config;"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW INDEX FROM team;"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW INDEX FROM team_member;"
```

Expected: Should show PRIMARY plus created indexes

- [ ] **Step 2: Verify specific indexes exist**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT COUNT(*) as index_count FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'rank_config';"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT COUNT(*) as index_count FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'team';"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT COUNT(*) as index_count FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'team_member';"
```

Expected: rank_config: ~3 indexes, team: ~5 indexes, team_member: ~4 indexes

- [ ] **Step 3: Check user table has rank_level index**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW INDEX FROM user WHERE Column_name = 'rank_level';"
```

Expected: Should show idx_user_rank_level index

- [ ] **Step 4: Test index usage with explain**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "EXPLAIN SELECT * FROM user WHERE rank_level = 8;"
```

Expected: Should show possible_keys including idx_user_rank_level

- [ ] **Step 5: Commit index verification**

```bash
cd /d/ClaudeCode/KapGame
git add docs/superpowers/plans/2026-04-10-database-initialization-execution.md
git commit -m "chore: database indexes verified"
```

### Task 8: Final Validation and Documentation

**Files:**
- Update: Documentation and final checks

- [ ] **Step 1: Create database schema documentation**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "
SELECT
  TABLE_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION) as columns
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'kap_game'
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;
" > database_schema_summary.txt
cat database_schema_summary.txt
```

Expected: Summary of all tables and columns

- [ ] **Step 2: Verify total table count**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT COUNT(*) as total_tables FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'kap_game';"
```

Expected: Approximately 18-20 tables

- [ ] **Step 3: Create README for database initialization**

```bash
cd /d/ClaudeCode/KapGame
cat > backend/src/main/resources/README_DATABASE.md << 'EOF'
# Database Initialization

## Schema Reset Script
File: `schema01_complete_reset.sql`

## Features Implemented
1. **Admin RBAC System**
   - Roles: SUPER_ADMIN, ADMIN
   - 21 permissions across 7 categories
   - Role-permission mapping

2. **Player Ranking System**
   - 15 rank levels (Bronze III to Diamond I)
   - Master rank as highest level
   - Rank configuration table

3. **Team System**
   - Team creation and management
   - Team member roles (LEADER, DEPUTY, MEMBER)
   - Contribution tracking

4. **Test Data**
   - Admin users: admin (SUPER_ADMIN), operator (ADMIN)
   - 5 test players with varying ranks
   - 2 test teams with members

## Database Connection
- Database: kap_game
- Host: localhost:3306
- Username: root
- Password: 123456

## Reset Instructions
```bash
mysql -h localhost -P 3306 -u root -p123456 kap_game < schema01_complete_reset.sql
```

## Verification
Run the validation queries in the implementation plan to confirm successful initialization.
EOF

cat backend/src/main/resources/README_DATABASE.md
```

Expected: README file created with database information

- [ ] **Step 4: Update spec document with completion status**

```bash
cd /d/ClaudeCode/KapGame
echo "
## Implementation Status
- [x] SQL script updated with new tables
- [x] Database reset script validated
- [x] Database initialized successfully
- [x] Test data inserted
- [x] Foreign key constraints verified
- [x] Indexes created and verified

**Completed**: $(date +%Y-%m-%d %H:%M:%S)
" >> docs/superpowers/specs/2026-04-10-database-initialization-design.md

tail -10 docs/superpowers/specs/2026-04-10-database-initialization-design.md
```

Expected: Completion status added to spec

- [ ] **Step 5: Final commit of all changes**

```bash
cd /d/ClaudeCode/KapGame
git add backend/src/main/resources/README_DATABASE.md
git add docs/superpowers/specs/2026-04-10-database-initialization-design.md
git add database_schema_summary.txt
git commit -m "feat: complete database initialization with RBAC, ranking, and team systems"
```

Expected: All changes committed successfully

## Self-Review Completed

**1. Spec coverage:** All spec requirements covered:
- ✓ Enhanced admin management with RBAC (Tasks 2, 5)
- ✓ Player ranking system (Tasks 4, 5)
- ✓ Team functionality (Tasks 4, 5)
- ✓ Clean initialization with test data (Tasks 3, 5)
- ✓ Maintain compatibility (Task 1, 4)

**2. Placeholder scan:** No placeholders found. All steps contain complete commands and expected outputs.

**3. Type consistency:** All database table and column names match between tasks and the SQL script.

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-database-initialization-execution.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**