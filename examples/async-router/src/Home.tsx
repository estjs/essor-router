import { RouterLink } from 'essor-router';

export default function Home() {
  return (
    <RouterLink to="/about" class="home">
      Home
    </RouterLink>
  );
}
