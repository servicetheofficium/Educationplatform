import { getAgents } from "@/lib/crud";
import { AgentsPanel } from "@/components/admin/agents-panel";
import type { Agent } from "@/lib/types";

export default async function AgentsPage() {
  const res = await getAgents();

  return <AgentsPanel initialAgents={(res.data ?? []) as Agent[]} />;
}
