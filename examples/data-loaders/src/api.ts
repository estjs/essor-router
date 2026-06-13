// Fake authentication and fetch API.
//
// These helpers live in a dedicated module (instead of being module-local
// `const`s inside the page) so that `beforeLoad`/`loader` can reference them.
// The `?definePage` extraction only re-includes the *imports* used by the
// route record, so module-local declarations would be stripped and become
// `undefined` at runtime.

export interface UserProfile {
  id: string;
  name: string;
  role: string;
}

export const fakeAuthCheck = (): Promise<boolean> =>
  new Promise((resolve) => setTimeout(() => resolve(false), 300));

export const fetchUserProfile = (id: string): Promise<UserProfile> =>
  new Promise((resolve) =>
    setTimeout(() => resolve({ id, name: 'Alice Admin', role: 'SuperUser' }), 500),
  );
