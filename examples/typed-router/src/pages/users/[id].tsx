import { useRoute } from 'essor-router';

export default function User() {
  const route = useRoute();

  return (
    <div>
      <h1>User Profile (Typed)</h1>
      <p data-testid="user-id">User ID: {route.params.id}</p>
    </div>
  );
}
