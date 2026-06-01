import { defineRoute } from 'essor-router';

export const route = defineRoute({
  meta: {
    title: 'Login',
  },
});

export default function Login() {
  return (
    <div>
      <h2>Login Page</h2>
      <p style={{ color: 'red' }}>
        You were redirected here because `beforeLoad` in /profile intercepted you.
      </p>
    </div>
  );
}
