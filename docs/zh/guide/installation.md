# 安装

## 包管理器

使用你喜欢的包管理器安装 essor-router：

::: code-group

```bash [npm]
npm install essor-router
```

```bash [pnpm]
pnpm add essor-router
```

```bash [yarn]
yarn add essor-router
```

:::

## 对等依赖

essor-router 需要 `essor` 作为对等依赖。确保你已经安装了它：

```bash
npm install essor
```

## 版本兼容性

| essor-router | essor |
|--------------|-------|
| 0.0.x        | ^0.0.15-beta.5 |

## CDN

你也可以直接从 CDN 使用 essor-router：

```html
<script type="module">
  import { createRouter, RouterView, RouterLink } from 'https://esm.sh/essor-router';
  import { createApp } from 'https://esm.sh/essor';
  
  // 你的代码
</script>
```

## 下一步

现在你已经安装了 essor-router，让我们在[快速开始](/zh/guide/getting-started)指南中创建你的第一个路由器。
