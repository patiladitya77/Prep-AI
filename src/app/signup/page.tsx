"use client";
import { redirect } from "next/navigation";

export default function SignUp() {
  return (
    redirect("/login")
  );
}
