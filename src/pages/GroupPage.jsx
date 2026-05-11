import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  CalendarDays,
  MessageCircle,
  Users,
  ArrowLeft,
  Send,
  LogOut,
} from "lucide-react";

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  async function loadMembers() {
    const { data } = await supabase
      .from("group_members")
      .select(`
        role,
        status,
        profiles (
          id,
          username,
          display_name,
          avatar_url,
          email
        )
      `)
      .eq("group_id", groupId)
      .eq("status", "accepted");

    setMembers(data || []);
  }

  useEffect(() => {
    async function loadGroup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);

      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) {
        console.error(groupError.message);
        setLoading(false);
        return;
      }

      setGroup(groupData);
      await loadMembers();

      const { data: messageData } = await supabase
        .from("messages")
        .select(`
          *,
          profiles:sender_id (
            username,
            display_name,
            avatar_url,
            email
          )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      setMessages(messageData || []);
      setLoading(false);
    }

    loadGroup();

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              profiles:sender_id (
                username,
                display_name,
                avatar_url,
                email
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  async function sendMessage(e) {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("messages").insert({
      group_id: groupId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      console.error(error.message);
      return;
    }

    setNewMessage("");
  }

  async function inviteMember(e) {
    e.preventDefault();

    const cleanUsername = inviteUsername.trim().toLowerCase();

    if (!cleanUsername) return;

    setInviteMessage("");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", cleanUsername)
      .single();

    if (profileError || !profile) {
      setInviteMessage("No user found with that username.");
      return;
    }

    if (profile.id === currentUserId) {
      setInviteMessage("You are already in this group.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: profile.id,
      invited_by: user.id,
      role: "member",
      status: "pending",
    });

    if (error) {
      if (error.message.includes("duplicate")) {
        setInviteMessage("That user already has an invite or is already a member.");
      } else {
        setInviteMessage(error.message);
      }
      return;
    }

    setInviteUsername("");
    setInviteMessage("Invite sent. They must accept before joining.");
  }

  async function leaveGroup() {
    const confirmed = window.confirm("Are you sure you want to leave this group?");
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    const { data: remainingMembers } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("status", "accepted");

    if (!remainingMembers || remainingMembers.length === 0) {
      await supabase.from("groups").delete().eq("id", groupId);
    }

    navigate("/dashboard");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Loading group...</p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-red-400">Group not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <header className="mb-8 flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <h1 className="text-4xl font-bold">{group.name}</h1>
            <p className="mt-2 text-slate-400">
              {group.description || "No description yet."}
            </p>
          </div>

          <button
            onClick={leaveGroup}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500"
          >
            <LogOut size={16} />
            Leave Group
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold">
              <Users size={18} />
              Members
            </h2>

            <form onSubmit={inviteMember} className="mb-5 space-y-2">
              <input
                type="text"
                placeholder="Invite by username"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold transition hover:bg-violet-500"
              >
                Send Invite
              </button>

              {inviteMessage && (
                <p className="text-xs text-slate-400">{inviteMessage}</p>
              )}
            </form>

            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-slate-400">No members loaded.</p>
              ) : (
                members.map((member) => {
                  const profile = member.profiles;

                  return (
                    <div
                      key={profile?.id}
                      className="flex items-center gap-3 rounded-2xl bg-slate-950 p-3"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-bold">
                          {profile?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}

                      <div>
                        <p className="font-semibold">
                          {profile?.username || "Unknown User"}
                        </p>

                        <p className="text-xs uppercase tracking-wide text-violet-400">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-6 flex gap-3">
              <TabButton
                active={activeTab === "chat"}
                onClick={() => setActiveTab("chat")}
                icon={<MessageCircle size={18} />}
                label="Chat"
              />

              <TabButton
                active={activeTab === "calendar"}
                onClick={() => setActiveTab("calendar")}
                icon={<CalendarDays size={18} />}
                label="Calendar"
              />
            </div>

            {activeTab === "chat" && (
              <div className="flex h-[600px] flex-col rounded-3xl bg-slate-950">
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                  {messages.length === 0 ? (
                    <p className="text-slate-400">No messages yet.</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-2xl bg-slate-900 p-4"
                      >
                        <div className="mb-2 flex items-center gap-3">
                          {message.profiles?.avatar_url ? (
                            <img
                              src={message.profiles.avatar_url}
                              alt="Avatar"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-bold">
                              {message.profiles?.username?.[0]?.toUpperCase() ||
                                "?"}
                            </div>
                          )}

                          <div>
                            <p className="font-semibold">
                              {message.profiles?.username ||
                                message.profiles?.email}
                            </p>

                            <p className="text-xs text-slate-500">
                              {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <p className="text-slate-200">{message.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="border-t border-slate-800 p-4"
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Send a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-violet-500"
                    />

                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 font-semibold transition hover:bg-violet-500"
                    >
                      <Send size={18} />
                      Send
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="min-h-[600px] rounded-3xl bg-slate-950 p-6">
                <h2 className="text-2xl font-bold">Group Calendar</h2>
                <p className="mt-2 text-slate-400">
                  Personal events and availability come next.
                </p>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition ${
        active
          ? "bg-violet-600 text-white"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}