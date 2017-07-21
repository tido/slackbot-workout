const { shuffle, slice, filter, flow, get, map, join, sample, random } = require('lodash/fp');
const axios = require('axios');
const co = require('co');

const config = require('./config');
const { callouts, exercises } = config;

const sendMessage = message => axios.post(config.webhook, {
  channel: config.channel,
  username: 'Tido Music Workout Bot',
  text: message,
  icon_emoji: ':weight_lifter:',
});

const channelInfoUrl = `https://slack.com/api/channels.info?token=${config.token}&channel=${config.channelId}`;

const wait = minutes => done => setTimeout(done, minutes * 60 * 1000);
const pickParticipants = flow(
  get('channel.members'),
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

  while(true) {
    const { data: channelInfo } = yield axios.get(channelInfoUrl);
    const participants = pickParticipants(channelInfo);

    const {
      minReps,
      maxReps,
      name,
      units,
    } = pickExercise(exercises);

    yield sendMessage(`${participants} - ${random(minReps, maxReps)} ${units} ${name} NOW PLEASE!`);

    yield wait(random(callouts.minutesBetween.min, callouts.minutesBetween.max));
  }

});
