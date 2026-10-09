"use client";

import { useEffect, useState } from "react";

export default function AuditScreen() {
  const [status, setStatus] = useState<string>("Loading...");

  useEffect(() => {
    fetch("/api/v1/health")
      .then((res) => res.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch((err) => setStatus(err.toString()));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">AMR-Guard Audit Screen (Stub)</h1>
      <p>Health check status: {status}</p>
    </main>
  );
}
