# Database Initialization Design

## Overview
Complete database schema redesign and initialization for KapGame platform, including backend admin management, player ranking system, and team functionality.

## Project Context
- **Platform**: WeChat mini-program frontend with Java Spring Boot backend
- **Current State**: Existing database schema with basic tables for users, games, cards, and admin management
- **API Routing**: Established conventions (`/api` for mini-program, `/admin/api` for admin APIs, `/admin/*` for admin pages)

## Design Goals
1. Enhanced backend admin management with RBAC (Role-Based Access Control)
2. Complete player ranking system with configurable levels
3. Team functionality for player grouping and social interaction
4. Clean initialization with test data
5. Maintain compatibility with existing API routing

## Database Schema Design

### Existing Tables (Modified)
1. **user** - Add `rank_level` field to link with `rank_config.level`
2. **admin_role** - Predefined roles: SUPER_ADMIN, ADMIN
3. **admin_permission** - Extended permission system with categories
4. **admin_role_permission** - Role-permission mapping
5. **admin_user** - Admin user accounts with role assignment

### New Tables
#### 1. rank_config - Player Ranking Configuration
Defines the game's ranking system from Bronze to Master levels.

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key |
| rank_code | VARCHAR(50) | Unique code (e.g., BRONZE_III, GOLD_I) |
| rank_name | VARCHAR(50) | Display name (e.g., 青铜III, 黄金I) |
| level | INT | Numeric level for sorting |
| min_exp | INT | Minimum experience required |
| max_exp | INT | Experience needed for next level |
| icon_url | VARCHAR(500) | Rank icon URL |
| reward_diamond | INT | Diamond reward for achieving rank |
| reward_gold | INT | Gold reward for achieving rank |

#### 2. team - Player Teams
Represents player-created teams for social gameplay.

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| name | VARCHAR(100) | Unique team name |
| description | VARCHAR(500) | Team description |
| leader_id | BIGINT | Team leader user ID (FK to user.id) |
| member_count | INT | Current member count |
| total_score | INT | Team total score |
| team_level | INT | Team level |
| logo_url | VARCHAR(500) | Team logo URL |
| max_members | INT | Maximum allowed members (default: 50) |
| status | VARCHAR(20) | ACTIVE or DISBANDED |

#### 3. team_member - Team Members
Maps users to teams with roles and status.

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| team_id | BIGINT | Team ID (FK to team.id) |
| user_id | BIGINT | User ID (FK to user.id) |
| role | VARCHAR(20) | LEADER, DEPUTY, or MEMBER |
| status | VARCHAR(20) | ACTIVE or INACTIVE |
| join_time | TIMESTAMP | When user joined team |
| contribution | INT | Contribution points within team |

## Permission System Design

### Permission Categories
1. **USER_MANAGEMENT** - User account management
   - `user:view` - View user profiles
   - `user:edit` - Edit user information
   - `user:delete` - Delete user accounts

2. **CARD_MANAGEMENT** - Game card management
   - `card:view` - View card configurations
   - `card:edit` - Edit card properties
   - `card:delete` - Delete card configurations

3. **ACTIVITY_MANAGEMENT** - Game activities and events
   - `activity:view` - View activities
   - `activity:edit` - Create/edit activities
   - `activity:delete` - Delete activities

4. **SYSTEM_CONFIG** - System configuration
   - `config:view` - View system configurations
   - `config:edit` - Edit system configurations

5. **TEAM_MANAGEMENT** - Team management
   - `team:view` - View teams and members
   - `team:edit` - Edit team information
   - `team:delete` - Delete/disband teams

6. **GAME_MANAGEMENT** - Game session management
   - `game:view` - View game sessions
   - `game:manage` - Manage active games

7. **DATA_STATISTICS** - Data analytics
   - `stats:view` - View statistical reports

### Role Definitions
- **SUPER_ADMIN**: Has all permissions including delete and system configuration
- **ADMIN**: Has all permissions except:
  - `user:delete` (cannot delete user accounts)
  - `card:delete` (cannot delete card configurations)
  - `team:delete` (cannot delete/disband teams)
  - `config:edit` (cannot edit system configurations)

## Initialization Data

### Rank Configuration (15 levels)
Level progression: Bronze III → Bronze II → Bronze I → Silver III → Silver II → Silver I → Gold III → Gold II → Gold I → Platinum III → Platinum II → Platinum I → Diamond III → Diamond II → Diamond I → Master

Each level has increasing experience requirements and rewards.

### Admin Accounts
1. **Super Administrator**
   - Username: `admin`
   - Password: `admin123` (BCrypt encrypted)
   - Role: SUPER_ADMIN

2. **Regular Administrator**
   - Username: `operator`
   - Password: `operator123` (BCrypt encrypted)
   - Role: ADMIN

### Test Users (5 users)
Test users with varying ranks, experience, and game statistics.

### Test Teams (2 teams)
1. **Elite Warriors** - High-level competitive team
2. **Casual Gamers** - Social-focused team

## Implementation Details

### Schema Evolution Strategy
1. **Backward Compatibility**: Maintain existing table structures where possible
2. **Data Migration**: Clean initialization with fresh test data
3. **Foreign Key Relationships**: Proper cascading rules for data integrity
4. **Index Optimization**: Appropriate indexes for query performance

### File Organization
- **Primary File**: `backend/src/main/resources/schema01_complete_reset.sql`
- **Backup**: Existing schema file will be modified (not replaced)
- **Versioning**: Single comprehensive reset script

### Database Constraints
1. **User-Team Relationship**: One user can belong to multiple teams (flexible team membership)
2. **Team Leadership**: Team leader must be an active team member
3. **Rank Integrity**: User rank must correspond to valid rank_config entry
4. **Permission Hierarchy**: System permissions cannot be deleted

## Validation Criteria
1. ✅ All tables created with correct constraints
2. ✅ Foreign key relationships properly established
3. ✅ Initialization data inserted correctly
4. ✅ Admin accounts can log in with assigned permissions
5. ✅ Test users have appropriate rank assignments
6. ✅ Teams created with proper member assignments
7. ✅ Permission system enforces role-based access control

## Dependencies and Order
1. Drop tables in reverse dependency order
2. Create tables in dependency order
3. Insert configuration data before user data
4. Insert permission data before role assignments
5. Create teams after users exist
6. Add team members after teams exist

## Future Considerations
1. **Rank History Tracking**: Optional table for rank progression history
2. **Team Applications**: Table for team join requests
3. **Team Achievements**: Team-level rewards and milestones
4. **Seasonal Resets**: Rank reset functionality for seasonal gameplay
5. **Advanced Statistics**: More detailed player and team analytics

## Approval Status
- ✅ User requirements gathered and clarified
- ✅ Design reviewed and approved by user
- ✅ Implementation ready to proceed

---
**Created**: 2026-04-10
**Last Modified**: 2026-04-10
**Author**: Database Design Team
**Version**: 1.0