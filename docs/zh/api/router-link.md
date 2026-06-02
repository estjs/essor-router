# RouterLink

`RouterLink` 组件创建导航链接。

## 基本用法

```tsx
import { RouterLink } from 'essor-router';

<RouterLink to="/about">关于</RouterLink>
```

## Props

### to

- **类型：** `string | RouteLocationRaw | (() => RouteLocationRaw)`
- **必填：** 是

目标位置：

```tsx
// 字符串路径
<RouterLink to="/about">关于</RouterLink>

// 带路径的对象
<RouterLink to={{ path: '/user/123' }}>用户</RouterLink>

// 命名路由
<RouterLink to={{ name: 'user', params: { id: '123' } }}>用户</RouterLink>

// 带查询
<RouterLink to={{ path: '/search', query: { q: 'essor' } }}>搜索</RouterLink>

// 带哈希
<RouterLink to={{ path: '/about', hash: '#team' }}>团队</RouterLink>
```

也可以传入 getter 以支持响应式目标：

```tsx
const $to = signal('/about')
<RouterLink to={() => $to.value}>Dynamic</RouterLink>
```

注意：在 JSX 中 `$` 前缀信号会被编译为 `.value` 读，`to={$to}` 会变成静态值。需要响应式 `to` 时请使用 getter。

### replace

- **类型：** `boolean`
- **默认值：** `false`

使用 `router.replace()` 而不是 `router.push()`：

```tsx
<RouterLink to="/about" replace>关于</RouterLink>
```

### activeClass

- **类型：** `string`
- **默认值：** `'router-link-active'`

链接激活时应用的类名：

```tsx
<RouterLink to="/about" activeClass="active">关于</RouterLink>
```

### exactActiveClass

- **类型：** `string`
- **默认值：** `'router-link-exact-active'`

链接精确激活时应用的类名：

```tsx
<RouterLink to="/about" exactActiveClass="exact-active">关于</RouterLink>
```

### custom

- **类型：** `boolean`
- **默认值：** `false`

不渲染锚点标签，只渲染子元素：

```tsx
<RouterLink to="/about" custom>
  {/* 渲染你自己的元素 */}
  <button>关于</button>
</RouterLink>
```

### ariaCurrentValue

- **类型：** `'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'`
- **默认值：** `'page'`

精确激活时 `aria-current` 的值：

```tsx
<RouterLink to="/about" ariaCurrentValue="page">关于</RouterLink>
```

未传入时，精确激活默认设置为 `aria-current="page"`。

### viewTransition

- **类型：** `boolean`
- **默认值：** `false`

导航时使用 View Transitions API：

```tsx
<RouterLink to="/about" viewTransition>关于</RouterLink>
```

### prefetch

- **类型：** `'intent' | 'render' | 'viewport' | false`
- **默认值：** `'intent'`（若匹配路由设置了 `start.preload`，则取该值）

在导航前预加载目标路由的异步组件与数据，让点击瞬间完成。取值决定**何时**触发预加载：

| 模式 | 触发时机 | 适用场景 |
|------|----------|----------|
| `'intent'` | 用户悬停、聚焦或触摸链接（产生点击意图）时 | 大多数链接——开销小、命中准 |
| `'render'` | 链接挂载时 | 少量高置信度的下一步 |
| `'viewport'` | 链接滚动进入视口时（通过 `IntersectionObserver`） | 长列表 / 信息流 |
| `false` | 从不——禁用预加载 | 很少被点击的链接 |

```tsx
// 默认（intent）：悬停/聚焦/触摸时预加载——无需传 prop
<RouterLink to="/dashboard">Dashboard</RouterLink>

// 链接一进入视口就预加载
<RouterLink to="/article/1" prefetch="viewport">阅读更多</RouterLink>

// 显式关闭
<RouterLink to="/rarely-visited" prefetch={false}>归档</RouterLink>
```

省略该 prop 时，模式取自匹配路由的 `start.preload`，并回退为 `'intent'`——因此链接**默认**会按意图预加载。传入 `prefetch={false}` 可让某个链接退出预加载。

预加载只在浏览器中运行，且不会阻塞渲染；失败会被静默忽略。每个链接至多预加载一次。当 `IntersectionObserver` 不可用时，`'viewport'` 会退化为立即预加载。

如需命令式控制，请使用 [`router.preloadRoute()`](./router-instance#preloadroute) 或 [`usePreloadRoute`](./composition-api#usepreloadroute)。

### class

- **类型：** `string`
- **必填：** 否

额外的 CSS 类名：

```tsx
<RouterLink to="/about" class="nav-link">关于</RouterLink>
```

### children

- **类型：** `ReactNode`
- **必填：** 否

链接内容：

```tsx
<RouterLink to="/about">
  <Icon name="info" />
  关于我们
</RouterLink>
```

## 激活状态

RouterLink 根据当前路由自动应用激活类名：

### 激活（部分匹配）

当前路由以链接路径开头时应用：

```tsx
// 当前路由：/user/123/profile
<RouterLink to="/user/123">用户</RouterLink>
// 有类名：router-link-active
```

### 精确激活（完全匹配）

当前路由与链接路径完全匹配时应用：

```tsx
// 当前路由：/user/123
<RouterLink to="/user/123">用户</RouterLink>
// 有类名：router-link-active router-link-exact-active
```

## 样式

```css
/* 默认激活类名 */
.router-link-active {
  color: blue;
}

/* 默认精确激活类名 */
.router-link-exact-active {
  font-weight: bold;
}

/* 自定义类名 */
.nav-link.active {
  background-color: #eee;
}

.nav-link.exact-active {
  border-bottom: 2px solid blue;
}
```

## 示例

### 导航菜单

```tsx
function Navigation() {
  return (
    <nav>
      <RouterLink to="/" exactActiveClass="active">
        首页
      </RouterLink>
      <RouterLink to="/about" activeClass="active">
        关于
      </RouterLink>
      <RouterLink to="/contact" activeClass="active">
        联系
      </RouterLink>
    </nav>
  );
}
```

### 带图标

```tsx
<RouterLink to="/settings" class="nav-item">
  <Icon name="settings" />
  <span>设置</span>
</RouterLink>
```

### 按钮样式

```tsx
<RouterLink to="/signup" class="btn btn-primary">
  注册
</RouterLink>
```

### 自定义渲染

```tsx
<RouterLink to="/about" custom>
  <button class="custom-button">
    前往关于页
  </button>
</RouterLink>
```

### 带查询参数

```tsx
<RouterLink 
  to={{ 
    path: '/products', 
    query: { category: 'electronics', sort: 'price' } 
  }}
>
  电子产品
</RouterLink>
```

### 带参数的命名路由

```tsx
<RouterLink 
  to={{ 
    name: 'user-profile', 
    params: { userId: '123' } 
  }}
>
  查看资料
</RouterLink>
```

### 编程式激活检查

```tsx
function NavLink({ to, children }) {
  const route = useRoute();
  const isActive = route.path.startsWith(to);
  
  return (
    <RouterLink 
      to={to} 
      class={`nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </RouterLink>
  );
}
```

## useLink

`useLink` 暴露了驱动 `RouterLink` 的同一套逻辑，便于你构建完全自定义的链接组件。它接收与 `RouterLink` 相同的 props，返回响应式的链接状态以及 `navigate` 处理函数。

### 签名

```tsx
function useLink(props: RouterLinkProps): UseLinkReturn

interface UseLinkReturn {
  route: ReadonlyValue<RouteLocationNormalized>; // 解析后的目标路由
  href: ReadonlyValue<string>;                   // 解析后的 href
  isActive: ReadonlyValue<boolean>;              // 部分（前缀）匹配
  isExactActive: ReadonlyValue<boolean>;         // 精确匹配
  navigate(e?: MouseEvent): Promise<void | NavigationFailure>;
}
```

### 用法

```tsx
import { useLink } from 'essor-router';

function NavButton(props) {
  const { href, isActive, navigate } = useLink(props);

  return (
    <button
      class={isActive.value ? 'active' : ''}
      onClick={navigate}
    >
      {props.children}
    </button>
  );
}

// <NavButton to="/about">关于</NavButton>
```

`navigate` 已经像 `RouterLink` 一样处理了修饰键点击与右键点击，因此可直接绑定到 `onClick`。如果只需覆盖渲染，可配合 `RouterLink` 的 `custom` 属性；当你需要完全控制元素与行为时，使用 `useLink`。

## 无障碍

RouterLink 自动处理无障碍：

- 默认渲染为 `<a>` 元素
- 精确激活时设置 `aria-current="page"`
- 处理键盘导航
- 点击时阻止默认行为以进行 SPA 导航
