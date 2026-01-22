# AGENTS.md

A Chrome/Firefox extension for monitoring GTM dataLayer events in real-time with a React-based DevTools panel.

## Architecture

This is a Manifest V3 browser extension with four isolated contexts that communicate via message passing. See [docs/TECHNICAL_OVERVIEW.md](docs/TECHNICAL_OVERVIEW.md) for the complete architecture diagram and context explanations.

## Commands

```bash
npm run dev          # Watch mode development build
npm run build        # Production build (both browsers)
npm run test         # Run tests with Vitest
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
```

## Code Principles

- **Small, modular files**: Prefer modularity over long procedural code; follow SOLID principles
– **Separation of concerns**: UI components, state management, and side effects should be clearly separated
– **DRY**: Reuse code via shared utilities, hooks, and components; avoid duplication
- **Functional over classes**: Prefer functions and hooks; classes acceptable for complex stateful modules
- **Tests required**: New code should have corresponding `.test.ts` / `.test.tsx` files. If tests fail, don't always assume that it's a test issue – investigate and fix the underlying problem if there is one.
- **Storybook required**: New React components (`.tsx`) should have accompanying `.stories.tsx` following atomic-design heirarchy
– **Type safety**: Strict TypeScript settings; avoid `any`, prefer explicit types and interfaces
– **Linting**: Avoid using eslint-disable comments; fix underlying issues instead – this is a complete last resort
– **Types**: Define clear interfaces/types for data structures and function signatures, re-use where possible to avoid type draft, including in test files. Mack types/interfaces importablable to facilitate this

## Key Patterns

- **Dependency injection**: Browser APIs abstracted via `IBrowserAPI` interface for testability
- **Store factory**: `createStore()` accepts dependencies, enabling mocks in tests
- **Absolute imports**: Use `@/` alias (e.g., `@/components/shared`)
- **Naming**: PascalCase for components/classes, camelCase for functions/hooks, `I` prefix for interfaces, `create[Name]` for factories

## Extension Contexts

| Context | Entry Point | Purpose |
|---------|-------------|---------|
| Background | `src/background/index.ts` | Service worker, state coordination |
| Content | `src/content/index.ts` | DOM access, message bridge |
| Injected | `src/injected/index.ts` | Page context, reads `window.dataLayer` |
| Popup | `src/popup/Popup.tsx` | Extension icon popup |
| DevTools | `src/devtools/DevToolsPanel.tsx` | Main event viewing panel |

## Critical Gotchas

- Variables in one context don't exist in another - always use message passing
- Background service workers can suspend - persist state to `chrome.storage`, not memory
- Test with `vi.mocked()` to capture Chrome API listeners
