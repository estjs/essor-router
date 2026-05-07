import { useRoute, useRouter } from 'essor-router';

export default function About() {
  const router = useRouter();
  const route = useRoute();

  const onClick = () => {
    router.push('/');
  };
  return (
    <div class="about" onClick={onClick}>
      About
      <div>route path:{route?.path}</div>
    </div>
  );
}
