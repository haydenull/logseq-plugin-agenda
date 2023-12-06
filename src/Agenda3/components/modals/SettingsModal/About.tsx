import logo from '@/assets/logo.png'

const About = () => {
  const onClickLink = (link: string) => {
    if (import.meta.env.VITE_MODE === 'plugin') {
      logseq.App.openExternalLink(link)
    } else {
      window.open(link, '_blank')
    }
    return false
  }
  return (
    <>
      <div className="h-14 pl-4 flex items-center font-semibold text-lg border-b">About</div>
      <div className="flex flex-col justify-center items-center pb-6">
        <img src={logo} className="w-20 mt-6" />
        <h1 className="text-xl">Agenda</h1>
        <div className="text-gray-400">version: v{__APP_VERSION__}</div>
        <div className="flex divide-x">
          <a
            className="pr-2"
            onClick={() => onClickLink('https://haydenut.notion.site/Agenda3-ef115e277c864de3b2679d6bda0e6376')}
          >
            User Manual
          </a>
          <a className="pl-2" onClick={() => onClickLink('https://github.com/haydenull/logseq-plugin-agenda')}>
            Github Repo
          </a>
        </div>
        <div className="text-xs text-gray-400 w-96">
          Please note that the beta version is still under development and may contain bugs. We encourage you to test it
          out and provide feedback on any issues or suggestions on our GitHub page. Your input is valuable in ensuring a
          stable and polished final release.
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <a className="w-[190px]" onClick={() => onClickLink('https://www.buymeacoffee.com/haydenull')}>
            <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=haydenull&button_colour=40DCA5&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" />
          </a>
          <a
            className="w-[190px] bg-[#946ce6] flex items-center justify-center rounded-lg"
            onClick={() => onClickLink('https://afdian.net/a/haydenull')}
          >
            <img width="156" src="https://pic1.afdiancdn.com/static/img/welcome/button-sponsorme.jpg" alt="" />
          </a>
        </div>
      </div>
    </>
  )
}

export default About
