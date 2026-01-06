# 路由组件传参

在路由中使用 `props` 可以将组件与路由解耦，使组件更具复用性。

## 布尔模式

当 `props` 设置为 `true` 时，`route.params` 将作为组件 props 传递：

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    props: true,
  },
];

// 组件接收 id 作为 prop
function User({ id }) {
  return <div>用户 ID：{id}</div>;
}
```

这等同于：

```tsx
function User() {
  const route = useRoute();
  return <div>用户 ID：{route.params.id}</div>;
}
```

但 props 版本更具复用性，因为它不依赖路由器。

## 对象模式

向组件传递静态 props：

```tsx
const routes = [
  {
    path: '/about',
    component: About,
    props: { newsletter: true, version: '2.0' },
  },
];

function About({ newsletter, version }) {
  return (
    <div>
      <h1>关于我们</h1>
      {newsletter && <NewsletterSignup />}
      <p>版本：{version}</p>
    </div>
  );
}
```

## 函数模式

使用函数动态计算 props：

```tsx
const routes = [
  {
    path: '/search',
    component: SearchResults,
    props: (route) => ({
      query: route.query.q,
      page: Number.parseInt(route.query.page) || 1,
      sort: route.query.sort || 'relevance',
    }),
  },
];

function SearchResults({ query, page, sort }) {
  return (
    <div>
      <h1>搜索结果：{query}</h1>
      <p>页码：{page}，排序：{sort}</p>
    </div>
  );
}
```

### 组合参数和查询

```tsx
const routes = [
  {
    path: '/user/:id',
    component: UserProfile,
    props: (route) => ({
      id: route.params.id,
      tab: route.query.tab || 'overview',
      showPrivate: route.query.private === 'true',
    }),
  },
];
```

## 命名视图的 Props

对于有命名视图的路由，为每个视图定义 props：

```tsx
const routes = [
  {
    path: '/user/:id',
    components: {
      default: UserProfile,
      sidebar: UserSidebar,
    },
    props: {
      default: true, // 将参数作为 props 传递
      sidebar: (route) => ({ userId: route.params.id }),
    },
  },
];
```

## 嵌套路由的 Props

每个嵌套路由可以有自己的 props 配置：

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    props: true,
    children: [
      {
        path: 'profile',
        component: UserProfile,
        props: true, // 也接收 :id
      },
      {
        path: 'posts',
        component: UserPosts,
        props: (route) => ({
          userId: route.params.id,
          filter: route.query.filter,
        }),
      },
    ],
  },
];
```

## TypeScript 支持

定义 prop 类型以获得更好的类型安全：

```tsx
interface UserProps {
  id: string;
}

function User({ id }: UserProps) {
  return <div>用户 ID：{id}</div>;
}

const routes = [
  {
    path: '/user/:id',
    component: User,
    props: true,
  },
];
```

### 函数模式

```tsx
interface SearchProps {
  query: string;
  page: number;
  sort: 'relevance' | 'date' | 'rating';
}

function SearchResults({ query, page, sort }: SearchProps) {
  return <div>...</div>;
}

const routes = [
  {
    path: '/search',
    component: SearchResults,
    props: (route): SearchProps => ({
      query: route.query.q as string || '',
      page: Number.parseInt(route.query.page as string) || 1,
      sort: (route.query.sort as SearchProps['sort']) || 'relevance',
    }),
  },
];
```

## 实际示例

### 产品页面

```tsx
const routes = [
  {
    path: '/product/:id',
    component: ProductPage,
    props: (route) => ({
      productId: route.params.id,
      variant: route.query.variant,
      showReviews: route.hash === '#reviews',
    }),
  },
];

function ProductPage({ productId, variant, showReviews }) {
  return (
    <div>
      <ProductDetails id={productId} variant={variant} />
      {showReviews && <ProductReviews productId={productId} />}
    </div>
  );
}
```

### 博客文章

```tsx
const routes = [
  {
    path: '/blog/:year/:month/:slug',
    component: BlogPost,
    props: true,
  },
];

function BlogPost({ year, month, slug }) {
  return (
    <article>
      <time>{year}/{month}</time>
      <h1>{slug}</h1>
    </article>
  );
}
```

## 使用 Props 的好处

1. **复用性**：组件不依赖路由器
2. **可测试性**：易于使用不同的 props 进行测试
3. **清晰性**：Props 使组件依赖更明确
4. **类型安全**：更好的 TypeScript 集成
