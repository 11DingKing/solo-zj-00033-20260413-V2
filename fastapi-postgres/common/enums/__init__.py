from enum import Enum


class EnumBase(str, Enum):
    def __get__(self, instance, ownerclass=None):
        if instance is None:
            return self.value

    @classmethod
    def values(cls):
        return [_.value for _ in cls]


class ModelType(EnumBase):
    teacher = "teacher"
    student = "student"
    assignment = "assignment"
    course = "course"
    course_selection = "course_selection"


class DBOperator(EnumBase):
    eq = "eq"
    ne = "ne"
    lt = "lt"
    le = "le"
    gt = "gt"
    ge = "ge"
    like = "like"
    ilike = "ilike"
    in_ = "in_"
    not_in = "not_in"
    contains = "contains"
    is_ = "is_"
    is_not = "is_not"


class Grade(EnumBase):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"
    H = "H"
    I_ = "I"
    J = "J"
    K = "K"
    L = "L"


class DayOfWeek(EnumBase):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"


class TimeSlot(EnumBase):
    slot_08_00_09_40 = "08:00-09:40"
    slot_10_00_11_40 = "10:00-11:40"
    slot_14_00_15_40 = "14:00-15:40"
    slot_16_00_17_40 = "16:00-17:40"
    slot_19_00_20_40 = "19:00-20:40"
