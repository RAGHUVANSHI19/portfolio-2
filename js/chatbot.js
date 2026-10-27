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

    let reply = null;

    // Check if we are on GitHub Pages or file protocol where /api/chat is not available
    const isStaticDeploy = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';

    if (!isStaticDeploy) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ messages: conversation }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && data.reply) {
            reply = data.reply;
          }
        }
      } catch (err) {
        console.warn('API fetch unavailable, using built-in grounded knowledge base:', err.message);
      }
    }

    // 2. If API didn't respond (or on GitHub Pages / static host), use grounded engine
    if (!reply) {
      // Simulate quick natural assistant thinking delay
      await new Promise(r => setTimeout(r, 250));
      reply = generateGroundedReply(userText);
    }

    // 3. Render Assistant Message Bubble
    appendMessageBubble('assistant', reply);
    conversation.push({ role: 'assistant', content: reply });
    setLoading(false);
    scrollToBottom();
    input.focus();
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
   * Smart Grounded Knowledge Base Engine
   * Provides accurate answers about Divyansh even in static environments (GitHub Pages, Netlify, Vercel)
   */
  function generateGroundedReply(userInput) {
    const query = userInput.toLowerCase();

    // 1. Projects & GitHub Repositories
    if (query.includes('project') || query.includes('repo') || query.includes('github') || query.includes('work') || query.includes('code')) {
      if (query.includes('factorial')) {
        return `Divyansh's **Factorial Algorithm** explores recursive and iterative factorial computation with boundary checks in Python.\n\n🔗 Repository: [pyhton-basics-factorial](https://github.com/RAGHUVANSHI19/pyhton-basics-25BCON0085-factorial-main)`;
      }
      if (query.includes('fibonacci')) {
        return `The **Fibonacci Sequence** project implements dynamic generation of Fibonacci series in Python, evaluating iterative sequences and time-complexity trade-offs.\n\n🔗 Repository: [python-basics-fibonacci](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-fibonacci-main)`;
      }
      if (query.includes('struct') || query.includes('dict')) {
        return `The **Struct to Dict Converter** is a lightweight Python data structure tool converting structured schemas, tuples, and objects into serializable dictionaries.\n\n🔗 Repository: [python-struct-to-dict](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-struct-to-dict-main)`;
      }
      if (query.includes('refactor') || query.includes('messy') || query.includes('grade')) {
        return `The **Code Refactoring (Grade Calculator)** project demonstrates code quality improvement, refactoring messy student grading logic into clean, modular, and PEP 8-compliant Python code.\n\n🔗 Repository: [correcting-grade](https://github.com/RAGHUVANSHI19/correcting-grade-25BCON0085-main)`;
      }
      if (query.includes('quiz')) {
        return `The **Quiz Application** is an interactive Python tool featuring dynamic question prompts, answer validation, real-time score tracking, and conditional outcome evaluation.\n\n🔗 Repository: [QUIZ-PE](https://github.com/RAGHUVANSHI19/QUIZ-PE-main)`;
      }
      if (query.includes('book') || query.includes('reading')) {
        return `The **Book Reading List** is a personal catalog and tracker application for logging book titles, tracking reading progress, and organizing literature records.\n\n🔗 Repository: [reading_list](https://github.com/RAGHUVANSHI19/reading_list-main)`;
      }

      return `Divyansh has 6 verified open-source projects on GitHub:\n\n1. 🧮 [Factorial Algorithm](https://github.com/RAGHUVANSHI19/pyhton-basics-25BCON0085-factorial-main) — Iterative & recursive factorial calculation in Python.\n2. 📈 [Fibonacci Sequence](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-fibonacci-main) — Algorithmic series generation and complexity analysis.\n3. 🗃️ [Struct to Dict Converter](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-struct-to-dict-main) — Data structure transformation utility.\n4. 🧹 [Code Refactoring (Grade Calculator)](https://github.com/RAGHUVANSHI19/correcting-grade-25BCON0085-main) — PEP 8 modernization and debugging.\n5. 🎯 [Quiz Application](https://github.com/RAGHUVANSHI19/QUIZ-PE-main) — Interactive question engine with real-time scoring.\n6. 📚 [Book Reading List](https://github.com/RAGHUVANSHI19/reading_list-main) — Structured catalog for tracking reading progress.\n\nYou can also browse all repositories on his [GitHub Profile](https://github.com/RAGHUVANSHI19).`;
    }

    // 2. Education & University
    if (query.includes('education') || query.includes('college') || query.includes('university') || query.includes('study') || query.includes('degree') || query.includes('school') || query.includes('jecrc')) {
      return `Divyansh is currently pursuing his **Bachelor of Technology (B.Tech)** in **Computer Science Engineering**, specializing in **Artificial Intelligence and Machine Learning (AI & ML)** at **JECRC University** in Jaipur, Rajasthan, India.\n\nHis foundational coursework includes Data Structures & Algorithms, Artificial Intelligence, Machine Learning, Object-Oriented Programming (C++), Database Systems, and Web Technologies.`;
    }

    // 3. Technical Skills
    if (query.includes('skill') || query.includes('tech') || query.includes('stack') || query.includes('language') || query.includes('tool')) {
      return `Divyansh has explored and actively builds with the following technologies:\n\n• **Frontend**: HTML5, CSS3 (Glassmorphism, Flex/Grid), JavaScript (ES6+), React\n• **Programming & Backend**: Python, C++, Node.js\n• **Data & Visualization**: Power BI, Excel, Chart.js, D3.js, Recharts\n• **Core Focus Areas**: Artificial Intelligence, Machine Learning, UI/UX Design Systems, Data Analytics, and Software Engineering.`;
    }

    // 4. Contact & Social Links
    if (query.includes('contact') || query.includes('email') || query.includes('linkedin') || query.includes('reach') || query.includes('hire') || query.includes('message') || query.includes('connect')) {
      return `You can connect directly with Divyansh through any of these channels:\n\n✉️ **Email**: [raghuvanshidivyansh35@gmail.com](mailto:raghuvanshidivyansh35@gmail.com)\n💼 **LinkedIn**: [Divyansh Raghuvanshi on LinkedIn](https://www.linkedin.com/in/divyansh-raghuvanshi-18483a378)\n🐙 **GitHub**: [github.com/RAGHUVANSHI19](https://github.com/RAGHUVANSHI19)\n\nHe is always open to discussing developer roles, open-source projects, and learning opportunities!`;
    }

    // 5. Who is Divyansh / Background / About
    if (query.includes('who are you') || query.includes('who is divyansh') || query.includes('about') || query.includes('background') || query.includes('introduce')) {
      return `**Divyansh Raghuvanshi** is a Computer Science Engineering student specializing in **AI and Machine Learning** at **JECRC University, Jaipur**.\n\nHe believes in **"learning by building"**—turning programming logic and data-driven ideas into functional code and elegant interfaces. His interests span full-stack web engineering, algorithms, data analytics, and modern UI/UX design.`;
    }

    // 6. Strengths, Qualities, and Work Style
    if (query.includes('strength') || query.includes('quality') || query.includes('qualities') || query.includes('why hire') || query.includes('learning')) {
      return `Divyansh's key qualities include:\n\n1. **Practical Experimenter**: He learns through hands-on coding and building projects rather than just theory.\n2. **Engineering & Design Bridge**: Combines solid logic (Python, C++, Algorithms) with refined, accessible dark-glass frontend design.\n3. **Honest & Focused**: Open about being an enthusiastic student learner with continuous curiosity for AI/ML and software development.\n4. **Code Quality Conscious**: Passionate about clean, maintainable, and well-structured code.`;
    }

    // 7. General Greetings
    if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('help')) {
      return `Hello! 👋 I'm **Ask Divyansh AI**. I can answer questions about Divyansh's education at JECRC University, his technical skills, his 6 GitHub projects, or how to get in touch with him. What would you like to know?`;
    }

    // Default helpful response
    return `I'm happy to help! You can ask me about:\n\n• **Divyansh's Background & Education** (B.Tech CSE — AI/ML at JECRC University)\n• **Technical Skills** (React, Python, C++, Node.js, Power BI, etc.)\n• **GitHub Repositories** (Factorial, Fibonacci, Struct to Dict, Quiz App, etc.)\n• **Contact Details** (Email & LinkedIn profile)\n\nWhat would you like to explore?`;
  }
}
