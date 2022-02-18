import './App.css'

const App: React.FC<{ env: string }> = ({ env }) => {
  return (
    <div className="w-screen h-screen flex items-center justify-center text-white">
      <div className="w-screen h-screen fixed top-0 left-0" onClick={() => logseq.hideMainUI()}></div>
      <div className="w-5/6 h-5/6 bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 flex flex-col items-center justify-center">
        <h1 className="font-bold text-4xl">Logseq-plugin-react-boilerplate</h1>
        <h2 className="text-2xl mt-6">Current Env: {env}</h2>
      </div>
    </div>
  )
}

export default App
