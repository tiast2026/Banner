const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

export function formatPrice(value: string, suffix: string): string {
  const num = parseInt(value, 10);
  if (isNaN(num)) return value;
  return num.toLocaleString() + (suffix || "円");
}

export function formatPercent(value: string): string {
  return value;
}

export function formatPeriod(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): string {
  const sd = new Date(startDate);
  const ed = new Date(endDate);
  if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return "";
  const sDow = DAY_NAMES[sd.getDay()];
  const eDow = DAY_NAMES[ed.getDay()];
  const sMonth = sd.getMonth() + 1;
  const sDay = sd.getDate();
  const eMonth = ed.getMonth() + 1;
  const eDay = ed.getDate();
  return `${sMonth}/${sDay}(${sDow})${startTime || "00:00"}〜${eMonth}/${eDay}(${eDow})${endTime || "00:00"}`;
}

export function formatFieldValue(
  fieldType: string,
  value: string,
  suffix: string,
  allValues?: Record<string, string>
): string {
  switch (fieldType) {
    case "price":
      return formatPrice(value, suffix);
    case "percent":
      return formatPercent(value);
    case "period":
      if (allValues) {
        return formatPeriod(
          allValues["startDate"] || "",
          allValues["startTime"] || "",
          allValues["endDate"] || "",
          allValues["endTime"] || ""
        );
      }
      return value;
    case "text":
    default:
      return value + (suffix || "");
  }
}
