# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Visub is a full-stack video subtitle generation platform with:
- **Python backend**: FastAPI web server with Celery background processing
- **React frontend**: Next.js with shadcn/ui components
- **AI-powered transcription**: WhisperX for word-level timestamps and speaker detection
- **Customizable styling**: Per-speaker font, color, position, and formatting options

The project is designed for indie hacking with future monetization in mind.

## Architecture

### Backend Components (`/`)
- **`visub/cli.py`**: Legacy CLI interface and core subtitle generation logic
- **`visub/transcribe.py`**: WhisperX integration with speaker diarization support
- **`visub/config.py`**: Data structures for subtitle styling and speaker configuration
- **`visub/api.py`**: API interface layer for web integration
- **`visub/utils.py`**: Utility functions for time formatting and file handling
- **`webapp.py`**: Production FastAPI web server with Celery integration

### Frontend Components (`/frontend/`)
- **Next.js 14**: React framework with App Router
- **shadcn/ui**: Component library for consistent UI/UX
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety throughout the frontend

### Processing Pipeline
1. **File Upload**: Drag/drop video upload with validation
2. **Configuration**: Customizable subtitle styling per speaker
3. **Background Processing**: Celery tasks for video processing
4. **Real-time Updates**: WebSocket-like polling for job status
5. **File Download**: Generated subtitle files and processed video

## Development Commands

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt
pip install -r requirements-webapp.txt

# Start Redis (required for Celery)
redis-server

# Start Celery worker
celery -A webapp.celery worker --loglevel=info

# Start FastAPI server
uvicorn webapp:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### CLI Usage (Legacy)
```bash
# Basic usage
visub /path/to/video.mp4

# With speaker detection
visub /path/to/video.mp4 --enable_speaker_detection --hf_token YOUR_TOKEN
```

## API Endpoints

### Core Endpoints
- `POST /api/upload`: Upload video and start processing
- `GET /api/status/{job_id}`: Get job status and progress
- `GET /api/download/{job_id}/{file_type}`: Download generated files
- `DELETE /api/jobs/{job_id}`: Clean up job files

### Configuration Endpoints
- `GET /api/models`: List available WhisperX models
- `GET /api/languages`: List supported languages
- `GET /api/positions`: List subtitle position options
- `POST /api/validate-config`: Validate subtitle configuration

## Configuration Structure

### Subtitle Config
```typescript
{
  max_words: number,           // 1-50 words per subtitle
  output_srt: boolean,         // Generate SRT alongside ASS
  enable_speaker_detection: boolean,
  speakers: [
    {
      speaker_id: string,      // e.g. "SPEAKER_00"
      font_family: string,     // Font name
      font_size: number,       // 8-100px
      color: string,           // Hex (#FFFFFF) or ASS format
      position: string,        // bottom_center, top_left, etc.
      bold: boolean,
      italic: boolean
    }
  ]
}
```

### Transcription Config
```typescript
{
  model: string,              // tiny, medium, large-v3, etc.
  language: string,           // auto, en, es, fr, etc.
  device: string,             // cuda, cpu
  compute_type: string,       // float16, int8
  batch_size: number,         // Processing batch size
  hf_token?: string          // HuggingFace token for diarization
}
```

## Production Deployment

### Environment Variables
```bash
REDIS_URL=redis://localhost:6379/0
UPLOAD_DIR=/tmp/visub_uploads
MAX_FILE_SIZE=500             # MB
CLEANUP_INTERVAL=3600         # seconds
FILE_RETENTION=86400          # seconds
```

### Docker Setup
```bash
# Backend
docker build -t visub-backend .
docker run -p 8000:8000 visub-backend

# Frontend  
cd frontend
docker build -t visub-frontend .
docker run -p 3000:3000 visub-frontend
```

## Key Features for Web Interface

- **Speaker Detection**: Automatic speaker identification with custom styling
- **Real-time Processing**: Background jobs with progress updates
- **File Management**: Automatic cleanup of temporary files
- **Responsive Design**: Mobile-friendly interface with shadcn/ui
- **Type Safety**: Full TypeScript coverage on frontend
- **Production Ready**: Redis, Celery, proper error handling

## Dependencies

### Backend
- **FastAPI**: Modern web framework
- **Celery**: Background task processing
- **Redis**: Message broker and result backend
- **WhisperX**: AI transcription with speaker detection
- **FFmpeg**: Video/audio processing

### Frontend
- **Next.js 14**: React framework
- **shadcn/ui**: UI component library
- **Tailwind CSS**: Styling framework
- **React Hook Form**: Form management
- **Zod**: Schema validation