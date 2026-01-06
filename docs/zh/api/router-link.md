# RouterLink

`RouterLink` 组件创建导航链接。

## 基本用法

```tsx
import { RouterLink } from 'essor-router';

<RouterLink to="/about">关于</RouterLink>
```

## Props

### to

- **类型：** `string | RouteLocationRaw`
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

### viewTransition

- **类型：** `boolean`
- **默认值：** `false`

导航时使用 View Transitions API：

```tsx
<RouterLink to="/about" viewTransition>关于</RouterLink>
```

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

## 无障碍

RouterLink 自动处理无障碍：

- 默认渲染为 `<a>` 元素
- 精确激活时设置 `aria-current="page"`
- 处理键盘导航
- 点击时阻止默认行为以进行 SPA 导航
