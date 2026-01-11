# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and Biome for linting and formatting.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting, formatting, and import organization. The configuration is in the root `biome.json` file.

### Running Biome

- `pnpm lint` - Check code for linting and formatting issues
- `pnpm exec biome check --write .` - Auto-fix issues and format code
- `pnpm exec biome format --write .` - Format code only
- `pnpm exec biome lint --write .` - Lint and apply safe fixes

### Configuration

The Biome configuration includes:
- TypeScript strict rules (no explicit `any`, exhaustive dependencies)
- Console warnings (allows `console.log`, `console.info`, `console.warn`, `console.error`)
- Test file overrides (allows `any` types in test files)
- Import organization
- Code formatting with tabs and double quotes

