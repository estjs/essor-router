import { useRoute, onBeforeRouteUpdate } from 'essor-router';

export default function Detail() {
  const route = useRoute();

  onBeforeRouteUpdate((to, from, next) => {
    const el = document.getElementById('guard-beforeRouteUpdate');
    if (el) el.textContent = `beforeRouteUpdate: ${from.fullPath} → ${to.fullPath}`;
    next();
  });

  return (
    <div>
      <h1 data-testid="detail-title">Detail Page</h1>
      <p data-testid="detail-id">Current ID: {route.params.id}</p>
      <p>
        This page has a <code>beforeRouteUpdate</code> guard that fires when the <code>:id</code>{' '}
        param changes.
      </p>
    </div>
  );
}
