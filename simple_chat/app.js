const els = {
  serverUrl: document.getElementById('serverUrl'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  token: document.getElementById('token'),
  supervisorId: document.getElementById('supervisorId'),
  threadId: document.getElementById('threadId'),
  status: document.getElementById('status'),
  messages: document.getElementById('messages'),
  messageInput: document.getElementById('messageInput'),
  sendForm: document.getElementById('sendForm'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  createThreadBtn: document.getElementById('createThreadBtn'),
  connectBtn: document.getElementById('connectBtn'),
  disconnectBtn: document.getElementById('disconnectBtn'),
};

const storageKeys = {
  serverUrl: 'simple_chat_server_url',
  token: 'simple_chat_token',
  supervisorId: 'simple_chat_supervisor_id',
  threadId: 'simple_chat_thread_id',
};

let socket = null;

bootstrap();

function bootstrap() {
  els.serverUrl.value = localStorage.getItem(storageKeys.serverUrl) || window.location.origin;
  els.token.value = localStorage.getItem(storageKeys.token) || '';
  els.supervisorId.value = localStorage.getItem(storageKeys.supervisorId) || '';
  els.threadId.value = localStorage.getItem(storageKeys.threadId) || '';

  els.loginBtn.addEventListener('click', login);
  els.logoutBtn.addEventListener('click', clearToken);
  els.createThreadBtn.addEventListener('click', createThread);
  els.connectBtn.addEventListener('click', connectWs);
  els.disconnectBtn.addEventListener('click', disconnectWs);
  els.sendForm.addEventListener('submit', sendMessage);

  updateStatus('disconnected');
}

function saveState() {
  localStorage.setItem(storageKeys.serverUrl, els.serverUrl.value.trim());
  localStorage.setItem(storageKeys.token, els.token.value.trim());
  localStorage.setItem(storageKeys.supervisorId, els.supervisorId.value.trim());
  localStorage.setItem(storageKeys.threadId, els.threadId.value.trim());
}

function updateStatus(state) {
  els.status.textContent = `Status: ${state}`;
}

function addMessage(type, text) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${type}`;
  messageEl.textContent = text;
  els.messages.appendChild(messageEl);
  els.messages.scrollTop = els.messages.scrollHeight;
}

function getServerUrl() {
  const rawUrl = els.serverUrl.value.trim().replace(/\/+$/, '');
  if (!rawUrl) {
    throw new Error('Server URL is required');
  }
  return rawUrl;
}

function getWsUrl(serverUrl, token) {
  const httpUrl = new URL(serverUrl);
  const wsProtocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${httpUrl.host}/ws/chat?token=${encodeURIComponent(token)}`;
}

async function login() {
  const email = els.email.value.trim();
  const password = els.password.value.trim();

  if (!email || !password) {
    addMessage('error', 'Informe email e password para login.');
    return;
  }

  try {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password}),
    });

    const payload = await response.json();

    if (!response.ok || !payload.access_token) {
      addMessage('error', payload.message || payload.error || 'Falha no login');
      return;
    }

    els.token.value = payload.access_token;
    saveState();
    addMessage('system', 'Login realizado, token salvo.');
  } catch (error) {
    addMessage('error', `Erro no login: ${error.message}`);
  }
}

function clearToken() {
  els.token.value = '';
  saveState();
  addMessage('system', 'Token removido.');
}

async function createThread() {
  const token = els.token.value.trim();
  const supervisorId = els.supervisorId.value.trim();

  if (!token || !supervisorId) {
    addMessage('error', 'Token e supervisor_id sao obrigatorios para criar thread.');
    return;
  }

  try {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/v1/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({supervisor_id: supervisorId}),
    });

    const payload = await response.json();

    if (!response.ok || !payload.id) {
      addMessage('error', payload.message || payload.error || 'Falha ao criar thread');
      return;
    }

    els.threadId.value = payload.id;
    saveState();
    addMessage('system', `Thread criada: ${payload.id}`);
  } catch (error) {
    addMessage('error', `Erro criando thread: ${error.message}`);
  }
}

function connectWs() {
  const token = els.token.value.trim();
  if (!token) {
    addMessage('error', 'Informe um token antes de conectar no websocket.');
    return;
  }

  try {
    const serverUrl = getServerUrl();
    saveState();

    disconnectWs();

    const wsUrl = getWsUrl(serverUrl, token);
    socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      updateStatus('connected');
      addMessage('system', 'WebSocket conectado.');
    });

    socket.addEventListener('close', (event) => {
      updateStatus('disconnected');
      addMessage('system', `WebSocket fechado (code: ${event.code}).`);
      socket = null;
    });

    socket.addEventListener('error', () => {
      updateStatus('error');
      addMessage('error', 'Erro no websocket.');
    });

    socket.addEventListener('message', (event) => {
      handleServerEvent(event.data);
    });

    updateStatus('connecting');
  } catch (error) {
    addMessage('error', `Erro abrindo websocket: ${error.message}`);
  }
}

function disconnectWs() {
  if (socket) {
    socket.close();
    socket = null;
  }
  updateStatus('disconnected');
}

function handleServerEvent(rawData) {
  let event;

  try {
    event = JSON.parse(rawData);
  } catch (_error) {
    addMessage('error', `Evento invalido: ${rawData}`);
    return;
  }

  switch (event.type) {
    case 'connected':
      addMessage('system', `Autenticado no WS. user_id=${event.user_id}`);
      break;
    case 'processing':
      if (event.thread_id) {
        els.threadId.value = event.thread_id;
        saveState();
      }
      addMessage('system', `Supervisor processando thread ${event.thread_id}...`);
      break;
    case 'assistant_message':
      if (event.thread_id) {
        els.threadId.value = event.thread_id;
        saveState();
      }
      addMessage('assistant', event.content || '(sem conteudo)');
      break;
    case 'error':
      addMessage('error', `${event.code}: ${event.message}`);
      break;
    default:
      addMessage('system', `Evento recebido: ${rawData}`);
      break;
  }
}

function sendMessage(event) {
  event.preventDefault();

  const content = els.messageInput.value.trim();
  const threadId = els.threadId.value.trim();
  const supervisorId = els.supervisorId.value.trim();

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    addMessage('error', 'WebSocket nao esta conectado.');
    return;
  }

  if (!content) {
    return;
  }

  const payload = {
    type: 'user_message',
    ...(threadId ? {thread_id: threadId} : {}),
    ...(!threadId && supervisorId ? {supervisor_id: supervisorId} : {}),
    content,
  };

  socket.send(JSON.stringify(payload));
  addMessage('user', content);
  els.messageInput.value = '';
  saveState();
}
