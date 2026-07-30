"use client";

import { saveLocalSession } from "@/lib/local-session";
import { useRouter } from "next/navigation";

export function ResumeIncidentLink({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const router = useRouter();
  const href = `/operations/${id}?scenario=midnight-latency-incident`;
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        saveLocalSession(
          id,
          "midnight-latency-incident",
          sessionStorage,
          "api",
        );
        router.push(href);
      }}
    >
      Resume investigation
    </button>
  );
}
