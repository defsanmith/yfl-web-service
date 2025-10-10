import HomeView from "@/views/home/HomeView";

/**
 * Home Page - Server Component
 * Handles data fetching and passes to view component
 */
export default async function Home() {
  // Future: Add data fetching here
  // const data = await getSomeData();

  return <HomeView />;
}
