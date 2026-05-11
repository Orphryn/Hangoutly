import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main>
      <h1>Hangoutly</h1>
      <p>Group plans without the group chat chaos.</p>

      <Link to="/signup">Get Started</Link>
      <Link to="/login">Log In</Link>
    </main>
  );
}