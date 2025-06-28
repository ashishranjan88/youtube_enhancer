// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'toggleShorts') {
    toggleShorts(request.disabled);
  } else if (request.action === 'updateCommentFilter') {
    if (request.enabled) {
      filterComments();
    } else {
      showAllComments();
    }
  } else if (request.action === 'updateFilterKeywords') {
    filterComments(request.keywords);
  }
});

// Load settings when page loads
chrome.storage.sync.get(['shortsDisabled', 'commentFilterEnabled', 'filterKeywords'], function(data) {
  if (data.shortsDisabled) {
    toggleShorts(true);
  }
  
  if (data.commentFilterEnabled) {
    filterComments(data.filterKeywords || []);
  }
});

// Function to hide/show YouTube Shorts
function toggleShorts(disabled) {
  if (disabled) {
    // Hide Shorts in sidebar
    const sidebarItems = document.querySelectorAll('ytd-guide-entry-renderer');
    sidebarItems.forEach(item => {
      if (item.innerText.includes('Shorts')) {
        item.style.display = 'none';
      }
    });
    
    // Hide Shorts shelf on home page
    const shelves = document.querySelectorAll('ytd-rich-shelf-renderer');
    shelves.forEach(shelf => {
      if (shelf.innerText.includes('Shorts')) {
        shelf.style.display = 'none';
      }
    });
    
    // Redirect from Shorts pages
    if (window.location.href.includes('/shorts/')) {
      window.location.href = 'https://www.youtube.com';
    }
  } else {
    // Show Shorts elements
    document.querySelectorAll('ytd-guide-entry-renderer, ytd-rich-shelf-renderer').forEach(el => {
      el.style.display = '';
    });
  }
}

// Function to filter comments based on keywords
function filterComments(keywords = []) {
  chrome.storage.sync.get(['filterKeywords'], function(data) {
    const filterTerms = keywords.length > 0 ? keywords : (data.filterKeywords || []);
    
    if (filterTerms.length === 0) return;
    
    const comments = document.querySelectorAll('ytd-comment-renderer, ytd-comment-thread-renderer');
    
    comments.forEach(comment => {
      const text = comment.innerText.toLowerCase();
      const shouldHide = filterTerms.some(term => text.includes(term.toLowerCase()));
      
      if (shouldHide) {
        comment.style.display = 'none';
        // Alternatively, you could mark it instead of hiding completely
        // comment.style.opacity = '0.5';
        // comment.style.borderLeft = '3px solid red';
      }
    });
  });
}

// Function to show all comments
function showAllComments() {
  document.querySelectorAll('ytd-comment-renderer, ytd-comment-thread-renderer').forEach(comment => {
    comment.style.display = '';
    // comment.style.opacity = '';
    // comment.style.borderLeft = '';
  });
}

// Observe DOM changes to handle dynamic content (like infinite scroll)
const observer = new MutationObserver(function(mutations) {
  chrome.storage.sync.get(['shortsDisabled', 'commentFilterEnabled'], function(data) {
    if (data.shortsDisabled) {
      toggleShorts(true);
    }
    
    if (data.commentFilterEnabled) {
      filterComments();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});