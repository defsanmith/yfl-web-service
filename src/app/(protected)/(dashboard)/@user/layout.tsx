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
      label: "Pending",
      href: Router.USER_FORECASTS_PENDING,
      isActive: (pathname: string) =>
        pathname === Router.USER_FORECASTS_PENDING || pathname === Router.HOME,
    },
    {
      label: "Submitted",
      href: Router.USER_FORECASTS_SUBMITTED,
      isActive: (pathname: string) =>
        pathname === Router.USER_FORECASTS_SUBMITTED,
    },
    {
      label: "Completed",
      href: Router.USER_FORECASTS_COMPLETED,
      isActive: (pathname: string) =>
        pathname === Router.USER_FORECASTS_COMPLETED ||
        pathname === Router.USER_FORECASTS_PAST, // Legacy route
    },
    {
      label: "All",
      href: Router.USER_FORECASTS_ALL,
      isActive: (pathname: string) => pathname === Router.USER_FORECASTS_ALL,
    },
  ];

  return (
    <div className="space-y-6">
      <NavTabs items={tabs} />
      {children}
    </div>
  );
}
