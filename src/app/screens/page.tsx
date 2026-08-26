import Link from "next/link";
import { listScreens } from "@/lib/server/screens";

export const dynamic = "force-dynamic";

export default async function ScreensPage() {
  const screens = await listScreens();

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Designer
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Published screens</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Each publish uploads a Compose Studio document — routes, click actions, form rules, and API error UI included. Android fetches the same JSON from <code>/api/screens/:id</code>.
        </p>
      </div>
      {screens.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
          No screens published yet. Open the designer and press Publish.
        </div>
      ) : (
        <ul className="space-y-3">
          {screens.map((screen) => (
            <li key={screen.id} className="rounded-xl border p-4">
              <div className="font-medium">{screen.name}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{screen.id}</div>
              <div className="mt-1 text-xs text-muted-foreground">{screen.publishedAt}</div>
              <div className="mt-3 flex gap-3 text-sm">
                <Link href={`/device/${screen.id}`} className="text-primary hover:underline">
                  Device runtime
                </Link>
                <a href={`/api/screens/${screen.id}`} className="text-primary hover:underline">
                  JSON document
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
