"use client";

import Router from "@/constants/router";
import { IconPlus } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarMenuButton } from "./ui/sidebar";

export default function OrgAdminAction() {
  const router = useRouter();
  const pathname = usePathname();

  const handleCreateForecast = () => {
    // Navigate to forecasts page with create param to open modal
    if (pathname === Router.ORG_ADMIN_FORECASTS) {
      router.push(`${Router.ORG_ADMIN_FORECASTS}?create=true`);
    } else {
      router.push(`${Router.ORG_ADMIN_FORECASTS}?create=true`);
    }
  };

  return (
    <SidebarMenuButton
      tooltip="Create Forecast"
      className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear cursor-pointer"
      onClick={handleCreateForecast}
    >
      <IconPlus />
      <span>Create Forecast</span>
    </SidebarMenuButton>
  );
}
