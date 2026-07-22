import { getReceipts, getStudents, getCourses, getDocumentServices, getAgents } from "@/lib/crud";
import { ReceiptsPanel } from "@/components/admin/receipts-panel";
import type { Receipt, StudentWithProfile, Course, DocumentService, Agent } from "@/lib/types";

export default async function ReceiptsPage() {
  const [r, s, c, svc, a] = await Promise.all([getReceipts(), getStudents(), getCourses(), getDocumentServices(), getAgents()]);

  return (
    <ReceiptsPanel
      initialReceipts={((r.data ?? []) as Receipt[]).filter((x) => x?.receipt_no)}
      initialStudents={(s.data ?? []) as StudentWithProfile[]}
      initialCourses={(c.data ?? []) as Course[]}
      initialServices={(svc.data ?? []) as DocumentService[]}
      initialAgents={(a.data ?? []) as Agent[]}
    />
  );
}
