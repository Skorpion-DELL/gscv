/**
 * Gregor Skrzeszewski - Projekt Traum Blog
 * Interactive 3D Book Engine (Vanilla JS) with Full Comments, Likes & Dynamic Entries
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE VARIABLES ---
    let posts = [];
    let currentFlipped = 0;
    let totalLeaves = 0;
    const transitionDuration = 800; 
    let isTransitioning = false;
    
    // User local like tracking
    let userLikes = new Set();
    try {
        const storedLikes = localStorage.getItem('blog_user_likes');
        if (storedLikes) {
            userLikes = new Set(JSON.parse(storedLikes));
        }
    } catch (e) { }

    // Track which post comments sections are currently expanded
    const expandedComments = new Set();

    // --- DOM ELEMENTS ---
    const book = document.getElementById('book');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentPageIndicator = document.getElementById('currentPage');
    const totalPagesIndicator = document.getElementById('totalPages');
    const bookContainer = document.querySelector('.book-container');

    const PHP_API = 'save_post.php';

    // --- DATA FETCHING ---
    async function fetchPosts() {
        let loadedPosts = [];
        try {
            const response = await fetch(PHP_API + '?action=get_posts&t=' + Date.now());
            if (response.ok) {
                const result = await response.json();
                if (result.success && Array.isArray(result.posts)) {
                    loadedPosts = result.posts;
                }
            }
        } catch (e) {
            console.warn('API fetch failed, trying static posts.json fallback:', e);
            try {
                const fbRes = await fetch('posts.json?t=' + Date.now());
                if (fbRes.ok) loadedPosts = await fbRes.json();
            } catch (err) { }
        }

        // Merge with local fallback if server was unreachable
        if (loadedPosts.length === 0) {
            try {
                const localData = localStorage.getItem('blog_posts');
                if (localData) loadedPosts = JSON.parse(localData);
            } catch (e) { }
        }

        posts = loadedPosts;
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

    function flipToLeaf(targetIndex) {
        if (targetIndex < 0 || targetIndex > totalLeaves) return;
        const leaves = Array.from(document.querySelectorAll('.leaf'));
        
        while (currentFlipped < targetIndex && currentFlipped < totalLeaves) {
            leaves[currentFlipped].classList.add('flipped');
            currentFlipped++;
        }
        while (currentFlipped > targetIndex && currentFlipped > 0) {
            currentFlipped--;
            leaves[currentFlipped].classList.remove('flipped');
        }
        updateZIndexes();
        updateUI();
    }

    // Navigation Controls
    prevBtn.addEventListener('click', flipPrev);
    nextBtn.addEventListener('click', flipNext);
    
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (e.key === 'ArrowRight') flipNext();
        else if (e.key === 'ArrowLeft') flipPrev();
    });

    // --- HTML RENDERERS ---

    function renderComposerHTML() {
        return `
            <div class="fb-create-post" style="width: 100%; margin-top: 10px;">
                <div class="create-header">
                    <div class="avatar"><img src="img/logo_projekt_hd_transparent.png" alt="Logo"></div>
                    <span style="font-weight:600; color:var(--navy-medium);">Neuen Eintrag verfassen...</span>
                </div>
                <input type="text" class="new-post-author comment-input" placeholder="Dein Name / Nickname (z. B. Gregor)">
                <textarea class="new-post-content comment-textarea" placeholder="Teile deine Gedanken, Projekte, Fragen oder Ideen..." rows="3"></textarea>
                <button type="button" class="submit-btn submit-post-trigger">Veröffentlichen</button>
            </div>
        `;
    }

    function renderPostHTML(post) {
        const author = post.author || 'Anonymer Gast';
        const likes = post.likes || 0;
        const isLiked = userLikes.has(post.id);
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const isCommentsOpen = expandedComments.has(post.id);

        let commentsHTML = '';
        comments.forEach(c => {
            commentsHTML += `
                <div class="comment-bubble">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHTML(c.author || 'Gast')}</span>
                        <span class="comment-date">${c.date || ''}</span>
                    </div>
                    <div class="comment-text">${c.text}</div>
                </div>
            `;
        });

        return `
            <div class="fb-post" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="avatar"><img src="img/logo_projekt_hd_transparent.png" alt="Logo"></div>
                    <div class="user-info">
                        <span class="user-name">${escapeHTML(author)}</span>
                        <span class="post-time">${post.date || ''}</span>
                    </div>
                </div>
                <div class="post-content">
                    ${post.content}
                </div>
                <div class="post-stats">
                    <span class="like-counter"><i class="fas fa-thumbs-up"></i> <span class="like-number">${likes}</span></span>
                    <span class="comment-counter"><span class="comment-number">${comments.length}</span> Kommentare</span>
                </div>
                <div class="post-actions">
                    <div class="action-group">
                        <button type="button" class="action-btn like ${isLiked ? 'liked' : ''}" data-post-id="${post.id}" title="Gefällt mir!">
                            <i class="fas fa-thumbs-up"></i> <span>Gefällt mir</span>
                        </button>
                        <button type="button" class="action-btn comment toggle-comments-btn" data-post-id="${post.id}" title="Kommentieren">
                            <i class="fas fa-comment"></i> <span>Kommentieren</span>
                        </button>
                    </div>
                    <div class="action-group">
                        <button type="button" class="action-btn delete delete-post-btn" data-post-id="${post.id}" title="Beitrag löschen">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="comments-section" style="${isCommentsOpen ? 'display: flex;' : 'display: none;'}">
                    <div class="comments-list">
                        ${commentsHTML.length > 0 ? commentsHTML : '<p style="font-size:10px; color:var(--text-muted); font-style:italic; margin:4px 0;">Noch keine Kommentare. Schreibe den ersten!</p>'}
                    </div>
                    <div class="add-comment-box">
                        <input type="text" class="comment-author-input" placeholder="Dein Name / Nickname" maxlength="50">
                        <textarea class="comment-text-input" placeholder="Schreibe einen Kommentar..." rows="2"></textarea>
                        <button type="button" class="comment-submit-btn" data-post-id="${post.id}">Antworten</button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- RENDER 3D BOOK ---
    function renderBook() {
        const existingDynamic = document.querySelectorAll('.dynamic-leaf');
        existingDynamic.forEach(l => l.remove());

        const leaf4 = document.getElementById('leaf4');
        const dynamicSidesHTML = [];

        if (posts.length === 0) {
            // Keine Beiträge: Zeige direkt das Erstellungsformular
            dynamicSidesHTML.push(`
                <div class="page-side front">
                    <div class="page-content" style="justify-content: flex-start;">
                        <div class="dot-grid gold top-right-dots"></div>
                        <h3 class="serif-title" style="font-size: 20px; margin-bottom: 8px; color: var(--navy-medium);">Gästebuch & Blog</h3>
                        <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">Sei der Erste, der einen Beitrag in diesem Buch hinterlässt!</p>
                        ${renderComposerHTML()}
                    </div>
                </div>
            `);
        } else {
            // 1. Erste dynamische Seite (Page 3 / Leaf 2 Front):
            // Zeigt den NEUESTEN Beitrag + DIREKT DARUNTER das Formular für den nächsten Eintrag!
            let firstPageHTML = `
                <div class="page-side front">
                    <div class="page-content" style="justify-content: flex-start;">
                        <div class="dot-grid gold top-right-dots"></div>
                        <h3 class="serif-title" style="font-size: 18px; margin-bottom: 10px; color: var(--navy-medium);">Aktueller Eintrag</h3>
                        ${renderPostHTML(posts[0])}
                        ${renderComposerHTML()}
                    </div>
                </div>
            `;
            dynamicSidesHTML.push(firstPageHTML);

            // 2. Ältere Beiträge (posts[1], posts[2], ...) verteilen sich auf die folgenden Seiten
            for (let i = 1; i < posts.length; i++) {
                const isFront = (dynamicSidesHTML.length % 2 === 0);
                const sideClass = isFront ? 'front' : 'back';
                const dotClass = isFront ? 'dot-grid gold top-right-dots' : 'dot-grid gray bottom-left-dots';

                let sideHTML = `
                    <div class="page-side ${sideClass}">
                        <div class="page-content" style="justify-content: flex-start;">
                            <div class="${dotClass}"></div>
                            <h4 class="section-subtitle" style="margin-bottom: 8px;">EINTRAG #${posts.length - i}</h4>
                            ${renderPostHTML(posts[i])}
                        </div>
                    </div>
                `;
                dynamicSidesHTML.push(sideHTML);
            }
        }

        // Falls die Anzahl dynamischer Seiten ungerade ist, schließe das Blatt mit einer eleganten Abschlussseite
        if (dynamicSidesHTML.length % 2 !== 0) {
            dynamicSidesHTML.push(`
                <div class="page-side back empty-page">
                    <div class="page-content" style="justify-content: center; align-items: center; text-align: center;">
                        <div class="dot-grid gray top-left-dots"></div>
                        <img src="img/logo_projekt_hd_transparent.png" alt="Logo" style="width: 70px; height: auto; opacity: 0.8; margin-bottom: 12px;">
                        <p style="font-family: var(--serif-font); font-style: italic; font-size: 14px; color: var(--navy-medium); margin-bottom: 6px;">Projekt Traum</p>
                        <p style="font-size: 10px; color: var(--text-muted);">Fachkompetenz im Innenausbau &bull; Bonn</p>
                    </div>
                </div>
            `);
        }

        // Dynamische Blätter erstellen und einfügen
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

        if (leaf4) {
            leaf4.insertAdjacentHTML('beforebegin', leavesHTML);
        }

        const allLeaves = document.querySelectorAll('.leaf');
        totalLeaves = allLeaves.length;
        totalPagesIndicator.textContent = totalLeaves * 2;

        updateZIndexes();
        updateUI();
    }

    // --- EVENT DELEGATION ON BOOK ---
    book.addEventListener('click', (e) => {
        // Ignoriere Klicks auf Formulare, Buttons, Links
        if (e.target.closest('button, input, textarea, a, .fb-create-post, .add-comment-box')) {
            return;
        }
        
        const leaf = e.target.closest('.leaf');
        if (!leaf) return;
        
        if (leaf.classList.contains('active-next')) {
            flipNext();
        } else if (leaf.classList.contains('active-prev')) {
            flipPrev();
        }
    });

    book.addEventListener('click', async (e) => {
        // A) NEUEN BEITRAG VERÖFFENTLICHEN
        const submitPostBtn = e.target.closest('.submit-post-trigger');
        if (submitPostBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const postBox = submitPostBtn.closest('.fb-create-post');
            const authorInput = postBox ? postBox.querySelector('.new-post-author') : null;
            const contentInput = postBox ? postBox.querySelector('.new-post-content') : null;
            
            const author = authorInput ? authorInput.value.trim() : 'Anonymer Gast';
            const content = contentInput ? contentInput.value.trim() : '';

            if (!content) {
                alert('Bitte schreiben Sie einen Inhalt für den Eintrag!');
                if (contentInput) contentInput.focus();
                return;
            }

            submitPostBtn.disabled = true;
            submitPostBtn.textContent = 'Veröffentlichen...';

            await handleSavePost(author || 'Anonymer Gast', content, authorInput, contentInput, submitPostBtn);
            return;
        }

        // B) GEFÄLLT MIR (LIKE)
        const likeBtn = e.target.closest('.action-btn.like');
        if (likeBtn) {
            e.preventDefault();
            e.stopPropagation();
            const postId = parseFloat(likeBtn.getAttribute('data-post-id'));
            await handleToggleLike(postId, likeBtn);
            return;
        }

        // C) KOMMENTARLEISTE ÖFFNEN / SCHLIESSEN
        const commentBtn = e.target.closest('.toggle-comments-btn');
        if (commentBtn) {
            e.preventDefault();
            e.stopPropagation();
            const postId = parseFloat(commentBtn.getAttribute('data-post-id'));
            const postElement = commentBtn.closest('.fb-post');
            const commentsSection = postElement ? postElement.querySelector('.comments-section') : null;
            
            if (commentsSection) {
                if (expandedComments.has(postId)) {
                    expandedComments.delete(postId);
                    commentsSection.style.display = 'none';
                } else {
                    expandedComments.add(postId);
                    commentsSection.style.display = 'flex';
                    const input = commentsSection.querySelector('.comment-text-input');
                    if (input) input.focus();
                }
            }
            return;
        }

        // D) KOMMENTAR ABSCHICKEN
        const submitCommentBtn = e.target.closest('.comment-submit-btn');
        if (submitCommentBtn) {
            e.preventDefault();
            e.stopPropagation();
            const postId = parseFloat(submitCommentBtn.getAttribute('data-post-id'));
            const commentBox = submitCommentBtn.closest('.add-comment-box');
            const authorInput = commentBox ? commentBox.querySelector('.comment-author-input') : null;
            const textInput = commentBox ? commentBox.querySelector('.comment-text-input') : null;
            
            const author = authorInput ? authorInput.value.trim() : 'Gast';
            const text = textInput ? textInput.value.trim() : '';

            if (!text) {
                alert('Bitte geben Sie einen Kommentar-Text ein.');
                if (textInput) textInput.focus();
                return;
            }

            submitCommentBtn.disabled = true;
            submitCommentBtn.textContent = '...';

            await handleAddComment(postId, author || 'Gast', text, authorInput, textInput, submitCommentBtn);
            return;
        }

        // E) BEITRAG LÖSCHEN
        const deleteBtn = e.target.closest('.delete-post-btn');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const postId = parseFloat(deleteBtn.getAttribute('data-post-id'));
            await handleDeletePost(postId);
            return;
        }
    });

    // --- ACTION HANDLERS ---

    // 1. SAVE POST
    async function handleSavePost(author, content, authorInput, contentInput, submitBtn) {
        let savedPost = null;

        try {
            const response = await fetch(PHP_API + '?action=add_post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, content })
            });
            const result = await response.json();
            if (result.success && result.post) {
                savedPost = result.post;
            }
        } catch (e) {
            console.warn('Server post failed:', e);
        }

        if (!savedPost) {
            savedPost = {
                id: Date.now(),
                title: 'Blogbeitrag',
                author: escapeHTML(author),
                content: escapeHTML(content).replace(/\n/g, '<br>'),
                date: getFormattedDate(),
                likes: 0,
                comments: []
            };
            try {
                const localData = localStorage.getItem('blog_posts');
                const localPosts = localData ? JSON.parse(localData) : [];
                localPosts.unshift(savedPost);
                localStorage.setItem('blog_posts', JSON.stringify(localPosts));
            } catch (e) { }
        }

        posts.unshift(savedPost);

        // Felder sofort leeren
        if (authorInput) authorInput.value = '';
        if (contentInput) contentInput.value = '';
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Veröffentlichen';
        }

        // Buch rendern
        renderBook();

        // Zeige direkt die Seite mit dem neuen Beitrag und dem Formular darunter
        flipToLeaf(1);
    }

    // 2. TOGGLE LIKE
    async function handleToggleLike(postId, likeBtn) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const isCurrentlyLiked = userLikes.has(postId);
        const change = isCurrentlyLiked ? -1 : 1;

        if (isCurrentlyLiked) {
            userLikes.delete(postId);
            likeBtn.classList.remove('liked');
        } else {
            userLikes.add(postId);
            likeBtn.classList.add('liked');
        }

        try {
            localStorage.setItem('blog_user_likes', JSON.stringify(Array.from(userLikes)));
        } catch (e) { }

        // Optimistic UI update
        post.likes = Math.max(0, (post.likes || 0) + change);
        const postElement = likeBtn.closest('.fb-post');
        if (postElement) {
            const likeNumber = postElement.querySelector('.like-number');
            if (likeNumber) likeNumber.textContent = post.likes;
        }

        // Backend Sync
        try {
            await fetch(PHP_API + '?action=like_post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: postId, change })
            });
        } catch (e) { }
    }

    // 3. ADD COMMENT
    async function handleAddComment(postId, author, text, authorInput, textInput, submitBtn) {
        const post = posts.find(p => p.id === postId);
        let newComment = null;

        try {
            const response = await fetch(PHP_API + '?action=add_comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, author, text })
            });
            const result = await response.json();
            if (result.success && result.comment) {
                newComment = result.comment;
            }
        } catch (e) {
            console.warn('Server comment failed:', e);
        }

        if (!newComment) {
            newComment = {
                id: Date.now(),
                author: escapeHTML(author),
                text: escapeHTML(text).replace(/\n/g, '<br>'),
                date: getFormattedDate()
            };
        }

        if (post) {
            if (!Array.isArray(post.comments)) post.comments = [];
            post.comments.push(newComment);
        }

        if (textInput) textInput.value = '';
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Antworten';
        }

        // DOM inline aktualisieren
        const postElement = submitBtn.closest('.fb-post');
        if (postElement) {
            const commentsList = postElement.querySelector('.comments-list');
            const commentNumber = postElement.querySelector('.comment-number');
            
            if (commentNumber && post) {
                commentNumber.textContent = post.comments.length;
            }

            if (commentsList) {
                const placeholder = commentsList.querySelector('p');
                if (placeholder) placeholder.remove();

                const bubbleHTML = `
                    <div class="comment-bubble">
                        <div class="comment-header">
                            <span class="comment-author">${escapeHTML(newComment.author)}</span>
                            <span class="comment-date">${newComment.date}</span>
                        </div>
                        <div class="comment-text">${newComment.text}</div>
                    </div>
                `;
                commentsList.insertAdjacentHTML('beforeend', bubbleHTML);
                commentsList.scrollTop = commentsList.scrollHeight;
            }
        }
    }

    // 4. DELETE POST
    async function handleDeletePost(postId) {
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
        flipToLeaf(Math.min(oldFlipped, totalLeaves));
    }

    // --- INITIALIZATION ---
    fetchPosts();

    // --- HELPER FUNCTIONS ---
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
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

    function adjustScale() {
        const wrapper = document.querySelector('.book-scale-wrapper');
        if (!wrapper) return;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (windowWidth <= 990) {
            wrapper.style.transform = '';
            wrapper.style.transformOrigin = '';
            return;
        }
        
        const baseWidth = 960;
        const baseHeight = 720; 
        
        const targetWidth = windowWidth - 80;
        const targetHeight = windowHeight - 80;
        
        let scale = Math.min(targetWidth / baseWidth, targetHeight / baseHeight);
        scale = Math.max(0.55, Math.min(1.25, scale));
        
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.transformOrigin = 'center center';
    }

    window.addEventListener('resize', adjustScale);
    adjustScale();
});
