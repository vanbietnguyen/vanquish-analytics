import type TickData from "~/types/TickData.type";
import { type OHLCData } from "~/types";

// Function to chunk and aggregate tick data into OHLC format
const aggregateTicksToOHLC = (data: TickData[], chunkSize = 2000): OHLCData[] => {
  const ohlcData: OHLCData[] = [];

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;

    // Use lastPrice for OHLC values, using non-null assertions
    const open = chunk[0]!.lastPrice;
    const close = chunk[chunk.length - 1]!.lastPrice;
    const high = Math.max(...chunk.map(d => d.lastPrice));
    const low = Math.min(...chunk.map(d => d.lastPrice));
    const timestamp = chunk[0]!.timestamp;

    // Sum volume for the entire chunk
    const volume = chunk.reduce((total, tick) => total + tick.volume, 0);

    ohlcData.push({ open, high, low, close, timestamp, volume });
  }

  return ohlcData;
};

export default aggregateTicksToOHLC;
