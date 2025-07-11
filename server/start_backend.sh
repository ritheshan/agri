#!/bin/bash
cd server && uvicorn main_fastapi:app --reload
