# WSGI wrapper for FastAPI to work with gunicorn
from main_fastapi import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
