import { useRouter } from 'essor-router';

export default function Home() {
  const router = useRouter();

  const onClick = () => {
    router.push('/about');
  };

  const onRandomClick = () => {
    router.push('/random');
  };

  return (
    <>
      <div onClick={onClick} class="home">
        to about
      </div>

      <div onClick={onRandomClick}>random router</div>
    </>
  );
}
