import Router from "@/constants/router";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import Link from "next/link";
import { SidebarMenuButton } from "./ui/sidebar";

export default function SuperAdminAction() {
  return (
    <SidebarMenuButton
      tooltip="Quick Create"
      className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
      asChild
    >
      <Link href={Router.CREATE_ORGANIZATION}>
        <IconCirclePlusFilled />
        <span>Create Organization</span>
      </Link>
    </SidebarMenuButton>
  );
}
