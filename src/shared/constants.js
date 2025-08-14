// shared between frontend/backend

export const CONSTANTS = {
    ENTITY_TYPES: {
        USER: 'USER',
        DOCUMENT: 'DOC',
        COMMENT: 'COMMENT',
        CONNECTION: 'CONN'
    },
    
    WS_MESSAGE_TYPES: {
        JOIN_DOCUMENT: 'JOIN_DOCUMENT',
        LEAVE_DOCUMENT: 'LEAVE_DOCUMENT',
        DOCUMENT_UPDATE: 'DOCUMENT_UPDATE',
        CURSOR_UPDATE: 'CURSOR_UPDATE',
        USER_JOINED: 'USER_JOINED',
        USER_LEFT: 'USER_LEFT',
        ERROR: 'ERROR'
    },
    
    PERMISSIONS: {
        OWNER: 'OWNER',
        EDITOR: 'EDITOR',
        VIEWER: 'VIEWER'
    },
    
    LIMITS: {
        MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_TITLE_LENGTH: 255,
        MAX_COMMENT_LENGTH: 1000
    }
};