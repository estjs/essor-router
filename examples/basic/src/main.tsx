import { RouterLink, RouterView, createRouter } from 'essor-router';
import { createApp } from 'essor';

function Home() {
  return (
    <RouterLink to="/about" class="home">
      Home
    </RouterLink>
  );
}

function About() {
  return (
    <RouterLink to="/" class="about">
      About
    </RouterLink>
  );
}
function notFound() {
  return <div class="notfound">404</div>;
}
const router = createRouter({
  history: 'history',
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/about',
      component: About,
    },
    {
      path: '/:pathMatch(.*)*',
      component: notFound,
    },
  ],
});

const App = () => {
  return (
    <div style={{ padding: '20px' }}>
      <p style={{ color: '#666', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <em>
          Note: This is a basic configuration passing a runtime array of route objects. For typed or
          file-based usage, see the other examples.
        </em>
      </p>
      <RouterView router={router}></RouterView>
    </div>
  );
};

createApp(App, '#app');
