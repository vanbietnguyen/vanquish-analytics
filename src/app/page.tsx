import { api, HydrateClient } from "~/trpc/server";
import ChartWithDatePicker from "~/components/ChartWithDatePicker";

export default async function Home() {
  return (
    <HydrateClient>
      move this later
      <ChartWithDatePicker />
    </HydrateClient>
  );
}
