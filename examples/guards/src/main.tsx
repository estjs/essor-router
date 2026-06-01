import { createApp } from 'essor';
import { RouterView, createRouter } from 'essor-router';
import Home from './Home';
import About from './About';
import Protected from './Protected';
import Detail from './Detail';
import NotFound from './NotFound';

const router = createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home, name: 'home' },
    { path: '/about', component: About, name: 'about' },
    {
      path: '/protected',
      component: Protected,
      name: 'protected',
      beforeEnter(to, from, next) {
        const el = document.querySelector('#guard-beforeEnter');
        if (el) el.textContent = 'beforeEnter: reached';
        next();
      },
    },
    { path: '/detail/:id', component: Detail, name: 'detail' },
    {
      // guard that redirects elsewhere via next('/about')
      path: '/redirect-guard',
      component: Home,
      name: 'redirect-guard',
      beforeEnter(to, from, next) {
        next('/about');
      },
    },
    {
      // guard that cancels the navigation via next(false)
      path: '/blocked',
      component: Protected,
      name: 'blocked',
      beforeEnter(to, from, next) {
        const el = document.querySelector('#guard-blocked');
        if (el) el.textContent = 'blocked: cancelled';
        next(false);
      },
    },
    { path: '/:pathMatch(.*)*', component: NotFound, name: 'not-found' },
  ],
});

router.beforeEach((to, from, next) => {
  const el = document.querySelector('#guard-beforeEach');
  if (el) el.textContent = `beforeEach: ${from?.fullPath ?? 'init'} → ${to.fullPath}`;
  next();
});

router.beforeResolve((to, from, next) => {
  const el = document.querySelector('#guard-beforeResolve');
  if (el) el.textContent = `beforeResolve: ${from?.fullPath ?? 'init'} → ${to.fullPath}`;
  next();
});

router.afterEach((to, from) => {
  const el = document.querySelector('#guard-afterEach');
  if (el) el.textContent = `afterEach: ${from?.fullPath ?? 'init'} → ${to.fullPath}`;
});

function Nav() {
  const handleClick = (path: string) => (e: Event) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <header>
      <nav style="display: flex; gap: 10px; padding: 10px; background: #eee;">
        <span data-testid="link-home" onClick={handleClick('/')}>
          Home
        </span>
        <span data-testid="link-about" onClick={handleClick('/about')}>
          About
        </span>
        <span data-testid="link-protected" onClick={handleClick('/protected')}>
          Protected
        </span>
        <span data-testid="link-detail-1" onClick={handleClick('/detail/1')}>
          Detail 1
        </span>
        <span data-testid="link-detail-2" onClick={handleClick('/detail/2')}>
          Detail 2
        </span>
        <span data-testid="link-missing" onClick={handleClick('/missing')}>
          Missing
        </span>
        <span data-testid="link-redirect-guard" onClick={handleClick('/redirect-guard')}>
          Redirect Guard
        </span>
        <span data-testid="link-blocked" onClick={handleClick('/blocked')}>
          Blocked
        </span>
      </nav>
    </header>
  );
}

const App = () => {
  return (
    <div>
      <Nav />
      <div style="padding: 20px;">
        <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
          <h3>Guard Results:</h3>
          <div data-testid="guard-beforeEach" id="guard-beforeEach"></div>
          <div data-testid="guard-beforeResolve" id="guard-beforeResolve"></div>
          <div data-testid="guard-afterEach" id="guard-afterEach"></div>
          <div data-testid="guard-beforeEnter" id="guard-beforeEnter"></div>
          <div data-testid="guard-beforeRouteLeave" id="guard-beforeRouteLeave"></div>
          <div data-testid="guard-beforeRouteUpdate" id="guard-beforeRouteUpdate"></div>
          <div data-testid="guard-blocked" id="guard-blocked"></div>
        </div>
        <RouterView router={router} />
      </div>
    </div>
  );
};

createApp(App, '#app');
