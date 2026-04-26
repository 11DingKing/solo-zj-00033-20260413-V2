import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowBack as ArrowBackIcon,
    Event as EventIcon,
    Refresh as RefreshIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    ChevronRight as ChevronRightIcon
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
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import MainCard from '@/components/cards/MainCard';
import SubCard from '@/components/cards/SubCard';
import { Course, DayOfWeek, TimeSlot, Student, ModelType } from '@/lib/types';
import { useAppSelector, useAppDispatch, fetchRowsByModel, setUserAndStudentId } from '@/lib/store';
import { fetchStudentEnrolledCourses } from '@/lib/utils/api';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' }
];

const TIME_SLOTS: { key: TimeSlot; label: string }[] = [
    { key: '08:00-09:40', label: '08:00 - 09:40' },
    { key: '10:00-11:40', label: '10:00 - 11:40' },
    { key: '14:00-15:40', label: '14:00 - 15:40' },
    { key: '16:00-17:40', label: '16:00 - 17:40' },
    { key: '19:00-20:40', label: '19:00 - 20:40' }
];

const COURSE_COLORS = [
    { main: '#1976d2', light: '#e3f2fd' },
    { main: '#388e3c', light: '#e8f5e9' },
    { main: '#d32f2f', light: '#ffebee' },
    { main: '#f57c00', light: '#fff3e0' },
    { main: '#7b1fa2', light: '#f3e5f5' },
    { main: '#00796b', light: '#e0f2f1' },
    { main: '#c2185b', light: '#fce4ec' },
    { main: '#5d4037', light: '#efebe9' }
];

const StudentSelector = ({ onSelect }: { onSelect: (student: Student) => void }) => {
    const dispatch = useAppDispatch();
    const students: Student[] = useAppSelector((state) => state.general.models[ModelType.student]);
    const [loading, setLoading] = useState(false);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            dispatch(fetchRowsByModel({ model: ModelType.student, data: {} }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        if (students.length === 0) {
            fetchStudents();
        }
    }, [students.length, fetchStudents]);

    const handleSelectStudent = (student: Student) => {
        dispatch(
            setUserAndStudentId({
                user_id: student.teacher_id,
                student_id: student.id
            })
        );
        onSelect(student);
    };

    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                <SubCard
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon />
                            <Typography variant="h6">Select a Student</Typography>
                        </Box>
                    }
                >
                    {loading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress />
                            <Typography sx={{ mt: 2 }}>Loading students...</Typography>
                        </Box>
                    ) : students.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body1" color="text.secondary">
                                No students found.
                            </Typography>
                        </Box>
                    ) : (
                        <List component="nav" sx={{ width: '100%' }}>
                            {students.map((student, index) => (
                                <div key={student.id}>
                                    {index > 0 && <Divider variant="inset" component="li" />}
                                    <ListItemButton
                                        onClick={() => handleSelectStudent(student)}
                                        sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                                    >
                                        <ListItemIcon>
                                            <PersonIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" fontWeight="medium">
                                                    {student.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary">
                                                    Grade: {student.grade} | Phone: {student.phone}
                                                </Typography>
                                            }
                                        />
                                        <ChevronRightIcon color="action" />
                                    </ListItemButton>
                                </div>
                            ))}
                        </List>
                    )}
                </SubCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 7 }}>
                <SubCard
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon />
                            <Typography variant="h6">How It Works</Typography>
                        </Box>
                    }
                >
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="1. Select a Student"
                                secondary="Choose a student from the list to view their schedule"
                            />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText
                                primary="2. View Schedule"
                                secondary="See all courses the student is enrolled in, organized by day and time"
                            />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText
                                primary="3. Manage Enrollment"
                                secondary="Go to Course List to enroll or drop courses for the selected student"
                            />
                        </ListItem>
                    </List>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            component={Link}
                            to="/course"
                            startIcon={<EventIcon />}
                            sx={{ textTransform: 'none' }}
                        >
                            Go to Course List
                        </Button>
                    </Box>
                </SubCard>
            </Grid>
        </Grid>
    );
};

const ScheduleView = () => {
    const dispatch = useAppDispatch();
    const student_id = useAppSelector((state) => state.general.student_id);
    const students: Student[] = useAppSelector((state) => state.general.models[ModelType.student]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [courseColorMap, setCourseColorMap] = useState<Record<number, { main: string; light: string }>>({});

    const currentStudent = students.find((s) => s.id === student_id);

    const fetchEnrolledCourses = useCallback(async () => {
        if (student_id <= 0) {
            setCourses([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const enrolled = await fetchStudentEnrolledCourses(student_id);
            setCourses(enrolled);

            const colorMap: Record<number, { main: string; light: string }> = {};
            enrolled.forEach((course, index) => {
                colorMap[course.id] = COURSE_COLORS[index % COURSE_COLORS.length];
            });
            setCourseColorMap(colorMap);
        } catch {
            setError('Failed to load your schedule');
        } finally {
            setLoading(false);
        }
    }, [student_id]);

    useEffect(() => {
        fetchEnrolledCourses();
    }, [fetchEnrolledCourses]);

    const getCoursesAtTime = (day: DayOfWeek, timeSlot: TimeSlot): Course[] => {
        return courses.filter(
            (course) => course.day_of_week === day && course.time_slot === timeSlot
        );
    };

    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

    const handleClearSelection = () => {
        dispatch(
            setUserAndStudentId({
                user_id: 0,
                student_id: 0
            })
        );
    };

    return (
        <MainCard
            title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size="small" component={Link} to="/course" sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <EventIcon />
                    <Typography variant="h5">My Schedule</Typography>
                    {currentStudent && (
                        <Chip
                            label={`${currentStudent.name} (Grade ${currentStudent.grade})`}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                        />
                    )}
                    {courses.length > 0 && (
                        <Chip
                            label={`${courses.length} course(s), ${totalCredits} credits`}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Box>
            }
            secondary={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={handleClearSelection}
                        startIcon={<PersonIcon />}
                        sx={{ textTransform: 'none' }}
                    >
                        Switch Student
                    </Button>
                    <IconButton size="small" color="primary" onClick={fetchEnrolledCourses} disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                    </IconButton>
                </Box>
            }
        >
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading schedule...</Typography>
                </Box>
            ) : courses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No courses enrolled yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Go to the Course List to enroll in courses.
                    </Typography>
                    <Button variant="contained" component={Link} to="/course">
                        Browse Courses
                    </Button>
                </Box>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table sx={{ minWidth: 650 }} aria-label="schedule table">
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            fontWeight: 'bold',
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            width: '15%'
                                        }}
                                    >
                                        Time
                                    </TableCell>
                                    {DAYS_OF_WEEK.map((day) => (
                                        <TableCell
                                            key={day.key}
                                            align="center"
                                            sx={{
                                                fontWeight: 'bold',
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                width: '17%'
                                            }}
                                        >
                                            {day.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {TIME_SLOTS.map((timeSlot) => (
                                    <TableRow key={timeSlot.key} hover>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 'medium',
                                                bgcolor: 'grey.50',
                                                verticalAlign: 'top'
                                            }}
                                        >
                                            <Box sx={{ py: 1 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {timeSlot.label}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        {DAYS_OF_WEEK.map((day) => {
                                            const slotCourses = getCoursesAtTime(day.key, timeSlot.key);
                                            return (
                                                <TableCell
                                                    key={`${day.key}-${timeSlot.key}`}
                                                    align="center"
                                                    sx={{
                                                        padding: 0.5,
                                                        verticalAlign: 'top',
                                                        minHeight: 100
                                                    }}
                                                >
                                                    {slotCourses.length > 0 ? (
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 0.5
                                                            }}
                                                        >
                                                            {slotCourses.map((course) => {
                                                                const colors =
                                                                    courseColorMap[course.id] || COURSE_COLORS[0];
                                                                return (
                                                                    <Tooltip
                                                                        key={course.id}
                                                                        title={
                                                                            <>
                                                                                <Typography variant="body2">
                                                                                    {course.name}
                                                                                </Typography>
                                                                                <Typography variant="caption">
                                                                                    Teacher: {course.teacher_name}
                                                                                </Typography>
                                                                                <br />
                                                                                <Typography variant="caption">
                                                                                    {course.credits} credit(s)
                                                                                </Typography>
                                                                            </>
                                                                        }
                                                                    >
                                                                        <Box
                                                                            component={Link}
                                                                            to={`/course/${course.id}`}
                                                                            sx={{
                                                                                p: 1,
                                                                                borderRadius: 1,
                                                                                bgcolor: colors.light,
                                                                                borderLeft: `4px solid ${colors.main}`,
                                                                                textDecoration: 'none',
                                                                                color: 'inherit',
                                                                                transition: 'all 0.2s',
                                                                                '&:hover': {
                                                                                    bgcolor: colors.main,
                                                                                    color: 'white',
                                                                                    '& .course-name': {
                                                                                        color: 'white'
                                                                                    },
                                                                                    '& .course-teacher': {
                                                                                        color: 'rgba(255,255,255,0.8)'
                                                                                    }
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                className="course-name"
                                                                                variant="body2"
                                                                                fontWeight="bold"
                                                                                sx={{ color: colors.main }}
                                                                            >
                                                                                {course.name}
                                                                            </Typography>
                                                                            <Typography
                                                                                className="course-teacher"
                                                                                variant="caption"
                                                                                color="text.secondary"
                                                                            >
                                                                                {course.teacher_name}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Tooltip>
                                                                );
                                                            })}
                                                        </Box>
                                                    ) : null}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Course Legend ({courses.length} total)
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {courses.map((course) => {
                                const colors = courseColorMap[course.id] || COURSE_COLORS[0];
                                return (
                                    <Chip
                                        key={course.id}
                                        label={
                                            <>
                                                {course.name} ({course.credits} cr)
                                            </>
                                        }
                                        size="small"
                                        component={Link as any}
                                        to={`/course/${course.id}`}
                                        sx={{
                                            bgcolor: colors.light,
                                            color: colors.main,
                                            border: `1px solid ${colors.main}`,
                                            '&:hover': {
                                                bgcolor: colors.main,
                                                color: 'white'
                                            }
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                            label={`Total Courses: ${courses.length}`}
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`Total Credits: ${totalCredits}`}
                            color="secondary"
                            variant="outlined"
                        />
                    </Box>
                </>
            )}
        </MainCard>
    );
};

const MySchedule = () => {
    const dispatch = useAppDispatch();
    const student_id = useAppSelector((state) => state.general.student_id);
    const students: Student[] = useAppSelector((state) => state.general.models[ModelType.student]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(fetchRowsByModel({ model: ModelType.student, data: {} }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        if (students.length === 0) {
            fetchStudents();
        }
    }, [students.length, fetchStudents]);

    useEffect(() => {
        if (student_id <= 0 && students.length > 0) {
            const firstStudent = students[0];
            dispatch(
                setUserAndStudentId({
                    user_id: firstStudent.teacher_id,
                    student_id: firstStudent.id
                })
            );
            setSelectedStudent(firstStudent);
        }
    }, [student_id, students, dispatch]);

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
    };

    if (student_id <= 0) {
        if (loading) {
            return (
                <MainCard
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" component={Link} to="/course" sx={{ mr: 1 }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <EventIcon />
                            <Typography variant="h5">My Schedule</Typography>
                        </Box>
                    }
                >
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }}>Loading students...</Typography>
                    </Box>
                </MainCard>
            );
        }

        if (students.length === 0) {
            return (
                <MainCard
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" component={Link} to="/course" sx={{ mr: 1 }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <EventIcon />
                            <Typography variant="h5">My Schedule</Typography>
                        </Box>
                    }
                >
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        No students found. Please add students first.
                    </Alert>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            No students available.
                        </Typography>
                    </Box>
                </MainCard>
            );
        }

        return (
            <MainCard
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" component={Link} to="/course" sx={{ mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <EventIcon />
                        <Typography variant="h5">My Schedule</Typography>
                    </Box>
                }
            >
                <Alert severity="info" sx={{ mb: 3 }}>
                    Select a student below to view their schedule. You can also go to the Students page and click
                    on a student.
                </Alert>
                <StudentSelector onSelect={handleSelectStudent} />
            </MainCard>
        );
    }

    return <ScheduleView />;
};

export default MySchedule;
