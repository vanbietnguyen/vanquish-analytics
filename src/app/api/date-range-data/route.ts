import { NextResponse } from "next/server";
import { loadDataByDateRange } from "~/utils/dataLoader";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? '';
  const endDate = searchParams.get("endDate") ?? '';
  const folderPath = searchParams.get("folderPath") ?? '';

  if (!folderPath && !startDate) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const endDateToLoad = endDate ?? startDate;

  try {
    const data = await loadDataByDateRange(folderPath, startDate, endDateToLoad);

    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}