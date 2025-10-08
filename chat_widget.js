(function() {
  'use strict';
  
  // Avoid loading twice
  if (window.ChatWidgetLoaded) return;
  window.ChatWidgetLoaded = true;

  // Configuration with defaults
  const config = window.ChatWidgetConfig || {
    welcomeMessage: "Hello! Welcome to our chat.",
    subtitle: "I am here to help.",
    actionButtons: [
      { text: "Get Started", action: "get_started" },
      { text: "I have a question", action: "question" },
      { text: "Other", action: "other" }
    ],
    agentName: "Sarah",
    agentAvatar: "",
    primaryColor: "#0891b2",
    showAgent: true,
    // Company branding
    companyName: "The Grout Medic",
    companyTagline: "Chatting with Sarah",
    // Legal/Compliance
    recordingDisclaimer: "This transcript will be recorded by The Grout Medic and its affiliates.",
    termsOfUseUrl: "#",
    privacyPolicyUrl: "#",
    poweredBy: "Explained Consulting",
    poweredByUrl: "https://www.explained.consulting",
    // n8n webhook configuration
    webhookUrl: null, // REQUIRED: Your n8n webhook URL
    chatInputKey: "chatInput",
    chatSessionKey: "sessionId",
    conversationTimeoutMinutes: 20, // Timeout in minutes (0 = no timeout)
    metadata: {}, // Additional metadata to send with each message
    // Storage options
    useSessionStorage: false, // If true, uses sessionStorage instead of localStorage (data deleted when browser closes)
    // Callbacks
    onMessageSend: null,
    onMessageReceive: null,
    onError: null
  };

  // Security helper functions
  function validateUrl(url, fallback = '#') {
    if (!url) return fallback;
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return url;
      }
    } catch (e) {
      // Invalid URL
    }
    return fallback;
  }

  function sanitizeText(text) {
    // Convert to string and escape HTML entities
    const str = String(text || '');
    const div = document.createElement('div');
    div.textContent = str;
    // For action button text, preserve emojis by returning the original string if it contains emojis
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(str)) {
      return str;
    }
    return div.innerHTML;
  }

  function sanitizeConfig() {
    // Sanitize all text-based config values
    config.welcomeMessage = sanitizeText(config.welcomeMessage);
    config.subtitle = sanitizeText(config.subtitle);
    config.agentName = sanitizeText(config.agentName);
    config.companyName = sanitizeText(config.companyName);
    config.companyTagline = sanitizeText(config.companyTagline);
    config.recordingDisclaimer = sanitizeText(config.recordingDisclaimer);
    config.poweredBy = sanitizeText(config.poweredBy);

    // Validate URLs
    config.agentAvatar = validateUrl(config.agentAvatar, '');
    config.termsOfUseUrl = validateUrl(config.termsOfUseUrl, '#');
    config.privacyPolicyUrl = validateUrl(config.privacyPolicyUrl, '#');
    config.poweredByUrl = validateUrl(config.poweredByUrl, 'https://www.explained.consulting');
    config.webhookUrl = config.webhookUrl ? validateUrl(config.webhookUrl, null) : null;

    // Sanitize action buttons
    if (Array.isArray(config.actionButtons)) {
      config.actionButtons = config.actionButtons.map(button => ({
        text: sanitizeText(button.text),
        action: sanitizeText(button.action)
      }));
    }
  }

  // Sanitize config on load
  sanitizeConfig();

  // Generate session ID with cryptographically secure random
  function generateSessionId() {
    // Generate cryptographically secure random bytes
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Convert to hex string
    const randomHex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return 'session_' + Date.now() + '_' + randomHex;
  }

  // Storage helper - uses sessionStorage or localStorage based on config
  const storage = config.useSessionStorage ? sessionStorage : localStorage;

  // Get or create session ID
  function getSessionId() {
    let sessionId = storage.getItem('n8n_chat_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      storage.setItem('n8n_chat_session_id', sessionId);
    }
    return sessionId;
  }

  // Conversation persistence functions
  // Note: Messages may contain sensitive information (PII, addresses, phone numbers)
  // Consider using sessionStorage (useSessionStorage: true) for sensitive conversations
  function saveMessageToStorage(message, sender, timestamp = Date.now()) {
    const messages = getStoredMessages();
    messages.push({ message, sender, timestamp });
    storage.setItem('n8n_chat_messages', JSON.stringify(messages));
    updateLastActivity(); // Update activity timestamp
  }

  function getStoredMessages() {
    const stored = storage.getItem('n8n_chat_messages');
    return stored ? JSON.parse(stored) : [];
  }

  function clearStoredMessages() {
    storage.removeItem('n8n_chat_messages');
    storage.removeItem('n8n_chat_last_activity');
  }

  // Conversation timeout functions
  function updateLastActivity() {
    storage.setItem('n8n_chat_last_activity', Date.now().toString());
  }

  function getLastActivity() {
    const lastActivity = storage.getItem('n8n_chat_last_activity');
    return lastActivity ? parseInt(lastActivity) : null;
  }

  function isConversationExpired() {
    if (!config.conversationTimeoutMinutes || config.conversationTimeoutMinutes <= 0) {
      return false; // No timeout configured
    }
    
    const lastActivity = getLastActivity();
    if (!lastActivity) {
      return false; // No activity recorded
    }
    
    const timeoutMs = config.conversationTimeoutMinutes * 60 * 1000;
    const now = Date.now();
    
    return (now - lastActivity) > timeoutMs;
  }

  function clearExpiredConversation() {
    if (isConversationExpired()) {
      clearStoredMessages();
      // Generate new session ID for fresh start
      const newSessionId = generateSessionId();
      storage.setItem('n8n_chat_session_id', newSessionId);
      console.log('Chat widget: Conversation expired - new session ID generated');
      return true; // Conversation was cleared
    }
    return false; // Conversation is still valid
  }


  // Session ID will be retrieved dynamically to handle expiration

  // Widget styles
  const styles = `
    #chat-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #chat-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${config.primaryColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
      position: relative;
    }
    
    #chat-widget-button:hover {
      transform: scale(1.1);
    }
    
    #chat-widget-button svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
    
    #chat-widget-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 450px;
      height: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 5px 40px rgba(0,0,0,0.16);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    
    #chat-widget-window.open {
      display: flex;
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    #chat-widget-header {
      background: ${config.primaryColor};
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    
    .header-agent-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3);
      overflow: hidden;
    }
    
    .header-agent-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .header-agent-info h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
    }
    
    .header-agent-info p {
      margin: 0;
      font-size: 11px;
      opacity: 0.9;
      line-height: 1.3;
      margin-top: 2px;
    }
    
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    
    #chat-widget-close,
    #chat-widget-clear {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #chat-widget-clear {
      font-size: 14px;
      margin-right: 4px;
    }
    
    #chat-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f7f7f7;
    }
    
    #chat-welcome-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 30px 20px;
    }
    
    #chat-welcome-screen h2 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #333;
      font-weight: 600;
    }
    
    #chat-welcome-screen p {
      margin: 0 0 24px 0;
      font-size: 13px;
      color: #666;
    }
    
    .chat-action-button {
      width: 100%;
      padding: 12px 18px;
      margin-bottom: 10px;
      border: 2px solid ${config.primaryColor};
      background: white;
      color: ${config.primaryColor};
      border-radius: 25px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .chat-action-button:hover {
      background: ${config.primaryColor};
      color: white;
    }
    
    .chat-action-button.primary {
      background: ${config.primaryColor};
      color: white;
    }
    
    .chat-action-button.primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .chat-message {
      margin-bottom: 16px;
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }
    
    .chat-message.bot {
      flex-direction: row;
    }
    
    .chat-message.user {
      flex-direction: row-reverse;
    }
    
    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      flex-shrink: 0;
      overflow: hidden;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .message-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .chat-message.user .message-avatar {
      display: none;
    }
    
    .chat-message-content {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 18px;
      word-wrap: break-word;
      white-space: pre-wrap;
      position: relative;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      line-height: 1.3;
      font-size: 13px;
    }
    
    .chat-message-content strong {
      font-weight: 600;
    }
    
    .chat-message-content em {
      font-style: italic;
    }
    
    .chat-message-content div {
      margin: 4px 0;
    }
    
    .chat-message.bot .chat-message-content {
      background: #ffffff;
      color: #333;
      border: 1px solid #e1e5e9;
    }
    
    .chat-message.user .chat-message-content {
      background: ${config.primaryColor};
      color: white;
    }
    
    /* Speech bubble tails */
    .chat-message.bot .chat-message-content::before {
      content: '';
      position: absolute;
      left: -9px;
      bottom: 8px;
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-right: 9px solid #e1e5e9;
      z-index: 1;
    }
    
    .chat-message.bot .chat-message-content::after {
      content: '';
      position: absolute;
      left: -8px;
      bottom: 8px;
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-right: 8px solid #ffffff;
      z-index: 2;
    }
    
    .chat-message.user .chat-message-content::after {
      content: '';
      position: absolute;
      right: -8px;
      bottom: 8px;
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-left: 8px solid ${config.primaryColor};
    }

    .chat-message.typing {
      align-items: flex-start;
    }

    .typing-indicator {
      background: white;
      padding: 10px 14px;
      border-radius: 12px;
      display: flex;
      gap: 4px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }
    
    #chat-widget-input-container {
      padding: 16px;
      background: white;
      border-top: 1px solid #eee;
      display: flex;
      gap: 8px;
    }
    
    #chat-widget-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 13px;
      outline: none;
      resize: none;
      min-height: 20px;
      max-height: 120px;
      font-family: inherit;
      line-height: 1.3;
    }
    
    #chat-widget-input:focus {
      border-color: ${config.primaryColor};
    }
    
    #chat-widget-send {
      background: ${config.primaryColor};
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #chat-widget-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    #chat-widget-send:hover:not(:disabled) {
      opacity: 0.9;
    }
    
    #chat-widget-send svg {
      width: 20px;
      height: 20px;
      fill: white;
    }

    #chat-agent-avatar {
      position: absolute;
      bottom: -10px;
      right: -10px;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      overflow: hidden;
      display: ${config.showAgent ? 'block' : 'none'};
    }

    #chat-agent-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .agent-status {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 16px;
      height: 16px;
      background: #22c55e;
      border: 2px solid white;
      border-radius: 50%;
    }

    .chat-conversation-view {
      display: none;
    }

    .chat-conversation-view.active {
      display: block;
    }

    /* Legal Disclaimer Banner */
    .legal-disclaimer {
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      padding: 10px 14px;
      font-size: 10px;
      line-height: 1.3;
      color: #6c757d;
    }

    .legal-disclaimer a {
      color: #007bff;
      text-decoration: underline;
    }

    .legal-disclaimer a:hover {
      color: #0056b3;
    }

    /* Footer */
    .chat-widget-footer {
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      padding: 6px 14px;
      text-align: center;
      font-size: 9px;
      color: #6c757d;
    }

    .chat-widget-footer .powered-by {
      color: #6f42c1;
      font-weight: 500;
      text-decoration: none;
    }
    
    .chat-widget-footer .powered-by:hover {
      text-decoration: underline;
    }

    /* Mobile responsiveness */
    @media (max-width: 480px) {
      #chat-widget-container {
        bottom: 10px;
        right: 10px;
        left: 10px;
      }
      
      #chat-widget-button {
        width: 50px;
        height: 50px;
        bottom: 10px;
        right: 10px;
      }
      
      #chat-widget-button svg {
        width: 24px;
        height: 24px;
      }
      
      #chat-widget-window {
        width: 100%;
        height: 100vh;
        height: 100dvh; /* Dynamic viewport height for mobile browsers */
        max-height: none;
        bottom: 0;
        right: 0;
        left: 0;
        top: 0;
        border-radius: 0;
        position: fixed;
        z-index: 10000;
      }
      
      #chat-widget-messages {
        padding: 15px;
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
      }
      
      .chat-message-content {
        max-width: 85%;
        font-size: 14px;
      }
      
      .message-avatar {
        width: 28px;
        height: 28px;
      }
      
      .header-agent-avatar {
        width: 36px;
        height: 36px;
      }
      
      /* Full screen mobile header adjustments */
      #chat-widget-header {
        padding: 20px 16px;
        min-height: 60px;
      }
      
      .header-agent-info h3 {
        font-size: 13px;
        line-height: 1.2;
      }
      
      .header-agent-info p {
        font-size: 10px;
        line-height: 1.2;
        margin-top: 1px;
      }
      
      
      .legal-disclaimer {
        padding: 8px 10px;
        font-size: 9px;
      }
      
      .chat-widget-footer {
        padding: 5px 10px;
        font-size: 8px;
      }
      
      #chat-widget-input-container {
        padding: 16px;
        background: white;
        border-top: 1px solid #eee;
      }
      
      #chat-widget-input {
        font-size: 16px; /* Prevents zoom on iOS */
        border-radius: 20px;
        padding: 12px 16px;
        min-height: 44px; /* iOS recommended touch target */
      }
      
      #chat-agent-avatar {
        width: 60px;
        height: 60px;
        bottom: -8px;
        right: -8px;
      }
      
      .chat-action-button {
        padding: 14px 18px;
        font-size: 14px;
      }
      
      #chat-welcome-screen {
        padding: 18px 12px;
      }
      
      #chat-welcome-screen h2 {
        font-size: 16px;
      }
      
      #chat-welcome-screen p {
        font-size: 12px;
      }
    }

    /* Tablet responsiveness */
    @media (max-width: 768px) and (min-width: 481px) {
      #chat-widget-window {
        width: 400px;
        height: 600px;
        bottom: 80px;
        right: 20px;
      }
      
      #chat-widget-messages {
        padding: 18px;
      }
      
      .chat-message-content {
        max-width: 80%;
        font-size: 14px;
      }
    }

    /* Small mobile devices */
    @media (max-width: 320px) {
      .chat-message-content {
        max-width: 90%;
      }
      
      #chat-widget-header {
        padding: 16px;
        min-height: 56px;
      }
      
      #chat-widget-input-container {
        padding: 12px;
      }
    }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Generate action buttons HTML
  const actionButtonsHTML = config.actionButtons.map((button, index) => {
    const isPrimary = index === 0 ? 'primary' : '';
    // Use textContent to preserve emojis properly
    const buttonElement = document.createElement('button');
    buttonElement.className = `chat-action-button ${isPrimary}`;
    buttonElement.setAttribute('data-action', button.action);
    buttonElement.textContent = button.text;
    return buttonElement.outerHTML;
  }).join('');

  // Create widget HTML
  const widgetHTML = `
    <div id="chat-widget-container">
      <div id="chat-widget-window">
        <div id="chat-widget-header">
          <div class="header-left">
            <div class="header-agent-avatar">
              <img src="${config.agentAvatar}" alt="${config.agentName}" />
            </div>
            <div class="header-agent-info">
              <h3>${config.companyName}</h3>
              <p>${config.companyTagline}</p>
            </div>
          </div>
          <div class="header-right">
            <button id="chat-widget-clear" title="Clear conversation">🔄</button>
            <button id="chat-widget-close">&times;</button>
          </div>
        </div>
        <div class="legal-disclaimer">
          ${(config.recordingDisclaimer || '').replace(/Terms of Use/g, `<a href="${config.termsOfUseUrl}" target="_blank">Terms of Use</a>`).replace(/Privacy Policy/g, `<a href="${config.privacyPolicyUrl}" target="_blank">Privacy Policy</a>`)}
        </div>
        <div id="chat-widget-messages">
          <div id="chat-welcome-screen">
            <h2>${config.welcomeMessage}</h2>
            <p>${config.subtitle}</p>
            ${actionButtonsHTML}
          </div>
          <div class="chat-conversation-view"></div>
        </div>
        <div id="chat-widget-input-container">
          <textarea id="chat-widget-input" placeholder="Type a message..." rows="1"></textarea>
          <button id="chat-widget-send">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <div class="chat-widget-footer">
          Powered by <a href="${config.poweredByUrl || 'https://www.explained.consulting'}" target="_blank" class="powered-by">${config.poweredBy || 'Expained Consulting'}</a>
        </div>
      </div>
      <button id="chat-widget-button">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        ${config.showAgent ? `
          <div id="chat-agent-avatar">
            <img src="${config.agentAvatar}" alt="${config.agentName}" />
            <div class="agent-status"></div>
          </div>
        ` : ''}
      </button>
    </div>
  `;

  // Insert widget into page
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);

    // Get elements
    const button = document.getElementById('chat-widget-button');
    const chatWindow = document.getElementById('chat-widget-window');
    const closeBtn = document.getElementById('chat-widget-close');
    const clearBtn = document.getElementById('chat-widget-clear');
    const input = document.getElementById('chat-widget-input');
    const sendBtn = document.getElementById('chat-widget-send');
    const welcomeScreen = document.getElementById('chat-welcome-screen');
    const conversationView = document.querySelector('.chat-conversation-view');
    const actionButtons = document.querySelectorAll('.chat-action-button');

    let conversationStarted = false;

    // Restore conversation function (defined after addMessage)
    function restoreConversation() {
      // Check if conversation has expired
      if (clearExpiredConversation()) {
        console.log('Chat widget: Conversation expired and cleared');
        return false; // No conversation to restore
      }
      
      const messages = getStoredMessages();
      if (messages.length > 0) {
        // Hide welcome screen and show conversation
        welcomeScreen.style.display = 'none';
        conversationView.classList.add('active');
        
        // Restore all messages
        messages.forEach(msg => {
          addMessage(msg.message, msg.sender, false); // false = don't save to storage
        });
        
        // Scroll to bottom after restoring messages
        setTimeout(() => {
          conversationView.parentElement.scrollTop = conversationView.parentElement.scrollHeight;
        }, 100);
        
        return true; // Conversation was restored
      }
      return false; // No previous conversation
    }

    // Toggle window
    button.addEventListener('click', function() {
      chatWindow.classList.toggle('open');
      if (chatWindow.classList.contains('open')) {
        input.focus();
        // Hide agent avatar on chat button when window is open
        const agentAvatar = document.getElementById('chat-agent-avatar');
        if (agentAvatar) {
          agentAvatar.style.display = 'none';
        }
        // Scroll to bottom when opening chat window
        setTimeout(() => {
          conversationView.parentElement.scrollTop = conversationView.parentElement.scrollHeight;
        }, 100);
      } else {
        // Show agent avatar on chat button when window is closed
        const agentAvatar = document.getElementById('chat-agent-avatar');
        if (agentAvatar) {
          agentAvatar.style.display = 'block';
        }
      }
    });

    closeBtn.addEventListener('click', function() {
      chatWindow.classList.remove('open');
      // Show agent avatar on chat button when window is closed
      const agentAvatar = document.getElementById('chat-agent-avatar');
      if (agentAvatar) {
        agentAvatar.style.display = 'block';
      }
    });

    // Clear conversation button
    clearBtn.addEventListener('click', function() {
      if (confirm('Clear conversation history? This cannot be undone.')) {
        // Clear stored messages
        clearStoredMessages();

        // Generate new session ID for fresh start
        const newSessionId = generateSessionId();
        storage.setItem('n8n_chat_session_id', newSessionId);
        
        // Reset conversation state
        conversationStarted = false;
        
        // Show welcome screen
        welcomeScreen.style.display = 'block';
        conversationView.classList.remove('active');
        
        // Clear conversation view
        conversationView.innerHTML = '';
        
        // Focus input
        input.focus();
        
        console.log('Chat widget: Conversation manually cleared - new session ID generated');
      }
    });

    // Handle action button clicks
    actionButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const action = btn.getAttribute('data-action');
        const buttonText = btn.textContent;
        startConversation(buttonText, action);
      });
    });

    // Start conversation function
    function startConversation(userMessage, action) {
      conversationStarted = true;
      welcomeScreen.style.display = 'none';
      conversationView.classList.add('active');

      // Add user message
      addMessage(userMessage, 'user');

      // Send to n8n webhook
      sendToN8nWebhook(userMessage, action);
    }

    // Send message to n8n webhook
    async function sendToN8nWebhook(message, action) {
      // Show typing indicator
      const typingMsg = showTypingIndicator();

      // Call onMessageSend callback if provided
      if (config.onMessageSend && typeof config.onMessageSend === 'function') {
        config.onMessageSend(message, action);
      }

      // Check if webhook URL is configured
      if (!config.webhookUrl) {
        removeTypingIndicator(typingMsg);
        addMessage('Chat webhook URL is not configured. Please set webhookUrl in ChatWidgetConfig.', 'bot');
        return;
      }

      // Prepare n8n-compatible payload
      const payload = {
        action: action || 'sendMessage',
        [config.chatSessionKey]: getSessionId(), // Get current session ID dynamically
        [config.chatInputKey]: message,
        ...config.metadata
      };

      try {
        const response = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingMsg);

        // Extract bot response (n8n typically returns output in different formats)
        const botResponse = data.output || data.response || data.message || data.text || 
                          (data.data && data.data.output) || 'Sorry, I did not understand that.';
        
        addMessage(botResponse, 'bot');

        // Call onMessageReceive callback if provided
        if (config.onMessageReceive && typeof config.onMessageReceive === 'function') {
          config.onMessageReceive(data);
        }

      } catch (error) {
        console.error('Chat widget error:', error);
        removeTypingIndicator(typingMsg);
        
        // Call onError callback if provided
        if (config.onError && typeof config.onError === 'function') {
          config.onError(error);
        }

        addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
      }
    }

    // Show typing indicator
    function showTypingIndicator() {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-message typing';
      msgDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
      conversationView.appendChild(msgDiv);
      conversationView.parentElement.scrollTop = conversationView.parentElement.scrollHeight;
      return msgDiv;
    }

    // Remove typing indicator
    function removeTypingIndicator(element) {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }

    // Add message to conversation
    function addMessage(text, sender, saveToStorage = true) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-message ' + sender;
      
      let avatarHtml = '';
      if (sender === 'bot' && config.showAgent) {
        avatarHtml = `<div class="message-avatar"><img src="${config.agentAvatar}" alt="${config.agentName}" /></div>`;
      }
      
      msgDiv.innerHTML = `
        ${avatarHtml}
        <div class="chat-message-content">${parseMarkdown(text)}</div>
      `;
      
      conversationView.appendChild(msgDiv);
      conversationView.parentElement.scrollTop = conversationView.parentElement.scrollHeight;
      
      // Save message to localStorage if requested
      if (saveToStorage) {
        saveMessageToStorage(text, sender);
      }
    }

    // Try to restore previous conversation on load (after addMessage is defined)
    conversationStarted = restoreConversation();

    // Send message function
    async function sendMessage() {
      const message = input.value.trim();
      if (!message) return;

      // Disable input while sending
      input.disabled = true;
      sendBtn.disabled = true;

      // If conversation hasn't started, start it
      if (!conversationStarted) {
        startConversation(message, 'sendMessage');
      } else {
        // Add user message
        addMessage(message, 'user');
        
        // Send to webhook
        await sendToN8nWebhook(message, 'sendMessage');
      }

      input.value = '';
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }

    // Send on button click
    sendBtn.addEventListener('click', sendMessage);

    // Auto-resize textarea
    function autoResizeTextarea() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    // Send on Enter key, new line on Shift+Enter
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize on input
    input.addEventListener('input', autoResizeTextarea);

    // Helper function to sanitize HTML (lightweight DOMPurify alternative)
    function sanitizeHtml(html) {
      const allowedTags = ['strong', 'em', 'br', 'div'];
      const allowedAttributes = ['style'];
      const allowedStyles = ['margin-left', 'margin-bottom'];

      const temp = document.createElement('div');
      temp.innerHTML = html;

      // Recursively check and clean nodes
      function cleanNode(node) {
        // Remove script and style tags
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') {
          node.remove();
          return;
        }

        // Check if tag is allowed
        if (node.nodeType === 1) { // Element node
          if (!allowedTags.includes(node.tagName.toLowerCase())) {
            // Replace disallowed tag with its text content
            const textNode = document.createTextNode(node.textContent);
            node.replaceWith(textNode);
            return;
          }

          // Remove disallowed attributes
          const attrs = Array.from(node.attributes);
          attrs.forEach(attr => {
            if (!allowedAttributes.includes(attr.name)) {
              node.removeAttribute(attr.name);
            } else if (attr.name === 'style') {
              // Sanitize style attribute
              const styles = attr.value.split(';').filter(style => {
                const [prop] = style.split(':').map(s => s.trim());
                return allowedStyles.includes(prop);
              });
              node.setAttribute('style', styles.join('; '));
            }
          });

          // Remove event handlers
          const eventAttrs = Array.from(node.attributes).filter(attr =>
            attr.name.startsWith('on')
          );
          eventAttrs.forEach(attr => node.removeAttribute(attr.name));
        }

        // Recursively clean child nodes
        Array.from(node.childNodes).forEach(child => cleanNode(child));
      }

      Array.from(temp.childNodes).forEach(node => cleanNode(node));
      return temp.innerHTML;
    }

    // Helper function to parse Markdown and preserve newlines
    function parseMarkdown(text) {
      // First escape HTML to prevent XSS
      const div = document.createElement('div');
      div.textContent = text;
      let html = div.innerHTML;

      // Parse basic Markdown
      // Bold text: **text** or __text__
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

      // Italic text: *text* or _text_
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html = html.replace(/_(.*?)_/g, '<em>$1</em>');

      // Line breaks
      html = html.replace(/\n/g, '<br>');

      // Numbered lists: 1. item
      html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<div style="margin-left: 20px; margin-bottom: 4px;"><strong>$1.</strong> $2</div>');

      // Bullet points: - item or * item
      html = html.replace(/^[\-\*]\s+(.+)$/gm, '<div style="margin-left: 20px; margin-bottom: 4px;">• $1</div>');

      // Final sanitization pass to catch any edge cases
      return sanitizeHtml(html);
    }
  });

  // Handle case where DOM is already loaded
  if (document.readyState === 'loading') {
    // Loading hasn't finished yet
  } else {
    // DOM is already ready
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
  }
})();