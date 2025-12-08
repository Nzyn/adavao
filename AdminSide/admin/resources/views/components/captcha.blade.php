{{-- Captcha Component --}}
<div class="captcha-container" style="margin-bottom: 1rem;">
    <label class="form-label">Security Check</label>
    <div style="display: flex; gap: 0.5rem; align-items: center;">
        <canvas id="captchaCanvas" width="180" height="50" style="border: 1.5px solid #d1d5db; border-radius: 6px; background: #f9fafb; cursor: pointer;" onclick="generateCaptcha()"></canvas>
        <button type="button" onclick="generateCaptcha()" style="padding: 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; min-width: 80px;">
            ↻ Refresh
        </button>
    </div>
    <input 
        type="text" 
        id="captchaInput" 
        name="captcha_input" 
        class="form-input @error('captcha_input') error @enderror" 
        placeholder="Enter the code above"
        maxlength="6"
        autocomplete="off"
        required
        style="margin-top: 0.5rem;"
        oninput="validateCaptcha()"
    >
    <input type="hidden" id="captchaWord" name="captcha_word" value="">
    <span id="captchaError" class="error-message" style="display: none;">Incorrect captcha code</span>
    @error('captcha_input')
        <span class="error-message">{{ $message }}</span>
    @enderror
</div>

<script>
let currentCaptcha = '';

// Generate random alphanumeric captcha (6 characters: A-Z, 2-9)
function generateCaptchaWord(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: I, O, 0, 1
    let word = '';
    for (let i = 0; i < length; i++) {
        word += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return word;
}

// Draw captcha on canvas with obfuscation
function drawCaptcha(canvas, word) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, width, height);
    
    // Add noise lines
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(59, 130, 246, ${Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.lineWidth = 1 + Math.random();
        ctx.stroke();
    }
    
    // Draw characters with distortion
    const charWidth = width / word.length;
    ctx.font = 'bold 28px Arial';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const x = charWidth * i + charWidth / 2;
        const y = height / 2;
        
        // Random rotation and position offset
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.4);
        
        // Random color (dark shades)
        const colors = ['#1D3557', '#2563eb', '#1e40af', '#374151', '#111827'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        
        // Draw character
        ctx.fillText(char, -10, 0);
        ctx.restore();
    }
    
    // Add noise dots
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2})`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
}

// Generate and display new captcha
function generateCaptcha() {
    currentCaptcha = generateCaptchaWord(6);
    document.getElementById('captchaWord').value = currentCaptcha;
    
    const canvas = document.getElementById('captchaCanvas');
    drawCaptcha(canvas, currentCaptcha);
    
    // Clear input and error
    document.getElementById('captchaInput').value = '';
    document.getElementById('captchaError').style.display = 'none';
    
    console.log('🔐 Captcha generated:', currentCaptcha); // Debug only
}

// Validate captcha input
function validateCaptcha() {
    const input = document.getElementById('captchaInput').value.toUpperCase();
    const errorSpan = document.getElementById('captchaError');
    const submitBtn = document.getElementById('proceedBtn') || document.getElementById('submitBtn') || document.getElementById('registerBtn');
    
    if (input.length === 6) {
        if (input === currentCaptcha) {
            errorSpan.style.display = 'none';
            document.getElementById('captchaInput').style.borderColor = '#10b981';
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = '#1D3557';
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
            return true;
        } else {
            errorSpan.style.display = 'block';
            document.getElementById('captchaInput').style.borderColor = '#ef4444';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.backgroundColor = '#999';
                submitBtn.style.opacity = '0.6';
                submitBtn.style.cursor = 'not-allowed';
            }
            return false;
        }
    } else {
        errorSpan.style.display = 'none';
        document.getElementById('captchaInput').style.borderColor = '#d1d5db';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = '#999';
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';
        }
        return false;
    }
}

// Initialize captcha on page load
document.addEventListener('DOMContentLoaded', function() {
    generateCaptcha();
    // Disable submit button initially
    const submitBtn = document.getElementById('proceedBtn') || document.getElementById('submitBtn') || document.getElementById('registerBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.backgroundColor = '#999';
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
    }
});
</script>
