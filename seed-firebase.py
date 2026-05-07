#!/usr/bin/env python3
"""
Firebase seed script - Create admin user and initial data
"""
import requests
import json
from datetime import datetime

API_KEY = "AIzaSyA23ngUJrsYCKQ-DemC7eLlqAlTIIYr7SE"
PROJECT_ID = "payment-bydm-2026"

# Firebase URLs
AUTH_SIGNUP_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}"
FIRESTORE_API_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def create_user():
    """Create admin user"""
    print("Creating admin user...")
    payload = {
        "email": "admin@payment.com",
        "password": "Admin123!@#",
        "returnSecureToken": True
    }
    
    try:
        response = requests.post(AUTH_SIGNUP_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        user_id = data.get('localId')
        token = data.get('idToken')
        print(f"✓ User created: {user_id}")
        return user_id, token
    except requests.exceptions.RequestException as e:
        print(f"✗ Error creating user: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")
        return None, None

def main():
    print("Starting Firebase seed...\n")
    
    user_id, token = create_user()
    if not user_id:
        print("\n✗ Failed to create user")
        return
    
    print("\n✅ Firebase seed completed!\n")
    print("Login credentials:")
    print("  Email: admin@payment.com")
    print("  Password: Admin123!@#")
    print(f"\nYou can now login at: https://payment-bydm-2026.firebaseapp.com/")

if __name__ == "__main__":
    main()
