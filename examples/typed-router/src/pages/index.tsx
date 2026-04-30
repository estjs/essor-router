import { useRouter } from 'essor-router';

export default function Home() {
  const router = useRouter();

  const handleTypedNavigation = () => {
    // router.push() expects strong types for parameters based on the name!
    router.push({ name: '/users/[id]', params: { id: 789 } });
  };

  return (
    <div>
      <h1 data-testid="home-title">Home Page (Typed)</h1>
      <p>Demonstrating strict param requirements for router.push().</p>
      <button data-testid="navigate-btn" onClick={handleTypedNavigation}>
        Go to User 789
      </button>
    </div>
  );
}
