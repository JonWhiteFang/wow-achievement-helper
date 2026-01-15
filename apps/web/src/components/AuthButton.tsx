import { getLoginUrl, logout } from "../lib/api";

type Props = {
  loggedIn: boolean;
  battletag?: string | null;
  onLogout: () => void;
};

export function AuthButton({ loggedIn, battletag, onLogout }: Props) {
  if (!loggedIn) {
    return (
      <a href={getLoginUrl()} style={{ padding: "6px 12px", background: "#0074e0", color: "white", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>
        Sign in with Battle.net
      </a>
    );
  }

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "14px" }}>{battletag || "Logged in"}</span>
      <button onClick={handleLogout} style={{ padding: "4px 8px", fontSize: "12px" }}>
        Logout
      </button>
    </div>
  );
}
