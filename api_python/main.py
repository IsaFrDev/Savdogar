import os
from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Any
from dotenv import load_dotenv

# -------------------------------------------------
# Load environment variables (development only)
# -------------------------------------------------
load_dotenv()  # reads .env if present; Railway injects env vars automatically

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError(
        "Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY."
    )

# -------------------------------------------------
# Initialise Supabase client (single instance, reused)
# -------------------------------------------------
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# -------------------------------------------------
# FastAPI app
# -------------------------------------------------
app = FastAPI(
    title="Sayyohlik Agentligi API",
    description="Simple CRUD API backed by Supabase (public anon key).",
    version="0.1.0",
)


# -------------------------------------------------
# Pydantic models – adapt them to your Supabase tables
# -------------------------------------------------
class Tour(BaseModel):
    id: str
    name: str
    description: str | None = None
    price: float
    available: bool = True


# -------------------------------------------------
# Helper – generic table operations
# -------------------------------------------------
def get_table(table_name: str):
    """Return a Supabase table proxy. Raises 404 if table does not exist."""
    if table_name not in supabase.tables():
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    return supabase.table(table_name)


# -------------------------------------------------
# Example endpoints (you can add more)
# -------------------------------------------------
@app.get("/tours", response_model=List[Tour])
def list_tours():
    """Return all tours (public data)."""
    res = supabase.table("tours").select("*").execute()
    if res.error:
        raise HTTPException(status_code=500, detail=res.error.message)
    return [Tour(**row) for row in res.data]


@app.get("/tours/{tour_id}", response_model=Tour)
def get_tour(tour_id: str):
    """Fetch a single tour by its primary‑key."""
    res = supabase.table("tours").select("*").eq("id", tour_id).single().execute()
    if res.error:
        raise HTTPException(status_code=404, detail="Tour not found")
    return Tour(**res.data)


@app.post("/tours", response_model=Tour, status_code=201)
def create_tour(tour: Tour):
    """Create a new tour (public anon key can write if your Supabase policy allows it)."""
    payload = tour.dict()
    # Supabase expects `id` to be UUID or string – let the client send it or let the DB generate.
    res = supabase.table("tours").insert(payload).execute()
    if res.error:
        raise HTTPException(status_code=400, detail=res.error.message)
    return Tour(**res.data[0])


@app.delete("/tours/{tour_id}", status_code=204)
def delete_tour(tour_id: str):
    """Delete a tour."""
    res = supabase.table("tours").delete().eq("id", tour_id).execute()
    if res.error:
        raise HTTPException(status_code=404, detail=res.error.message)
    return None


# -------------------------------------------------
# Health‑check endpoint (useful for Railway)
# -------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}
