import { onDestroy, onMount, signal } from 'essor'
import { RouterLink } from 'essor-router'

const DynamicLinkSection = () => {
  const toSignal = signal('/about')
  onMount(() => {
    const id = setTimeout(() => {
      toSignal.value = '/'
    }, 100)
    onDestroy(() => clearTimeout(id))
  })
  return (
    <div class="section">
      <RouterLink to={() => toSignal.value} class="link dynamic">
        Dynamic Link
      </RouterLink>
    </div>
  )
}

export default function Home() {
  return (
    <div class="home">
      <nav class="nav">
        <RouterLink to="/" exactActiveClass="active" class="link">
          Home
        </RouterLink>
        <RouterLink to="/about" activeClass="active" class="link">
          About
        </RouterLink>
      </nav>
      <DynamicLinkSection />
    </div>
  )
}
