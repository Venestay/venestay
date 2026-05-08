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
- **Tipado de Componentes:** Queda prohibido el uso de props booleanos para alternar estilos mayores. Se debe seguir la arquitectura de variantes definida en `.agents/skills/composition-patterns/SKILL.md`.
- **Integridad Zod:** Todo input numérico procesado (especialmente UCP 20/80) debe utilizar coerción según el estándar en `.agents/skills/zod/references/refine-transform-coerce.md`.
- **Eficiencia Dinámica:** Componentes de alto peso (Maps, Charts) deben usar `React.lazy` siguiendo `.agents/skills/react-best-practices/rules/bundle-dynamic-imports.md`.

## 5. Agentic & UI/UX Rules
- **Theme**: "Premium Dark" aesthetics.
- **Psychology First**: Every UI element must align with `SKILL_marketing_psychology.md` (e.g., scarcity indicators, social proof).
- **Reality Check**: Every PR/Change requires **Visual Evidence** (screenshots) as defined in `SKILL_reality_auditor.md`.
- **Whimsy**: Use subtle micro-animations for feedback to reduce user anxiety.
- **Performance**: Use `lazy` and `Suspense` for heavy components.

## 6. Quality Gates (No-Go Conditions)
The following conditions must be met before any task is considered complete:
1. **Compilation**: `npx tsc --noEmit` must pass without errors.
2. **Linting**: `npm run lint` must pass without warnings in Shared or Features.
3. **Evidence**: Visual evidence (screenshots/descriptions) must be provided by the `Reality Auditor`.
4. **Security**: Payment changes must strictly adhere to `UCPTransactionPayload`.
