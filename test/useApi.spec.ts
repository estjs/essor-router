/**
 * @vitest-environment jsdom
 */

import { h as _h$, template as _template$, useEffect } from 'essor';
import { createRouter, useRoute } from '../src';
import { mount } from './utils';

describe('use apis', () => {
  it('unwraps useRoute()', async () => {
    const router = createRouter({
      history: 'memory',
      routes: [
        {
          path: '/:any(.*)',
          component: () => _h$(_template$('<div>Page</div>'), {}) as any,
        },
      ],
    });
    function App() {
      const route = useRoute();
      return _h$(_template$('<div>Query: </div>'), {
        '1': {
          children: [[() => route.value.query.q, null]],
        },
      });
    }
    const wrapper = mount(App);

    expect(wrapper.text()).toBe('Query: ');

    await router.push('/?q=hi');
    expect(wrapper.text()).toBe('Query: hi');
  });
});
