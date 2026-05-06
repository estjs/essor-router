import { onBeforeRouteLeave } from 'essor-router';

export default function Home() {
  return (
    <div>
      <h1 data-testid="home-title">Home Page</h1>
      <p>Welcome to the guards example. No guards on this page.</p>
    </div>
  );
}
