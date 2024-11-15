import fs from "fs";
import path from "path";
import { tableFromIPC } from "apache-arrow";
import { parseCustomTimestamp } from "~/utils/parseCustomTimestamp";
import type TickData from "~/types/TickData.type";

/**
 * Generates an array of dates between the given start and end dates.
 *
 * @param startDate - The start date.
 * @param endDate - The end date.
 * @returns An array of dates.
 */
const generateDateArray = (startDate: string, endDate: string): Date[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray: Date[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateArray.push(new Date(d));
  }

  return dateArray;
};

const processInChunks = async (
  totalRows: number, // Number of rows to process
  chunkSize: number,
  processRow: (index: number) => TickData | void, // Async function to process each row
) => {
  const promises= [];

  for (let i = 0; i < totalRows; i++) {
    // Push the current row's processing to the promises array
    promises.push(processRow(i));

    // When we reach the chunk size or the end, wait for all promises in the current chunk
    if (promises.length === chunkSize || i === totalRows - 1) {
      await Promise.all(promises); // Wait for this chunk to finish
      promises.length = 0; // Reset the promises array for the next chunk
    }
  }
};


/**
 * Processes a single Arrow file and filters data within the specified date range.
 *
 * @param filePath - Path to the Arrow file.
 * @param start - Start date for filtering.
 * @param end - End date for filtering.
 * @returns A promise that resolves to an array of filtered rows.
 */
const processArrowFile = async (
  filePath: string,
  start: Date,
  end: Date
): Promise<TickData[]> => {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const fileBuffer = fs.readFileSync(filePath);
  const table = tableFromIPC(fileBuffer);
  const filteredData: TickData[] = [];
  const maxLength = table.numRows;

  const getRow = (index: number): void => {
    const row = table.get(index) as TickData | null;
    if (row) {
      const rowDate = parseCustomTimestamp(row.timestamp);
      if (rowDate >= start && rowDate <= end) {
        filteredData.push(row);
      }
    }
  }

  await processInChunks(maxLength, 10, getRow)

  return filteredData;
};

/**
 * Loads and filters Arrow data files within a date range.
 *
 * @param folderPath - Root folder containing the data files.
 * @param startDate - Start date for filtering (inclusive).
 * @param endDate - End date for filtering (inclusive).
 * @returns A promise resolving to an array of filtered rows.
 */
const loadDataByDateRange = async (
  folderPath: string,
  startDate: string,
  endDate: string
): Promise<TickData[]> => {
  const dateArray = generateDateArray(startDate, endDate);

  // Create file paths for each date
  const filePaths = dateArray.map((d) => {
    const year = d.getFullYear().toString();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return path.join(folderPath, year, month, `tickdata_${year}-${month}-${day}.arrow`);
  });

  const filteredFilePaths = filePaths.filter((filePath) => fs.existsSync(filePath));

  // Process all files concurrently using Promise.all
  const results = await Promise.all(
    filteredFilePaths.map((filePath) => processArrowFile(filePath, new Date(startDate), new Date(endDate)))
  );

  // Flatten the results array
  const filteredData = results.flat();

  console.log(
    `Total rows within date range ${startDate} to ${endDate}: ${filteredData.length}`
  );
  return filteredData;
};

export { loadDataByDateRange };