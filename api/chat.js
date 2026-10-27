/**
 * Ask Divyansh AI — Serverless Chat Handler
 * Compatible with Vercel Serverless Functions & Local Node/Vite Dev Middleware
 */

const SYSTEM_PROMPT = `You are "Ask Divyansh AI", the personal AI portfolio assistant for Divyansh Raghuvanshi.
Your job is to answer questions from recruiters, hiring managers, and visitors about Divyansh's background, education, technical skills, actual GitHub projects, and contact information.

DIVYANSH'S VERIFIED PORTFOLIO DATA:
- Full Name: Divyansh Raghuvanshi
- Role: Computer Science Engineering Student • Developer • Problem Solver
- University: JECRC University, Jaipur, Rajasthan, India
- Degree: Bachelor of Technology (B.Tech)
- Branch: Computer Science Engineering — Artificial Intelligence and Machine Learning (AI & ML)
- Core Coursework: Data Structures & Algorithms, Artificial Intelligence, Machine Learning, Object-Oriented Programming (C++), Database Management Systems, Web Technologies
- Learning Philosophy: "Learn by building" through iterative coding, experimentation, and practical projects. Bridges clean software engineering with thoughtful dark-mode UI/UX design.

TECHNICAL SKILLS EXPLORED:
- Frontend: HTML5, CSS3 (Glassmorphism, Flexbox, Grid), JavaScript (ES6+), React
- Backend & Programming: Python, C++, Node.js
- Data & Visualization: Power BI, Excel, Chart.js, D3.js, Recharts
- Focus Areas: Artificial Intelligence, Machine Learning, UI/UX & Design Systems, Data Analytics, Software Engineering

VERIFIED GITHUB REPOSITORIES:
1. Factorial Algorithm:
   - Link: [pyhton-basics-factorial](https://github.com/RAGHUVANSHI19/pyhton-basics-25BCON0085-factorial-main)
   - Details: Python algorithm exploration computing factorials via iterative and recursive approaches with edge-case validation.
2. Fibonacci Sequence:
   - Link: [python-basics-fibonacci](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-fibonacci-main)
   - Details: Algorithmic calculation of Fibonacci series evaluating complexity, iterative sequence generation, and memory efficiency.
3. Struct to Dict Converter:
   - Link: [python-struct-to-dict](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-struct-to-dict-main)
   - Details: Data structure transformation tool converting structured records, classes, and schema tuples into serializable Python dictionaries.
4. Code Refactoring (Grade Calculator):
   - Link: [correcting-grade](https://github.com/RAGHUVANSHI19/correcting-grade-25BCON0085-main)
   - Details: Code quality and debugging project modernizing unstructured grade computation scripts into clean, modular, and PEP 8-compliant Python code.
5. Quiz Application:
   - Link: [QUIZ-PE](https://github.com/RAGHUVANSHI19/QUIZ-PE-main)
   - Details: Dynamic interactive quiz application managing question banks, user response validation, automated scoring, and real-time score tracking.
6. Book Reading List Tracker:
   - Link: [reading_list](https://github.com/RAGHUVANSHI19/reading_list-main)
   - Details: Personal reading list organizer and catalog tool for managing book collections, monitoring reading status, and logging literature records.

CONTACT INFORMATION (Always provide clickable links):
- Email: [raghuvanshidivyansh35@gmail.com](mailto:raghuvanshidivyansh35@gmail.com)
- LinkedIn: [linkedin.com/in/divyansh-raghuvanshi](https://www.linkedin.com/in/divyansh-raghuvanshi-18483a378)
- GitHub Profile: [github.com/RAGHUVANSHI19](https://github.com/RAGHUVANSHI19)

BEHAVIOR & GROUNDING RULES:
1. Be polite, concise, encouraging, and articulate.
2. Ground all answers strictly in the verified facts above.
3. NEVER invent or fabricate corporate jobs, client projects, awards, CGPA, certifications, or unlisted projects. Divyansh is an authentic student developer.
4. If asked about something unlisted (phone number, physical address, etc.), politely explain that it is not publicly listed and provide the email or LinkedIn links.
5. Keep answers formatted nicely in Markdown with clickable links.`;

/**
 * Handle chat request with Gemini API, OpenAI API, or Grounded Fallback
 */
export async function handleChat(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array.');
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. If Gemini API Key is configured
  if (geminiKey) {
    try {
      const reply = await callGeminiAPI(messages, geminiKey);
      if (reply) return { reply };
    } catch (err) {
      console.error('Gemini API call failed, attempting fallback:', err.message);
    }
  }

  // 2. If OpenAI API Key is configured
  if (openaiKey) {
    try {
      const reply = await callOpenAIAPI(messages, openaiKey);
      if (reply) return { reply };
    } catch (err) {
      console.error('OpenAI API call failed, attempting fallback:', err.message);
    }
  }

  // 3. Grounded Fallback Engine (Answers all questions accurately even if no API key is set)
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const fallbackReply = generateGroundedReply(lastUserMsg);
  return {
    reply: fallbackReply,
    note: !geminiKey && !openaiKey ? 'Running on grounded local knowledge base. Set GEMINI_API_KEY in .env for live Gemini LLM generation.' : undefined
  };
}

/**
 * Call Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
 */
async function callGeminiAPI(messages, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Format messages for Gemini API
  const contents = [
    {
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTIONS:\n${SYSTEM_PROMPT}\n\nPlease acknowledge and follow these instructions strictly.` }]
    },
    {
      role: 'model',
      parts: [{ text: 'Understood. I am Ask Divyansh AI, ready to assist visitors with verified information about Divyansh Raghuvanshi.' }]
    }
  ];

  messages.forEach(msg => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
}

/**
 * Call OpenAI API (gpt-4o-mini / gpt-3.5-turbo)
 */
async function callOpenAIAPI(messages, apiKey) {
  const url = 'https://api.openai.com/v1/chat/completions';

  const formattedMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.4,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || null;
}

/**
 * Smart Grounded Knowledge Base Engine
 * Provides accurate answers about Divyansh even before an external API key is supplied.
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
      return `The **Book Reading List** is a personal catalog and tracker application for logging book titles, tracking reading progress, and organizing literature lists.\n\n🔗 Repository: [reading_list](https://github.com/RAGHUVANSHI19/reading_list-main)`;
    }

    return `Divyansh has 6 verified open-source projects on GitHub:\n\n1. 🧮 [Factorial Algorithm](https://github.com/RAGHUVANSHI19/pyhton-basics-25BCON0085-factorial-main) — Iterative & recursive factorial calculation in Python.\n2. 📈 [Fibonacci Sequence](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-fibonacci-main) — Algorithmic series generation and complexity analysis.\n3. 🗃️ [Struct to Dict Converter](https://github.com/RAGHUVANSHI19/python-basics-25BCON0085-struct-to-dict-main) — Data structure transformation utility.\n4. 🧹 [Code Refactoring (Grade Calculator)](https://github.com/RAGHUVANSHI19/correcting-grade-25BCON0085-main) — PEP 8 modernization and debugging.\n5. 🎯 [Quiz Application](https://github.com/RAGHUVANSHI19/QUIZ-PE-main) — Interactive question engine with real-time scoring.\n6. 📚 [Book Reading List](https://github.com/RAGHUVANSHI19/reading_list-main) — Structured catalog for tracking reading progress.\n\nYou can also browse all repositories on his [GitHub Profile](https://github.com/RAGHUVANSHI19).`;
  }

  // 2. Education & University
  if (query.includes('education') || query.includes('college') || query.includes('university') || query.includes('study') || query.includes('degree') || query.includes('school')) {
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

/**
 * Standard Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array in request body.' });
    }

    const result = await handleChat(messages);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      error: 'Failed to process chat message.',
      details: error.message
    });
  }
}
