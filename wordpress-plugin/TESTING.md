# WordPress Plugin Testing Guide

## Quick Testing Options

### 1. LocalWP (Recommended - 5 minutes)
1. Download: https://localwp.com
2. Create new site: "Grout Medic Test"
3. Upload plugin folder to `/wp-content/plugins/`
4. Activate plugin from Plugins menu
5. Configure at Settings > Chat Widget

### 2. Cloud Testing (Instant)
- **InstaWP**: https://instawp.com
  - Click "Create new site"
  - Upload plugin as ZIP
  - Activate and test
  - Free temporary sites

### 3. Docker (15 minutes)
```bash
docker run -d -p 8080:80 \
  -e WORDPRESS_DB_HOST=db \
  -e WORDPRESS_DB_NAME=wordpress \
  --name wordpress \
  wordpress:latest
```
Then access: http://localhost:8080

## Installation Steps

1. **Upload Plugin**
   - Upload `wordpress-plugin` folder to `/wp-content/plugins/`
   - Or create a ZIP: `zip -r grout-medic-chat-widget.zip wordpress-plugin/`

2. **Activate**
   - Go to Plugins menu in WordPress
   - Find "Grout Medic Chat Widget"
   - Click "Activate"

3. **Configure**
   - Navigate to Settings > Chat Widget
   - Enter your n8n webhook URL
   - Customize colors, messages, agent info
   - Save settings

4. **Test**
   - Visit your WordPress site frontend
   - Look for chat button in bottom-right
   - Click to test the widget
   - Messages should flow to your n8n webhook

## Required Configuration

**Minimum required:**
- Webhook URL (from n8n)

**Recommended:**
- Primary Color
- Welcome Message
- Agent Name & Avatar
- Action Buttons (JSON format)

## Example n8n Webhook URL

```
https://n8n.example.com/webhook/abc123-def456-ghi789
```

## Troubleshooting

**Widget doesn't appear:**
- Check browser console for errors
- Verify chat_widget.js is accessible from parent directory
- Ensure webhook URL is configured

**Messages not sending:**
- Verify webhook URL is correct
- Check n8n workflow is active
- Test webhook directly with Postman/curl

**Mobile view issues:**
- Clear browser cache
- Test on actual mobile device, not just DevTools

## File Structure

```
wordpress-plugin/
├── grout-medic-chat-widget.php  (Main plugin file)
├── readme.txt                    (WordPress plugin readme)
├── assets/
│   └── admin.js                  (Admin color picker)
└── TESTING.md                    (This file)
```

## Quick Deploy

To deploy for testing:
```bash
cd wordpress-plugin
zip -r ../grout-medic-chat-widget.zip .
```

Then upload the ZIP to WordPress via Plugins > Add New > Upload Plugin.

