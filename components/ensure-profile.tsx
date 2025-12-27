"use client";

import { useEffect, useRef } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";

function randomHandle() {
  const adjectives = ["Quick", "Lazy", "Happy", "Sad", "Bright", "Dark"];
  const nouns = ["Fox", "Dog", "Cat", "Bird", "Fish", "Mouse"];
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
  return `${randomAdjective}${randomNoun}${randomSuffix}`;
}

async function createProfile(userId: string) {
  const profileId = id();
  await db.transact(
    db.tx.profiles[profileId]
      .update({
        handle: randomHandle(),
// monthlyBudget: 0,
        createdAt: Date.now(),
      })
      .link({ user: userId })
  );
}

export default function EnsureProfile({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = db.useUser();
  const isCreatingRef = useRef(false);

  const { isLoading, data, error } = db.useQuery({
    profiles: {
      $: { where: { "user.id": user.id } },
    },
  });

  const profile = data?.profiles?.[0];

  useEffect(() => {
    if (!isLoading && !profile && !isCreatingRef.current) {
      isCreatingRef.current = true;
      createProfile(user.id).catch((err) => {
        console.error("Error creating profile:", err);
        isCreatingRef.current = false;
      });
    }
  }, [isLoading, profile, user.id]);

  if (isLoading) return null;
  if (error)
    return (
      <div className="p-4 text-red-500">Profile error: {error.message}</div>
    );
  if (!profile) return null; // Still creating profile...

  return <>{children}</>;
}
