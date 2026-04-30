import { useRoute } from 'essor-router';

export default function CatchAll() {
  const route = useRoute();

  const path = Array.isArray(route.params.catchAll)
    ? route.params.catchAll.join('/')
    : route.params.catchAll;

  return (
    <div>
      <h1>404 Not Found (Typed)</h1>
      <p data-testid="catch-all-path">Unknown path: {path}</p>
    </div>
  );
}
