# Installation

## Package Manager

Install essor-router using your preferred package manager:

::: code-group

```bash [npm]
npm install essor-router
```

```bash [pnpm]
pnpm add essor-router
```

```bash [yarn]
yarn add essor-router
```

:::

## Peer Dependencies

essor-router requires `essor` as a peer dependency. Make sure you have it installed:

```bash
npm install essor
```

## Version Compatibility

| essor-router | essor |
|--------------|-------|
| 0.0.x        | ^0.0.15-beta.5 |

## CDN

You can also use essor-router directly from a CDN:

```html
<script type="module">
  import { createRouter, RouterView, RouterLink } from 'https://esm.sh/essor-router';
  import { createApp } from 'https://esm.sh/essor';
  
  // Your code here
</script>
```

## Next Steps

Now that you have essor-router installed, let's create your first router in the [Quick Start](/guide/getting-started) guide.
