# API 参考

本节包含 essor-router 的完整 API 参考。

## 核心

- [createRouter](/zh/api/create-router) - 创建路由器实例
- [Router 实例](/zh/api/router-instance) - 路由器方法和属性
- [配置对齐](/zh/api/config-alignment) - 文件路由和配置路由模式

## 组件

- [RouterView](/zh/api/router-view) - 渲染匹配的路由组件
- [RouterLink](/zh/api/router-link) - 声明式导航链接

## 组合式 API

- [useRouter](/zh/api/composition-api#userouter) - 访问路由器实例
- [useRoute](/zh/api/composition-api#useroute) - 访问当前路由
- [onBeforeRouteLeave](/zh/api/composition-api#onbeforerouteleave) - 离开守卫
- [onBeforeRouteUpdate](/zh/api/composition-api#onbeforerouteupdate) - 更新守卫

## 进阶

- [滚动行为](/zh/guide/advanced/scroll-behavior) - 自定义滚动位置逻辑
- [查询字符串处理](/zh/guide/advanced/query-handling) - 解析和序列化查询参数
- [自定义参数解析器](/zh/guide/advanced/param-parsers) - 类型化路由参数转换
- [配置式路由](/zh/guide/advanced/config-based-routing) - 通过配置文件定义路由
- [文件系统路由](/zh/guide/advanced/file-based-routing-unplugin) - 文件路由和代码生成

## 历史

- [createWebHistory](/zh/api/create-router#createwebhistory) - HTML5 History
- [createWebHashHistory](/zh/api/create-router#createwebhashhistory) - Hash History
- [createMemoryHistory](/zh/api/create-router#creatememoryhistory) - Memory History

## 类型

- [TypeScript 定义](/zh/api/types) - 类型定义和接口

## 构建插件

- [Unplugin API](/zh/api/unplugin) - 文件路由、生成模块与配置项

## 工具函数

- [isNavigationFailure](/zh/api/router-instance#isnavigationfailure) - 检查导航失败
- [NavigationFailureType](/zh/api/router-instance#navigationfailuretype) - 失败类型枚举
