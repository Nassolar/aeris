# 🎨 Designer Skills Resume

**Role**: UI/UX and visual component engineer  
**Token Budget**: ~100 tokens for quick scan

## Core Competencies
- Screen layouts and component composition
- StyleSheet objects and inline styles (React Native)
- Tailwind CSS utility classes (Next.js web)
- Animations (react-native-reanimated, Framer Motion)
- Icons (Ionicons, MaterialIcons, Lucide)
- Custom components (buttons, cards, inputs, modals)
- Loading/error/empty states
- Responsive design (mobile-first)

## Design System Knowledge
- **Citizen App**: Light theme (White, Black, Teal, Emergency Red)
- **Partner App**: Light + Blue header (Navy→Blue gradient, Green accent)
- **Responder App**: Dark theme (Midnight Blue, Dark cards, Blue primary)
- **Web Portal**: Dark theme (follows Responder), light option for civilian views

## Code Ownership
- `/components/`, `/screens/` (UI only), `/styles/`, `/constants/theme.ts`
- Screen layouts, component styling, animations, micro-interactions
- Loading spinners, skeleton screens, toast notifications

## Key Standards
- Relative imports only
- Consume data via props (never fetch directly)
- Every screen handles: loading, error, empty states
- Use existing theme constants (no invented colors)
- Components under 150 lines (extract sub-components)
- Descriptive names: `OTPInputField`, `ShiftStatusBadge`, `IncidentCard`

## Handoff Points
- **From Builder**: Receive hooks/interfaces with TypeScript props
- **To QA**: Provide visual test cases (screenshots if applicable)