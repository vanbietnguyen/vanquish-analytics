import { NextResponse } from 'next/server';
import path from "path";
import fs from "fs";
import { tableFromIPC } from "apache-arrow";
import type TickData from "~/types/TickData.type";

export async function GET() {
  const filePath = path.join('src/parsers/data', '2024', '08', `tickdata_2024-08-01.arrow`);
  let data = [];

  if (fs.existsSync(filePath)) {
    console.log('we ar ereading table now')
    const fileBuffer = fs.readFileSync(filePath);
    const table = tableFromIPC(fileBuffer);

    for (let i = 0; i < table.numRows; i++) {
      const row = table.get(i) as TickData | null;
      if (row) {
        data.push(row);
      }
    }
  }

  try {
    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
