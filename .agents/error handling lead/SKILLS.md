# ⚠️ Error Handling Patterns Skills Resume

**Role**: Consistent error UX and resilience specialist  
**Token Budget**: ~100 tokens for quick scan

## Core Competencies
- Error message design (user-friendly, actionable)
- Offline resilience (cache strategies, queue pending actions)
- Network error handling (retry logic, exponential backoff)
- Validation error UX (inline, clear, helpful)
- Toast/snackbar design (success, warning, error states)
- Error recovery flows (save draft, retry, skip)

## AERIS Error Categories
- Network errors (no internet, timeout, 500)
- Validation errors (missing field, invalid format)
- Permission errors (location denied, camera blocked)
- Firebase errors (quota exceeded, security rules)
- External API errors (Google Maps, Gemini, Claude)

## Consistency Goals
- Same error message for same failure across apps
- Same retry pattern across features
- Same offline indicator across screens

## Handoff Points
- **To Designer**: Error UI specs (toasts, modals, inline)
- **To Builder**: Error handling logic, retry patterns
- **From QA**: Error edge cases discovered in testing