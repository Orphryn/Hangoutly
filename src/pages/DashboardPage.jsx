import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <main>
      <h1>Dashboard</h1>

      <p>Logged in as:</p>

      <p>{user?.email}</p>

      <button onClick={handleLogout}>
        Logout
      </button>
    </main>
  );
}