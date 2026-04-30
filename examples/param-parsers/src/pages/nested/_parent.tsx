import { RouterView } from 'essor-router';

export default function NestedLayout() {
  return (
    <div style="border: 2px solid blue; padding: 20px;">
      <h2>Typed Nested Layout</h2>
      <div style="border: 1px dotted gray; padding: 10px;">
        <RouterView />
      </div>
    </div>
  );
}
