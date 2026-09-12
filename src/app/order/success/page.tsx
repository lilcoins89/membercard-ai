import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-3xl">✓</p>
        <h1 className="mt-4 font-display text-2xl font-medium">Order received</h1>
        <p className="mt-3 text-muted-foreground">
          Your physical card is headed to production. You&apos;ll get tracking once it ships.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button asChild><Link href="/">Back home</Link></Button>
          <Button asChild variant="outline"><Link href="/create">Create another card</Link></Button>
        </div>
      </div>
    </div>
  );
}
