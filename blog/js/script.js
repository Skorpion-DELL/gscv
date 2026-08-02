/**
 * Gregor Skrzeszewski - Projekt Traum Blog
 * Interactive 3D Book Engine (Vanilla JS) with Hybrid Storage
 */

window.onerror = function(msg, url, lineNo, columnNo, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;background:red;color:white;z-index:99999;padding:20px;width:100%;font-size:16px;';
    errorDiv.innerHTML = `JS-FEHLER: ${msg} <br>Zeile: ${lineNo}`;
    document.body.appendChild(errorDiv);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE VARIABLES ---
    let posts = [];
    let currentFlipped = 0;
    let totalLeaves = 0;
    const transitionDuration = 800; 
    let isTransitioning = false;
    
    // --- DOM ELEMENTS ---
    const book = document.getElementById('book');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentPageIndicator = document.getElementById('currentPage');
    const totalPagesIndicator = document.getElementById('totalPages');
    const bookContainer = document.querySelector('.book-container');

    // --- STORAGE ADAPTER (HYBRID STORAGE) ---
    const PHP_API = 'save_post.php';

    async function fetchPosts() {
        let serverPosts = [];
        let localPosts = [];
        
        try {
            const response = await fetch('posts.json?t=' + Date.now());
            if (response.ok) {
                serverPosts = await response.json();
            }
        } catch (e) {
            console.warn('Server posts fetch failed:', e);
        }

        try {
            const localData = localStorage.getItem('blog_posts');
            if (localData) {
                localPosts = JSON.parse(localData);
            }
        } catch (e) {
            console.error('Failed to parse local posts:', e);
        }

        const allPosts = [...localPosts, ...serverPosts];
        const uniquePostsMap = new Map();
        allPosts.forEach(post => {
            if (!uniquePostsMap.has(post.id)) {
                uniquePostsMap.set(post.id, post);
            }
        });

        posts = Array.from(uniquePostsMap.values()).sort((a, b) => b.id - a.id);
        
        // Renderujemy po pobraniu!
        renderBook();
    }

    // --- 3D BOOK ENGINE MECHANICS ---
    function updateZIndexes() {
        const leaves = Array.from(document.querySelectorAll('.leaf'));
        leaves.forEach((leaf, index) => {
            leaf.classList.remove('active-next', 'active-prev');
            if (index < currentFlipped) {
                leaf.style.zIndex = index + 1;
            } else {
                leaf.style.zIndex = totalLeaves - index;
            }
        });
        
        if (currentFlipped < totalLeaves) {
            leaves[currentFlipped].classList.add('active-next');
        }
        if (currentFlipped > 0) {
            leaves[currentFlipped - 1].classList.add('active-prev');
        }
    }
    
    function updateUI() {
        const leaves = Array.from(document.querySelectorAll('.leaf'));
        if (currentFlipped === 0) {
            currentPageIndicator.textContent = "1";
            bookContainer.classList.add('closed-front');
            bookContainer.classList.remove('closed-back');
        } else if (currentFlipped === totalLeaves) {
            currentPageIndicator.textContent = totalLeaves * 2;
            bookContainer.classList.add('closed-back');
            bookContainer.classList.remove('closed-front');
        } else {
            const pageNumStart = currentFlipped * 2;
            const pageNumEnd = pageNumStart + 1;
            currentPageIndicator.textContent = `${pageNumStart}-${pageNumEnd}`;
            bookContainer.classList.remove('closed-front', 'closed-back');
        }
        
        prevBtn.disabled = (currentFlipped === 0);
        nextBtn.disabled = (currentFlipped === totalLeaves);
    }
    
    function flipNext() {
        if (isTransitioning || currentFlipped >= totalLeaves) return;
        const leaves = Array.from(document.querySelectorAll('.leaf'));
        
        isTransitioning = true;
        const leafToFlip = leaves[currentFlipped];
        leafToFlip.style.zIndex = 100;
        leafToFlip.classList.add('flipped');
        currentFlipped++;
        
        updateUI();
        
        setTimeout(() => {
            updateZIndexes();
            isTransitioning = false;
        }, transitionDuration);
    }
    
    function flipPrev() {
        if (isTransitioning || currentFlipped <= 0) return;
        const leaves = Array.from(document.querySelectorAll('.leaf'));
        
        isTransitioning = true;
        currentFlipped--;
        const leafToUnflip = leaves[currentFlipped];
        leafToUnflip.style.zIndex = 100;
        leafToUnflip.classList.remove('flipped');
        
        updateUI();
        
        setTimeout(() => {
            updateZIndexes();
            isTransitioning = false;
        }, transitionDuration);
    }

    // Controls bindings
    prevBtn.addEventListener('click', flipPrev);
    nextBtn.addEventListener('click', flipNext);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') flipNext();
        else if (e.key === 'ArrowLeft') flipPrev();
    });

    // Handle clicking on pages
    book.addEventListener('click', (e) => {
        const leaf = e.target.closest('.leaf');
        if (!leaf) return;
        // Don't flip if clicking inside a form element or button
        if (['INPUT', 'TEXTAREA', 'BUTTON', 'I'].includes(e.target.tagName)) return;
        
        if (leaf.classList.contains('active-next')) {
            flipNext();
        } else if (leaf.classList.contains('active-prev')) {
            flipPrev();
        }
    });

    // --- RENDER BOOK ---
    function renderBook() {
        // Alte dynamische Seiten entfernen
        const existingDynamic = document.querySelectorAll('.dynamic-leaf');
        existingDynamic.forEach(l => l.remove());

        const leaf4 = document.getElementById('leaf4');
        const dynamicSidesHTML = [];

        // Seiten mit Beiträgen generieren
        for (let i = 0; i < posts.length; i += 2) {
            const chunk = posts.slice(i, i + 2);
            const isFront = (dynamicSidesHTML.length % 2 === 0);
            const sideClass = isFront ? 'front' : 'back';
            
            let sideHTML = `
                <div class="page-side ${sideClass}">
                    <div class="page-content" style="justify-content: flex-start;">
            `;
            
            if (isFront) sideHTML += '<div class="dot-grid gold top-right-dots"></div>';
            else sideHTML += '<div class="dot-grid gray bottom-left-dots"></div>';
            
            chunk.forEach(post => {
                const author = post.author || 'Anonym';
                sideHTML += `
                    <div class="fb-post">
                        <div class="post-header">
                            <div class="avatar"><img src="img/logo_gold_navy_transparent.png" alt="Logo"></div>
                            <div class="user-info">
                                <span class="user-name">${author}</span>
                                <span class="post-time">${post.date}</span>
                            </div>
                        </div>
                        <div class="post-content">
                            ${post.content}
                        </div>
                        <div class="post-stats">
                            <span><i class="fas fa-thumbs-up"></i> 0</span>
                            <span>${post.comments ? post.comments.length : 0} Kommentare</span>
                        </div>
                        <div class="post-actions">
                            <div class="action-group">
                                <button class="action-btn like" title="Gefällt mir!"><i class="fas fa-thumbs-up"></i></button>
                                <button class="action-btn comment" title="Kommentieren"><i class="fas fa-comment"></i></button>
                            </div>
                            <div class="action-group">
                                <button class="action-btn delete delete-post-btn" data-post-id="${post.id}" title="Beitrag löschen"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            });
            sideHTML += '</div></div>';
            dynamicSidesHTML.push(sideHTML);
        }

        // Wenn wir eine ungerade Anzahl an dynamischen Seiten haben, fügen wir eine leere Seite hinzu,
        // um das Blatt vor dem hinteren Umschlag zu schließen.
        if (dynamicSidesHTML.length % 2 !== 0) {
            dynamicSidesHTML.push(`
                <div class="page-side back empty-page">
                    <div class="page-content" style="justify-content: center; align-items: center; opacity: 0.5;">
                        <img src="img/logo_gold_navy_transparent.png" alt="Logo" style="width:100px; height:auto;">
                        <p style="margin-top:20px; font-style:italic;">Platz für weitere Beiträge...</p>
                    </div>
                </div>
            `);
        }

        // Dynamische Blätter erstellen
        const totalDynamicLeaves = dynamicSidesHTML.length / 2;
        let leavesHTML = '';
        
        for (let i = 0; i < totalDynamicLeaves; i++) {
            leavesHTML += `
                <div class="leaf dynamic-leaf">
                    ${dynamicSidesHTML[i * 2]}
                    ${dynamicSidesHTML[i * 2 + 1]}
                </div>
            `;
        }

        // Dynamische Seiten vor leaf4 (hinterer Umschlag) einfügen
        if (leaf4) {
            leaf4.insertAdjacentHTML('beforebegin', leavesHTML);
        }

        // UI aktualisieren
        const allLeaves = document.querySelectorAll('.leaf');
        totalLeaves = allLeaves.length; // Korrekte Anzahl aller Blätter
        totalPagesIndicator.textContent = totalLeaves * 2; // Jedes Blatt hat 2 Seiten

        // currentFlipped wird hier nicht zurückgesetzt, um bei neuen Beiträgen nicht zum Anfang zu springen,
        // aber das Layout wird aktualisiert.
        updateZIndexes();
        updateUI();
        bindEvents();
    }

    async function savePost(author, content) {
        const formData = new FormData();
        formData.append('title', 'Wpis z bloga');
        formData.append('content', content);
        
        let savedOnServer = false;
        let newPost = null;

        try {
            const response = await fetch(PHP_API + '?action=add_post', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                newPost = result.post;
                newPost.author = author;
                savedOnServer = true;
            }
        } catch (e) {
            console.warn('Server upload failed:', e);
        }

        if (!savedOnServer) {
            newPost = {
                id: Date.now(),
                title: 'Blogbeitrag',
                author: escapeHTML(author),
                content: escapeHTML(content).replace(/\n/g, '<br>'),
                image: null,
                date: getFormattedDate(),
                comments: []
            };

            const localData = localStorage.getItem('blog_posts');
            const localPosts = localData ? JSON.parse(localData) : [];
            localPosts.unshift(newPost);
            localStorage.setItem('blog_posts', JSON.stringify(localPosts));
        }

        posts.unshift(newPost);
        
        // Preserve flipped state if we were deep in the book?
        // Since we insert at the start, pages shift. Let's reset to first page.
        renderBook();
        
        if (currentFlipped === 0 && totalLeaves > 0) {
            setTimeout(flipNext, 200);
        }
    }

    async function deletePost(postId) {
        if (!confirm("Möchten Sie diesen Beitrag wirklich löschen?")) return;

        try {
            await fetch(PHP_API + '?action=delete_post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: postId })
            });
        } catch (e) { }

        try {
            const localData = localStorage.getItem('blog_posts');
            if (localData) {
                let localPosts = JSON.parse(localData);
                localPosts = localPosts.filter(p => p.id !== postId);
                localStorage.setItem('blog_posts', JSON.stringify(localPosts));
            }
        } catch (e) { }

        posts = posts.filter(p => p.id !== postId);
        
        const oldFlipped = currentFlipped;
        renderBook();
        
        while (currentFlipped < oldFlipped && currentFlipped < totalLeaves) {
            const leaves = Array.from(document.querySelectorAll('.leaf'));
            leaves[currentFlipped].classList.add('flipped');
            currentFlipped++;
        }
        updateZIndexes();
        updateUI();
    }

    function bindEvents() {
        const submitBtn = document.getElementById('submit-new-post-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', async function() {
                const authorInput = document.getElementById('new-post-author');
                const contentInput = document.getElementById('new-post-content');
                const author = authorInput.value.trim() || 'Anonymer Gast';
                const content = contentInput.value.trim();
                
                if (!content) {
                    alert('Bitte geben Sie einen Inhalt ein!');
                    return;
                }
                
                this.disabled = true;
                this.textContent = 'Veröffentlichen...';
                
                await savePost(author, content);
            });
        }

        document.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const postId = parseInt(this.getAttribute('data-post-id'));
                deletePost(postId);
            });
        });
    }

    // --- INITIALIZATION ---
    // fetchPosts(); // Dynamische Generierung temporär deaktiviert, um statisches HTML anzuzeigen
    
    // Initialisierung für statisches HTML
    totalLeaves = document.querySelectorAll('.leaf').length;
    currentFlipped = 0;
    totalPagesIndicator.textContent = totalLeaves * 2;
    updateZIndexes();
    updateUI();
    bindEvents();
    
    // --- HELPER FUNCTIONS ---
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getFormattedDate() {
        const d = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    // Dynamic scaling logic for responsive desktop presentation
    function adjustScale() {
        const wrapper = document.querySelector('.book-scale-wrapper');
        if (!wrapper) return;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // If mobile/tablet layout (width <= 990px), we don't scale (reset style)
        if (windowWidth <= 990) {
            wrapper.style.transform = '';
            wrapper.style.transformOrigin = '';
            return;
        }
        
        // Base dimensions of the book container
        const baseWidth = 960;
        // 600px book height + controls + padding
        const baseHeight = 720; 
        
        // We want a minimum margin of 40px on all sides (so 80px total padding)
        const targetWidth = windowWidth - 80;
        const targetHeight = windowHeight - 80;
        
        // Calculate the maximum scale factor that fits both width and height
        let scale = Math.min(targetWidth / baseWidth, targetHeight / baseHeight);
        
        // Limit scale between 0.55 and 1.25 (to keep design premium and readable)
        scale = Math.max(0.55, Math.min(1.25, scale));
        
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.transformOrigin = 'center center';
    }

    window.addEventListener('resize', adjustScale);
    adjustScale();
});
