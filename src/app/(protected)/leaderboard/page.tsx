import Router from "@/constants/router";
import { redirect } from "next/navigation";

export default function LeaderboardPage() {
  // Redirect to the users tab by default
  redirect(Router.LEADERBOARD_USERS);
}
