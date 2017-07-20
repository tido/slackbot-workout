const { shuffle, slice, filter, flow, get, map, join } = require('lodash/fp');
const axios = require('axios');
const co = require('co');

const config = require('./config');

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
  slice(0,2),
  map(id => `<@${id}>`),
  join(' ')
);

co(function* () {
  yield sendMessage('ok, are you ready to pump?!');

  while(true) {
    const { data: channelInfo } = yield axios.get(channelInfoUrl);
    const participants = pickParticipants(channelInfo);
    console.log(participants)
    yield sendMessage(`${participants} - 10 pushups NOW PLEASE!`);

    yield wait(1);
  }

});
