import axios, { AxiosHeaders, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { FieldValue, ModelType, FormModelType, Course, Student, EnrollResponse } from '@/lib/types';
import config from './config';

const API = axios.create({
    baseURL: config.apiUrl,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

API.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        cfg.headers = cfg.headers ?? new AxiosHeaders();
        if (token) {
            cfg.headers.set('Authorization', `Bearer ${token}`);
        }
        return cfg;
    },
    (error) => Promise.reject(error)
);

export const createOrUpdateRow = async (opts: {
    model: ModelType;
    id: number | string;
    data: Record<string, FieldValue>;
    message: string;
}) => {
    const { model, id, data, message } = opts;
    await API.post(`/${model}/${id}`, data);
    toast.success(message);
};

export const deleteRowById = async (opts: { model: ModelType; id: number | string; message: string }) => {
    const { model, id, message } = opts;
    const data = { query: [{ key: 'id', value: id, opt: 'eq' }] };
    await API.delete(`/${model}`, { data });
    toast.success(message);
};

export const fetchRowById = async (opts: {
    model: ModelType;
    id: number | string;
    relation?: boolean;
    relations?: string[] | null;
}): Promise<FormModelType> => {
    const { model, id, relation, relations } = opts;

    const res: AxiosResponse<FormModelType> = await API.post<FormModelType>(
        `/${model}`,
        {
            query: [{ key: 'id', value: typeof id === 'string' ? Number(id) : id, opt: 'eq' }],
            ...(relation ? { relation_model: true, relations } : {})
        },
        { params: { limit: 1 } }
    );

    return res.data;
};

export const enrollCourse = async (courseId: number, studentId: number): Promise<EnrollResponse> => {
    const res: AxiosResponse<EnrollResponse> = await API.post(`/course/${courseId}/enroll`, { student_id: studentId });
    toast.success(res.data.message);
    return res.data;
};

export const dropCourse = async (courseId: number, studentId: number): Promise<EnrollResponse> => {
    const res: AxiosResponse<EnrollResponse> = await API.post(`/course/${courseId}/drop`, { student_id: studentId });
    toast.success(res.data.message);
    return res.data;
};

export const fetchStudentEnrolledCourses = async (studentId: number): Promise<Course[]> => {
    const res: AxiosResponse<Course[]> = await API.get(`/course/student/${studentId}/courses`);
    return res.data;
};

export const fetchCourseEnrolledStudents = async (courseId: number): Promise<Student[]> => {
    const res: AxiosResponse<Student[]> = await API.get(`/course/${courseId}/students`);
    return res.data;
};

export const fetchCourseById = async (courseId: number): Promise<Course> => {
    const res: AxiosResponse<Course[]> = await API.post(
        `/course`,
        { query: [{ key: 'id', value: courseId, opt: 'eq' }] },
        { params: { limit: 1 } }
    );
    if (!res.data || res.data.length === 0) {
        throw new Error(`Course with id ${courseId} not found`);
    }
    return res.data[0];
};

export const checkStudentEnrolled = async (studentId: number, courseId: number): Promise<boolean> => {
    try {
        const res: AxiosResponse<Course[]> = await API.get(`/course/student/${studentId}/courses`);
        const courses: Course[] = res.data;
        return courses.some((c) => c.id === courseId);
    } catch {
        return false;
    }
};

export default API;
