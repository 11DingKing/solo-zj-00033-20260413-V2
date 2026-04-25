from sqlmodel import Field, Relationship, String, UniqueConstraint

from common.enums import Grade, DayOfWeek, TimeSlot
from common.serializers import IdBaseTable


class Teacher(IdBaseTable, table=True):
    __table_args__ = (UniqueConstraint("phone", "id", name="phone_id"),)

    phone: str

    students: list["Student"] | None = Relationship(
        sa_relationship_kwargs={"cascade": "all, delete"},
        back_populates="teacher",
    )

    assignments: list["Assignment"] | None = Relationship(
        sa_relationship_kwargs={"cascade": "all, delete"},
        back_populates="teacher",
    )


class Student(IdBaseTable, table=True):
    __table_args__ = (UniqueConstraint("name", "phone", name="name_phone"),)

    teacher_id: int = Field(foreign_key="teacher.id")
    teacher: Teacher = Relationship(back_populates="students")

    name: str
    grade: Grade = Field(sa_type=String, nullable=False)

    phone: str

    assignments: list["Assignment"] | None = Relationship(
        sa_relationship_kwargs={"cascade": "all, delete"},
        back_populates="student",
    )

    course_selections: list["CourseSelection"] | None = Relationship(
        sa_relationship_kwargs={"cascade": "all, delete"},
        back_populates="student",
    )


class Assignment(IdBaseTable, table=True):
    __table_args__ = (UniqueConstraint("id", "title", name="id_title"),)
    student_id: int = Field(foreign_key="student.id")
    student: Student = Relationship(back_populates="assignments")
    teacher_id: int = Field(foreign_key="teacher.id")
    teacher: Teacher = Relationship(back_populates="assignments")

    title: str
    detail: str


class Course(IdBaseTable, table=True):
    __table_args__ = (UniqueConstraint("name", "day_of_week", "time_slot", name="course_name_day_time"),)

    name: str = Field(nullable=False)
    description: str | None = Field(default=None)
    teacher_name: str = Field(nullable=False)
    credits: int = Field(default=1, ge=1, le=10)
    max_students: int = Field(default=30, ge=1)
    current_students: int = Field(default=0, ge=0)
    day_of_week: DayOfWeek = Field(sa_type=String, nullable=False)
    time_slot: TimeSlot = Field(sa_type=String, nullable=False)

    course_selections: list["CourseSelection"] | None = Relationship(
        sa_relationship_kwargs={"cascade": "all, delete"},
        back_populates="course",
    )


class CourseSelection(IdBaseTable, table=True):
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="student_course_unique"),)

    student_id: int = Field(foreign_key="student.id", nullable=False)
    course_id: int = Field(foreign_key="course.id", nullable=False)

    student: Student = Relationship(back_populates="course_selections")
    course: Course = Relationship(back_populates="course_selections")
