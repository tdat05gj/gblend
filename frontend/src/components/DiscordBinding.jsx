import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DISCORD_ABI, DISCORD_CONTRACT_ADDRESS } from '../utils/web3';
import './DiscordBinding.css';

const DiscordBinding = ({ account }) => {
  const [discordUsername, setDiscordUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to get Discord contract
  const getDiscordContract = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(DISCORD_CONTRACT_ADDRESS, DISCORD_ABI, signer);
  };

  useEffect(() => {
    if (account) {
      loadUserProfile();
    }
  }, [account]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      const discordContract = await getDiscordContract();
      const profile = await discordContract.getDiscordByWallet(account);
      
      if (profile.isRegistered) {
        setCurrentProfile({
          discordUsername: profile.discordUsername,
          isRegistered: profile.isRegistered
        });
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
        setCurrentProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!discordUsername.trim()) {
      alert('Please enter your Discord username');
      return;
    }

    try {
      setIsSubmitting(true);

      const discordContract = await getDiscordContract();
      const tx = await discordContract.registerDiscord(
        discordUsername.trim()
      );

      await tx.wait();

      // Reload profile
      await loadUserProfile();

      alert('Discord account successfully linked to your wallet!');
      
      // Clear form
      setDiscordUsername('');
      
    } catch (error) {
      console.error('Error registering Discord:', error);
      
      if (error.reason) {
        alert(`Registration failed: ${error.reason}`);
      } else if (error.message.includes('already registered')) {
        alert('This Discord username is already linked to another wallet');
      } else if (error.message.includes('Wallet already registered')) {
        alert('This wallet is already linked to a Discord account');
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!discordUsername.trim()) {
      alert('Please enter a new username');
      return;
    }

    try {
      setIsSubmitting(true);

      const discordContract = await getDiscordContract();
      const tx = await discordContract.updateDiscordUsername(
        discordUsername.trim()
      );

      await tx.wait();

      // Reload profile
      await loadUserProfile();

      alert('Discord username updated successfully!');
      setDiscordUsername('');
      
    } catch (error) {
      console.error('Error updating username:', error);
      alert('Update failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) {
    return (
      <div className="discord-binding">
        <h3>🔗 Discord Binding</h3>
        <p>Please connect your wallet to link your Discord account.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="discord-binding">
        <h3>🔗 Discord Binding</h3>
        <p>Loading your Discord profile...</p>
      </div>
    );
  }

  return (
    <div className="discord-binding">
      <h3>🔗 Discord Binding</h3>
      
      {isRegistered && currentProfile ? (
        <div className="profile-info">
          <div className="profile-header">
            <span className="status-badge registered">✅ Registered</span>
          </div>
          
          <div className="profile-details">
            <div className="profile-item">
              <label>Discord Username:</label>
              <span className="discord-username">{currentProfile.discordUsername}</span>
            </div>
            
            <div className="profile-item">
              <label>Wallet:</label>
              <span className="wallet-address">{account}</span>
            </div>
          </div>

          <div className="update-section">
            <h4>Update Username</h4>
            <div className="input-group">
              <input
                type="text"
                placeholder="New Discord username"
                value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                onClick={handleUpdateUsername}
                disabled={isSubmitting || !discordUsername.trim()}
                className="update-btn"
              >
                {isSubmitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="register-form">
          <div className="form-header">
            <span className="status-badge unregistered">❌ Not Registered</span>
          </div>
          
          <p className="description">
            Link your Discord account to show your username in game leaderboards!
          </p>

          <div className="form-group">
            <label htmlFor="discordUsername">Discord Username:</label>
            <input
              id="discordUsername"
              type="text"
              placeholder="YourUsername"
              value={discordUsername}
              onChange={(e) => setDiscordUsername(e.target.value)}
              disabled={isSubmitting}
            />
            <small>Your current Discord username with discriminator</small>
          </div>

          <button
            onClick={handleRegister}
            disabled={isSubmitting || !discordUsername.trim()}
            className="register-btn"
          >
            {isSubmitting ? 'Registering...' : 'Link Discord Account'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscordBinding;
