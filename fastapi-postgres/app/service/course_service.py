from typing import Any

from fastapi import HTTPException, status

from common.db_model.models import CourseModel, CourseSelectionModel, StudentModel
from common.enums import DBOperator
from common.serializers import DBQuery, FilterQuery
from common.serializers.payload import CoursePayload, EnrollResponse
from common.serializers.table_model import Course, CourseSelection, Student
from common.utils import BaseUtils


class CourseService(BaseUtils):
    @classmethod
    def error_409(cls, details: Any = "Conflict") -> HTTPException:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"error: {str(details)}",
        )

    @classmethod
    async def get_student_enrolled_courses(
        cls, student_id: int
    ) -> list[Course]:
        filter_query = FilterQuery(
            query=[
                DBQuery(key="student_id", opt=DBOperator.eq, value=student_id)
            ],
            relation_model=True,
            relations=["course"],
        )
        selections: list[CourseSelection] = await CourseSelectionModel.fetch_rows(
            filter_query=filter_query
        )
        return [selection.course for selection in selections if selection.course]

    @classmethod
    async def get_course_enrolled_students(
        cls, course_id: int
    ) -> list[Student]:
        filter_query = FilterQuery(
            query=[
                DBQuery(key="course_id", opt=DBOperator.eq, value=course_id)
            ],
            relation_model=True,
            relations=["student"],
        )
        selections: list[CourseSelection] = await CourseSelectionModel.fetch_rows(
            filter_query=filter_query
        )
        return [selection.student for selection in selections if selection.student]

    @classmethod
    async def check_time_conflict(
        cls, student_id: int, new_course: Course
    ) -> Course | None:
        enrolled_courses = await cls.get_student_enrolled_courses(student_id)
        for course in enrolled_courses:
            if course.id == new_course.id:
                continue
            if (
                course.day_of_week == new_course.day_of_week
                and course.time_slot == new_course.time_slot
            ):
                return course
        return None

    @classmethod
    async def check_already_enrolled(
        cls, student_id: int, course_id: int
    ) -> bool:
        filter_query = FilterQuery(
            query=[
                DBQuery(key="student_id", opt=DBOperator.eq, value=student_id),
                DBQuery(key="course_id", opt=DBOperator.eq, value=course_id),
            ]
        )
        selections = await CourseSelectionModel.fetch_rows(
            filter_query=filter_query, limit=1
        )
        return len(selections) > 0

    @classmethod
    async def enroll_student(
        cls, student_id: int, course_id: int
    ) -> EnrollResponse:
        try:
            student: Student = await StudentModel.get_by_id(_id=student_id)
        except HTTPException:
            cls.error_400(details=f"Student with id {student_id} not found")

        try:
            course: Course = await CourseModel.get_by_id(_id=course_id)
        except HTTPException:
            cls.error_400(details=f"Course with id {course_id} not found")

        if course.current_students >= course.max_students:
            cls.error_409(details=f"Course '{course.name}' is full. Maximum {course.max_students} students allowed.")

        if await cls.check_already_enrolled(student_id, course_id):
            cls.error_409(details=f"Student is already enrolled in course '{course.name}'.")

        conflict_course = await cls.check_time_conflict(student_id, course)
        if conflict_course:
            cls.error_409(details=f"Time conflict with course '{conflict_course.name}' ({conflict_course.day_of_week} {conflict_course.time_slot}).")

        selection = CourseSelection(student_id=student_id, course_id=course_id)
        await CourseSelectionModel.add_update(row=selection)

        course.current_students += 1
        await CourseModel.add_update(row=course)

        return EnrollResponse(
            success=True,
            message=f"Successfully enrolled in course '{course.name}'.",
            course=CoursePayload.model_validate(course.model_dump()),
        )

    @classmethod
    async def drop_course(
        cls, student_id: int, course_id: int
    ) -> EnrollResponse:
        try:
            student: Student = await StudentModel.get_by_id(_id=student_id)
        except HTTPException:
            cls.error_400(details=f"Student with id {student_id} not found")

        try:
            course: Course = await CourseModel.get_by_id(_id=course_id)
        except HTTPException:
            cls.error_400(details=f"Course with id {course_id} not found")

        if not await cls.check_already_enrolled(student_id, course_id):
            cls.error_400(details=f"Student is not enrolled in course '{course.name}'.")

        filter_query = FilterQuery(
            query=[
                DBQuery(key="student_id", opt=DBOperator.eq, value=student_id),
                DBQuery(key="course_id", opt=DBOperator.eq, value=course_id),
            ]
        )
        await CourseSelectionModel.delete_rows(filter_query=filter_query)

        if course.current_students > 0:
            course.current_students -= 1
            await CourseModel.add_update(row=course)

        return EnrollResponse(
            success=True,
            message=f"Successfully dropped course '{course.name}'.",
            course=CoursePayload.model_validate(course.model_dump()),
        )
