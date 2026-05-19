import { defineConfig } from "athen";
import pkg from "../package.json";

export default defineConfig({
  lang: "en-US",
  title: "essor-router",
  description: "The official router for Essor framework",
  icon: "/logo.svg",

  themeConfig: {
    locales: {
      "/zh/": {
        lang: "zh",
        label: "简体中文",
        title: "essor-router",
        description: "Essor 框架的官方路由库",
        nav: [
          {
            text: "指南",
            link: "/zh/guide/",
            activeMatch: "/zh/guide/",
          },
          {
            text: "API",
            link: "/zh/api/",
            activeMatch: "/zh/api/",
          },
          {
            text: `v${pkg.version}`,
            items: [
              {
                text: "更新日志",
                link: "https://github.com/estjs/essor-router/blob/master/CHANGELOG.md",
              },
            ],
          },
        ],
        sidebar: {
          "/zh/guide/": [
            {
              text: "入门",
              items: [
                { text: "介绍", link: "/zh/guide/" },
                { text: "安装", link: "/zh/guide/installation" },
                { text: "快速开始", link: "/zh/guide/getting-started" },
              ],
            },
            {
              text: "基础",
              items: [
                {
                  text: "路由配置",
                  link: "/zh/guide/essentials/route-configuration",
                },
                {
                  text: "动态路由匹配",
                  link: "/zh/guide/essentials/dynamic-matching",
                },
                {
                  text: "嵌套路由",
                  link: "/zh/guide/essentials/nested-routes",
                },
                { text: "编程式导航", link: "/zh/guide/essentials/navigation" },
                { text: "命名路由", link: "/zh/guide/essentials/named-routes" },
                { text: "命名视图", link: "/zh/guide/essentials/named-views" },
                {
                  text: "重定向和别名",
                  link: "/zh/guide/essentials/redirect-and-alias",
                },
                {
                  text: "路由组件传参",
                  link: "/zh/guide/essentials/passing-props",
                },
                { text: "历史模式", link: "/zh/guide/essentials/history-mode" },
              ],
            },
            {
              text: "进阶",
              items: [
                {
                  text: "导航守卫",
                  link: "/zh/guide/advanced/navigation-guards",
                },
                { text: "路由元信息", link: "/zh/guide/advanced/meta" },
                { text: "懒加载", link: "/zh/guide/advanced/lazy-loading" },
                {
                  text: "动态路由",
                  link: "/zh/guide/advanced/dynamic-routing",
                },
                {
                  text: "组合式 API",
                  link: "/zh/guide/advanced/composition-api",
                },
                {
                  text: "文件路由（Unplugin）",
                  link: "/zh/guide/advanced/file-based-routing-unplugin",
                },
              ],
            },
          ],
          "/zh/api/": [
            {
              text: "API 参考",
              items: [
                { text: "概览", link: "/zh/api/" },
                { text: "createRouter", link: "/zh/api/create-router" },
                { text: "Router 实例", link: "/zh/api/router-instance" },
                { text: "RouterView", link: "/zh/api/router-view" },
                { text: "RouterLink", link: "/zh/api/router-link" },
                { text: "组合式函数", link: "/zh/api/composition-api" },
                { text: "类型定义", link: "/zh/api/types" },
                { text: "配置兼容", link: "/zh/api/config-alignment" },
                { text: "Unplugin", link: "/zh/api/unplugin" },
              ],
            },
          ],
        },
        outlineTitle: "目录",
        lastUpdatedText: "上次更新",
        prevPageText: "上一页",
        nextPageText: "下一页",
        editLink: {
          pattern:
            "https://github.com/estjs/essor-router/tree/master/docs/:path",
          text: "在 GitHub 上编辑此页",
        },
      },
      "/": {
        lang: "en",
        label: "English",
        title: "essor-router",
        description: "The official router for Essor framework",
        nav: [
          {
            text: "Guide",
            link: "/guide/",
            activeMatch: "/guide/",
          },
          {
            text: "API",
            link: "/api/",
            activeMatch: "/api/",
          },
          {
            text: `v${pkg.version}`,
            items: [
              {
                text: "Changelog",
                link: "https://github.com/estjs/essor-router/blob/master/CHANGELOG.md",
              },
            ],
          },
        ],
        sidebar: {
          "/guide/": [
            {
              text: "Getting Started",
              items: [
                { text: "Introduction", link: "/guide/" },
                { text: "Installation", link: "/guide/installation" },
                { text: "Quick Start", link: "/guide/getting-started" },
              ],
            },
            {
              text: "Essentials",
              items: [
                {
                  text: "Route Configuration",
                  link: "/guide/essentials/route-configuration",
                },
                {
                  text: "Dynamic Route Matching",
                  link: "/guide/essentials/dynamic-matching",
                },
                {
                  text: "Nested Routes",
                  link: "/guide/essentials/nested-routes",
                },
                {
                  text: "Programmatic Navigation",
                  link: "/guide/essentials/navigation",
                },
                {
                  text: "Named Routes",
                  link: "/guide/essentials/named-routes",
                },
                { text: "Named Views", link: "/guide/essentials/named-views" },
                {
                  text: "Redirect and Alias",
                  link: "/guide/essentials/redirect-and-alias",
                },
                {
                  text: "Passing Props",
                  link: "/guide/essentials/passing-props",
                },
                {
                  text: "History Modes",
                  link: "/guide/essentials/history-mode",
                },
              ],
            },
            {
              text: "Advanced",
              items: [
                {
                  text: "Navigation Guards",
                  link: "/guide/advanced/navigation-guards",
                },
                { text: "Route Meta Fields", link: "/guide/advanced/meta" },
                { text: "Lazy Loading", link: "/guide/advanced/lazy-loading" },
                {
                  text: "Dynamic Routing",
                  link: "/guide/advanced/dynamic-routing",
                },
                {
                  text: "Composition API",
                  link: "/guide/advanced/composition-api",
                },
                {
                  text: "Scroll Behavior",
                  link: "/guide/advanced/scroll-behavior",
                },
                {
                  text: "Query Handling",
                  link: "/guide/advanced/query-handling",
                },
                {
                  text: "Param Parsers",
                  link: "/guide/advanced/param-parsers",
                },
                {
                  text: "Config-Based Routing",
                  link: "/guide/advanced/config-based-routing",
                },
                {
                  text: "File-Based Routing (Unplugin)",
                  link: "/guide/advanced/file-based-routing-unplugin",
                },
              ],
            },
          ],
          "/api/": [
            {
              text: "API Reference",
              items: [
                { text: "Overview", link: "/api/" },
                { text: "createRouter", link: "/api/create-router" },
                { text: "Router Instance", link: "/api/router-instance" },
                { text: "RouterView", link: "/api/router-view" },
                { text: "RouterLink", link: "/api/router-link" },
                { text: "Composition API", link: "/api/composition-api" },
                { text: "TypeScript", link: "/api/types" },
                { text: "Config Alignment", link: "/api/config-alignment" },
                { text: "Unplugin", link: "/api/unplugin" },
              ],
            },
          ],
        },
        outlineTitle: "On This Page",
        lastUpdatedText: "Last Updated",
        editLink: {
          pattern:
            "https://github.com/estjs/essor-router/tree/master/docs/:path",
          text: "Edit this page on GitHub",
        },
      },
    },
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: "https://github.com/estjs/essor-router",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2023-present estjs",
    },
  },
});
