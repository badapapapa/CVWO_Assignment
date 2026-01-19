import { useEffect, useState } from "react";

type Topic = {
  id: number;
  title: string;
  description: string;
};

function App() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Fetching topics from backend...");

    fetch("http://localhost:8080/topics")
      .then((res) => {
        console.log("Response from /topics:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data: Topic[]) => {
        console.log("Topics data:", data);
        setTopics(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error("Error while fetching topics:", err);
        setError(
          err instanceof Error ? err.message : "Unknown error fetching topics"
        );
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading topics...</p>;
  }

  if (error) {
    return <p>Error loading topics: {error}</p>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Forum Topics</h1>
      <ul>
        {topics.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong> – {t.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;