import { createFileRoute } from '@tanstack/react-router';

function ApiKeys() {
  return <div>Hello /api-keys !</div>;
}

export const Route = createFileRoute('/api-keys')({
  component: ApiKeys,
});
