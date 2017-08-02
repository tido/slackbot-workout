const {
  shuffle, slice, flow, map,
  join, sample, random, set,
} = require('lodash/fp');
const co = require('co');
const moment = require('moment');

const config = require('./config');
const getOnlineMembers = require('./getOnlineMembers');
const Store = require('./Store');

const { callouts, exercises, officeHours } = config;

const store = new Store();

const pickParticipants = flow(
  shuffle,
  slice(0, callouts.numPeople)
);

const pickExercise = flow(
  shuffle,
  sample,
  exercise => set('reps', random(exercise.minReps, exercise.maxReps), exercise)
);

const getMinutesToWait = () => {
  const desiredMinutesToWait = random(
    callouts.minutesBetween.min,
    callouts.minutesBetween.max
  );

  const nextRunTime = moment().add(desiredMinutesToWait, 'minutes');

  return nextRunTime.hours() > officeHours.end
    ? (officeHours.begin + 24 - officeHours.end) * 60
    : desiredMinutesToWait;
};

co(function* () {
  yield store.dispatch({
    type: 'start'
  });

  while (true) {
    const onlineMembers = yield getOnlineMembers();

    yield store.dispatch({
      type: 'callout',
      participants: pickParticipants(onlineMembers),
      exercise: pickExercise(exercises),
    });

    yield store.dispatch({
      type: 'waiting',
      minutes: getMinutesToWait(),
    });

    console.log(store.getStats());
  }
})
.catch(console.error);
