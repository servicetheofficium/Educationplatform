import { getReceipts, getStudents, getCourses, getDocumentServices } from "@/lib/crud";
import { ReceiptsPanel } from "@/components/admin/receipts-panel";
import type { Receipt, StudentWithProfile, Course, DocumentService } from "@/lib/types";

export default async function ReceiptsPage() {
  const [r, s, c, svc] = await Promise.all([getReceipts(), getStudents(), getCourses(), getDocumentServices()]);

  return (
    <ReceiptsPanel
      initialReceipts={((r.data ?? []) as Receipt[]).filter((x) => x?.receipt_no)}
      initialStudents={(s.data ?? []) as StudentWithProfile[]}
      initialCourses={(c.data ?? []) as Course[]}
      initialServices={(svc.data ?? []) as DocumentService[]}
    />
  );
}
