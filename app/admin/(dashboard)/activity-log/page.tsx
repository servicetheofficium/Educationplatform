import { getAdminActivityLog } from "@/lib/crud";
import { ActivityLogPanel } from "@/components/admin/activity-log-panel";
import type { AdminActivityLog } from "@/lib/types";

export default async function ActivityLogPage() {
  const { data } = await getAdminActivityLog();

  return <ActivityLogPanel initialLogs={(data ?? []) as AdminActivityLog[]} />;
}
