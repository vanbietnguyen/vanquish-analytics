import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { parseCustomTimestamp } from "~/utils/parseCustomTimestamp";

type TickData = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type ChartProps = {
  data: TickData[];
};

const LineChart = ({ data }: ChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Define dimensions and margins
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    // Create scales for x and y axes
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => parseCustomTimestamp(d.timestamp)) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.low)!, d3.max(data, (d) => d.high)!])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Create line generator
    const line = d3
      .line<TickData>()
      .x((d) => x(parseCustomTimestamp(d.timestamp))!)
      .y((d) => y(d.close))
      .curve(d3.curveMonotoneX);

    // Select the SVG element
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Remove existing content
    svg.selectAll('*').remove();

    // Append x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    // Append y-axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Append line path
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default LineChart;
