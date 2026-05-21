import { defineRoute } from 'essor-router';
import { signal } from 'essor';

// Fake authentication and fetch API
const fakeAuthCheck = () =>
  new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 300));
const fetchUserProfile = (id: string) =>
  new Promise<{ id: string; name: string; role: string }>((resolve) =>
    setTimeout(() => resolve({ id, name: 'Alice Admin', role: 'SuperUser' }), 500),
  );
const profileData = signal<{ profile: { id: string; name: string; role: string } } | null>(null);
const profile = await fetchUserProfile('1');
profileData.value = { profile };

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
  return (
    <div>
      <h2>User Profile Loader Example</h2>
      {profileData.value ? (
        <div
          style={{
            'padding': '10px',
            'background': '#333',
            'color': '#fff',
            'border-radius': '4px',
          }}>
          <p>
            <strong>Name:</strong> {profileData.value.profile.name}
          </p>
          <p>
            <strong>Role:</strong> {profileData.value.profile.role}
          </p>
          <p>
            <strong>ID:</strong> {profileData.value.profile.id}
          </p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}
