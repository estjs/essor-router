import { RouterView, useRoute } from 'essor-router';

export default function Layout() {
  const route = useRoute();

  return (
    <div class="layout">
      <div>route path:{route?.path}</div>
      <RouterView></RouterView>
    </div>
  );
}
