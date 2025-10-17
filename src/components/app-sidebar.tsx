"use client";

import {
  IconDashboard,
  IconEaseOutControlPoint,
  IconInnerShadowTop,
  IconListDetails,
  IconUsers,
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
import SuperAdminAction from "./main-action";
import OrgAdminAction from "./org-admin-action";

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

const orgAdminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: Router.HOME,
    icon: IconDashboard,
  },

  {
    title: "Forecasts",
    url: Router.FORECASTS,
    icon: IconEaseOutControlPoint,
  },
  {
    title: "Users",
    url: Router.ORG_ADMIN_USERS,
    icon: IconUsers,
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
  const navItems =
    role === Role.SUPER_ADMIN
      ? superAdminNavItems
      : role === Role.ORG_ADMIN
      ? orgAdminNavItems
      : [];

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
                {role === Role.SUPER_ADMIN ? (
                  <SuperAdminAction />
                ) : role === Role.ORG_ADMIN ? (
                  <OrgAdminAction />
                ) : null}
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
