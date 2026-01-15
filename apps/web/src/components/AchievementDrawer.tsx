import { useEffect, useState } from "react";
import { fetchAchievement, fetchHelp, type Achievement, type HelpPayload } from "../lib/api";

type Props = {
  achievementId: number | null;
  onClose: () => void;
};

type Tab = "details" | "strategy" | "community";

export function AchievementDrawer({ achievementId, onClose }: Props) {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [help, setHelp] = useState<HelpPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("details");

  useEffect(() => {
    if (!achievementId) {
      setAchievement(null);
      setHelp(null);
      return;
    }
    setLoading(true);
    setError(null);
    setTab("details");
    fetchAchievement(achievementId)
      .then(setAchievement)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [achievementId]);

  const loadHelp = () => {
    if (!achievementId || help?.achievementId === achievementId) return;
    setHelpLoading(true);
    fetchHelp(achievementId)
      .then(setHelp)
      .catch(() => setHelp({ achievementId, strategy: [], comments: [], sources: [] }))
      .finally(() => setHelpLoading(false));
  };

  useEffect(() => {
    if ((tab === "strategy" || tab === "community") && achievementId) {
      loadHelp();
    }
  }, [tab, achievementId]);

  if (!achievementId) return null;

  const tabStyle = (t: Tab) => ({
    padding: "8px 12px",
    border: "none",
    borderBottom: tab === t ? "2px solid #0074e0" : "2px solid transparent",
    background: "none",
    cursor: "pointer",
    fontWeight: tab === t ? 600 : 400,
  });

  return (
    <div style={{ padding: "16px", borderLeft: "1px solid #ddd", height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
      <button onClick={onClose} style={{ position: "absolute", right: "8px", top: "8px", border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}>×</button>
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {achievement && (
        <>
          <h2 style={{ margin: "0 0 4px", paddingRight: "24px" }}>{achievement.name}</h2>
          <p style={{ color: "#666", margin: "0 0 12px" }}>{achievement.points} points</p>
          
          <div style={{ borderBottom: "1px solid #ddd", marginBottom: "12px" }}>
            <button style={tabStyle("details")} onClick={() => setTab("details")}>Details</button>
            <button style={tabStyle("strategy")} onClick={() => setTab("strategy")}>Strategy</button>
            <button style={tabStyle("community")} onClick={() => setTab("community")}>Community</button>
          </div>

          {tab === "details" && (
            <>
              <p>{achievement.description}</p>
              {achievement.isAccountWide && <p style={{ color: "#0066cc" }}>Account-wide</p>}
              {achievement.criteria.length > 0 && (
                <>
                  <h3 style={{ marginBottom: "8px" }}>Criteria</h3>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {achievement.criteria.map((c) => (
                      <li key={c.id}>{c.description}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {tab === "strategy" && (
            <>
              {helpLoading && <p>Loading strategy...</p>}
              {!helpLoading && help?.strategy.length === 0 && (
                <p style={{ color: "#666" }}>No strategy guides available.</p>
              )}
              {help?.strategy.map((s, i) => (
                <div key={i} style={{ marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 8px" }}>{s.title}</h4>
                  <ol style={{ margin: 0, paddingLeft: "20px" }}>
                    {s.steps.map((step, j) => <li key={j}>{step}</li>)}
                  </ol>
                </div>
              ))}
              {help?.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: "12px", color: "#0074e0" }}>
                  View on {s.name} →
                </a>
              ))}
            </>
          )}

          {tab === "community" && (
            <>
              {helpLoading && <p>Loading comments...</p>}
              {!helpLoading && help?.comments.length === 0 && (
                <p style={{ color: "#666" }}>No community comments available.</p>
              )}
              {help?.comments.map((c, i) => (
                <div key={i} style={{ marginBottom: "12px", padding: "8px", background: "#f5f5f5", borderRadius: "4px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                    {c.author} {c.score !== null && <span>• {c.score > 0 ? "+" : ""}{c.score}</span>}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>{c.text}</div>
                </div>
              ))}
              {help?.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: "12px", color: "#0074e0" }}>
                  View on {s.name} →
                </a>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
