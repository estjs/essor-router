import { h } from 'essor';
import { RouterLink, RouterView, createMemoryHistory, createRouter } from '../src';
import { mount, sleep } from './utils';

describe('routerLink', () => {
  let router;
  let wrapper;

  const About = () => h(RouterLink, { to: '/', children: 'About' });
  const User = () => h(RouterLink, { to: '/users/1', children: 'Users' });
  const Home = () => h(RouterLink, { to: '/about', children: 'Home' });

  beforeEach(async () => {
    const App = () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: Home },
          { path: '/about', name: 'about', component: About },
          { path: '/users/:id', name: 'user', component: User },
        ],
      });
      return h(RouterView, {});
    };
    wrapper = mount(App);
    // router is async, need to wait
    await sleep(100);
  });

  it('renders an anchor tag by default', () => {
    expect(wrapper.get('a').textContent).toBe('Home');
  });

  it('uses replace when replace prop is true', () => {
    const replaceWrapper = mount(RouterLink, {
      to: '/about',
      replace: true,
      children: 'About',
    });
    const spy = vi.spyOn(router, 'replace');
    replaceWrapper.get('a').click();
    expect(spy).toHaveBeenCalledWith('/about');
  });

  it('applies custom active class when provided', async () => {
    const customWrapper = mount(RouterLink, {
      to: '/',
      activeClass: 'my-active-class',
      children: 'Home',
    });
    await router.push('/');
    expect(customWrapper.get('a').classList.contains('my-active-class')).toBe(true);
  });

  it('handles object as "to" prop', () => {
    const objectWrapper = mount(RouterLink, {
      to: { name: 'user', params: { id: '123' } },
      children: 'User',
    });
    const spy = vi.spyOn(router, 'push');
    objectWrapper.get('a').click();
    expect(spy).toHaveBeenCalledWith({ name: 'user', params: { id: '123' } });
  });
});
