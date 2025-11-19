import { redirect } from "next/navigation";

export default function LeaderboardPage() {
  // Redirect to the users tab by default
  redirect("/leaderboard/users");
}
