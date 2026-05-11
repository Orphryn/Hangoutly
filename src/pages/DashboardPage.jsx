import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays,
  MessageCircle,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const { data: memberRows, error: groupsError } = await supabase
        .from("group_members")
        .select(`
          role,
          groups (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq("user_id", user.id);

      if (!groupsError && memberRows) {
        const normalizedGroups = memberRows
          .map((row) => ({
            ...row.groups,
            role: row.role,
          }))
          .filter(Boolean);

        setGroups(normalizedGroups);
      }

      setLoadingGroups(false);
    }

    loadDashboard();
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Hangoutly</h1>
            <p className="mt-1 text-slate-400">
              Group plans without the group chat chaos.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-12 w-12 rounded-full border border-violet-500 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 font-bold">
                {user?.email?.[0]?.toUpperCase()}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <p className="text-slate-400">Welcome back</p>

          <h2 className="mt-1 text-3xl font-bold">
            {profile?.display_name || profile?.username || user?.email}
          </h2>

          <p className="mt-2 text-slate-400">
            Ready to plan your next hangout?
          </p>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-4">
          <DashboardCard
            icon={<Plus size={22} />}
            title="Create Group"
            description="Start a new friend group."
            onClick={() => navigate("/groups/new")}
          />

          <DashboardCard
            icon={<MessageCircle size={22} />}
            title="Group Chat"
            description="Message your people."
          />

          <DashboardCard
            icon={<CalendarDays size={22} />}
            title="Calendar"
            description="Add your events."
          />

          <DashboardCard
            icon={<ShieldCheck size={22} />}
            title="Safety"
            description="Private emergency sharing."
          />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Your Groups</h3>
                <p className="text-sm text-slate-400">
                  Groups you created or joined.
                </p>
              </div>

              <button
                onClick={() => navigate("/groups/new")}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold transition hover:bg-violet-500"
              >
                New Group
              </button>
            </div>

            {loadingGroups ? (
              <p className="text-slate-400">Loading groups...</p>
            ) : groups.length === 0 ? (
              <div>
                <p className="text-slate-400">
                  You haven’t created any groups yet.
                </p>

                <button
                  onClick={() => navigate("/groups/new")}
                  className="mt-5 rounded-xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500"
                >
                  Create your first group
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-violet-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600">
                        <Users size={20} />
                      </div>

                      <div>
                        <h4 className="font-bold">{group.name}</h4>
                        <p className="text-sm text-slate-400">
                          {group.description || "No description yet."}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-violet-400">
                          {group.role}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-2 text-xl font-bold">Upcoming Plans</h3>
            <p className="text-slate-400">
              No upcoming events yet. Add your availability soon.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function DashboardCard({ icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-violet-500 hover:bg-slate-800"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600">
        {icon}
      </div>

      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </button>
  );
}