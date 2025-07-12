// script.js
document.addEventListener('DOMContentLoaded', function() {
  // Enhanced Gallery Filter Functionality
  const categoryFilter = document.getElementById('category-filter');
  const styleFilter = document.getElementById('style-filter');
  const priceFilter = document.getElementById('price-filter');
  const resetBtn = document.querySelector('.filter-reset');
  const artCards = document.querySelectorAll('.art-card');

  // Enhanced filter function with smooth transitions
  function filterArtworks() {
    const categoryValue = categoryFilter.value;
    const styleValue = styleFilter.value;
    const priceValue = priceFilter.value;

    artCards.forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      const cardStyle = card.getAttribute('data-style');
      const cardPrice = card.getAttribute('data-price');

      const categoryMatch = categoryValue === 'all' || cardCategory === categoryValue;
      const styleMatch = styleValue === 'all' || cardStyle === styleValue;
      const priceMatch = priceValue === 'all' || cardPrice === priceValue;

      // First fade out all cards
      card.style.opacity = '0';
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

      setTimeout(() => {
        if (categoryMatch && styleMatch && priceMatch) {
          card.style.display = 'block';
          // Use requestAnimationFrame for smooth appearance
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.display = 'none';
          card.style.transform = 'translateY(20px)';
        }
      }, 50);
    });
  }

  // Event listeners with debounce for better performance
  let filterTimeout;
  function debounceFilter() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(filterArtworks, 200);
  }

  categoryFilter.addEventListener('change', debounceFilter);
  styleFilter.addEventListener('change', debounceFilter);
  priceFilter.addEventListener('change', debounceFilter);

  // Enhanced reset button with animation
  resetBtn.addEventListener('click', function() {
    // Add active state for visual feedback
    this.classList.add('active');
    setTimeout(() => this.classList.remove('active'), 300);
    
    // Reset filters with animation
    categoryFilter.value = 'all';
    styleFilter.value = 'all';
    priceFilter.value = 'all';
    filterArtworks();
  });

  // Enhanced Pagination
  const paginationBtns = document.querySelectorAll('.pagination-btn:not(.disabled)');
  paginationBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Smooth transition between pages
      document.querySelector('.gallery-grid').style.opacity = '0';
      
      setTimeout(() => {
        document.querySelector('.pagination-btn.active').classList.remove('active');
        this.classList.add('active');
        
        // Here you would typically load new content for the page
        // For demo purposes, we'll just fade back in
        document.querySelector('.gallery-grid').style.opacity = '1';
      }, 300);
    });
  });

  // Enhanced Canvas Drawing with LocalStorage
  const canvas = document.getElementById('drawing-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clear-canvas');
    const colorPicker = document.getElementById('color-picker');
    const brushSize = document.getElementById('brush-size');
    const brushSizeValue = document.getElementById('brush-size-value');
    const saveBtn = document.getElementById('save-drawing');
    const loadBtn = document.getElementById('load-drawing');
    
    // Touch support variables
    let isTouchDevice = 'ontouchstart' in window;
    let lastTouch = null;

    // Set canvas size with better handling
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      // Redraw existing content after resize
      loadDrawing();
    }

    window.addEventListener('load', resizeCanvas);
    window.addEventListener('resize', () => {
      // Throttle resize events
      if (!this.resizeTimeout) {
        this.resizeTimeout = setTimeout(() => {
          this.resizeTimeout = null;
          resizeCanvas();
        }, 200);
      }
    });

    // Drawing state with pressure support (for devices that support it)
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentPressure = 1;

    // Initialize from localStorage with error handling
    function loadDrawing() {
      try {
        const savedDrawing = localStorage.getItem('userDrawing');
        if (savedDrawing) {
          const img = new Image();
          img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.onerror = function() {
            console.error('Error loading saved drawing');
            localStorage.removeItem('userDrawing');
          };
          img.src = savedDrawing;
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
    }

    // Enhanced drawing functions with touch support
    function startDrawing(e) {
      isDrawing = true;
      const pos = getPosition(e);
      [lastX, lastY] = [pos.x, pos.y];
      
      // Handle pressure if available
      if (e.pressure !== undefined) {
        currentPressure = e.pressure;
      } else if (e.touches) {
        currentPressure = 1; // Default pressure for touch
      }
      
      // Start new path immediately
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
      if (!isDrawing) return;
      
      const pos = getPosition(e);
      const newX = pos.x;
      const newY = pos.y;
      
      // Update pressure if available
      if (e.pressure !== undefined) {
        currentPressure = e.pressure;
      }
      
      // Set drawing style
      ctx.strokeStyle = colorPicker.value;
      ctx.lineWidth = brushSize.value * currentPressure;
      
      // Draw line
      ctx.lineTo(newX, newY);
      ctx.stroke();
      
      // Prepare for next segment
      ctx.beginPath();
      ctx.moveTo(newX, newY);
      
      [lastX, lastY] = [newX, newY];
    }

    function stopDrawing() {
      isDrawing = false;
    }

    // Get position from mouse or touch event
    function getPosition(e) {
      let x, y;
      if (isTouchDevice && e.touches) {
        const rect = canvas.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.offsetX;
        y = e.offsetY;
      }
      return { x, y };
    }

    // Mouse event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch event listeners
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isTouchDevice = true;
      startDrawing(e);
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      draw(e);
    });
    
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      stopDrawing();
    });

    // Enhanced controls with feedback
    clearBtn.addEventListener('click', () => {
      // Animate clear
      canvas.style.opacity = '0';
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.opacity = '1';
      }, 300);
    });

    brushSize.addEventListener('input', () => {
      brushSizeValue.textContent = `${brushSize.value}px`;
      // Visual feedback
      brushSizeValue.style.transform = 'scale(1.2)';
      setTimeout(() => {
        brushSizeValue.style.transform = 'scale(1)';
      }, 200);
    });

    saveBtn.addEventListener('click', () => {
      try {
        const dataURL = canvas.toDataURL('image/png');
        localStorage.setItem('userDrawing', dataURL);
        
        // Visual feedback
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          saveBtn.textContent = 'Save Drawing';
        }, 2000);
      } catch (e) {
        console.error('Error saving drawing:', e);
        saveBtn.textContent = 'Error Saving';
        setTimeout(() => {
          saveBtn.textContent = 'Save Drawing';
        }, 2000);
      }
    });

    loadBtn.addEventListener('click', () => {
      loadDrawing();
      // Visual feedback
      loadBtn.textContent = 'Loaded!';
      setTimeout(() => {
        loadBtn.textContent = 'Load Drawing';
      }, 2000);
    });

    // Load any existing drawing on page load
    loadDrawing();
  }

  // Enhanced Web Audio API Visualizer
  const visualizer = document.getElementById('audio-visualizer');
  if (visualizer) {
    const visualizerCtx = visualizer.getContext('2d');
    const audioUpload = document.getElementById('audio-upload');
    const playBtn = document.getElementById('play-audio');
    const pauseBtn = document.getElementById('pause-audio');
    const stopBtn = document.getElementById('stop-audio');
    
    let audioContext;
    let analyser;
    let source;
    let audioBuffer;
    let isPlaying = false;
    let animationId;
    let audioElement;

    // Set visualizer size with high DPI support
    function resizeVisualizer() {
      const rect = visualizer.getBoundingClientRect();
      visualizer.width = rect.width * window.devicePixelRatio;
      visualizer.height = rect.height * window.devicePixelRatio;
      visualizer.style.width = rect.width + 'px';
      visualizer.style.height = rect.height + 'px';
      visualizerCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    window.addEventListener('load', resizeVisualizer);
    window.addEventListener('resize', () => {
      if (!this.resizeTimeout) {
        this.resizeTimeout = setTimeout(() => {
          this.resizeTimeout = null;
          resizeVisualizer();
        }, 200);
      }
    });

    // Enhanced audio setup with error handling
    audioUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const fileURL = URL.createObjectURL(file);
        audioElement = new Audio(fileURL);
        
        // Initialize audio context on user interaction
        if (!audioContext) {
          try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            
            source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            audioElement.addEventListener('play', () => {
              isPlaying = true;
              if (!animationId) {
                visualize();
              }
            });
            
            audioElement.addEventListener('pause', () => {
              isPlaying = false;
              cancelAnimationFrame(animationId);
              animationId = null;
            });
            
            audioElement.addEventListener('ended', () => {
              isPlaying = false;
              cancelAnimationFrame(animationId);
              animationId = null;
              visualizerCtx.clearRect(0, 0, visualizer.width, visualizer.height);
            });
            
            audioElement.addEventListener('error', (e) => {
              console.error('Audio error:', e);
              showAudioError();
            });
          } catch (err) {
            console.error('AudioContext error:', err);
            showAudioError();
            return;
          }
        }
        
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        
        playBtn.onclick = () => {
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          audioElement.play();
        };
        
        pauseBtn.onclick = () => audioElement.pause();
        stopBtn.onclick = () => {
          audioElement.pause();
          audioElement.currentTime = 0;
          cancelAnimationFrame(animationId);
          animationId = null;
          visualizerCtx.clearRect(0, 0, visualizer.width, visualizer.height);
        };
      } catch (err) {
        console.error('Error loading audio file:', err);
        showAudioError();
      }
    });

    function showAudioError() {
      visualizerCtx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      visualizerCtx.fillRect(0, 0, visualizer.width, visualizer.height);
      visualizerCtx.fillStyle = '#000';
      visualizerCtx.textAlign = 'center';
      visualizerCtx.textBaseline = 'middle';
      visualizerCtx.font = '16px Arial';
      visualizerCtx.fillText('Error loading audio', visualizer.width/2, visualizer.height/2);
    }

    // Enhanced visualization function with smoother animation
    function visualize() {
      if (!isPlaying) return;
      
      animationId = requestAnimationFrame(visualize);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      
      // Clear with semi-transparent background for trail effect
      visualizerCtx.fillStyle = 'rgba(25, 74, 60, 0.05)';
      visualizerCtx.fillRect(0, 0, visualizer.width, visualizer.height);
      
      const barWidth = (visualizer.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * visualizer.height;
        
        // Create gradient for each bar
        const gradient = visualizerCtx.createLinearGradient(0, visualizer.height - barHeight, 0, visualizer.height);
        gradient.addColorStop(0, `hsl(${i / bufferLength * 360}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${i / bufferLength * 360}, 100%, 30%)`);
        
        visualizerCtx.fillStyle = gradient;
        visualizerCtx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
        
        // Add subtle shadow
        visualizerCtx.shadowBlur = 5;
        visualizerCtx.shadowColor = `hsl(${i / bufferLength * 360}, 100%, 50%)`;
        
        x += barWidth + 1;
      }
      
      // Reset shadow
      visualizerCtx.shadowBlur = 0;
    }
  }

  // Enhanced Intersection Observer for scroll animations
  const scrollArts = document.querySelectorAll('.scroll-art');
  if (scrollArts.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optional: Unobserve after animation completes
          setTimeout(() => {
            observer.unobserve(entry.target);
          }, 1000);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    scrollArts.forEach(art => {
      // Random delay for staggered animations
      art.style.transitionDelay = `${Math.random() * 0.3}s`;
      observer.observe(art);
    });
  }

  // Enhanced Device Orientation API with fallback
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function(e) {
      // Check if we have permission or the event provides values
      if (e.alpha === null || e.beta === null || e.gamma === null) return;
      
      const tilt = e.gamma; // -90 to 90 degrees
      const cards = document.querySelectorAll('.art-card, .gallery-item');
      
      cards.forEach(card => {
        // Limit tilt effect and add smooth transition
        const maxTilt = 15;
        const tiltAmount = Math.min(Math.max(tilt * 0.2, -maxTilt), maxTilt);
        card.style.transform = `rotate(${tiltAmount}deg)`;
        card.style.transition = 'transform 0.5s ease-out';
      });
    });
    
    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const orientationPermissionBtn = document.createElement('button');
      orientationPermissionBtn.textContent = 'Enable Tilt Effects';
      orientationPermissionBtn.style.position = 'fixed';
      orientationPermissionBtn.style.bottom = '20px';
      orientationPermissionBtn.style.right = '20px';
      orientationPermissionBtn.style.zIndex = '1000';
      orientationPermissionBtn.style.padding = '10px 15px';
      orientationPermissionBtn.style.backgroundColor = 'var(--primary-color)';
      orientationPermissionBtn.style.color = 'white';
      orientationPermissionBtn.style.border = 'none';
      orientationPermissionBtn.style.borderRadius = '5px';
      orientationPermissionBtn.style.cursor = 'pointer';
      
      orientationPermissionBtn.addEventListener('click', () => {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              orientationPermissionBtn.style.display = 'none';
            }
          })
          .catch(console.error);
      });
      
      document.body.appendChild(orientationPermissionBtn);
    }
  }
});