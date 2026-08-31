"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckinAliasPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/scan");
  }, [router]);

  return null;
}
