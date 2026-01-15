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

  useEffect(() => {
    if ((tab === "strategy" || tab === "community") && achievementId && help?.achievementId !== achievementId) {
      setHelpLoading(true);
      fetchHelp(achievementId)
        .then(setHelp)
        .catch(() => setHelp({ achievementId, strategy: [], comments: [], sources: [] }))
        .finally(() => setHelpLoading(false));
    }
  }, [tab, achievementId]);

  if (!achievementId) return null;

  return (
    <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          {loading && <p className="text-muted">Loading...</p>}
          {error && <p className="text-danger">{error}</p>}
          {achievement && (
            <>
              <h2 style={{ margin: 0, fontSize: 18, color: "var(--text)" }}>{achievement.name}</h2>
              <p style={{ margin: "4px 0 0", color: "var(--accent)" }}>{achievement.points} points</p>
            </>
          )}
        </div>
        <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: 18, padding: "4px 8px" }}>×</button>
      </div>

      {achievement && (
        <>
          <div className="tabs">
            {(["details", "strategy", "community"] as Tab[]).map((t) => (
              <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {tab === "details" && (
              <>
                <p style={{ color: "var(--text)", margin: "0 0 12px" }}>{achievement.description}</p>
                {achievement.isAccountWide && <p className="badge badge-success" style={{ marginBottom: 12 }}>Account-wide</p>}
                {achievement.criteria.length > 0 && (
                  <>
                    <h4 style={{ margin: "0 0 8px", color: "var(--muted)" }}>Criteria</h4>
                    <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text)" }}>
                      {achievement.criteria.map((c) => <li key={c.id}>{c.description}</li>)}
                    </ul>
                  </>
                )}
              </>
            )}

            {tab === "strategy" && (
              <>
                {helpLoading && <p className="text-muted">Loading strategy...</p>}
                {!helpLoading && help?.strategy.length === 0 && <p className="text-muted">No strategy guides available.</p>}
                {help?.strategy.map((s, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <h4 style={{ margin: "0 0 8px", color: "var(--text)" }}>{s.title}</h4>
                    <ol style={{ margin: 0, paddingLeft: 20, color: "var(--muted)" }}>
                      {s.steps.map((step, j) => <li key={j}>{step}</li>)}
                    </ol>
                  </div>
                ))}
                {help?.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 12 }}>
                    View on {s.name} →
                  </a>
                ))}
              </>
            )}

            {tab === "community" && (
              <>
                {helpLoading && <p className="text-muted">Loading comments...</p>}
                {!helpLoading && help?.comments.length === 0 && <p className="text-muted">No community comments available.</p>}
                {help?.comments.map((c, i) => (
                  <div key={i} style={{ marginBottom: 12, padding: 10, background: "var(--panel-2)", borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                      {c.author} {c.score !== null && <span>• {c.score > 0 ? "+" : ""}{c.score}</span>}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", color: "var(--text)", fontSize: 13 }}>{c.text}</div>
                  </div>
                ))}
                {help?.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 12 }}>
                    View on {s.name} →
                  </a>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
