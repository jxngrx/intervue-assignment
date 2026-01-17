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

// Store connected students
const connectedStudents = new Map<string, { studentId: string; name: string; socketId: string }>();

// Store active teacher socket ID
let activeTeacherSocketId: string | null = null;

// Helper function to broadcast participants list with numbered duplicate names
const broadcastParticipants = (io: PollIO) => {
  const allStudents = Array.from(connectedStudents.values());

  // Count occurrences of each name
  const nameCounts = new Map<string, number>();
  allStudents.forEach(({ name }) => {
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  });

  // Track how many times we've seen each name (for numbering)
  const nameOccurrences = new Map<string, number>();

  // Create participants list with numbered names for duplicates
  const participants = allStudents.map(({ studentId, name }) => {
    const count = nameCounts.get(name) || 1;
    let displayName = name;

    // If name appears more than once, add number to distinguish
    if (count > 1) {
      const occurrence = (nameOccurrences.get(name) || 0) + 1;
      nameOccurrences.set(name, occurrence);

      // First occurrence keeps original name, subsequent ones get numbered
      if (occurrence > 1) {
        displayName = `${name} #${occurrence}`;
      }
    }

    return {
      studentId,
      name: displayName,
    };
  });

  io.emit('participants:update', participants);
};

export const setupPollSocketHandlers = (io: PollIO, socket: PollSocket): void => {
  // Teacher sets their role
  socket.on('teacher:set', () => {
    // Check if there's already an active teacher
    if (activeTeacherSocketId && activeTeacherSocketId !== socket.id) {
      const activeTeacher = io.sockets.sockets.get(activeTeacherSocketId);
      if (activeTeacher && activeTeacher.connected) {
        socket.emit('error', { message: 'Another teacher is already active. Only one teacher can be active at a time.' });
        return;
      } else {
        // Previous teacher disconnected, clear the reference
        activeTeacherSocketId = null;
      }
    }

    socket.data.role = 'teacher';
    activeTeacherSocketId = socket.id;

    // Send current participants list to teacher immediately with proper formatting
    const allStudents = Array.from(connectedStudents.values());

    // Sort students by name and then by socketId to ensure consistent numbering
    allStudents.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return a.socketId.localeCompare(b.socketId);
    });

    const nameCounts = new Map<string, number>();
    const nameOccurrences = new Map<string, number>();

    const participants = allStudents.map(({ studentId, name }) => {
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
      let displayName = name;

      if (nameCounts.get(name)! > 1) {
        const occurrence = (nameOccurrences.get(name) || 0) + 1;
        nameOccurrences.set(name, occurrence);
        displayName = `${name} #${occurrence}`;
      }
      return { studentId, name: displayName };
    });

    socket.emit('participants:update', participants);
    console.log(`👨‍🏫 Teacher connected: ${socket.id} - ${participants.length} participants`);
  });

  // Student joins with name
  socket.on('student:join', async (data) => {
    try {
      const { studentId, name } = data;
      if (!studentId || !name) {
        socket.emit('error', { message: 'Student ID and name are required' });
        return;
      }

      socket.data.studentId = studentId;
      socket.data.studentName = name;
      socket.data.role = 'student';

      // Store connected student
      connectedStudents.set(socket.id, { studentId, name, socketId: socket.id });

      console.log(`👤 Student joined: ${name} (${studentId})`);

      // Broadcast updated participants list
      broadcastParticipants(io);

      // Send current state if there's an active poll (for late-joining students)
      const state = await StateService.getStudentState(studentId);
      socket.emit('state:sync', state);

      // If there's an active poll, also emit poll:activated to ensure student sees it
      if (state.activePoll && state.timerState?.isActive) {
        const poll = await PollService.getPollById(state.activePoll._id);
        const timerState = await TimerService.getTimerState(poll.id);
        socket.emit('poll:activated', {
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
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to join' });
    }
  });

  // Teacher logs out - end session and kick out all students
  socket.on('teacher:logout', () => {
    try {
      if (socket.data.role !== 'teacher' || activeTeacherSocketId !== socket.id) {
        socket.emit('error', { message: 'Only the active teacher can logout' });
        return;
      }

      // Kick out all connected students
      const studentsToKick = Array.from(connectedStudents.values());
      studentsToKick.forEach(({ socketId }) => {
        const studentSocket = io.sockets.sockets.get(socketId);
        if (studentSocket) {
          studentSocket.emit('student:kicked');
          studentSocket.disconnect(true);
        }
      });

      // Clear all students from the map
      connectedStudents.clear();

      // Clear active teacher
      activeTeacherSocketId = null;

      // Clear all timer intervals
      timerIntervals.forEach((interval) => clearInterval(interval));
      timerIntervals.clear();

      console.log(`👋 Teacher logged out: ${socket.id} - Session ended, ${studentsToKick.length} students disconnected`);

      // Disconnect teacher socket
      socket.disconnect(true);
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to logout' });
    }
  });

  // Handle disconnect - remove student from participants or teacher
  socket.on('disconnect', () => {
    if (socket.data.role === 'student' && socket.data.studentId) {
      connectedStudents.delete(socket.id);
      broadcastParticipants(io);
      console.log(`👤 Student left: ${socket.data.studentName} (${socket.data.studentId})`);
    } else if (socket.data.role === 'teacher' && activeTeacherSocketId === socket.id) {
      // Teacher disconnected (tab closed, etc.) - end session and kick out all students
      const studentsToKick = Array.from(connectedStudents.values());
      studentsToKick.forEach(({ socketId }) => {
        const studentSocket = io.sockets.sockets.get(socketId);
        if (studentSocket) {
          studentSocket.emit('student:kicked');
          studentSocket.disconnect(true);
        }
      });

      connectedStudents.clear();
      activeTeacherSocketId = null;

      // Clear all timer intervals
      timerIntervals.forEach((interval) => clearInterval(interval));
      timerIntervals.clear();

      console.log(`👋 Teacher disconnected: ${socket.id} - Session ended, ${studentsToKick.length} students disconnected`);
    }
  });

  // Teacher kicks out a student
  socket.on('student:kick', (data) => {
    try {
      const { studentId } = data;

      if (!studentId) {
        socket.emit('error', { message: 'Student ID is required' });
        return;
      }

      // Check if the requester is a teacher
      if (socket.data.role !== 'teacher') {
        socket.emit('error', { message: 'Only teachers can kick out students' });
        return;
      }

      // Find the student's socket
      let studentSocketId: string | null = null;
      for (const [socketId, student] of connectedStudents.entries()) {
        if (student.studentId === studentId) {
          studentSocketId = socketId;
          break;
        }
      }

      if (studentSocketId) {
        const studentSocket = io.sockets.sockets.get(studentSocketId);
        if (studentSocket) {
          // Remove from participants list
          connectedStudents.delete(studentSocketId);
          broadcastParticipants(io);

          // Notify the student and disconnect them
          studentSocket.emit('student:kicked');
          studentSocket.disconnect(true);

          console.log(`🚫 Student kicked out: ${studentId}`);
        }
      } else {
        socket.emit('error', { message: 'Student not found' });
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to kick out student' });
    }
  });

  // Chat message handler
  socket.on('chat:send', (data) => {
    try {
      const { studentId, name, message } = data;

      if (!studentId || !name || !message) {
        socket.emit('error', { message: 'Student ID, name, and message are required' });
        return;
      }

      // Broadcast chat message to all clients
      io.emit('chat:message', {
        studentId,
        name,
        message: message.trim(),
        timestamp: new Date(),
      });

      console.log(`💬 Chat: ${name}: ${message}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to send message' });
    }
  });

  // Teacher creates a poll (auto-activates immediately)
  socket.on('poll:create', async (data) => {
    try {
      const { question, options, duration } = data;

      if (!question || !options || !duration) {
        socket.emit('error', { message: 'Question, options, and duration are required' });
        return;
      }

      // Get connected students count for canCreateNewPoll check
      const connectedStudentsCount = connectedStudents.size;
      const canCreate = await PollService.canCreateNewPoll(connectedStudentsCount);
      if (!canCreate.canCreate) {
        socket.emit('error', { message: canCreate.reason || 'Cannot create new poll' });
        return;
      }

      // Create the poll
      const poll = await PollService.createPoll(question, options, duration);

      socket.data.role = 'teacher';

      // Broadcast updated participants list
      broadcastParticipants(io);

      // Auto-activate the poll immediately
      const activatedPoll = await PollService.activatePoll(poll.id);
      const timerState = await TimerService.getTimerState(poll.id);

      // Broadcast poll activation to all clients (this shows it to students immediately)
      // Use io.emit to ensure all connected clients receive it
      io.emit('poll:activated', {
        poll: {
          _id: activatedPoll.id,
          question: activatedPoll.question,
          options: activatedPoll.options,
          status: activatedPoll.status,
          duration: activatedPoll.duration,
          startTime: activatedPoll.startTime,
          endTime: activatedPoll.endTime,
        },
        timerState,
      });

      // Start timer interval for this poll
      startPollTimer(io, poll.id, poll.duration, activatedPoll.startTime!);

      console.log(`📊 Poll created and activated: ${poll.question}`);
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

      // Broadcast to all clients using io.emit to ensure all receive it
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

  // Teacher cancels a poll
  socket.on('poll:cancel', async (pollId) => {
    try {
      if (!pollId) {
        socket.emit('error', { message: 'Poll ID is required' });
        return;
      }

      // Check if the requester is a teacher
      if (socket.data.role !== 'teacher') {
        socket.emit('error', { message: 'Only teachers can cancel polls' });
        return;
      }

      const poll = await PollService.cancelPoll(pollId);

      // Clear timer interval for cancelled poll
      const existingTimer = timerIntervals.get(pollId);
      if (existingTimer) {
        clearInterval(existingTimer);
        timerIntervals.delete(pollId);
      }

      // Broadcast poll cancellation to all clients
      io.emit('poll:cancelled', {
        pollId: poll.id,
      });

      // Update teacher state
      const connectedStudentsCount = connectedStudents.size;
      const teacherState = await StateService.getTeacherState(connectedStudentsCount);
      if (activeTeacherSocketId) {
        io.to(activeTeacherSocketId).emit('state:sync', teacherState);
      }

      console.log(`🚫 Poll cancelled: ${poll.question}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to cancel poll' });
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

      // Check if all students have voted and auto-complete poll
      const connectedStudentsCount = connectedStudents.size;
      if (connectedStudentsCount > 0 && voteCounts.totalVotes >= connectedStudentsCount) {
        // All students have voted - auto-complete the poll
        const poll = await PollService.getPollById(pollId);
        if (poll.status === 'active') {
          await PollService.completePoll(pollId);
          const pollWithResults = await PollService.getPollWithResults(pollId);

          // Broadcast poll completion to all clients
          io.emit('poll:completed', {
            poll: {
              _id: pollWithResults.id,
              question: pollWithResults.question,
              options: pollWithResults.options,
              status: pollWithResults.status,
              duration: pollWithResults.duration,
              startTime: pollWithResults.startTime,
              endTime: pollWithResults.endTime,
            },
            results: pollWithResults.results,
          });

          // Clear timer interval
          const existingTimer = timerIntervals.get(pollId);
          if (existingTimer) {
            clearInterval(existingTimer);
            timerIntervals.delete(pollId);
          }

          // Update teacher state
          const teacherState = await StateService.getTeacherState(connectedStudentsCount);
          if (activeTeacherSocketId) {
            io.to(activeTeacherSocketId).emit('state:sync', teacherState);
          }

          console.log(`✅ Poll auto-completed: All students voted (${voteCounts.totalVotes}/${connectedStudentsCount})`);
        }
      }

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
        const connectedStudentsCount = connectedStudents.size;
        const state = await StateService.getTeacherState(connectedStudentsCount);
        socket.emit('state:sync', state);

        // Also send participants list when teacher requests state
        const allStudents = Array.from(connectedStudents.values());
        allStudents.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return a.socketId.localeCompare(b.socketId);
        });

        const nameCounts = new Map<string, number>();
        const nameOccurrences = new Map<string, number>();

        const participants = allStudents.map(({ studentId, name }) => {
          nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
          let displayName = name;

          if (nameCounts.get(name)! > 1) {
            const occurrence = (nameOccurrences.get(name) || 0) + 1;
            nameOccurrences.set(name, occurrence);
            displayName = `${name} #${occurrence}`;
          }
          return { studentId, name: displayName };
        });

        socket.emit('participants:update', participants);
        console.log(`📋 Sent participants with state sync: ${participants.length} participants`);
      } else if (type === 'student') {
        if (!studentId) {
          socket.emit('error', { message: 'Student ID is required for student state' });
          return;
        }
        const state = await StateService.getStudentState(studentId);
        socket.emit('state:sync', state);

        // If there's an active poll and student hasn't voted, emit poll:activated to ensure they see it
        if (state.activePoll && state.timerState?.isActive && !state.hasVoted) {
          const poll = await PollService.getPollById(state.activePoll._id);
          const timerState = await TimerService.getTimerState(poll.id);
          socket.emit('poll:activated', {
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

          // Restart timer updates
          if (poll.startTime) {
            startPollTimer(io, poll.id, poll.duration, poll.startTime);
          }
        }
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to get state' });
    }
  });

  // Request participants list
  socket.on('participants:request', () => {
    try {
      // Send current participants list
      // If requester is teacher, send directly to them, otherwise broadcast to all
      if (socket.data.role === 'teacher') {
        const allStudents = Array.from(connectedStudents.values());

        // Sort students by name and then by socketId to ensure consistent numbering
        allStudents.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return a.socketId.localeCompare(b.socketId);
        });

        const nameCounts = new Map<string, number>();
        const nameOccurrences = new Map<string, number>();

        const participants = allStudents.map(({ studentId, name }) => {
          nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
          let displayName = name;

          if (nameCounts.get(name)! > 1) {
            const occurrence = (nameOccurrences.get(name) || 0) + 1;
            nameOccurrences.set(name, occurrence);
            displayName = `${name} #${occurrence}`;
          }
          return { studentId, name: displayName };
        });

        socket.emit('participants:update', participants);
        console.log(`📋 Sent participants list to teacher: ${participants.length} participants`);
      } else {
        // For non-teachers, broadcast to all (though this shouldn't normally happen)
        broadcastParticipants(io);
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to get participants' });
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
