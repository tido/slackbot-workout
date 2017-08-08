const {
  filter, flow, map, groupBy, sumBy,
  get, mapValues, flatMap,
} = require('lodash/fp');
const axios = require('axios');
const config = require('./config');

const wait = minutes => done =>
  setTimeout(done, minutes * 60 * 1000);

const sendMessage = message => axios.post(config.webhook, {
  channel: config.channelName,
  username: 'Tido Music Workout Bot',
  text: message,
  icon_emoji: ':weight_lifter:',
});

class Store {
  constructor() {
    this.actions = [];
  }

  getStats() {
    const expandActionByParticipants = action => map(
      participant => ({ participant, exercise: action.exercise }),
      action.participants
    );

    return flow(
      get('actions'),
      filter({ type: 'callout' }),
      flatMap(expandActionByParticipants),
      groupBy('participant'),
      mapValues(flow(
        groupBy('exercise.name'),
        mapValues(sumBy('exercise.reps'))
      ))
    )(this);
  }

  dispatch(action) {
    this.actions.push(action);

    switch (action.type) {
      case 'start':
        return [
          sendMessage('Ok, are you ready to pump?!'),
        ];
      case 'callout':
        const { participants, exercise } = action;
        return [
          sendMessage(`${map(id => `<@${id}>`, participants).join(' ')} - ${exercise.reps} ${exercise.units} ${exercise.name} NOW PLEASE!`),
        ];
      case 'waiting':
        const { minutes } = action;
        return [
          sendMessage(`Next exercise in ${minutes} minutes`),
          wait(action.minutes),
        ]
    }
  }
}

module.exports = Store;