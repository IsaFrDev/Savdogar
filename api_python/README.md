# Sayyohlik Agentligi – Minimal Supabase API

A **tiny FastAPI service** that talks directly to Supabase using the public
anonymous key. No Django, no ML pipeline, nothing else – just an API you can
deploy in seconds.

## ✨ Features
- **GET /tours** – list all tours  
- **GET /tours/{id}** – fetch a single tour  
- **POST /tours** – create a new tour (requires appropriate Supabase policy)  
- **DELETE /tours/{id}** – remove a tour  
- **GET /health** – health‑check endpoint (Railway uses it)

## 📦 Prerequisites
- Python 3.11 (Railway provides it by default)  
- A Supabase project (free tier is fine)  
- The **public anon key** and **project URL** from Supabase → Settings → API.

## 🛠️ Local Development

1. **Clone the repo** and `cd` into `api_python`.
2. **Create a virtual environment** and install deps:

   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate   # Windows
   # or source .venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
