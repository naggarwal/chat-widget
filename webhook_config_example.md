# Chat Widget - n8n Integration Guide

## Quick Setup

This chat widget is designed to work seamlessly with n8n webhooks, following the @n8n/chat pattern.

### 1. Configure the Widget

Add this configuration **before** loading the chat widget script:

```javascript
window.ChatWidgetConfig = {
  // Required: Your n8n webhook URL
  webhookUrl: "https://your-n8n-instance.com/webhook/your-webhook-id",
  // Optional: Secret key for authentication
  chatSecret: "your-secret-key-here",
  
  // UI Configuration
  welcomeMessage: "Hello! Welcome to The Grout Medic chat.",
  subtitle: "I'm Sarah and I'm here to help you with your grout needs.",
  primaryColor: "#0891b2",
  
  // Action buttons for starting conversation
  actionButtons: [
    { text: "Free Estimate", action: "estimate" },
    { text: "I have a question", action: "question" },
    { text: "Other", action: "other" }
  ],
  
  // Agent Settings
  agentName: "Sarah",
  agentAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=sarah&backgroundColor=ec4899&clothingColor=262e33&eyeColor=262e33&hairColor=262e33&skinColor=fdbcb4",
  showAgent: true,
  
  // Company Branding
  companyName: "The Grout Medic",
  companyTagline: "Chatting with Sarah",
  
  // Legal/Compliance
  recordingDisclaimer: "This transcript will be recorded by The Grout Medic and its affiliates. By using this chat, you agree to our Terms of Use and Privacy Policy.",
  termsOfUseUrl: "https://your-website.com/terms",
  privacyPolicyUrl: "https://your-website.com/privacy",
  poweredBy: "Explained Consulting",
  poweredByUrl: "https://www.explained.consulting",
  
  // n8n compatibility settings
  chatInputKey: "chatInput",      // Key for message content
  chatSessionKey: "sessionId",    // Key for session ID
  
  // Additional metadata sent with each request
  metadata: {
    source: "website",
    page: window.location.pathname
  },
  
  // Optional callbacks
  onMessageSend: function(message, action) {
    console.log("Sending:", message, "Action:", action);
  },
  
  onMessageReceive: function(response) {
    console.log("Received:", response);
  },
  
  onError: function(error) {
    console.error("Chat error:", error);
  }
};
```

## New Features & Enhancements

### 🎨 **Professional Design**
- **Company branding** prominently displayed in header
- **Agent avatars** next to each bot message
- **Professional speech bubbles** with tails
- **Enhanced mobile responsiveness**
- **Clean, modern UI** with better visual hierarchy

### 📱 **Enhanced User Experience**
- **Multi-line input support** with Shift+Enter for new lines
- **Auto-resizing textarea** (grows as you type)
- **Line breaks preserved** in messages (\\n characters work correctly)
- **Agent avatar hides** when chat window is open
- **Smooth animations** and transitions

### ⚖️ **Legal & Compliance**
- **Recording disclaimer banner** with customizable text
- **Terms of Use and Privacy Policy** clickable links
- **"Powered by" attribution** with clickable URL
- **Professional footer** for brand attribution

### 🔧 **Configuration Options**

#### **Company Branding**
```javascript
companyName: "The Grout Medic",           // Company name in header
companyTagline: "Chatting with Sarah",    // Subtitle in header
```

#### **Legal/Compliance**
```javascript
recordingDisclaimer: "This transcript will be recorded...",  // Legal text
termsOfUseUrl: "https://your-website.com/terms",            // Terms link
privacyPolicyUrl: "https://your-website.com/privacy",       // Privacy link
poweredBy: "Explained Consulting",                          // Attribution text
poweredByUrl: "https://www.explained.consulting",           // Attribution link
```

#### **Agent Customization**
```javascript
agentName: "Sarah",                    // Agent name
agentAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=sarah...", // Avatar URL
showAgent: true,                       // Show/hide agent features
```

---

## n8n Workflow Setup

### Step 1: Create Chat Trigger Workflow

1. In n8n, create a new workflow
2. Add a **Webhook** node (or **Chat Trigger** node for AI workflows)
3. Set the webhook to **POST** method
4. Configure it to accept JSON data
5. Copy the webhook URL from n8n

### Step 2: Webhook Node Configuration

Your n8n Webhook node will receive data in this format:

```json
{
  "action": "estimate",
  "sessionId": "session_1234567890_abc123",
  "chatInput": "I need a free estimate for tile cleaning",
  "source": "website",
  "page": "/contact"
}
```

**Key Fields:**
- `action` - Which action button was clicked (or "sendMessage" for typed input)
- `sessionId` - Unique session identifier (persists across messages)
- `chatInput` - The actual message content
- Plus any custom metadata you configured

---

## Example n8n Workflows

### Basic Response Workflow

```
Webhook (Trigger)
  ↓
Set (Process Input)
  ↓
IF (Route by Action)
  ├─ estimate → Response: "I'll help you with an estimate..."
  ├─ question → Response: "What would you like to know?"
  └─ other → Response: "How can I assist you?"
  ↓
Respond to Webhook
```

### AI-Powered Chat Workflow

```
Chat Trigger (Webhook)
  ↓
AI Agent (OpenAI/Claude)
  ├─ Tool: ServiceMinder API (Book appointments)
  ├─ Tool: Knowledge Base (Answer questions)
  └─ Tool: Lead Capture (Save contact info)
  ↓
Response (Automatic)
```

---

## n8n Response Format

Your n8n workflow should return JSON in one of these formats:

### Simple Response:
```json
{
  "output": "Thank you! I'd be happy to provide a free estimate."
}
```

### Alternative Formats (all supported):
```json
{
  "response": "Your message here"
}
```

```json
{
  "message": "Your message here"
}
```

```json
{
  "text": "Your message here"
}
```

```json
{
  "data": {
    "output": "Your message here"
  }
}
```

---

## Session Management

The widget automatically:
- Generates a unique `sessionId` for each user
- Stores it in `localStorage` as `n8n_chat_session_id`
- Sends it with every request
- Persists across page reloads

Use the session ID in your n8n workflow to:
- Track conversation history
- Store user context
- Route to the correct agent
- Resume previous conversations

---

## Example n8n Workflow (JSON)

Here's a complete example workflow you can import into n8n:

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chat-widget",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "your-webhook-id"
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "userMessage",
              "value": "={{ $json.body.chatInput }}"
            },
            {
              "name": "sessionId",
              "value": "={{ $json.body.sessionId }}"
            },
            {
              "name": "action",
              "value": "={{ $json.body.action }}"
            }
          ]
        },
        "options": {}
      },
      "name": "Extract Data",
      "type": "n8n-nodes-base.set",
      "position": [470, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.action }}",
              "value2": "estimate"
            }
          ]
        }
      },
      "name": "Check Action",
      "type": "n8n-nodes-base.if",
      "position": [690, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "output",
              "value": "Great! I'd be happy to provide you with a free estimate. Could you tell me what service you're interested in?"
            }
          ]
        }
      },
      "name": "Estimate Response",
      "type": "n8n-nodes-base.set",
      "position": [910, 200]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "output",
              "value": "Thank you for reaching out! How can I assist you today?"
            }
          ]
        }
      },
      "name": "Default Response",
      "type": "n8n-nodes-base.set",
      "position": [910, 400]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1130, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Extract Data", "type": "main", "index": 0}]]
    },
    "Extract Data": {
      "main": [[{"node": "Check Action", "type": "main", "index": 0}]]
    },
    "Check Action": {
      "main": [
        [{"node": "Estimate Response", "type": "main", "index": 0}],
        [{"node": "Default Response", "type": "main", "index": 0}]
      ]
    },
    "Estimate Response": {
      "main": [[{"node": "Respond to Webhook", "type": "main", "index": 0}]]
    },
    "Default Response": {
      "main": [[{"node": "Respond to Webhook", "type": "main", "index": 0}]]
    }
  }
}
```

---

## Advanced: AI Agent with ServiceMinder Integration

For The Grout Medic use case, your n8n workflow could:

1. **Receive chat message** via Webhook
2. **Check session history** (stored in n8n database or external DB)
3. **AI Agent processes message** with context
4. **Tools available to agent:**
   - Search available appointment slots (ServiceMinder API)
   - Book appointment (ServiceMinder API)
   - Answer FAQs (Knowledge base)
   - Capture lead information
   - Route to human agent if needed
5. **Return response** to widget

---

## Testing Your Setup

### 1. Test the Webhook
```bash
curl -X POST https://your-n8n-instance.com/webhook/your-id \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "chatInput": "Hello",
    "action": "sendMessage"
  }'
```

### 2. Expected Response
```json
{
  "output": "Hello! How can I help you today?"
}
```

### 3. Check n8n Execution Log
- Go to your n8n workflow
- Check "Executions" tab
- Verify the webhook received the data
- Check each node's output

---

## Troubleshooting

### CORS Error (Most Common Issue)

**Error Message:**
```
Access to fetch at 'https://n8n.aggarwal.ai/webhook/...' from origin 'null' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**What it means:** Your browser is blocking the request because the n8n server doesn't have CORS headers configured to allow requests from your origin.

**Solutions:**

#### Option 1: Configure CORS in n8n (Recommended)

Add a **Set** node in your n8n workflow before the **Respond to Webhook** node:

```javascript
// In n8n Set node - add these headers
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400"
}
```

#### Option 2: Handle OPTIONS Preflight Requests

Add an **IF** node to handle OPTIONS requests:

1. **IF** node condition: `{{ $json.headers['access-control-request-method'] }}` exists
2. **True branch**: Return CORS headers with 200 status
3. **False branch**: Continue with normal webhook processing

#### Option 3: Test from a Web Server

Instead of opening the HTML file directly (`file://`), serve it from a web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then access `http://localhost:8000/embed_example.html`

#### Option 4: Use CORS Proxy (For Testing)

1. Install dependencies: `npm install`
2. Run the proxy: `npm start`
3. Update your webhook URL to: `http://localhost:3001/proxy/n8n-chat`

### Widget shows "webhook URL not configured"
- Make sure `webhookUrl` is set in `ChatWidgetConfig`
- Verify the URL is correct and accessible

### No response from n8n
- Check n8n workflow is activated
- Verify webhook URL is correct
- Check CORS settings in n8n (should allow your domain)
- Look at n8n execution logs for errors

### Session not persisting
- Check browser localStorage is enabled
- Verify `chatSessionKey` matches what your workflow expects

### Response not displaying
- Ensure n8n returns one of: `output`, `response`, `message`, or `text`
- Check browser console for errors
- Verify JSON response format

---

## CORS Proxy Setup (For Development/Testing)

If you can't modify the n8n CORS settings, use the included CORS proxy:

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the proxy server:**
   ```bash
   npm start
   ```

3. **Update your webhook URL in the chat widget:**
   ```javascript
   window.ChatWidgetConfig = {
     webhookUrl: "http://localhost:3001/proxy/n8n-chat",
     // ... other config
   };
   ```

4. **Test your chat widget** - it should now work without CORS errors

### How the Proxy Works

The proxy server:
- Receives requests from your chat widget
- Forwards them to your n8n webhook
- Adds proper CORS headers to the response
- Returns the response to your widget

### Production Considerations

- **Don't use the proxy in production** - configure CORS properly in n8n instead
- The proxy is only for development/testing purposes
- For production, use Option 1 or 2 from the CORS troubleshooting section

---

## Alternative Solutions

### Server-Side Proxy

If you have a backend server, create an endpoint that proxies requests to n8n:

```javascript
// Express.js example
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://n8n.aggarwal.ai/webhook/...', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Request failed' });
  }
});
```

### n8n Cloud Configuration

If using n8n Cloud, you may need to:
1. Go to your n8n instance settings
2. Enable CORS for your domain
3. Add your domain to the allowed origins list

---

## Security Best Practices

1. **Use HTTPS** for your n8n webhook
2. **Add authentication** to your webhook if needed
3. **Validate input** in your n8n workflow
4. **Rate limit** requests in n8n
5. **Sanitize output** before sending to user
6. **Use environment variables** for sensitive data in n8n

---

## Full HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Chat Widget with n8n</title>
</head>
<body>
  <h1>Welcome to Our Site</h1>
  
  <!-- Configure BEFORE loading script -->
  <script>
    window.ChatWidgetConfig = {
      webhookUrl: "https://your-n8n-instance.com/webhook/abc123",
      welcomeMessage: "Hello! Welcome to The Grout Medic.",
      subtitle: "I am here to help.",
      actionButtons: [
        { text: "Free Estimate", action: "estimate" },
        { text: "I have a question", action: "question" },
        { text: "Other", action: "other" }
      ],
      chatInputKey: "chatInput",
      chatSessionKey: "sessionId",
      metadata: {
        source: "website",
        page: window.location.pathname
      }
    };
  </script>
  
  <!-- Load the widget script -->
  <script src="https://your-cdn.com/chat-widget.js"></script>
</body>
</html>
```

---

## Key Features

✅ **Session Persistence** - Each user gets a unique session ID stored in localStorage  
✅ **n8n Compatible** - Follows @n8n/chat webhook pattern  
✅ **Configurable Actions** - Custom buttons to guide conversation flow  
✅ **Metadata Support** - Send additional context with each message  
✅ **Error Handling** - Graceful fallbacks and error callbacks  
✅ **Typing Indicators** - Shows when bot is "thinking"  
✅ **No Dependencies** - Pure vanilla JavaScript, no frameworks needed

---

## Configuration Reference

### Required Settings

| Setting | Type | Description |
|---------|------|-------------|
| `webhookUrl` | string | Your n8n webhook URL (REQUIRED) |

### UI Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `welcomeMessage` | string | "Hello! Welcome to our chat." | Welcome screen title |
| `subtitle` | string | "I am here to help." | Welcome screen subtitle |
| `primaryColor` | string | "#0891b2" | Widget theme color |
| `agentName` | string | "Support Agent" | Agent name for avatar |
| `agentAvatar` | string | (URL) | Agent avatar image URL |
| `showAgent` | boolean | true | Show/hide agent avatar |

### Action Buttons

| Setting | Type | Description |
|---------|------|-------------|
| `actionButtons` | array | Array of button objects with `text` and `action` properties |

Example:
```javascript
actionButtons: [
  { text: "Get Started", action: "get_started" },
  { text: "Book Appointment", action: "booking" }
]
```

### n8n Integration Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `chatInputKey` | string | "chatInput" | Key name for message content in request |
| `chatSessionKey` | string | "sessionId" | Key name for session ID in request |
| `metadata` | object | {} | Additional data sent with each request |

### Callbacks

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onMessageSend` | (message, action) | Called before sending message to n8n |
| `onMessageReceive` | (response) | Called when response received from n8n |
| `onError` | (error) | Called when an error occurs |

---

## Working with ServiceMinder

For The Grout Medic integration, your n8n workflow can interact with ServiceMinder:

### Example Workflow Steps:

1. **Webhook** receives chat message
2. **Function** node extracts intent
3. **Switch** node routes by intent:
   - "estimate" → Capture contact info → ServiceMinder create contact
   - "schedule" → Search slots → ServiceMinder book appointment
   - "question" → AI Agent with knowledge base
4. **Respond to Webhook** sends reply back to widget

### ServiceMinder Integration Node Example:

```javascript
// In n8n Function node
const userMessage = $input.item.json.chatInput;
const sessionId = $input.item.json.sessionId;

// Extract contact info using AI or regex
const phoneMatch = userMessage.match(/\d{3}-\d{3}-\d{4}/);
const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/);

return {
  json: {
    phone: phoneMatch ? phoneMatch[0] : null,
    email: emailMatch ? emailMatch[0] : null,
    message: userMessage,
    sessionId: sessionId
  }
};
```

Then use HTTP Request node to call ServiceMinder API (see your ServiceMinder API Integration Guide document).

---

## localStorage Keys

The widget uses these localStorage keys:

- `n8n_chat_session_id` - Stores the unique session identifier

To clear chat history:
```javascript
localStorage.removeItem('n8n_chat_session_id');
```

---

## Multiple Instances

You can run multiple chat widgets on different pages with different configurations:

**Contact Page:**
```javascript
window.ChatWidgetConfig = {
  webhookUrl: "https://n8n.example.com/webhook/contact",
  welcomeMessage: "Contact Sales",
  actionButtons: [
    { text: "Request Demo", action: "demo" },
    { text: "Get Pricing", action: "pricing" }
  ]
};
```

**Support Page:**
```javascript
window.ChatWidgetConfig = {
  webhookUrl: "https://n8n.example.com/webhook/support",
  welcomeMessage: "Need Help?",
  actionButtons: [
    { text: "Technical Issue", action: "tech_support" },
    { text: "Billing Question", action: "billing" }
  ]
};
```

---

## Analytics Integration

Track chat events with Google Analytics:

```javascript
window.ChatWidgetConfig = {
  webhookUrl: "https://your-n8n-instance.com/webhook/abc123",
  
  onMessageSend: function(message, action) {
    // Track message sent
    gtag('event', 'chat_message_sent', {
      'event_category': 'Chat',
      'event_label': action,
      'value': message.length
    });
  },
  
  onMessageReceive: function(response) {
    // Track response received
    gtag('event', 'chat_response_received', {
      'event_category': 'Chat'
    });
  },
  
  onError: function(error) {
    // Track errors
    gtag('event', 'chat_error', {
      'event_category': 'Chat',
      'event_label': error.message
    });
  }
};
```

---

## Next Steps

1. ✅ Set up your n8n instance
2. ✅ Create a webhook workflow
3. ✅ Copy the webhook URL
4. ✅ Configure the chat widget
5. ✅ Test the integration
6. ✅ Add AI Agent (optional)
7. ✅ Connect to ServiceMinder (for appointment booking)
8. ✅ Deploy to production

---

## Support & Resources

- **n8n Documentation**: https://docs.n8n.io
- **n8n Community**: https://community.n8n.io
- **@n8n/chat Package**: https://www.npmjs.com/package/@n8n/chat
- **ServiceMinder API**: Your ServiceMinder API Integration Guide document

---

## Example: Complete Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Grout Medic - Chat</title>
</head>
<body>
  <h1>Welcome to The Grout Medic</h1>
  <p>We're here to help with all your tile and grout needs!</p>
  
  <script>
    // Configure chat widget
    window.ChatWidgetConfig = {
      // REQUIRED: Your n8n webhook URL
      webhookUrl: "https://your-n8n.com/webhook/grout-medic-chat",
      
      // UI Customization
      welcomeMessage: "Hello! Welcome to The Grout Medic.",
      subtitle: "I am a live person here to help.",
      primaryColor: "#0891b2",
      
      // Action Buttons
      actionButtons: [
        { text: "Free Estimate", action: "estimate" },
        { text: "I have a question", action: "question" },
        { text: "Schedule Service", action: "schedule" }
      ],
      
      // Agent Avatar
      agentName: "Ron",
      agentAvatar: "https://your-domain.com/agent-photo.jpg",
      showAgent: true,
      
      // n8n Settings
      chatInputKey: "chatInput",
      chatSessionKey: "sessionId",
      
      // Metadata
      metadata: {
        source: "website",
        location: "Naperville, IL",
        page: window.location.pathname
      },
      
      // Analytics
      onMessageSend: function(message, action) {
        console.log("Message sent:", message);
        if (typeof gtag !== 'undefined') {
          gtag('event', 'chat_interaction', {
            'event_category': 'Chat',
            'event_label': action
          });
        }
      }
    };
  </script>
  
  <!-- Load widget script -->
  <script src="/path/to/chat-widget.js"></script>
</body>
</html>