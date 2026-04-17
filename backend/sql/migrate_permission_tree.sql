-- 权限树结构改造：从 flat category 改为 parent_id 层级结构
-- 执行前请备份数据库

-- 1. 添加 parent_id 列
ALTER TABLE admin_permission ADD COLUMN parent_id BIGINT;

-- 2. 设置现有权限的 parent_id（如果需要保留数据的话）
-- 目前 DataInitializer 会在应用启动时重建所有权限数据，所以这里设为 NULL
UPDATE admin_permission SET parent_id = NULL;

-- 3. 删除旧的 category 列
ALTER TABLE admin_permission DROP COLUMN category;

-- 4. 可选：添加外键约束（如果需要）
-- ALTER TABLE admin_permission ADD CONSTRAINT fk_permission_parent
-- FOREIGN KEY (parent_id) REFERENCES admin_permission(id);
