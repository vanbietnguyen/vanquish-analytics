import { type OHLCData, type Point, type Trend, type TrendLine } from "~/types";

// Function to capture turning points with both high and low values, including engulfing bars
const findSequentialTurningPoints = (
  data: OHLCData[],
  windowSize = 2
): Point[] => {
  const turningPoints: Point[] = [];

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const currentHigh = data[i].high;
    const currentLow = data[i].low;

    // Check if it's a relative high
    const isHigh =
      data.slice(i - windowSize, i).every((p) => p.high < currentHigh) &&
      data.slice(i + 1, i + 1 + windowSize).every((p) => p.high < currentHigh);

    // Check if it's a relative low
    const isLow =
      data.slice(i - windowSize, i).every((p) => p.low > currentLow) &&
      data.slice(i + 1, i + 1 + windowSize).every((p) => p.low > currentLow);

    // Add to turning points if it’s either a high or low
    if (isHigh || isLow) {
      turningPoints.push({
        x: i,
        y: isHigh ? currentHigh : currentLow,
        type: isHigh ? "high" : "low",
      });
    }
  }

  return turningPoints;
};

// Function to find valid trends based on captured turning points
const findValidTrends = (turningPoints: Point[], minTouches = 3): Trend[] => {
  if (turningPoints.length < 2) return [];

  let currentTrend: Point[] = [];
  let trends: Trend[] = [];

  // Determine initial trend direction
  let direction: "up" | "down" =
    turningPoints[1].y > turningPoints[0].y ? "up" : "down";

  for (let i = 0; i < turningPoints.length; i++) {
    const point = turningPoints[i];
    const lastPoint = currentTrend[currentTrend.length - 1];

    if (!lastPoint) {
      currentTrend.push(point);
      continue;
    }

    // Check if the trend should continue or switch direction
    const isContinuing =
      (direction === "up" && point.y > lastPoint.y && point.type === "low") ||
      (direction === "down" && point.y < lastPoint.y && point.type === "high");

    if (isContinuing) {
      currentTrend.push(point);
    } else {
      // Save the current trend if it has enough touches, then reset
      if (currentTrend.length >= minTouches) {
        trends.push({ direction, points: [...currentTrend] });
      }
      // Reset trend with last point and current point, and switch direction
      currentTrend = [lastPoint, point];
      direction = point.y > lastPoint.y ? "up" : "down";
    }
  }

  // Add any remaining trend that meets the touch requirement
  if (currentTrend.length >= minTouches) {
    trends.push({ direction, points: currentTrend });
  }

  return trends;
};

// Calculate trend line based on the first and last points of a trend
const calculateTrendLine = (point1: Point, point2: Point): TrendLine | null => {
  if (!point1 || !point2) return null;

  const { x: x1, y: y1 } = point1;
  const { x: x2, y: y2 } = point2;

  if (x1 === x2) return null;

  const slope = (y2 - y1) / (x2 - x1);
  const intercept = y1 - slope * x1;

  return { slope, intercept, points: [point1, point2] };
};

// Main function to calculate trend lines with three-touch rule
const calculateThreePointTrendLines = (data: OHLCData[]): TrendLine[] => {
  const turningPoints = findSequentialTurningPoints(data, 3);

  const validTrends = findValidTrends(turningPoints, 3);

  return validTrends
    .filter((trend) => trend.points.length >= 3) // Ensure at least 3 points
    .map((trend) =>
      calculateTrendLine(trend.points[0], trend.points[trend.points.length - 1])
    )
    .filter(Boolean) as TrendLine[];
};

export default calculateThreePointTrendLines;