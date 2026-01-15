import { useEffect, useState } from "react";
import { fetchAchievement, type Achievement } from "../lib/api";

type Props = {
  achievementId: number | null;
  onClose: () => void;
};

export function AchievementDrawer({ achievementId, onClose }: Props) {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!achievementId) {
      setAchievement(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchAchievement(achievementId)
      .then(setAchievement)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [achievementId]);

  if (!achievementId) return null;

  return (
    <div style={{ padding: "16px", borderLeft: "1px solid #ddd", height: "100%", overflow: "auto" }}>
      <button onClick={onClose} style={{ float: "right", border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}>×</button>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {achievement && (
        <>
          <h2 style={{ margin: "0 0 8px" }}>{achievement.name}</h2>
          <p style={{ color: "#666", margin: "0 0 16px" }}>{achievement.points} points</p>
          <p>{achievement.description}</p>
          {achievement.isAccountWide && <p style={{ color: "#0066cc" }}>Account-wide</p>}
          {achievement.criteria.length > 0 && (
            <>
              <h3>Criteria</h3>
              <ul>
                {achievement.criteria.map((c) => (
                  <li key={c.id}>{c.description}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
