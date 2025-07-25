module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/forums/unread-counts',
      handler: 'forum.getUnreadCounts',
      config: {
        auth: {
          strategy: 'users-permissions'
        }
      }
    },
    {
      method: 'POST',
      path: '/forums/mark-as-read',
      handler: 'forum.markChannelAsRead',
      config: {
        auth: {
          strategy: 'users-permissions'
        }
      }
    },
    {
      method: 'POST',
      path: '/forums/mark-channel-as-read-all',
      handler: 'forum.markChannelAsReadAll',
      config: {
        auth: {
          strategy: 'users-permissions'
        }
      }
    }
  ]
};
