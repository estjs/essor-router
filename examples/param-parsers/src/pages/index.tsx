import { useRouter } from 'essor-router';

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <h1 data-testid="home-title">Param Parsers Example</h1>
      <p>
        Navigate to `id: 789` and see how the param gets converted into a real `number` strictly
        defined by `src/params/id.ts`!
      </p>

      <button onClick={() => router.push({ name: '/users/[id]', params: { id: 789 } })}>
        Go to Typed User 789
      </button>
    </div>
  );
}
