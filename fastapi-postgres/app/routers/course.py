from fastapi import APIRouter, Depends, Path, Query

from app.service.auth import Auth
from app.service.course_service import CourseService
from common.serializers.payload import (
    CoursePayload,
    EnrollRequest,
    EnrollResponse,
    StudentPayload,
)
from common.serializers.table_model import Course, Student

router = APIRouter(prefix="/course", tags=["course"])


@router.post("/{course_id}/enroll", response_model=EnrollResponse)
async def enroll_course(
    course_id: int = Path(..., gt=0, description="Course ID"),
    body: EnrollRequest = ...,
    user_auth=Depends(Auth.jwt_required),
):
    return await CourseService.enroll_student(
        student_id=body.student_id, course_id=course_id
    )


@router.post("/{course_id}/drop", response_model=EnrollResponse)
async def drop_course(
    course_id: int = Path(..., gt=0, description="Course ID"),
    body: EnrollRequest = ...,
    user_auth=Depends(Auth.jwt_required),
):
    return await CourseService.drop_course(
        student_id=body.student_id, course_id=course_id
    )


@router.get("/student/{student_id}/courses", response_model=list[CoursePayload])
async def get_student_courses(
    student_id: int = Path(..., gt=0, description="Student ID"),
    user_auth=Depends(Auth.jwt_required),
):
    courses: list[Course] = await CourseService.get_student_enrolled_courses(
        student_id=student_id
    )
    return [CoursePayload.model_validate(course.model_dump()) for course in courses]


@router.get("/{course_id}/students", response_model=list[StudentPayload])
async def get_course_students(
    course_id: int = Path(..., gt=0, description="Course ID"),
    user_auth=Depends(Auth.jwt_required),
):
    students: list[Student] = await CourseService.get_course_enrolled_students(
        course_id=course_id
    )
    return [StudentPayload.model_validate(student.model_dump()) for student in students]
