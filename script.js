// =========================================
// ПЕРЕВОРОТ КАРТОЧЕК (глобальная функция)
// =========================================
function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
    
    // Озвучиваем ТОЛЬКО если карточка находится в разделе #famous
    const isFamousSection = cardElement.closest('#famous') !== null;
    
    if (cardElement.classList.contains('flipped') && isFamousSection) {
        speakCard(cardElement);
    } else {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
}
// =========================================
// ОЗВУЧИВАНИЕ КАРТОЧКИ ЖЕНСКИМ ГОЛОСОМ
// =========================================
function speakCard(cardElement) {
    if (!('speechSynthesis' in window)) {
        console.warn('Ваш браузер не поддерживает озвучивание.');
        return;
    }

    // Останавливаем предыдущую речь
    window.speechSynthesis.cancel();

    // Находим текст на обратной стороне
    const backSide = cardElement.querySelector('.card-back');
    if (!backSide) return;

    const title = backSide.querySelector('h3')?.innerText || '';
    const text = backSide.querySelector('p')?.innerText || '';
    const fullText = `${title}. ${text}`;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;   // Чуть выше тональность (женственнее)
    utterance.volume = 1;

    // Ищем женский русский голос
    const voices = window.speechSynthesis.getVoices();
    
    // Список популярных женских имён в разных системах
    const femaleNames = [
        'Ирина', 'Irina', 'Irina (Russian)', 
        'Milena', 'Милена', 
        'Yuri', 'Google русский', 
        'Microsoft Irina', 'Microsoft Milena',
        'Anna', 'Анна', 'Alena', 'Алёна',
        'Katya', 'Катя', 'Tatiana', 'Татьяна'
    ];

    // Сначала ищем русский голос с женским именем
    let selectedVoice = voices.find(v => 
        v.lang.startsWith('ru') && 
        femaleNames.some(name => v.name.toLowerCase().includes(name.toLowerCase()))
    );

    // Если не нашли — ищем любой женский голос (эвристика: "female" в названии)
    if (!selectedVoice) {
        selectedVoice = voices.find(v => 
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('woman')
        );
    }

    // Если всё ещё нет — берём первый русский голос
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('ru'));
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Озвучиваем голосом:', selectedVoice.name);
    }

    window.speechSynthesis.speak(utterance);
}
document.addEventListener('DOMContentLoaded', () => {
     // Загружаем голоса заранее
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        // Некоторые браузеры требуют повторного вызова после события
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
    
    // 1. Плавная прокрутка
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 60,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. Анимация появления карточек
    const simpleCards = document.querySelectorAll('.stat-card, .modern-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    simpleCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s, transform 0.6s';
        observer.observe(card);
    });

    // 3. Анимация для таймлайна
    const historyItems = document.querySelectorAll('.history-item');
    const historyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                historyObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    historyItems.forEach(item => historyObserver.observe(item));

    // 4. Огонь на баннере
    const canvas = document.getElementById('fireCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let W, H;
        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            W = rect.width;
            H = rect.height;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resizeCanvas();
        window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

        class Flame {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * (W - 100) + 50;
                this.y = H - 10;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = -(Math.random() * 2 + 1);
                this.life = 1.0;
                this.decay = Math.random() * 0.006 + 0.004;
                this.size = Math.random() * 35 + 25;
            }
            update() {
                this.x += this.vx + Math.sin(this.y * 0.015 + this.x * 0.01) * 0.6;
                this.y += this.vy;
                this.life -= this.decay;
                this.size *= 0.988;
                if (this.life <= 0) this.reset();
            }
            draw() {
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                const alpha = Math.max(this.life, 0);
                gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
                gradient.addColorStop(0.3, `rgba(255, 200, 50, ${alpha * 0.9})`);
                gradient.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.7})`);
                gradient.addColorStop(1, `rgba(200, 20, 0, 0)`);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }

        class Spark {
            constructor() {
                this.x = Math.random() * W;
                this.y = H - 10 - Math.random() * 20;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -(Math.random() * 4 + 2);
                this.life = 1.0;
                this.size = Math.random() * 2.5 + 0.8;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.04;
                this.life -= 0.012;
            }
            draw() {
                if (this.life <= 0) return;
                const alpha = Math.max(this.life, 0);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 230, 120, ${alpha})`;
                ctx.shadowBlur = 12;
                ctx.shadowColor = 'orange';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        let flames = [], sparks = [];
        function initParticles() {
            flames = []; sparks = [];
            for (let i = 0; i < Math.floor(W / 12); i++) flames.push(new Flame());
        }
        initParticles();

        function animate() {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'lighter';
            flames.forEach(f => { f.update(); f.draw(); });
            if (Math.random() < 0.6) {
                for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) sparks.push(new Spark());
            }
            for (let i = sparks.length - 1; i >= 0; i--) {
                sparks[i].update(); sparks[i].draw();
                if (sparks[i].life <= 0 || sparks[i].y < -20) sparks.splice(i, 1);
            }
            requestAnimationFrame(animate);
        }
        animate();
    }

    // 5. Для мобильных устройств (переворот по клику, если нет hover)
    const flipCards = document.querySelectorAll('.flip-card');
    const hasHover = window.matchMedia('(hover: hover)').matches;
    if (!hasHover) {
        flipCards.forEach(card => {
            card.addEventListener('click', () => card.classList.toggle('flipped'));
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================
    // 1. ПЛАВНАЯ ПРОКРУТКА ДЛЯ НАВИГАЦИИ
    // =========================================
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 60,
                    behavior: 'smooth'
                });
            }
        });
    });

    // =========================================
    // 2. АНИМАЦИЯ ПОЯВЛЕНИЯ КАРТОЧЕК
    // =========================================
    // Для обычных карточек (card, stat-card, modern-card)
    const simpleCards = document.querySelectorAll('.card, .stat-card, .modern-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    simpleCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(card);
    });

    // =========================================
    // 3. АНИМАЦИЯ ДЛЯ ИСТОРИЧЕСКОГО ТАЙМЛАЙНА
    // =========================================
    // Используем отдельный observer с классом .visible (как в CSS)
    const historyItems = document.querySelectorAll('.history-item');
    const historyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                historyObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    historyItems.forEach(item => historyObserver.observe(item));

    // =========================================
    // 4. ОГОНЬ НА ВСЮ ШИРИНУ БАННЕРА
    // =========================================
    const canvas = document.getElementById('fireCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        let W, H;

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            W = rect.width;
            H = rect.height;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resizeCanvas();
        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        // --- Класс Пламени ---
        class Flame {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * (W - 100) + 50;
                this.y = H - 10;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = -(Math.random() * 2 + 1);
                this.life = 1.0;
                this.decay = Math.random() * 0.006 + 0.004;
                this.size = Math.random() * 35 + 25;
            }
            update() {
                this.x += this.vx + Math.sin(this.y * 0.015 + this.x * 0.01) * 0.6;
                this.y += this.vy;
                this.life -= this.decay;
                this.size *= 0.988;
                if (this.life <= 0) this.reset();
            }
            draw() {
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size
                );
                const alpha = Math.max(this.life, 0);
                gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
                gradient.addColorStop(0.3, `rgba(255, 200, 50, ${alpha * 0.9})`);
                gradient.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.7})`);
                gradient.addColorStop(1, `rgba(200, 20, 0, 0)`);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }

        // --- Класс Искры ---
        class Spark {
            constructor() {
                this.x = Math.random() * W;
                this.y = H - 10 - Math.random() * 20;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -(Math.random() * 4 + 2);
                this.life = 1.0;
                this.size = Math.random() * 2.5 + 0.8;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.04;
                this.life -= 0.012;
            }
            draw() {
                if (this.life <= 0) return;
                const alpha = Math.max(this.life, 0);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 230, 120, ${alpha})`;
                ctx.shadowBlur = 12;
                ctx.shadowColor = 'orange';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        let flames = [];
        let sparks = [];

        function initParticles() {
            flames = [];
            sparks = [];
            const flameCount = Math.floor(W / 12);
            for (let i = 0; i < flameCount; i++) {
                flames.push(new Flame());
            }
        }
        initParticles();

        // --- Анимация ---
        function animate() {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.fillRect(0, 0, W, H);

            ctx.globalCompositeOperation = 'lighter';

            flames.forEach(flame => {
                flame.update();
                flame.draw();
            });

            if (Math.random() < 0.6) {
                const count = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < count; i++) {
                    sparks.push(new Spark());
                }
            }

            for (let i = sparks.length - 1; i >= 0; i--) {
                const spark = sparks[i];
                spark.update();
                spark.draw();
                if (spark.life <= 0 || spark.y < -20) {
                    sparks.splice(i, 1);
                }
            }

            requestAnimationFrame(animate);
        }
        animate();
    }

    // =========================================
    // 5. ПЕРЕВОРОТ КАРТОЧЕК ПО КЛИКУ (мобильные)
    // =========================================
    const flipCards = document.querySelectorAll('.flip-card');
    const hasHover = window.matchMedia('(hover: hover)').matches;

    // Переворот по клику работает только там, где нет hover (мобильные)
    if (!hasHover) {
        flipCards.forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });
        });
    }
    // Озвучка карточек в разделе "Женщины, прославившие Беларусь"
// Озвучка карточек в разделе "Женщины, прославившие Беларусь"
const historyCards = document.querySelectorAll('#famous .history-content');
historyCards.forEach(card => {
    card.style.cursor = 'pointer';
    
    card.addEventListener('click', () => {
        // Снимаем подсветку со всех карточек
        historyCards.forEach(c => c.classList.remove('speaking'));

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            return;
        }
        
        card.classList.add('speaking'); // Включаем подсветку
        speakHistoryCard(card);
    });
});
// Словарь для правильного произношения фамилий и имен
const pronunciationDict = {
    'Евфросиния': 'Евфрóсиния',
    'Полоцкая': 'Полóцкая',
    'Анастасия': 'Анастáсия',
    'Слуцкая': 'Слýцкая',
    'Франциска': 'ФранцИска',
    'Урсула': 'Урсýла',
    'Радзивилл': 'РадзивИлл',
    'Алоиза': 'АлоИза',
    'Пашкевич': 'ПашкЕвич',
    'Стефания': 'Стефáния',
    'Станюта': 'СтанЮта',
    'Дарья': 'Дáрья',
    'Домрачева': 'ДомрАчева',
    'Марина': 'МарИна',
    'Василевская': 'ВасилЕвская',
    'Карпинская': 'КарпИнская',
    'Туснолобова': 'ТуснолОбова',
    'Октябрьская': 'Октябрьская', // тут можно оставить (октябрь)
    'Портнова': 'ПортнОва',
    'Мазаник': 'МазАник',
    'Осипова': 'Осипова', // тут можно оставить
    'Троян': 'Троян', // тут можно оставить
    'Зенькова': 'ЗенькОва',
    'Хоружая': 'Хорýжая',
    'Буданова': 'БудАнова',
    'Руднева': 'Рýднева',
    'Литвяк': 'ЛитвЯк',
    'Зеленко': 'ЗелЕнко',
    'Раскова': 'РаскОва'
};
function applyAccents(text) {
    let result = text;
    // Проходим по словарю и заменяем обычные слова на версии с ударением
    for (const [key, value] of Object.entries(pronunciationDict)) {
        // Используем регулярное выражение с флагом 'g' (глобально) и 'i' (без учета регистра)
        const regex = new RegExp('\\b' + key + '\\b', 'gi');
        result = result.replace(regex, value);
    }
    return result;
}
// Функция для переворота карточки
function speakHistoryCard(cardElement) {
    if (!('speechSynthesis' in window)) {
        console.warn('Ваш браузер не поддерживает озвучивание.');
        return;
    }

    window.speechSynthesis.cancel();

    const title = cardElement.querySelector('h3')?.innerText || '';
    const role = cardElement.querySelector('.role')?.innerText || '';
    const text = cardElement.querySelector('p:not(.role)')?.innerText || '';
   let fullText = `${title}. ${role}. ${text}`;
// Применяем правильные ударения
fullText = applyAccents(fullText);

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        setTimeout(() => speakHistoryCard(cardElement), 500);
        return;
    }

    let selectedVoice = voices.find(v => v.lang.startsWith('ru'));
    if (selectedVoice) {
        const female = voices.find(v => 
            v.lang.startsWith('ru') && 
            /ирина|irina|milena|милена|alena|алёна|anna|анна|katya|катя|tatiana|татьяна|google/i.test(v.name)
        );
        if (female) selectedVoice = female;
        utterance.voice = selectedVoice;
    }

    console.log('Озвучиваем:', selectedVoice?.name || 'по умолчанию');
    window.speechSynthesis.speak(utterance);
    utterance.onend = () => {
    document.querySelectorAll('.history-content.speaking').forEach(c => c.classList.remove('speaking'));
};
}
}); // ← Правильное закрытие