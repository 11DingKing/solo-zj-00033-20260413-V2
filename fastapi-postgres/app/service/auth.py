from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from common.config import conf
from common.db_model.models import TeacherModel
from common.enums import DBOperator
from common.serializers import DBQuery, FilterQuery, Token
from common.utils import BaseUtils

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class Auth(BaseUtils):
    @staticmethod
    async def jwt_required(token: str = Depends(oauth2_scheme)) -> TeacherModel.table:
        return await Auth.validate_token(token)

    @staticmethod
    def user_filtered_query(field_name: str = conf.AUTH_PARENT_FIELD):
        def _inject_user_filter(
            filter_query: FilterQuery = Body(default=FilterQuery()),
            user_auth: TeacherModel.table = Depends(Auth.jwt_required),
        ) -> FilterQuery:
            filter_query.query.append(
                DBQuery(key=field_name, opt=DBOperator.eq, value=int(user_auth.id))
            )
            return filter_query

        return Depends(_inject_user_filter)

    @classmethod
    async def _try_get_teacher_by_id(cls, _id: int) -> Any:
        try:
            filter_query = FilterQuery(
                query=[DBQuery(key="id", opt=DBOperator.eq, value=_id)]
            )
            return await TeacherModel.fetch_rows(filter_query=filter_query, limit=1)
        except HTTPException:
            return None

    @classmethod
    async def _try_get_teacher_by_id_and_phone(cls, _id: int, phone: str) -> Any:
        try:
            filter_query = FilterQuery(
                query=[
                    DBQuery(key="id", opt=DBOperator.eq, value=_id),
                    DBQuery(key="phone", opt=DBOperator.eq, value=phone),
                ]
            )
            return await TeacherModel.fetch_rows(filter_query=filter_query, limit=1)
        except HTTPException:
            return None

    @classmethod
    async def authenticate_user(cls, _id: int, phone: str) -> Token:
        cls.logger.info(f"Login attempt: id={_id}, phone={phone}")

        teacher_by_id = await cls._try_get_teacher_by_id(_id)
        if not teacher_by_id:
            cls.logger.warning(f"Teacher not found with id={_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Teacher ID {_id} not found. Please check your ID or click 'Reset Database' to create test data.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        teacher = await cls._try_get_teacher_by_id_and_phone(_id, phone)
        if not teacher:
            cls.logger.warning(f"Phone mismatch for id={_id}. Expected={teacher_by_id.phone}, Got={phone}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Incorrect phone number for Teacher ID {_id}. Expected: {teacher_by_id.phone}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        cls.logger.info(f"Login successful: id={_id}")
        return cls.create_token(_id)

    @classmethod
    async def validate_token(cls, token: str) -> TeacherModel.table:
        try:
            payload = jwt.decode(
                token, conf.JWT_SECRET, algorithms=[conf.JWT_ALGORITHM]
            )
            _id = payload.get("id")
            teacher: TeacherModel.table = await TeacherModel.get_by_id(_id=_id)
            if not teacher:
                raise cls.error_authenticate()
            return teacher

        except (JWTError, Exception):
            raise cls.error_authenticate()

    @classmethod
    def create_token(cls, _id: int) -> Token:
        now = datetime.now(UTC)
        payload = {
            "iat": now,
            "nbf": now,
            "exp": now + timedelta(seconds=int(conf.JWT_EXP)),
            "id": _id,
        }
        token = jwt.encode(payload, conf.JWT_SECRET, algorithm=conf.JWT_ALGORITHM)
        return Token(token=token, id=_id)
