import { NextResponse } from 'next/server';
import { loadDataByDateRange } from "~/utils/dataLoader";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const folderPath = searchParams.get('folderPath');
  console.log('folderPath', folderPath);

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
  }

  try {
    const data = await loadDataByDateRange(
      folderPath!,
      startDate,
      endDate
    );
    return NextResponse.json({ data });
  } catch (error: any | unknown) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
