/**
 * Ask Divyansh AI — Frontend Chat Controller
 * Manages UI state, message rendering, markdown links, and API communication.
 */

document.addEventListener('DOMContentLoaded', () => {
  initChatbot();
});

function initChatbot() {
  const triggerBtn = document.getElementById('chatbot-trigger');
  const chatWindow = document.getElementById('chatbot-window');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const resetBtn = document.getElementById('chatbot-reset-btn');
  const messagesContainer = document.getElementById('chatbot-messages');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send-btn');
  const typingIndicator = document.getElementById('chatbot-typing');

  if (!triggerBtn || !chatWindow || !form || !input) return;

  // Chat conversation history state
  let conversation = [];
  let isLoading = false;

  // Toggle chat window open / closed
  function toggleChat(forceOpen) {
    const isOpen = forceOpen !== undefined ? forceOpen : !chatWindow.classList.contains('open');
    chatWindow.classList.toggle('open', isOpen);
    triggerBtn.setAttribute('aria-expanded', String(isOpen));
    chatWindow.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      setTimeout(() => input.focus(), 150);
      scrollToBottom();
    }
  }

  triggerBtn.addEventListener('click', () => toggleChat());
  if (closeBtn) closeBtn.addEventListener('click', () => toggleChat(false));

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatWindow.classList.contains('open')) {
      toggleChat(false);
      triggerBtn.focus();
    }
  });

  // Reset conversation
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      conversation = [];
      resetToWelcome();
    });
  }

  // Handle suggestion chips click
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.suggestion-chip');
    if (chip) {
      const query = chip.getAttribute('data-query') || chip.textContent.trim();
      if (query && !isLoading) {
        handleUserMessage(query);
      }
    }
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text && !isLoading) {
      handleUserMessage(text);
    }
  });

  // Send message flow
  async function handleUserMessage(userText) {
    input.value = '';
    setLoading(true);

    // 1. Render User Message Bubble
    appendMessageBubble('user', userText);
    conversation.push({ role: 'user', content: userText });
    scrollToBottom();

    // 2. Fetch AI reply from server endpoint (/api/chat)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: conversation })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || "I'm sorry, I couldn't process that response.";

      // 3. Render Assistant Message Bubble
      appendMessageBubble('assistant', reply);
      conversation.push({ role: 'assistant', content: reply });
    } catch (err) {
      console.warn('API error, providing fallback assistant reply:', err.message);
      const fallbackMsg = getLocalFallback(userText);
      appendMessageBubble('assistant', fallbackMsg);
      conversation.push({ role: 'assistant', content: fallbackMsg });
    } finally {
      setLoading(false);
      scrollToBottom();
      input.focus();
    }
  }

  function setLoading(loading) {
    isLoading = loading;
    if (sendBtn) sendBtn.disabled = loading;
    if (typingIndicator) {
      if (loading) {
        typingIndicator.classList.add('show');
        // Ensure typing indicator stays at the bottom
        messagesContainer.appendChild(typingIndicator);
      } else {
        typingIndicator.classList.remove('show');
      }
    }
  }

  function appendMessageBubble(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg chat-msg-${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    if (role === 'user') {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = renderMarkdown(content);
    }

    const time = document.createElement('span');
    time.className = 'chat-time';
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(time);

    // Insert before typing indicator if present
    if (typingIndicator && messagesContainer.contains(typingIndicator)) {
      messagesContainer.insertBefore(msgDiv, typingIndicator);
    } else {
      messagesContainer.appendChild(msgDiv);
    }
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function resetToWelcome() {
    // Preserve welcome card and typing indicator
    const welcomeCard = document.getElementById('chatbot-welcome-card');
    messagesContainer.innerHTML = '';
    if (welcomeCard) messagesContainer.appendChild(welcomeCard);
    if (typingIndicator) messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
  }

  /**
   * Minimal, robust Markdown to HTML renderer for chat responses
   * Converts markdown links, bold text, lists, and code safely.
   */
  function renderMarkdown(text) {
    if (!text) return '';

    // Escape HTML tags to prevent XSS
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Markdown Links: [text](url) -> safe HTML link
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, (match, linkText, url) => {
      const isMail = url.startsWith('mailto:');
      const target = isMail ? '' : ' target="_blank" rel="noopener noreferrer"';
      return `<a href="${url}"${target}>${linkText}</a>`;
    });

    // Bold: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Inline Code: `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bullet Points: lines starting with • or - or *
    const lines = html.split('\n');
    let inList = false;
    const formattedLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          formattedLines.push('<ul>');
          inList = true;
        }
        formattedLines.push(`<li>${trimmed.substring(2)}</li>`);
      } else {
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        if (trimmed.length > 0) {
          formattedLines.push(`<p>${line}</p>`);
        }
      }
    });

    if (inList) {
      formattedLines.push('</ul>');
    }

    return formattedLines.join('');
  }

  /**
   * Client-side fallback if network or endpoint encounters issues
   */
  function getLocalFallback(query) {
    const q = query.toLowerCase();

    if (q.includes('project') || q.includes('repo') || q.includes('github')) {
      return `Divyansh has 6 verified GitHub repositories:\n\n1. [Factorial Algorithm](https://github.com/RAGHUVANSHI19/pyhton-basics-25BCON0085-factorial-main)\n2. [Fibonacci Sequence](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-fibonacci-main)\n3. [Struct to Dict Converter](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-struct-to-dict-main)\n4. [Code Refactoring (Grade Calculator)](https://github.com/RAGHUVANSHI19/correcting-grade-25BCON0085-main)\n5. [Quiz Application](https://github.com/RAGHUVANSHI19/QUIZ-PE-main)\n6. [Book Reading List](https://github.com/RAGHUVANSHI19/reading_list-main)\n\nAll repositories are public on his [GitHub Profile](https://github.com/RAGHUVANSHI19).`;
    }

    if (q.includes('education') || q.includes('college') || q.includes('university') || q.includes('study')) {
      return `Divyansh is studying for his **B.Tech in Computer Science Engineering (AI & ML)** at **JECRC University** in Jaipur, Rajasthan.`;
    }

    if (q.includes('skill') || q.includes('tech') || q.includes('stack')) {
      return `Divyansh's core technical toolkit includes:\n\n• **Frontend**: HTML, CSS, JavaScript, React\n• **Programming & Backend**: Python, C++, Node.js\n• **Data & Analytics**: Power BI, Excel, Chart.js, D3.js, Recharts`;
    }

    if (q.includes('contact') || q.includes('email') || q.includes('linkedin')) {
      return `You can reach Divyansh via:\n\n• **Email**: [raghuvanshidivyansh35@gmail.com](mailto:raghuvanshidivyansh35@gmail.com)\n• **LinkedIn**: [divyansh-raghuvanshi](https://www.linkedin.com/in/divyansh-raghuvanshi-18483a378)\n• **GitHub**: [github.com/RAGHUVANSHI19](https://github.com/RAGHUVANSHI19)`;
    }

    return `I can help you explore Divyansh's background, B.Tech education at JECRC University, technical skills, or his 6 GitHub projects! What would you like to know?`;
  }
}
