"use client";

import Router from "@/constants/router";
import { IconUserPlus, IconUsersPlus } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarMenuButton } from "./ui/sidebar";

export default function OrgAdminAction() {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    // If already on the users page, add query param to open dialog
    if (pathname === Router.ORG_ADMIN_USERS) {
      router.push(`${Router.ORG_ADMIN_USERS}?create=true`);
    } else {
      // Otherwise, navigate to users page with create param
      router.push(`${Router.ORG_ADMIN_USERS}?create=true`);
    }
  };

  const handleAddMultipleClick = () => {
    // Navigate to users page with bulk upload param
    if (pathname === Router.ORG_ADMIN_USERS) {
      router.push(`${Router.ORG_ADMIN_USERS}?bulkUpload=true`);
    } else {
      router.push(`${Router.ORG_ADMIN_USERS}?bulkUpload=true`);
    }
  };

  return (
    <div className="flex gap-2">
      <SidebarMenuButton
        tooltip="Create User"
        className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
        onClick={handleClick}
      >
        <IconUserPlus />
        <span>Create User</span>
      </SidebarMenuButton>

      <SidebarMenuButton
        tooltip="Add Multiple Users"
        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground active:bg-secondary/90 active:text-secondary-foreground min-w-8 duration-200 ease-linear"
        onClick={handleAddMultipleClick}
      >
        <IconUsersPlus />
        <span>Bulk Upload</span>
      </SidebarMenuButton>
    </div>
  );
}
