# 管理员登录重定向修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复访问`/admin/view/login`时因无效JWT token导致的无限重定向循环和401错误问题

**Architecture:** 增强前端token验证逻辑，在重定向前验证token有效性；增强后端验证API，提供更详细的token验证响应；保持现有JWT无状态认证架构，仅优化验证流程

**Tech Stack:** Spring Boot 2.7+, Spring Security 6.1+, Thymeleaf, Bootstrap 5, jQuery, localStorage JWT存储

---

## 文件结构

### 修改文件
1. **`backend/src/main/resources/static/admin/js/auth.js`** - 前端认证逻辑核心修改
   - 添加`validateExistingToken()`函数验证token有效性
   - 修改登录页面DOM加载逻辑，在重定向前验证token
   - 优化`checkAuth()`函数，避免无效token导致的重定向
   - 添加会话过期提示功能

2. **`backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java`** - 后端验证API增强
   - 增强`/admin/auth/me`端点，返回详细的认证状态和用户信息
   - 添加适当的错误处理和日志记录

### 检查文件（无需修改）
3. **`backend/src/main/java/com/beiguo/config/SecurityConfig.java`** - 验证安全配置正确性
4. **`backend/src/main/java/com/beiguo/controller/admin/AdminViewController.java`** - 验证路径映射正确性
5. **`backend/src/main/resources/static/admin/js/common.js`** - 验证HTTP方法已存在

---

## 任务分解

### Task 1: 验证现有代码和配置

**Files:**
- 检查: `backend/src/main/resources/static/admin/js/auth.js:1-50`
- 检查: `backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java:43-52`
- 检查: `backend/src/main/java/com/beiguo/config/SecurityConfig.java:44-56`
- 检查: `backend/src/main/resources/static/admin/js/common.js:174-181`

- [ ] **Step 1: 验证auth.js中checkAuth函数逻辑**

检查文件`backend/src/main/resources/static/admin/js/auth.js`第129-145行：

```javascript
/**
 * 检查页面是否需要认证
 */
function checkAuth() {
    // 如果是登录页面，不需要检查
    if (window.location.pathname === '/admin/view/login' ||
        window.location.pathname === '/admin/login' ||
        window.location.pathname === '/admin/login.html') {
        return;
    }

    // 检查是否已登录
    if (!adminUtils.isLoggedIn()) {
        // 未登录，跳转到登录页面
        adminUtils.showToast('提示', '请先登录', 'warning');
        setTimeout(() => {
            adminUtils.redirectTo('/admin/view/login');
        }, 1000);
        return;
    }

    // 验证token有效性（可选：调用/api/admin/auth/me）
    // validateToken();
}
```

- [ ] **Step 2: 验证AdminAuthController.me端点**

检查文件`backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java`第43-52行：

```java
@GetMapping("/me")
public ApiResponse<Object> getCurrentAdmin() {
    try {
        // 可以通过SecurityContextHolder获取当前认证的管理员信息
        // 这里返回简单的认证信息，实际可以从token中解析
        return ApiResponse.success("获取当前管理员信息成功");
    } catch (RuntimeException e) {
        return ApiResponse.error(e.getMessage());
    }
}
```

- [ ] **Step 3: 验证SecurityConfig权限配置**

运行命令检查`/admin/view/login`路径是否在permitAll列表中：

```bash
cd /d/ClaudeCode/KapGame
grep -n "requestMatchers.*/admin/view/login" backend/src/main/java/com/beiguo/config/SecurityConfig.java
```

预期输出：
```
50:                .requestMatchers("/admin/view/login").permitAll()
```

- [ ] **Step 4: 验证common.js中HTTP方法已存在**

检查文件`backend/src/main/resources/static/admin/js/common.js`第174-181行：

```javascript
async get(url, params = {}) {
    // 实现应该存在
    // 如果没有实现，需要在后续任务中添加
}

async post(url, data = {}) {
    // 实现应该存在
    // 如果没有实现，需要在后续任务中添加
}
```

- [ ] **Step 5: 记录验证结果**

```bash
cd /d/ClaudeCode/KapGame
echo "现有代码验证完成于: $(date)" > existing_code_validation.txt
echo "=== auth.js checkAuth函数 ===" >> existing_code_validation.txt
grep -n "checkAuth\|isLoggedIn" backend/src/main/resources/static/admin/js/auth.js | head -5 >> existing_code_validation.txt
echo "=== AdminAuthController.me端点 ===" >> existing_code_validation.txt
grep -A5 -B2 "@GetMapping(\"/me\")" backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java >> existing_code_validation.txt
cat existing_code_validation.txt
```

### Task 2: 增强AdminAuthController.me端点

**Files:**
- 修改: `backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java:43-52`

- [ ] **Step 1: 备份原文件**

```bash
cd /d/ClaudeCode/KapGame
cp backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java.backup
```

- [ ] **Step 2: 修改getCurrentAdmin方法**

编辑文件`backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java`，找到第43-52行，替换为：

```java
@GetMapping("/me")
public ApiResponse<Object> getCurrentAdmin() {
    try {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ApiResponse.error("未认证");
        }

        // 返回当前用户信息
        Object principal = authentication.getPrincipal();
        Map<String, Object> userInfo = new HashMap<>();

        if (principal instanceof AdminUser) {
            AdminUser adminUser = (AdminUser) principal;
            userInfo.put("username", adminUser.getUsername());
            userInfo.put("role", adminUser.getRole() != null ? adminUser.getRole().getName() : null);
            userInfo.put("userId", adminUser.getId());
        } else if (principal instanceof UserDetails) {
            userInfo.put("username", ((UserDetails) principal).getUsername());
        } else if (principal instanceof String) {
            userInfo.put("username", principal);
        }

        return ApiResponse.success("获取当前管理员信息成功", userInfo);
    } catch (Exception e) {
        logger.error("获取当前管理员信息失败", e);
        return ApiResponse.error("获取信息失败: " + e.getMessage());
    }
}
```

- [ ] **Step 3: 添加必要的import**

在文件顶部添加必要的import语句（如果不存在）：

```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import com.beiguo.entity.AdminUser;
import java.util.HashMap;
import java.util.Map;
```

检查文件顶部是否有这些import，如果没有则添加。

- [ ] **Step 4: 验证修改**

运行命令验证修改：

```bash
cd /d/ClaudeCode/KapGame
grep -A15 "@GetMapping(\"/me\")" backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java | head -20
```

预期输出应包含`Authentication authentication = SecurityContextHolder.getContext().getAuthentication();`和`Map<String, Object> userInfo = new HashMap<>();`。

- [ ] **Step 5: 提交更改**

```bash
cd /d/ClaudeCode/KapGame
git add backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java
git commit -m "feat: 增强/admin/auth/me端点，返回详细用户信息"
```

### Task 3: 修改auth.js添加token验证函数

**Files:**
- 修改: `backend/src/main/resources/static/admin/js/auth.js:1-180`

- [ ] **Step 1: 备份原文件**

```bash
cd /d/ClaudeCode/KapGame
cp backend/src/main/resources/static/admin/js/auth.js backend/src/main/resources/static/admin/js/auth.js.backup
```

- [ ] **Step 2: 添加validateExistingToken函数**

在`auth.js`文件中，在`checkAuth`函数前添加新函数：

找到合适位置（大约在第120行，`checkAuth`函数之前），添加：

```javascript
/**
 * 验证现有token的有效性
 */
async function validateExistingToken() {
    try {
        const response = await adminUtils.get('/admin/auth/me');
        console.log('Token验证响应:', response);
        return response && response.success === true;
    } catch (error) {
        console.error('Token验证失败:', error);
        return false;
    }
}
```

- [ ] **Step 3: 添加showSessionExpiredMessage函数**

在`validateExistingToken`函数后添加：

```javascript
/**
 * 显示会话过期消息
 */
function showSessionExpiredMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const timeout = urlParams.get('timeout');
    const expired = urlParams.get('expired');

    if (timeout || expired) {
        adminUtils.showToast('会话已过期', '请重新登录', 'warning');
    }
}
```

- [ ] **Step 4: 修改DOM加载逻辑**

找到`document.addEventListener('DOMContentLoaded', function() {`部分（大约在第17行），修改为：

```javascript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

    if (loginForm) {
        // 检查是否已经登录且有有效token
        if (adminUtils.isLoggedIn()) {
            validateExistingToken().then(isValid => {
                if (isValid) {
                    // token有效，跳转到管理首页
                    console.log('Token有效，重定向到首页');
                    adminUtils.redirectTo('/admin/view');
                } else {
                    // token无效，清除并留在登录页
                    console.log('Token无效，清除并显示提示');
                    adminUtils.removeToken();
                    showSessionExpiredMessage();
                }
            }).catch(error => {
                console.error('Token验证出错:', error);
                adminUtils.removeToken();
            });
        }

        loginForm.addEventListener('submit', handleLogin);
    }

    // 检查页面是否需要认证
    checkAuth();
});
```

- [ ] **Step 5: 修改checkAuth函数**

找到`checkAuth`函数（大约在第129行），修改为：

```javascript
/**
 * 检查页面是否需要认证
 */
function checkAuth() {
    // 如果是登录页面，先验证现有token
    if (window.location.pathname === '/admin/view/login' ||
        window.location.pathname === '/admin/login' ||
        window.location.pathname === '/admin/login.html') {

        // 如果已登录，验证token有效性
        if (adminUtils.isLoggedIn()) {
            validateExistingToken().then(isValid => {
                if (!isValid) {
                    // token无效，清除并留在登录页
                    adminUtils.removeToken();
                    showSessionExpiredMessage();
                }
                // token有效：不处理，让DOM加载逻辑处理重定向
            });
        }
        return;
    }

    // 检查是否已登录
    if (!adminUtils.isLoggedIn()) {
        // 未登录，跳转到登录页面
        adminUtils.showToast('提示', '请先登录', 'warning');
        setTimeout(() => {
            adminUtils.redirectTo('/admin/view/login');
        }, 1000);
        return;
    }

    // 可选：验证token有效性
    // validateToken();
}
```

- [ ] **Step 6: 验证修改**

运行命令验证修改：

```bash
cd /d/ClaudeCode/KapGame
echo "=== 新增函数 ==="
grep -n "validateExistingToken\|showSessionExpiredMessage" backend/src/main/resources/static/admin/js/auth.js
echo "=== DOM加载逻辑 ==="
grep -A10 "document.addEventListener('DOMContentLoaded'" backend/src/main/resources/static/admin/js/auth.js | head -15
echo "=== checkAuth修改 ==="
grep -A20 "function checkAuth" backend/src/main/resources/static/admin/js/auth.js | head -25
```

- [ ] **Step 7: 提交更改**

```bash
cd /d/ClaudeCode/KapGame
git add backend/src/main/resources/static/admin/js/auth.js
git commit -m "feat: 添加token验证逻辑，修复登录页面重定向循环"
```

### Task 4: 验证common.js中HTTP方法实现

**Files:**
- 检查: `backend/src/main/resources/static/admin/js/common.js:174-210`
- 修改: `backend/src/main/resources/static/admin/js/common.js`（如果需要）

- [ ] **Step 1: 检查get方法实现**

查看`backend/src/main/resources/static/admin/js/common.js`中`get`方法的实现：

```bash
cd /d/ClaudeCode/KapGame
grep -A20 "async get" backend/src/main/resources/static/admin/js/common.js | head -25
```

如果输出显示方法已实现，继续下一步。如果没有实现或实现不完整，需要添加。

- [ ] **Step 2: 添加get方法实现（如果需要）**

如果`get`方法不存在或不完整，在`AdminUtils`类中添加：

```javascript
// HTTP GET请求
async get(url, params = {}) {
    try {
        // 构建查询参数
        let queryString = '';
        if (Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value !== null && value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            }
            queryString = '?' + searchParams.toString();
        }

        const fullUrl = url.startsWith('http') ? url + queryString : this.adminApiBaseUrl + url + queryString;
        const headers = {
            'Accept': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });

        // 处理401未授权
        if (response.status === 401) {
            this.removeToken();
            if (!window.location.pathname.includes('/login')) {
                this.redirectTo('/admin/view/login');
            }
            throw new Error('未授权，请重新登录');
        }

        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        } else {
            const text = await response.text();
            return { success: response.ok, data: text };
        }
    } catch (error) {
        console.error('GET请求失败:', error);
        throw error;
    }
}
```

- [ ] **Step 3: 验证post方法实现**

检查`post`方法是否已实现：

```bash
cd /d/ClaudeCode/KapGame
grep -A20 "async post" backend/src/main/resources/static/admin/js/common.js | head -25
```

- [ ] **Step 4: 添加post方法实现（如果需要）**

如果`post`方法不存在或不完整，在`get`方法后添加：

```javascript
// HTTP POST请求
async post(url, data = {}) {
    try {
        const fullUrl = url.startsWith('http') ? url : this.adminApiBaseUrl + url;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });

        // 处理401未授权
        if (response.status === 401) {
            this.removeToken();
            if (!window.location.pathname.includes('/login')) {
                this.redirectTo('/admin/view/login');
            }
            throw new Error('未授权，请重新登录');
        }

        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const responseData = await response.json();
            return responseData;
        } else {
            const text = await response.text();
            return { success: response.ok, data: text };
        }
    } catch (error) {
        console.error('POST请求失败:', error);
        throw error;
    }
}
```

- [ ] **Step 5: 提交更改（如果需要）**

如果修改了`common.js`：

```bash
cd /d/ClaudeCode/KapGame
git add backend/src/main/resources/static/admin/js/common.js
git commit -m "feat: 完善HTTP GET/POST方法实现"
```

### Task 5: 测试修复效果

**Files:**
- 测试: 完整的应用测试

- [ ] **Step 1: 启动应用服务**

```bash
cd /d/ClaudeCode/KapGame/backend
# 如果使用Maven
mvn spring-boot:run &
# 或者如果已经编译
java -jar target/*.jar &
```

等待应用启动完成（约30秒）。

- [ ] **Step 2: 测试场景1 - 清除localStorage后访问登录页**

在Chrome浏览器中：
1. 打开开发者工具（F12）
2. 转到Application标签页 → Local Storage
3. 清除所有localStorage项目
4. 访问 `http://localhost:8080/admin/view/login`
5. 验证：应显示登录表单，无重定向

- [ ] **Step 3: 测试场景2 - 模拟无效token**

在浏览器控制台中执行：

```javascript
// 设置一个无效的token
localStorage.setItem('admin_jwt_token', 'invalid_token_here');
// 刷新页面
location.reload();
```

验证：应清除无效token并显示登录表单，无重定向到`/admin/view`

- [ ] **Step 4: 测试场景3 - 正常登录流程**

1. 在登录表单中输入用户名：`admin`，密码：`admin123`
2. 点击登录按钮
3. 验证：应成功登录并重定向到`/admin/view`
4. 验证：localStorage中应有有效的`admin_jwt_token`

- [ ] **Step 5: 测试场景4 - 有效token访问登录页**

1. 保持登录状态
2. 直接访问 `http://localhost:8080/admin/view/login`
3. 验证：应重定向到`/admin/view`，不显示登录表单

- [ ] **Step 6: 测试场景5 - 检查后端API**

使用curl测试`/admin/auth/me`端点：

```bash
# 先登录获取token
curl -X POST http://localhost:8080/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# 从响应中提取token，或使用cookie
curl http://localhost:8080/admin/auth/me \
  -b cookies.txt \
  -H "Accept: application/json"
```

验证：应返回包含用户信息的JSON响应。

- [ ] **Step 7: 记录测试结果**

```bash
cd /d/ClaudeCode/KapGame
echo "测试完成于: $(date)" > test_results.txt
echo "=== 测试场景 ===" >> test_results.txt
echo "1. 清除localStorage访问登录页: 应显示表单 ✓" >> test_results.txt
echo "2. 无效token访问登录页: 应清除token并显示表单 ✓" >> test_results.txt
echo "3. 正常登录流程: 应成功登录并重定向 ✓" >> test_results.txt
echo "4. 有效token访问登录页: 应重定向到首页 ✓" >> test_results.txt
echo "5. /admin/auth/me端点: 应返回用户信息 ✓" >> test_results.txt
cat test_results.txt
```

### Task 6: 清理和文档

**Files:**
- 更新: 相关文档

- [ ] **Step 1: 清理备份文件**

```bash
cd /d/ClaudeCode/KapGame
rm -f backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java.backup
rm -f backend/src/main/resources/static/admin/js/auth.js.backup
rm -f existing_code_validation.txt
rm -f test_results.txt
```

- [ ] **Step 2: 更新项目文档**

如果有相关文档，更新修复说明：

```bash
cd /d/ClaudeCode/KapGame
echo "# 登录重定向问题修复说明" > docs/login_redirect_fix.md
echo "" >> docs/login_redirect_fix.md
echo "## 问题描述" >> docs/login_redirect_fix.md
echo "访问/admin/view/login时，如果localStorage中存在过期或无效的JWT token，会导致无限重定向循环和401错误。" >> docs/login_redirect_fix.md
echo "" >> docs/login_redirect_fix.md
echo "## 解决方案" >> docs/login_redirect_fix.md
echo "1. 增强前端token验证：在重定向前验证token有效性" >> docs/login_redirect_fix.md
echo "2. 增强后端验证API：/admin/auth/me端点返回详细用户信息" >> docs/login_redirect_fix.md
echo "3. 优化错误处理：无效token自动清除，显示友好提示" >> docs/login_redirect_fix.md
echo "" >> docs/login_redirect_fix.md
echo "## 修改文件" >> docs/login_redirect_fix.md
echo "- backend/src/main/resources/static/admin/js/auth.js" >> docs/login_redirect_fix.md
echo "- backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java" >> docs/login_redirect_fix.md
echo "- backend/src/main/resources/static/admin/js/common.js（如果需要）" >> docs/login_redirect_fix.md
```

- [ ] **Step 3: 最终提交**

```bash
cd /d/ClaudeCode/KapGame
git add docs/login_redirect_fix.md
git commit -m "docs: 添加登录重定向问题修复说明"
```

- [ ] **Step 4: 验证最终状态**

```bash
cd /d/ClaudeCode/KapGame
echo "=== 最终文件状态 ==="
echo "auth.js修改:"
grep -c "validateExistingToken\|showSessionExpiredMessage" backend/src/main/resources/static/admin/js/auth.js
echo "AdminAuthController修改:"
grep -c "SecurityContextHolder\|Authentication" backend/src/main/java/com/beiguo/controller/admin/AdminAuthController.java
echo "=== Git状态 ==="
git status --short
```

---

## 执行选项

Plan complete and saved to `docs/superpowers/plans/2026-04-11-admin-login-redirect-fix-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**