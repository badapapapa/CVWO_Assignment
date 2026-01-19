import { useEffect, useState } from "react";

type Topic = {
  id: number;
  title: string;
  description: string;
};

type Post = {
  id: number;
  topicId: number;
  title: string;
  content: string;
};

function App() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Load topics on first render
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
        setLoadingTopics(false);
      })
      .catch((err: unknown) => {
        console.error("Error while fetching topics:", err);
        setTopicsError(
          err instanceof Error ? err.message : "Unknown error fetching topics"
        );
        setLoadingTopics(false);
      });
  }, []);

  // When a topic is clicked, load its posts
  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setPosts([]);
    setPostsError(null);
    setLoadingPosts(true);

    console.log("Fetching posts for topic", topic.id);

    fetch(`http://localhost:8080/posts?topicId=${topic.id}`)
      .then((res) => {
        console.log("Response from /posts:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data: Post[]) => {
        console.log("Posts data:", data);
        setPosts(data);
        setLoadingPosts(false);
      })
      .catch((err: unknown) => {
        console.error("Error while fetching posts:", err);
        setPostsError(
          err instanceof Error ? err.message : "Unknown error fetching posts"
        );
        setLoadingPosts(false);
      });
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Forum Topics</h1>

      {loadingTopics && <p>Loading topics...</p>}
      {topicsError && <p style={{ color: "red" }}>Error: {topicsError}</p>}

      {!loadingTopics && !topicsError && (
        <ul>
          {topics.map((t) => (
            <li key={t.id}>
              <button
                style={{
                  border: "none",
                  background: "none",
                  color: "blue",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "1rem",
                }}
                onClick={() => handleTopicClick(t)}
              >
                <strong>{t.title}</strong>
              </button>{" "}
              – {t.description}
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: "1.5rem 0" }} />

      {selectedTopic ? (
        <div>
          <h2>Posts under: {selectedTopic.title}</h2>

          {loadingPosts && <p>Loading posts...</p>}
          {postsError && <p style={{ color: "red" }}>Error: {postsError}</p>}

          {!loadingPosts && !postsError && posts.length === 0 && (
            <p>No posts for this topic yet.</p>
          )}

          {!loadingPosts && !postsError && posts.length > 0 && (
            <ul>
              {posts.map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong>
                  <p>{p.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p>Select a topic to view its posts.</p>
      )}
    </div>
  );
}

export default App;