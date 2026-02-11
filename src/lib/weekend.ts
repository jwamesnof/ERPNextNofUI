/**
 * Weekend Configuration - Single Source of Truth
 * 
 * Israel weekend definition: Friday (5) + Saturday (6)
 * 
 * ISO/JavaScript weekday numbering:
 * 0 = Sunday
 * 1 = Monday
 * 2 = Tuesday
 * 3 = Wednesday
 * 4 = Thursday
 * 5 = Friday
 * 6 = Saturday
 * 
 * Workweek: Sunday–Thursday (0-4)
 * Weekend: Friday–Saturday (5-6)
 */

export const WEEKEND_DAYS = [5, 6] as const; // Friday, Saturday
export const WORKWEEK_DAYS = [0, 1, 2, 3, 4] as const; // Sunday–Thursday

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WORKWEEK_START = 0; // Sunday
export const WORKWEEK_END = 4; // Thursday
export const WEEKEND_START = 5; // Friday
export const WEEKEND_END = 6; // Saturday

/**
 * Check if a given day number is a weekend day
 */
export function isWeekendDay(dayNumber: number): boolean {
  return WEEKEND_DAYS.includes(dayNumber as typeof WEEKEND_DAYS[number]);
}

/**
 * Check if a given date falls on a weekend
 */
export function isWeekendDate(date: Date): boolean {
  return isWeekendDay(date.getDay());
}

/**
 * Get formatted weekend label (e.g., "Friday, Saturday")
 */
export function getWeekendLabel(): string {
  return WEEKEND_DAYS.map(day => DAY_NAMES[day]).join(', ');
}

/**
 * Get formatted workweek label (e.g., "Sunday–Thursday")
 */
export function getWorkweekLabel(): string {
  return `${DAY_NAMES[WORKWEEK_START]}–${DAY_NAMES[WORKWEEK_END]}`;
}

/**
 * Get all weekend day names as an array
 */
export function getWeekendDayNames(): string[] {
  return WEEKEND_DAYS.map(day => DAY_NAMES[day]);
}
