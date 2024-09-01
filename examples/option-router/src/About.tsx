import { useRouter } from 'essor-router';

export default function About() {
  const router = useRouter();

  const onClick = () => {
    router.push('/');
  };
  return (
    <div class="about" onClick={onClick}>
      About
    </div>
  );
}
