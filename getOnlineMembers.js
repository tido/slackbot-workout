const { filter, flow, get, map, zipWith, set } = require('lodash/fp');
const axios = require('axios');
const co = require('co');
const config = require('./config');

const channelInfoUrl =
  `https://slack.com/api/channels.info?token=${config.token}&channel=${config.channelId}`;

const userStatusUrl = userId =>
  `https://slack.com/api/users.getPresence?token=${config.token}&user=${userId}`;

const getOnlineMembers = () => co(function*() {
  const { data: channelInfo } = yield axios.get(channelInfoUrl);

  const members = get(['channel', 'members'], channelInfo);

  const memberStatuses = yield flow(
    map(userStatusUrl),
    map(url => axios.get(url).then(get('data')))
  )(members);

  const onlineMembers = flow(
    zipWith(set('id'), members),
    filter({ presence: 'active' }),
    map('id')
  )(memberStatuses);

  return onlineMembers;
});

module.exports = getOnlineMembers;