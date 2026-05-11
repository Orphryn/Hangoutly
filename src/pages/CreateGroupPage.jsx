import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function CreateGroupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateGroup(e) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Group name is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: description.trim(),
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      setMessage(groupError.message);
      setIsSaving(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      setMessage(memberError.message);
      setIsSaving(false);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Create a Group</h1>
        <p className="mt-2 text-slate-400">
          Start a private space for planning hangouts.
        </p>

        <form onSubmit={handleCreateGroup} className="mt-8 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-violet-500"
          />

          <textarea
            placeholder="Description optional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[110px] rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-violet-500"
          />

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-violet-600 p-3 font-semibold transition hover:bg-violet-500 disabled:opacity-60"
          >
            {isSaving ? "Creating..." : "Create Group"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-red-400">{message}</p>}
      </section>
    </main>
  );
}