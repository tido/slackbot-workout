const { shuffle, slice, filter, flow, get, map, join, sample, random, zipWith, set } = require('lodash/fp');
const axios = require('axios');
const co = require('co');
const moment = require('moment');

const config = require('./config');
const { callouts, exercises, officeHours } = config;

const sendMessage = message => axios.post(config.webhook, {
  channel: config.channel,
  username: 'Tido Music Workout Bot',
  text: message,
  icon_emoji: ':weight_lifter:',
});

const channelInfoUrl = `https://slack.com/api/channels.info?token=${config.token}&channel=${config.channelId}`;
const userStatusUrl = userId => `https://slack.com/api/users.getPresence?token=${config.token}&user=${userId}`;

const wait = minutes => done => setTimeout(done, minutes * 60 * 1000);
const pickParticipants = flow(
  shuffle,
  slice(0, callouts.numPeople),
  map(id => `<@${id}>`),
  join(' ')
);

pickExercise = flow(
  shuffle,
  sample
);

co(function* () {
  yield sendMessage('ok, are you ready to pump?!');

  while (true) {
    const { data: channelInfo } = yield axios.get(channelInfoUrl);
    console.log(channelInfo);
    const { members } = channelInfo.channel;
    const memberStatusRequests = flow(
      map(userStatusUrl),
      map(url => axios.get(url).then(get('data')))
    )(members);
    const memberStatuses = yield memberStatusRequests;
    const onlineMembers = flow(
      zipWith(set('id'), members),
      filter({ presence: 'active' }),
      map('id')
    )(memberStatuses)

    console.log(onlineMembers);

    const participants = pickParticipants(onlineMembers);
    console.log('picked participants', participants);

    const {
      minReps,
      maxReps,
      name,
      units,
    } = pickExercise(exercises);
    console.log('picked exercise', name);

    const message = `${participants} - ${random(minReps, maxReps)} ${units} ${name} NOW PLEASE!`;
    yield sendMessage(message);
    console.log('sent message', message);

    const minutesToWait = random(callouts.minutesBetween.min, callouts.minutesBetween.max);
    const nextRunTime = moment().add(minutesToWait, 'minutes');

    if (nextRunTime.hours() > officeHours.end) {
      const outOfHoursWaitTime = (officeHours.begin + 24 - officeHours.end) * 60
      console.log(`out of hours so waiting for ${outOfHoursWaitTime} minutes`);
      yield wait(outOfHoursWaitTime);
    }
    console.log(`next excersie in ${minutesToWait} minutes`);
    yield wait(minutesToWait);
  }
})
.catch(console.error);
