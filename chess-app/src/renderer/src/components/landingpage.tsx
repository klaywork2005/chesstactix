const LandingPage = () => {
    return (
        <div className="flex items-center justify-center rounded-lg overflow-hidden border-1 border-neutral-700 bg-neutral-800 w-[85vw] h-[85vh]">

            <div className="flex flex-col items-center justify-between w-full h-full text-2xl">

                <div className="flex items-center flex-col py-4">
                    <h1 className="text-center text-amber-100 font-bold pb-2">
                        WELCOME TO A CROSS-PLATFORM LIGHTWEIGHT, OFFLILNE CHESS APP
                    </h1>
                    <h1 className="font-normal text-amber-100/75 pb-2">
                        Play against a variety of stockfish strengths, analyze openings, analyze any game all locally on your machine
                    </h1>
                    <button className="text-amber-900 bg-amber-400 border-1 border-amber-200 rounded-lg py-0.5 px-2">
                        PLAY NOW
                    </button>
                </div>

                <div className="flex items-center py-6">
                    <i className="text-white fa-brands fa-github object-cover text-5xl" />
                    <a href="https://github.com/klaywork2005/chesstactix" target="_blank" rel="noopener noreferrer" className="text-4xl font-bold text-blue-300 underline underline-offset-12 px-1">
                    ChessTactix GitHub Repository
                    </a>
                </div>

            </div>
        </div>
    )
}

export default LandingPage