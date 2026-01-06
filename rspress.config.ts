import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: 'docs',
  title: 'essor-router',
  description: 'The official router for Essor framework',
  icon: '/logo.svg',
  logo: '/logo.svg',
  
  // 默认语言
  lang: 'en',
  
  // 多语言配置
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'essor-router',
      description: 'The official router for Essor framework',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'essor-router',
      description: 'Essor 框架的官方路由库',
    },
  ],

  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/estjs/essor-router',
      },
    ],
    footer: {
      message: 'Released under the MIT License.',
    },
    // 所有侧边栏配置
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Essentials',
          items: [
            { text: 'Route Configuration', link: '/guide/essentials/route-configuration' },
            { text: 'Dynamic Route Matching', link: '/guide/essentials/dynamic-matching' },
            { text: 'Nested Routes', link: '/guide/essentials/nested-routes' },
            { text: 'Programmatic Navigation', link: '/guide/essentials/navigation' },
            { text: 'Named Routes', link: '/guide/essentials/named-routes' },
            { text: 'Named Views', link: '/guide/essentials/named-views' },
            { text: 'Redirect and Alias', link: '/guide/essentials/redirect-and-alias' },
            { text: 'Passing Props', link: '/guide/essentials/passing-props' },
            { text: 'History Modes', link: '/guide/essentials/history-mode' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Navigation Guards', link: '/guide/advanced/navigation-guards' },
            { text: 'Route Meta Fields', link: '/guide/advanced/meta' },
            { text: 'Lazy Loading', link: '/guide/advanced/lazy-loading' },
            { text: 'Dynamic Routing', link: '/guide/advanced/dynamic-routing' },
            { text: 'Composition API', link: '/guide/advanced/composition-api' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'createRouter', link: '/api/create-router' },
            { text: 'Router Instance', link: '/api/router-instance' },
            { text: 'RouterView', link: '/api/router-view' },
            { text: 'RouterLink', link: '/api/router-link' },
            { text: 'Composition API', link: '/api/composition-api' },
            { text: 'TypeScript', link: '/api/types' },
          ],
        },
      ],
      '/zh/guide/': [
        {
          text: '入门',
          items: [
            { text: '介绍', link: '/zh/guide/' },
            { text: '安装', link: '/zh/guide/installation' },
            { text: '快速开始', link: '/zh/guide/getting-started' },
          ],
        },
        {
          text: '基础',
          items: [
            { text: '路由配置', link: '/zh/guide/essentials/route-configuration' },
            { text: '动态路由匹配', link: '/zh/guide/essentials/dynamic-matching' },
            { text: '嵌套路由', link: '/zh/guide/essentials/nested-routes' },
            { text: '编程式导航', link: '/zh/guide/essentials/navigation' },
            { text: '命名路由', link: '/zh/guide/essentials/named-routes' },
            { text: '命名视图', link: '/zh/guide/essentials/named-views' },
            { text: '重定向和别名', link: '/zh/guide/essentials/redirect-and-alias' },
            { text: '路由组件传参', link: '/zh/guide/essentials/passing-props' },
            { text: '历史模式', link: '/zh/guide/essentials/history-mode' },
          ],
        },
        {
          text: '进阶',
          items: [
            { text: '导航守卫', link: '/zh/guide/advanced/navigation-guards' },
            { text: '路由元信息', link: '/zh/guide/advanced/meta' },
            { text: '懒加载', link: '/zh/guide/advanced/lazy-loading' },
            { text: '动态路由', link: '/zh/guide/advanced/dynamic-routing' },
            { text: '组合式 API', link: '/zh/guide/advanced/composition-api' },
          ],
        },
      ],
      '/zh/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/zh/api/' },
            { text: 'createRouter', link: '/zh/api/create-router' },
            { text: 'Router 实例', link: '/zh/api/router-instance' },
            { text: 'RouterView', link: '/zh/api/router-view' },
            { text: 'RouterLink', link: '/zh/api/router-link' },
            { text: '组合式函数', link: '/zh/api/composition-api' },
            { text: '类型定义', link: '/zh/api/types' },
          ],
        },
      ],
    },
    // 多语言主题配置 - 必须是数组
    locales: [
      {
        lang: 'en',
        label: 'English',
        nav: [
          { text: 'Guide', link: '/guide/' },
          { text: 'API', link: '/api/' },
        ],
        outlineTitle: 'On This Page',
      },
      {
        lang: 'zh',
        label: '简体中文',
        nav: [
          { text: '指南', link: '/zh/guide/' },
          { text: 'API', link: '/zh/api/' },
        ],
        outlineTitle: '目录',
      },
    ],
  },
});
