import { createServerComponentClient } from "@/lib/supabase-server";
import MarketingPage from "./components/MarketingPage";
import DashboardPage from "./components/DashboardPage";

export default async function Home() {
  // Check authentication
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Conditional rendering based on auth state
  if (user) {
    return <DashboardPage userId={user.id} />;
  }

  return <MarketingPage />;
}
