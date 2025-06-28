document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initSettings();
  initEventListeners();
  initToastSystem();
});

function initSettings() {
  // Load all saved settings at once
  chrome.storage.sync.get(
    ['adBlockEnabled', 'shortsDisabled', 'commentFilterEnabled', 'filterKeywords', 'incognitoMode', 'disableHistory', 'disableTracking'],
    function(data) {
      // Set initial toggle states with proper fallbacks
      setToggleState('adBlockToggle', data.adBlockEnabled !== false);
      setToggleState('shortsToggle', data.shortsDisabled || false);
      setToggleState('commentFilterToggle', data.commentFilterEnabled || false);
      setToggleState('incognitoToggle', data.incognitoMode || false);
      setToggleState('disableHistory', data.disableHistory || false);
      setToggleState('disableTracking', data.disableTracking || false);

      // Show/hide filter options based on saved state
      toggleElementVisibility('filterOptions', data.commentFilterEnabled);
      toggleElementVisibility('incognitoOptions', data.incognitoMode);

      // Set saved keywords if they exist
      if (data.filterKeywords && data.filterKeywords.length > 0) {
        document.getElementById('filterKeywords').value = data.filterKeywords.join(', ');
      }
    }
  );
}

function initEventListeners() {
  // Comment Filter Toggle
  document.getElementById('commentFilterToggle').addEventListener('change', function() {
    toggleElementVisibility('filterOptions', this.checked);
    saveSetting('commentFilterEnabled', this.checked);
    sendContentMessage('updateCommentFilter', { enabled: this.checked });
  });

  // Ad Block Toggle
  document.getElementById('adBlockToggle').addEventListener('change', function() {
    saveSetting('adBlockEnabled', this.checked);
    showToast(this.checked ? 'Ad blocker enabled' : 'Ad blocker disabled');
  });

  // Shorts Toggle
  document.getElementById('shortsToggle').addEventListener('change', function() {
    saveSetting('shortsDisabled', this.checked);
    sendContentMessage('toggleShorts', { disabled: this.checked });
    showToast(this.checked ? 'Shorts disabled' : 'Shorts enabled');
  });

  // Incognito Mode Toggle
  document.getElementById('incognitoToggle').addEventListener('change', function() {
    toggleElementVisibility('incognitoOptions', this.checked);
    saveSetting('incognitoMode', this.checked);
    sendContentMessage('updateIncognitoMode', { enabled: this.checked });
  });

  // Incognito Sub-options
  document.querySelectorAll('#incognitoOptions input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      saveSetting(this.id, this.checked);
      sendContentMessage('updateSetting', { key: this.id, value: this.checked });
    });
  });

  // Save Filter Keywords
  document.getElementById('saveKeywords').addEventListener('click', function() {
    const keywordsInput = document.getElementById('filterKeywords').value;
    const keywords = keywordsInput.split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    if (keywords.length === 0) {
      showToast('Please enter at least one keyword', 'error');
      return;
    }

    saveSetting('filterKeywords', keywords);
    sendContentMessage('updateFilterKeywords', { keywords: keywords });
    showToast(`Saved ${keywords.length} filter keywords`);
  });

  // Settings Button
  document.getElementById('settingsBtn').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Enhanced Feedback Button
  document.getElementById('feedbackBtn').addEventListener('click', function() {
    const subject = encodeURIComponent('YouTube Enhancer Feedback');
    const body = encodeURIComponent(
      `I'd like to share some feedback about YouTube Enhancer:\n\n` +
      `Current version: ${chrome.runtime.getManifest().version}\n` +
      `Browser: ${navigator.userAgent}`
    );
    window.open(`mailto:ranjanashish8739@gmail.com?subject=${subject}&body=${body}`);
  });
}

// Helper Functions
function setToggleState(elementId, state) {
  const element = document.getElementById(elementId);
  if (element) element.checked = state;
}

function toggleElementVisibility(elementId, show) {
  const element = document.getElementById(elementId);
  if (element) element.style.display = show ? 'block' : 'none';
}

function saveSetting(key, value) {
  chrome.storage.sync.set({ [key]: value }, function() {
    if (chrome.runtime.lastError) {
      console.error(`Error saving ${key}:`, chrome.runtime.lastError);
    }
  });
}

function sendContentMessage(action, data) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, function(response) {
        if (chrome.runtime.lastError) {
          // Expected error when content script isn't injected yet
          console.log('Content script not ready:', chrome.runtime.lastError);
        }
      });
    }
  });
}

// Toast Notification System
function initToastSystem() {
  // Add CSS for toast animation
  const style = document.createElement('style');
  style.textContent = `
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--primary);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: fadeInOut 2.5s ease-in-out;
      max-width: 80%;
      text-align: center;
    }
    .toast.error {
      background-color: #ff4444;
    }
    .toast.success {
      background-color: #00C851;
    }
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
      10% { opacity: 1; transform: translateX(-50%) translateY(0); }
      90% { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }
  `;
  document.head.appendChild(style);
}

function showToast(message, type = '') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // Remove any existing toasts
  document.querySelectorAll('.toast').forEach(el => el.remove());
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 2500);
}