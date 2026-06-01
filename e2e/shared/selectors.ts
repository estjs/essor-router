export const Sel = {
  // Common across apps
  homeTitle: '[data-testid="home-title"]',
  aboutTitle: '[data-testid="about-title"]',
  notFound: '.notfound',
  sidebarEmpty: '[data-testid="sidebar-empty"]',
  sidebarHome: '[data-testid="sidebar-home"]',
  adminDashboard: '[data-testid="admin-dashboard"]',

  // Dynamic data
  userId: '[data-testid="user-id"]',
  postId: '[data-testid="post-id"]',
  catchAllPath: '[data-testid="catch-all-path"]',

  // Navigation
  navigateBtn: '[data-testid="navigate-btn"]',
  loadingState: '[data-testid="loading-state"]',
  guardResult: '[data-testid="guard-result"]',
  guardLog: '[data-testid="guard-log"]',

  // Use-api specific
  routeQuery: 'text=route.query:',

  // RouterLink
  activeLink: '[aria-current="page"]',

  // Guards
  guardBeforeEach: '[data-testid="guard-beforeEach"]',
  guardBeforeResolve: '[data-testid="guard-beforeResolve"]',
  guardAfterEach: '[data-testid="guard-afterEach"]',
  guardBeforeRouteLeave: '[data-testid="guard-beforeRouteLeave"]',
  guardBeforeRouteUpdate: '[data-testid="guard-beforeRouteUpdate"]',
  guardBeforeEnter: '[data-testid="guard-beforeEnter"]',
  guardBlocked: '[data-testid="guard-blocked"]',

  // History
  currentUrl: '[data-testid="current-url"]',
  historyStack: '[data-testid="history-stack"]',
} as const;
