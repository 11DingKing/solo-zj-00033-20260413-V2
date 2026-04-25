import { Assignment, ModelType, Student, Teacher, Course, DayOfWeek, TimeSlot } from './index';

export enum FormType {
    TEXT = 'text',
    TEXTAREA = 'textarea',
    NUMBER = 'number',
    AutoComplete = 'AutoComplete'
}
export type FieldValue = string | number | boolean | null;

export class FieldAutoComplete {
    readonly type: FormType = FormType.AutoComplete;

    public value: string;

    constructor(
        public key: string,
        public options: string[],
        value?: string
    ) {
        this.value = value ?? options[0] ?? '';
    }
}

export class FieldInput {
    constructor(
        public type: FormType = FormType.TEXT,
        public key: string,
        public value: FieldValue = ''
    ) {}
}

export type FormField = FieldAutoComplete | FieldInput;
export type InputField = {
    key: string;
    type: FormType;
    options?: string[];
};

enum Grade {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E',
    F = 'F',
    G = 'G',
    H = 'H',
    I = 'I',
    J = 'J',
    K = 'K',
    L = 'L'
}

const DayOfWeekOptions: string[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];

const TimeSlotOptions: string[] = [
    '08:00-09:40',
    '10:00-11:40',
    '14:00-15:40',
    '16:00-17:40',
    '19:00-20:40'
];

export const student_fields: InputField[] = [
    { key: 'name', type: FormType.TEXT },
    { key: 'phone', type: FormType.NUMBER },
    { key: 'grade', type: FormType.AutoComplete, options: Object.values(Grade) }
];
export const assignment_fields: InputField[] = [
    { key: 'title', type: FormType.TEXT },
    { key: 'detail', type: FormType.TEXTAREA }
];
export const teacher_fields: InputField[] = [
    { key: 'id', type: FormType.NUMBER },
    { key: 'phone', type: FormType.NUMBER }
];
export const course_fields: InputField[] = [
    { key: 'name', type: FormType.TEXT },
    { key: 'description', type: FormType.TEXTAREA },
    { key: 'teacher_name', type: FormType.TEXT },
    { key: 'credits', type: FormType.NUMBER },
    { key: 'max_students', type: FormType.NUMBER },
    { key: 'day_of_week', type: FormType.AutoComplete, options: DayOfWeekOptions },
    { key: 'time_slot', type: FormType.AutoComplete, options: TimeSlotOptions }
];
export const json_field_to_form_field = (json_field: InputField): FormField => {
    switch (json_field.type) {
        case FormType.AutoComplete:
            return new FieldAutoComplete(json_field.key, json_field.options!);
        case FormType.TEXT:
        case FormType.TEXTAREA:
        case FormType.NUMBER:
        default:
            return new FieldInput(json_field.type, json_field.key);
    }
};
export const json_fields_to_form_fields = (json_fields: InputField[]): FormField[] =>
    json_fields.map((obj: InputField) => json_field_to_form_field(obj));
export const get_form_by_model = (model: ModelType): FormField[] => {
    switch (model) {
        case ModelType.student:
            return json_fields_to_form_fields([...student_fields]);
        case ModelType.assignment:
            return json_fields_to_form_fields([...assignment_fields]);
        case ModelType.teacher:
            return json_fields_to_form_fields([...teacher_fields]);
        case ModelType.course:
            return json_fields_to_form_fields([...course_fields]);
        default:
            return [];
    }
};

export const create_form_fields = (source: FormField[], target: Record<string, FieldValue>): FormField[] => {
    if (!target || Object.keys(target).length === 0) {
        return source.map((field) => {
            if (field instanceof FieldAutoComplete) {
                return new FieldAutoComplete(field.key, field.options);
            }
            return new FieldInput(field.type, field.key, field.value);
        });
    }

    return source.map((field) => {
        const updatedValue = target[field.key];
        if (field instanceof FieldAutoComplete) {
            return new FieldAutoComplete(field.key, field.options, updatedValue as string);
        }
        return new FieldInput(field.type, field.key, updatedValue ?? '');
    });
};

export type FormModelType = Teacher | Student | Assignment | Course;
