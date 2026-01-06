# History Modes

essor-router supports three different history modes, each suited for different use cases.

## HTML5 History Mode

The recommended mode for most applications. Uses the HTML5 History API for clean URLs.

```tsx
import { createRouter } from 'essor-router';

const router = createRouter({
  history: 'history',
  routes: [...],
});

// Or with a base path
import { createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory('/app/'),
  routes: [...],
});
```

### URLs

```
https://example.com/user/123
https://example.com/about
https://example.com/search?q=essor
```

### Server Configuration

HTML5 History mode requires server configuration to handle client-side routing. The server must return `index.html` for all routes.

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

## Hash Mode

Uses the URL hash for routing. Works without server configuration.

```tsx
import { createRouter } from 'essor-router';

const router = createRouter({
  history: 'hash',
  routes: [...],
});

// Or with createWebHashHistory
import { createWebHashHistory } from 'essor-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...],
});
```

### URLs

```
https://example.com/#/user/123
https://example.com/#/about
https://example.com/#/search?q=essor
```

### When to Use Hash Mode

- Static file hosting without server configuration
- File protocol (`file://`)
- Legacy browser support
- Quick prototyping

### Limitations

- URLs are less clean
- SEO is more challenging (though modern crawlers handle it)
- The hash portion is not sent to the server

## Memory Mode

Doesn't interact with the URL at all. Perfect for SSR and testing.

```tsx
import { createRouter } from 'essor-router';

const router = createRouter({
  history: 'memory',
  routes: [...],
});

// Or with createMemoryHistory
import { createMemoryHistory } from 'essor-router';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [...],
});
```

### When to Use Memory Mode

- Server-side rendering (SSR)
- Unit testing
- Electron apps
- Embedded widgets

### Example: Testing

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

// In tests
const router = createTestRouter();
await router.push('/about');
expect(router.currentRoute.value.path).toBe('/about');
```

## Base URL

All history modes support a base URL:

```tsx
// HTML5 History with base
const router = createRouter({
  history: createWebHistory('/my-app/'),
  routes: [...],
});

// Hash mode with base
const router = createRouter({
  history: createWebHashHistory('/my-app/'),
  routes: [...],
});

// Memory mode with base
const router = createRouter({
  history: createMemoryHistory('/my-app/'),
  routes: [...],
});
```

### Base URL Examples

| Base | URL |
|------|-----|
| `/` | `https://example.com/user/123` |
| `/app/` | `https://example.com/app/user/123` |
| `/v2/` | `https://example.com/v2/user/123` |

## Comparison

| Feature | HTML5 History | Hash | Memory |
|---------|---------------|------|--------|
| Clean URLs | ✅ | ❌ | N/A |
| Server config needed | ✅ | ❌ | ❌ |
| SEO friendly | ✅ | ⚠️ | ❌ |
| Works with file:// | ❌ | ✅ | ✅ |
| SSR support | ✅ | ❌ | ✅ |
| Browser history | ✅ | ✅ | ❌ |

## Choosing a Mode

```
┌─────────────────────────────────────┐
│ Can you configure the server?       │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
       Yes                  No
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ HTML5 History │   │   Hash Mode   │
│  (Recommended)│   │               │
└───────────────┘   └───────────────┘

┌─────────────────────────────────────┐
│ Building for SSR or testing?        │
└─────────────────┬───────────────────┘
                  │
                 Yes
                  │
                  ▼
          ┌───────────────┐
          │  Memory Mode  │
          └───────────────┘
```

## Migration Between Modes

Switching between modes is straightforward:

```tsx
// From hash to history
const router = createRouter({
  // history: 'hash',
  history: 'history',
  routes: [...],
});
```

When migrating from hash to history mode:
1. Configure your server for client-side routing
2. Set up redirects from hash URLs to clean URLs (optional)
3. Update any hardcoded URLs in your application
