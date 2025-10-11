"use client";

import {
  IconCirclePlusFilled,
  IconDashboard,
  IconInnerShadowTop,
  IconListDetails,
  type Icon,
  type IconProps,
} from "@tabler/icons-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import Link from "next/link";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

const superAdminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: Router.HOME,
    icon: IconDashboard,
  },
  {
    title: "Organizations",
    url: Router.ORGANIZATIONS,
    icon: IconListDetails,
  },
];

export interface NavItem {
  title: string;
  url: string;
  icon?: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: Role;
}

export function AppSidebar({ role, ...props }: AppSidebarProps) {
  const navItems = role === Role.SUPER_ADMIN ? superAdminNavItems : [];
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={Router.HOME}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">ŷFL</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
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
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
