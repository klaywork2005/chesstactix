import React, {useState} from 'react'
import {Chess} from 'chess.js'
import {Chessboard} from 'react-chessboard'


const Chessboard = () => {
    const [game, setGame] = useState (new Chess());
    const [moveHistory, setMoveHistory] = useState([])
    const [status, setStatus] = useState('White to move');

    try {
    const gameCopy = new Chess(game.fen());
    
    if (result) {
        setGame(gameCopy);
        setMoveHistory((prev) => [...prev, resourceLimits.san])
        updateStatus(gameCopy);
        return true;

    }
}   

export default Chessboard