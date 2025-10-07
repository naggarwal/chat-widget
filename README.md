# Chat Widget for n8n Integration

A modern, responsive chat widget designed to work seamlessly with n8n webhooks. This widget provides a professional chat interface that can be easily embedded into any website.

## 🚀 Features

- **n8n Compatible**: Designed to work with n8n webhooks following the @n8n/chat pattern
- **Professional UI**: Modern design with company branding and agent avatars
- **Mobile Responsive**: Fully responsive design that works on all devices
- **Session Persistence**: Conversations persist across page reloads
- **Action Buttons**: Customizable quick-action buttons to guide user interactions
- **Legal Compliance**: Built-in recording disclaimers and privacy policy links
- **No Dependencies**: Pure vanilla JavaScript, no frameworks required

## 📁 Files

- `chat_widget.js` - Main widget script (development version)
- `chat_widget.min.js` - Minified production version
- `chat_widget_backup.js` - Backup of previous version
- `simple_test.html` - Simple test page for the widget
- `webhook_config_example.md` - Detailed configuration guide
- `embed_example.html` - Complete example with all configuration options (local only, not tracked in Git)

## 🛠️ Quick Start

### 1. Basic Setup

Add this to your HTML page:

```html
<script>
window.ChatWidgetConfig = {
  webhookUrl: "https://your-n8n-instance.com/webhook/your-webhook-id",
  welcomeMessage: "Hello! Welcome to our chat.",
  subtitle: "I'm here to help you.",
  primaryColor: "#0891b2"
};
</script>
<script src="https://cdn.jsdelivr.net/gh/naggarwal/chat-widget@main/chat_widget.min.js"></script>
```

### 2. n8n Webhook Setup

Create a webhook in n8n that accepts POST requests with this payload format:

```json
{
  "action": "estimate",
  "sessionId": "session_1234567890_abc123",
  "chatInput": "I need a free estimate",
  "source": "website",
  "page": "/contact"
}
```

Your n8n workflow should return a response in this format:

```json
{
  "output": "Thank you! I'd be happy to provide a free estimate."
}
```

## ⚙️ Configuration Options

### Required Settings
- `webhookUrl` - Your n8n webhook URL

### UI Customization
- `welcomeMessage` - Welcome screen title
- `subtitle` - Welcome screen subtitle  
- `primaryColor` - Widget theme color (hex)
- `agentName` - Agent name for avatar
- `agentAvatar` - Agent avatar image URL
- `showAgent` - Show/hide agent avatar

### Company Branding
- `companyName` - Company name in header
- `companyTagline` - Subtitle in header

### Action Buttons
```javascript
actionButtons: [
  { text: "Free Estimate", action: "estimate" },
  { text: "I have a question", action: "question" },
  { text: "Other", action: "other" }
]
```

### Legal & Compliance
- `recordingDisclaimer` - Legal disclaimer text
- `termsOfUseUrl` - Terms of Use link
- `privacyPolicyUrl` - Privacy Policy link
- `poweredBy` - Attribution text
- `poweredByUrl` - Attribution link

### n8n Integration
- `chatInputKey` - Key name for message content (default: "chatInput")
- `chatSessionKey` - Key name for session ID (default: "sessionId")
- `metadata` - Additional data sent with each request

### Callbacks
- `onMessageSend(message, action)` - Called before sending message
- `onMessageReceive(response)` - Called when response received
- `onError(error)` - Called when an error occurs

## 📖 Documentation

For complete documentation and examples, see:
- `webhook_config_example.md` - Detailed configuration guide
- `embed_example.html` - Complete example with all options (local file)

## 🔧 Development

### Local Testing
1. Serve files from a web server (not file:// protocol due to CORS)
2. Use `simple_test.html` for basic testing
3. Use `embed_example.html` for full feature testing

### Building
The minified version is generated from `chat_widget.js`. To create a new minified version, use your preferred JavaScript minifier.

## 🚨 CORS Issues

If you encounter CORS errors when testing locally:

1. **Serve from a web server** instead of opening files directly
2. **Configure CORS in n8n** by adding headers to your webhook response
3. **Use a CORS proxy** for development (see webhook_config_example.md)

## 📱 Mobile Support

The widget is fully responsive and includes:
- Touch-friendly interface
- Optimized sizing for mobile screens
- Proper viewport handling
- iOS-specific optimizations

## 🔒 Security

### Built-in Security Features

- **XSS Protection**: All user inputs and configuration values are sanitized
- **Cryptographically Secure Sessions**: Session IDs use `crypto.getRandomValues()` for strong randomness
- **URL Validation**: Only http/https protocols allowed, prevents javascript: URI attacks
- **HTML Sanitization**: Custom sanitizer for markdown rendering prevents script injection
- **Configurable Storage**: Option to use sessionStorage instead of localStorage for sensitive data

### Security Configuration Options

```javascript
window.ChatWidgetConfig = {
  // Use sessionStorage for sensitive conversations (data deleted when browser closes)
  useSessionStorage: true,  // Default: false

  // Other security-related settings...
  conversationTimeoutMinutes: 20,  // Auto-clear old conversations
};
```

### Security Best Practices

1. **Protect Your Webhook**: Implement rate limiting and authentication on your n8n webhook
2. **Use HTTPS**: Always serve the widget over HTTPS in production
3. **Validate Backend**: Never trust client-side data - validate all inputs in your n8n workflow
4. **Sensitive Data**: Enable `useSessionStorage: true` when handling PII (addresses, phone numbers, payment info)
5. **CORS Configuration**: Properly configure CORS headers in your n8n workflow
6. **Content Security Policy**: Consider adding CSP headers to your website

### Data Storage

By default, chat messages are stored in localStorage to persist conversations across page reloads. However:

- **localStorage** persists until explicitly cleared (use for general conversations)
- **sessionStorage** clears when browser tab closes (use for sensitive data with `useSessionStorage: true`)
- Users can manually clear conversation history using the 🔄 button in the chat header

**Warning**: If users share sensitive information (PII, payment details), consider using sessionStorage to ensure data doesn't persist after the browser session ends.

## 📄 License

This project is available for use in The Grout Medic and related projects.

## 🤝 Support

For questions or issues:
1. Check the `webhook_config_example.md` for detailed troubleshooting
2. Review the `embed_example.html` for complete configuration examples
3. Ensure your n8n webhook is properly configured and accessible

---

**Note**: The `embed_example.html` file is kept locally for reference but is not tracked in Git to keep the repository clean.
