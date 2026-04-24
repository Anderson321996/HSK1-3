document.addEventListener('DOMContentLoaded', () => {
    let currentVocabulary = typeof hsk1_vocabulary !== 'undefined' ? hsk1_vocabulary : [];
    let currentSentences = typeof hsk1_sentences !== 'undefined' ? hsk1_sentences : [];
    let currentReading = typeof hsk1_reading !== 'undefined' ? hsk1_reading : [];
    
    // TTS function
    function speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // cancel any ongoing speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.8; // slightly slower for learners
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.');
        }
    }
    
    // HSK Level Selection
    const levelSelector = document.getElementById('hsk-level-selector');
    const learnTitle = document.getElementById('learn-title');
    
    levelSelector.addEventListener('change', (e) => {
        const level = e.target.value;
        if (level === '1') {
            currentVocabulary = typeof hsk1_vocabulary !== 'undefined' ? hsk1_vocabulary : [];
            currentSentences = typeof hsk1_sentences !== 'undefined' ? hsk1_sentences : [];
            currentReading = typeof hsk1_reading !== 'undefined' ? hsk1_reading : [];
        } else if (level === '2') {
            currentVocabulary = typeof hsk2_vocabulary !== 'undefined' ? hsk2_vocabulary : [];
            currentSentences = typeof hsk2_sentences !== 'undefined' ? hsk2_sentences : [];
            currentReading = typeof hsk2_reading !== 'undefined' ? hsk2_reading : [];
        } else if (level === '3') {
            currentVocabulary = typeof hsk3_vocabulary !== 'undefined' ? hsk3_vocabulary : [];
            currentSentences = typeof hsk3_sentences !== 'undefined' ? hsk3_sentences : [];
            currentReading = typeof hsk3_reading !== 'undefined' ? hsk3_reading : [];
        }
        
        learnTitle.innerText = `Học Từ Vựng HSK ${level}`;
        
        // Update category filter dynamically
        updateCategoryFilter();
        
        // Refresh current active tab
        const activeTab = document.querySelector('.nav-links li.active').dataset.tab;
        if (activeTab === 'learn') {
            document.getElementById('category-filter').value = 'all';
            renderFlashcards();
        } else if (activeTab === 'practice') {
            initPractice();
        } else if (activeTab === 'quiz') {
            resetQuiz();
        } else if (activeTab === 'sentence') {
            initSentencePractice();
        } else if (activeTab === 'listening') {
            initListening();
        } else if (activeTab === 'reading') {
            initReading();
        }
    });

    function updateCategoryFilter() {
        const categories = [...new Set(currentVocabulary.map(w => w.category))];
        const filterSelect = document.getElementById('category-filter');
        filterSelect.innerHTML = '<option value="all">Tất cả</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            filterSelect.appendChild(opt);
        });
    }

    // Initialize filter for default level
    updateCategoryFilter();

    // === 1. TAB NAVIGATION ===
    const tabs = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Stop any ongoing audio when switching tabs
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }

            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to current
            tab.classList.add('active');
            const targetId = `tab-${tab.dataset.tab}`;
            document.getElementById(targetId).classList.add('active');
            
            // Re-initialize specific tab logic
            if (tab.dataset.tab === 'learn') {
                renderFlashcards(document.getElementById('category-filter').value);
            } else if(tab.dataset.tab === 'practice') {
                initPractice();
            } else if (tab.dataset.tab === 'quiz') {
                resetQuiz();
            } else if (tab.dataset.tab === 'sentence') {
                initSentencePractice();
            } else if (tab.dataset.tab === 'listening') {
                initListening();
            } else if (tab.dataset.tab === 'reading') {
                initReading();
            }
        });
    });

    // === 2. LEARN TAB (FLASHCARDS) ===
    const flashcardContainer = document.getElementById('flashcard-container');
    const categoryFilter = document.getElementById('category-filter');

    function renderFlashcards(filter = 'all') {
        flashcardContainer.innerHTML = '';
        
        const filteredWords = filter === 'all' 
            ? currentVocabulary 
            : currentVocabulary.filter(word => word.category === filter);

        filteredWords.forEach(word => {
            const card = document.createElement('div');
            card.className = 'flashcard';
            card.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <button class="vocab-audio-btn" style="position: absolute; top: 0.5rem; right: 0.5rem; background: transparent; border: none; font-size: 1.5rem; color: var(--primary-color); cursor: pointer; z-index: 10; transition: transform 0.2s;"><i class="ri-volume-up-fill"></i></button>
                        <div class="hanzi">${word.hanzi}</div>
                    </div>
                    <div class="flashcard-back">
                        <button class="vocab-audio-btn" style="position: absolute; top: 0.5rem; right: 0.5rem; background: transparent; border: none; font-size: 1.5rem; color: rgba(255, 255, 255, 0.8); cursor: pointer; z-index: 10; transition: transform 0.2s;"><i class="ri-volume-up-fill"></i></button>
                        <div class="pinyin">${word.pinyin}</div>
                        <div class="meaning">${word.vi}</div>
                        <div class="example">${word.example}</div>
                    </div>
                </div>
            `;
            
            // Audio click logic
            const audioBtns = card.querySelectorAll('.vocab-audio-btn');
            audioBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card from flipping
                    speak(word.hanzi);
                });
            });

            // Flip logic
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });

            flashcardContainer.appendChild(card);
        });
    }

    categoryFilter.addEventListener('change', (e) => {
        renderFlashcards(e.target.value);
    });

    // Initial render
    renderFlashcards();

    // === 3. PRACTICE TAB ===
    let practiceScore = 0;
    let currentPracticeWord = null;

    function initPractice() {
        practiceScore = 0;
        document.getElementById('practice-score').innerText = practiceScore;
        nextPracticeQuestion();
    }

    function nextPracticeQuestion() {
        document.getElementById('next-practice-btn').classList.add('hidden');
        
        // Pick random word
        const rIndex = Math.floor(Math.random() * currentVocabulary.length);
        currentPracticeWord = currentVocabulary[rIndex];
        
        document.getElementById('practice-question').innerText = currentPracticeWord.hanzi;

        // Generate options (1 correct, 3 wrong)
        const options = [currentPracticeWord];
        while(options.length < 4) {
            const randomOption = currentVocabulary[Math.floor(Math.random() * currentVocabulary.length)];
            if(!options.find(opt => opt.id === randomOption.id)) {
                options.push(randomOption);
            }
        }
        
        // Shuffle options
        options.sort(() => Math.random() - 0.5);
        
        const optionsContainer = document.getElementById('practice-options');
        optionsContainer.innerHTML = '';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = `${opt.vi} (${opt.pinyin})`;
            btn.dataset.id = opt.id;
            btn.addEventListener('click', () => checkPracticeAnswer(btn, opt.id));
            optionsContainer.appendChild(btn);
        });
    }

    function checkPracticeAnswer(btn, selectedId) {
        // Prevent clicking multiple times
        const allBtns = document.querySelectorAll('#practice-options .option-btn');
        allBtns.forEach(b => b.style.pointerEvents = 'none');

        if(selectedId === currentPracticeWord.id) {
            btn.classList.add('correct');
            practiceScore += 10;
            document.getElementById('practice-score').innerText = practiceScore;
        } else {
            btn.classList.add('wrong');
            // Highlight correct one
            allBtns.forEach(b => {
                if(parseInt(b.dataset.id) === currentPracticeWord.id) {
                    b.classList.add('correct');
                }
            });
        }
        
        document.getElementById('next-practice-btn').classList.remove('hidden');
    }

    document.getElementById('next-practice-btn').addEventListener('click', nextPracticeQuestion);


    // === 4. QUIZ TAB ===
    let quizQuestions = [];
    let currentQuizIndex = 0;
    let quizScore = 0;
    let currentQuizLength = 20;
    let quizTimer;
    let timeLeft = 0;
    let currentQuizSentenceMode = null;
    let quizSelectedWords = [];

    const quizIntro = document.getElementById('quiz-intro');
    const quizActive = document.getElementById('quiz-active');
    const quizResult = document.getElementById('quiz-result');

    function resetQuiz() {
        clearInterval(quizTimer);
        quizIntro.classList.remove('hidden');
        quizActive.classList.add('hidden');
        quizResult.classList.add('hidden');
    }

    document.getElementById('start-combined-quiz-btn').addEventListener('click', startQuiz);
    document.getElementById('restart-quiz-btn').addEventListener('click', startQuiz);

    function startQuiz() {
        quizIntro.classList.add('hidden');
        quizResult.classList.add('hidden');
        quizActive.classList.remove('hidden');
        document.getElementById('quiz-timeout-msg').classList.add('hidden');
        
        quizScore = 0;
        currentQuizIndex = 0;
        
        let combinedData = [];
        
        // Create pools
        let vocabPool = currentVocabulary ? [...currentVocabulary].sort(() => 0.5 - Math.random()) : [];
        let sentencePool = currentSentences ? [...currentSentences].sort(() => 0.5 - Math.random()) : [];
        
        // Distribute up to 20 questions (5 of each if possible)
        vocabPool.splice(0, 5).forEach(item => combinedData.push({ ...item, qType: 'reading' }));
        vocabPool.splice(0, 5).forEach(item => combinedData.push({ ...item, qType: 'listening' }));
        vocabPool.splice(0, 5).forEach(item => combinedData.push({ ...item, qType: 'speaking' }));
        sentencePool.splice(0, 5).forEach(item => combinedData.push({ ...item, qType: 'writing' }));
        
        currentQuizLength = combinedData.length;
        if (currentQuizLength === 0) return;
        
        timeLeft = 600; // 10 phút (600 giây)
        
        const shuffled = combinedData.sort(() => 0.5 - Math.random());
        quizQuestions = shuffled;
        
        // Start Timer
        clearInterval(quizTimer);
        timeLeft = currentQuizLength * 10;
        document.getElementById('quiz-time-left').innerText = timeLeft;
        quizTimer = setInterval(() => {
            timeLeft--;
            document.getElementById('quiz-time-left').innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(quizTimer);
                finishQuiz(true);
            }
        }, 1000);
        
        if (currentQuizLength > 0) {
            showQuizQuestion();
        } else {
            finishQuiz();
        }
    }

    function renderQuizPalette() {
        const palette = document.getElementById('quiz-palette');
        if (!palette) return;
        palette.innerHTML = '';
        quizQuestions.forEach((q, index) => {
            const btn = document.createElement('button');
            btn.className = 'palette-btn';
            btn.style.padding = '8px 4px';
            btn.style.borderRadius = '8px';
            btn.style.border = '1px solid var(--border-color)';
            btn.style.background = (q.userAnswer !== undefined && q.userAnswer !== '') ? 'var(--primary-color)' : 'var(--surface-color)';
            btn.style.color = (q.userAnswer !== undefined && q.userAnswer !== '') ? 'white' : 'var(--text-main)';
            btn.style.fontWeight = '600';
            btn.style.cursor = 'pointer';
            btn.innerText = index + 1;
            
            if (index === currentQuizIndex) {
                btn.style.border = '2px solid var(--danger)';
                btn.style.transform = 'scale(1.1)';
            }
            
            btn.addEventListener('click', () => {
                if (quizIsRecording) stopQuizRecording();
                currentQuizIndex = index;
                showQuizQuestion();
            });
            
            palette.appendChild(btn);
        });
    }

    function showQuizQuestion() {
        const qNum = currentQuizIndex + 1;
        document.getElementById('quiz-current-num').innerText = qNum;
        const totalNumEl = document.getElementById('quiz-total-num');
        if (totalNumEl) totalNumEl.innerText = currentQuizLength;
        document.getElementById('quiz-progress-fill').style.width = `${(qNum / currentQuizLength) * 100}%`;

        renderQuizPalette();

        const q = quizQuestions[currentQuizIndex];
        
        // Reset UI
        document.getElementById('quiz-vocab-area').classList.add('hidden');
        document.getElementById('quiz-sentence-area').classList.add('hidden');
        document.getElementById('quiz-speaking-area').classList.add('hidden');
        document.getElementById('quiz-question-text').innerText = '';
        document.getElementById('quiz-question-audio').classList.add('hidden');

        if (q.qType === 'reading' || q.qType === 'listening') {
            document.getElementById('quiz-vocab-area').classList.remove('hidden');
            const optionsContainer = document.getElementById('quiz-options');
            optionsContainer.innerHTML = '';
            
            if (q.qType === 'reading') {
                document.getElementById('quiz-question-text').innerText = q.hanzi;
            } else {
                document.getElementById('quiz-question-audio').classList.remove('hidden');
                // Automatically play audio for listening questions
                speak(q.hanzi);
            }

            // Ensure options are constant for this question
            if (!q.options) {
                const options = [q];
                while (options.length < 4 && options.length < currentVocabulary.length) {
                    const randomOption = currentVocabulary[Math.floor(Math.random() * currentVocabulary.length)];
                    if (!options.find(opt => opt.id === randomOption.id)) {
                        options.push(randomOption);
                    }
                }
                options.sort(() => Math.random() - 0.5);
                q.options = options;
            }

            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt.vi;
                if (q.userAnswer === opt.id) {
                    btn.style.borderColor = 'var(--primary-color)';
                    btn.style.background = 'rgba(79, 70, 229, 0.1)';
                }
                btn.addEventListener('click', () => handleQuizVocabAnswer(btn, opt.id));
                optionsContainer.appendChild(btn);
            });
            
        } else if (q.qType === 'speaking') {
            document.getElementById('quiz-speaking-area').classList.remove('hidden');
            document.getElementById('quiz-speaking-text').innerText = q.hanzi;
            
            const feedbackEl = document.getElementById('quiz-speaking-feedback');
            if (q.userAnswer) {
                feedbackEl.innerText = `Đã thu âm: ${q.userAnswer}`;
                feedbackEl.style.color = 'var(--primary-color)';
            } else {
                feedbackEl.innerText = '';
            }
            if (quizIsRecording) stopQuizRecording();
            
        } else if (q.qType === 'writing') {
            document.getElementById('quiz-sentence-area').classList.remove('hidden');
            document.getElementById('quiz-check-btn').classList.remove('hidden');
            
            if (!q.writeMode) {
                q.writeMode = Math.random() > 0.5 ? 'sort' : 'translate';
            }
            currentQuizSentenceMode = q.writeMode;
            
            const modeTitle = document.getElementById('quiz-sentence-mode-title');
            const questionEl = document.getElementById('quiz-sentence-question');
            const sortArea = document.getElementById('quiz-sentence-sorting-area');
            const transArea = document.getElementById('quiz-sentence-translation-area');
            
            document.getElementById('quiz-sentence-feedback').innerText = '';
            document.getElementById('quiz-sentence-feedback').className = 'feedback-msg';
            
            if (currentQuizSentenceMode === 'sort') {
                modeTitle.innerText = "Sắp xếp câu";
                questionEl.innerText = q.vietnamese;
                sortArea.classList.remove('hidden');
                transArea.classList.add('hidden');
                setupQuizSorting(q);
            } else {
                modeTitle.innerText = "Dịch thuật";
                questionEl.innerText = q.vietnamese;
                sortArea.classList.add('hidden');
                transArea.classList.remove('hidden');
                
                const inputEl = document.getElementById('quiz-translation-input');
                inputEl.value = q.userAnswer || '';
                inputEl.disabled = false;
                setTimeout(() => inputEl.focus(), 100);
            }
        }
    }

    document.getElementById('quiz-translation-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('quiz-check-btn').click();
        }
    });

    function setupQuizSorting(q) {
        const dropZone = document.getElementById('quiz-word-drop-zone');
        const wordOptions = document.getElementById('quiz-word-options');
        dropZone.innerHTML = '';
        wordOptions.innerHTML = '';
        
        quizSelectedWords = q.userAnswer ? q.userAnswer.split('').map(w => ({ word: w, index: -1 })) : [];
        
        // Setup options
        const shuffledWords = [...q.words].sort(() => 0.5 - Math.random());
        shuffledWords.forEach((word, index) => {
            const wordEl = document.createElement('div');
            wordEl.className = 'word-block';
            wordEl.innerText = word;
            wordEl.dataset.index = index;
            
            wordEl.addEventListener('click', () => {
                if (!wordEl.classList.contains('hidden-word')) {
                    wordEl.classList.add('hidden-word');
                    quizSelectedWords.push({ word, index });
                    renderQuizDropZone();
                }
            });
            wordOptions.appendChild(wordEl);
        });
        
        renderQuizDropZone();
    }

    function renderQuizDropZone() {
        const dropZone = document.getElementById('quiz-word-drop-zone');
        const wordOptions = document.getElementById('quiz-word-options');
        dropZone.innerHTML = '';
        quizSelectedWords.forEach((item, arrIndex) => {
            const wordEl = document.createElement('div');
            wordEl.className = 'word-block';
            wordEl.innerText = item.word;
            
            wordEl.addEventListener('click', () => {
                quizSelectedWords.splice(arrIndex, 1);
                if (item.index !== -1) {
                    const optionEl = wordOptions.querySelector(`[data-index="${item.index}"]`);
                    if (optionEl) optionEl.classList.remove('hidden-word');
                }
                renderQuizDropZone();
            });
            dropZone.appendChild(wordEl);
        });
    }

    document.getElementById('quiz-check-btn').addEventListener('click', () => {
        const q = quizQuestions[currentQuizIndex];
        const transInput = document.getElementById('quiz-translation-input');
        
        if (currentQuizSentenceMode === 'sort') {
            const userSentence = quizSelectedWords.map(i => i.word).join('');
            q.userAnswer = userSentence;
        } else if (currentQuizSentenceMode === 'translate') {
            q.userAnswer = transInput.value.trim();
        }
        
        renderQuizPalette();
        const feedback = document.getElementById('quiz-sentence-feedback');
        feedback.innerText = "Đã lưu đáp án!";
        feedback.className = 'feedback-msg success';
        
        setTimeout(() => moveNextQuizQuestion(), 800);
    });

    function handleQuizVocabAnswer(btn, selectedId) {
        const q = quizQuestions[currentQuizIndex];
        q.userAnswer = selectedId;
        
        const allBtns = document.querySelectorAll('#quiz-options .option-btn');
        allBtns.forEach(b => {
            b.style.borderColor = 'var(--border-color)';
            b.style.background = 'white';
        });
        btn.style.borderColor = 'var(--primary-color)';
        btn.style.background = 'rgba(79, 70, 229, 0.1)';
        
        renderQuizPalette();
        setTimeout(() => moveNextQuizQuestion(), 300);
    }

    function moveNextQuizQuestion() {
        if (currentQuizIndex < currentQuizLength - 1) {
            currentQuizIndex++;
            showQuizQuestion();
        }
    }

    // --- Quiz Navigation Buttons ---
    document.getElementById('quiz-prev-btn')?.addEventListener('click', () => {
        if (quizIsRecording) stopQuizRecording();
        if (currentQuizIndex > 0) {
            currentQuizIndex--;
            showQuizQuestion();
        }
    });

    document.getElementById('quiz-next-btn')?.addEventListener('click', () => {
        if (quizIsRecording) stopQuizRecording();
        moveNextQuizQuestion();
    });

    document.getElementById('quiz-submit-exam-btn')?.addEventListener('click', () => {
        if (quizIsRecording) stopQuizRecording();
        if (confirm("Bạn có chắc chắn muốn nộp bài? Những câu chưa làm sẽ không có điểm.")) {
            finishQuiz(false);
        }
    });

    function finishQuiz(isTimeout = false) {
        clearInterval(quizTimer);
        quizActive.classList.add('hidden');
        quizResult.classList.remove('hidden');
        
        if (isTimeout) {
            document.getElementById('quiz-timeout-msg').classList.remove('hidden');
        } else {
            document.getElementById('quiz-timeout-msg').classList.add('hidden');
        }
        
        quizScore = 0;
        const normalize = (str) => str.replace(/[.,!?，。！？；：'"、\s]/g, '').toLowerCase();
        
        quizQuestions.forEach(q => {
            q.isCorrect = false;
            if (!q.userAnswer) return;
            
            if (q.qType === 'reading' || q.qType === 'listening') {
                if (q.userAnswer === q.id) {
                    quizScore++;
                    q.isCorrect = true;
                }
            } else if (q.qType === 'writing') {
                const normAns = normalize(q.userAnswer);
                const normCorrect = normalize(q.chinese);
                if (normAns === normCorrect) {
                    quizScore++;
                    q.isCorrect = true;
                }
            } else if (q.qType === 'speaking') {
                const normAns = normalize(q.userAnswer);
                const normCorrect = normalize(q.hanzi);
                if (normAns === normCorrect || normAns.includes(normCorrect)) {
                    quizScore++;
                    q.isCorrect = true;
                }
            }
        });
        
        const percentage = Math.round((quizScore / currentQuizLength) * 100);
        document.getElementById('quiz-final-score').innerText = `${percentage}%`;
        document.getElementById('quiz-result-msg').innerText = `Bạn đã trả lời đúng ${quizScore}/${currentQuizLength} câu.`;
        
        const titleEl = document.getElementById('quiz-result-title');
        if(percentage >= 80) {
            titleEl.innerText = "Xuất Sắc! 🎉";
            titleEl.style.color = "var(--success)";
        } else if(percentage >= 60) {
            titleEl.innerText = "Khá Tốt! 👍";
            titleEl.style.color = "var(--primary-color)";
        } else {
            titleEl.innerText = "Cố gắng lên! 💪";
            titleEl.style.color = "var(--danger)";
        }
        
        renderQuizReview();
    }
    
    function renderQuizReview() {
        const container = document.getElementById('quiz-detailed-results');
        if (!container) return;
        container.innerHTML = '';
        
        const filterWrong = document.getElementById('quiz-filter-wrong').checked;
        
        quizQuestions.forEach((q, index) => {
            if (filterWrong && q.isCorrect) return;
            
            const card = document.createElement('div');
            card.style.background = 'var(--surface-color)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = '12px';
            card.style.padding = '1.5rem';
            
            let qTypeStr = '';
            let questionContent = '';
            let correctAnsStr = '';
            let userAnsStr = q.userAnswer ? `<b style="color: var(--text-main);">${q.userAnswer}</b>` : '<b style="color:var(--text-muted)">Không trả lời</b>';
            let reasonStr = '';
            let grammarStr = '';

            if (q.qType === 'reading') {
                qTypeStr = 'Đọc hiểu';
                questionContent = `<div style="font-size: 1.5rem; color: var(--primary-color);">${q.hanzi}</div>`;
                correctAnsStr = `${q.hanzi} (${q.pinyin}) - ${q.vi}`;
                
                if (q.userAnswer && q.options) {
                    const chosen = q.options.find(opt => opt.id === q.userAnswer);
                    if (chosen) {
                        userAnsStr = `<b style="color: var(--text-main);">${chosen.hanzi} (${chosen.pinyin}) - ${chosen.vi}</b>`;
                        reasonStr = `Từ bạn chọn có nghĩa là "${chosen.vi}", nhưng đáp án đúng phải là "${q.vi}".`;
                    }
                } else if (!q.userAnswer) {
                    reasonStr = "Bạn chưa chọn đáp án nào.";
                }
                grammarStr = q.example ? `<b>Ví dụ:</b> ${q.example}` : '';
            } else if (q.qType === 'listening') {
                qTypeStr = 'Nghe hiểu';
                questionContent = `<div style="font-size: 1.2rem; color: var(--primary-color);"><i class="ri-volume-up-fill"></i> ${q.hanzi}</div>`;
                correctAnsStr = `${q.hanzi} (${q.pinyin}) - ${q.vi}`;
                
                if (q.userAnswer && q.options) {
                    const chosen = q.options.find(opt => opt.id === q.userAnswer);
                    if (chosen) {
                        userAnsStr = `<b style="color: var(--text-main);">${chosen.hanzi} (${chosen.pinyin}) - ${chosen.vi}</b>`;
                        reasonStr = `Âm thanh phát ra là từ "${q.hanzi} (${q.pinyin})", nhưng bạn lại chọn từ "${chosen.hanzi} (${chosen.pinyin})".`;
                    }
                } else if (!q.userAnswer) {
                    reasonStr = "Bạn chưa chọn đáp án nào.";
                }
                grammarStr = q.example ? `<b>Ví dụ:</b> ${q.example}` : '';
            } else if (q.qType === 'speaking') {
                qTypeStr = 'Nói';
                questionContent = `<div style="font-size: 1.5rem; color: var(--primary-color);">${q.hanzi}</div>`;
                correctAnsStr = `${q.hanzi} (${q.pinyin}) - ${q.vi}`;
                if (!q.userAnswer) {
                    reasonStr = "Bạn chưa thu âm hoặc hệ thống không nhận diện được giọng nói.";
                } else {
                    reasonStr = "Phát âm của bạn chưa khớp hoàn toàn với chữ Hán hoặc Pinyin chuẩn.";
                }
                grammarStr = q.example ? `<b>Ví dụ:</b> ${q.example}` : '';
            } else if (q.qType === 'writing') {
                qTypeStr = 'Viết / Sắp xếp câu';
                questionContent = `<div style="font-size: 1.2rem; color: var(--text-main);">${q.vietnamese}</div>`;
                correctAnsStr = `${q.chinese} (${q.pinyin})`;
                if (!q.userAnswer) {
                    reasonStr = "Bạn chưa hoàn thành câu này.";
                } else {
                    reasonStr = "Bạn sắp xếp sai trật tự từ hoặc dịch chưa chính xác.";
                }
                grammarStr = getGrammarExplanation(q.chinese);
            }
            
            const statusIcon = q.isCorrect 
                ? '<span style="color: var(--success); font-weight: 600;"><i class="ri-checkbox-circle-fill"></i> Đúng</span>'
                : '<span style="color: var(--danger); font-weight: 600;"><i class="ri-close-circle-fill"></i> Sai / Bỏ trống</span>';
            
            let html = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.5rem;">
                    <span style="font-weight: 600; color: var(--text-muted);">Câu ${index + 1} &bull; ${qTypeStr}</span>
                    ${statusIcon}
                </div>
                <div style="margin-bottom: 1rem;">${questionContent}</div>
                <div style="margin-bottom: 0.5rem; color: var(--text-muted);">Bạn chọn/nhập: ${userAnsStr}</div>
            `;
            
            if (!q.isCorrect) {
                html += `
                    <div style="color: var(--danger); background: rgba(239, 68, 68, 0.05); padding: 0.75rem 1rem; border-radius: 8px; margin-top: 0.5rem; font-size: 0.95rem; line-height: 1.5;">
                        <span style="display:block; margin-bottom: 0.25rem;"><b style="color: var(--danger);">Lý do sai:</b> <span style="color: var(--text-main);">${reasonStr}</span></span>
                    </div>
                `;
            }
            
            html += `
                <div style="color: var(--success); background: rgba(34, 197, 94, 0.1); padding: 0.75rem 1rem; border-radius: 8px; margin-top: 0.5rem; font-size: 0.95rem; line-height: 1.5;">
                    <span style="display:block; margin-bottom: 0.25rem;"><b>Đáp án chuẩn:</b> <span style="color: var(--text-main);">${correctAnsStr}</span></span>
                    ${grammarStr ? `<span style="display:block; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed rgba(34, 197, 94, 0.3);"><b>Giải thích:</b> <span style="color: var(--text-main);">${grammarStr}</span></span>` : ''}
                </div>
            `;
            
            card.innerHTML = html;
            container.appendChild(card);
        });
    }

    document.getElementById('quiz-filter-wrong')?.addEventListener('change', renderQuizReview);
    
    // --- Quiz Audio Listener ---
    document.getElementById('quiz-question-audio').addEventListener('click', () => {
        const q = quizQuestions[currentQuizIndex];
        if (q && q.qType === 'listening') {
            speak(q.hanzi);
        }
    });

    // --- Quiz Speaking Recognition ---
    let quizRecognition = null;
    let quizIsRecording = false;
    let quizAccumulatedTranscript = "";

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        quizRecognition = new SpeechRecognition();
        quizRecognition.lang = 'zh-CN';
        quizRecognition.continuous = true;
        quizRecognition.interimResults = false;
        
        quizRecognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            quizAccumulatedTranscript += transcript;
            processQuizSpeechResult(quizAccumulatedTranscript);
        };
        
        quizRecognition.onerror = (event) => {
            stopQuizRecording();
            const feedbackEl = document.getElementById('quiz-speaking-feedback');
            feedbackEl.innerText = "Lỗi thu âm. Bạn có thể thử lại.";
            feedbackEl.style.color = "var(--danger)";
        };
        
        quizRecognition.onend = () => {
            if (quizIsRecording) stopQuizRecording();
        };
    }

    function startQuizRecording() {
        if (!quizRecognition) {
            alert('Trình duyệt không hỗ trợ nhận diện giọng nói.');
            return;
        }
        quizIsRecording = true;
        quizAccumulatedTranscript = "";
        const btn = document.getElementById('quiz-record-btn');
        btn.innerHTML = '<i class="ri-stop-circle-line"></i> Dừng thu âm';
        btn.style.background = 'var(--danger)';
        btn.style.color = 'white';
        
        const feedbackEl = document.getElementById('quiz-speaking-feedback');
        feedbackEl.innerText = "Đang nghe...";
        feedbackEl.style.color = "var(--primary-color)";
        
        try {
            quizRecognition.start();
        } catch(e) {}
    }

    function stopQuizRecording() {
        quizIsRecording = false;
        const btn = document.getElementById('quiz-record-btn');
        btn.innerHTML = '<i class="ri-mic-line"></i> Bắt đầu thu âm';
        btn.style.background = 'rgba(239, 68, 68, 0.1)';
        btn.style.color = 'var(--danger)';
        
        if (quizRecognition) {
            try {
                quizRecognition.stop();
            } catch(e) {}
        }
    }

    function processQuizSpeechResult(transcript) {
        if (!transcript) return;
        
        const q = quizQuestions[currentQuizIndex];
        q.userAnswer = transcript; // Save answer
        
        const feedbackEl = document.getElementById('quiz-speaking-feedback');
        feedbackEl.innerText = `Đã thu âm: ${transcript}`;
        feedbackEl.style.color = 'var(--primary-color)';
        
        renderQuizPalette();
        stopQuizRecording();
        
        setTimeout(() => moveNextQuizQuestion(), 800);
    }

    document.getElementById('quiz-record-btn').addEventListener('click', () => {
        if (quizIsRecording) stopQuizRecording();
        else startQuizRecording();
    });

    // === 5. SENTENCE TAB ===
    let currentSentenceData = null;
    let currentSentenceMode = 'sort'; // 'sort' or 'translate'
    let selectedWords = [];

    const sentenceModeTitle = document.getElementById('sentence-mode-title');
    const sentenceQuestion = document.getElementById('sentence-question');
    const sortingArea = document.getElementById('sentence-sorting-area');
    const dropZone = document.getElementById('word-drop-zone');
    const wordOptions = document.getElementById('word-options');
    const translationArea = document.getElementById('sentence-translation-area');
    const translationInput = document.getElementById('translation-input');
    const translationFeedback = document.getElementById('translation-feedback');

    function initSentencePractice() {
        if (!currentSentences || currentSentences.length === 0) {
            sentenceQuestion.innerText = "Chưa có dữ liệu câu cho cấp độ này.";
            sortingArea.classList.add('hidden');
            translationArea.classList.add('hidden');
            return;
        }
        nextSentence();
    }

    function nextSentence() {
        document.getElementById('check-sentence-btn').classList.remove('hidden');
        document.getElementById('next-sentence-btn').classList.add('hidden');
        document.getElementById('sentence-grammar-analysis').classList.add('hidden');
        translationFeedback.innerText = '';
        translationFeedback.className = 'feedback-msg';
        translationInput.value = '';
        translationInput.classList.remove('hidden'); // Ensure it's not hidden from previous sort mode
        selectedWords = [];
        dropZone.innerHTML = '';

        // Pick random sentence
        const rIndex = Math.floor(Math.random() * currentSentences.length);
        currentSentenceData = currentSentences[rIndex];

        // Random mode 50/50
        currentSentenceMode = Math.random() > 0.5 ? 'sort' : 'translate';

        if (currentSentenceMode === 'sort') {
            setupSortMode();
        } else {
            setupTranslateMode();
        }
    }

    function setupSortMode() {
        sentenceModeTitle.innerText = "Chế độ: Sắp xếp câu";
        sentenceQuestion.innerText = currentSentenceData.vietnamese;
        sortingArea.classList.remove('hidden');
        translationArea.classList.add('hidden');
        
        // Shuffle words
        const shuffledWords = [...currentSentenceData.words].sort(() => 0.5 - Math.random());
        wordOptions.innerHTML = '';
        
        shuffledWords.forEach((word, index) => {
            const wordEl = document.createElement('div');
            wordEl.className = 'word-block';
            wordEl.innerText = word;
            wordEl.dataset.index = index;
            
            wordEl.addEventListener('click', () => {
                if (!wordEl.classList.contains('hidden-word')) {
                    // Move to drop zone
                    wordEl.classList.add('hidden-word');
                    selectedWords.push({ word, index });
                    renderDropZone();
                }
            });
            
            wordOptions.appendChild(wordEl);
        });
    }

    function renderDropZone() {
        dropZone.innerHTML = '';
        selectedWords.forEach((item, arrIndex) => {
            const wordEl = document.createElement('div');
            wordEl.className = 'word-block';
            wordEl.innerText = item.word;
            
            wordEl.addEventListener('click', () => {
                // Remove from drop zone
                selectedWords.splice(arrIndex, 1);
                // Unhide in options
                const optionEl = wordOptions.querySelector(`[data-index="${item.index}"]`);
                if (optionEl) optionEl.classList.remove('hidden-word');
                renderDropZone();
            });
            
            dropZone.appendChild(wordEl);
        });
    }

    function setupTranslateMode() {
        sortingArea.classList.add('hidden');
        translationArea.classList.remove('hidden');
        
        // 50/50 vi->zh or zh->vi
        if (Math.random() > 0.5) {
            currentSentenceMode = 'translate_vi_zh';
            sentenceModeTitle.innerText = "Chế độ: Dịch sang Tiếng Trung";
            sentenceQuestion.innerText = currentSentenceData.vietnamese;
            translationInput.placeholder = "Nhập chữ Hán hoặc Pinyin...";
        } else {
            currentSentenceMode = 'translate_zh_vi';
            sentenceModeTitle.innerText = "Chế độ: Dịch sang Tiếng Việt";
            sentenceQuestion.innerText = currentSentenceData.chinese;
            translationInput.placeholder = "Nhập nghĩa tiếng Việt...";
        }
    }

    function checkSentence() {
        let isCorrect = false;
        let correctAnswer = "";

        if (currentSentenceMode === 'sort') {
            const userSentence = selectedWords.map(i => i.word).join('');
            correctAnswer = currentSentenceData.chinese;
            
            // Remove punctuation and spaces for comparison
            const normalize = (str) => str.replace(/[.,!?，。！？；：'"、\s]/g, '');
            isCorrect = (normalize(userSentence) === normalize(correctAnswer));
        } else if (currentSentenceMode === 'translate_vi_zh') {
            const userInput = translationInput.value;
            
            // Helper to remove tones, spaces, and punctuation
            const normalizePinyin = (str) => {
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents/tones
                          .toLowerCase()
                          .replace(/[.,!?，。！？；：'"、\s]/g, ''); // Remove punctuation and spaces
            };
            
            const pinyinNormalized = normalizePinyin(currentSentenceData.pinyin);
            const inputNormalized = normalizePinyin(userInput);
            
            // Also check against pure Chinese characters (ignoring punctuation)
            const chineseNormalized = currentSentenceData.chinese.replace(/[.,!?，。！？；：'"、\s]/g, '');
            
            correctAnswer = `${currentSentenceData.chinese} (${currentSentenceData.pinyin})`;
            isCorrect = (inputNormalized === chineseNormalized || inputNormalized === pinyinNormalized);
        } else if (currentSentenceMode === 'translate_zh_vi') {
            const userInput = translationInput.value;
            correctAnswer = currentSentenceData.vietnamese;
            
            // Normalize strings for comparison (remove punctuation and spaces)
            const normalize = (str) => str.toLowerCase().replace(/[.,!?，。！？；：'"、\s]/g, '');
            const inputNormalized = normalize(userInput);
            
            // Allow matching any part separated by '/'
            const possibleAnswers = correctAnswer.split('/').map(ans => normalize(ans));
            isCorrect = possibleAnswers.includes(inputNormalized);
        }

        let feedbackHTML = isCorrect 
            ? `<div style="font-weight:bold; margin-bottom: 0.5rem;">Chính xác! 🎉</div>`
            : `<div style="font-weight:bold; margin-bottom: 0.5rem;">Sai rồi. Đáp án đúng là: <span style="color:var(--primary-color);">${correctAnswer}</span></div>`;
        
        feedbackHTML += `
            <div style="font-size: 1.1rem; color: var(--primary-color); margin-top: 0.5rem;">${currentSentenceData.pinyin}</div>
            <div style="font-size: 0.95rem; color: var(--text-main); margin-top: 0.25rem;">${currentSentenceData.vietnamese}</div>
        `;

        translationFeedback.innerHTML = feedbackHTML;
        translationFeedback.className = isCorrect ? 'feedback-msg success' : 'feedback-msg error';

        // Show feedback in sorting mode too by hijacking the element
        if (currentSentenceMode === 'sort') {
            translationArea.classList.remove('hidden');
            translationInput.classList.add('hidden'); // Hide input
        } else {
            translationInput.classList.remove('hidden');
        }

        document.getElementById('check-sentence-btn').classList.add('hidden');
        document.getElementById('next-sentence-btn').classList.remove('hidden');
        
        // --- Grammar Analysis ---
        const analysisArea = document.getElementById('sentence-grammar-analysis');
        const analysisContent = document.getElementById('grammar-analysis-content');
        analysisArea.classList.remove('hidden');
        
        analysisContent.innerHTML = getGrammarExplanation(currentSentenceData.chinese);
    }

    function getGrammarExplanation(sentence) {
        const rules = [
            { match: "是因为", explanation: "<b>Cấu trúc nguyên nhân - kết quả:</b> ...是因为... (sở dĩ... là bởi vì...)." },
            { match: "为什么", explanation: "<b>Đại từ nghi vấn 为什么 (wèishénme):</b> Hỏi về nguyên nhân (Tại sao)." },
            { match: "因为", explanation: "<b>Cấu trúc nguyên nhân:</b> 因为 (yīnwèi - bởi vì)... 所以 (suǒyǐ - cho nên)..." },
            { match: "所以", explanation: "<b>Cấu trúc kết quả:</b> 因为 (yīnwèi - bởi vì)... 所以 (suǒyǐ - cho nên)..." },
            { match: "虽然", explanation: "<b>Cấu trúc nhượng bộ:</b> 虽然 (suīrán - mặc dù)... 但是 (dànshì - nhưng)..." },
            { match: "但是", explanation: "<b>Cấu trúc chuyển ý:</b> 但是 (dànshì - nhưng / tuy nhiên)..." },
            { match: "不但", explanation: "<b>Cấu trúc tăng tiến:</b> 不但 (búdàn - không những)... 而且 (érqiě - mà còn)..." },
            { match: "而且", explanation: "<b>Cấu trúc tăng tiến:</b> ...而且 (érqiě - mà còn)..." },
            { match: "如果", explanation: "<b>Cấu trúc giả thiết:</b> 如果 (rúguǒ - nếu như)... 就 (jiù - thì)..." },
            { match: "越来越", explanation: "<b>Cấu trúc:</b> 越来越... (yuè lái yuè...): Ngày càng..." },
            { match: "正在", explanation: "<b>Phó từ 正在 (zhèngzài):</b> Nhấn mạnh hành động đang diễn ra (Đang...)." },
            { match: "在", regex: /在.*呢/, explanation: "<b>Cấu trúc đang tiếp diễn:</b> 在...呢 (zài...ne) biểu thị hành động đang xảy ra." },
            { match: "在", explanation: "<b>Giới từ 在 (zài):</b> Dùng trước danh từ để chỉ địa điểm (Ở / Tại...)." },
            { match: "是", regex: /是.*的/, explanation: "<b>Cấu trúc 是...的 (shì...de):</b> Dùng để nhấn mạnh thời gian, địa điểm, mục đích, phương thức." },
            { match: "的", explanation: "<b>Trợ từ kết cấu 的 (de):</b> Đứng giữa định ngữ và trung tâm ngữ (N1 + 的 + N2). Nghĩa là 'Của' hoặc dùng để mô tả." },
            { match: "比", explanation: "<b>Cấu trúc so sánh:</b> A + 比 (bǐ) + B + Tính từ (A hơn B...)." },
            { match: "把", explanation: "<b>Câu chữ 把 (bǎ):</b> S + 把 + O + Động từ + Thành phần khác. Dùng để nhấn mạnh sự tác động đối với tân ngữ." },
            { match: "被", explanation: "<b>Câu bị động với 被 (bèi):</b> O + 被 + S + Động từ + Thành phần khác. Chủ ngữ là đối tượng tiếp nhận hành động." },
            { match: "会", explanation: "<b>Động từ năng nguyện 会 (huì):</b> Chỉ khả năng (biết làm gì nhờ học tập) hoặc khả năng xảy ra trong tương lai (sẽ)." },
            { match: "能", explanation: "<b>Động từ năng nguyện 能 (néng):</b> Chỉ khả năng, năng lực hiện tại có thể làm được việc gì đó." },
            { match: "可以", explanation: "<b>Động từ năng nguyện 可以 (kěyǐ):</b> Chỉ sự cho phép (Có thể / Được phép)." },
            { match: "过", explanation: "<b>Trợ từ động thái 过 (guo):</b> Đứng sau động từ để diễn tả một trải nghiệm trong quá khứ (Đã từng...)." },
            { match: "着", explanation: "<b>Trợ từ động thái 着 (zhe):</b> Đứng sau động từ để diễn tả trạng thái đang tiếp diễn của hành động." },
            { match: "得", explanation: "<b>Bổ ngữ trạng thái 得 (de):</b> Động từ + 得 + Tính từ. Dùng để đánh giá mức độ của hành động." },
            { match: "就", explanation: "<b>Phó từ 就 (jiù):</b> Biểu thị hành động xảy ra sớm, nhanh, hoặc kết luận (Liền / Thì / Bèn)." },
            { match: "才", explanation: "<b>Phó từ 才 (cái):</b> Biểu thị hành động xảy ra muộn, chậm hoặc khó khăn mới đạt được (Mới)." },
            { match: "给", explanation: "<b>Giới từ 给 (gěi):</b> Cho, làm gì đó cho ai (A 给 B + Động từ)." },
            { match: "向", explanation: "<b>Giới từ 向 (xiàng):</b> Hướng về, về phía (hướng của hành động)." },
            { match: "从", explanation: "<b>Giới từ 从 (cóng):</b> Từ (chỉ điểm xuất phát về thời gian, địa điểm)." },
            { match: "离", explanation: "<b>Giới từ 离 (lí):</b> Cách (dùng để nói về khoảng cách giữa 2 địa điểm hoặc thời gian)." },
            { match: "多", regex: /多(少|大|长)/, explanation: "<b>Đại từ nghi vấn 多 (duō):</b> Đứng trước tính từ để hỏi về mức độ (Bao nhiêu / Bao lâu...)." },
            { match: "怎么", explanation: "<b>Đại từ nghi vấn 怎么 (zěnme):</b> Hỏi về phương thức hoặc nguyên nhân (Thế nào / Làm sao)." },
            { match: "什么", explanation: "<b>Đại từ nghi vấn 什么 (shénme):</b> Hỏi về sự vật, sự việc (Cái gì)." },
            { match: "吗", explanation: "<b>Trợ từ nghi vấn 吗 (ma):</b> Đứng cuối câu để tạo câu hỏi Có/Không." },
            { match: "呢", explanation: "<b>Trợ từ nghi vấn 呢 (ne):</b> Đứng cuối câu để hỏi ngược lại hoặc nhấn mạnh trạng thái." },
            { match: "吧", explanation: "<b>Trợ từ ngữ khí 吧 (ba):</b> Đứng cuối câu để rủ rê, đề nghị hoặc suy đoán." },
            { match: "了", explanation: "<b>Trợ từ động thái 了 (le):</b> Đứng cuối câu hoặc sau động từ biểu thị hành động đã hoàn thành." },
            { match: "都", explanation: "<b>Phó từ 都 (dōu):</b> Biểu thị phạm vi toàn bộ (Đều / Tất cả)." },
            { match: "也", explanation: "<b>Phó từ 也 (yě):</b> Biểu thị sự tương đồng (Cũng)." },
            { match: "很", explanation: "<b>Phó từ chỉ mức độ 很 (hěn):</b> Đứng trước tính từ (Rất)." },
            { match: "最", explanation: "<b>Phó từ chỉ mức độ 最 (zuì):</b> Biểu thị mức độ cao nhất (Nhất)." },
            { match: "真", explanation: "<b>Phó từ chỉ mức độ 真 (zhēn):</b> Biểu thị cảm xúc, cảm thán (Thật là / Quả thật)." },
            { match: "太", regex: /太.*了/, explanation: "<b>Phó từ chỉ mức độ 太...了 (tài...le):</b> Biểu thị mức độ cao (Quá / Lắm)." }
        ];

        let explanation = "";
        for (let rule of rules) {
            if (rule.regex) {
                if (rule.regex.test(sentence)) {
                    explanation += rule.explanation + "<br><br>";
                }
            } else {
                if (sentence.includes(rule.match)) {
                    explanation += rule.explanation + "<br><br>";
                }
            }
        }
        
        if (!explanation) {
            if (sentence.includes('?') || sentence.includes('？')) {
                explanation = "<b>Cấu trúc câu hỏi cơ bản:</b> Sử dụng từ để hỏi hoặc trợ từ nghi vấn, giữ nguyên trật tự câu.";
            } else {
                explanation = "<b>Cấu trúc câu trần thuật cơ bản:</b> Chủ ngữ + (Trạng ngữ) + Vị ngữ + (Tân ngữ).";
            }
        } else {
            // Remove the last <br><br>
            explanation = explanation.substring(0, explanation.length - 8);
        }
        
        return explanation;
    }

    document.getElementById('check-sentence-btn').addEventListener('click', checkSentence);
    document.getElementById('next-sentence-btn').addEventListener('click', nextSentence);
    
    // Press Enter to check
    translationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkSentence();
        }
    });

    // === 6. LISTENING TAB ===
    let listeningScore = 0;
    let currentListeningQuestion = null;

    function initListening() {
        listeningScore = 0;
        document.getElementById('listening-score').innerText = listeningScore;
        nextListeningQuestion();
    }

    const imageListeningData = [
        {
            id: 'img1',
            sentence: "我有一只非常可爱的小黑猫，它喜欢吃鱼。",
            pinyin: "Wǒ yǒu yī zhī fēicháng kě'ài de xiǎo hēi māo, tā xǐhuān chī yú.",
            vi: "Tôi có một con mèo đen nhỏ rất đáng yêu, nó thích ăn cá.",
            options: [
                { id: 'img1', text: "🐈" },
                { id: 'wrong1_1', text: "🐕" },
                { id: 'wrong1_2', text: "🐇" },
                { id: 'wrong1_3', text: "🐦" }
            ]
        },
        {
            id: 'img2',
            sentence: "今天天气不太好，下午可能会下雨，你记得带伞。",
            pinyin: "Jīntiān tiānqì bù tài hǎo, xiàwǔ kěnéng huì xiàyǔ, nǐ jìde dài sǎn.",
            vi: "Hôm nay thời tiết không tốt lắm, buổi chiều có thể trời mưa, bạn nhớ mang ô nhé.",
            options: [
                { id: 'wrong2_1', text: "☀️" },
                { id: 'img2', text: "🌧️" },
                { id: 'wrong2_2', text: "❄️" },
                { id: 'wrong2_3', text: "🌪️" }
            ]
        },
        {
            id: 'img3',
            sentence: "妈妈去超市买了很多水果，有苹果、香蕉和西瓜。",
            pinyin: "Māma qù chāoshì mǎi le hěn duō shuǐguǒ, yǒu píngguǒ, xiāngjiāo hé xīguā.",
            vi: "Mẹ đi siêu thị mua rất nhiều trái cây, có táo, chuối và dưa hấu.",
            options: [
                { id: 'img3', text: "🍎" },
                { id: 'wrong3_1', text: "🍔" },
                { id: 'wrong3_2', text: "🍜" },
                { id: 'wrong3_3', text: "☕" }
            ]
        },
        {
            id: 'img4',
            sentence: "我爸爸是一名医生，他在一家很大的医院工作。",
            pinyin: "Wǒ bàba shì yī míng yīshēng, tā zài yī jiā hěn dà de yīyuàn gōngzuò.",
            vi: "Bố tôi là một bác sĩ, ông ấy làm việc ở một bệnh viện rất lớn.",
            options: [
                { id: 'wrong4_1', text: "👨‍🏫" },
                { id: 'img4', text: "👨‍⚕️" },
                { id: 'wrong4_2', text: "👮‍♂️" },
                { id: 'wrong4_3', text: "👨‍🍳" }
            ]
        },
        {
            id: 'img5',
            sentence: "哥哥买了一辆新车，是红色的，非常漂亮。",
            pinyin: "Gēge mǎi le yī liàng xīn chē, shì hóngsè de, fēicháng piàoliang.",
            vi: "Anh trai đã mua một chiếc ô tô mới, màu đỏ, vô cùng đẹp.",
            options: [
                { id: 'wrong5_1', text: "🚲" },
                { id: 'wrong5_2', text: "🚢" },
                { id: 'img5', text: "🚗" },
                { id: 'wrong5_3', text: "✈️" }
            ]
        },
        {
            id: 'img6',
            sentence: "他在商店买了一件漂亮的衣服，明天穿去学校。",
            pinyin: "Tā zài shāngdiàn mǎi le yī jiàn piàoliang de yīfu, míngtiān chuān qù xuéxiào.",
            vi: "Anh ấy đã mua một bộ quần áo đẹp ở cửa hàng, ngày mai sẽ mặc đến trường.",
            options: [
                { id: 'img6', text: "👗" },
                { id: 'wrong6_1', text: "👟" },
                { id: 'wrong6_2', text: "👜" },
                { id: 'wrong6_3', text: "👒" }
            ]
        },
        {
            id: 'img7',
            sentence: "他每天早上都喝一杯热茶。",
            pinyin: "Tā měitiān zǎoshang dōu hē yī bēi rè chá.",
            vi: "Mỗi buổi sáng anh ấy đều uống một cốc trà nóng.",
            options: [
                { id: 'wrong7_1', text: "🍺" },
                { id: 'wrong7_2', text: "🥛" },
                { id: 'wrong7_3', text: "🧃" },
                { id: 'img7', text: "🍵" }
            ]
        },
        {
            id: 'img8',
            sentence: "昨天晚上我看了一个很长很有意思的电影。",
            pinyin: "Zuótiān wǎnshang wǒ kàn le yī gè hěn cháng hěn yǒu yìsi de diànyǐng.",
            vi: "Tối hôm qua tôi đã xem một bộ phim rất dài và thú vị.",
            options: [
                { id: 'wrong8_1', text: "📖" },
                { id: 'img8', text: "🎬" },
                { id: 'wrong8_2', text: "🎮" },
                { id: 'wrong8_3', text: "🎵" }
            ]
        }
    ];

    let isCurrentImageQuestion = false;

    function nextListeningQuestion() {
        document.getElementById('next-listening-btn').classList.add('hidden');
        document.getElementById('listening-result-display').classList.add('hidden');
        
        // Randomly pick a vocabulary word or an image sentence (50% chance)
        isCurrentImageQuestion = Math.random() < 0.5;

        const optionsContainer = document.getElementById('listening-options');
        optionsContainer.innerHTML = '';
        
        if (isCurrentImageQuestion) {
            optionsContainer.classList.add('image-grid');
            const qIndex = Math.floor(Math.random() * imageListeningData.length);
            const qData = imageListeningData[qIndex];
            currentListeningQuestion = { id: qData.id, hanzi: qData.sentence }; // Mock structure for audio playing
            
            // Shuffle options
            const shuffledOptions = [...qData.options].sort(() => Math.random() - 0.5);
            
            shuffledOptions.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn image-option';
                btn.style.fontSize = '3.5rem';
                btn.style.padding = '1rem';
                btn.style.display = 'flex';
                btn.style.justifyContent = 'center';
                btn.style.alignItems = 'center';
                btn.innerText = opt.text;
                btn.dataset.id = opt.id;
                btn.addEventListener('click', () => handleListeningAnswer(btn, opt.id, qData.id));
                optionsContainer.appendChild(btn);
            });
        } else {
            optionsContainer.classList.remove('image-grid');
            if (!currentVocabulary || currentVocabulary.length === 0) return;
            
            const qIndex = Math.floor(Math.random() * currentVocabulary.length);
            currentListeningQuestion = currentVocabulary[qIndex];
            
            // Generate options (Multiple Choice)
            const options = [currentListeningQuestion];
            while (options.length < 4) {
                const randomOption = currentVocabulary[Math.floor(Math.random() * currentVocabulary.length)];
                if (!options.find(opt => opt.id === randomOption.id)) {
                    options.push(randomOption);
                }
            }
            options.sort(() => Math.random() - 0.5);

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = `${opt.vi} (${opt.pinyin})`;
                btn.dataset.id = opt.id;
                btn.addEventListener('click', () => handleListeningAnswer(btn, opt.id, currentListeningQuestion.id));
                optionsContainer.appendChild(btn);
            });
        }

        // Auto play audio once
        setTimeout(() => speak(currentListeningQuestion.hanzi), 300);
    }

    function handleListeningAnswer(btn, selectedId, correctId) {
        const allBtns = document.querySelectorAll('#listening-options .option-btn');
        allBtns.forEach(b => b.style.pointerEvents = 'none');

        if (selectedId === correctId) {
            btn.classList.add('correct');
            listeningScore++;
            document.getElementById('listening-score').innerText = listeningScore;
        } else {
            btn.classList.add('wrong');
            allBtns.forEach(b => {
                if (b.dataset.id == currentListeningQuestion.id) {
                    b.classList.add('correct');
                }
            });
        }
        
        // Hiển thị kết quả đầy đủ
        const resultDisplay = document.getElementById('listening-result-display');
        resultDisplay.classList.remove('hidden');
        
        if (isCurrentImageQuestion) {
            const qData = imageListeningData.find(d => d.id === correctId);
            if (qData) {
                resultDisplay.innerHTML = `
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--primary-color); margin-bottom: 0.5rem;">${qData.sentence}</div>
                    <div style="color: var(--text-muted); margin-bottom: 0.5rem;">${qData.pinyin}</div>
                    <div style="font-weight: 500; color: var(--text-main);">${qData.vi}</div>
                `;
            }
        } else {
            resultDisplay.innerHTML = `
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--primary-color); margin-bottom: 0.5rem;">${currentListeningQuestion.hanzi}</div>
                <div style="color: var(--text-muted); margin-bottom: 0.5rem;">${currentListeningQuestion.pinyin}</div>
                <div style="font-weight: 500; color: var(--text-main);">${currentListeningQuestion.vi}</div>
                ${currentListeningQuestion.example ? `<div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 0.5rem;">Ví dụ: ${currentListeningQuestion.example}</div>` : ''}
            `;
        }
        
        document.getElementById('next-listening-btn').classList.remove('hidden');
    }

    document.getElementById('listening-question').addEventListener('click', () => {
        if (currentListeningQuestion) {
            speak(currentListeningQuestion.hanzi);
        }
    });

    document.getElementById('next-listening-btn').addEventListener('click', nextListeningQuestion);

    // === 7. READING TAB ===
    let currentReadingIndex = 0;
    let isPinyinVisible = true;

    function initReading() {
        if (!currentReading || currentReading.length === 0) {
            document.getElementById('reading-content').innerText = "Chưa có dữ liệu bài đọc cho cấp độ này.";
            document.getElementById('reading-title').innerText = "";
            return;
        }
        
        // Shuffle the reading array so passages appear in random order
        currentReading = [...currentReading].sort(() => Math.random() - 0.5);
        currentReadingIndex = 0;
        
        loadReadingPassage();
    }

    function loadReadingPassage() {
        const passage = currentReading[currentReadingIndex];
        document.getElementById('reading-title').innerText = passage.title || "Bài Đọc";
        document.getElementById('reading-translation').innerText = passage.vietnamese;
        document.getElementById('reading-translation').classList.add('hidden');
        document.getElementById('toggle-translation-btn').innerText = "Xem bản dịch";
        document.getElementById('reading-speech-feedback').classList.add('hidden');
        
        renderReadingText(passage);
    }

    function renderReadingText(passage) {
        const contentDiv = document.getElementById('reading-content');
        contentDiv.innerHTML = '';
        
        // We render Chinese and Pinyin (if visible)
        // A simple way to show them is just rendering both, but realistically we would need them character by character.
        // For simplicity, we just display the Chinese text block, and the Pinyin text block below it.
        const hanziBlock = document.createElement('div');
        hanziBlock.innerText = passage.chinese;
        
        const pinyinBlock = document.createElement('div');
        pinyinBlock.innerText = passage.pinyin;
        pinyinBlock.style.fontSize = "1.2rem";
        pinyinBlock.style.color = "var(--primary-color)";
        pinyinBlock.style.marginTop = "1rem";
        if (!isPinyinVisible) {
            pinyinBlock.classList.add('hidden');
        }
        pinyinBlock.id = "reading-pinyin-block";
        
        contentDiv.appendChild(hanziBlock);
        contentDiv.appendChild(pinyinBlock);
    }

    document.getElementById('toggle-pinyin-btn').addEventListener('click', (e) => {
        isPinyinVisible = !isPinyinVisible;
        e.target.innerText = isPinyinVisible ? "Tắt Pinyin" : "Bật Pinyin";
        const pinyinBlock = document.getElementById('reading-pinyin-block');
        if (pinyinBlock) {
            if (isPinyinVisible) pinyinBlock.classList.remove('hidden');
            else pinyinBlock.classList.add('hidden');
        }
    });

    document.getElementById('toggle-translation-btn').addEventListener('click', (e) => {
        const transDiv = document.getElementById('reading-translation');
        if (transDiv.classList.contains('hidden')) {
            transDiv.classList.remove('hidden');
            e.target.innerText = "Ẩn bản dịch";
        } else {
            transDiv.classList.add('hidden');
            e.target.innerText = "Xem bản dịch";
        }
    });

    document.getElementById('listen-reading-btn').addEventListener('click', () => {
        if (currentReading && currentReading[currentReadingIndex]) {
            speak(currentReading[currentReadingIndex].chinese);
        }
    });

    document.getElementById('next-reading-btn').addEventListener('click', () => {
        // Stop ongoing audio when switching passage
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        if (currentReading && currentReading.length > 0) {
            currentReadingIndex = (currentReadingIndex + 1) % currentReading.length;
            loadReadingPassage();
        }
    });

    // --- Speech Recognition ---
    let recognition = null;
    let isRecording = false;
    let accumulatedTranscript = "";

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = true;
        recognition.interimResults = false;
        
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            accumulatedTranscript += transcript;
            processSpeechResult(accumulatedTranscript);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            stopRecording();
            document.getElementById('speech-result-text').innerText = "Lỗi nhận diện: " + event.error;
            document.getElementById('speech-accuracy').innerText = "";
            document.getElementById('reading-speech-feedback').classList.remove('hidden');
        };
        
        recognition.onend = () => {
            // If it stops automatically due to pause but isRecording is true, we could restart it,
            // but standard behavior is to stop. Let's just update UI.
            if (isRecording) {
                stopRecording();
            }
        };
    }

    function startRecording() {
        if (!recognition) {
            alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.');
            return;
        }
        isRecording = true;
        accumulatedTranscript = "";
        const btn = document.getElementById('record-reading-btn');
        btn.innerHTML = '<i class="ri-stop-circle-line"></i> Dừng thu âm';
        btn.style.background = 'var(--danger)';
        btn.style.color = 'white';
        
        document.getElementById('reading-speech-feedback').classList.add('hidden');
        document.getElementById('speech-result-text').innerText = "Đang nghe...";
        document.getElementById('reading-speech-feedback').classList.remove('hidden');
        
        try {
            recognition.start();
        } catch(e) {
            console.error(e);
        }
    }

    function stopRecording() {
        isRecording = false;
        const btn = document.getElementById('record-reading-btn');
        btn.innerHTML = '<i class="ri-mic-line"></i> Bắt đầu thu âm';
        btn.style.background = 'rgba(239, 68, 68, 0.1)';
        btn.style.color = 'var(--danger)';
        
        if (recognition) {
            try {
                recognition.stop();
            } catch(e) {}
        }
    }

    function processSpeechResult(transcript) {
        const feedbackDiv = document.getElementById('reading-speech-feedback');
        const resultText = document.getElementById('speech-result-text');
        const accuracyText = document.getElementById('speech-accuracy');
        
        feedbackDiv.classList.remove('hidden');
        resultText.innerText = transcript || "Không nghe rõ.";
        
        if (!transcript) return;
        
        // Normalize strings for comparison (remove punctuation and spaces)
        const normalize = (str) => {
            return str.replace(/[.,!?，。！？；：'"、\s]/g, '');
        };
        
        const originalText = currentReading[currentReadingIndex].chinese;
        const normOriginal = normalize(originalText);
        const normTranscript = normalize(transcript);
        
        if (normOriginal === normTranscript || normOriginal.includes(normTranscript) && normTranscript.length > 3) {
            accuracyText.innerText = "Tuyệt vời! Phát âm của bạn rất chuẩn.";
            accuracyText.style.color = "var(--success)";
        } else {
            accuracyText.innerText = "Chưa khớp hoàn toàn. Hãy cố gắng hơn nhé!";
            accuracyText.style.color = "var(--danger)";
        }
    }

    document.getElementById('record-reading-btn').addEventListener('click', () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    // === 7. AI CHAT TAB ===
    const aiKeyContainer = document.getElementById('ai-key-container');
    const aiChatInterface = document.getElementById('ai-chat-interface');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const resetApiKeyBtn = document.getElementById('reset-api-key-btn');
    
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const attachImageBtn = document.getElementById('attach-image-btn');
    const chatFileInput = document.getElementById('chat-file-input');
    const chatImagePreview = document.getElementById('chat-image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image-btn');
    const chatMessages = document.getElementById('chat-messages');

    let currentBase64Image = null;
    let geminiApiKey = localStorage.getItem('hsk_gemini_api_key');

    // Init UI based on API key presence
    if (geminiApiKey) {
        aiKeyContainer.classList.add('hidden');
        aiChatInterface.classList.remove('hidden');
    }

    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key.startsWith('AIzaSy') && key.length > 30) {
            localStorage.setItem('hsk_gemini_api_key', key);
            geminiApiKey = key;
            apiKeyInput.value = '';
            aiKeyContainer.classList.add('hidden');
            aiChatInterface.classList.remove('hidden');
        } else {
            alert('API Key không hợp lệ. Khóa API của Gemini thường bắt đầu bằng AIzaSy...');
        }
    });

    resetApiKeyBtn.addEventListener('click', () => {
        if (confirm('Bạn muốn đổi API Key khác? Lịch sử chat hiện tại sẽ bị xóa.')) {
            localStorage.removeItem('hsk_gemini_api_key');
            geminiApiKey = null;
            chatMessages.innerHTML = `
                <div class="chat-message ai">
                    <div class="chat-avatar"><i class="ri-robot-2-fill"></i></div>
                    <div class="chat-bubble">Chào bạn! Hãy tải lên một bức ảnh và nói điều gì đó, chúng ta sẽ luyện tập tiếng Trung cùng nhau nhé! 😊</div>
                </div>
            `;
            aiChatInterface.classList.add('hidden');
            aiKeyContainer.classList.remove('hidden');
        }
    });

    // Handle Image Upload
    attachImageBtn.addEventListener('click', () => {
        chatFileInput.click();
    });

    chatFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentBase64Image = event.target.result;
                previewImg.src = currentBase64Image;
                chatImagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn.addEventListener('click', () => {
        currentBase64Image = null;
        chatFileInput.value = '';
        chatImagePreview.classList.add('hidden');
    });

    // Auto resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = '48px';
        this.style.height = (this.scrollHeight) + 'px';
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatBtn.click();
        }
    });

    function cleanForSpeech(text) {
        // Remove text in parentheses (Pinyin)
        let cleaned = text.replace(/\([^)]*\)/g, '').replace(/（[^）]*）/g, '');
        // Remove Vietnamese translation (everything after a dash on each line)
        cleaned = cleaned.replace(/\s*[-—]\s*.*/g, '');
        return cleaned.trim();
    }

    function appendMessage(role, text, imageBase64 = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${role}`;
        
        let avatarIcon = role === 'ai' ? '<i class="ri-robot-2-fill"></i>' : '<i class="ri-user-smile-line"></i>';
        
        let bubbleContentHtml = ``;
        let formattedText = text.replace(/\n/g, '<br>');
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Bold
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<i>$1</i>'); // Italic

        bubbleContentHtml += formattedText;
        
        if (imageBase64) {
            bubbleContentHtml += `<img src="${imageBase64}" alt="User Image">`;
        }
        
        let contentHtml = `<div class="chat-avatar">${avatarIcon}</div>
                           <div style="display: flex; flex-direction: column;">
                               <div class="chat-bubble">${bubbleContentHtml}</div>`;
        
        if (role === 'ai') {
            contentHtml += `<div class="chat-bubble-actions">
                                <button class="chat-audio-btn" title="Nghe lại"><i class="ri-volume-up-fill"></i></button>
                            </div>`;
        }
        
        contentHtml += `</div>`;
        msgDiv.innerHTML = contentHtml;
        
        if (role === 'ai') {
            const btn = msgDiv.querySelector('.chat-audio-btn');
            btn.addEventListener('click', () => {
                speak(cleanForSpeech(text));
            });
        }

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    function showTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ai typing-indicator-msg`;
        msgDiv.innerHTML = `
            <div class="chat-avatar"><i class="ri-robot-2-fill"></i></div>
            <div class="chat-bubble typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    // --- AI Chat Speech Recognition ---
    const recordChatBtn = document.getElementById('record-chat-btn');
    let aiChatRecognition = null;
    let aiChatIsRecording = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        aiChatRecognition = new SpeechRecognition();
        aiChatRecognition.lang = 'zh-CN';
        aiChatRecognition.continuous = false;
        aiChatRecognition.interimResults = false;
        
        aiChatRecognition.onstart = () => {
            aiChatIsRecording = true;
            recordChatBtn.classList.add('recording');
            chatInput.placeholder = "Đang nghe... Hãy nói tiếng Trung!";
        };
        
        aiChatRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
        };
        
        aiChatRecognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            chatInput.placeholder = "Lỗi thu âm. Nhấn Micro để thử lại.";
        };
        
        aiChatRecognition.onend = () => {
            aiChatIsRecording = false;
            recordChatBtn.classList.remove('recording');
            chatInput.placeholder = "Nhấn nút Micro để nói...";
            
            // Auto send if there's text
            if (chatInput.value.trim().length > 0) {
                sendChatBtn.click();
            }
        };
    }

    if(recordChatBtn) {
        recordChatBtn.addEventListener('click', () => {
            if (!aiChatRecognition) {
                alert('Trình duyệt không hỗ trợ nhận diện giọng nói. Bạn có thể gõ chữ.');
                return;
            }
            if (aiChatIsRecording) {
                aiChatRecognition.stop();
            } else {
                chatInput.value = '';
                try {
                    aiChatRecognition.start();
                } catch(e) {}
            }
        });
    }

    async function generateAIResponse(userText, imageBase64) {
        if (!geminiApiKey) return;
        
        const hskLevel = document.getElementById('hsk-level-selector').value;
        const systemInstruction = `Bạn là một gia sư tiếng Trung thân thiện và nhiệt tình. Bạn đang giúp học viên luyện tập tiếng Trung thông qua hình ảnh. Trình độ hiện tại của học viên là HSK ${hskLevel}. Nhiệm vụ của bạn: 1. Thảo luận về bức ảnh học viên gửi bằng tiếng Trung. 2. Đặt các câu hỏi đơn giản để khuyến khích học viên trả lời. 3. TUYỆT ĐỐI GIỚI HẠN từ vựng và ngữ pháp ở mức HSK ${hskLevel}. Không dùng từ vựng khó, nếu bắt buộc phải dùng để mô tả bức ảnh thì hãy giải thích nghĩa của nó. 4. Luôn cung cấp Pinyin cho các chữ Hán bạn dùng. Định dạng: Chữ Hán (Pinyin) - Nghĩa tiếng Việt. 5. Phản hồi ngắn gọn, tự nhiên như giao tiếp hàng ngày.`;

        let contents = [];
        let parts = [{ text: userText }];
        
        if (imageBase64) {
            const base64Data = imageBase64.split(',')[1];
            const mimeType = imageBase64.split(';')[0].split(':')[1];
            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                }
            });
        }
        
        contents.push({ parts: parts });

        const requestBody = {
            system_instruction: {
                parts: [{ text: systemInstruction }]
            },
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
            }
        };

        let retries = 3;
        while (retries > 0) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();
                
                if (data.error) {
                    if ((data.error.code === 503 || data.error.message.includes('high demand')) && retries > 1) {
                        // High demand, wait and retry
                        await new Promise(r => setTimeout(r, 2000));
                        retries--;
                        continue;
                    }
                    throw new Error(data.error.message);
                }
                
                return data.candidates[0].content.parts[0].text;
                
            } catch (error) {
                console.error('Gemini API Error:', error);
                if (retries > 1 && (error.message.includes('high demand') || error.message.includes('503'))) {
                    await new Promise(r => setTimeout(r, 2000));
                    retries--;
                    continue;
                }
                
                if (error.message.includes('high demand') || error.message.includes('503')) {
                    return `Hệ thống AI của Google hiện đang bị quá tải (Lỗi 503). Hệ thống đã tự động thử lại 3 lần nhưng chưa được. Bạn vui lòng đợi một chút và thử lại nhé!`;
                }
                return `Xin lỗi, đã có lỗi xảy ra khi gọi API: ${error.message}`;
            }
        }
    }

    sendChatBtn.addEventListener('click', async () => {
        const text = chatInput.value.trim();
        if (!text && !currentBase64Image) return;

        const imageToSend = currentBase64Image;
        
        appendMessage('user', text, imageToSend);
        
        chatInput.value = '';
        chatInput.style.height = '48px';
        removeImageBtn.click();
        
        const typingIndicator = showTypingIndicator();
        sendChatBtn.disabled = true;
        chatInput.disabled = true;
        attachImageBtn.disabled = true;
        if(recordChatBtn) recordChatBtn.disabled = true;
        
        const aiResponseText = await generateAIResponse(text || "Vui lòng mô tả bức ảnh này bằng tiếng Trung.", imageToSend);
        
        typingIndicator.remove();
        sendChatBtn.disabled = false;
        chatInput.disabled = false;
        attachImageBtn.disabled = false;
        if(recordChatBtn) recordChatBtn.disabled = false;
        chatInput.focus();
        
        appendMessage('ai', aiResponseText);
        
        // Auto read the response out loud
        speak(cleanForSpeech(aiResponseText));
    });

});
