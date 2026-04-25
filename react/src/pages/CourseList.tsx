import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AddBox as AddBoxIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Event as EventIcon,
    School as SchoolIcon,
    Star as StarIcon,
    HowToReg as HowToRegIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import {
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Tooltip,
    Button,
    Box,
    CircularProgress,
    Alert
} from '@mui/material';
import { useIntl } from 'react-intl';
import MainCard from '@/components/cards/MainCard';
import { Course, ModelType, Student } from '@/lib/types';
import { useAppDispatch, fetchRowsByModel, useAppSelector } from '@/lib/store';
import {
    enrollCourse,
    dropCourse,
    deleteRowById,
    fetchStudentEnrolledCourses,
    checkStudentEnrolled
} from '@/lib/utils/api';

const CourseList = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const intl = useIntl();

    const courses: Course[] = useAppSelector((state) => state.general.models[ModelType.course]);
    const student_id = useAppSelector((state) => state.general.student_id);
    const [loading, setLoading] = useState(false);
    const [enrolledIds, setEnrolledIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        dispatch(fetchRowsByModel({ model: ModelType.course, data: {} }));
    }, [dispatch]);

    const fetchEnrolledCourses = useCallback(async () => {
        if (student_id > 0) {
            try {
                const enrolled = await fetchStudentEnrolledCourses(student_id);
                setEnrolledIds(enrolled.map((c) => c.id));
            } catch {
                setEnrolledIds([]);
            }
        }
    }, [student_id]);

    useEffect(() => {
        fetchCourses();
        fetchEnrolledCourses();
    }, [fetchCourses, fetchEnrolledCourses]);

    const handleEnroll = async (courseId: number) => {
        setLoading(true);
        setError(null);
        try {
            await enrollCourse(courseId, student_id);
            setEnrolledIds((prev) => [...prev, courseId]);
            fetchCourses();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Enrollment failed';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (courseId: number) => {
        setLoading(true);
        setError(null);
        try {
            await dropCourse(courseId, student_id);
            setEnrolledIds((prev) => prev.filter((id) => id !== courseId));
            fetchCourses();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Drop failed';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (courseId: number) => {
        await deleteRowById({
            model: ModelType.course,
            id: courseId,
            message: intl.formatMessage({ id: `success.delete.${ModelType.course}` })
        });
        fetchCourses();
    };

    const getDayLabel = (day: string) => {
        const dayMap: Record<string, string> = {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
            sunday: 'Sunday'
        };
        return dayMap[day] || day;
    };

    return (
        <MainCard
            title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon />
                    <Typography variant="h5">Course List</Typography>
                </Box>
            }
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<SchoolIcon />}
                        component={Link as any}
                        to="/my-schedule"
                        sx={{ textTransform: 'none' }}
                    >
                        My Schedule
                    </Button>
                    <IconButton
                        size="medium"
                        color="primary"
                        component={Link}
                        to={`/form/${ModelType.course}/add`}
                    >
                        <AddBoxIcon fontSize="medium" />
                    </IconButton>
                </Box>
            }
        >
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {student_id > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Viewing as Student ID: {student_id}. Click "Enroll" or "Drop" to manage your courses.
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="courses table">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Course Name
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Teacher
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Credits
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Remaining Slots
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Schedule
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Status
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Actions
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {courses.map((course) => {
                            const isEnrolled = enrolledIds.includes(course.id);
                            const remaining = course.max_students - course.current_students;
                            const isFull = remaining <= 0;

                            return (
                                <TableRow
                                    key={course.id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <StarIcon color={isEnrolled ? 'primary' : 'disabled'} fontSize="small" />
                                            <Typography variant="body1" fontWeight={isEnrolled ? 'bold' : 'normal'}>
                                                {course.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{course.teacher_name}</TableCell>
                                    <TableCell align="center">
                                        <Chip label={`${course.credits} cr`} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={`${remaining} / ${course.max_students}`}
                                            size="small"
                                            color={isFull ? 'error' : remaining <= 5 ? 'warning' : 'success'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography variant="body2">{getDayLabel(course.day_of_week)}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {course.time_slot}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        {isEnrolled ? (
                                            <Chip label="Enrolled" size="small" color="primary" />
                                        ) : isFull ? (
                                            <Chip label="Full" size="small" color="error" />
                                        ) : (
                                            <Chip label="Available" size="small" color="success" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    component={Link}
                                                    to={`/course/${course.id}`}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            {student_id > 0 && (
                                                <>
                                                    {isEnrolled ? (
                                                        <Tooltip title="Drop Course">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDrop(course.id)}
                                                                    disabled={loading}
                                                                >
                                                                    {loading ? (
                                                                        <CircularProgress size={16} />
                                                                    ) : (
                                                                        <LogoutIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title={isFull ? 'Course is full' : 'Enroll'}>
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleEnroll(course.id)}
                                                                    disabled={loading || isFull}
                                                                >
                                                                    {loading ? (
                                                                        <CircularProgress size={16} />
                                                                    ) : (
                                                                        <HowToRegIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </>
                                            )}

                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    color="secondary"
                                                    component={Link}
                                                    to={`/form/${ModelType.course}/${course.id}`}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(course.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {courses.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        No courses available. Click the + button to add a new course.
                    </Typography>
                </Box>
            )}
        </MainCard>
    );
};

export default CourseList;
