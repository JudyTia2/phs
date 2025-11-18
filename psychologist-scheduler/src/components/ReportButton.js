import React, { useState, useRef } from "react";

export default function ReportButton({ month = "2025-11", apiBase = "http://localhost:5000" }) {
  const [status, setStatus] = useState("idle");      // idle | inflight | accepted | done | error
  const [result, setResult] = useState(null);
  const [pollUrl, setPollUrl] = useState(null);
  const timerRef = useRef(null);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startPoll = (url) => {
    cleanup();
    timerRef.current = setInterval(async () => {
      try {
        const res = await fetch(apiBase + url);
        const data = await res.json();
        // If the response has a 'result' key, the job is done.
        if (data.result) {
          setStatus("done");
          setResult(data);
          cleanup();
        } else if (data.status === "inflight") {
          // Status is already 'inflight' or 'accepted', no need to set it again.
        } else {
          setStatus("error");
          cleanup();
        }
      } catch (e) {
        setStatus("error");
        cleanup();
      }
    }, 1200); // Poll every 1.2 seconds
  };

  const handleClick = async () => {
    setStatus("inflight");
    setResult(null);

    const idemKey = crypto.randomUUID();   // Browser-native UUID generator
    try {
      const res = await fetch(`${apiBase}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({ month }),
      });
      const data = await res.json();

      if (res.status === 202 && (data.status === "accepted" || data.status === "inflight")) {
        setStatus(data.status);
        if (data.poll) {
          setPollUrl(data.poll);
          startPoll(data.poll);
        }
      } else if (data.status === "done" || data.result) {
        // If already cached, return immediately
        setStatus("done");
        setResult(data);
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <div style={{ padding: 12, border: "1px dashed #ccc", borderRadius: 8, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <button onClick={handleClick} disabled={status === "inflight" || status === "accepted"}>
          Generate "{month}" Report (Background Task)
        </button>
        <span>Status: {status}</span>
      </div>
      {pollUrl && <div style={{ fontSize: 12, color: "#666" }}>Polling: {pollUrl}</div>}
      {result && (
        <pre style={{ background: "#f7f7f7", padding: 10, borderRadius: 6, overflowX: "auto" }}>
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
