import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  List,
  ListItem,
  Tooltip,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as DurationIcon,
} from '@mui/icons-material';
import { useState } from 'react';

const TASK_TYPE_COLORS = {
  inference: 'primary',
  training: 'secondary',
  evaluation: 'info',
  preprocessing: 'warning',
  postprocessing: 'success',
  default: 'default',
};

const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  const stringified = typeof text === 'string' ? text : JSON.stringify(text);
  if (stringified.length <= maxLength) return stringified;
  return `${stringified.substring(0, maxLength)}...`;
};

const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
};

const TaskItem = ({ task }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    task_type,
    success,
    duration_ms,
    input,
    output,
    timestamp,
    error_message,
  } = task;

  const chipColor = TASK_TYPE_COLORS[task_type] || TASK_TYPE_COLORS.default;

  return (
    <Card
      sx={{
        mb: 1,
        borderLeft: 4,
        borderColor: success ? 'success.main' : 'error.main',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Chip
              label={task_type || 'unknown'}
              color={chipColor}
              size="small"
              sx={{ fontWeight: 500, textTransform: 'capitalize' }}
            />
            <Tooltip title={success ? 'Success' : 'Failed'}>
              {success ? (
                <SuccessIcon color="success" fontSize="small" />
              ) : (
                <FailIcon color="error" fontSize="small" />
              )}
            </Tooltip>
            <Box display="flex" alignItems="center" gap={0.5}>
              <DurationIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDuration(duration_ms)}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {timestamp && (
              <Typography variant="caption" color="text.secondary">
                {new Date(timestamp).toLocaleTimeString()}
              </Typography>
            )}
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'collapse' : 'expand'}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Box mt={1}>
          <Typography variant="body2" color="text.secondary" component="div">
            <strong>Input:</strong> {truncateText(input, expanded ? 500 : 100)}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div" mt={0.5}>
            <strong>Output:</strong> {truncateText(output, expanded ? 500 : 100)}
          </Typography>
        </Box>

        <Collapse in={expanded}>
          {error_message && (
            <Box
              mt={1}
              p={1}
              bgcolor="error.light"
              borderRadius={1}
              sx={{ opacity: 0.9 }}
            >
              <Typography variant="body2" color="error.contrastText">
                <strong>Error:</strong> {error_message}
              </Typography>
            </Box>
          )}
          {input && (
            <Box mt={1}>
              <Typography variant="caption" color="text.secondary">
                Full Input:
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: '0.75rem',
                }}
              >
                {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
              </Box>
            </Box>
          )}
          {output && (
            <Box mt={1}>
              <Typography variant="caption" color="text.secondary">
                Full Output:
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: '0.75rem',
                }}
              >
                {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
              </Box>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

TaskItem.propTypes = {
  task: PropTypes.shape({
    task_type: PropTypes.string,
    success: PropTypes.bool,
    duration_ms: PropTypes.number,
    input: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    output: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error_message: PropTypes.string,
  }).isRequired,
};

const TaskFeed = ({ task_executions = [], maxHeight = 600 }) => {
  if (!task_executions || task_executions.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={200}
        bgcolor="grey.50"
        borderRadius={2}
      >
        <Typography variant="body1" color="text.secondary">
          No task executions to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxHeight,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: 8,
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'grey.100',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'grey.400',
          borderRadius: 4,
          '&:hover': {
            bgcolor: 'grey.500',
          },
        },
      }}
    >
      <List disablePadding>
        {task_executions.map((task, index) => (
          <ListItem key={task.id || index} disablePadding sx={{ display: 'block' }}>
            <TaskItem task={task} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

TaskFeed.propTypes = {
  task_executions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      task_type: PropTypes.string,
      success: PropTypes.bool,
      duration_ms: PropTypes.number,
      input: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      output: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      error_message: PropTypes.string,
    })
  ),
  maxHeight: PropTypes.number,
};

export default TaskFeed;
