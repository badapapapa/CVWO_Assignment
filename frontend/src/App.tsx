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

type Comment = {
  id: number;
  postId: number;
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

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

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

    // Reset post + comments view
    setSelectedPost(null);
    setComments([]);
    setCommentsError(null);
    setLoadingComments(false);

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

  // When a post is clicked, load its comments
  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setComments([]);
    setCommentsError(null);
    setLoadingComments(true);

    console.log("Fetching comments for post", post.id);

    fetch(`http://localhost:8080/comments?postId=${post.id}`)
      .then((res) => {
        console.log("Response from /comments:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data: Comment[]) => {
        console.log("Comments data:", data);
        setComments(data);
        setLoadingComments(false);
      })
      .catch((err: unknown) => {
        console.error("Error while fetching comments:", err);
        setCommentsError(
          err instanceof Error
            ? err.message
            : "Unknown error fetching comments"
        );
        setLoadingComments(false);
      });
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Forum</h1>

      <section>
        <h2>Topics</h2>

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
      </section>

      <hr style={{ margin: "1.5rem 0" }} />

      <section>
        {selectedTopic ? (
          <>
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
                    <button
                      style={{
                        border: "none",
                        background: "none",
                        color: "purple",
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "1rem",
                      }}
                      onClick={() => handlePostClick(p)}
                    >
                      <strong>{p.title}</strong>
                    </button>
                    <p>{p.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>Select a topic to view its posts.</p>
        )}
      </section>

      <hr style={{ margin: "1.5rem 0" }} />

      <section>
        {selectedPost ? (
          <>
            <h2>Comments for: {selectedPost.title}</h2>

            {loadingComments && <p>Loading comments...</p>}
            {commentsError && (
              <p style={{ color: "red" }}>Error: {commentsError}</p>
            )}

            {!loadingComments && !commentsError && comments.length === 0 && (
              <p>No comments for this post yet.</p>
            )}

            {!loadingComments && !commentsError && comments.length > 0 && (
              <ul>
                {comments.map((c) => (
                  <li key={c.id}>{c.content}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>Select a post to view its comments.</p>
        )}
      </section>
    </div>
  );
}

export default App;