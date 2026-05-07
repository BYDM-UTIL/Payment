import requests
import json

api_key = "AIzaSyA23ngUJrsYCKQ-DemC7eLlqAlTIIYr7SE"
url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"

payload = {
    "email": "admin@payment.com",
    "password": "Admin123!@#",
    "returnSecureToken": True
}

print("Testing Firebase Authentication API...")
print(f"URL: {url}\n")
print(f"Payload: {json.dumps(payload, indent=2)}\n")

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse:\n{json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
