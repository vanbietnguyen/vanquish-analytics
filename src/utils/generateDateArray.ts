/**
 * Generates an array of dates between the given start and end dates.
 *
 * @param startDate - The start date.
 * @param endDate - The end date.
 * @returns An array of dates.
 */
export const generateDateArray = (startDate: string, endDate: string): Date[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray: Date[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateArray.push(new Date(d));
  }

  return dateArray;
};