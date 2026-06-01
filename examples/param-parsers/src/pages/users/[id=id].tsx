import { useRoute } from 'essor-router';

// Our global param parsers guarantee that `id` comes out as a number!
export default function UserParams() {
  const { params } = useRoute();

  // Notice how params.id is correctly inferred as `number` because of `paramParsers` setup
  const isNumberId = typeof params.id === 'number';

  return (
    <div>
      <h2>Param Parsers Example</h2>
      <p data-testid="user-id">ID: {params.id}</p>
      <div
        style={{
          'padding': '10px',
          'background': '#333',
          'color': '#fff',
          'border-radius': '4px',
        }}>
        <p>
          <strong>Raw Path Param:</strong> {params.id}
        </p>
        <p>
          <strong>Is number type at runtime?</strong> {isNumberId ? 'Yes ✓' : 'No ✗'}
        </p>
      </div>
    </div>
  );
}
