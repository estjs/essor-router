import { defineRoute, useRoute } from 'essor-router';

export const route = defineRoute({
  meta: {
    requiresAuth: true,
    pageTitle: 'About Us',
  },
});

export default function About() {
  const { meta } = useRoute();

  return (
    <div>
      <h2 data-testid="about-title">{meta.pageTitle || 'About'}</h2>
      <p>This page requires auth? {meta.requiresAuth ? 'Yes' : 'No'}</p>
      <p>
        Try hovering over `meta` in your code editor to see full type completion based on
        `definePage()`.
      </p>
    </div>
  );
}
