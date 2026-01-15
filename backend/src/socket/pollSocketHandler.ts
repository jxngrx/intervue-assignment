import {
  Server as SocketServer,
  Socket,
} from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../types/socket';
import PollService from '../services/PollService';
import VoteService from '../services/VoteService';
import TimerService from '../services/TimerService';
import StateService from '../services/StateService';

type PollSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type PollIO = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Store active timer intervals
const timerIntervals = new Map<string, NodeJS.Timeout>();

export const setupPollSocketHandlers = (io: PollIO, socket: PollSocket): void => {
  // Student joins with name
  socket.on('student:join', async (data) => {
    try {
      const { studentId, name } = data;
      if (!studentId || !name) {
        socket.emit('error', { message: 'Student ID and name are required' });
        return;
      }

      socket.data.studentId = studentId;
      socket.data.role = 'student';

      console.log(`👤 Student joined: ${name} (${studentId})`);

      // Send current state if there's an active poll
      const state = await StateService.getStudentState(studentId);
      socket.emit('state:sync', state);
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to join' });
    }
  });

  // Teacher creates a poll
  socket.on('poll:create', async (data) => {
    try {
      const { question, options, duration } = data;

      if (!question || !options || !duration) {
        socket.emit('error', { message: 'Question, options, and duration are required' });
        return;
      }

      // Check if new poll can be created
      const canCreate = await PollService.canCreateNewPoll();
      if (!canCreate.canCreate) {
        socket.emit('error', { message: canCreate.reason || 'Cannot create new poll' });
        return;
      }

      const poll = await PollService.createPoll(question, options, duration);

      socket.data.role = 'teacher';

      // Broadcast to all clients
      io.emit('poll:created', poll);

      console.log(`📊 Poll created: ${poll.question}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to create poll' });
    }
  });

  // Teacher activates a poll
  socket.on('poll:activate', async (pollId) => {
    try {
      if (!pollId) {
        socket.emit('error', { message: 'Poll ID is required' });
        return;
      }

      const poll = await PollService.activatePoll(pollId);
      const timerState = await TimerService.getTimerState(pollId);

      socket.data.role = 'teacher';

      // Broadcast to all clients
      io.emit('poll:activated', {
        poll: {
          _id: poll.id,
          question: poll.question,
          options: poll.options,
          status: poll.status,
          duration: poll.duration,
          startTime: poll.startTime,
          endTime: poll.endTime,
        },
        timerState,
      });

      // Start timer interval for this poll
      startPollTimer(io, pollId, poll.duration, poll.startTime!);

      console.log(`▶️ Poll activated: ${poll.question}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to activate poll' });
    }
  });

  // Student submits a vote
  socket.on('vote:submit', async (data) => {
    try {
      const { pollId, studentId, optionIndex } = data;

      if (!pollId || !studentId || optionIndex === undefined) {
        socket.emit('error', { message: 'Poll ID, student ID, and option index are required' });
        return;
      }

      await VoteService.submitVote(pollId, studentId, optionIndex);
      const voteCounts = await VoteService.getVoteCounts(pollId);

      // Broadcast updated vote counts to all clients
      io.emit('vote:received', {
        voteCounts,
        totalVotes: voteCounts.totalVotes,
      });

      console.log(`✅ Vote submitted: ${studentId} voted for option ${optionIndex}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to submit vote' });
    }
  });

  // Request current state (for reconnection)
  socket.on('state:request', async (data) => {
    try {
      const { type, studentId } = data;

      if (type === 'teacher') {
        const state = await StateService.getTeacherState();
        socket.emit('state:sync', state);
      } else if (type === 'student') {
        if (!studentId) {
          socket.emit('error', { message: 'Student ID is required for student state' });
          return;
        }
        const state = await StateService.getStudentState(studentId);
        socket.emit('state:sync', state);

        // If there's an active poll, restart timer updates
        if (state.activePoll && state.timerState?.isActive) {
          const poll = await PollService.getPollById(state.activePoll._id);
          if (poll.startTime) {
            startPollTimer(io, poll.id, poll.duration, poll.startTime);
          }
        }
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to get state' });
    }
  });
};

/**
 * Start a timer interval for a poll that broadcasts updates every second
 */
const startPollTimer = (
  io: PollIO,
  pollId: string,
  _duration: number,
  _startTime: Date
): void => {
  // Clear any existing timer for this poll
  const existingTimer = timerIntervals.get(pollId);
  if (existingTimer) {
    clearInterval(existingTimer);
  }

  const timer = setInterval(async () => {
    try {
      const timerState = await TimerService.getTimerState(pollId);

      // Broadcast timer update
      io.emit('timer:update', timerState);

      // If poll expired, complete it and broadcast results
      if (!timerState.isActive && timerState.remaining === 0) {
        await PollService.completePoll(pollId);
        const pollWithResults = await PollService.getPollWithResults(pollId);

        io.emit('poll:completed', {
          poll: pollWithResults,
          results: pollWithResults.results,
        });

        // Clear timer
        clearInterval(timer);
        timerIntervals.delete(pollId);

        console.log(`⏰ Poll completed: ${pollId}`);
      }
    } catch (error) {
      console.error('Error in poll timer:', error);
      clearInterval(timer);
      timerIntervals.delete(pollId);
    }
  }, 1000); // Update every second

  timerIntervals.set(pollId, timer);
};
