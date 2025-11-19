"use client";

import db from "@/lib/db";
import Login from "./auth/login";
import EnsureProfile from "./components/ensure-profile";
import HomeClient from "./home-client";

function Main() {
  return (
    <EnsureProfile>
      <HomeClient />
    </EnsureProfile>
  );
}

export default function Home() {
  return (
    <>
      <db.SignedIn>
        <Main />
      </db.SignedIn>
      <db.SignedOut>
        <Login />
      </db.SignedOut>
    </>
  );
}
