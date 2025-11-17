/**
 * Admin JavaScript for Chat Widget Settings
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Initialize WordPress color picker
        if ($('.grout-color-picker').length) {
            $('.grout-color-picker').wpColorPicker();
        }
    });
    
})(jQuery);

