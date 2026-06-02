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
        // Sidebar is generated from the document routes. Group titles and
        // ordering live in each folder's `_meta.json`; per-page tweaks use
        // `sidebar_position` / `sidebar_label` frontmatter.
        sidebar: "auto",
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
        // Sidebar is generated from the document routes. Group titles and
        // ordering live in each folder's `_meta.json`; per-page tweaks use
        // `sidebar_position` / `sidebar_label` frontmatter.
        sidebar: "auto",
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
