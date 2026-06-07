import { getDocumentServices, getServiceRequests } from "@/lib/crud";
import { ServicesPanel } from "@/components/admin/services-panel";
import type { DocumentService, ServiceRequest } from "@/lib/types";

export default async function ServicesPage() {
  const [svc, req] = await Promise.all([getDocumentServices(), getServiceRequests()]);

  return (
    <ServicesPanel
      initialServices={(svc.data ?? []) as DocumentService[]}
      initialRequests={(req.data ?? []) as ServiceRequest[]}
    />
  );
}
