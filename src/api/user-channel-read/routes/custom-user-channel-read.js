module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/user-channel-reads/channel/:channelId',
      handler: 'user-channel-read.getChannelReadStatus',
      config: {
        auth: {
          strategy: 'users-permissions'
        }
      }
    },
    {
      method: 'GET',
      path: '/user-channel-reads/user-statuses',
      handler: 'user-channel-read.getUserReadStatuses',
      config: {
        auth: {
          strategy: 'users-permissions'
        }
      }
    }
  ]
};
