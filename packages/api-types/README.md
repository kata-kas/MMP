# API Types

This package contains shared TypeScript type definitions for API contracts.

## Purpose

This package serves as a single source of truth for API types shared between:
- Frontend (apps/ui) - For type-safe API calls
- Future: Backend validation (via code generation)
- Future: API documentation generation

## Status

🚧 **Not yet implemented** - This is a placeholder for future development.

## Future Implementation

When implemented, this package will:
1. Export TypeScript interfaces matching Go structs
2. Be consumed by the UI for type safety
3. Potentially generate Go structs or validation code
4. Serve as the contract for API changes

## Example Structure (Future)

```typescript
// packages/api-types/src/project.ts
export interface Project {
  uuid: string;
  name: string;
  description: string;
  path: string;
  // ...
}

// packages/api-types/src/asset.ts
export interface Asset {
  id: string;
  name: string;
  // ...
}
```
