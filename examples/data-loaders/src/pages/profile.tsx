import { defineRoute } from 'essor-router/experimental';
import { useRoute } from 'essor-router';

// Fake authentication and fetch API
const fakeAuthCheck = () => new Promise<boolean>(resolve => setTimeout(() => resolve(false), 300));
const fetchUserProfile = (id: string) =>
  new Promise<{ id: string; name: string; role: string }>(resolve =>
    setTimeout(() => resolve({ id, name: 'Alice Admin', role: 'SuperUser' }), 500),
  );

export const route = defineRoute({
  // Intercept before loading data or component
  beforeLoad: async () => {
    const isLoggedIn = await fakeAuthCheck();
    if (!isLoggedIn) {
      // Return a redirect object, router will automatically navigate there
      return { redirect: { name: '/login' } };
    }
    return { ok: true };
  },

  // Data loader fetched in parallel with component chunk
  loader: async ({ params }) => {
    // Assuming params.id exists, or defaulting to '1'
    const profile = await fetchUserProfile(params.id || '1');
    return { profile };
  },
});

export default function Profile() {
  // `useRoute` provides fully typed data returned from the `loader`
  const { loaderData } = useRoute();

  return (
    <div>
      <h2>User Profile Loader Example</h2>
      {loaderData ? (
        <div style={{ padding: '10px', background: '#333', color: '#fff', borderRadius: '4px' }}>
          <p>
            <strong>Name:</strong> {loaderData.profile.name}
          </p>
          <p>
            <strong>Role:</strong> {loaderData.profile.role}
          </p>
          <p>
            <strong>ID:</strong> {loaderData.profile.id}
          </p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}
