// Main player functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const albumList = document.getElementById('albumList');
    const songList = document.getElementById('songList');
    const albumCover = document.getElementById('albumCover');
    const albumTitle = document.getElementById('albumTitle');
    const currentTrack = document.getElementById('currentTrack');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');

    // Player state
    let currentAlbum = null;
    let currentSong = null;
    let isPlaying = false;
    let sound = null;
    let interval = null;

    // Initialize the player
    function init() {
        renderAlbumList();
        setupEventListeners();
        // Set up default album cover to link to Album 1
document.getElementById('defaultAlbumLink').addEventListener('click', function(e) {
    e.preventDefault();
    // Find Album 1 and select it
    const firstAlbum = albumsData.find(album => album.id === 1);
    if (firstAlbum) {
        selectAlbum(firstAlbum);
        // Play the first song if desired
        if (firstAlbum.songs.length > 0) {
            playSong(firstAlbum.songs[0]);
        }
    }
});
    }

    // Render the list of albums
    function renderAlbumList() {
        albumList.innerHTML = '';
        
        albumsData.forEach(album => {
            const albumItem = document.createElement('div');
            albumItem.className = 'album-item';
            albumItem.dataset.albumId = album.id;
            
            albumItem.innerHTML = `
                <img src="${album.cover}" alt="${album.title}" class="album-item-cover">
                <div class="album-item-info">
                    <div class="album-item-title">${album.title}</div>
                    <div class="album-item-artist">${album.artist}</div>
                </div>
            `;
            
            albumItem.addEventListener('click', () => selectAlbum(album));
            
            albumList.appendChild(albumItem);
        });
    }

    // Select an album and render its songs
    function selectAlbum(album) {
        // Update UI for album selection
        document.querySelectorAll('.album-item').forEach(item => {
            item.classList.remove('active');
            if (Number(item.dataset.albumId) === album.id) {
                item.classList.add('active');
            }
        });
        
        currentAlbum = album;
        albumCover.src = album.cover;
        albumTitle.textContent = `${album.title} - ${album.artist}`;
        
        renderSongList();
    }

    // Render songs for the selected album
    function renderSongList() {
        songList.innerHTML = '';
        
        if (!currentAlbum) return;
        
        currentAlbum.songs.forEach((song, index) => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.dataset.songId = song.id;
            
            songItem.innerHTML = `
                <div class="song-number">${index + 1}</div>
                <div class="song-details">
                    <div class="song-title">${song.title}</div>
                </div>
                <div class="song-duration">${formatTime(song.duration)}</div>
            `;
            
            songItem.addEventListener('click', () => {
                playSong(song);
            });
            
            songList.appendChild(songItem);
        });
    }

    // Play a song
    function playSong(song) {
        // Stop current song if playing
        if (sound) {
            sound.stop();
            clearInterval(interval);
        }
        
        // Update UI for song selection
        document.querySelectorAll('.song-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.songId === song.id) {
                item.classList.add('active');
            }
        });
        
        currentSong = song;
        currentTrack.textContent = song.title;
        
        // Create and play a new Howl instance
        sound = new Howl({
            src: [song.file],
            html5: true, // Force HTML5 Audio for better streaming support
            volume: volumeSlider.value / 100,
            onplay: function() {
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                updateProgress();
            },
            onpause: function() {
                isPlaying = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                clearInterval(interval);
            },
            onstop: function() {
                isPlaying = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                clearInterval(interval);
            },
            onend: function() {
                playNextSong();
            },
            onload: function() {
                totalTimeEl.textContent = formatTime(sound.duration());
            }
        });
        
        sound.play();
    }

    // Update progress bar during playback
    function updateProgress() {
        clearInterval(interval);
        
        interval = setInterval(() => {
            if (sound && isPlaying) {
                const seekPos = sound.seek();
                const duration = sound.duration();
                const progressPercent = (seekPos / duration) * 100;
                
                progress.style.width = `${progressPercent}%`;
                currentTimeEl.textContent = formatTime(seekPos);
            }
        }, 100);
    }

    // Play previous song
    function playPrevSong() {
        if (!currentAlbum || !currentSong) return;
        
        const currentIndex = currentAlbum.songs.findIndex(song => song.id === currentSong.id);
        const prevIndex = currentIndex - 1;
        
        if (prevIndex >= 0) {
            playSong(currentAlbum.songs[prevIndex]);
        } else {
            // Wrap to the end of the album
            playSong(currentAlbum.songs[currentAlbum.songs.length - 1]);
        }
    }

    // Play next song
    function playNextSong() {
        if (!currentAlbum || !currentSong) return;
        
        const currentIndex = currentAlbum.songs.findIndex(song => song.id === currentSong.id);
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < currentAlbum.songs.length) {
            playSong(currentAlbum.songs[nextIndex]);
        } else {
            // Wrap to the beginning of the album
            playSong(currentAlbum.songs[0]);
        }
    }

    // Toggle play/pause
    function togglePlay() {
        if (!sound) {
            if (currentAlbum && currentAlbum.songs.length > 0) {
                playSong(currentAlbum.songs[0]);
            }
            return;
        }
        
        if (isPlaying) {
            sound.pause();
        } else {
            sound.play();
        }
    }

    // Toggle mute
    function toggleMute() {
        if (!sound) return;
        
        const isMuted = sound.mute();
        sound.mute(!isMuted);
        
        if (!isMuted) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    // Change volume
    function changeVolume() {
        if (!sound) return;
        
        const volumeValue = volumeSlider.value / 100;
        sound.volume(volumeValue);
        
        // Update mute button icon based on volume
        if (volumeValue === 0) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    // Seek to a specific position in the song
    function seekTo(event) {
        if (!sound) return;
        
        const seekPos = (event.offsetX / progressBar.clientWidth) * sound.duration();
        sound.seek(seekPos);
        updateProgress();
    }

    // Format time in seconds to MM:SS
    function formatTime(secs) {
        if (isNaN(secs)) return '0:00';
        
        const minutes = Math.floor(secs / 60) || 0;
        const seconds = Math.floor(secs - minutes * 60) || 0;
        
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    // Set up event listeners
    function setupEventListeners() {
        playBtn.addEventListener('click', togglePlay);
        prevBtn.addEventListener('click', playPrevSong);
        nextBtn.addEventListener('click', playNextSong);
        muteBtn.addEventListener('click', toggleMute);
        volumeSlider.addEventListener('input', changeVolume);
        progressBar.addEventListener('click', seekTo);
    }

    // Initialize the player
    init();
});