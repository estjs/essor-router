# API 参考

本节包含 essor-router 的完整 API 参考。

## 核心

- [createRouter](/zh/api/create-router) - 创建路由器实例
- [Router 实例](/zh/api/router-instance) - 路由器方法和属性

## 组件

- [RouterView](/zh/api/router-view) - 渲染匹配的路由组件
- [RouterLink](/zh/api/router-link) - 声明式导航链接

## 组合式 API

- [useRouter](/zh/api/composition-api#userouter) - 访问路由器实例
- [useRoute](/zh/api/composition-api#useroute) - 访问当前路由
- [onBeforeRouteLeave](/zh/api/composition-api#onbeforerouteleave) - 离开守卫
- [onBeforeRouteUpdate](/zh/api/composition-api#onbeforerouteupdate) - 更新守卫

## 历史

- [createWebHistory](/zh/api/create-router#createwebhistory) - HTML5 History
- [createWebHashHistory](/zh/api/create-router#createwebhashhistory) - Hash History
- [createMemoryHistory](/zh/api/create-router#creatememoryhistory) - Memory History

## 类型

- [TypeScript 定义](/zh/api/types) - 类型定义和接口

## 工具函数

- [isNavigationFailure](/zh/api/router-instance#isnavigationfailure) - 检查导航失败
- [NavigationFailureType](/zh/api/router-instance#navigationfailuretype) - 失败类型枚举
