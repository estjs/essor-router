# Contributing to essor-router

Thanks for your interest in contributing! This guide helps you set up the development environment and understand our workflow.

## Development Setup

```bash
# Clone and install
git clone https://github.com/estjs/essor-router.git
cd essor-router
pnpm install

# Build all packages
pnpm run build

# Start dev mode (watch build)
pnpm run dev
```

## Project Structure

```
essor-router/
├── packages/
│   ├── router/          # Runtime router package
│   └── unplugin/        # File-based routing and codegen
├── tsconfig.base.json   # Shared TypeScript compiler baseline
├── docs/                # Documentation (English)
│   └── zh/              # Documentation (Chinese)
├── examples/            # Example applications
├── e2e/                 # End-to-end tests (Playwright)
└── scripts/             # Build and release scripts
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run build` | Build all packages |
| `pnpm run dev` | Watch build |
| `pnpm run typecheck` | Type check all packages |
| `pnpm run typecheck:examples` | Build packages, then type check all examples |
| `pnpm run lint` | Lint all packages |
| `pnpm run lint:fix` | Lint and apply automatic fixes |
| `pnpm run test` | Run unit tests |
| `pnpm run test:unit` | Run package unit tests |
| `pnpm run test:e2e` | Run Playwright e2e tests |
| `pnpm run coverage` | Run tests with coverage |
| `pnpm run check` | Run lint, type checks, example type checks, and unit tests |
| `pnpm run docs:dev` | Start docs dev server |
| `pnpm run docs:build` | Build docs |

### Package-specific commands

```bash
pnpm --filter essor-router test
pnpm --filter unplugin-essor-router test
```

## Coding Style

- **TypeScript** with ESM (`"type": "module"`)
- **2-space indent**, LF line endings, no trailing whitespace (see `.editorconfig`)
- Package build configs extend the root `tsconfig.base.json`; test-only globals belong in `tsconfig.test.json`
- Follow existing patterns in the codebase — match style in neighboring files
- Use `pnpm run lint` to check code style and `pnpm run lint:fix` for automatic fixes

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Make focused, atomic commits with clear messages
3. Run `pnpm run check` before pushing
4. Run `pnpm run test:e2e` if touching routing/unplugin behavior used by examples
5. Update documentation if your change affects user-facing behavior
6. Update the Chinese docs (`docs/zh/`) if updating English docs

## Testing

- **Unit tests**: `packages/*/test/` — run with `pnpm run test`
- **E2E tests**: `e2e/` — Playwright tests that spin up example apps and test real browser behavior
- Add tests for new features and bug fixes
- Ensure existing tests pass before submitting

## Documentation

- English docs live in `docs/`
- Chinese docs live in `docs/zh/` (mirror the English structure)
- Package READMEs: `packages/*/README.md` (and `README.zh-CN.md`)
- If you change behavior, please update corresponding docs

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add scroll behavior support
fix: correct route param matching for optional segments
docs: update installation guide
refactor: simplify path parser state machine
test: add e2e tests for navigation guards
chore: update dependencies
```

## Release Process

Releases are handled by maintainers. Version is bumped via the changelog script:

```bash
pnpm run changelog
```

## Questions?

Open a [discussion](https://github.com/estjs/essor-router/discussions) or join the community.
