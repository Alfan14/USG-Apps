import { redirect } from "next/navigation";

/** Redirect root to the recorder UI */
export default function RootPage() {
  redirect("/recorder");
}
