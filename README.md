I used GPT-5.2 to improve my wording and clarity and provide ideas. I am responsible for the content and quality of the submitted work.

# CVWO Forum Project
This project is a simple web forum. It allows users to browse topics, view posts and comments and participate in discussions by creating, editing and deleting their own posts and comments. A moderator role is also supported to manage and pin important content

The application is split into a React + TypeScript frontend and a Go backend, with data stored in a SQLite relational database

# Project Structure
CVWO/
  README.md

  backend/
    main.go
    go.mod
    forum.db

  frontend/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    src/
      main.tsx
      App.tsx
      App.css

The frontend is a single-page application that talks to the backend using fetch
The backend exposes JSON endpoints on http://localhost:8080
The database file forum.db is created in the backend/ folder and seeded with some sample data on the first run

# Features
1.  Forum structure
    *   View list of topics
    *   View list of posts under a selected topic
    *   View comments under a selected post
    Topics -> Posts -> Comments

2.  Users and login
    *   Username-based login
        -   Users log in by entering a username
        -   If the username does not exist, it is created
        -   The backend returns the user's id and whether they are a moderator
    *   A special moderator user is seeded
        -   Username: alice
        -   Has moderator permissions like pinning and deleting comments or posts of other users

3.  Creating content
    *   Logged-in users can
        -   Create posts under a selected topic with details such as a title, content and an author
        -   Create comments under a selected post with details such as content and an author
    *   Visitors who are not logged in can still read topics, posts and comments but cannot create, edit or deleting anything

4.  Editing and deleting
    *   Users can
        -   Edit their own posts and comments
        -   Delete their own posts and comments
    *   The moderator (alice) can
        -   Edit and delete any post or comment
    *   When a post is deleted, all commments under the post are also deleted

5.  Pinning posts and comments (moderator only)
    *   Pin/unpin posts
        -   Pinned posts are visually indicated in the UI and are sorted to appear at the top of the posts list for a topic
    *   Pin/unpin comments
        -   Pinned comments are visually indicated in the UI and are sorted to appear at the top of the comments list for a post

6.  Data model (SQLite)
    *   users
        -   id (INTEGER, PK)
        -   username (TEXT, unique, NOT NULL)
        -   is_moderator (INTEGER, 0 or 1, NOT NULL)
    *   topics
	    -   id (INTEGER, PK)
	    -   title (TEXT, NOT NULL)
	    -   description (TEXT)
	    -   created_at (DATETIME)
	*   posts
	    -   id (INTEGER, PK)
	    -   topic_id (INTEGER, FK → topics.id, NOT NULL)
	    -   user_id (INTEGER, FK → users.id, NOT NULL)
	    -   title (TEXT, NOT NULL)
	    -   content (TEXT, NOT NULL)
	    -   is_pinned (INTEGER, 0 or 1, NOT NULL, default 0)
	    -   created_at (DATETIME)
	*   comments
	    -   id (INTEGER, PK)
	    -   post_id (INTEGER, FK → posts.id, NOT NULL)
	    -   user_id (INTEGER, FK → users.id, NOT NULL)
	    -   content (TEXT, NOT NULL)
	    -   is_pinned (INTEGER, 0 or 1, NOT NULL, default 0)
	    -   created_at (DATETIME)
    
    *   Foreign key relationships:
        -   A post belongs to one topic and one user
        -   A comment belongs to one post and one user

# How to Run the Project
1.  Prerequisites
    *   Node.js (frontend)
    *   Go (backend)

2.  Start the backend (Go + SQLite)
    *   From the project root:
        cd backend
        go run main.go
    *   You should see something like:
        Server listening on http://localhost:8080
    *   On first run, this will create forum.db and seed:
        -   Users: alice (moderator) and bob (normal user)
        -   Basic topics, posts and ocmments (some are pinned)
    *   You can quickly check:
        -   http://localhost:8080/health shows OK
        -   http://localhost:8080/topics shows the JSON list of topics

3.  Start the frontend (React + TypeScript)
    *   In the new terminal tab, from the project root:
        cd frontend
        npm install
        npm run dev
    *   You should see a Vite dev server message with a url like:
        http://localhost:5173/
    *   Open that URL in your browser

# Using the Application
1.  Login
    *   At the top of the page, there is a login section
    *   Enter a username and click "Login / Sign up"
    *   If the username is new, it is created
    *   If you log in as alice, you will have moderator permissions

2.  Browse topics and posts
    *   Click a topic in the Topics section to load its posts
    *   Pinned posts (if any) will appear at the top, labelled as "Pinned"
    *   Click a post title to view its comments

3.  Create posts
    *   While a topic is selected, fill in the "Create a new post" form
    *   Click "Create post" to add it under that topic
    *   The post will appear in the list with your name as the author

4.  Create comments
    *   With a post selected, scroll to the "Add a comment" section
    *   Enter your comment and click "Add comment"
    *   The comment will appear in the list, linked to your user

5.  Edit and delete
    *   For posts and comments that you own, you will see edit and delete buttons
    *   If logged in as alice (moderator), you can edit or delete any post or comment

6.  Pin/unpin (moderator only)
    *   If you are logged in as a moderator
        -   Each post has a "Pin / Unpin" button
        -   Each comment has a "Pin / Unpin" button
    *   Pinned items
        -   Are labelled as "Pinned" in the UI
        -   Are sorted to appear at the top of the list
    


        