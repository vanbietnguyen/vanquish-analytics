// Define a Point type to represent a single x, y coordinate on the chart
export type Point = {
  x: number;
  y: number;
  low?: number; // For storing lows in uptrends
  high?: number; // For storing highs in downtrends
};

// Define a Trend type to represent a trend direction with its associated points
export type Trend = {
  direction: "up" | "down";
  points: Point[];
};

// Define a TrendLine type to represent the calculated trend line with slope and intercept
export type TrendLine = {
  slope: number;
  intercept: number;
  direction: "up" | "down";
  points: Point[];
};

export type OHLCData = {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: string;
  volume: number;
};