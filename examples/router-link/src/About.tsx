import { RouterLink } from 'essor-router';

export default function About() {
  return (
    <div class="about">
      <h1>About</h1>
      <RouterLink to="/" class="link">
        Home
      </RouterLink>
    </div>
  );
}
