from pydantic import BaseModel
from fastapi import APIRouter

from services.ollama_service import delete_model, list_models, pull_model

router = APIRouter(prefix="/api/ollama", tags=["ollama"])


class PullModelRequest(BaseModel):
    model: str


@router.get("/models")
def read_models():
    return list_models()


@router.post("/pull")
def pull(request: PullModelRequest):
    return pull_model(request.model)


@router.delete("/models/{model_name:path}")
def delete(model_name: str):
    return delete_model(model_name)
