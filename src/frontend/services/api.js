// api url configuration
const isDevelopment = import.meta.env.DEV;

const API_BASE_URL = isDevelopment 
  ? '/api' 
  : (import.meta.env.VITE_API_GATEWAY_URL || 'https://b51btgujid.execute-api.us-east-1.amazonaws.com/dev');

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://bufvp3zx1g.execute-api.us-east-1.amazonaws.com/dev';

// auth state stored in memory and localStorage for persistence
let authState = {
  token: null,
  refreshToken: null,
  idToken: null,
  user: null,
  tokenTimestamp: null
};

// restore saved auth on page load
try {
  authState.token = localStorage.getItem('authToken');
  authState.refreshToken = localStorage.getItem('refreshToken');
  authState.idToken = localStorage.getItem('idToken');
  
  const userStr = localStorage.getItem('user');
  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      authState.user = JSON.parse(userStr);
    } catch (e) {
      authState.user = null;
      localStorage.removeItem('user');
    }
  } else {
    authState.user = null;
  }
  
  const timestampStr = localStorage.getItem('tokenTimestamp');
  authState.tokenTimestamp = timestampStr ? parseInt(timestampStr) : null;
  
  // clear tokens older than 55 minutes
  if (authState.token && authState.tokenTimestamp) {
    const age = Date.now() - authState.tokenTimestamp;
    const FIFTY_FIVE_MINUTES = 55 * 60 * 1000;
    if (age > FIFTY_FIVE_MINUTES) {
      authState = {
        token: null,
        refreshToken: null,
        idToken: null,
        user: null,
        tokenTimestamp: null
      };
      localStorage.clear();
    }
  }
} catch (error) {
  // localStorage not available
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
  } catch (e) {
    // cant clear storage
  }
}

function saveAuthState() {
  try {
    if (authState.token) {
      localStorage.setItem('authToken', authState.token);
      localStorage.setItem('refreshToken', authState.refreshToken || '');
      localStorage.setItem('idToken', authState.idToken || '');
      
      if (authState.user && typeof authState.user === 'object') {
        localStorage.setItem('user', JSON.stringify(authState.user));
      } else {
        localStorage.removeItem('user');
      }
      
      localStorage.setItem('tokenTimestamp', String(authState.tokenTimestamp || Date.now()));
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenTimestamp');
    }
  } catch (error) {
    // storage not available
  }
}

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // add token to request if we have one
  if (authState.token && !options.skipAuth) {
    // make sure token is valid string format
    const token = String(authState.token).trim();
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      // auth error handling
      if (response.status === 401 || response.status === 403) {
        // token format problem
        if (data.error && data.error.includes('Invalid key=value pair')) {
          authAPI.logout();
          throw new Error('Session expired. Please login again.');
        }
        
        // clear auth if token is actually invalid
        if (authState.token && response.status === 401 && !options.skipAutoLogout) {
          authAPI.logout();
        }
        
        throw new Error('Authentication failed. Please login again.');
      } else if (response.status === 404) {
        throw new Error('Resource not found. The document may have been deleted.');
      }
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    
    // network connection failed
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
}

export const authAPI = {
  async signup(email, password, name) {
    const data = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
      skipAuth: true
    });
    return data;
  },

  async login(email, password) {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true
    });
    
    // save tokens to state
    authState = {
      token: data.token,
      refreshToken: data.refreshToken,
      idToken: data.idToken,
      user: null,
      tokenTimestamp: Date.now()
    };
    
    // persist to storage
    saveAuthState();
    
    // get user info after login
    if (authState.token) {
      try {
        const verifyData = await this.verify();
        // add user to response
        return {
          ...data,
          user: verifyData.user,
          email: verifyData.user?.email,
          name: verifyData.user?.name
        };
      } catch (error) {
        // still return login response if verify fails
        return data;
      }
    }
    
    return data;
  },

  async verify() {
    if (!authState.token) {
      throw new Error('No auth token');
    }
    
    try {
      const data = await apiCall('/auth/verify', { skipAutoLogout: true });
      
      // save user info from response
      if (data.userId && data.email) {
        // build user object with all fields
        authState.user = {
          userId: data.userId,
          email: data.email,
          name: data.name || data.email.split('@')[0], // Use name or email prefix
          username: data.username || data.email
        };
        saveAuthState();
      }
      
      // return user data
      return {
        ...data,
        user: authState.user
      };
    } catch (error) {
      // let app handle verify errors
      throw error;
    }
  },

  async updateProfile(name) {
    // update name in cognito
    const data = await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    
    // update cached name
    if (authState.user) {
      authState.user.name = name;
      saveAuthState();
    }
    
    return data;
  },

  logout() {
    // reset auth state
    authState = {
      token: null,
      refreshToken: null,
      idToken: null,
      user: null,
      tokenTimestamp: null
    };
    
    // remove all stored tokens
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenTimestamp');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  getAuthState() {
    return { ...authState };
  },

  isAuthenticated() {
    return !!authState.token;
  },

  // check if token probably still works
  isTokenLikelyValid() {
    if (!authState.token || !authState.tokenTimestamp) {
      return false;
    }
    
    const age = Date.now() - authState.tokenTimestamp;
    const FIFTY_MINUTES = 50 * 60 * 1000; // Cognito tokens typically last 60 minutes
    return age < FIFTY_MINUTES;
  }
};

export const documentsAPI = {
  async create(title, content = '') {
    const data = await apiCall('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, content })
    });
    
    // fix inconsistent id field names
    if (data.document) {
      return {
        ...data.document,
        id: data.document.docId || data.document.id,
        documentId: data.document.docId || data.document.documentId || data.document.id
      };
    }
    return data;
  },

  async list() {
    const data = await apiCall('/documents');
    
    // normalize id fields
    if (data.documents && Array.isArray(data.documents)) {
      return {
        documents: data.documents.map(doc => ({
          ...doc,
          id: doc.docId || doc.id,
          documentId: doc.docId || doc.documentId || doc.id
        }))
      };
    }
    return data;
  },

  async get(documentId) {
    const data = await apiCall(`/documents/${documentId}`);
    // normalize response format
    if (data.document) {
      return {
        ...data.document,
        id: data.document.docId || data.document.id || documentId,
        documentId: data.document.docId || data.document.documentId || documentId
      };
    }
    return data;
  },

  async update(documentId, updates) {
    const data = await apiCall(`/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    // normalize id in response
    if (data.document) {
      return {
        ...data.document,
        id: data.document.docId || data.document.id || documentId
      };
    }
    return data;
  },

  async delete(documentId) {
    const data = await apiCall(`/documents/${documentId}`, {
      method: 'DELETE'
    });
    return data;
  },

  async shareDocument(documentId, email) {
    const data = await apiCall(`/documents/${documentId}?action=share`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return data;
  }
};

// websocket connection manager
class WebSocketAPI {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.connectionPromise = null;
    this.connectionStatus = 'disconnected';
  }

  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_URL);
        this.setConnectionStatus('connecting');

        this.ws.onopen = () => {
          this.connectionPromise = null;
          this.setConnectionStatus('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            // bad json from server
          }
        };

        this.ws.onerror = (error) => {
          this.connectionPromise = null;
          this.setConnectionStatus('error');
          reject(error);
        };

        this.ws.onclose = () => {
          this.ws = null;
          this.connectionPromise = null;
          this.setConnectionStatus('disconnected');
          // reconnect after 3 seconds
          setTimeout(() => this.connect(), 3000);
        };
      } catch (error) {
        this.connectionPromise = null;
        this.setConnectionStatus('error');
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  setConnectionStatus(status) {
    this.connectionStatus = status;
    // notify listeners of status change
    const handlers = this.messageHandlers.get('connection_change');
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(status);
        } catch (error) {
          // handler failed
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  async send(action, data) {
    await this.connect();
    
    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      action,
      ...data,
      token: authState.token
    };

    this.ws.send(JSON.stringify(message));
  }

  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(handler);

    // return cleanup function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  // shorthand for onMessage
  on(type, handler) {
    return this.onMessage(type, handler);
  }

  off(type, handler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  handleMessage(message) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          // handler threw error
        }
      });
    }

    // check for action based message types too
    const actionHandlers = this.messageHandlers.get(message.action);
    if (actionHandlers) {
      actionHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          // action handler failed
        }
      });
    }
  }

  async joinDocument(documentId) {
    await this.send('JOIN_DOCUMENT', { documentId });
  }

  async leaveDocument(documentId) {
    await this.send('LEAVE_DOCUMENT', { documentId });
  }

  async sendDocumentUpdate(documentId, content, cursorPosition) {
    await this.send('DOCUMENT_UPDATE', {
      documentId,
      content,
      cursorPosition
    });
  }
}

export const websocketAPI = new WebSocketAPI();
