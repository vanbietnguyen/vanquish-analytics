import fs from 'fs';
import path from 'path';
import { tableFromIPC } from 'apache-arrow';
import { parseCustomTimestamp } from "~/utils/parseCustomTimestamp";
import type TickData from "~/types/TickData.type";

const loadDataByDateRange = async (folderPath: string, startDate: string, endDate: string): Promise<TickData[]> => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const filteredData: TickData[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const year = d.getFullYear().toString();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    const filePath = path.join(folderPath, year, month, `tickdata_${year}-${month}-${day}.arrow`);

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const table = tableFromIPC(fileBuffer);

      for (let i = 0; i < table.numRows; i++) {
        const row = table.get(i) as TickData | null;
        if (row) {
          const rowDate = parseCustomTimestamp(row.timestamp);
          if (rowDate >= start && rowDate <= end) {
            filteredData.push(row);
          }
        }
      }
    }
  }

  console.log(`Total rows within date range ${startDate} to ${endDate}: ${filteredData.length}`);
  return filteredData;
};

export { loadDataByDateRange };
