=== Grout Medic Chat Widget ===
Contributors: explainedconsulting
Tags: chat, widget, customer support, n8n, chatbot, messenger
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-powered chat widget with n8n integration for real-time customer support.

== Description ==

A beautiful, responsive chat widget that integrates with n8n workflows to provide AI-powered customer support. Perfect for businesses looking to add live chat functionality with workflow automation.

== Features ==

* **Responsive Design**: Mobile-first design that works on all devices
* **n8n Integration**: Connect to your n8n webhooks for automated responses
* **Customizable Branding**: Match your brand colors and messaging
* **Agent Support**: Display agent name and avatar
* **Action Buttons**: Customize welcome screen buttons
* **Conversation Persistence**: Messages are saved and restored on page reload
* **Session Management**: Automatic conversation timeout and cleanup
* **Lightweight**: Fast loading with minimal performance impact
* **Secure**: WordPress security standards compliant

== Installation ==

1. Upload the `grout-medic-chat-widget` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to Settings > Chat Widget to configure
4. Add your n8n webhook URL
5. Customize colors, messages, and agent information
6. The chat widget will appear on your site automatically

== Frequently Asked Questions ==

= Do I need to host n8n? =

Yes, you need access to an n8n instance (self-hosted or n8n cloud). The widget sends messages to your n8n webhook endpoint which processes and responds.

= How do I get my n8n webhook URL? =

1. Create a webhook node in n8n
2. Copy the webhook URL (e.g., `https://your-n8n.com/webhook/xxx`)
3. Paste it into the plugin settings
4. Configure your n8n workflow to process chat messages

= Can I customize the widget appearance? =

Yes! Configure primary color, welcome messages, agent name, avatar, and action buttons in the plugin settings.

= Where does the chat widget appear? =

The widget appears as a floating button in the bottom-right corner of all pages. On mobile, it expands to full screen for optimal user experience.

= Is the chat data stored? =

Messages are temporarily stored in browser localStorage/sessionStorage for conversation continuity. They are also sent to your n8n workflow for processing. Make sure your n8n workflow handles data according to your privacy requirements.

== Screenshots ==

1. Admin settings page with configuration options
2. Chat widget on desktop view
3. Full-screen mobile experience

== Changelog ==

= 1.0.0 =
* Initial release
* Basic admin interface
* n8n webhook integration
* Responsive mobile design
* Agent customization
* Action buttons configuration
* Conversation persistence

== Upgrade Notice ==

= 1.0.0 =
Initial release. Install and configure your n8n webhook to start using the chat widget.

== Developer Notes ==

The plugin uses the chat_widget.js file from the parent directory. Make sure both files are present for the widget to function.

== Settings ==

The plugin stores configuration in the WordPress options table under `grout_chat_settings`.

Available settings:
* webhook_url - n8n webhook endpoint (required)
* primary_color - Brand color (hex)
* welcome_message - Main welcome text
* subtitle - Welcome subtitle
* agent_name - Agent name
* agent_avatar - Avatar image URL
* action_buttons - JSON array of action buttons

== Support ==

For support, documentation, and updates, visit: https://www.explained.consulting

