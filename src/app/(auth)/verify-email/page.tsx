"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed");
        setStatus("ok");
        setMessage(data.data?.message || "Email verified");
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.message);
      });
  }, [token]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email verification</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        {status === "loading" && <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />}
        {status === "ok" && <CheckCircle2 className="h-10 w-10 text-emerald-500" />}
        {status === "error" && <XCircle className="h-10 w-10 text-red-500" />}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message || "Verifying..."}</p>
        <Link href="/login" className="text-sm font-medium text-indigo-600 hover:underline">
          Continue to login
        </Link>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
