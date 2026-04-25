import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowBack as ArrowBackIcon,
    Event as EventIcon,
    Refresh as RefreshIcon,
    School as SchoolIcon
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
    ThemeProvider,
    createTheme
} from '@mui/material';
import MainCard from '@/components/cards/MainCard';
import { Course, DayOfWeek, TimeSlot } from '@/lib/types';
import { useAppSelector } from '@/lib/store';
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

const MySchedule = () => {
    const student_id = useAppSelector((state) => state.general.student_id);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [courseColorMap, setCourseColorMap] = useState<Record<number, { main: string; light: string }>>({});

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

    if (student_id <= 0) {
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
                <Alert severity="info" sx={{ mt: 2 }}>
                    Please select a student from the Students page first to view their schedule.
                </Alert>
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
                    {courses.length > 0 && (
                        <Chip
                            label={`${courses.length} course(s), ${totalCredits} credits`}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Box>
            }
            secondary={
                <IconButton size="small" color="primary" onClick={fetchEnrolledCourses} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
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

export default MySchedule;
