import type { SessionConfig } from '../types/session.js';

export function calculateDateRange(timeRange: SessionConfig['timeRange']): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now); // End is always now
  let start: Date;

  switch (timeRange) {
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3months':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6months':
      start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'lifetime':
      // For lifetime, we use a very old date (Twitter was founded in 2006)
      start = new Date('2006-01-01');
      break;
    default:
      // Default to lifetime
      start = new Date('2006-01-01');
      break;
  }

  return { start, end };
}

export function formatDateRange(start: Date, end: Date): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  const startStr = start.toLocaleDateString('en-US', formatOptions);
  const endStr = end.toLocaleDateString('en-US', formatOptions);
  
  return `${startStr} to ${endStr}`;
}

export function isValidDateString(dateString: string): boolean {
  // Check if it matches YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function isWithinDateRange(tweetDate: Date, start: Date, end: Date): boolean {
  return tweetDate >= start && tweetDate <= end;
}

export function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return '1 day';
  } else if (diffDays < 30) {
    return `${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.round(diffDays / 30);
    return months === 1 ? '1 month' : `${months} months`;
  } else {
    const years = Math.round(diffDays / 365);
    return years === 1 ? '1 year' : `${years} years`;
  }
}

export function getRelativeTimeDescription(timeRange: SessionConfig['timeRange']): string {
  switch (timeRange) {
    case 'week':
      return 'past 7 days';
    case 'month':
      return 'past 30 days';
    case '3months':
      return 'past 3 months';
    case '6months':
      return 'past 6 months';
    case 'year':
      return 'past year';
    case 'lifetime':
      return 'all time';
    case 'custom':
      return 'custom range';
    default:
      return 'unknown range';
  }
}
