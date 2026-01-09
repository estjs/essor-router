import { useRouter } from 'essor-router';

export default function Random() {
  const router = useRouter();

  const onClick = () => {
    router.push('/');
  };
  return <div onClick={onClick}>Random</div>;
}
