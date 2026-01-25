import { useEffect, useState, FormEvent } from "react";
import "./App.css";

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
  isPinned: boolean;
};

type Comment = {
  id: number;
  postId: number;
  content: string;
  author: string;
  isPinned: boolean;
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
    fetch("http://localhost:8080/topics")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data: Topic[]) => {
        setTopics(data);
        setLoadingTopics(false);
      })
      .catch((err: unknown) => {
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
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((user: User) => {
        setCurrentUser(user);
        setLoggingIn(false);
      })
      .catch((err: unknown) => {
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

  const isModerator = currentUser?.isModerator === true;

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

    fetch(`http://localhost:8080/posts?topicId=${topic.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data: Post[]) => {
        setPosts(data);
        setLoadingPosts(false);
      })
      .catch((err: unknown) => {
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

    fetch(`http://localhost:8080/comments?postId=${post.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data: Comment[]) => {
        setComments(data);
        setLoadingComments(false);
      })
      .catch((err: unknown) => {
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

    fetch("http://localhost:8080/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((created: Post) => {
        setPosts((prev) => [...prev, created]);
        setNewPostTitle("");
        setNewPostContent("");
        setCreatingPost(false);
      })
      .catch((err: unknown) => {
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
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((updated: Post) => {
        setPosts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        setSelectedPost((prev) => (prev && prev.id === updated.id ? updated : prev));
        cancelEditPost();
      })
      .catch((err: unknown) => {
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
        if (!res.ok && res.status !== 204) {
          throw new Error(`HTTP error ${res.status}`);
        }
        setPosts((prev) => prev.filter((post) => post.id !== p.id));
        setSelectedPost((prev) => (prev && prev.id === p.id ? null : prev));
        if (selectedPost && selectedPost.id === p.id) {
          setComments([]);
        }
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Unknown error deleting post";
        alert(`Error deleting post: ${msg}`);
      });
  };

  // Handle pin/unpin post (moderator only)
  const handleTogglePinPost = (p: Post) => {
    if (!currentUser || !isModerator) return;

    const body = {
      id: p.id,
      userId: currentUser.id,
      pinned: !p.isPinned,
    };

    fetch("http://localhost:8080/posts/pin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((updated: Post) => {
        setPosts((prev) => {
          const next = prev.map((post) =>
            post.id === updated.id ? updated : post
          );
          // Ensure pinned first visually
          return next.slice().sort((a, b) => {
            if (a.isPinned === b.isPinned) return a.id - b.id;
            return a.isPinned ? -1 : 1;
          });
        });
        setSelectedPost((prev) => (prev && prev.id === updated.id ? updated : prev));
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Unknown error pinning post";
        alert(`Error pinning post: ${msg}`);
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

    fetch("http://localhost:8080/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((created: Comment) => {
        setComments((prev) => [...prev, created]);
        setNewCommentContent("");
        setCreatingComment(false);
      })
      .catch((err: unknown) => {
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
        if (!res.ok && res.status !== 204) {
          throw new Error(`HTTP error ${res.status}`);
        }
        setComments((prev) => prev.filter((comment) => comment.id !== c.id));
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Unknown error deleting comment";
        alert(`Error deleting comment: ${msg}`);
      });
  };

  // Handle pin/unpin comment (moderator only)
  const handleTogglePinComment = (c: Comment) => {
    if (!currentUser || !isModerator) return;

    const body = {
      id: c.id,
      userId: currentUser.id,
      pinned: !c.isPinned,
    };

    fetch("http://localhost:8080/comments/pin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((updated: Comment) => {
        setComments((prev) => {
          const next = prev.map((comment) =>
            comment.id === updated.id ? updated : comment
          );
          return next.slice().sort((a, b) => {
            if (a.isPinned === b.isPinned) return a.id - b.id;
            return a.isPinned ? -1 : 1;
          });
        });
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : "Unknown error pinning comment";
        alert(`Error pinning comment: ${msg}`);
      });
  };

  return (
    <div className="app">
      <div className="app-shell">
        <header className="app-header">
          <div className="app-title">
            <h1>CVWO Forum</h1>
            <span>Simple discussion board with users and moderation</span>
          </div>

          <section className="login-panel">
            <h2 style={{ margin: 0, fontSize: "0.95rem" }}>Login</h2>
            {currentUser ? (
              <>
                <p
                  className="helper-text"
                  style={{ marginBottom: "0.25rem" }}
                >
                  Logged in as{" "}
                  <strong>
                    {currentUser.username}
                    {currentUser.isModerator ? " (moderator)" : ""}
                  </strong>
                </p>
                <button className="btn" type="button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <form onSubmit={handleLogin}>
                  <input
                    type="text"
                    value={loginName}
                    placeholder="Enter username"
                    onChange={(e) => setLoginName(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loggingIn}
                  >
                    {loggingIn ? "Logging in..." : "Login / Sign up"}
                  </button>
                </form>
                {loginError && (
                  <p className="error-text">Error: {loginError}</p>
                )}
              </>
            )}
          </section>
        </header>

        <main className="app-main">
          {/* Topics panel */}
          <section className="card">
            <h2>Topics</h2>
            <p className="card-subtitle">
              Choose a topic to see posts and join the discussion.
            </p>

            {loadingTopics && <p>Loading topics...</p>}
            {topicsError && (
              <p className="error-text">Error: {topicsError}</p>
            )}

            {!loadingTopics && !topicsError && (
              <ul className="topics-list">
                {topics.map((t) => (
                  <li
                    key={t.id}
                    className="topic-item"
                    onClick={() => handleTopicClick(t)}
                  >
                    <div className="topic-item-title">{t.title}</div>
                    <div className="topic-item-description">
                      {t.description}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Posts + Comments panel */}
          <section className="post-comment-layout">
            {/* Posts card */}
            <div className="card">
              {selectedTopic ? (
                <>
                  <h2>Posts under: {selectedTopic.title}</h2>
                  <p className="card-subtitle">
                    Click a post title to view and reply with comments.
                  </p>

                  {loadingPosts && <p>Loading posts...</p>}
                  {postsError && (
                    <p className="error-text">Error: {postsError}</p>
                  )}

                  {!loadingPosts && !postsError && posts.length === 0 && (
                    <p className="helper-text">
                      No posts for this topic yet. Be the first to start one!
                    </p>
                  )}

                  {!loadingPosts && !postsError && posts.length > 0 && (
                    <ul className="posts-list">
                      {posts.map((p) => (
                        <li key={p.id} className="post-item">
                          {editingPostId === p.id ? (
                            <form onSubmit={handleSavePost}>
                              <div className="form-field">
                                <label>
                                  Title
                                  <input
                                    className="form-input"
                                    type="text"
                                    value={editPostTitle}
                                    onChange={(e) =>
                                      setEditPostTitle(e.target.value)
                                    }
                                  />
                                </label>
                              </div>
                              <div className="form-field">
                                <label>
                                  Content
                                  <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={editPostContent}
                                    onChange={(e) =>
                                      setEditPostContent(e.target.value)
                                    }
                                  />
                                </label>
                              </div>
                              {editPostError && (
                                <p className="error-text">
                                  Error: {editPostError}
                                </p>
                              )}
                              <div className="actions">
                                <button
                                  className="btn btn-primary"
                                  type="submit"
                                  disabled={savingPost}
                                >
                                  {savingPost ? "Saving..." : "Save"}
                                </button>
                                <button
                                  className="btn"
                                  type="button"
                                  onClick={cancelEditPost}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="post-header">
                                <button
                                  className="post-title-button"
                                  type="button"
                                  onClick={() => handlePostClick(p)}
                                >
                                  {p.title}
                                </button>
                                <div style={{ display: "flex", gap: "0.3rem" }}>
                                  <span className="chip">Post</span>
                                  {p.isPinned && (
                                    <span className="chip">Pinned</span>
                                  )}
                                </div>
                              </div>
                              <div className="post-body">{p.content}</div>
                              <div className="post-meta">by {p.author}</div>
                              <div className="actions">
                                {canModifyPost(p) && (
                                  <>
                                    <button
                                      className="btn"
                                      type="button"
                                      onClick={() => startEditPost(p)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      type="button"
                                      onClick={() => handleDeletePost(p)}
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                                {isModerator && (
                                  <button
                                    className="btn"
                                    type="button"
                                    onClick={() => handleTogglePinPost(p)}
                                  >
                                    {p.isPinned ? "Unpin" : "Pin"}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="form-section">
                    <h3 style={{ margin: "0 0 0.5rem" }}>
                      Create a new post
                    </h3>
                    <form onSubmit={handleCreatePost}>
                      <div className="form-field">
                        <label>
                          Title
                          <input
                            className="form-input"
                            type="text"
                            value={newPostTitle}
                            onChange={(e) =>
                              setNewPostTitle(e.target.value)
                            }
                          />
                        </label>
                      </div>
                      <div className="form-field">
                        <label>
                          Content
                          <textarea
                            className="form-textarea"
                            rows={4}
                            value={newPostContent}
                            onChange={(e) =>
                              setNewPostContent(e.target.value)
                            }
                          />
                        </label>
                      </div>
                      {createPostError && (
                        <p className="error-text">
                          Error: {createPostError}
                        </p>
                      )}
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={creatingPost}
                      >
                        {creatingPost ? "Creating..." : "Create post"}
                      </button>
                    </form>
                    {!currentUser && (
                      <p className="helper-text">
                        You must be logged in to create a post.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2>Posts</h2>
                  <p className="helper-text">
                    Select a topic on the left to see its posts.
                  </p>
                </>
              )}
            </div>

            {/* Comments card */}
            <div className="card">
              {selectedPost ? (
                <>
                  <h2>Comments for: {selectedPost.title}</h2>
                  <p className="card-subtitle">
                    Reply to this post or edit your own comments.
                  </p>

                  {loadingComments && <p>Loading comments...</p>}
                  {commentsError && (
                    <p className="error-text">Error: {commentsError}</p>
                  )}

                  {!loadingComments &&
                    !commentsError &&
                    comments.length === 0 && (
                      <p className="helper-text">
                        No comments yet. Start the conversation!
                      </p>
                    )}

                  {!loadingComments &&
                    !commentsError &&
                    comments.length > 0 && (
                      <ul className="comments-list">
                        {comments.map((c) => (
                          <li key={c.id} className="comment-item">
                            {editingCommentId === c.id ? (
                              <form onSubmit={handleSaveComment}>
                                <div className="form-field">
                                  <label>
                                    Comment
                                    <textarea
                                      className="form-textarea"
                                      rows={2}
                                      value={editCommentContent}
                                      onChange={(e) =>
                                        setEditCommentContent(e.target.value)
                                      }
                                    />
                                  </label>
                                </div>
                                {editCommentError && (
                                  <p className="error-text">
                                    Error: {editCommentError}
                                  </p>
                                )}
                                <div className="actions">
                                  <button
                                    className="btn btn-primary"
                                    type="submit"
                                    disabled={savingComment}
                                  >
                                    {savingComment ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    className="btn"
                                    type="button"
                                    onClick={cancelEditComment}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="comment-body">
                                  {c.content}
                                </div>
                                <div className="comment-meta">
                                  by {c.author}{" "}
                                  {c.isPinned && (
                                    <span className="chip">Pinned</span>
                                  )}
                                </div>
                                <div className="actions">
                                  {canModifyComment(c) && (
                                    <>
                                      <button
                                        className="btn"
                                        type="button"
                                        onClick={() => startEditComment(c)}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="btn btn-danger"
                                        type="button"
                                        onClick={() =>
                                          handleDeleteComment(c)
                                        }
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                  {isModerator && (
                                    <button
                                      className="btn"
                                      type="button"
                                      onClick={() =>
                                        handleTogglePinComment(c)
                                      }
                                    >
                                      {c.isPinned ? "Unpin" : "Pin"}
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                  <div className="form-section">
                    <h3 style={{ margin: "0 0 0.5rem" }}>Add a comment</h3>
                    <form onSubmit={handleCreateComment}>
                      <div className="form-field">
                        <textarea
                          className="form-textarea"
                          rows={3}
                          value={newCommentContent}
                          onChange={(e) =>
                            setNewCommentContent(e.target.value)
                          }
                        />
                      </div>
                      {createCommentError && (
                        <p className="error-text">
                          Error: {createCommentError}
                        </p>
                      )}
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={creatingComment}
                      >
                        {creatingComment ? "Adding..." : "Add comment"}
                      </button>
                    </form>
                    {!currentUser && (
                      <p className="helper-text">
                        You must be logged in to add a comment.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2>Comments</h2>
                  <p className="helper-text">
                    Select a post above to view and add comments.
                  </p>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;