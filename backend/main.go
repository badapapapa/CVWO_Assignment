package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

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
	Author  string `json:"author"` // username of author
}

// Comment represents a comment under a post.
type Comment struct {
	ID      int    `json:"id"`
	PostID  int    `json:"postId"`
	Content string `json:"content"`
	Author  string `json:"author"` // username of author
}

// User represents a forum user.
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
}

// CreatePostRequest represents the JSON body for creating a post.
type CreatePostRequest struct {
	TopicID int    `json:"topicId"`
	UserID  int    `json:"userId"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

// CreateCommentRequest represents the JSON body for creating a comment.
type CreateCommentRequest struct {
	PostID  int    `json:"postId"`
	UserID  int    `json:"userId"`
	Content string `json:"content"`
}

// LoginRequest represents the JSON body for login.
type LoginRequest struct {
	Username string `json:"username"`
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

	// Create users table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE
		);
	`)
	if err != nil {
		return err
	}

	// Create topics table
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

	// Create posts table with user_id
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			topic_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (topic_id) REFERENCES topics(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);
	`)
	if err != nil {
		return err
	}

	// Create comments table with user_id
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			post_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (post_id) REFERENCES posts(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);
	`)
	if err != nil {
		return err
	}

	// Seed users if empty
	var userCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount); err != nil {
		return err
	}
	if userCount == 0 {
		_, err = db.Exec(`
			INSERT INTO users (username) VALUES
				("alice"),
				("bob");
		`)
		if err != nil {
			return err
		}
	}

	// Seed topics if empty
	var topicCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM topics").Scan(&topicCount); err != nil {
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
	if err := db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&postCount); err != nil {
		return err
	}
	if postCount == 0 {
		_, err = db.Exec(`
			INSERT INTO posts (topic_id, user_id, title, content) VALUES
				(1, 1, "Welcome to the forum", "Introduce yourself and say hi!"),
				(1, 2, "General chat", "Talk about anything not related to homework."),
				(2, 1, "Math homework question", "I am stuck on question 3 of the worksheet."),
				(2, 2, "Project deadline reminder", "Don’t forget the assignment is due next week.");
		`)
		if err != nil {
			return err
		}
	}

	// Seed comments if empty
	var commentCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM comments").Scan(&commentCount); err != nil {
		return err
	}
	if commentCount == 0 {
		_, err = db.Exec(`
			INSERT INTO comments (post_id, user_id, content) VALUES
				(1, 1, "Hello everyone!"),
				(1, 2, "Nice to meet you all."),
				(2, 2, "I love random chats."),
				(3, 1, "Same, I’m also stuck on that question."),
				(4, 2, "Thanks for the reminder!");
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

// loginHandler handles POST /login
// It takes { "username": "alice" }, trims it, creates user if needed, and returns { id, username }.
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" {
		http.Error(w, "Username cannot be empty", http.StatusBadRequest)
		return
	}

	// Try to find existing user
	var user User
	err := db.QueryRow("SELECT id, username FROM users WHERE username = ?", username).
		Scan(&user.ID, &user.Username)
	if err == sql.ErrNoRows {
		// Create new user
		result, err := db.Exec("INSERT INTO users (username) VALUES (?)", username)
		if err != nil {
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
		newID, err := result.LastInsertId()
		if err != nil {
			http.Error(w, "Failed to get new user ID", http.StatusInternalServerError)
			return
		}
		user.ID = int(newID)
		user.Username = username
	} else if err != nil {
		http.Error(w, "Failed to query user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(user); err != nil {
		http.Error(w, "Failed to encode user", http.StatusInternalServerError)
	}
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

	rows, err := db.Query(`
		SELECT posts.id, posts.topic_id, posts.title, posts.content, users.username
		FROM posts
		JOIN users ON posts.user_id = users.id
		WHERE posts.topic_id = ?
		ORDER BY posts.id
	`, topicID)
	if err != nil {
		http.Error(w, "Failed to query posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.TopicID, &p.Title, &p.Content, &p.Author); err != nil {
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
	if req.TopicID == 0 || req.UserID == 0 || req.Title == "" || req.Content == "" {
		http.Error(w, "Missing topicId, userId, title, or content", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		"INSERT INTO posts (topic_id, user_id, title, content) VALUES (?, ?, ?, ?)",
		req.TopicID, req.UserID, req.Title, req.Content,
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

	var author string
	if err := db.QueryRow("SELECT username FROM users WHERE id = ?", req.UserID).Scan(&author); err != nil {
		http.Error(w, "Failed to get author username", http.StatusInternalServerError)
		return
	}

	created := Post{
		ID:      int(newID),
		TopicID: req.TopicID,
		Title:   req.Title,
		Content: req.Content,
		Author:  author,
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

	rows, err := db.Query(`
		SELECT comments.id, comments.post_id, comments.content, users.username
		FROM comments
		JOIN users ON comments.user_id = users.id
		WHERE comments.post_id = ?
		ORDER BY comments.id
	`, postID)
	if err != nil {
		http.Error(w, "Failed to query comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var cmt Comment
		if err := rows.Scan(&cmt.ID, &cmt.PostID, &cmt.Content, &cmt.Author); err != nil {
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
	if req.PostID == 0 || req.UserID == 0 || req.Content == "" {
		http.Error(w, "Missing postId, userId, or content", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		"INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
		req.PostID, req.UserID, req.Content,
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

	var author string
	if err := db.QueryRow("SELECT username FROM users WHERE id = ?", req.UserID).Scan(&author); err != nil {
		http.Error(w, "Failed to get author username", http.StatusInternalServerError)
		return
	}

	created := Comment{
		ID:      int(newID),
		PostID:  req.PostID,
		Content: req.Content,
		Author:  author,
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
	http.HandleFunc("/login", withCORS(loginHandler))
	http.HandleFunc("/topics", withCORS(topicsHandler))
	http.HandleFunc("/posts", withCORS(postsHandler))
	http.HandleFunc("/comments", withCORS(commentsHandler))

	fmt.Println("Server listening on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
