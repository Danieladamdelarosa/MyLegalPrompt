"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

async function post(url: string): Promise<{ url?: string; error?: string }> {
  const res = await fetch(url, { method: "POST" });
  return res.json().catch(() => ({ error: "Request failed." }));
}

export function UpgradeButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const data = await post("/api/stripe/checkout");
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error ?? "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={loading || disabled} className="w-full" size="lg">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Upgrade to Pro
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const data = await post("/api/stripe/portal");
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error ?? "Could not open billing portal.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={loading} variant="outline" className="w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Manage billing & invoices
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
