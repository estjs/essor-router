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
    const spy = vi.spyOn(router, 'replace');
    
    // Navigate to home first
    await router.push('/');
    await sleep(50);
    
    // Get the anchor from the rendered Home component (which contains a RouterLink to /about)
    const anchor = wrapper.get('a');
    expect(anchor).toBeTruthy();
    expect(anchor.textContent).toBe('Home');

    // Create a new router with a route that has replace=true
    const TestLinkComponent = () =>
      h(RouterLink, {
        to: '/about',
        replace: true,
        children: ['Replace Link'],
      });

    const testRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: TestLinkComponent },
        { path: '/about', name: 'about', component: About },
      ],
    });

    const testWrapper = mount(() => h(RouterView, { router: testRouter }));
    await sleep(100);
    await testRouter.push('/');
    await sleep(50);

    const testSpy = vi.spyOn(testRouter, 'replace');
    const testAnchor = testWrapper.get('a');
    expect(testAnchor).toBeTruthy();

    // Trigger click event
    testAnchor.click();
    await sleep(50); // Allow time for async navigation

    expect(testSpy).toHaveBeenCalledTimes(1);

    testWrapper.unmount();
  });

  it('applies custom active class when provided', async () => {
    // Create a component that renders RouterLink with custom activeClass
    const TestComponent = () =>
      h(RouterLink, {
        to: '/',
        activeClass: 'my-active-class',
        children: 'Home',
      });

    const testRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: TestComponent },
        { path: '/about', name: 'about', component: About },
      ],
    });

    const customWrapper = mount(() => h(RouterView, { router: testRouter }));
    await sleep(100);
    
    // Ensure we're on the root route to make the link active
    await testRouter.push('/');
    await sleep(100);

    const anchor = customWrapper.get('a');
    expect(anchor).toBeTruthy();
    expect(anchor.classList.contains('my-active-class')).toBe(true);

    customWrapper.unmount();
  });

  it('handles object as "to" prop', async () => {
    // Create a component that renders RouterLink with object "to" prop
    const TestComponent = () =>
      h(RouterLink, {
        to: { name: 'user', params: { id: '123' } },
        children: 'User',
      });

    const testRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: TestComponent },
        { path: '/users/:id', name: 'user', component: User },
      ],
    });

    const spy = vi.spyOn(testRouter, 'push');

    const objectWrapper = mount(() => h(RouterView, { router: testRouter }));
    await sleep(100);
    await testRouter.push('/');
    await sleep(50);

    const anchor = objectWrapper.get('a');
    expect(anchor).toBeTruthy();

    // Trigger click event
    anchor.click();
    await sleep(150); // Allow time for async navigation

    expect(spy).toHaveBeenCalledWith({ name: 'user', params: { id: '123' } });

    objectWrapper.unmount();
  });
});
