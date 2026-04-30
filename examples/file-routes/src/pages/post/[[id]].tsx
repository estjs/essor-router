import { useRoute } from 'essor-router';

export default function Post() {
  const route = useRoute();

  return (
    <div>
      <h1>Post Page</h1>
      <p data-testid="post-id">Post ID: {route.params.id || 'No ID Provided'}</p>
    </div>
  );
}
