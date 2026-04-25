from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient

from common.config import conf
from common.db_model.models import TeacherModel
from common.serializers.table_model import Teacher
from main import app


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def seed_data():
    pass


@pytest.fixture(scope="function")
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with LifespanManager(app):
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


@pytest.fixture
def mock_teacher():
    return Teacher(id=1, phone="1234567890")


@pytest.fixture
def mock_teacher_dict():
    return {"id": 1, "phone": "1234567890"}


@pytest.fixture
def valid_token(mock_teacher):
    from jose import jwt

    now = datetime.now(UTC)
    payload = {
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(seconds=int(conf.JWT_EXP)),
        "id": mock_teacher.id,
    }
    token = jwt.encode(payload, conf.JWT_SECRET, algorithm=conf.JWT_ALGORITHM)
    return token


@pytest.fixture
def expired_token(mock_teacher):
    from jose import jwt

    now = datetime.now(UTC)
    payload = {
        "iat": now - timedelta(hours=2),
        "nbf": now - timedelta(hours=2),
        "exp": now - timedelta(hours=1),
        "id": mock_teacher.id,
    }
    token = jwt.encode(payload, conf.JWT_SECRET, algorithm=conf.JWT_ALGORITHM)
    return token


@pytest.mark.anyio
async def test_register_success(client: AsyncClient, mock_teacher, mock_teacher_dict):
    with patch.object(
        TeacherModel, "add_update", new_callable=AsyncMock, return_value=mock_teacher
    ):
        response = await client.post("/teacher/add", json=mock_teacher_dict)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == mock_teacher.id
        assert data["phone"] == mock_teacher.phone


@pytest.mark.anyio
async def test_register_duplicate_returns_400(client: AsyncClient, mock_teacher_dict):
    from fastapi import HTTPException, status

    def raise_400(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="error: unique:phone_id",
        )

    with patch.object(TeacherModel, "add_update", side_effect=raise_400):
        response = await client.post("/teacher/add", json=mock_teacher_dict)
        assert response.status_code == 400


@pytest.mark.anyio
async def test_login_success_returns_token(client: AsyncClient, mock_teacher, mock_teacher_dict):
    with patch.object(
        TeacherModel, "fetch_rows", new_callable=AsyncMock, return_value=mock_teacher
    ):
        response = await client.post("/auth/login", json=mock_teacher_dict)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "id" in data
        assert data["id"] == mock_teacher.id


@pytest.mark.anyio
async def test_login_invalid_credentials_returns_401(client: AsyncClient, mock_teacher_dict):
    with patch.object(
        TeacherModel, "fetch_rows", new_callable=AsyncMock, return_value=None
    ):
        response = await client.post("/auth/login", json=mock_teacher_dict)
        assert response.status_code == 401


@pytest.mark.anyio
async def test_expired_token_access_protected_returns_401(
    client: AsyncClient, expired_token, mock_teacher
):
    with patch.object(
        TeacherModel, "get_by_id", new_callable=AsyncMock, return_value=mock_teacher
    ):
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await client.post("/student", json={}, headers=headers)
        assert response.status_code == 401


@pytest.mark.anyio
async def test_valid_token_access_protected_success(
    client: AsyncClient, valid_token, mock_teacher
):
    from common.db_model.models import StudentModel

    mock_students = []
    with patch.object(
        TeacherModel, "get_by_id", new_callable=AsyncMock, return_value=mock_teacher
    ), patch.object(
        StudentModel, "fetch_rows", new_callable=AsyncMock, return_value=mock_students
    ):
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = await client.post("/student", json={}, headers=headers)
        assert response.status_code == 200
