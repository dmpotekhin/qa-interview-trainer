"""Mock API server — эмулирует WireMock bug с округлением"""
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/api/v1/transfers/internal")
async def transfer_internal(request: Request):
    body = await request.json()
    idempotency = request.headers.get("Idempotency-Key", "")
    auth = request.headers.get("Authorization", "")

    if not idempotency or not auth.startswith("Bearer "):
        return {"error": "Missing required headers"}, 400

    # BUG: amount всегда 1500.00 (теряется копейка)
    return {
        "status": "COMPLETED",
        "data": {
            "transaction_id": "c0000099-0000-0000-0000-000000000099",
            "source_account_id": body.get("source_account_id", body.get("fromAccount", "")),
            "destination_account_id": body.get("destination_account_id", body.get("toAccount", "")),
            "amount": 1500.00,
            "currency": body.get("currency", "USD"),
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
