# VeneStay Project Conventions

This document outlines the coding standards, architecture, and conventions for the VeneStay project.

## 1. Architecture: Feature-Sliced Design (FSD)
The project follows a refined FSD architecture. Code is organized into modules by business domain.

### Structure of a Feature (`src/features/[feature-name]/`)
- `/components`: UI components specific to the feature.
- `/hooks`: Custom React hooks specific to the feature.
- `/api`: (Optional) Feature-specific API calls/services.
- `/types`: TypeScript definitions for the feature.

## 2. Naming Conventions
- **Components**: `PascalCase.tsx` (e.g., `ListingCard.tsx`)
- **Hooks**: `kebab-case.ts/tsx` (e.g., `use-auth.tsx`)
- **Services/Utils/Others**: `kebab-case.ts` (e.g., `auth-service.ts`)
- **Folders**: `kebab-case` (e.g., `listing-detail`)

## 3. Technology Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Framer Motion (motion/react)
- **State Management**: React Context (Auth), TanStack Query (Future)
- **Validation**: Zod
- **Backend**: Firebase (Firestore, Auth, Storage)

## 4. Coding Standards
- **Imports**: Use the `@/` alias for absolute imports from the `src/` directory.
- **Firebase**: Avoid direct Firebase calls in UI components. Use the centralized services in `src/services/`.
- **Types**: Use centralized types in `src/types/index.ts` for global interfaces, and feature-specific types in their respective folders.
- **Strict Typing**: Ensure all props and function parameters are strictly typed.

## 5. UI/UX Rules
- **Theme**: "Premium Dark" aesthetics.
- **Colors**: Use CSS variables defined in `src/index.css` (`--color-premium-dark`, `--color-premium-accent`).
- **Performance**: Use `lazy` and `Suspense` for heavy components.
