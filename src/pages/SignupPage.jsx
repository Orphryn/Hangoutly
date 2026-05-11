import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setMessage("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      setMessage("Username is required.");
      return;
    }

    if (cleanUsername.length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setMessage("Username can only use letters, numbers, and underscores.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (existingUsername) {
      setMessage("That username is already taken.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const userId = data?.user?.id;

    if (userId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        email: cleanEmail,
        username: cleanUsername,
        display_name: cleanUsername,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setMessage(profileError.message);
        return;
      }
    }

    setMessage("Account created. Check your email to verify your account.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-center text-4xl font-bold">Create Account</h1>

        <p className="mt-2 text-center text-slate-400">
          Choose a username people can search for on Hangoutly.
        </p>

        <form onSubmit={handleSignup} className="mt-8 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-violet-500"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-violet-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-violet-500"
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-violet-500"
          />

          <button
            type="submit"
            className="rounded-xl bg-violet-600 p-3 font-semibold transition hover:bg-violet-500"
          >
            Create Account
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-slate-300">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-violet-400">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}