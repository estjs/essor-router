import { RouterView } from 'essor-router';

export default function NestedLayout() {
  return (
    <div style="border: 2px dashed #999; padding: 20px;">
      <h2>Nested Layout</h2>
      <p>This is a shared _parent layout wrap.</p>
      <div style="border: 1px solid #ccc; padding: 10px;">
        <RouterView />
      </div>
    </div>
  );
}
