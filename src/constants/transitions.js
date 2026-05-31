// defines the valid state transitions for tasks
const Transitions = {
  TODO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'BLOCKED'],
  IN_REVIEW: ['DONE', 'BLOCKED'],
  BLOCKED: ['TODO', 'IN_PROGRESS'],
  DONE: [], // once completed, it's terminal
};

module.exports = Transitions;
