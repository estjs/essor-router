import { createComponent as h } from 'essor';
import { RouterLink, RouterView, createMemoryHistory, createRouter } from '../src';
import { mount, sleep } from './utils';

describe('routerLink', () => {
  let router;
  let wrapper;

  const About = () => h(RouterLink, { to: '/', children: ['About'] });
  const User = () => h(RouterLink, { to: '/users/1', children: ['Users'] });
  const Home = () => h(RouterLink, { to: '/about', children: ['Home'] });

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: Home },
        { path: '/about', name: 'about', component: About },
        { path: '/users/:id', name: 'user', component: User },
      ],
    });

    const App = () => {
      return h(RouterView, { router });
    };
    wrapper = mount(App);
    // router is async, need to wait
    await sleep(100);
    // Ensure router has navigated to initial route
    await router.push('/');
    await sleep(50);
  });

  afterEach(() => {
    wrapper && wrapper.unmount();
    wrapper = null;
  });

  it('renders an anchor tag by default', async () => {
    // Wait for component to render properly
    await sleep(50);
    const anchor = wrapper.get('a');
    expect(anchor).toBeTruthy();
    expect(anchor.textContent).toBe('Home');
  });

  it('uses replace when replace prop is true', async () => {
    // Create a simple component that renders RouterLink within RouterView context
    const TestComponent = () =>
      h(RouterLink, {
        to: '/about',
        replace: true,
        children: ['About'],
      });

    const replaceWrapper = mount(() =>
      h(RouterView, {
        router,
        children: [h(TestComponent)],
      }),
    );

    await sleep(100);
    const anchor = replaceWrapper.get('a');
    expect(anchor).toBeTruthy();

    // Trigger click event
    anchor.click();
    await sleep(50); // Allow time for async navigation

    expect(router.replace).toHaveBeenCalledTimes(1);

    replaceWrapper.unmount();
  });

  it('applies custom active class when provided', async () => {
    // Create a simple component that renders RouterLink within RouterView context
    const TestComponent = () =>
      h(RouterLink, {
        to: '/',
        activeClass: 'my-active-class',
        children: 'Home',
      });

    const customWrapper = mount(() =>
      h(RouterView, {
        router,
        children: h(TestComponent),
      }),
    );

    // Ensure we're on the root route to make the link active
    await router.push('/');
    await sleep(100);

    const anchor = customWrapper.get('a');
    expect(anchor).toBeTruthy();
    expect(anchor.classList.contains('my-active-class')).toBe(true);

    customWrapper.unmount();
  });

  it('handles object as "to" prop', async () => {
    const spy = vi.spyOn(router, 'push');

    // Create a simple component that renders RouterLink within RouterView context
    const TestComponent = () =>
      h(RouterLink, {
        to: { name: 'user', params: { id: '123' } },
        children: 'User',
      });

    const objectWrapper = mount(() =>
      h(RouterView, {
        router,
        children: h(TestComponent),
      }),
    );

    await sleep(100);
    const anchor = objectWrapper.get('a');
    expect(anchor).toBeTruthy();

    // Trigger click event
    anchor.click();
    await sleep(150); // Allow time for async navigation

    expect(spy).toHaveBeenCalledWith({ name: 'user', params: { id: '123' } });

    objectWrapper.unmount();
  });
});
