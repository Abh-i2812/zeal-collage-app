"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckinAliasPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/student/checkin");
  }, [router]);

  return null;
}
