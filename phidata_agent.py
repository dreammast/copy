from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import uvicorn
import os
import shutil
from datetime import datetime
import math

app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories for uploads
os.makedirs("uploads", exist_ok=True)

# Mock data
nearby_shops = [
    {
        "id": 1,
        "name": "CopyZone",
        "address": "123 Main St",
        "distance": "0.5 km",
        "rating": 4.5,
        "services": ["Xerox", "Printing", "Binding"],
        "open_hours": "9:00 AM - 7:00 PM",
        "location": {"lat": 12.9716, "lng": 77.5946}
    },
    {
        "id": 2,
        "name": "Stationery Hub",
        "address": "456 Market Rd",
        "distance": "1.2 km",
        "rating": 4.2,
        "services": ["Stationery", "Printing", "Office Supplies"],
        "open_hours": "8:00 AM - 8:00 PM",
        "location": {"lat": 12.9717, "lng": 77.5947}
    }
]

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

class ChatRequest(BaseModel):
    message: str
    location: Optional[Dict[str, float]] = None
    isOnline: Optional[bool] = True

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        message = request.message.lower()
        if any(greeting in message for greeting in ["hi", "hello", "hey"]):
            return {
                "response": "Hello! I'm Copify Assistant. I can help you with:\n"
                            "1. Finding nearby Xerox shops\n"
                            "2. Information about our printers and services\n"
                            "3. Placing orders\n"
                            "How can I assist you today?"
            }
        if "nearby" in message or "location" in message or "shop" in message:
            if not request.location:
                return {
                    "response": "I need your location to find nearby stores. Please allow location access in your browser settings."
                }
            user_lat = request.location["latitude"]
            user_lng = request.location["longitude"]
            sorted_shops = sorted(nearby_shops, key=lambda shop: calculate_distance(
                user_lat, user_lng, shop["location"]["lat"], shop["location"]["lng"]))
            response = "Here are the nearest Xerox shops:\n\n"
            for shop in sorted_shops[:3]:
                response += f"🏪 {shop['name']}\n"
                response += f"📍 {shop['address']}\n"
                response += f"⭐ Rating: {shop['rating']}/5\n"
                response += f"⏰ {shop['open_hours']}\n"
                response += f"🖨️ Services: {', '.join(shop['services'])}\n\n"
            return {"response": response}
        if any(word in message for word in ["printer", "copier", "xerox"]):
            return {
                "response": "We offer a wide range of printers and copiers:\n\n"
                            "1. Office Printers:\n"
                            "   - High-speed color printers\n"
                            "   - Multifunction printers\n"
                            "   - Network printers\n\n"
                            "2. Copiers:\n"
                            "   - Digital copiers\n"
                            "   - Multifunction copiers\n"
                            "   - High-volume copiers\n\n"
                            "Would you like to know more about any specific model or feature?"
            }
        if "order" in message or "place order" in message:
            return {
                "response": "To place an order, you can:\n"
                            "1. Visit our nearest shop\n"
                            "2. Use our online ordering system\n"
                            "3. Call our customer service\n\n"
                            "Would you like me to help you find the nearest shop?"
            }
        return {
            "response": "I'm here to help with your printing and copying needs. You can ask me about:\n"
                        "1. Finding nearby Xerox shops\n"
                        "2. Our range of printers and copiers\n"
                        "3. Placing orders\n"
                        "4. Our services and features\n\n"
                        "How can I assist you?"
        }
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join("uploads", filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"message": "File uploaded successfully", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 