import React, { useEffect, useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './App.css';
import { BsChatDotsFill } from "react-icons/bs";
import { FiEdit2 } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegFaceGrinWide } from "react-icons/fa6";

// Initialize WebSocket connection
const socket = new WebSocket('https://my-chat-app-m5ck.onrender.com');

function App() {
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null); // Ref for auto-scrolling

  // WebSocket message handling
  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        // Set initial chat history
        setMessages(data.messages);
      } else if (data.type === 'message') {
        // Add new incoming message
        setMessages((prev) => [...prev, data]);
      } else if (data.type === 'edit') {
        // Update edited message
        setMessages((prev) =>
          prev.map((msg) => (msg.id === data.id ? { ...msg, text: data.text } : msg))
        );
      } else if (data.type === 'delete') {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.id));

      } else if (data.type === 'typing' && data.sender !== username) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    };
  }, [username]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (input && username) {
      socket.send(JSON.stringify({ type: 'typing', sender: username }));
    }
  }, [input, username]);

  const handleSend = () => {
    if (input.trim() === '' || username === '') return;

    if (editMessageId) {
      // Send edit message to server
      socket.send(JSON.stringify({
        type: 'edit',
        id: editMessageId,
        text: input,
      }));
      setEditMessageId(null);
    } else {
      // Send new message to server
      socket.send(JSON.stringify({
        type: 'message',
        id: Date.now(),
        sender: username,
        text: input,
        timestamp: new Date().toISOString(),
      }));
    }
    setInput('');
  };

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleEdit = (id, text) => {
    setInput(text);
    setEditMessageId(id);
  };

  const handleDelete = (id) => {
    socket.send(JSON.stringify({ type: 'delete', id }));
  };

  // Render login screen if no username is selected
  if (!username) {
    return (
      <div className="login-screen">
        <div className='login-form'>
          <h2>Select your identity</h2>
          <button onClick={() => setUsername('A')}>Login as A</button>
          <button onClick={() => setUsername('B')}>Login as B</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <h2 className="chat-header">
        <BsChatDotsFill size={30} /> Chat as User {username}
      </h2>

      {/* Chat messages */}
      <div className="chat-body">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.sender === username ? 'sent' : 'received'}`}
          >
            <div className="msg-meta">
              <strong>{msg.sender}</strong> -{' '}
              <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="msg-text">{msg.text}</div>
            {msg.reaction && <div className="msg-reaction">{msg.reaction}</div>}

            {/* Edit and delete options for own messages */}
            {msg.sender === username && (
              <div className="msg-actions">
                <button onClick={() => handleEdit(msg.id, msg.text)}><FiEdit2 size={15} /></button>
                <button onClick={() => handleDelete(msg.id)}><RiDeleteBin6Line size={15} /></button>
              </div>
            )}
          </div>
        ))}

        {isTyping && <div className="typing-indicator">Someone is typing...</div>}

        {/* Scroll anchor */}
        <div ref={bottomRef}></div>
      </div>

      <div className="chat-input">
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <FaRegFaceGrinWide size={27} />
        </button>

        {showEmojiPicker && (
          <div className="emoji-container">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <input
          placeholder="Type message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>{editMessageId ? 'Update' : 'Send'}</button>
      </div>
    </div>
  );
}

export default App;
