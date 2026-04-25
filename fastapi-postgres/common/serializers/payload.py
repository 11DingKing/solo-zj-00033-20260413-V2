from pydantic import BaseModel, Field

from common.enums import Grade, DayOfWeek, TimeSlot


class AssignmentPayload(BaseModel):
    id: int | None = Field(default=None)
    title: str
    detail: str
    student_id: int


class StudentPayload(BaseModel):
    name: str
    grade: Grade
    phone: str


class FullStudentPayload(StudentPayload):
    assignments: list[AssignmentPayload] = []
    id: int


class TeacherPayload(BaseModel):
    id: int
    phone: str


class CoursePayload(BaseModel):
    id: int | None = Field(default=None)
    name: str
    description: str | None = Field(default=None)
    teacher_name: str
    credits: int = Field(default=1, ge=1, le=10)
    max_students: int = Field(default=30, ge=1)
    current_students: int = Field(default=0, ge=0)
    day_of_week: DayOfWeek
    time_slot: TimeSlot


class CourseSelectionPayload(BaseModel):
    id: int | None = Field(default=None)
    student_id: int
    course_id: int


class CourseSelectionWithCoursePayload(CourseSelectionPayload):
    course: CoursePayload | None = Field(default=None)


class CourseSelectionWithStudentPayload(CourseSelectionPayload):
    student: StudentPayload | None = Field(default=None)


class FullCoursePayload(CoursePayload):
    course_selections: list[CourseSelectionWithStudentPayload] = []


class EnrollRequest(BaseModel):
    student_id: int


class EnrollResponse(BaseModel):
    success: bool
    message: str
    course: CoursePayload | None = None
