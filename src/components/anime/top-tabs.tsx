import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/top", label: "Melhor nota" },
  { href: "/top/populares", label: "Mais populares" },
];

export function TopTabs({ active }: { active: string }) {
  return (
    <nav className="bg-muted inline-flex w-fit gap-1 rounded-lg p-1 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1",
            tab.href === active
              ? "bg-background font-medium shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
