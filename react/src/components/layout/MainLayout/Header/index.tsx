import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Box, Divider, Button, Chip, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import ProfileSection from './ProfileSection';
import config from '@/lib/utils/config';
import { useAppSelector } from '@/lib/store';

const Header = () => {
    const student_id = useAppSelector((state) => state.general.student_id);

    return (
        <>
            <Button
                variant="contained"
                color="secondary"
                startIcon={<HomeIcon />}
                component={Link}
                to={config.defaultPath}
                sx={{ textTransform: 'none' }}
            >
                <FormattedMessage id="home" />
            </Button>

            <Button
                variant="outlined"
                color="primary"
                startIcon={<EventIcon />}
                component={Link}
                to="/course"
                sx={{ ml: 1, textTransform: 'none' }}
            >
                Courses
            </Button>

            <Button
                variant="outlined"
                color="secondary"
                startIcon={<SchoolIcon />}
                component={Link}
                to="/my-schedule"
                sx={{ ml: 1, textTransform: 'none' }}
            >
                My Schedule
            </Button>

            <Box sx={{ flexGrow: 1 }} />

            {student_id > 0 && (
                <Tooltip title="Current Viewing Student">
                    <Chip
                        label={`Student: ${student_id}`}
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                    />
                </Tooltip>
            )}

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <ProfileSection />
        </>
    );
};

export default Header;
