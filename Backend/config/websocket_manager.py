from fastapi import WebSocket
from typing import Dict, List
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Key = session_id, value =  dict list các websocket của customer trong session
        self.customers: Dict[int, List[WebSocket]] = {}
        # Admin có thể xem tất cả session  --> danh sách các kết nối websocket của admin
        self.admins: List[WebSocket] = []
        self.active_connections: list[WebSocket] = []

    async def connect_customer(self, websocket: WebSocket, session_id : int):
        print("customer")
        await websocket.accept()
        if session_id not in self.customers:
            self.customers[session_id] = []
        self.customers[session_id].append(websocket)

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admins.append(websocket)

    def disconnect_customer(self, websocket: WebSocket, session_id: int):
        if session_id in self.customers and websocket in self.customers[session_id]:
            self.customers[session_id].remove(websocket)
            if not self.customers[session_id]:
                del self.customers[session_id]

    def disconnect_admin(self, websocket: WebSocket):
        if websocket in self.admins:
            self.admins.remove(websocket)

    async def send_to_customer(self, session_id: int, message):
        print("send to customer")
        if session_id in self.customers:
            disconnected = []
            print(message)
            for ws in self.customers[session_id]:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    print(f"⚠️ WebSocket lỗi: {e}")
                    disconnected.append(ws)
            for ws in disconnected:
                self.customers[session_id].remove(ws)


    async def broadcast_to_admins(self, message): 
        for admin in self.admins:
            await admin.send_json(message)



    async def broadcast(self, message):
    
        for connection in self.active_connections:
            print(message)  
            
            await connection.send_json(message)
            print("broadcast")
            print(connection)  
            
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)