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
  author: string;
};

type Comment = {
  id: number;
  postId: number;
  content: string;
  author: string;
};

type User = {
  id: number;
  username: string;
  isModerator: boolean;
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

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostError, setEditPostError] = useState<string | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [editCommentError, setEditCommentError] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);

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

  // Login handler
  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = loginName.trim();
    if (!trimmed) {
      setLoginError("Username cannot be empty.");
      return;
    }

    setLoggingIn(true);
    setLoginError(null);

    fetch("http://localhost:8080/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: trimmed }),
    })
      .then((res) => {
        console.log("Response from /login:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((user: User) => {
        console.log("Logged in as:", user);
        setCurrentUser(user);
        setLoggingIn(false);
      })
      .catch((err: unknown) => {
        console.error("Error while logging in:", err);
        setLoginError(
          err instanceof Error ? err.message : "Unknown error during login"
        );
        setLoggingIn(false);
      });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const canModifyPost = (p: Post) => {
    if (!currentUser) return false;
    return (
      currentUser.username === p.author || currentUser.isModerator === true
    );
  };

  const canModifyComment = (c: Comment) => {
    if (!currentUser) return false;
    return (
      currentUser.username === c.author || currentUser.isModerator === true
    );
  };

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
    setEditingPostId(null);
    setEditingCommentId(null);

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
    setEditingCommentId(null);

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
    if (!selectedTopic) return;
    if (!currentUser) {
      setCreatePostError("You must be logged in to create a post.");
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
      userId: currentUser.id,
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
        setPosts((prev) => [...prev, created]);
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

  // Handle starting edit for a post
  const startEditPost = (p: Post) => {
    setEditingPostId(p.id);
    setEditPostTitle(p.title);
    setEditPostContent(p.content);
    setEditPostError(null);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditPostTitle("");
    setEditPostContent("");
    setEditPostError(null);
    setSavingPost(false);
  };

  // Handle saving edited post
  const handleSavePost = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || editingPostId === null) return;
    if (!editPostTitle.trim() || !editPostContent.trim()) {
      setEditPostError("Title and content cannot be empty.");
      return;
    }

    setSavingPost(true);
    setEditPostError(null);

    const body = {
      id: editingPostId,
      userId: currentUser.id,
      title: editPostTitle.trim(),
      content: editPostContent.trim(),
    };

    fetch("http://localhost:8080/posts", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        console.log("Response from PUT /posts:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((updated: Post) => {
        setPosts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        // If currently selectedPost is this one, update it too
        setSelectedPost((prev) => (prev && prev.id === updated.id ? updated : prev));
        cancelEditPost();
      })
      .catch((err: unknown) => {
        console.error("Error while updating post:", err);
        setEditPostError(
          err instanceof Error ? err.message : "Unknown error updating post"
        );
        setSavingPost(false);
      });
  };

  // Handle deleting a post
  const handleDeletePost = (p: Post) => {
    if (!currentUser) return;
    const ok = window.confirm("Delete this post and all its comments?");
    if (!ok) return;

    const body = {
      id: p.id,
      userId: currentUser.id,
    };

    fetch("http://localhost:8080/posts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        console.log("Response from DELETE /posts:", res.status, res.statusText);
        if (!res.ok && res.status !== 204) {
          throw new Error(`HTTP error ${res.status}`);
        }
        // Remove post from list
        setPosts((prev) => prev.filter((post) => post.id !== p.id));
        // If it was selected, clear it and comments
        setSelectedPost((prev) => (prev && prev.id === p.id ? null : prev));
        if (selectedPost && selectedPost.id === p.id) {
          setComments([]);
        }
      })
      .catch((err: unknown) => {
        console.error("Error while deleting post:", err);
        alert(
          err instanceof Error
            ? `Error deleting post: ${err.message}`
            : "Error deleting post"
        );
      });
  };

  // Handle creating a new comment under the selected post
  const handleCreateComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (!currentUser) {
      setCreateCommentError("You must be logged in to comment.");
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
      userId: currentUser.id,
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
        setComments((prev) => [...prev, created]);
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

  // Handle starting edit for a comment
  const startEditComment = (c: Comment) => {
    setEditingCommentId(c.id);
    setEditCommentContent(c.content);
    setEditCommentError(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
    setEditCommentError(null);
    setSavingComment(false);
  };

  // Handle saving edited comment
  const handleSaveComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || editingCommentId === null) return;
    if (!editCommentContent.trim()) {
      setEditCommentError("Comment content cannot be empty.");
      return;
    }

    setSavingComment(true);
    setEditCommentError(null);

    const body = {
      id: editingCommentId,
      userId: currentUser.id,
      content: editCommentContent.trim(),
    };

    fetch("http://localhost:8080/comments", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        console.log(
          "Response from PUT /comments:",
          res.status,
          res.statusText
        );
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((updated: Comment) => {
        setComments((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        cancelEditComment();
      })
      .catch((err: unknown) => {
        console.error("Error while updating comment:", err);
        setEditCommentError(
          err instanceof Error
            ? err.message
            : "Unknown error updating comment"
        );
        setSavingComment(false);
      });
  };

  // Handle deleting a comment
  const handleDeleteComment = (c: Comment) => {
    if (!currentUser) return;
    const ok = window.confirm("Delete this comment?");
    if (!ok) return;

    const body = {
      id: c.id,
      userId: currentUser.id,
    };

    fetch("http://localhost:8080/comments", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        console.log(
          "Response from DELETE /comments:",
          res.status,
          res.statusText
        );
        if (!res.ok && res.status !== 204) {
          throw new Error(`HTTP error ${res.status}`);
        }
        setComments((prev) => prev.filter((comment) => comment.id !== c.id));
      })
      .catch((err: unknown) => {
        console.error("Error while deleting comment:", err);
        alert(
          err instanceof Error
            ? `Error deleting comment: ${err.message}`
            : "Error deleting comment"
        );
      });
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Forum</h1>

      {/* Login section */}
      <section
        style={{
          marginBottom: "1rem",
          padding: "0.75rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
          maxWidth: "400px",
        }}
      >
        <h2>Login</h2>
        {currentUser ? (
          <>
            <p>
              Logged in as{" "}
              <strong>
                {currentUser.username}
                {currentUser.isModerator ? " (moderator)" : ""}
              </strong>
            </p>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "0.5rem" }}>
              <label>
                Username:{" "}
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                />
              </label>
            </div>
            {loginError && <p style={{ color: "red" }}>Error: {loginError}</p>}
            <button type="submit" disabled={loggingIn}>
              {loggingIn ? "Logging in..." : "Login / Sign up"}
            </button>
            <p style={{ fontSize: "0.8rem", color: "#555", marginTop: "0.25rem" }}>
              Tip: log in as <code>alice</code> to use moderator powers.
            </p>
          </form>
        )}
      </section>

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
                  <li key={p.id} style={{ marginBottom: "0.75rem" }}>
                    {editingPostId === p.id ? (
                      <form onSubmit={handleSavePost}>
                        <div style={{ marginBottom: "0.25rem" }}>
                          <input
                            type="text"
                            value={editPostTitle}
                            onChange={(e) => setEditPostTitle(e.target.value)}
                            style={{ width: "100%", padding: "0.25rem" }}
                          />
                        </div>
                        <div style={{ marginBottom: "0.25rem" }}>
                          <textarea
                            value={editPostContent}
                            onChange={(e) =>
                              setEditPostContent(e.target.value)
                            }
                            rows={3}
                            style={{ width: "100%", padding: "0.25rem" }}
                          />
                        </div>
                        {editPostError && (
                          <p style={{ color: "red" }}>Error: {editPostError}</p>
                        )}
                        <button type="submit" disabled={savingPost}>
                          {savingPost ? "Saving..." : "Save"}
                        </button>{" "}
                        <button type="button" onClick={cancelEditPost}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
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
                        <p style={{ fontSize: "0.85rem", color: "#555" }}>
                          by {p.author}
                        </p>
                        {canModifyPost(p) && (
                          <div style={{ fontSize: "0.85rem" }}>
                            <button
                              type="button"
                              onClick={() => startEditPost(p)}
                              style={{ marginRight: "0.5rem" }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePost(p)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
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
                  <li key={c.id} style={{ marginBottom: "0.5rem" }}>
                    {editingCommentId === c.id ? (
                      <form onSubmit={handleSaveComment}>
                        <div style={{ marginBottom: "0.25rem" }}>
                          <textarea
                            value={editCommentContent}
                            onChange={(e) =>
                              setEditCommentContent(e.target.value)
                            }
                            rows={2}
                            style={{ width: "100%", padding: "0.25rem" }}
                          />
                        </div>
                        {editCommentError && (
                          <p style={{ color: "red" }}>
                            Error: {editCommentError}
                          </p>
                        )}
                        <button type="submit" disabled={savingComment}>
                          {savingComment ? "Saving..." : "Save"}
                        </button>{" "}
                        <button type="button" onClick={cancelEditComment}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <div>{c.content}</div>
                        <div style={{ fontSize: "0.85rem", color: "#555" }}>
                          by {c.author}
                        </div>
                        {canModifyComment(c) && (
                          <div style={{ fontSize: "0.85rem" }}>
                            <button
                              type="button"
                              onClick={() => startEditComment(c)}
                              style={{ marginRight: "0.5rem" }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
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