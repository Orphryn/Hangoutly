import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { CalendarDays, MessageCircle, Plus, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
    }

    loadProfile();
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold">Hangoutly</h1>
            <p className="text-slate-400 mt-1">
              Group plans without the group chat chaos.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover border border-violet-500"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-violet-600 flex items-center justify-center font-bold">
                {user?.email?.[0]?.toUpperCase()}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700 transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <p className="text-slate-400">Welcome back</p>
          <h2 className="text-3xl font-bold mt-1">
            {profile?.display_name || profile?.username || user?.email}
          </h2>
          <p className="text-slate-400 mt-2">
            Ready to plan your next hangout?
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-4 mb-8">
          <DashboardCard
            icon={<Plus />}
            title="Create Group"
            description="Start a new friend group."
          />

          <DashboardCard
            icon={<MessageCircle />}
            title="Group Chat"
            description="Message your people."
          />

          <DashboardCard
            icon={<CalendarDays />}
            title="Calendar"
            description="Add your events."
          />

          <DashboardCard
            icon={<ShieldCheck />}
            title="Safety"
            description="Private emergency sharing."
          />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-bold mb-2">Your Groups</h3>
            <p className="text-slate-400">
              You haven’t created any groups yet.
            </p>
            <button className="mt-5 rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500 transition">
              Create your first group
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-bold mb-2">Upcoming Plans</h3>
            <p className="text-slate-400">
              No upcoming events yet. Add your availability soon.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function DashboardCard({ icon, title, description }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 hover:border-violet-500 transition">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600">
        {icon}
      </div>

      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </div>
  );
}