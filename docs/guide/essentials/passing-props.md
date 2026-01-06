# Passing Props to Route Components

Using `props` in routes allows you to decouple your components from the route, making them more reusable.

## Boolean Mode

When `props` is set to `true`, `route.params` will be passed as component props:

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    props: true,
  },
];

// Component receives id as a prop
function User({ id }) {
  return <div>User ID: {id}</div>;
}
```

This is equivalent to:

```tsx
function User() {
  const route = useRoute();
  return <div>User ID: {route.params.id}</div>;
}
```

But the props version is more reusable since it doesn't depend on the router.

## Object Mode

Pass static props to the component:

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
      <h1>About Us</h1>
      {newsletter && <NewsletterSignup />}
      <p>Version: {version}</p>
    </div>
  );
}
```

## Function Mode

Use a function to compute props dynamically:

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
      <h1>Results for: {query}</h1>
      <p>Page: {page}, Sort: {sort}</p>
    </div>
  );
}
```

### Combining Params and Query

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

## Props with Named Views

For routes with named views, define props for each view:

```tsx
const routes = [
  {
    path: '/user/:id',
    components: {
      default: UserProfile,
      sidebar: UserSidebar,
    },
    props: {
      default: true, // Pass params as props
      sidebar: (route) => ({ userId: route.params.id }),
    },
  },
];
```

## Props in Nested Routes

Each nested route can have its own props configuration:

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
        props: true, // Also receives :id
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

## TypeScript Support

Define prop types for better type safety:

```tsx
interface UserProps {
  id: string;
}

function User({ id }: UserProps) {
  return <div>User ID: {id}</div>;
}

const routes = [
  {
    path: '/user/:id',
    component: User,
    props: true,
  },
];
```

### With Function Mode

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

## Practical Examples

### Product Page

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

### Blog Post

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

### Dashboard with Filters

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    props: (route) => ({
      dateRange: route.query.range || '7d',
      metrics: route.query.metrics?.split(',') || ['views', 'clicks'],
      comparison: route.query.compare === 'true',
    }),
  },
];

function Dashboard({ dateRange, metrics, comparison }) {
  return (
    <div>
      <DateRangePicker value={dateRange} />
      <MetricsSelector selected={metrics} />
      <Charts metrics={metrics} comparison={comparison} />
    </div>
  );
}
```

## Benefits of Using Props

1. **Reusability**: Components don't depend on the router
2. **Testability**: Easy to test with different props
3. **Clarity**: Props make component dependencies explicit
4. **Type Safety**: Better TypeScript integration
