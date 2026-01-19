import { useEffect, useState, FormEvent } from "react";

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

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState<string | null>(null);

  const [newCommentContent, setNewCommentContent] = useState("");
  const [creatingComment, setCreatingComment] = useState(false);
  const [createCommentError, setCreateCommentError] = useState<string | null>(
    null
  );

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

    // Reset post + comments + forms
    setSelectedPost(null);
    setComments([]);
    setCommentsError(null);
    setLoadingComments(false);
    setNewPostTitle("");
    setNewPostContent("");
    setCreatePostError(null);
    setNewCommentContent("");
    setCreateCommentError(null);

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

    // Reset comment form
    setNewCommentContent("");
    setCreateCommentError(null);

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

  // Handle creating a new post under the selected topic
  const handleCreatePost = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTopic) {
      return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setCreatePostError("Title and content cannot be empty.");
      return;
    }

    setCreatingPost(true);
    setCreatePostError(null);

    const body = {
      topicId: selectedTopic.id,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
    };

    console.log("Creating post:", body);

    fetch("http://localhost:8080/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        console.log("Response from POST /posts:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((created: Post) => {
        console.log("Created post:", created);
        // Add new post to list
        setPosts((prev) => [...prev, created]);
        // Clear form
        setNewPostTitle("");
        setNewPostContent("");
        setCreatingPost(false);
      })
      .catch((err: unknown) => {
        console.error("Error while creating post:", err);
        setCreatePostError(
          err instanceof Error ? err.message : "Unknown error creating post"
        );
        setCreatingPost(false);
      });
  };

  // Handle creating a new comment under the selected post
  const handleCreateComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPost) {
      return;
    }
    if (!newCommentContent.trim()) {
      setCreateCommentError("Comment content cannot be empty.");
      return;
    }

    setCreatingComment(true);
    setCreateCommentError(null);

    const body = {
      postId: selectedPost.id,
      content: newCommentContent.trim(),
    };

    console.log("Creating comment:", body);

    fetch("http://localhost:8080/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        console.log(
          "Response from POST /comments:",
          res.status,
          res.statusText
        );
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((created: Comment) => {
        console.log("Created comment:", created);
        // Add new comment to list
        setComments((prev) => [...prev, created]);
        // Clear form
        setNewCommentContent("");
        setCreatingComment(false);
      })
      .catch((err: unknown) => {
        console.error("Error while creating comment:", err);
        setCreateCommentError(
          err instanceof Error ? err.message : "Unknown error creating comment"
        );
        setCreatingComment(false);
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

            <h3>Create a new post</h3>
            <form onSubmit={handleCreatePost} style={{ maxWidth: "400px" }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <label>
                  Title:
                  <br />
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    style={{ width: "100%", padding: "0.25rem" }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <label>
                  Content:
                  <br />
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                    style={{ width: "100%", padding: "0.25rem" }}
                  />
                </label>
              </div>
              {createPostError && (
                <p style={{ color: "red" }}>Error: {createPostError}</p>
              )}
              <button type="submit" disabled={creatingPost}>
                {creatingPost ? "Creating..." : "Create post"}
              </button>
            </form>
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

            <h3>Add a comment</h3>
            <form onSubmit={handleCreateComment} style={{ maxWidth: "400px" }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <textarea
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "0.25rem" }}
                />
              </div>
              {createCommentError && (
                <p style={{ color: "red" }}>Error: {createCommentError}</p>
              )}
              <button type="submit" disabled={creatingComment}>
                {creatingComment ? "Adding..." : "Add comment"}
              </button>
            </form>
          </>
        ) : (
          <p>Select a post to view its comments.</p>
        )}
      </section>
    </div>
  );
}

export default App;