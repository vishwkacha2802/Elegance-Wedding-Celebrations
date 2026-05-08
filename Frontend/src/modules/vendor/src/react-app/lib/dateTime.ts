const INDIA_LOCALE = "en-IN";
const INDIA_TIMEZONE = "Asia/Kolkata";

type DateInput = string | number | Date | null | undefined;

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
};

const toValidDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export function formatDateInIndia(
  value: DateInput,
  options?: Intl.DateTimeFormatOptions,
  fallback = "-",
) {
  const parsedDate = toValidDate(value);
  if (!parsedDate) {
    return fallback;
  }

  return new Intl.DateTimeFormat(INDIA_LOCALE, {
    timeZone: INDIA_TIMEZONE,
    ...(options || DEFAULT_DATE_OPTIONS),
  }).format(parsedDate);
}

export function formatDateTimeInIndia(
  value: DateInput,
  options?: Intl.DateTimeFormatOptions,
  fallback = "-",
) {
  const parsedDate = toValidDate(value);
  if (!parsedDate) {
    return fallback;
  }

  return new Intl.DateTimeFormat(INDIA_LOCALE, {
    timeZone: INDIA_TIMEZONE,
    ...(options || DEFAULT_DATE_TIME_OPTIONS),
  }).format(parsedDate);
}
