"use client";

import { NavTabs } from "@/components/nav-tabs";
import Router from "@/constants/router";

export default function UserForecastsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tabs = [
    {
      label: "Upcoming",
      href: Router.HOME,
      isActive: (pathname: string) => pathname === Router.HOME,
    },
    {
      label: "Past",
      href: Router.USER_FORECASTS_PAST,
      isActive: (pathname: string) => pathname === Router.USER_FORECASTS_PAST,
    },
  ];

  return (
    <div className="space-y-6">
      <NavTabs items={tabs} />
      {children}
    </div>
  );
}
