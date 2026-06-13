export const IPC_CHANNELS = {
  APP_INFO: 'app-info',
  MINIMIZE_WINDOW: 'minimize-window',
  MAXIMIZE_WINDOW: 'maximize-window',
  CLOSE_WINDOW: 'close-window',
  NAVIGATE: 'navigate',
  
  DATABASE: {
    QUERY: 'db:query',
    RUN: 'db:run',
    GET: 'db:get',
    ALL: 'db:all'
  },
  
  MODEL: {
    TEST_CONNECTION: 'model:test-connection',
    SEND_CHAT: 'model:send-chat',
    STREAM_CHAT: 'model:stream-chat',
    GET_LIST: 'model:get-list',
    ADD: 'model:add',
    UPDATE: 'model:update',
    DELETE: 'model:delete'
  },
  
  MESSAGE: {
    START_LISTEN: 'message:start-listen',
    STOP_LISTEN: 'message:stop-listen',
    SEND_REPLY: 'message:send-reply',
    GET_HISTORY: 'message:get-history',
    GET_CONTACTS: 'message:get-contacts',
    GET_GROUPS: 'message:get-groups'
  },
  
  STYLE: {
    IMPORT_HISTORY: 'style:import-history',
    LEARN_STYLE: 'style:learn-style',
    GET_PROFILE: 'style:get-profile',
    UPDATE_PROFILE: 'style:update-profile'
  },
  
  STRATEGY: {
    GET_POLICY: 'strategy:get-policy',
    SET_POLICY: 'strategy:set-policy',
    GET_RULES: 'strategy:get-rules',
    ADD_RULE: 'strategy:add-rule'
  },
  
  SYSTEM: {
    GET_CONFIG: 'system:get-config',
    SET_CONFIG: 'system:set-config',
    EXPORT_DATA: 'system:export-data',
    CLEAN_DATA: 'system:clean-data',
    GET_AUDIT_LOGS: 'system:get-audit-logs'
  }
} as const
