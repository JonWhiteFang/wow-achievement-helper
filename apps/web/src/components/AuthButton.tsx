import { getLoginUrl, logout } from "../lib/api";

type Props = {
  loggedIn: boolean;
  battletag?: string | null;
  onLogout: () => void;
};

export function AuthButton({ loggedIn, battletag, onLogout }: Props) {
  if (!loggedIn) {
    return <a href={getLoginUrl()} className="btn btn-primary">Sign in with Battle.net</a>;
  }

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: "var(--muted)", fontSize: 14 }}>{battletag || "Logged in"}</span>
      <button className="btn btn-ghost" onClick={handleLogout} style={{ fontSize: 12 }}>Logout</button>
    </div>
  );
}
