import { getImmigrationPickups } from "@/lib/crud";
import { ImmigrationPickupPanel } from "@/components/admin/immigration-pickup-panel";
import type { ImmigrationPickup } from "@/lib/types";

export default async function ImmigrationPickupsPage() {
  const res = await getImmigrationPickups();

  return <ImmigrationPickupPanel initialPickups={(res.data ?? []) as ImmigrationPickup[]} />;
}
