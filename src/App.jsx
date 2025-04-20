
import './App.css'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
    fetchMessages()
    subscribeToMessages()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  async function fetchMessages() {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    setMessages(data)
  }

  function subscribeToMessages() {
    supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
  }

  async function handleSend() {
    if (input.trim() === '') return
    await supabase.from('messages').insert([
      { content: input, user_email: user.email }
    ])
    setInput('')
  }

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithOtp({ email: prompt("Enter your email") })
    if (error) console.error(error)
    else alert("Check your email for the login link!")
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      {!user ? (
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleLogin}>Login</button>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Chat App</h1>
            <button className="text-sm text-red-500" onClick={handleLogout}>Logout</button>
          </div>

          <div className="space-y-2 h-[400px] overflow-y-auto bg-gray-100 p-4 rounded">
            {messages.map(msg => (
              <div key={msg.id} className={`p-2 rounded ${msg.user_email === user.email ? 'bg-blue-200 text-right' : 'bg-white'}`}>
                <p className="text-sm text-gray-600">{msg.user_email}</p>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 border p-2 rounded"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
            />
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}



export default App
