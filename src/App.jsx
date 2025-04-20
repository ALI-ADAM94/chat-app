import './App.css'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const ADMIN_EMAILS = ['aliadam081194@gmail.com'] // Replace with your email

const App = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [user, setUser] = useState(null)
  const [view, setView] = useState('chat') // 'chat' or 'dashboard'

  const isAdmin = ADMIN_EMAILS.includes(user?.email)

  useEffect(() => {
    checkUser()
    fetchMessages()
    const unsubscribe = subscribeToMessages()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
    } else {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
    }
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function handleSend() {
    if (input.trim() === '' || !user) return
    await supabase.from('messages').insert([
      { content: input, user_email: user.email }
    ])
    setInput('')
  }

  async function deleteMessage(id) {
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) console.error("Delete error:", error)
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleLogin}>Login</button>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4 space-y-4">
        <h2 className="text-xl font-bold">Chat App</h2>
        <div className="flex flex-col space-y-2">
          <button onClick={() => setView('chat')} className={`text-left px-2 py-1 rounded ${view === 'chat' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>💬 Chat Board</button>
          <button onClick={() => setView('dashboard')} className={`text-left px-2 py-1 rounded ${view === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>📊 Dashboard</button>
        </div>
        <div className="mt-auto">
          <p className="text-sm text-gray-500">Logged in as:</p>
          <p className="text-sm">{user.email}</p>
          <button className="mt-2 text-sm text-red-500" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {view === 'chat' ? (
          <>
            <h1 className="text-2xl font-semibold mb-4">Chat Board</h1>
            <div className="space-y-2 h-[400px] overflow-y-auto bg-white p-4 rounded shadow">
              {messages.map(msg => (
                <div key={msg.id} className={`p-2 rounded relative ${msg.user_email === user.email ? 'bg-blue-200 text-right' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-600">{msg.user_email}</p>
                  <p>{msg.content}</p>
                  {isAdmin && (
                    <button
                      className="absolute top-1 right-1 text-xs text-red-600 hover:underline"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      Delete
                    </button>
                  )}
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
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
            <div className="bg-white p-4 rounded shadow">
              <p><strong>Total Messages:</strong> {messages.length}</p>
              <p className="mt-2 font-semibold">Users:</p>
              <ul className="list-disc ml-6">
                {[...new Set(messages.map(m => m.user_email))].map(email => (
                  <li key={email}>
                    {email} {ADMIN_EMAILS.includes(email) && <span className="text-xs text-blue-500">(admin)</span>}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
export default App
