import { onBeforeRouteLeave } from 'essor-router';

export default function Protected() {
  onBeforeRouteLeave((to, from, next) => {
    const el = document.getElementById('guard-beforeRouteLeave');
    if (el) el.textContent = `beforeRouteLeave: ${from.fullPath} → ${to.fullPath}`;
    // Simulate a guard that always allows navigation
    next();
  });

  return (
    <div>
      <h1 data-testid="protected-title">Protected Page</h1>
      <p>
        This page has a <code>beforeEnter</code> guard and a <code>beforeRouteLeave</code> guard.
      </p>
    </div>
  );
}
