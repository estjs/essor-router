import { useRouter } from 'essor-router';

export default function Home() {
  const router = useRouter();

  const handleTypedNavigation = () => {
    // router.push() expects strong types for parameters based on the name!
    router.push({ name: '/users/[id]', params: { id: 789 } });
  };

  return (
    <div>
      <h1>Home Page (Typed)</h1>
      <p>Demonstrating strict param requirements for router.push().</p>
      <button data-testid="navigate-btn" onClick={handleTypedNavigation}>
        Go to User 789
      </button>

      <hr style={{ margin: '20px 0' }} />

      <h2>Data Loaders Example</h2>
      <p>
        Click the button below to navigate to a specialized route containing `beforeLoad`
        interceptors and parallel data `loader`s!
      </p>

      <button onClick={() => router.push({ name: '/profile' })}>Go to Profile</button>
    </div>
  );
}
