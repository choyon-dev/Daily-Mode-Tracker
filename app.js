const moods = {
    happy: '😃',
    content: '🙂',
    neutral: '😐',
    sad: '😞',
    angry: '😡'
};

let currentDate = new Date();
let selectedMood = null;
let isDarkMode = true;

const moodOptions = document.querySelectorAll('.mood-option');
const saveBtn = document.getElementById('save-btn');
const calendarToggle = document.getElementById('calendar-toggle');
const historyContainer = document.querySelector('.history-container');
const calendarGrid = document.getElementById('calendar');
const currentMonthEl = document.getElementById('current-month');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// Initialize
loadEntries();
generateCalendar(currentDate);
updateProgress();

// Event Listeners
moodOptions.forEach(option => option.addEventListener('click', selectMood));
saveBtn.addEventListener('click', saveEntry);
calendarToggle.addEventListener('click', () => historyContainer.style.display = 'grid');
darkModeToggle.addEventListener('click', toggleDarkMode);
document.getElementById('prev-month').addEventListener('click', () => updateMonth(-1));
document.getElementById('next-month').addEventListener('click', () => updateMonth(1));

function selectMood(e) {
    moodOptions.forEach(option => option.classList.remove('selected'));
    e.target.classList.add('selected');
    selectedMood = e.target.dataset.mood;
}

function saveEntry() {
    if (!selectedMood) return;
    
    const entry = {
        date: new Date().toISOString().split('T')[0],
        mood: selectedMood,
        note: document.getElementById('mood-note').value
    };
    
    const entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    if (existingIndex > -1) {
        entries[existingIndex] = entry;
    } else {
        entries.push(entry);
    }
    
    localStorage.setItem('moodEntries', JSON.stringify(entries));
    showConfirmation();
    updateProgress();
}

function loadEntries() {
    const entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    entries.forEach(entry => {
        const dayEl = document.querySelector(`[data-date="${entry.date}"]`);
        if (dayEl) {
            dayEl.textContent = moods[entry.mood];
            dayEl.dataset.mood = entry.mood;
        }
    });
}

function generateCalendar(date) {
    calendarGrid.innerHTML = '';
    currentMonthEl.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Add weekday labels
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'weekday-label';
        dayLabel.textContent = day;
        calendarGrid.appendChild(dayLabel);
    });
    
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Add empty days
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarGrid.appendChild(createDayElement(null));
    }
    
    // Add actual days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarGrid.appendChild(createDayElement(dateStr, day));
    }
}

function createDayElement(date, dayNumber) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (date) {
        const dateObj = new Date(date);
        const today = new Date();
        const isToday = dateObj.toDateString() === today.toDateString();
        
        if (isToday) {
            dayEl.classList.add('today');
        }
        
        dayEl.dataset.date = date;
        
        // Add date number
        const dateNumberEl = document.createElement('div');
        dateNumberEl.className = 'date-number';
        dateNumberEl.textContent = dayNumber;
        dayEl.appendChild(dateNumberEl);
        
        const entry = getEntryForDate(date);
        if (entry) {
            dayEl.classList.add('has-entry');
            const moodEl = document.createElement('div');
            moodEl.className = 'mood-emoji';
            moodEl.textContent = moods[entry.mood];
            dayEl.appendChild(moodEl);
            dayEl.dataset.mood = entry.mood;
        }
    }
    
    dayEl.addEventListener('click', showDayDetails);
    return dayEl;
}

function getEntryForDate(date) {
    const entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    return entries.find(e => e.date === date);
}

function showDayDetails(e) {
    const entry = getEntryForDate(e.target.closest('.calendar-day').dataset.date);
    if (entry) {
        const date = new Date(entry.date);
        showModal(
            `${date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
            `Mood: ${moods[entry.mood]} ${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
            ${entry.note ? `\n\nNote: ${entry.note}` : ''}`
        );
    }
}

function updateMonth(change) {
    currentDate.setMonth(currentDate.getMonth() + change);
    generateCalendar(currentDate);
    loadEntries();
}

function updateProgress() {
    const entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    const moodCounts = Object.keys(moods).reduce((acc, mood) => {
        acc[mood] = 0;
        return acc;
    }, {});
    
    entries.forEach(entry => moodCounts[entry.mood]++);
    const total = entries.length || 1;
    
    document.querySelectorAll('.progress-segment').forEach(segment => {
        const mood = segment.dataset.mood;
        const count = moodCounts[mood];
        const percentage = (count / total) * 100;
        
        segment.style.width = `${percentage}%`;
        segment.title = `${mood}: ${percentage.toFixed(1)}%`;
        
        // Add count badge
        if (count > 0) {
            segment.setAttribute('data-count', count);
        }
    });
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
}

function showConfirmation() {
    saveBtn.textContent = 'Saved!';
    setTimeout(() => {
        saveBtn.textContent = 'Save Entry';
        document.getElementById('mood-note').value = '';
        moodOptions.forEach(option => option.classList.remove('selected'));
        selectedMood = null;
    }, 2000);
}

// Sound Generator Functions
function playSound(frequency = 440, type = 'sine', duration = 0.2) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

const moodSounds = {
    happy: () => playSound(523.25, 'square', 0.3),
    content: () => playSound(392, 'sine', 0.4),
    neutral: () => playSound(329.63, 'triangle', 0.2),
    sad: () => playSound(220, 'sawtooth', 0.5),
    angry: () => playSound(73.42, 'square', 0.1)
};

// Modal Functions
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close');

function showModal(title, text) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    modal.style.display = 'flex';
    playSound(659.25, 'sine', 0.1);
}

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => e.target === modal && (modal.style.display = 'none');

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
        modal.style.display = 'none';
    }
    if (e.key === 'ArrowLeft') {
        updateMonth(-1);
    }
    if (e.key === 'ArrowRight') {
        updateMonth(1);
    }
});

// Set dark mode as default
isDarkMode = true;
document.documentElement.setAttribute('data-theme', 'dark');
darkModeToggle.textContent = '☀️';