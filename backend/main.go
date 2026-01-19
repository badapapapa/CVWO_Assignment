package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Topic struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		handler(w, r)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "OK")
}

func topicsHandler(w http.ResponseWriter, r *http.Request) {
	topics := []Topic{
		{ID: 1, Title: "General", Description: "General discussion"},
		{ID: 2, Title: "Homework", Description: "Ask about assignments"},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(topics); err != nil {
		http.Error(w, "Failed to encode topics", http.StatusInternalServerError)
	}
}

func main() {
	http.HandleFunc("/health", withCORS(healthHandler))
	http.HandleFunc("/topics", withCORS(topicsHandler))

	fmt.Println("Server listening on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
