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
    <div>
      <div onClick={onClick} class="to-home">
        to about
      </div>

      <div onClick={onRandomClick} class="to-random">
        random router
      </div>
    </div>
  );
}
