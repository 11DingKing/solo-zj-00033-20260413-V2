export enum ModelType {
    teacher = 'teacher',
    student = 'student',
    assignment = 'assignment',
    course = 'course',
    course_selection = 'course_selection'
}

export interface LoginToken {
    token: string;
    id: number;
}

export type Teacher = {
    id: number;
    phone: string;
};

export type Assignment = {
    id: number;
    title: string;
    detail: string;
};

export type Student = {
    id: number;
    name: string;
    grade: string;
    phone: number;
    teacher_id: number;
    assignments: Assignment[];
};

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TimeSlot = '08:00-09:40' | '10:00-11:40' | '14:00-15:40' | '16:00-17:40' | '19:00-20:40';

export type Course = {
    id: number;
    name: string;
    description: string | null;
    teacher_name: string;
    credits: number;
    max_students: number;
    current_students: number;
    day_of_week: DayOfWeek;
    time_slot: TimeSlot;
    course_selections?: CourseSelection[];
};

export type CourseSelection = {
    id: number;
    student_id: number;
    course_id: number;
    student?: Student;
    course?: Course;
};

export type EnrollResponse = {
    success: boolean;
    message: string;
    course?: Course | null;
};

export interface DBQuery {
    opt: string;
    key: string;
    value: string | number;
}

export type FilterQuery = {
    query?: DBQuery[];
    count?: boolean;
    or_query?: DBQuery[];

    // Sort string format: "field:asc" or "field:desc".
    // Multiple sorts can be applied by separating with commas.
    // Example: "created_at:desc,name:asc"
    sort?: string | null;

    // Relations
    relation_model?: boolean;
    relations?: string[] | null;
};
