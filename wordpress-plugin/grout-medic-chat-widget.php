<?php
/**
 * Plugin Name: Grout Medic Chat Widget
 * Description: AI-powered chat widget with n8n integration for real-time customer support
 * Version: 1.0.0
 * Author: Explained Consulting
 * Author URI: https://www.explained.consulting
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('GROUT_CHAT_VERSION', '1.0.0');
define('GROUT_CHAT_PATH', plugin_dir_path(__FILE__));
define('GROUT_CHAT_URL', plugin_dir_url(__FILE__));
define('GROUT_CHAT_BASENAME', plugin_basename(__FILE__));

/**
 * Main Plugin Class
 */
class Grout_Medic_Chat_Widget {
    
    private $options_name = 'grout_chat_settings';
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('plugins_loaded', array($this, 'init'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Admin hooks
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu'));
            add_action('admin_init', array($this, 'register_settings'));
            add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        }
        
        // Frontend hooks
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
        add_action('wp_footer', array($this, 'inject_widget_config'));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'Chat Widget Settings',
            'Chat Widget',
            'manage_options',
            'grout-chat-settings',
            array($this, 'render_admin_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        // Register settings group
        register_setting(
            'grout_chat_settings_group',
            $this->options_name,
            array($this, 'sanitize_settings')
        );
        
        // Add settings sections
        add_settings_section(
            'grout_chat_basic',
            'Basic Settings',
            array($this, 'render_basic_section'),
            'grout-chat-settings'
        );
        
        add_settings_section(
            'grout_chat_agent',
            'Agent Settings',
            array($this, 'render_agent_section'),
            'grout-chat-settings'
        );
        
        // Register settings fields
        $this->add_settings_fields();
    }
    
    /**
     * Add settings fields
     */
    private function add_settings_fields() {
        // Webhook URL
        add_settings_field(
            'webhook_url',
            'Webhook URL <span class="required">*</span>',
            array($this, 'render_webhook_field'),
            'grout-chat-settings',
            'grout_chat_basic'
        );
        
        // Primary Color
        add_settings_field(
            'primary_color',
            'Primary Color',
            array($this, 'render_color_field'),
            'grout-chat-settings',
            'grout_chat_basic'
        );
        
        // Welcome Message
        add_settings_field(
            'welcome_message',
            'Welcome Message',
            array($this, 'render_welcome_field'),
            'grout-chat-settings',
            'grout_chat_basic'
        );
        
        // Subtitle
        add_settings_field(
            'subtitle',
            'Subtitle',
            array($this, 'render_subtitle_field'),
            'grout-chat-settings',
            'grout_chat_basic'
        );
        
        // Agent Name
        add_settings_field(
            'agent_name',
            'Agent Name',
            array($this, 'render_agent_name_field'),
            'grout-chat-settings',
            'grout_chat_agent'
        );
        
        // Agent Avatar
        add_settings_field(
            'agent_avatar',
            'Agent Avatar URL',
            array($this, 'render_agent_avatar_field'),
            'grout-chat-settings',
            'grout_chat_agent'
        );
        
        // Action Buttons
        add_settings_field(
            'action_buttons',
            'Action Buttons',
            array($this, 'render_action_buttons_field'),
            'grout-chat-settings',
            'grout_chat_basic'
        );
        
        // Session Timeout
        add_settings_field(
            'conversation_timeout',
            'Session Timeout (minutes)',
            array($this, 'render_timeout_field'),
            'grout-chat-settings',
            'grout_chat_basic'
        );
    }
    
    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized = array();
        
        // Sanitize webhook URL
        if (isset($input['webhook_url'])) {
            $sanitized['webhook_url'] = esc_url_raw($input['webhook_url']);
        }
        
        // Sanitize color
        if (isset($input['primary_color'])) {
            $sanitized['primary_color'] = sanitize_hex_color($input['primary_color']);
        }
        
        // Sanitize text fields
        $sanitized['welcome_message'] = isset($input['welcome_message']) ? sanitize_textarea_field($input['welcome_message']) : '';
        $sanitized['subtitle'] = isset($input['subtitle']) ? sanitize_text_field($input['subtitle']) : '';
        $sanitized['agent_name'] = isset($input['agent_name']) ? sanitize_text_field($input['agent_name']) : '';
        $sanitized['agent_avatar'] = isset($input['agent_avatar']) ? esc_url_raw($input['agent_avatar']) : '';
        
        // Sanitize action buttons JSON
        if (isset($input['action_buttons'])) {
            // Handle both string (JSON) and array inputs
            if (is_array($input['action_buttons'])) {
                // Already an array, sanitize directly
                $buttons = $input['action_buttons'];
            } else {
                // It's a string, decode JSON
                $buttons = json_decode(stripslashes($input['action_buttons']), true);
            }
            
            if (is_array($buttons)) {
                foreach ($buttons as &$button) {
                    if (isset($button['text'])) {
                        $button['text'] = sanitize_text_field($button['text']);
                    }
                    if (isset($button['action'])) {
                        $button['action'] = sanitize_text_field($button['action']);
                    }
                }
                $sanitized['action_buttons'] = $buttons;
            }
        }
        
        // Set default company info
        $sanitized['company_name'] = isset($input['company_name']) ? sanitize_text_field($input['company_name']) : 'The Grout Medic';
        $sanitized['company_tagline'] = isset($input['company_tagline']) ? sanitize_text_field($input['company_tagline']) : 'Chatting with Sarah';
        $sanitized['show_agent'] = isset($input['show_agent']) ? (bool) $input['show_agent'] : true;
        
        // Sanitize conversation timeout (default 5 minutes, 0 = disabled)
        if (isset($input['conversation_timeout'])) {
            $timeout = absint($input['conversation_timeout']);
            $sanitized['conversation_timeout'] = $timeout >= 0 ? $timeout : 5;
        } else {
            $sanitized['conversation_timeout'] = 5; // Default 5 minutes
        }
        
        return $sanitized;
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        if ($hook !== 'settings_page_grout-chat-settings') {
            return;
        }
        
        wp_enqueue_style(
            'wp-color-picker'
        );
        
        wp_enqueue_script(
            'grout-chat-admin',
            GROUT_CHAT_URL . 'assets/admin.js',
            array('jquery', 'wp-color-picker'),
            GROUT_CHAT_VERSION,
            true
        );
    }
    
    /**
     * Enqueue frontend assets
     */
    public function enqueue_frontend_assets() {
        // Load chat widget from plugin assets directory
        wp_enqueue_script(
            'grout-chat-widget',
            GROUT_CHAT_URL . 'assets/chat_widget.js',
            array(),
            GROUT_CHAT_VERSION,
            true // Load in footer
        );
    }
    
    /**
     * Inject widget configuration
     */
    public function inject_widget_config() {
        $settings = get_option($this->options_name, array());
        
        // Only inject if webhook is configured
        if (empty($settings['webhook_url'])) {
            return;
        }
        
        // Prepare config array
        $config = array();
        
        $config['webhookUrl'] = esc_url_raw($settings['webhook_url']);
        $config['primaryColor'] = isset($settings['primary_color']) ? $settings['primary_color'] : '#0891b2';
        $config['welcomeMessage'] = isset($settings['welcome_message']) ? $settings['welcome_message'] : 'Hello! Welcome to our chat.';
        $config['subtitle'] = isset($settings['subtitle']) ? $settings['subtitle'] : 'I am here to help.';
        $config['agentName'] = isset($settings['agent_name']) ? $settings['agent_name'] : 'Sarah';
        $config['agentAvatar'] = isset($settings['agent_avatar']) ? esc_url_raw($settings['agent_avatar']) : '';
        $config['showAgent'] = isset($settings['show_agent']) ? $settings['show_agent'] : true;
        $config['companyName'] = isset($settings['company_name']) ? $settings['company_name'] : 'The Grout Medic';
        $config['companyTagline'] = isset($settings['company_tagline']) ? $settings['company_tagline'] : 'Chatting with Sarah';
        
        // Action buttons
        if (isset($settings['action_buttons']) && is_array($settings['action_buttons'])) {
            $config['actionButtons'] = $settings['action_buttons'];
        } else {
            $config['actionButtons'] = array(
                array('text' => 'Get Started', 'action' => 'get_started'),
                array('text' => 'I have a question', 'action' => 'question'),
                array('text' => 'Other', 'action' => 'other')
            );
        }
        
        // Add metadata
        $config['metadata'] = array(
            'source' => 'wordpress',
            'site_url' => home_url(),
            'page' => get_the_title() . ' - ' . get_permalink(),
            'timestamp' => current_time('mysql'),
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''
        );
        
        // Add session timeout (default 5 minutes)
        $config['conversationTimeoutMinutes'] = isset($settings['conversation_timeout']) ? absint($settings['conversation_timeout']) : 5;
        
        // Ensure chatInputKey and chatSessionKey are set (for compatibility)
        $config['chatInputKey'] = 'chatInput';
        $config['chatSessionKey'] = 'sessionId';
        
        // Output configuration as JavaScript
        echo '<script type="text/javascript">' . "\n";
        echo 'window.ChatWidgetConfig = ' . json_encode($config, JSON_UNESCAPED_SLASHES) . ';' . "\n";
        echo '</script>' . "\n";
    }
    
    /**
     * Render admin page
     */
    public function render_admin_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <?php if (isset($_GET['settings-updated'])) : ?>
                <div class="notice notice-success is-dismissible">
                    <p><strong><?php esc_html_e('Settings saved.'); ?></strong></p>
                </div>
            <?php endif; ?>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('grout_chat_settings_group');
                do_settings_sections('grout-chat-settings');
                submit_button();
                ?>
            </form>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2 style="margin-top: 0;">📖 How to Configure</h2>
                <ol>
                    <li><strong>Set your webhook URL</strong> - This is the n8n webhook endpoint that receives chat messages</li>
                    <li><strong>Customize colors & messaging</strong> - Match your brand colors and welcome messages</li>
                    <li><strong>Configure agent info</strong> - Set the agent name and avatar image</li>
                    <li><strong>Add action buttons</strong> - Customize the welcome screen buttons</li>
                    <li><strong>Save settings</strong> - The widget will appear on your site immediately</li>
                </ol>
                
                <h3>Need Help?</h3>
                <p>Check the <a href="<?php echo GROUT_CHAT_PATH; ?>readme.txt" target="_blank">documentation</a> for detailed setup instructions.</p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Section callbacks
     */
    public function render_basic_section() {
        echo '<p>Configure the basic appearance and webhook connection.</p>';
    }
    
    public function render_agent_section() {
        echo '<p>Customize the agent information displayed in the chat.</p>';
    }
    
    /**
     * Field renderers
     */
    public function render_webhook_field() {
        $options = get_option($this->options_name);
        $value = isset($options['webhook_url']) ? esc_attr($options['webhook_url']) : '';
        echo '<input type="url" name="' . $this->options_name . '[webhook_url]" value="' . $value . '" class="regular-text" placeholder="https://n8n.example.com/webhook/xxx" required>';
        echo '<p class="description">Your n8n webhook URL. This is required for the widget to function.</p>';
    }
    
    public function render_color_field() {
        $options = get_option($this->options_name);
        $value = isset($options['primary_color']) ? esc_attr($options['primary_color']) : '#0891b2';
        echo '<input type="text" name="' . $this->options_name . '[primary_color]" value="' . $value . '" class="grout-color-picker" />';
        echo '<p class="description">Choose the primary color for buttons and accents.</p>';
    }
    
    public function render_welcome_field() {
        $options = get_option($this->options_name);
        $value = isset($options['welcome_message']) ? esc_textarea($options['welcome_message']) : 'Hello! Welcome to our chat.';
        echo '<textarea name="' . $this->options_name . '[welcome_message]" rows="3" class="large-text">' . $value . '</textarea>';
        echo '<p class="description">The main welcome message shown in the chat.</p>';
    }
    
    public function render_subtitle_field() {
        $options = get_option($this->options_name);
        $value = isset($options['subtitle']) ? esc_attr($options['subtitle']) : 'I am here to help.';
        echo '<input type="text" name="' . $this->options_name . '[subtitle]" value="' . $value . '" class="regular-text" />';
        echo '<p class="description">Subtitle shown below the welcome message.</p>';
    }
    
    public function render_agent_name_field() {
        $options = get_option($this->options_name);
        $value = isset($options['agent_name']) ? esc_attr($options['agent_name']) : 'Sarah';
        echo '<input type="text" name="' . $this->options_name . '[agent_name]" value="' . $value . '" class="regular-text" />';
        echo '<p class="description">The name of your support agent.</p>';
    }
    
    public function render_agent_avatar_field() {
        $options = get_option($this->options_name);
        $value = isset($options['agent_avatar']) ? esc_attr($options['agent_avatar']) : '';
        echo '<input type="url" name="' . $this->options_name . '[agent_avatar]" value="' . $value . '" class="regular-text" placeholder="https://example.com/avatar.png" />';
        echo '<p class="description">URL to the agent\'s avatar image (recommended: 512x512px).</p>';
    }
    
    public function render_action_buttons_field() {
        $options = get_option($this->options_name);
        $default_buttons = array(
            array('text' => 'Get Started', 'action' => 'get_started'),
            array('text' => 'I have a question', 'action' => 'question'),
            array('text' => 'Other', 'action' => 'other')
        );
        
        if (isset($options['action_buttons']) && is_array($options['action_buttons'])) {
            $buttons = $options['action_buttons'];
        } else {
            $buttons = $default_buttons;
        }
        
        $buttons_json = json_encode($buttons, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $buttons_json = esc_textarea($buttons_json);
        
        echo '<textarea name="' . $this->options_name . '[action_buttons]" rows="8" class="large-text code" style="font-family: monospace; font-size: 13px;">' . $buttons_json . '</textarea>';
        echo '<p class="description">JSON array of action buttons. Format: [{"text": "Button Text", "action": "action_name"}]</p>';
    }
    
    public function render_timeout_field() {
        $options = get_option($this->options_name);
        $value = isset($options['conversation_timeout']) ? absint($options['conversation_timeout']) : 5;
        echo '<input type="number" name="' . $this->options_name . '[conversation_timeout]" value="' . $value . '" min="0" max="1440" class="small-text" />';
        echo '<p class="description">Conversation timeout in minutes. After this time of inactivity, the session will expire. Default: 5 minutes. Set to 0 to disable timeout.</p>';
    }
}

// Initialize plugin
new Grout_Medic_Chat_Widget();

