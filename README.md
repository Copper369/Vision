# Drishyamitra - AI Photo Management System

## Quick Start

1. **Start Backend**: `cd backend && .\venv\Scripts\python.exe app.py`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Access**: http://localhost:3000

## Database
- PostgreSQL: `postgresql://postgres:postgres@localhost:5432/drishyamitra`
- Change in `backend/.env` if needed

## Features
- Photo upload with face detection (DeepFace)
- AI chat assistant (Groq API)
- Face recognition and labeling
- Photo gallery and people view

## Useful Scripts
- `label_faces.py` - Label detected faces interactively
- `reprocess_photos.py` - Reprocess photos for face detection
- `fix_photo_paths.py` - Fix photo file paths in database
- `check_postgres.py` - Check database status

## API Keys
- GROQ_API_KEY: Already configured in backend/.env
- Gmail API: Optional (for email delivery)
