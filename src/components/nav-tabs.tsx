import { buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavTabItem {
  label: string;
  href: string;
  /**
   * Optional custom active check. If not provided, uses pathname.startsWith(href)
   */
  isActive?: (pathname: string) => boolean;
}

export interface NavTabsProps {
  items: NavTabItem[];
  className?: string;
}

/**
 * Navigation tabs component using button group pattern
 *
 * Renders a group of navigation links styled as buttons with active state.
 * The active tab is determined by matching the current pathname.
 *
 * @example
 * ```tsx
 * <NavTabs
 *   items={[
 *     { label: "Overview", href: "/orgs/123" },
 *     { label: "Settings", href: "/orgs/123/settings" },
 *     { label: "Billing", href: "/orgs/123/billing" },
 *   ]}
 * />
 * ```
 *
 * @example With custom active check
 * ```tsx
 * <NavTabs
 *   items={[
 *     {
 *       label: "Overview",
 *       href: "/orgs/123",
 *       isActive: (pathname) => pathname === "/orgs/123" || pathname.endsWith("/overview")
 *     },
 *   ]}
 * />
 * ```
 */
export function NavTabs({ items, className }: NavTabsProps) {
  const pathname = usePathname();

  return (
    <ButtonGroup className={className}>
      {items.map((item) => {
        const isActive = item.isActive
          ? item.isActive(pathname)
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({
                variant: isActive ? "default" : "outline",
              })
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </ButtonGroup>
  );
}
