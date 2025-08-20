import React, { useState, useEffect, useRef } from 'react';
import './MasterMind.css';
import { web3Service } from '../utils/web3';
import { ethers } from 'ethers';

const MasterMind = ({ account }) => {
  const [currentGame, setCurrentGame] = useState(null);
  const [playerRecord, setPlayerRecord] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [guess, setGuess] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);
  const historyTableRef = useRef(null);
  const [gameConstants, setGameConstants] = useState({
    retryFee: '0',
    startingScore: 66,
    penaltyPerGuess: 6,
    minimumScore: 6
  });

  useEffect(() => {
    if (account) {
      loadGameConstants();
      loadCurrentGame();
      loadPlayerRecord();
      loadLeaderboard();
    }
  }, [account]);

  // Auto-scroll to bottom when new guess is added
  useEffect(() => {
    if (historyTableRef.current && currentGame && currentGame.guesses.length > 0) {
      // Scroll to bottom with smooth behavior
      historyTableRef.current.scrollTop = historyTableRef.current.scrollHeight;
    }
  }, [currentGame?.guesses?.length]);

  const loadGameConstants = async () => {
    try {
      if (!web3Service.masterMindContract) {
        await web3Service.initializeMasterMindContract();
      }

      const retryFee = await web3Service.masterMindContract.RETRY_FEE();
      const startingScore = await web3Service.masterMindContract.STARTING_SCORE();
      const penaltyPerGuess = await web3Service.masterMindContract.PENALTY_PER_GUESS();
      const minimumScore = await web3Service.masterMindContract.MINIMUM_SCORE();

      setGameConstants({
        retryFee: ethers.utils.formatEther(retryFee),
        startingScore: startingScore.toNumber(),
        penaltyPerGuess: penaltyPerGuess.toNumber(),
        minimumScore: minimumScore.toNumber()
      });
    } catch (error) {
      console.error('Error loading game constants:', error);
    }
  };

  const loadCurrentGame = async () => {
    try {
      if (!web3Service.masterMindContract) {
        await web3Service.initializeMasterMindContract();
      }

      const gameData = await web3Service.masterMindContract.getCurrentGame(account);
      
      if (gameData.currentScore.toNumber() > 0 || gameData.isCompleted) {
        setCurrentGame({
          currentScore: gameData.currentScore.toNumber(),
          guesses: gameData.guesses.map(g => g.toNumber()),
          hints: gameData.hints,
          isCompleted: gameData.isCompleted,
          finalScore: gameData.finalScore.toNumber()
        });
      } else {
        setCurrentGame(null);
      }
    } catch (error) {
      console.error('Error loading current game:', error);
    }
  };

  const loadPlayerRecord = async () => {
    try {
      if (!web3Service.masterMindContract) {
        await web3Service.initializeMasterMindContract();
      }

      const record = await web3Service.masterMindContract.getPlayerRecord(account);
      
      if (record.exists) {
        setPlayerRecord({
          bestScore: record.bestScore.toNumber(),
          totalGames: record.totalGames.toNumber(),
          lastPlayed: new Date(record.lastPlayed.toNumber() * 1000)
        });
      }
    } catch (error) {
      console.error('Error loading player record:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      if (!web3Service.masterMindContract) {
        await web3Service.initializeMasterMindContract();
      }

      const leaderboardData = await web3Service.masterMindContract.getLeaderboard();
      
      const formattedLeaderboard = leaderboardData.players.map((player, index) => ({
        rank: index + 1,
        address: player,
        bestScore: leaderboardData.scores[index].toNumber(),
        totalGames: leaderboardData.totalGames[index].toNumber()
      }));

      setLeaderboard(formattedLeaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const startNewGame = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsStarting(true);

      if (!web3Service.masterMindContract) {
        await web3Service.initializeMasterMindContract();
      }

      // Check if player needs to pay retry fee
      const isRetry = playerRecord && playerRecord.totalGames > 0;
      const value = isRetry ? ethers.utils.parseEther(gameConstants.retryFee) : '0';

      const tx = await web3Service.masterMindContract.startNewGame({ value });
      await tx.wait();

      // Reload data
      await loadCurrentGame();
      await loadPlayerRecord();

      alert(`New game started! ${isRetry ? `Retry fee: ${gameConstants.retryFee} ETH paid.` : ''}`);
    } catch (error) {
      console.error('Error starting new game:', error);
      alert('Failed to start new game: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const makeGuess = async () => {
    const guessNum = parseInt(guess);
    
    if (!guess || guess.length !== 4 || !/^\d{4}$/.test(guess)) {
      alert('Please enter exactly 4 digits');
      return;
    }
    
    if (guessNum < 1000 || guessNum > 9999) {
      alert('Guess must be a 4-digit number (1000-9999)');
      return;
    }

    try {
      setIsGuessing(true);

      if (!web3Service.masterMindContract) {
        await web3Service.initializeMasterMindContract();
      }

      const tx = await web3Service.masterMindContract.makeGuess(guessNum);
      await tx.wait();

      // Clear guess input
      setGuess('');

      // Reload game data
      await loadCurrentGame();
      await loadPlayerRecord();
      await loadLeaderboard();

    } catch (error) {
      console.error('Error making guess:', error);
      alert('Failed to make guess: ' + error.message);
    } finally {
      setIsGuessing(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account) {
    return (
      <div className="mastermind-container">
        <div className="mastermind-header">
          <h2>🧠 Master Mind</h2>
          <p>Connect your wallet to start playing!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mastermind-container">
      <div className="mastermind-header">
        <h2>🧠 Master Mind</h2>
        <p>Guess the 4-digit secret number!</p>
      </div>

      <div className="mastermind-content">
        <div className="mastermind-main">
          {/* Game Rules */}
          <div className="game-rules">
            <h3>📖 How to Play</h3>
            <ul>
              <li>🎯 Guess the 4-digit secret number (1000-9999)</li>
              <li>💯 Start with {gameConstants.startingScore} points</li>
              <li>❌ Lose {gameConstants.penaltyPerGuess} points per wrong guess</li>
              <li>✅ Minimum {gameConstants.minimumScore} points guaranteed</li>
              <li> Hints: Correct digits shown, wrong ones as *</li>
            </ul>
          </div>

          {/* Current Game */}
          <div className="current-game">
            <h3>🎮 Current Game</h3>
            
            {!currentGame ? (
              <div className="no-game">
                <p>No active game. Start a new one!</p>
                <button 
                  className="start-game-btn"
                  onClick={startNewGame}
                  disabled={isStarting}
                >
                  {isStarting ? 'Starting...' : 'Start New Game'}
                </button>
                {playerRecord && playerRecord.totalGames > 0 && (
                  <p className="retry-notice">
                    ⚠️ Retry fee: {gameConstants.retryFee} ETH
                  </p>
                )}
              </div>
            ) : (
              <div className="active-game">
                {!currentGame.isCompleted ? (
                  <div className="game-playing">
                    <div className="score-display">
                      <span className="current-score">
                        Current Score: {currentGame.currentScore}
                      </span>
                    </div>

                    <div className="guess-input">
                      <input
                        type="text"
                        placeholder="Enter 4-digit guess (1000-9999)"
                        value={guess}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setGuess(value);
                        }}
                        maxLength="4"
                        pattern="[0-9]{4}"
                        disabled={isGuessing}
                        className={guess.length === 4 && parseInt(guess) >= 1000 ? 'valid' : ''}
                      />
                      <button 
                        onClick={makeGuess}
                        disabled={isGuessing || guess.length !== 4 || parseInt(guess) < 1000}
                        className="guess-btn"
                      >
                        {isGuessing ? 'Guessing...' : 'Make Guess'}
                      </button>
                      {guess && guess.length < 4 && (
                        <small style={{ color: '#ff6b6b', marginTop: '5px' }}>
                          Need {4 - guess.length} more digit{4 - guess.length > 1 ? 's' : ''}
                        </small>
                      )}
                      {guess && guess.length === 4 && parseInt(guess) < 1000 && (
                        <small style={{ color: '#ff6b6b', marginTop: '5px' }}>
                          Must be 1000 or higher
                        </small>
                      )}
                    </div>

                    {currentGame.guesses.length > 0 && (
                      <div className="guess-history">
                        <h4>📋 Guess History</h4>
                        <div className="history-header">
                          <span>#</span>
                          <span>Your Guess</span>
                          <span>Result</span>
                          <span>Score</span>
                        </div>
                        <div className="history-table" ref={historyTableRef}>
                          {currentGame.guesses.map((g, index) => {
                            const scoreAfterGuess = gameConstants.startingScore - (index + 1) * gameConstants.penaltyPerGuess;
                            const actualScore = Math.max(scoreAfterGuess, gameConstants.minimumScore);
                            const isLatest = index === currentGame.guesses.length - 1;
                            return (
                              <div key={index} className={`history-row ${isLatest ? 'latest-entry' : ''}`}>
                                <span className="attempt-number">{index + 1}</span>
                                <span className="guess-number">{g}</span>
                                <span className="hint-display">
                                  {currentGame.hints[index].split('').map((char, i) => (
                                    <span 
                                      key={i} 
                                      className={char === '*' ? 'wrong-digit' : 'correct-digit'}
                                    >
                                      {char}
                                    </span>
                                  ))}
                                </span>
                                <span className="score-after">{actualScore}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="current-progress">
                          <div className="progress-info">
                            <span>Current Score: <strong>{currentGame.currentScore}</strong></span>
                            <span>Attempts: {currentGame.guesses.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="game-completed">
                    <h4>🎉 Game Completed!</h4>
                    <p>Final Score: <strong>{currentGame.finalScore}</strong></p>
                    <p>Total Guesses: {currentGame.guesses.length}</p>
                    
                    <button 
                      className="start-game-btn"
                      onClick={startNewGame}
                      disabled={isStarting}
                    >
                      {isStarting ? 'Starting...' : 'Play Again'}
                    </button>
                    <p className="retry-notice">
                      ⚠️ Retry fee: {gameConstants.retryFee} ETH
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mastermind-sidebar">
          {/* Player Stats */}
          {playerRecord && (
            <div className="player-stats">
              <h3>📊 Your Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Best Score:</span>
                  <span className="stat-value">{playerRecord.bestScore}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Games:</span>
                  <span className="stat-value">{playerRecord.totalGames}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Last Played:</span>
                  <span className="stat-value">
                    {playerRecord.lastPlayed.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="leaderboard">
            <h3>🏆 Leaderboard</h3>
            {leaderboard.length === 0 ? (
              <p>No players yet. Be the first!</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((player) => (
                  <div 
                    key={player.address} 
                    className={`leaderboard-item ${player.address.toLowerCase() === account.toLowerCase() ? 'current-player' : ''}`}
                  >
                    <span className="rank">#{player.rank}</span>
                    <span className="player-address">
                      {formatAddress(player.address)}
                    </span>
                    <span className="best-score">{player.bestScore}</span>
                    <span className="total-games">({player.totalGames} games)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterMind;
