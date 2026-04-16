from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import asyncio
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="台股當沖監測系統 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    api_key: str
    secret_key: str
    simulation: bool = True

class SubscribeRequest(BaseModel):
    symbols: List[str]

class OrderRequest(BaseModel):
    symbol: str
    side: str
    price: float
    quantity: int
    order_type: str = "limit"
    time_in_force: str = "ROD"

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscribed_symbols: Dict[str, List[WebSocket]] = {}
        self.shioaji_client = None
        self.is_connected = False
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        for symbol in list(self.subscribed_symbols.keys()):
            if websocket in self.subscribed_symbols[symbol]:
                self.subscribed_symbols[symbol].remove(websocket)
                
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")
    
    async def send_message(self, message: dict):
        if self.active_connections:
            await asyncio.gather(
                *[conn.send_json(message) for conn in self.active_connections],
                return_exceptions=True
            )
    
    def subscribe(self, websocket: WebSocket, symbols: List[str]):
        for symbol in symbols:
            if symbol not in self.subscribed_symbols:
                self.subscribed_symbols[symbol] = []
            if websocket not in self.subscribed_symbols[symbol]:
                self.subscribed_symbols[symbol].append(websocket)
        logger.info(f"Subscribed to {symbols}")
    
    def unsubscribe(self, websocket: WebSocket, symbols: List[str]):
        for symbol in symbols:
            if symbol in self.subscribed_symbols:
                if websocket in self.subscribed_symbols[symbol]:
                    self.subscribed_symbols[symbol].remove(websocket)
        
    async def broadcast_price(self, data: dict):
        symbol = data.get("symbol")
        if symbol and symbol in self.subscribed_symbols:
            await asyncio.gather(
                *[conn.send_json(data) for conn in self.subscribed_symbols[symbol]],
                return_exceptions=True
            )

manager = ConnectionManager()

try:
    import shioaji as sj
    SHIOAJI_AVAILABLE = True
    logger.info("Shioaji module available")
except ImportError:
    SHIOAJI_AVAILABLE = False
    logger.warning("Shioaji not installed, using mock mode")

class ShioajiClient:
    def __init__(self):
        self.api = None
        self.connected = False
        
    def login(self, api_key: str, secret_key: str, simulation: bool = True):
        if not SHIOAJI_AVAILABLE:
            return {"success": False, "message": "Shioaji not installed"}
        
        try:
            self.api = sj.Shioaji(simulation=simulation)
            self.api.login(api_key=api_key, secret_key=secret_key)
            self.connected = True
            logger.info("Shioaji logged in successfully")
            return {"success": True, "message": "Connected"}
        except Exception as e:
            logger.error(f"Shioaji login failed: {e}")
            return {"success": False, "message": str(e)}
    
    def logout(self):
        if self.api:
            self.api.logout()
            self.connected = False
            
    def subscribe(self, symbols: List[str]):
        if not self.api or not self.connected:
            return {"success": False, "message": "Not connected"}
        
        try:
            contracts = [self.api.Contracts.Stocks[s] for s in symbols if s in self.api.Contracts.Stocks]
            self.api.subscribe(contracts)
            return {"success": True, "message": f"Subscribed to {len(symbols)} symbols"}
        except Exception as e:
            logger.error(f"Subscribe failed: {e}")
            return {"success": False, "message": str(e)}
    
    def place_order(self, symbol: str, side: str, price: float, quantity: int, order_type: str, time_in_force: str):
        if not self.api or not self.connected:
            return {"success": False, "message": "Not connected"}
        
        try:
            contract = self.api.Contracts.Stocks[symbol]
            order = self.api.Order(
                symbol=contract,
                price=price,
                quantity=quantity,
                side=sj.constant.BSAction.Buy if side == "buy" else sj.constant.BSAction.Sell,
                order_type=sj.constant.OrderType.Limit if order_type == "limit" else sj.constant.OrderType.Market,
                time_in_force=sj.constant.TimeInForce.ROD if time_in_force == "ROD" else sj.constant.TimeInForce.IOC
            )
            result = self.api.place_order(order)
            return {"success": True, "order_id": result.order_id, "message": "Order placed"}
        except Exception as e:
            logger.error(f"Place order failed: {e}")
            return {"success": False, "message": str(e)}

shioaji_client = ShioajiClient()

@app.get("/")
async def root():
    return {"status": "ok", "message": "台股當沖監測系統 API"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "shioaji_available": SHIOAJI_AVAILABLE,
        "connected": shioaji_client.connected,
        "clients": len(manager.active_connections)
    }

@app.post("/api/login")
async def login(request: LoginRequest):
    result = shioaji_client.login(request.api_key, request.secret_key, request.simulation)
    if result["success"]:
        manager.is_connected = True
    return JSONResponse(content=result)

@app.post("/api/logout")
async def logout():
    shioaji_client.logout()
    manager.is_connected = False
    return {"success": True, "message": "Logged out"}

@app.post("/api/subscribe")
async def subscribe(request: SubscribeRequest):
    return shioaji_client.subscribe(request.symbols)

@app.post("/api/order")
async def place_order(request: OrderRequest):
    return shioaji_client.place_order(
        request.symbol,
        request.side,
        request.price,
        request.quantity,
        request.order_type,
        request.time_in_force
    )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connected"
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe":
                symbols = message.get("symbols", [])
                manager.subscribe(websocket, symbols)
                await websocket.send_json({
                    "type": "subscribed",
                    "symbols": symbols
                })
                
            elif message.get("type") == "unsubscribe":
                symbols = message.get("symbols", [])
                manager.unsubscribe(websocket, symbols)
                
            elif message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)