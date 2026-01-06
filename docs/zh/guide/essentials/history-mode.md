# 历史模式

essor-router 支持三种不同的历史模式，每种模式适用于不同的使用场景。

## HTML5 History 模式

大多数应用推荐使用的模式。使用 HTML5 History API 实现干净的 URL。

```tsx
import { createRouter } from 'essor-router';

const router = createRouter({
  history: 'history',
  routes: [...],
});

// 或带基础路径
import { createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory('/app/'),
  routes: [...],
});
```

### URL 示例

```
https://example.com/user/123
https://example.com/about
https://example.com/search?q=essor
```

### 服务器配置

HTML5 History 模式需要服务器配置来处理客户端路由。服务器必须为所有路由返回 `index.html`。

#### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Apache

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Node.js (Express)

```js
const path = require('node:path');
const express = require('express');
const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
```

#### Vercel

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Netlify

```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Hash 模式

使用 URL 哈希进行路由。无需服务器配置即可工作。

```tsx
import { createRouter } from 'essor-router';

const router = createRouter({
  history: 'hash',
  routes: [...],
});

// 或使用 createWebHashHistory
import { createWebHashHistory } from 'essor-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...],
});
```

### URL 示例

```
https://example.com/#/user/123
https://example.com/#/about
https://example.com/#/search?q=essor
```

### 何时使用 Hash 模式

- 静态文件托管且无服务器配置
- 文件协议（`file://`）
- 旧版浏览器支持
- 快速原型开发

### 限制

- URL 不够干净
- SEO 更具挑战性（尽管现代爬虫可以处理）
- 哈希部分不会发送到服务器

## Memory 模式

完全不与 URL 交互。非常适合 SSR 和测试。

```tsx
import { createRouter } from 'essor-router';

const router = createRouter({
  history: 'memory',
  routes: [...],
});

// 或使用 createMemoryHistory
import { createMemoryHistory } from 'essor-router';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [...],
});
```

### 何时使用 Memory 模式

- 服务端渲染（SSR）
- 单元测试
- Electron 应用
- 嵌入式小部件

### 示例：测试

```tsx
import { createMemoryHistory, createRouter } from 'essor-router';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Home },
      { path: '/about', component: About },
    ],
  });
}

// 在测试中
const router = createTestRouter();
await router.push('/about');
expect(router.currentRoute.value.path).toBe('/about');
```

## 基础 URL

所有历史模式都支持基础 URL：

```tsx
// HTML5 History 带基础路径
const router = createRouter({
  history: createWebHistory('/my-app/'),
  routes: [...],
});

// Hash 模式带基础路径
const router = createRouter({
  history: createWebHashHistory('/my-app/'),
  routes: [...],
});

// Memory 模式带基础路径
const router = createRouter({
  history: createMemoryHistory('/my-app/'),
  routes: [...],
});
```

### 基础 URL 示例

| 基础路径 | URL |
|----------|-----|
| `/` | `https://example.com/user/123` |
| `/app/` | `https://example.com/app/user/123` |
| `/v2/` | `https://example.com/v2/user/123` |

## 对比

| 特性 | HTML5 History | Hash | Memory |
|------|---------------|------|--------|
| 干净的 URL | ✅ | ❌ | N/A |
| 需要服务器配置 | ✅ | ❌ | ❌ |
| SEO 友好 | ✅ | ⚠️ | ❌ |
| 支持 file:// | ❌ | ✅ | ✅ |
| SSR 支持 | ✅ | ❌ | ✅ |
| 浏览器历史 | ✅ | ✅ | ❌ |

## 选择模式

```
┌─────────────────────────────────────┐
│ 能否配置服务器？                      │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
       能                   不能
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ HTML5 History │   │   Hash 模式   │
│  （推荐）      │   │               │
└───────────────┘   └───────────────┘

┌─────────────────────────────────────┐
│ 用于 SSR 或测试？                    │
└─────────────────┬───────────────────┘
                  │
                 是
                  │
                  ▼
          ┌───────────────┐
          │  Memory 模式  │
          └───────────────┘
```

## 模式间迁移

切换模式很简单：

```tsx
// 从 hash 切换到 history
const router = createRouter({
  // history: 'hash',
  history: 'history',
  routes: [...],
});
```

从 hash 迁移到 history 模式时：
1. 配置服务器处理客户端路由
2. 设置从 hash URL 到干净 URL 的重定向（可选）
3. 更新应用中任何硬编码的 URL
