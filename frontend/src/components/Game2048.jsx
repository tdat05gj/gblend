import React, { useState, useEffect, useCallback } from 'react';
import { web3Service } from '../utils/web3';
import { Trophy, User, Clock, Star, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

const Game2048 = ({ account }) => {
  // Game state
  const [board, setBoard] = useState(() => initializeBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [poolInfo, setPoolInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Game logic
  function initializeBoard() {
    const board = Array(4).fill().map(() => Array(4).fill(0));
    addRandomTile(board);
    addRandomTile(board);
    return board;
  }
  
  function addRandomTile(board) {
    const emptyCells = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      board[randomCell[0]][randomCell[1]] = Math.random() < 0.9 ? 2 : 4;
    }
  }
  
  function moveLeft(board) {
    let newBoard = board.map(row => [...row]);
    let scoreIncrease = 0;
    let moved = false;
    
    for (let i = 0; i < 4; i++) {
      let row = newBoard[i].filter(cell => cell !== 0);
      
      // Merge tiles
      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          row[j] *= 2;
          scoreIncrease += row[j];
          row[j + 1] = 0;
        }
      }
      
      row = row.filter(cell => cell !== 0);
      
      while (row.length < 4) {
        row.push(0);
      }
      
      if (JSON.stringify(newBoard[i]) !== JSON.stringify(row)) {
        moved = true;
      }
      
      newBoard[i] = row;
    }
    
    return { board: newBoard, scoreIncrease, moved };
  }
  
  function rotateBoard(board) {
    return board[0].map((_, index) => board.map(row => row[index]).reverse());
  }
  
  function move(direction) {
    if (gameOver || won) return;
    
    let newBoard = [...board];
    let result;
    
    switch (direction) {
      case 'left':
        result = moveLeft(newBoard);
        break;
      case 'right':
        newBoard = rotateBoard(rotateBoard(newBoard));
        result = moveLeft(newBoard);
        result.board = rotateBoard(rotateBoard(result.board));
        break;
      case 'up':
        newBoard = rotateBoard(rotateBoard(rotateBoard(newBoard)));
        result = moveLeft(newBoard);
        result.board = rotateBoard(result.board);
        break;
      case 'down':
        newBoard = rotateBoard(newBoard);
        result = moveLeft(newBoard);
        result.board = rotateBoard(rotateBoard(rotateBoard(result.board)));
        break;
      default:
        return;
    }
    
    if (result.moved) {
      addRandomTile(result.board);
      setBoard(result.board);
      setScore(prev => prev + result.scoreIncrease);
      
      // Check for 2048 tile
      if (result.board.some(row => row.some(cell => cell === 2048)) && !won) {
        setWon(true);
      }
      
      // Check game over
      if (isGameOver(result.board)) {
        setGameOver(true);
      }
    }
  }
  
  function isGameOver(board) {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) return false;
      }
    }
    
    // Check for possible merges
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = board[i][j];
        if (
          (i < 3 && board[i + 1][j] === current) ||
          (j < 3 && board[i][j + 1] === current)
        ) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Keyboard controls
  const handleKeyPress = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        move('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        move('right');
        break;
      case 'ArrowUp':
        e.preventDefault();
        move('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        move('down');
        break;
    }
  }, [board, gameOver, won]);

  // Touch controls for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (isLeftSwipe) move('left');
      if (isRightSwipe) move('right');
    } else {
      // Vertical swipe
      if (isUpSwipe) move('up');
      if (isDownSwipe) move('down');
    }
  };
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  // Smart contract functions
  const loadLeaderboard = async () => {
    try {
      if (!web3Service.game2048Contract) {
        await web3Service.initializeGame2048Contract();
      }
      
      const result = await web3Service.game2048Contract.getLeaderboard();
      const [players, scores, timestamps] = result;
      
      const formattedLeaderboard = players.map((player, index) => ({
        rank: index + 1,
        player,
        score: parseInt(scores[index].toString()),
        timestamp: parseInt(timestamps[index].toString()) * 1000,
        name: formatAddress(player)
      }));
      
      setLeaderboard(formattedLeaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };
  
  const loadPlayerStats = async () => {
    try {
      if (!account || !web3Service.game2048Contract) return;
      
      const stats = await web3Service.game2048Contract.getPlayerStats(account);
      setPlayerStats({
        bestScore: parseInt(stats.bestScore.toString()),
        playerName: formatAddress(account), // Use wallet address as name
        rank: 0, // Will be calculated from leaderboard
        hasPlayed: stats.exists
      });
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  const loadPoolInfo = async () => {
    try {
      if (!web3Service.game2048Contract) {
        await web3Service.initializeGame2048Contract();
      }
      
      const poolData = await web3Service.game2048Contract.getPoolInfo();
      
      setPoolInfo({
        currentPool: ethers.utils.formatEther(poolData.currentPool),
        threshold: ethers.utils.formatEther(poolData.threshold),
        canClaim: poolData.canClaim,
        topPlayer: poolData.topPlayer
      });
      
    } catch (error) {
      console.error('Error loading pool info:', error);
    }
  };

  const claimReward = async () => {
    if (!account || !poolInfo?.canClaim) return;
    
    try {
      setIsClaiming(true);
      
      const tx = await web3Service.game2048Contract.claimReward();
      await tx.wait();
      
      // Reload all data after claim
      await loadLeaderboard();
      await loadPlayerStats();
      await loadPoolInfo();
      
      alert(`Reward claimed successfully! Amount: ${poolInfo.currentPool} ETH`);
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward: ' + error.message);
    } finally {
      setIsClaiming(false);
    }
  };
  
  const submitScore = async () => {
    if (!account || score === 0) return;
    
    try {
      setIsSubmitting(true);
      
      if (!web3Service.game2048Contract) {
        await web3Service.initializeGame2048Contract();
      }
      
      // Check current best score first
      const playerStats = await web3Service.game2048Contract.getPlayerStats(account);
      const currentBestScore = parseInt(playerStats.bestScore);
      
      if (currentBestScore >= score) {
        alert(`Your current best score is ${currentBestScore}. New score (${score}) is not better!`);
        setIsSubmitting(false);
        return;
      }
      
      const gameFee = ethers.utils.parseEther('0.0001');
      // New contract only needs score parameter
      const tx = await web3Service.game2048Contract.submitScore(
        score,
        { value: gameFee }
      );
      
      await tx.wait();
      
      // Reload data
      await loadLeaderboard();
      await loadPlayerStats();
      await loadPoolInfo();
      
      alert(`New best score submitted successfully! Score: ${score}, Fee: 0.0001 ETH`);
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetGame = () => {
    setBoard(initializeBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };
  
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const refreshAll = async () => {
    await loadLeaderboard();
    await loadPoolInfo();
    if (account) {
      await loadPlayerStats();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  const getTileClass = (value) => {
    if (value === 0) return 'tile-empty';
    return `tile-${Math.min(value, 2048)}`;
  };
  
  useEffect(() => {
    loadLeaderboard();
    loadPoolInfo();
    if (account) {
      loadPlayerStats();
    }
  }, [account]);
  
  return (
    <div className="game-2048">
      <div className="game-header">
        <h2>🎮 2048 Game</h2>
        <div className="game-controls">
          <button 
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="toggle-button"
          >
            <Trophy size={16} />
            {showLeaderboard ? 'Game' : 'Leaderboard'}
          </button>
          <button onClick={resetGame} className="reset-button">
            <RefreshCw size={16} />
            Reset
          </button>
          {showLeaderboard && (
            <button onClick={refreshAll} className="refresh-leaderboard-button">
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>
      </div>
      
      {!showLeaderboard ? (
        <div className="game-container">
          <div className="game-info">
            <div className="score-board">
              <div className="score-item">
                <span>Score</span>
                <span className="score-value">{score.toLocaleString()}</span>
              </div>
              {playerStats && (
                <div className="score-item">
                  <span>Best</span>
                  <span className="score-value">{playerStats.bestScore.toLocaleString()}</span>
                </div>
              )}
              {poolInfo && (
                <div className="score-item pool-info">
                  <span>Pool</span>
                  <span className="score-value">{parseFloat(poolInfo.currentPool).toFixed(4)} ETH</span>
                  <span className="pool-threshold">/ {poolInfo.threshold} ETH</span>
                </div>
              )}
            </div>
            
            {(gameOver || won) && (
              <div className="game-end-modal">
                <div className="modal-content">
                  <h3>{won ? '🎉 You Won!' : '💀 Game Over'}</h3>
                  <p>Final Score: {score.toLocaleString()}</p>
                  
                  {score > 0 && (
                    <div className="submit-score">
                      <p>Player: {formatAddress(account)}</p>
                      <button 
                        onClick={submitScore}
                        disabled={isSubmitting}
                        className="submit-button"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Score (0.0001 ETH)'}
                      </button>
                    </div>
                  )}
                  
                  <button onClick={resetGame} className="play-again-button">
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div 
            className="game-board"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {board.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`tile ${getTileClass(cell)}`}
                >
                  {cell > 0 && cell}
                </div>
              ))
            )}
          </div>
          
          <div className="game-instructions">
            <p>🎮 Use arrow keys to move tiles</p>
            <p>💰 Submit score costs 0.0001 ETH (goes to reward pool)</p>
            <p>🏆 Top player gets reward when pool reaches 0.1 ETH!</p>
          </div>
        </div>
      ) : (
        <div className="leaderboard-container">
          <h3>🏆 Leaderboard</h3>
          
          {poolInfo && (
            <div className="pool-status">
              <h4>💰 Reward Pool</h4>
              <div className="pool-details">
                <div className="pool-amount">
                  {parseFloat(poolInfo.currentPool).toFixed(4)} ETH / {poolInfo.threshold} ETH
                </div>
                <div className="pool-progress">
                  <div 
                    className="pool-bar"
                    style={{ 
                      width: `${Math.min((parseFloat(poolInfo.currentPool) / parseFloat(poolInfo.threshold)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                {poolInfo.canClaim && account && poolInfo.topPlayer.toLowerCase() === account.toLowerCase() && (
                  <button 
                    onClick={claimReward}
                    disabled={isClaiming}
                    className="claim-button"
                  >
                    {isClaiming ? 'Claiming...' : '🎉 Claim Reward!'}
                  </button>
                )}
                {poolInfo.canClaim && poolInfo.topPlayer.toLowerCase() !== account.toLowerCase() && (
                  <div className="claim-info">
                    🎯 Top player can claim: {formatAddress(poolInfo.topPlayer)}
                  </div>
                )}
              </div>
            </div>
          )}

          {!poolInfo && (
            <div className="pool-status">
              <h4>💰 Loading Pool Info...</h4>
            </div>
          )}
          
          {playerStats && (
            <div className="player-stats">
              <h4>Your Stats</h4>
              <div className="stats-grid">
                <div>Best Score: {playerStats.bestScore.toLocaleString()}</div>
                <div>Rank: #{playerStats.rank || 'Unranked'}</div>
              </div>
            </div>
          )}
          
          <div className="leaderboard-list">
            {leaderboard.length === 0 ? (
              <div className="no-scores">No scores yet. Be the first!</div>
            ) : (
              leaderboard.map((entry) => (
                <div key={`${entry.player}-${entry.timestamp}`} className="leaderboard-entry">
                  <div className="rank">#{entry.rank}</div>
                  <div className="player-info">
                    <div className="player-name">{entry.name}</div>
                    <div className="player-address">{formatAddress(entry.player)}</div>
                  </div>
                  <div className="score">{entry.score.toLocaleString()}</div>
                  <div className="date">{formatTime(entry.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game2048;
