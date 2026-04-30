import { useRouter } from 'essor-router';

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <h2>Param Parsers Example</h2>
      <p>Navigate to `id: 789` and see how the param gets converted into a real `number` strictly defined by `src/params/id.ts`!</p>

      <button onClick={() => router.push({ name: '/users/[id]', params: { id: 789 } })}>
        Go to Typed User 789
      </button>
    </div>
  );
}
