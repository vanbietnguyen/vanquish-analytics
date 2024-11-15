import { api, HydrateClient } from "~/trpc/server";
// import ChartWithDatePicker from "~/components/ChartWithDatePicker";
import SimulatedChart from "~/components/SimulatedChart";

export default async function Home() {
  return (
    <HydrateClient>
      move this later
      {/*<ChartWithDatePicker />*/}
      <SimulatedChart />
    </HydrateClient>
  );
}
