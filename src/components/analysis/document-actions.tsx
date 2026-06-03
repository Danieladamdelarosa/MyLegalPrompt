"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentActions({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this document and its analysis? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/documents");
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete. Please try again.");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onDelete} disabled={deleting}>
      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Delete
    </Button>
  );
}
