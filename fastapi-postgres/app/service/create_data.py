from random import choice, randint

from faker import Faker
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

from common.config import conf
from common.db_model.models import (
    AssignmentModel,
    CourseModel,
    CourseSelectionModel,
    StudentModel,
    TeacherModel,
)
from common.enums import Grade, DayOfWeek, TimeSlot

fake = Faker()


class FactoryModel:
    @classmethod
    def teacher(cls) -> dict:
        return {
            "id": randint(10, 900),
            "phone": str(randint(10_000_000, 9_999_999_999)),
        }

    @classmethod
    def student(cls, teacher_id: int | None = None) -> dict:
        data = {
            "name": fake.name(),
            "grade": choice(Grade.values()),
            "phone": str(randint(10**9, 10**10)),
        }
        if teacher_id is not None:
            data["teacher_id"] = teacher_id
        return data

    @classmethod
    def assignment(cls, student_id: int, teacher_id: int | None = None) -> dict:
        data = {
            "title": fake.sentence(nb_words=3),
            "detail": fake.text(),
            "student_id": student_id,
        }
        if teacher_id is not None:
            data["teacher_id"] = teacher_id
        return data

    @classmethod
    def course(cls) -> dict:
        course_names = [
            "Mathematics I",
            "Physics",
            "Chemistry",
            "Biology",
            "Computer Science",
            "English Literature",
            "History",
            "Geography",
            "Economics",
            "Statistics",
            "Linear Algebra",
            "Calculus",
            "Data Structures",
            "Algorithms",
            "Database Systems",
            "Operating Systems",
            "Computer Networks",
            "Software Engineering",
            "Artificial Intelligence",
            "Machine Learning",
        ]
        teacher_names = [
            "Prof. Smith",
            "Prof. Johnson",
            "Prof. Williams",
            "Prof. Brown",
            "Prof. Jones",
            "Prof. Garcia",
            "Prof. Miller",
            "Prof. Davis",
            "Prof. Rodriguez",
            "Prof. Martinez",
        ]
        day_of_week = choice(DayOfWeek.values())
        time_slot = choice(TimeSlot.values())
        name = choice(course_names)

        return {
            "name": name,
            "description": f"This course covers the fundamentals of {name.lower()}. Students will learn key concepts and practical applications through lectures, assignments, and projects.",
            "teacher_name": choice(teacher_names),
            "credits": choice([2, 3, 4]),
            "max_students": choice([20, 25, 30, 35, 40]),
            "current_students": 0,
            "day_of_week": day_of_week,
            "time_slot": time_slot,
        }


async def reset_postgres_schema():
    engine = create_async_engine(
        conf.POSTGRES_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)


async def create_fake_data():
    await reset_postgres_schema()

    teachers_rows = [TeacherModel.table(**FactoryModel.teacher()) for _ in range(5)]
    teachers = await TeacherModel.add_update(teachers_rows)

    students_rows = []
    for _ in range(25):
        teacher = choice(teachers)
        students_rows.append(
            StudentModel.table(**FactoryModel.student(teacher_id=teacher.id))
        )
    students = await StudentModel.add_update(students_rows)

    assignments_rows = []
    for _ in range(150):
        student = choice(students)
        assignments_rows.append(
            AssignmentModel.table(
                **FactoryModel.assignment(
                    student_id=student.id, teacher_id=student.teacher_id
                )
            )
        )
    await AssignmentModel.add_update(assignments_rows)

    courses_rows = []
    used_schedules = set()
    for _ in range(15):
        course_data = FactoryModel.course()
        schedule_key = f"{course_data['name']}-{course_data['day_of_week']}-{course_data['time_slot']}"
        if schedule_key in used_schedules:
            continue
        used_schedules.add(schedule_key)
        courses_rows.append(CourseModel.table(**course_data))
    courses = await CourseModel.add_update(courses_rows)

    print(f"Created {len(courses)} courses")
    print("Fake data inserted successfully!")


if __name__ == "__main__":
    import asyncio

    asyncio.run(create_fake_data())
