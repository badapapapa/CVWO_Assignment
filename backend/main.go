package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	_ "github.com/mattn/go-sqlite3"
)

// Topic represents a discussion topic in the forum.
type Topic struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// Post represents a discussion post under a topic.
type Post struct {
	ID      int    `json:"id"`
	TopicID int    `json:"topicId"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

// CreatePostRequest represents the JSON body for creating a post.
type CreatePostRequest struct {
	TopicID int    `json:"topicId"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

// Comment represents a comment under a post.
type Comment struct {
	ID      int    `json:"id"`
	PostID  int    `json:"postId"`
	Content string `json:"content"`
}

// CreateCommentRequest represents the JSON body for creating a comment.
type CreateCommentRequest struct {
	PostID  int    `json:"postId"`
	Content string `json:"content"`
}

// Global DB handle
var db *sql.DB

// withCORS is a small wrapper that adds CORS headers to responses.
func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Allow all origins for local dev
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight OPTIONS requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Normal request
		handler(w, r)
	}
}

// initDB opens the SQLite database, creates tables if needed,
// and inserts some default data if tables are empty.
func initDB() error {
	var err error
	db, err = sql.Open("sqlite3", "./forum.db")
	if err != nil {
		return err
	}

	// Create topics table if it doesn't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS topics (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return err
	}

	// Create posts table if it doesn't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			topic_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (topic_id) REFERENCES topics(id)
		);
	`)
	if err != nil {
		return err
	}

	// Create comments table if it doesn't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			post_id INTEGER NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (post_id) REFERENCES posts(id)
		);
	`)
	if err != nil {
		return err
	}

	// Seed topics if empty
	var topicCount int
	err = db.QueryRow("SELECT COUNT(*) FROM topics").Scan(&topicCount)
	if err != nil {
		return err
	}

	if topicCount == 0 {
		_, err = db.Exec(`
			INSERT INTO topics (title, description) VALUES
				("General", "General discussion"),
				("Homework", "Ask about assignments");
		`)
		if err != nil {
			return err
		}
	}

	// Seed posts if empty
	var postCount int
	err = db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&postCount)
	if err != nil {
		return err
	}

	if postCount == 0 {
		_, err = db.Exec(`
			INSERT INTO posts (topic_id, title, content) VALUES
				(1, "Welcome to the forum", "Introduce yourself and say hi!"),
				(1, "General chat", "Talk about anything not related to homework."),
				(2, "Math homework question", "I am stuck on question 3 of the worksheet."),
				(2, "Project deadline reminder", "Don’t forget the assignment is due next week.");
		`)
		if err != nil {
			return err
		}
	}

	// Seed comments if empty
	var commentCount int
	err = db.QueryRow("SELECT COUNT(*) FROM comments").Scan(&commentCount)
	if err != nil {
		return err
	}

	if commentCount == 0 {
		_, err = db.Exec(`
			INSERT INTO comments (post_id, content) VALUES
				(1, "Hello everyone!"),
				(1, "Nice to meet you all."),
				(2, "I love random chats."),
				(3, "Same, I’m also stuck on that question."),
				(4, "Thanks for the reminder!");
		`)
		if err != nil {
			return err
		}
	}

	return nil
}

// healthHandler handles GET /health and just returns "OK".
func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "OK")
}

// topicsHandler handles GET /topics and returns a list of topics from the DB.
func topicsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, title, description FROM topics ORDER BY id")
	if err != nil {
		http.Error(w, "Failed to query topics", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var topics []Topic
	for rows.Next() {
		var t Topic
		if err := rows.Scan(&t.ID, &t.Title, &t.Description); err != nil {
			http.Error(w, "Failed to scan topic", http.StatusInternalServerError)
			return
		}
		topics = append(topics, t)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(topics); err != nil {
		http.Error(w, "Failed to encode topics", http.StatusInternalServerError)
	}
}

// postsHandler handles GET /posts?topicId=1 and returns posts for that topic.
// postsHandler handles:
//   - GET /posts?topicId=1    → list posts for a topic
//   - POST /posts             → create a new post
func postsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		handleListPosts(w, r)
	case http.MethodPost:
		handleCreatePost(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleListPosts handles GET /posts?topicId=1
func handleListPosts(w http.ResponseWriter, r *http.Request) {
	// Read topicId from query string
	topicIDStr := r.URL.Query().Get("topicId")
	if topicIDStr == "" {
		http.Error(w, "Missing topicId parameter", http.StatusBadRequest)
		return
	}

	topicID, err := strconv.Atoi(topicIDStr)
	if err != nil {
		http.Error(w, "Invalid topicId parameter", http.StatusBadRequest)
		return
	}

	rows, err := db.Query("SELECT id, topic_id, title, content FROM posts WHERE topic_id = ? ORDER BY id", topicID)
	if err != nil {
		http.Error(w, "Failed to query posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.TopicID, &p.Title, &p.Content); err != nil {
			http.Error(w, "Failed to scan post", http.StatusInternalServerError)
			return
		}
		posts = append(posts, p)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, "Failed to encode posts", http.StatusInternalServerError)
	}
}

// handleCreatePost handles POST /posts
func handleCreatePost(w http.ResponseWriter, r *http.Request) {
	var req CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}
	if req.TopicID == 0 || req.Title == "" || req.Content == "" {
		http.Error(w, "Missing topicId, title, or content", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		"INSERT INTO posts (topic_id, title, content) VALUES (?, ?, ?)",
		req.TopicID, req.Title, req.Content,
	)
	if err != nil {
		http.Error(w, "Failed to insert post", http.StatusInternalServerError)
		return
	}

	newID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to get new post ID", http.StatusInternalServerError)
		return
	}

	created := Post{
		ID:      int(newID),
		TopicID: req.TopicID,
		Title:   req.Title,
		Content: req.Content,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(created); err != nil {
		http.Error(w, "Failed to encode created post", http.StatusInternalServerError)
	}
}

// commentsHandler handles:
//   - GET /comments?postId=1    → list comments for a post
//   - POST /comments            → create a new comment
func commentsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		handleListComments(w, r)
	case http.MethodPost:
		handleCreateComment(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleListComments handles GET /comments?postId=1
func handleListComments(w http.ResponseWriter, r *http.Request) {
	// Read postId from query string
	postIDStr := r.URL.Query().Get("postId")
	if postIDStr == "" {
		http.Error(w, "Missing postId parameter", http.StatusBadRequest)
		return
	}

	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid postId parameter", http.StatusBadRequest)
		return
	}

	rows, err := db.Query("SELECT id, post_id, content FROM comments WHERE post_id = ? ORDER BY id", postID)
	if err != nil {
		http.Error(w, "Failed to query comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var cmt Comment
		if err := rows.Scan(&cmt.ID, &cmt.PostID, &cmt.Content); err != nil {
			http.Error(w, "Failed to scan comment", http.StatusInternalServerError)
			return
		}
		comments = append(comments, cmt)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(comments); err != nil {
		http.Error(w, "Failed to encode comments", http.StatusInternalServerError)
	}
}

// handleCreateComment handles POST /comments
func handleCreateComment(w http.ResponseWriter, r *http.Request) {
	var req CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}
	if req.PostID == 0 || req.Content == "" {
		http.Error(w, "Missing postId or content", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		"INSERT INTO comments (post_id, content) VALUES (?, ?)",
		req.PostID, req.Content,
	)
	if err != nil {
		http.Error(w, "Failed to insert comment", http.StatusInternalServerError)
		return
	}

	newID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to get new comment ID", http.StatusInternalServerError)
		return
	}

	created := Comment{
		ID:      int(newID),
		PostID:  req.PostID,
		Content: req.Content,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(created); err != nil {
		http.Error(w, "Failed to encode created comment", http.StatusInternalServerError)
	}
}

func main() {
	// Initialise database
	if err := initDB(); err != nil {
		log.Fatal("Failed to initialise database:", err)
	}
	defer db.Close()

	// Register routes with CORS wrapper
	http.HandleFunc("/health", withCORS(healthHandler))
	http.HandleFunc("/topics", withCORS(topicsHandler))
	http.HandleFunc("/posts", withCORS(postsHandler))
	http.HandleFunc("/comments", withCORS(commentsHandler))

	fmt.Println("Server listening on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
