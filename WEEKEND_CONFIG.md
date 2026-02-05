# Weekend Configuration - Israel Workweek (Fri/Sat)

## Overview

This document explains how the application handles weekend configuration for Israel's unique workweek: **Sunday–Thursday (working days)** and **Friday–Saturday (weekend)**.

## Constants

All weekend logic is centralized in a single source of truth:

```typescript
// File: src/lib/weekend.ts

export const WEEKEND_DAYS = [5, 6]; // Friday, Saturday
export const WORKWEEK_DAYS = [0, 1, 2, 3, 4]; // Sunday–Thursday
```

### Date Numbering (ISO/JavaScript Standard)
- **0** = Sunday
- **1** = Monday
- **2** = Tuesday
- **3** = Wednesday
- **4** = Thursday
- **5** = Friday (weekend)
- **6** = Saturday (weekend)

## Usage Locations

### 1. **Order Form** (`src/components/otp/OrderForm.tsx`)
- **Desired Delivery Date Input**: Shows helper text with weekend definition
- **Exclude Weekends Toggle**: Uses `WEEKEND_DAYS` to exclude Fri/Sat from promise calculations
- **Display Text**: Uses `getWeekendLabel()` and `getWorkweekLabel()` helpers

```tsx
// Example usage:
import { WEEKEND_DAYS, getWeekendLabel, getWorkweekLabel } from '@/lib/weekend'

// In JSX:
<p className="weekend-helper-text">
  Weekend: {getWeekendLabel()} (Israel workweek: {getWorkweekLabel()})
</p>
```

### 2. **Settings Panel** (`src/components/otp/settings.tsx`)
- **Weekend Days Display**: Shows "Friday, Saturday" using `getWeekendLabel()`
- **Workweek Display**: Shows "Sunday–Thursday" using `getWorkweekLabel()`
- Always kept in sync with the `WEEKEND_DAYS` constant

### 3. **Results Panel** (`src/components/otp/results-panel.tsx`)
- **Calendar & Rules Section**: Displays workweek and weekend information
- **Dynamic Labels**: Uses helper functions for consistency

### 4. **Calendar Styling** (`src/app/globals.css`)
- **CSS Classes**: `.weekend-calendar` and `.weekend-helper-text`
- **Visual Indicators**: Blue focus ring and enhanced picker icon
- **Helper Text**: Displays weekend definition below date inputs

## Utility Functions

All functions are exported from `src/lib/weekend.ts`:

### `isWeekendDay(dayNumber: number): boolean`
Check if a given day number (0-6) is a weekend.

```typescript
isWeekendDay(5) // true (Friday)
isWeekendDay(6) // true (Saturday)
isWeekendDay(4) // false (Thursday)
```

### `isWeekendDate(date: Date): boolean`
Check if a given Date object falls on a weekend.

```typescript
const friday = new Date('2025-02-07'); // Friday
isWeekendDate(friday) // true
```

### `getWeekendLabel(): string`
Get formatted weekend label.

```typescript
getWeekendLabel() // "Friday, Saturday"
```

### `getWorkweekLabel(): string`
Get formatted workweek label.

```typescript
getWorkweekLabel() // "Sunday–Thursday"
```

### `getWeekendDayNames(): string[]`
Get all weekend day names as an array.

```typescript
getWeekendDayNames() // ["Friday", "Saturday"]
```

## Backend Integration

The frontend sends weekend preferences to the backend via the `no_weekends` parameter:

```typescript
// POST /otp/promise
{
  "customer": "Acme Corp",
  "items": [...],
  "desired_date": "2025-02-10",
  "no_weekends": true // Exclude Fri/Sat from promise date calculation
}
```

When `no_weekends: true`, the backend will skip Friday and Saturday dates when calculating the promise date.

## Important Rules

1. ✅ **DO**: Import `WEEKEND_DAYS` and helper functions from `src/lib/weekend.ts`
2. ✅ **DO**: Use `getWeekendLabel()` for display text
3. ✅ **DO**: Use `isWeekendDate()` for date validation
4. ❌ **DON'T**: Hardcode `[5, 6]` in component files
5. ❌ **DON'T**: Create local weekend constants elsewhere
6. ❌ **DON'T**: Use hardcoded "Friday & Saturday" strings (use helper functions instead)

## Future Extensibility

To support multiple regions/locales in the future, the weekend configuration can be:
1. Moved to a configuration file
2. Loaded from the backend based on organization settings
3. Extended to support multiple workweek definitions

Example future enhancement:
```typescript
// Future: Support configurable weekends
interface WeekendConfig {
  name: string; // "Israel", "Saudi Arabia", "USA", etc.
  weekendDays: number[];
  weekdayStart: number;
  weekdayEnd: number;
}

const WEEKEND_CONFIGS = {
  ISRAEL: { weekendDays: [5, 6], weekdayStart: 0, weekdayEnd: 4 },
  SAUDI_ARABIA: { weekendDays: [4, 5], weekdayStart: 6, weekdayEnd: 3 },
  USA: { weekendDays: [0, 6], weekdayStart: 1, weekdayEnd: 5 },
};
```

## Testing

For UI testing, verify:
- ✅ Calendar date input displays "Weekend: Friday, Saturday"
- ✅ "Exclude weekends" toggle shows correct label
- ✅ Settings panel displays "Friday, Saturday" as weekend days
- ✅ Results panel shows "Weekend skipped: Friday, Saturday"

For backend testing, verify:
- ✅ API sends `"no_weekends": true/false` correctly
- ✅ Backend respects weekend definition in calculations
- ✅ Promise dates never fall on Fri/Sat when `no_weekends: true`

## Related Files

- **Definition**: `src/lib/weekend.ts`
- **Primary Usage**: `src/components/otp/OrderForm.tsx`
- **Settings UI**: `src/components/otp/settings.tsx`
- **Results Display**: `src/components/otp/results-panel.tsx`
- **Styling**: `src/app/globals.css`
- **Types**: `src/lib/api/types.ts`
