# Maker Management Platform (MMP)

Platform for managing 3D printing projects, assets, and printers. This monorepo contains the backend agent and frontend UI, designed for self-hosting.

## 📁 Monorepo Structure

```
MMP/
├── apps/
│   ├── agent/          # Go backend (Echo framework)
│   ├── ui/             # React + TypeScript frontend (Vite)
│   └── desktop/        # Future Wails desktop app (placeholder)
├── packages/           # Shared packages
│   ├── api-types/      # TypeScript API type definitions (future)
│   └── openapi/        # OpenAPI specs (future)
├── docker/             # Docker configuration
│   ├── Dockerfile      # Combined production image
│   ├── Caddyfile       # Web server configuration
│   └── docker-compose.yml
└── .github/workflows/  # CI/CD pipelines
```

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Go** >= 1.22 (for agent development)
- **Docker** (for containerized deployment)

### Development Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file in root
   echo "DATA_PATH=./data" > .env
   echo "LIBRARY_PATH=./testdata" >> .env
   ```

3. **Run development servers:**
   ```bash
   pnpm dev
   ```
   This starts both:
   - Agent on `http://localhost:8000`
   - UI on `http://localhost:5173` (proxies `/api` to agent)

### Docker Deployment

1. **Build the combined image:**
   ```bash
   pnpm docker:build
   ```

2. **Run with docker-compose:**
   ```bash
   pnpm docker:run
   ```

   Or manually:
   ```bash
   docker-compose -f docker/docker-compose.yml up
   ```

3. **Access the application:**
   - UI: `http://localhost:8081`
   - API: `http://localhost:8081/api`

## What Can Be Shared Between Go and TypeScript?

Since Go and TypeScript don't share runtime code, the `packages/` directory is designed for:

### 1. **API Type Definitions** (`packages/api-types/`)
- TypeScript interfaces matching Go structs
- Single source of truth for API contracts
- Used by UI for type safety
- Can generate Go structs or validate responses

### 2. **OpenAPI/Swagger Specs** (`packages/openapi/`) - Future
- Define API contract once
- Generate TypeScript types for UI
- Generate Go structs for backend
- Auto-generate API documentation

### 3. **Configuration Schemas**
- JSON Schema for config validation
- Shared validation rules

### 4. **Build Tooling**
- Shared Docker configs
- CI/CD workflows
- Build scripts

**Note:** Runtime business logic cannot be shared - it must be implemented separately in each language.

## Available Scripts

From the root directory:

- `pnpm dev` - Start both agent and UI in development mode
- `pnpm build` - Build both applications
- `pnpm lint` - Lint all code
- `pnpm clean` - Clean all build artifacts and dependencies
- `pnpm docker:build` - Build the combined Docker image
- `pnpm docker:run` - Run docker-compose

## Architecture

### Backend (apps/agent)
- **Framework:** Echo (Go web framework)
- **Database:** SQLite with GORM
- **Features:**
  - Project and asset management
  - File discovery and processing
  - 3D model rendering
  - Printer integrations (Klipper, OctoPrint)
  - Event-driven architecture (SSE)

### Frontend (apps/ui)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** Mantine
- **Features:**
  - Project management interface
  - Asset viewer (3D models, images)
  - Printer status dashboard
  - Real-time updates via SSE

### Combined Docker Image
- **Base:** Caddy (web server)
- **Agent:** Runs on port 8000
- **UI:** Served by Caddy on port 8081
- **Proxy:** Caddy proxies `/api/*` to agent

## Configuration

### Environment Variables

Create a `.env` file in the root:

```bash
DATA_PATH=./data              # Data directory for agent
LIBRARY_PATH=./testdata       # Library path for projects
THINGIVERSE_TOKEN=            # Optional: Thingiverse API token
PORT=8000                     # Agent port
MAX_RENDER_WORKERS=5          # Render worker count
MODEL_RENDER_COLOR=#167DF0    # Model render color
MODEL_BACKGROUND_COLOR=#FFFFFF # Background color
```

### Config File (apps/agent/data/config.toml)

The agent also supports a TOML config file. See `apps/agent/README.md` for details.

## Deployment

### Self-Hosting with Docker

1. **Pull the image:**
   ```bash
   docker pull ghcr.io/your-org/mmp:latest
   ```

2. **Run with docker-compose:**
   ```yaml
   # docker-compose.yml
   version: "3.8"
   services:
     mmp:
       image: ghcr.io/your-org/mmp:latest
       ports:
         - "8081:8081"
       volumes:
         - ./library:/library
         - ./data:/data
       environment:
         - DATA_PATH=/data
         - LIBRARY_PATH=/library
   ```

### Future: Desktop Application

The `apps/desktop/` directory is reserved for a future Wails desktop application that will bundle both the agent and UI into a native desktop app.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `pnpm lint`
5. Submit a pull request

See individual component READMEs for more details:
- [Agent README](apps/agent/README.md)
- [UI README](apps/ui/README.md)

## Documentation

- [General Documentation](https://github.com/Maker-Management-Platform/docs)
- [Discord Community](https://discord.gg/SqxKE3Ve4Z)
- [Project Board](https://github.com/orgs/Maker-Management-Platform/projects/1)

## License

See [LICENSE.md](LICENSE.md) for details.

## Roadmap

- [ ] Wails desktop application
- [ ] Shared API type definitions
- [ ] OpenAPI spec generation
- [ ] Enhanced testing coverage
- [ ] Performance optimizations

---

**Note:** This is a monorepo managed with Turborepo. For more information about the monorepo structure and build system, see [Turborepo Documentation](https://turbo.build/repo/docs).
