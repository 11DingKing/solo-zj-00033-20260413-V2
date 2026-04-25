import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    HowToReg as HowToRegIcon,
    Logout as LogoutIcon,
    Event as EventIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Group as GroupIcon,
    Star as StarIcon
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
    Alert,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent
} from '@mui/material';
import { useIntl } from 'react-intl';
import MainCard from '@/components/cards/MainCard';
import SubCard from '@/components/cards/SubCard';
import { Course, ModelType, Student } from '@/lib/types';
import { useAppDispatch, useAppSelector, setUserAndStudentId } from '@/lib/store';
import {
    enrollCourse,
    dropCourse,
    deleteRowById,
    fetchStudentEnrolledCourses,
    fetchCourseEnrolledStudents,
    fetchCourseById
} from '@/lib/utils/api';

const CourseDetail = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const intl = useIntl();
    const { id } = useParams() as { id: string };

    const student_id = useAppSelector((state) => state.general.student_id);
    const [course, setCourse] = useState<Course | null>(null);
    const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const courseData = await fetchCourseById(Number(id));
            setCourse(courseData);

            const students = await fetchCourseEnrolledStudents(Number(id));
            setEnrolledStudents(students);

            if (student_id > 0) {
                const enrolled = await fetchStudentEnrolledCourses(student_id);
                setEnrolledIds(enrolled.map((c) => c.id));
                setIsEnrolled(enrolled.some((c) => c.id === Number(id)));
            }
        } catch (err: any) {
            setError('Failed to load course data');
        }
    }, [id, student_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEnroll = async () => {
        if (!course) return;
        setLoading(true);
        setError(null);
        try {
            await enrollCourse(course.id, student_id);
            setIsEnrolled(true);
            fetchData();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Enrollment failed';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async () => {
        if (!course) return;
        setLoading(true);
        setError(null);
        try {
            await dropCourse(course.id, student_id);
            setIsEnrolled(false);
            fetchData();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Drop failed';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!course) return;
        await deleteRowById({
            model: ModelType.course,
            id: course.id,
            message: intl.formatMessage({ id: `success.delete.${ModelType.course}` })
        });
        navigate('/course');
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

    const getDayNumber = (day: string) => {
        const dayMap: Record<string, number> = {
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6,
            sunday: 7
        };
        return dayMap[day] || 0;
    };

    if (!course) {
        return (
            <MainCard>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading course...</Typography>
                </Box>
            </MainCard>
        );
    }

    const remaining = course.max_students - course.current_students;
    const isFull = remaining <= 0;

    return (
        <MainCard
            title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                        size="small"
                        component={Link}
                        to="/course"
                        sx={{ mr: 1 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <StarIcon color={isEnrolled ? 'primary' : 'disabled'} />
                    <Typography variant="h5">{course.name}</Typography>
                    {isEnrolled && (
                        <Chip label="Enrolled" size="small" color="primary" />
                    )}
                </Box>
            }
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {student_id > 0 && (
                        <>
                            {isEnrolled ? (
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<LogoutIcon />}
                                    onClick={handleDrop}
                                    disabled={loading}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {loading ? <CircularProgress size={16} /> : 'Drop Course'}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<HowToRegIcon />}
                                    onClick={handleEnroll}
                                    disabled={loading || isFull}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {loading ? <CircularProgress size={16} /> : isFull ? 'Full' : 'Enroll'}
                                </Button>
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
                        <IconButton size="small" color="error" onClick={handleDelete}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            }
        >
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SubCard title="Course Information">
                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <SchoolIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Course Name"
                                    secondary={course.name}
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemIcon>
                                    <PersonIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Teacher"
                                    secondary={course.teacher_name}
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemIcon>
                                    <StarIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Credits"
                                    secondary={`${course.credits} credit(s)`}
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemIcon>
                                    <EventIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Schedule"
                                    secondary={
                                        <>
                                            {getDayLabel(course.day_of_week)}
                                            <br />
                                            <Typography component="span" variant="caption" color="text.secondary">
                                                {course.time_slot}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemIcon>
                                    <GroupIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Enrollment"
                                    secondary={
                                        <Box>
                                            <Chip
                                                label={`${course.current_students} / ${course.max_students}`}
                                                size="small"
                                                color={isFull ? 'error' : remaining <= 5 ? 'warning' : 'success'}
                                                sx={{ mt: 0.5 }}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                {remaining} spots remaining
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </List>
                    </SubCard>

                    {course.description && (
                        <SubCard title="Description" sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {course.description}
                            </Typography>
                        </SubCard>
                    )}
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <SubCard
                        title={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GroupIcon />
                                <Typography variant="h6">
                                    Enrolled Students ({enrolledStudents.length})
                                </Typography>
                            </Box>
                        }
                    >
                        {enrolledStudents.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined">
                                <Table sx={{ minWidth: 300 }} size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Student Name
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Grade
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Phone
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {enrolledStudents.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                hover
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    dispatch(
                                                        setUserAndStudentId({
                                                            user_id: student.teacher_id,
                                                            student_id: student.id
                                                        })
                                                    );
                                                    navigate(`/view/${student.id}`);
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {student.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={student.grade} size="small" />
                                                </TableCell>
                                                <TableCell>{student.phone}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <GroupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body1" color="text.secondary">
                                    No students enrolled yet.
                                </Typography>
                            </Box>
                        )}
                    </SubCard>
                </Grid>
            </Grid>
        </MainCard>
    );
};

export default CourseDetail;
